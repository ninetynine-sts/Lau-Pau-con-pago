/**
 * Fotos de producto subidas desde el panel.
 *  - Con R2 configurado: se suben a Cloudflare R2 y se sirven desde R2_PUBLIC_URL.
 *  - Sin R2: se guardan en UPLOAD_DIR y se sirven por /media/… (solo para local:
 *    en Hostinger el disco de la app puede vaciarse al redesplegar).
 */
import 'server-only';
import { AwsClient } from 'aws4fetch';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomToken } from './auth';
import { env } from './env';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

export function r2Enabled(): boolean {
  const r = env.r2;
  return Boolean(r.accountId && r.accessKeyId && r.secretAccessKey && r.bucket && r.publicUrl);
}

/** Comprueba la firma real del archivo, no solo la extensión. */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.subarray(4, 12).toString() === 'ftypavif') return 'image/avif';
  return null;
}

export async function saveImage(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('La foto pesa massa (màxim 6 MB).');
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new Error('Format no admès. Puja JPG, PNG, WebP o AVIF.');
  const key = `productes/${new Date().toISOString().slice(0, 7)}/${randomToken(12)}.${TYPES[type]}`;

  if (r2Enabled()) {
    const r = env.r2;
    const client = new AwsClient({ accessKeyId: r.accessKeyId!, secretAccessKey: r.secretAccessKey!, service: 's3', region: 'auto' });
    const res = await client.fetch(`https://${r.accountId}.r2.cloudflarestorage.com/${r.bucket}/${key}`, {
      method: 'PUT',
      body: buf,
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' }
    });
    if (!res.ok) throw new Error(`No s’ha pogut pujar la foto (R2 ${res.status}).`);
    return `${r.publicUrl}/${key}`;
  }

  const dir = resolve(env.uploadDir);
  const full = join(dir, key);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, buf);
  return `/media/${key}`;
}
