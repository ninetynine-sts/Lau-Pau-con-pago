import { NextResponse, type NextRequest } from 'next/server';
import { SEGMENTS_ES, isLang } from './lib/routes';

/**
 * - «/» y rutas sin idioma → /es o /ca (preferencia guardada o idioma del navegador).
 * - /ca/productes/… → se sirve la página interna /ca/productos/… sin cambiar la URL.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const parts = pathname.split('/').filter(Boolean);

  if (!parts.length || !isLang(parts[0])) {
    const saved = req.cookies.get('lp_lang')?.value;
    const accept = req.headers.get('accept-language') ?? '';
    const lang = isLang(saved) ? saved : /^\s*ca\b/i.test(accept) ? 'ca' : 'es';
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  const res = (() => {
    if (parts[0] !== 'ca') return NextResponse.next();
    const internal = parts.slice(1).map((s) => SEGMENTS_ES[s] ?? s);
    if (internal.join('/') === parts.slice(1).join('/')) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/ca/${internal.join('/')}`;
    return NextResponse.rewrite(url);
  })();

  if (req.cookies.get('lp_lang')?.value !== parts[0]) {
    res.cookies.set('lp_lang', parts[0], { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  }
  return res;
}

export const config = {
  // Todo menos el panel, la API, los archivos estáticos y los internos de Next.
  matcher: ['/((?!admin|api|media|_next|laupau|favicon|robots|sitemap|.*\\.[a-z0-9]+$).*)']
};
