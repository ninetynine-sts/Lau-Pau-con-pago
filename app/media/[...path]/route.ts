import { readFile } from 'node:fs/promises';
import { join, normalize, resolve, sep } from 'node:path';
import { env } from '@/lib/env';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

/** Sirve las fotos subidas en local (sin R2). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const root = resolve(env.uploadDir);
  const file = normalize(join(root, ...path));
  if (!file.startsWith(root + sep)) return new Response('Not found', { status: 404 });
  const ext = file.split('.').pop()?.toLowerCase() ?? '';
  if (!TYPES[ext]) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': TYPES[ext], 'Cache-Control': 'public, max-age=31536000, immutable' }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
