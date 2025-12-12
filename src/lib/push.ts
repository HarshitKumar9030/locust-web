import webpush from 'web-push';
import { env } from './env';

export function configureWebPush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return { enabled: false as const };
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return { enabled: true as const };
}

export async function sendWebPush(
  subscription: webpush.PushSubscription,
  payload: unknown
) {
  const cfg = configureWebPush();
  if (!cfg.enabled) return { ok: false as const, skipped: true as const };

  await webpush.sendNotification(subscription, JSON.stringify(payload));
  return { ok: true as const };
}
