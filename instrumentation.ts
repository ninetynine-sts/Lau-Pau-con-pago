/**
 * Se ejecuta una vez al arrancar el servidor: carga la configuración y, si es peligrosa
 * (por ejemplo, Redsys con la clave pública de pruebas en producción), para el servidor
 * en vez de dejar una tienda que acepta pagos falsificados.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    // Migraciones: «npm start» ya las aplica antes de arrancar (y marca LP_MIGRATED). Si el
    // hosting arranca Next directamente (sin npm start), se aplican aquí igualmente.
    if (process.env.LP_MIGRATED !== '1' && process.env.NODE_ENV === 'production') {
      const { execFileSync } = await import(/* webpackIgnore: true */ 'node:child_process');
      execFileSync(process.execPath, ['scripts/migrate.mjs'], { stdio: 'inherit' });
    }
    await import('./lib/env');
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
