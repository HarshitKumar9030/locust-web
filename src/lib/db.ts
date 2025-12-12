import mongoose from 'mongoose';
import { requireEnv } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __locustMongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global.__locustMongooseConn ?? { conn: null, promise: null };
global.__locustMongooseConn = cached;

export async function connectDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(requireEnv('MONGODB_URI'), {
        serverSelectionTimeoutMS: 10_000,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
