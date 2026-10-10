'use server';

/**
 * Cuenta de cliente. Formularios sin JavaScript: los errores vuelven como ?e=código.
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import {
  authenticate,
  checkRate,
  clearFailures,
  clientIp,
  createSession,
  destroySession,
  destroyUserSessions,
  getUser,
  hashPassword,
  isEmail,
  normalizeEmail,
  randomToken,
  registerFailure,
  sha256,
  verifyPassword
} from '@/lib/auth';
import { isLang, path, safeNext as safeInternal, type Lang } from '@/lib/routes';

const safeNext = (next: string, lang: Lang) => safeInternal(next, path(lang, 'cuenta'));
import { sendMailSafe } from '@/lib/mail';
import { passwordResetMail } from '@/lib/emails';

const s = (f: FormData, k: string, max = 300) => String(f.get(k) ?? '').trim().slice(0, max);
const langOf = (f: FormData): Lang => (isLang(f.get('lang')) ? (f.get('lang') as Lang) : 'es');

export async function login(form: FormData) {
  const lang = langOf(form);
  const next = safeNext(s(form, 'next', 300), lang);
  const back = (e: string) => `${path(lang, 'cuenta', 'acceder')}?e=${e}&next=${encodeURIComponent(next)}`;
  const email = normalizeEmail(s(form, 'email', 254));
  // Dos límites: por IP (muchas cuentas desde un sitio) y por cuenta (una cuenta desde muchos sitios).
  const ipKey = `login-ip:${await clientIp()}`;
  const emailKey = `login-email:${email}`;
  if (!checkRate(ipKey, 20) || !checkRate(emailKey, 30)) redirect(back('tooMany'));
  const user = await authenticate(email, String(form.get('password') ?? '').slice(0, 200));
  if (!user) {
    registerFailure(ipKey);
    registerFailure(emailKey);
    redirect(back('credentials'));
  }
  clearFailures(emailKey);
  // Una cuenta de administración entra por el panel, con su sesión corta.
  await createSession(user.id, user.role === 'admin' ? 'admin' : 'customer');
  redirect(next);
}

export async function register(form: FormData) {
  const lang = langOf(form);
  const next = safeNext(s(form, 'next', 300), lang);
  const back = (e: string) => `${path(lang, 'cuenta', 'registro')}?e=${e}&next=${encodeURIComponent(next)}`;
  const email = normalizeEmail(s(form, 'email', 254));
  const name = s(form, 'name', 120);
  const password = String(form.get('password') ?? '');
  if (!name || !isEmail(email)) redirect(back('required'));
  if (password.length < 10 || password.length > 200) redirect(back('password'));
  const key = `register:${await clientIp()}`;
  if (!checkRate(key)) redirect(back('tooMany'));
  registerFailure(key);

  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (exists) redirect(back('exists'));
  const [user] = await db
    .insert(schema.users)
    .values({ email, name, phone: s(form, 'phone', 40) || null, passwordHash: await hashPassword(password), lang })
    .returning({ id: schema.users.id });
  await createSession(user.id);
  redirect(next);
}

export async function logout(form: FormData) {
  await destroySession();
  redirect(path(langOf(form)));
}

export async function requestPasswordReset(form: FormData) {
  const lang = langOf(form);
  const email = normalizeEmail(s(form, 'email', 254));
  const key = `reset:${await clientIp()}`;
  const emailKey = `reset-email:${email}`;
  // Máx. 3 correos por cuenta cada hora: nadie puede usar la web para inundar un buzón.
  if (checkRate(key) && checkRate(emailKey, 3) && isEmail(email)) {
    registerFailure(key);
    registerFailure(emailKey, 3600_000);
    // Todo en segundo plano: la respuesta tarda lo mismo exista o no la cuenta.
    void (async () => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (!user) return;
      const token = randomToken();
      await db.insert(schema.passwordResets).values({
        tokenHash: sha256(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600_000)
      });
      await sendMailSafe(passwordResetMail(user.email, (user.lang as Lang) ?? lang, token));
    })().catch((e) => console.error('[recuperar]', e));
  }
  // Misma respuesta exista o no la cuenta.
  redirect(`${path(lang, 'cuenta', 'recuperar')}?sent=1`);
}

export async function resetPassword(form: FormData) {
  const lang = langOf(form);
  const token = s(form, 'token', 200);
  const password = String(form.get('password') ?? '');
  const back = (e: string) => `${path(lang, 'cuenta', 'restablecer')}?token=${encodeURIComponent(token)}&e=${e}`;
  if (password.length < 10 || password.length > 200) redirect(back('password'));
  const [row] = await db
    .select()
    .from(schema.passwordResets)
    .where(
      and(
        eq(schema.passwordResets.tokenHash, sha256(token)),
        gt(schema.passwordResets.expiresAt, new Date()),
        isNull(schema.passwordResets.usedAt)
      )
    )
    .limit(1);
  if (!row) redirect(back('invalid'));
  // Se marca como usado antes de nada y solo si nadie lo ha usado ya (dos envíos a la vez no valen).
  const claimed = await db
    .update(schema.passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.passwordResets.tokenHash, row.tokenHash), isNull(schema.passwordResets.usedAt)))
    .returning({ userId: schema.passwordResets.userId });
  if (!claimed.length) redirect(back('invalid'));
  await db.update(schema.users).set({ passwordHash: await hashPassword(password), updatedAt: new Date() }).where(eq(schema.users.id, row.userId));
  // Cierra las sesiones abiertas con la contraseña anterior.
  await destroyUserSessions(row.userId);
  redirect(`${path(lang, 'cuenta', 'acceder')}?reset=1`);
}

export async function updateProfile(form: FormData) {
  const lang = langOf(form);
  const user = await getUser();
  if (!user) redirect(path(lang, 'cuenta', 'acceder'));
  const name = s(form, 'name', 120);
  const userLang = isLang(form.get('userLang')) ? (form.get('userLang') as Lang) : user.lang;
  if (!name) redirect(`${path(lang, 'cuenta', 'datos')}?e=required`);
  await db
    .update(schema.users)
    .set({ name, phone: s(form, 'phone', 40) || null, lang: userLang, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  redirect(`${path(lang, 'cuenta', 'datos')}?ok=1`);
}

export async function changePassword(form: FormData) {
  const lang = langOf(form);
  const user = await getUser();
  if (!user) redirect(path(lang, 'cuenta', 'acceder'));
  const back = (q: string) => `${path(lang, 'cuenta', 'datos')}?${q}`;
  const key = `password:${user.id}`;
  if (!checkRate(key, 5)) redirect(back('e=current'));
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(String(form.get('current') ?? '').slice(0, 200), row.passwordHash))) {
    registerFailure(key);
    redirect(back('e=current'));
  }
  const password = String(form.get('password') ?? '');
  if (password.length < 10 || password.length > 200) redirect(back('e=password'));
  await db.update(schema.users).set({ passwordHash: await hashPassword(password), updatedAt: new Date() }).where(eq(schema.users.id, user.id));
  // Cierra todas las sesiones (también una posible sesión robada) y abre una nueva aquí.
  await destroyUserSessions(user.id);
  await createSession(user.id, user.role === 'admin' ? 'admin' : 'customer');
  redirect(back('ok=1'));
}

export async function saveAddress(form: FormData) {
  const lang = langOf(form);
  const user = await getUser();
  if (!user) redirect(path(lang, 'cuenta', 'acceder'));
  const data = {
    name: s(form, 'name', 120) || user.name,
    line1: s(form, 'line1', 200),
    line2: s(form, 'line2', 200) || undefined,
    city: s(form, 'city', 120),
    postalCode: s(form, 'postalCode', 20),
    region: s(form, 'region', 120) || undefined,
    country: s(form, 'country', 2).toUpperCase(),
    phone: s(form, 'phone', 40) || undefined
  };
  if (!data.line1 || !data.city || !data.postalCode || !/^[A-Z]{2}$/.test(data.country)) {
    redirect(`${path(lang, 'cuenta', 'direcciones')}?e=required`);
  }
  const existing = await db.select({ id: schema.addresses.id }).from(schema.addresses).where(eq(schema.addresses.userId, user.id));
  await db.insert(schema.addresses).values({ userId: user.id, label: s(form, 'label', 60), data, isDefault: existing.length === 0 });
  revalidatePath(path(lang, 'cuenta', 'direcciones'));
  redirect(`${path(lang, 'cuenta', 'direcciones')}?ok=1`);
}

export async function deleteAddress(form: FormData) {
  const lang = langOf(form);
  const user = await getUser();
  if (!user) redirect(path(lang, 'cuenta', 'acceder'));
  await db.delete(schema.addresses).where(and(eq(schema.addresses.id, Number(form.get('id'))), eq(schema.addresses.userId, user.id)));
  redirect(path(lang, 'cuenta', 'direcciones'));
}

export async function defaultAddress(form: FormData) {
  const lang = langOf(form);
  const user = await getUser();
  if (!user) redirect(path(lang, 'cuenta', 'acceder'));
  const id = Number(form.get('id'));
  await db.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.userId, user.id));
  await db.update(schema.addresses).set({ isDefault: true }).where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)));
  redirect(path(lang, 'cuenta', 'direcciones'));
}
