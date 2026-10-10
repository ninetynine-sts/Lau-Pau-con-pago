/**
 * Se ejecuta una vez al arrancar el servidor: carga la configuración y, si es peligrosa
 * (por ejemplo, Redsys con la clave pública de pruebas en producción), para el servidor
 * en vez de dejar una tienda que acepta pagos falsificados.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    await import('./lib/env');
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}
