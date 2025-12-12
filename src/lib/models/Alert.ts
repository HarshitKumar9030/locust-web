import mongoose, { Schema } from 'mongoose';

export type AlertDoc = {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  distanceFromCenterKm: number;
  timestamp: Date;
  emailSent: boolean;
  pushSent: boolean;
};

const alertSchema = new Schema<AlertDoc>(
  {
    deviceId: { type: String, required: true, index: true },
    deviceName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    distanceFromCenterKm: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
    emailSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

alertSchema.index({ deviceId: 1, timestamp: -1 });

export const Alert = mongoose.models.Alert || mongoose.model<AlertDoc>('Alert', alertSchema);
