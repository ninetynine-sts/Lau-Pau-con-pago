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
import { COLLECTION_KEY, newCategories, newProducts } from './seed-products-2026-10.mjs';

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

  for (const p of seed.products) await insertProduct(q, p);

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
  // El catálogo inicial ya incluye la colección nueva: se marca como añadida.
  await q('insert into settings (key, value) values ($1, $2) on conflict (key) do nothing', [COLLECTION_KEY, j(true)]);
  return true;
}

async function insertProduct(q, p) {
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
    await q('insert into variants (product_id, name, color, sku, stock, sort) values ($1,$2,$3,$4,$5,$6)', [
      row.id, v.name ? j(v.name) : null, v.color ?? null, `${p.ref}${vs.length > 1 ? `-${i}` : ''}`, v.stock ?? null, i
    ]);
  }
}

/**
 * Colección nueva para tiendas ya en marcha. Se añade UNA sola vez (queda anotado en
 * settings), así lo que se borre después desde el panel no vuelve a aparecer. Nunca
 * toca productos existentes: si el slug ya existe, se salta.
 */
async function addCollection(q) {
  const done = await q('select 1 from settings where key = $1', [COLLECTION_KEY]);
  if (done.length) return 0;
  for (const c of newCategories) {
    await q('insert into categories (id, name, sort) values ($1, $2, $3) on conflict (id) do nothing', [c.id, j(c.name), c.sort]);
  }
  let added = 0;
  for (const p of newProducts) {
    const exists = await q('select 1 from products where slug = $1', [p.slug]);
    if (exists.length) continue;
    await insertProduct(q, p);
    added += 1;
  }
  await q('insert into settings (key, value) values ($1, $2) on conflict (key) do nothing', [COLLECTION_KEY, j(true)]);
  return added;
}

/**
 * Colores de las fotos para tiendas creadas antes de que existieran. Solo toca productos
 * del catálogo inicial que siguen con su única variante sin nombre ni color (nunca
 * sobrescribe lo que se haya editado en el panel). La variante existente pasa a ser el
 * primer color, así los pedidos antiguos siguen apuntando a ella.
 */
async function backfillColors(q) {
  let changed = 0;
  for (const p of seed.products) {
    if (!p.variants?.length) continue;
    const [prod] = await q('select id, ref from products where slug = $1', [p.slug]);
    if (!prod) continue;
    const vs = await q('select id, name, color from variants where product_id = $1', [prod.id]);
    if (vs.length !== 1 || vs[0].name !== null || vs[0].color !== null) continue;
    const [first, ...rest] = p.variants;
    await q('update variants set name = $2, color = $3, sku = $4, sort = 1 where id = $1', [
      vs[0].id, j(first.name), first.color, `${prod.ref}-1`
    ]);
    let i = 1;
    for (const v of rest) {
      i += 1;
      await q('insert into variants (product_id, name, color, sku, stock, sort) values ($1,$2,$3,$4,$5,$6)', [
        prod.id, j(v.name), v.color, `${prod.ref}-${i}`, v.stock ?? null, i
      ]);
    }
    changed += 1;
  }
  return changed;
}

/**
 * Mocadors: la foto de grupo se cambia por una foto de cada estampado (carrusel en la
 * ficha). Solo si la ficha conserva la foto original: nunca pisa fotos puestas en el panel.
 */
async function updatePanuelosGallery(q) {
  const KEY = 'panuelos-gallery-2026-10';
  if ((await q('select 1 from settings where key = $1', [KEY])).length) return false;
  const p = seed.products.find((x) => x.slug === 'panuelos');
  const [row] = await q('select id, images from products where slug = $1', ['panuelos']);
  let changed = false;
  if (p && row) {
    const imgs = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
    if (Array.isArray(imgs) && imgs.length === 1 && imgs[0]?.src === '/laupau/productos/panuelos.webp') {
      await q('update products set images = $2, updated_at = now() where id = $1', [row.id, j(p.images)]);
      changed = true;
    }
  }
  await q('insert into settings (key, value) values ($1, $2) on conflict (key) do nothing', [KEY, j(true)]);
  return changed;
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
  // Si el correo ya tenía cuenta, sus sesiones anteriores dejan de valer.
  await q(`delete from sessions where user_id = (select id from users where email = $1)`, [email]);
  return email;
}

const conn = await connect();
try {
  await conn.migrate();
  // Las sesiones del panel duran como máximo 12 h: se recortan las anteriores a esta norma.
  await conn.query(
    `update sessions set expires_at = least(expires_at, now() + interval '12 hours')
      where user_id in (select id from users where role = 'admin')`
  );
  const seeded = await seedIfEmpty(conn.query);
  // Ajustes nuevos para tiendas ya creadas: solo se añaden los que faltan, nunca se pisan.
  if (!seeded) {
    for (const [key, value] of Object.entries(seed.settings)) {
      await conn.query('insert into settings (key, value) values ($1, $2) on conflict (key) do nothing', [key, j(value)]);
    }
  }
  const colored = seeded ? 0 : await backfillColors(conn.query);
  if (colored) console.log(`[db] colores añadidos a ${colored} productos del catálogo inicial`);
  const added = seeded ? 0 : await addCollection(conn.query);
  if (!seeded && (await updatePanuelosGallery(conn.query))) console.log('[db] mocadors: galería de 8 fotos');
  if (added) console.log(`[db] colección nueva: ${added} productos añadidos`);
  const admin = await ensureAdmin(conn.query);
  console.log(`[db] migraciones aplicadas${seeded ? ' · catálogo inicial cargado' : ''}${admin ? ` · admin creado: ${admin}` : ''}`);
} finally {
  await conn.close();
}
