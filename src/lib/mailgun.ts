import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { env } from './env';

export async function sendAlertEmail(params: {
  subject: string;
  text: string;
}) {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM, MAILGUN_TO } = env;

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM || !MAILGUN_TO) {
    return { ok: false as const, skipped: true as const };
  }

  const mg = new Mailgun(formData);
  const client = mg.client({
    username: 'api',
    key: MAILGUN_API_KEY,
  });

  await client.messages.create(MAILGUN_DOMAIN, {
    from: MAILGUN_FROM,
    to: [MAILGUN_TO],
    subject: params.subject,
    text: params.text,
  });

  return { ok: true as const };
}
