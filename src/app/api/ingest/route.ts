import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireEnv } from '@/lib/env';
import { connectDb } from '@/lib/db';
import { Device } from '@/lib/models/Device';
import { Location } from '@/lib/models/Location';
import { Alert } from '@/lib/models/Alert';
import { isInsideGeofence, GEOFENCE } from '@/lib/geofence';
import { sendAlertEmail } from '@/lib/mailgun';
import { PushSubscriptionModel } from '@/lib/models/PushSubscription';
import { sendWebPush } from '@/lib/push';

const ingestSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  osVersion: z.string().optional(),

  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  battery: z.number().int().min(0).max(100).optional(),

  timestamp: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  let serverKey = '';
  try {
    serverKey = requireEnv('LOCUST_INGEST_API_KEY');
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Server not configured' },
      { status: 500 }
    );
  }

  const key = req.headers.get('x-api-key') ?? '';
  if (!key || key !== serverKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = ingestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const ts = body.timestamp ? new Date(body.timestamp) : new Date();

  try {
    await connectDb();
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Database not configured' },
      { status: 500 }
    );
  }

  const geofence = isInsideGeofence(body.latitude, body.longitude);

  const device = await Device.findOneAndUpdate(
    { deviceId: body.deviceId },
    {
      $setOnInsert: {
        registeredAt: new Date(),
        isActive: true,
      },
      $set: {
        deviceName: body.deviceName,
        manufacturer: body.manufacturer,
        model: body.model,
        osVersion: body.osVersion,
        lastSeen: ts,
      },
    },
    { upsert: true, new: true }
  );

  await Location.create({
    deviceId: body.deviceId,
    latitude: body.latitude,
    longitude: body.longitude,
    accuracy: body.accuracy,
    altitude: body.altitude,
    speed: body.speed,
    heading: body.heading,
    battery: body.battery,
    timestamp: ts,
    isInGeofence: geofence.inside,
    distanceFromCenterKm: geofence.distanceKm,
  });

  const cooldownMinutes = 30;
  const now = new Date();
  const lastAlertAt = device.lastAlertAt ? new Date(device.lastAlertAt) : null;
  const cooldownOk =
    !lastAlertAt || (now.getTime() - lastAlertAt.getTime()) / 60000 >= cooldownMinutes;

  const entered = geofence.inside && device.lastGeofenceInside !== true;

  let alertCreated = false;

  if (entered && cooldownOk) {
    const alert = await Alert.create({
      deviceId: body.deviceId,
      deviceName: body.deviceName,
      latitude: body.latitude,
      longitude: body.longitude,
      distanceFromCenterKm: geofence.distanceKm,
      timestamp: ts,
      emailSent: false,
      pushSent: false,
    });

    const emailText =
      `Device: ${body.deviceName} (${body.deviceId})\n` +
      `Geofence: ${GEOFENCE.name} (${GEOFENCE.radiusKm} km)\n` +
      `Status: ENTERED\n` +
      `Distance from center: ${geofence.distanceKm.toFixed(2)} km\n` +
      `Location: https://maps.google.com/?q=${body.latitude},${body.longitude}\n` +
      `Time: ${ts.toISOString()}\n`;

    const emailRes = await sendAlertEmail({
      subject: `Geofence entry: ${body.deviceName}`,
      text: emailText,
    }).catch(() => ({ ok: false as const, skipped: false as const }));

    let pushSent = false;
    try {
      const subs = await PushSubscriptionModel.find({}).lean();
      const payload = {
        title: 'Geofence alert',
        body: `${body.deviceName} entered ${GEOFENCE.name}`,
        data: { deviceId: body.deviceId },
      };
      for (const sub of subs) {
        await sendWebPush(sub as any, payload);
        pushSent = true;
      }
    } catch {
      // ignore
    }

    await Alert.updateOne(
      { _id: alert._id },
      {
        $set: {
          emailSent: (emailRes as any).ok === true,
          pushSent,
        },
      }
    );

    await Device.updateOne(
      { deviceId: body.deviceId },
      {
        $set: {
          lastGeofenceInside: true,
          lastAlertAt: now,
        },
      }
    );

    alertCreated = true;
  } else {
    await Device.updateOne(
      { deviceId: body.deviceId },
      { $set: { lastGeofenceInside: geofence.inside } }
    );
  }

  return NextResponse.json({ ok: true, geofence, alertCreated });
}
