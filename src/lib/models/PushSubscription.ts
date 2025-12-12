import mongoose, { Schema } from 'mongoose';

export type PushSubscriptionDoc = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const pushSchema = new Schema<PushSubscriptionDoc>(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export const PushSubscriptionModel =
  mongoose.models.PushSubscription ||
  mongoose.model<PushSubscriptionDoc>('PushSubscription', pushSchema);
