/**
 * Crea o actualiza una cuenta de administración.
 *   npm run admin:create -- correo@ejemplo.com [nombre]
 * La contraseña se pide por teclado (sin mostrarla) o se lee de ADMIN_NEW_PASSWORD:
 * nunca va en la línea de comandos, que queda en el historial y en la lista de procesos.
 */
import { existsSync, readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const [email, name = 'Lau&Pau'] = process.argv.slice(2);

async function askHidden(question) {
  if (!process.stdin.isTTY) return '';
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  return new Promise((done) => {
    let value = '';
    process.stdin.on('data', function onData(chunk) {
      // Se recorre carácter a carácter: al pegar, la contraseña y el Intro llegan juntos.
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off('data', onData);
          process.stdout.write('\n');
          done(value);
          return;
        } else if (ch === '\u0003') process.exit(1);
        else if (ch === '\u007f') value = value.slice(0, -1);
        else value += ch;
      }
    });
  });
}

const password = process.env.ADMIN_NEW_PASSWORD || (await askHidden('Contraseña (mínimo 12 caracteres): '));
if (!email || !password || password.length < 12) {
  console.error('Uso: npm run admin:create -- correo@ejemplo.com [nombre]  (contraseña de al menos 12 caracteres)');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const sql = `insert into users (email, password_hash, name, role, lang) values ($1, $2, $3, 'admin', 'ca')
  on conflict (email) do update set role = 'admin', password_hash = excluded.password_hash, name = excluded.name`;
// Si la cuenta ya existía, se cierran sus sesiones: solo la contraseña nueva da acceso.
const closeSessions = `delete from sessions where user_id = (select id from users where email = $1)`;
const params = [email.trim().toLowerCase(), hash, name];

const url = process.env.DATABASE_URL?.trim();
if (url) {
  const { default: postgres } = await import('postgres');
  const client = postgres(url, { max: 1, prepare: false });
  await client.unsafe(sql, params);
  await client.unsafe(closeSessions, [params[0]]);
  await client.end();
} else {
  const { PGlite } = await import('@electric-sql/pglite');
  const lite = new PGlite(process.env.PGLITE_DIR ?? './.data/pglite');
  await lite.query(sql, params);
  await lite.query(closeSessions, [params[0]]);
  await lite.close();
}
console.log(`Cuenta de administración lista: ${params[0]}`);
