/**
 * Cuentas y sesiones. Una sola tabla de usuarios con rol: cliente o administración.
 * La cookie lleva un token aleatorio; en la base de datos solo se guarda su hash.
 */
import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db, schema } from './db';

const COOKIE = 'lp_session';
const SESSION_DAYS = 30;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: 'customer' | 'admin';
  lang: 'es' | 'ca';
};

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt });
  // Limpieza ocasional de sesiones caducadas.
  if (Math.random() < 0.05) await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      phone: schema.users.phone,
      role: schema.users.role,
      lang: schema.users.lang
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
});

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getUser();
  if (!user || user.role !== 'admin') redirect('/admin/entrar');
  return user;
}

export async function requireCustomer(loginPath: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(loginPath);
  return user;
}

/* -------------------------------------------- límite de intentos de acceso --- */

const attempts = new Map<string, { n: number; until: number }>();
const WINDOW = 15 * 60_000;
const MAX = 8;

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

/** true si se puede seguir intentando. */
export function checkRate(key: string): boolean {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.until < now) return true;
  return a.n < MAX;
}

export function registerFailure(key: string): void {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.until < now) attempts.set(key, { n: 1, until: now + WINDOW });
  else a.n += 1;
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

// Hash real de una contraseña aleatoria: se compara contra él cuando el correo no existe.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), 12);

/** Valida correo y contraseña. Devuelve el usuario o null. */
export async function authenticate(emailRaw: string, password: string) {
  const email = normalizeEmail(emailRaw);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  // Se compara siempre, aunque no exista: así el tiempo de respuesta no revela qué correos hay.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  return ok && user ? user : null;
}
