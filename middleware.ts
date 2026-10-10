import { NextResponse, type NextRequest } from 'next/server';
import { SEGMENTS_ES, isLang } from './lib/routes';

/**
 * 1. Política de seguridad de contenido (CSP) con un nonce nuevo en cada petición: el
 *    navegador solo ejecuta los scripts que lleven ese nonce. Si alguien consiguiera colar
 *    HTML en la página, su script no se ejecutaría.
 * 2. «/» y rutas sin idioma → /es o /ca (preferencia guardada o idioma del navegador).
 * 3. /ca/productes/… → se sirve la página interna /ca/productos/… sin cambiar la URL.
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

function localeResponse(req: NextRequest, requestHeaders: Headers): NextResponse {
  const { pathname } = req.nextUrl;
  const parts = pathname.split('/').filter(Boolean);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  // Panel, API y fotos: sin idioma.
  if (parts[0] === 'admin' || parts[0] === 'api' || parts[0] === 'media') return pass();

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

export function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  // Next.js lee el nonce de la cabecera CSP de la petición y lo pone en sus propios scripts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const res = localeResponse(req, requestHeaders);
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  // Todo menos los archivos estáticos y los internos de Next.
  matcher: ['/((?!_next|laupau|favicon|robots|sitemap|.*\\.[a-z0-9]+$).*)']
};
