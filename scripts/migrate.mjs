/**
 * Aplica las migraciones y, si la base de datos está vacía, carga el catálogo inicial.
 * Se ejecuta en cada arranque (`npm start`): es idempotente.
 *
 * Si existen ADMIN_EMAIL y ADMIN_PASSWORD y todavía no hay ninguna cuenta de
 * administración, la crea.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import * as seed from './seed-data.mjs';

// Carga .env si existe (en Hostinger las variables vienen del panel).
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

async function connect() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { default: postgres } = await import('postgres');
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
    const db = drizzle(client);
    return {
      migrate: () => migrate(db, { migrationsFolder: './drizzle' }),
      query: async (text, params = []) => client.unsafe(text, params),
      close: () => client.end()
    };
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('[db] AVISO: sin DATABASE_URL se usa PGlite en disco local. En Hostinger configura DATABASE_URL (Neon).');
  }
  const dir = process.env.PGLITE_DIR ?? './.data/pglite';
  mkdirSync(dir, { recursive: true });
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const lite = new PGlite(dir);
  const db = drizzle(lite);
  return {
    migrate: () => migrate(db, { migrationsFolder: './drizzle' }),
    query: async (text, params = []) => (await lite.query(text, params)).rows,
    close: () => lite.close()
  };
}

const j = (v) => JSON.stringify(v);

async function seedIfEmpty(q) {
  const [{ n }] = await q('select count(*)::int as n from categories');
  if (n > 0) return false;

  for (const c of seed.categories) {
    await q('insert into categories (id, name, sort) values ($1, $2, $3)', [c.id, j(c.name), c.sort]);
  }

  for (const p of seed.products) {
    const [row] = await q(
      `insert into products (slug, ref, category_id, name, short_description, description, badge,
         price_cents, images, personalization, details, featured, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
      [
        p.slug, p.ref, p.categoryId, j(p.name), j(p.shortDescription), j(p.description),
        p.badge ? j(p.badge) : null, p.priceCents, j(p.images),
        j(p.personalization ?? { mode: 'none' }), j(p.details ?? []), !!p.featured, p.sort
      ]
    );
    const vs = p.variants ?? [{ name: null, stock: null }];
    let i = 0;
    for (const v of vs) {
      i += 1;
      await q('insert into variants (product_id, name, sku, stock, sort) values ($1,$2,$3,$4,$5)', [
        row.id, v.name ? j(v.name) : null, `${p.ref}${vs.length > 1 ? `-${i}` : ''}`, v.stock ?? null, i
      ]);
    }
  }

  for (const s of seed.shippingMethods) {
    await q(
      `insert into shipping_methods (name, description, countries, all_countries, is_pickup, price_cents, free_over_cents, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [j(s.name), j(s.description), s.countries, s.allCountries, s.isPickup, s.priceCents, s.freeOverCents, s.sort]
    );
  }

  for (const [key, value] of Object.entries(seed.settings)) {
    await q('insert into settings (key, value) values ($1, $2) on conflict (key) do nothing', [key, j(value)]);
  }
  return true;
}

async function ensureAdmin(q) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  const [{ n }] = await q(`select count(*)::int as n from users where role = 'admin'`);
  if (n > 0) return null;
  const hash = await bcrypt.hash(password, 12);
  await q(
    `insert into users (email, password_hash, name, role, lang) values ($1, $2, $3, 'admin', 'ca')
     on conflict (email) do update set role = 'admin', password_hash = excluded.password_hash`,
    [email, hash, 'Lau&Pau']
  );
  return email;
}

const conn = await connect();
try {
  await conn.migrate();
  const seeded = await seedIfEmpty(conn.query);
  const admin = await ensureAdmin(conn.query);
  console.log(`[db] migraciones aplicadas${seeded ? ' · catálogo inicial cargado' : ''}${admin ? ` · admin creado: ${admin}` : ''}`);
} finally {
  await conn.close();
}
