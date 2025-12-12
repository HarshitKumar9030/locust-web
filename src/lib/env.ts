import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().optional(),
  LOCUST_INGEST_API_KEY: z.string().optional(),

  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_FROM: z.string().optional(),
  MAILGUN_TO: z.string().optional(),

  VAPID_SUBJECT: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  LOCUST_INGEST_API_KEY: process.env.LOCUST_INGEST_API_KEY,

  MAILGUN_API_KEY: process.env.MAILGUN_API_KEY,
  MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
  MAILGUN_FROM: process.env.MAILGUN_FROM,
  MAILGUN_TO: process.env.MAILGUN_TO,

  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
});

export function requireEnv<K extends keyof Env>(key: K): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${String(key)}`);
  }
  return value;
}
