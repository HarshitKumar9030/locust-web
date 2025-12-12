import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { PushSubscriptionModel } from '@/lib/models/PushSubscription';

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = subSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  try {
    await connectDb();
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Database not configured' },
      { status: 500 }
    );
  }

  await PushSubscriptionModel.updateOne(
    { endpoint: parsed.data.endpoint },
    { $set: parsed.data },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
