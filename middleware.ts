import { NextResponse, type NextRequest } from 'next/server';
import { SEGMENTS_ES, isLang } from './lib/routes';
import { GATE_COOKIE, GATE_MAX_AGE, adminPath, gateToken, safeAdminNext, sameToken } from './lib/admin-gate';

/**
 * 1. Política de seguridad de contenido (CSP) con un nonce nuevo en cada petición: el
 *    navegador solo ejecuta los scripts que lleven ese nonce. Si alguien consiguiera colar
 *    HTML en la página, su script no se ejecutaría.
 * 2. «/» y rutas sin idioma → /es o /ca (preferencia guardada o idioma del navegador).
 * 3. /ca/productes/… → se sirve la página interna /ca/productos/… sin cambiar la URL.
 * 4. Entrada oculta al panel (ver lib/admin-gate.ts): sin la cookie de acceso, /admin
 *    responde exactamente como una página que no existe.
 */

const isDev = process.env.NODE_ENV !== 'production';

function origin(url: string | undefined): string {
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}

function contentSecurityPolicy(nonce: string): string {
  const images = origin(process.env.R2_PUBLIC_URL);
  const redsys = origin(process.env.REDSYS_URL);
  return [
    "default-src 'self'",
    // 'strict-dynamic': los scripts con nonce pueden cargar los suyos; nada más se ejecuta.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${images ? ` ${images}` : ''}`,
    "font-src 'self'",
    `connect-src 'self'${isDev ? ' ws:' : ''}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    // Los formularios solo pueden enviarse a la propia web y a la pasarela de Redsys.
    `form-action 'self' https://sis.redsys.es https://sis-t.redsys.es:25443${redsys ? ` ${redsys}` : ''}`,
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests'])
  ].join('; ');
}

/** Rutas típicas de Shopify → rutas de esta tienda. null si no es una ruta de Shopify. */
function shopifyRedirect(parts: string[]): string | null {
  // Shopify también sirve /es/products/…, /ca/collections/… con idioma delante.
  const lang = isLang(parts[0]) ? parts[0] : 'es';
  const p = isLang(parts[0]) ? parts.slice(1) : parts;
  const cat = lang === 'ca' ? '/ca/productes' : '/es/productos';
  switch (p[0]) {
    case 'products':
      return p[1] && /^[a-z0-9-]{1,120}$/.test(p[1]) ? `${cat}/${p[1]}` : cat;
    case 'collections':
      // /collections/x/products/slug → la ficha; si no, el catálogo.
      return p[2] === 'products' && p[3] && /^[a-z0-9-]{1,120}$/.test(p[3]) ? `${cat}/${p[3]}` : cat;
    case 'cart':
      return lang === 'ca' ? '/ca/cistella' : '/es/carrito';
    case 'account':
      return lang === 'ca' ? '/ca/compte' : '/es/cuenta';
    case 'pages':
    case 'blogs':
    case 'search':
      return `/${lang}`;
    default:
      return null;
  }
}

function localeResponse(req: NextRequest, requestHeaders: Headers): NextResponse {
  const { pathname } = req.nextUrl;
  const parts = pathname.split('/').filter(Boolean);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  // Panel, API y fotos: sin idioma.
  if (parts[0] === 'admin' || parts[0] === 'api' || parts[0] === 'media') return pass();

  // Direcciones de la antigua tienda en Shopify (Google, Instagram, enlaces guardados):
  // redirección permanente a su equivalente, para no perder visitas ni posicionamiento.
  const legacy = shopifyRedirect(parts);
  if (legacy) {
    const url = req.nextUrl.clone();
    url.pathname = legacy;
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  if (!parts.length || !isLang(parts[0])) {
    const saved = req.cookies.get('lp_lang')?.value;
    const accept = req.headers.get('accept-language') ?? '';
    const lang = isLang(saved) ? saved : /^\s*ca\b/i.test(accept) ? 'ca' : 'es';
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  let res: NextResponse;
  if (parts[0] !== 'ca') res = pass();
  else {
    const internal = parts.slice(1).map((s) => SEGMENTS_ES[s] ?? s);
    if (internal.join('/') === parts.slice(1).join('/')) res = pass();
    else {
      const url = req.nextUrl.clone();
      url.pathname = `/ca/${internal.join('/')}`;
      res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }

  if (req.cookies.get('lp_lang')?.value !== parts[0]) {
    res.cookies.set('lp_lang', parts[0], {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: !isDev
    });
  }
  return res;
}

/** Respuesta idéntica a la de una dirección inventada (misma página y estado 404). */
function notFound(req: NextRequest, requestHeaders: Headers): NextResponse {
  const lang = isLang(req.cookies.get('lp_lang')?.value) ? req.cookies.get('lp_lang')!.value : 'es';
  const url = req.nextUrl.clone();
  // Misma forma que el resto de reescrituras de idioma de la web (p. ej. /ca/productes).
  url.pathname = `/${lang}${req.nextUrl.pathname}`;
  url.search = '';
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

async function adminGate(req: NextRequest, requestHeaders: Headers): Promise<NextResponse | null> {
  const secret = adminPath();
  if (!secret) return null;
  const first = req.nextUrl.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  const token = await gateToken(secret);

  if (first === secret) {
    const [path, query] = safeAdminNext(req.nextUrl.searchParams.get('next')).split('?');
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = query ? `?${query}` : '';
    const res = NextResponse.redirect(url);
    res.cookies.set(GATE_COOKIE, token, {
      path: '/admin',
      maxAge: GATE_MAX_AGE,
      httpOnly: true,
      // lax: los enlaces de los correos de aviso (abiertos desde Gmail, etc.) siguen funcionando.
      sameSite: 'lax',
      secure: !isDev
    });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Referrer-Policy', 'no-referrer');
    return res;
  }

  if (first === 'admin' && !sameToken(req.cookies.get(GATE_COOKIE)?.value, token)) return notFound(req, requestHeaders);
  return null;
}

export async function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  // Next.js lee el nonce de la cabecera CSP de la petición y lo pone en sus propios scripts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const res = (await adminGate(req, requestHeaders)) ?? localeResponse(req, requestHeaders);
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  // Todo menos los archivos estáticos y los internos de Next.
  matcher: ['/((?!_next|laupau|favicon|robots|sitemap|.*\\.[a-z0-9]+$).*)']
};
