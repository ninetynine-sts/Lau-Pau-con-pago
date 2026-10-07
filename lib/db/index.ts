/**
 * Conexión a la base de datos.
 *
 * - Con DATABASE_URL (Neon u otro PostgreSQL): postgres.js.
 * - Sin DATABASE_URL: PGlite, un PostgreSQL embebido en ./.data/pglite, para trabajar
 *   en local sin instalar nada. Mismo esquema y mismas consultas.
 */
import 'server-only';
import * as schema from './schema';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleLite } from 'drizzle-orm/pglite';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';

type DB = ReturnType<typeof drizzlePg<typeof schema>>;

const g = globalThis as unknown as { __lpDb?: DB };

function create(): DB {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const client = postgres(url, { max: 5, prepare: false });
    return drizzlePg(client, { schema });
  }
  const dir = process.env.PGLITE_DIR ?? './.data/pglite';
  const lite = new PGlite(dir);
  // Misma API de consulta; el tipo se unifica para no duplicar código.
  return drizzleLite(lite, { schema }) as unknown as DB;
}

export const db: DB = g.__lpDb ?? (g.__lpDb = create());
export { schema };
