import { useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CartProvider } from '@/components/cart';
import { isLang, type Lang } from '@/lib/routes';
import { orderConfirmationMail, storeNewOrderMail } from '@/lib/emails';
import { consumeScroll, currentQuery, internalSegments, navigate, useHashFull } from './shims/router';
import { db, save } from './mock/store';
import { mailRequestReceived, orderForMail, sendMail } from './mock/shop';
import { PublicShell } from './views/chrome';
import { About, Catalog, Home, Legal, NotFound, Personalize, ProductPage } from './views/catalog';
import { CartPage, CheckoutPage, OrderPage, PayLinkPage, RedsysSim, setPendingRedsys } from './views/checkout';
import { AccountRoute } from './views/account';
import { AdminRoute } from './views/admin';
import { DemoBar, Inbox } from './views/demo-ui';

/* La primera visita ya trae los correos de los ejemplos sembrados. */
if (!db.emails.length && db.orders.length === 1) {
  const m = orderForMail(db.orders[0].id);
  if (m) {
    sendMail(orderConfirmationMail(m));
    sendMail(storeNewOrderMail(m, db.settings.notifyEmail));
  }
  if (db.requests[0]) mailRequestReceived(db.requests[0]);
  db.emails.forEach((e) => (e.read = true));
  save();
}

/* Los componentes reales envían el navegador a Redsys con form.submit(): en la demo va a la pasarela simulada. */
const nativeSubmit = HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit = function (this: HTMLFormElement) {
  if (this.getAttribute('action') === 'redsys-sim') {
    const fields: Record<string, string> = {};
    this.querySelectorAll('input').forEach((i) => (fields[i.name] = i.value));
    setPendingRedsys({ url: 'redsys-sim', fields });
    this.remove();
    navigate('/pasarela');
    return;
  }
  nativeSubmit.call(this);
};

/* Enlaces internos («/ca/productes») → navegación por hash. Va en window para que el efecto de transición ya haya actuado. */
window.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || a.target === '_blank') return;
  const href = a.getAttribute('href') ?? '';
  if (!href.startsWith('/') || href.startsWith('//')) return;
  e.preventDefault();
  const [p, hash] = href.split('#');
  navigate(p || '/ca');
  if (hash) window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
});

function route(): { kind: 'public'; lang: Lang; node: JSX.Element } | { kind: 'admin' | 'bare'; node: JSX.Element } {
  const segs = internalSegments();
  const q = currentQuery();
  if (segs[0] === 'admin') return { kind: 'admin', node: <AdminRoute segs={segs.slice(1)} /> };
  if (segs[0] === 'correus') return { kind: 'bare', node: <Inbox /> };
  if (segs[0] === 'pasarela') return { kind: 'bare', node: <RedsysSim /> };
  const lang: Lang = isLang(segs[0]) ? segs[0] : 'ca';
  const [, a, b, c] = segs;
  let node: JSX.Element;
  if (!a) node = <Home lang={lang} />;
  else if (a === 'productos' && b) node = <ProductPage lang={lang} slug={b} />;
  else if (a === 'productos') node = <Catalog lang={lang} />;
  else if (a === 'personaliza') node = <Personalize lang={lang} />;
  else if (a === 'quienes-somos') node = <About lang={lang} />;
  else if (a === 'carrito') node = <CartPage lang={lang} />;
  else if (a === 'finalizar-compra') node = <CheckoutPage lang={lang} />;
  else if (a === 'pedido' && b) node = <OrderPage lang={lang} id={b} r={q.get('r')} />;
  else if (a === 'pagar' && b) node = <PayLinkPage lang={lang} id={b} />;
  else if (a === 'cuenta') node = <AccountRoute lang={lang} sub={b} />;
  else if (a === 'legal' && b) node = <Legal lang={lang} page={b} />;
  else node = <NotFound lang={lang} />;
  void c;
  return { kind: 'public', lang, node };
}

function App() {
  const hash = useHashFull();
  const r = route();
  const key = hash.split('?')[0];

  useLayoutEffect(() => {
    document.body.classList.toggle('lp-admin', r.kind === 'admin');
    document.body.classList.toggle('dm-bare', r.kind === 'bare');
    document.documentElement.lang = r.kind === 'public' ? r.lang : 'ca';
    if (consumeScroll()) window.scrollTo(0, 0);
  }, [key, r.kind]);

  useEffect(() => {
    // Tras la primera pantalla de carga, no se repite al volver de otras secciones.
    const id = window.setTimeout(() => document.documentElement.classList.add('lp-seen'), 2500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <CartProvider>
      <DemoBar />
      {r.kind === 'public' ? (
        <PublicShell lang={r.lang} key={r.lang}>
          <div key={key} className="lp-page">
            {r.node}
          </div>
        </PublicShell>
      ) : (
        <div key={key}>{r.node}</div>
      )}
    </CartProvider>
  );
}

document.documentElement.classList.add('lp-js');
if (!window.location.hash.startsWith('#/')) history.replaceState(null, '', '#/ca');
createRoot(document.getElementById('app')!).render(<App />);
