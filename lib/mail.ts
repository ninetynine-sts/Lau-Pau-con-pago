/**
 * Envío de correos con Resend (API REST). Sin RESEND_API_KEY, los correos se guardan
 * en la tabla email_log y se muestran en consola: útil en local y en pruebas.
 */
import 'server-only';
import { env } from './env';
import { db, schema } from './db';

export type Mail = { to: string; subject: string; html: string; replyTo?: string };

export async function sendMail(mail: Mail): Promise<boolean> {
  if (!env.mail.resendKey) {
    await db.insert(schema.emailLog).values({ to: mail.to, subject: mail.subject, html: mail.html, status: 'logged' });
    console.log(`[correo · sin RESEND_API_KEY] ${mail.to} · ${mail.subject}`);
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.mail.resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.mail.from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        reply_to: mail.replyTo ?? env.mail.replyTo
      })
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    await db.insert(schema.emailLog).values({ to: mail.to, subject: mail.subject, html: '', status: 'sent' });
    return true;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('[correo] error', error);
    await db.insert(schema.emailLog).values({ to: mail.to, subject: mail.subject, html: mail.html, status: 'failed', error });
    return false;
  }
}

/** Nunca bloquea el flujo principal por un correo. */
export async function sendMailSafe(mail: Mail): Promise<void> {
  try {
    await sendMail(mail);
  } catch (e) {
    console.error('[correo] no se pudo registrar', e);
  }
}
