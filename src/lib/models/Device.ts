import mongoose, { Schema } from 'mongoose';

export type DeviceDoc = {
  deviceId: string;
  deviceName: string;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  registeredAt: Date;
  lastSeen?: Date;
  isActive: boolean;

  lastGeofenceInside?: boolean;
  lastAlertAt?: Date;
};

const deviceSchema = new Schema<DeviceDoc>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String, required: true },
    manufacturer: String,
    model: String,
    osVersion: String,
    registeredAt: { type: Date, required: true },
    lastSeen: Date,
    isActive: { type: Boolean, default: true },

    lastGeofenceInside: Boolean,
    lastAlertAt: Date,
  },
  { timestamps: true }
);

export const Device = mongoose.models.Device || mongoose.model<DeviceDoc>('Device', deviceSchema);
