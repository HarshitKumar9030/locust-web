import mongoose, { Schema } from 'mongoose';

export type LocationDoc = {
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  battery?: number;
  timestamp: Date;
  isInGeofence: boolean;
  distanceFromCenterKm: number;
};

const locationSchema = new Schema<LocationDoc>(
  {
    deviceId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    altitude: Number,
    speed: Number,
    heading: Number,
    battery: Number,
    timestamp: { type: Date, required: true, index: true },
    isInGeofence: { type: Boolean, required: true, index: true },
    distanceFromCenterKm: { type: Number, required: true },
  },
  { timestamps: true }
);

locationSchema.index({ deviceId: 1, timestamp: -1 });

export const Location =
  mongoose.models.Location || mongoose.model<LocationDoc>('Location', locationSchema);
