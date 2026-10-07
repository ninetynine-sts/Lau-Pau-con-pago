/**
 * Rutas públicas con el nombre traducido en la URL.
 * Internamente las páginas viven en la versión castellana (app/[lang]/productos…);
 * el middleware reescribe /ca/productes → /ca/productos.
 */
export type Lang = 'es' | 'ca';
export const LANGS: Lang[] = ['es', 'ca'];
export const DEFAULT_LANG: Lang = 'es';

export function isLang(v: unknown): v is Lang {
  return v === 'es' || v === 'ca';
}

/** Segmentos castellanos (internos) → catalanes. */
export const SEGMENTS_CA: Record<string, string> = {
  productos: 'productes',
  personaliza: 'personalitza',
  'quienes-somos': 'qui-som',
  carrito: 'cistella',
  'finalizar-compra': 'finalitzar-compra',
  pedido: 'comanda',
  pagar: 'pagar',
  solicitud: 'sollicitud',
  cuenta: 'compte',
  acceder: 'entrar',
  registro: 'registre',
  pedidos: 'comandes',
  solicitudes: 'sollicituds',
  direcciones: 'adreces',
  datos: 'dades',
  recuperar: 'recuperar',
  restablecer: 'restablir',
  legal: 'legal',
  'aviso-legal': 'avis-legal',
  condiciones: 'condicions',
  'envios-y-devoluciones': 'enviaments-i-devolucions',
  privacidad: 'privacitat',
  cookies: 'galetes'
};

export const SEGMENTS_ES: Record<string, string> = Object.fromEntries(
  Object.entries(SEGMENTS_CA).map(([es, ca]) => [ca, es])
);

/** Construye una ruta pública: path('ca', 'productos', slug) → /ca/productes/slug */
export function path(lang: Lang, ...segments: (string | number)[]): string {
  const parts = segments.map(String).filter(Boolean).map((s) => (lang === 'ca' ? SEGMENTS_CA[s] ?? s : s));
  return `/${lang}${parts.length ? `/${parts.join('/')}` : ''}`;
}

/** La misma página en el otro idioma (para el selector de idioma). */
export function switchLang(pathname: string, to: Lang): string {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length || !isLang(parts[0])) return `/${to}`;
  const from = parts[0] as Lang;
  const rest = parts.slice(1).map((seg) => (from === 'ca' ? SEGMENTS_ES[seg] ?? seg : seg));
  return path(to, ...rest);
}
