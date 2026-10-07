/**
 * Crea o actualiza una cuenta de administración.
 *   npm run admin:create -- correo@ejemplo.com "contraseña-larga"
 */
import { existsSync, readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const [email, password, name = 'Lau&Pau'] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Uso: npm run admin:create -- correo@ejemplo.com "contraseña de al menos 10 caracteres" [nombre]');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const sql = `insert into users (email, password_hash, name, role, lang) values ($1, $2, $3, 'admin', 'ca')
  on conflict (email) do update set role = 'admin', password_hash = excluded.password_hash, name = excluded.name`;
const params = [email.trim().toLowerCase(), hash, name];

const url = process.env.DATABASE_URL?.trim();
if (url) {
  const { default: postgres } = await import('postgres');
  const client = postgres(url, { max: 1, prepare: false });
  await client.unsafe(sql, params);
  await client.end();
} else {
  const { PGlite } = await import('@electric-sql/pglite');
  const lite = new PGlite(process.env.PGLITE_DIR ?? './.data/pglite');
  await lite.query(sql, params);
  await lite.close();
}
console.log(`Cuenta de administración lista: ${params[0]}`);
