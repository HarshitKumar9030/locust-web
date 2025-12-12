import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { Device } from '@/lib/models/Device';
import { Location } from '@/lib/models/Location';
import { Alert } from '@/lib/models/Alert';
import { GEOFENCE } from '@/lib/geofence';

export async function GET() {
  try {
    await connectDb();
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Database not configured' },
      { status: 500 }
    );
  }

  const devices = await Device.find({ isActive: true })
    .sort({ lastSeen: -1 })
    .lean();

  const latestLocations = await Location.aggregate([
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$deviceId',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { timestamp: -1 } },
  ]);

  const recentAlerts = await Alert.find({})
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    geofence: GEOFENCE,
    devices,
    latestLocations,
    recentAlerts,
  });
}
