/**
 * Entrada oculta al panel.
 *
 * Con ADMIN_PATH configurado, /admin no existe para nadie: devuelve la misma página
 * «no encontrada» que cualquier dirección inventada, así que ni siquiera se puede probar
 * una contraseña. Para entrar hay que abrir antes https://tudominio/<ADMIN_PATH> (una
 * dirección larga y secreta): eso deja en el navegador una cookie de acceso y lleva al
 * inicio de sesión de siempre. La contraseña y el resto de protecciones siguen igual;
 * esto es una capa más delante de ellas.
 *
 * Funciona en el middleware (sin APIs de Node).
 */

export const GATE_COOKIE = 'lp_gate';
export const GATE_MAX_AGE = 60 * 60 * 24 * 90; // 90 días en cada navegador

/** Minúsculas, números y guiones; mínimo 24 caracteres para que no se pueda adivinar. */
export const ADMIN_PATH_RE = /^[a-z0-9-]{24,64}$/;

export function adminPath(): string | undefined {
  const v = process.env.ADMIN_PATH?.trim().toLowerCase();
  return v && ADMIN_PATH_RE.test(v) ? v : undefined;
}

/** Valor de la cookie: HMAC del secreto, así la cookie no revela la dirección. */
export async function gateToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign'
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('lp-admin-gate-v1'));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparación en tiempo constante. */
export function sameToken(a: string | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Destino tras la entrada: solo rutas del panel (nunca otra web). */
export function safeAdminNext(next: string | null): string {
  if (!next || !/^\/admin(\/[A-Za-z0-9\-/]*)?(\?[A-Za-z0-9=&\-]*)?$/.test(next)) return '/admin';
  return next;
}
