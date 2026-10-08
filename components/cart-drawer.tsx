'use client';

/**
 * Cesta lateral. Escritorio: panel flotante a la derecha. Móvil: hoja inferior.
 *
 * Movimiento (Apple, «Designing Fluid Interfaces»):
 *  - se abre y se cierra con un muelle que parte siempre del valor actual (interrumpible);
 *  - se arrastra 1:1 desde la cabecera; pasado el tope, resistencia progresiva;
 *  - al soltar se proyecta la inercia del gesto para decidir si cierra o vuelve,
 *    y el muelle hereda la velocidad del dedo (sin costura entre arrastre y animación).
 */
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { X, Minus, Plus, Trash } from '@phosphor-icons/react/dist/ssr';
import { BtnIcon } from './brand';
import { useCart } from './cart';
import { quote, type QuoteResult } from '@/app/actions/shop';
import { formatPrice, t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';
import { animateSpring, project, rubberband, VelocityTracker, type SpringHandle } from '@/lib/spring';

const SCRIM_MAX = 0.32;

export function CartDrawer({ lang }: { lang: Lang }) {
  const d = t(lang);
  const cart = useCart();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<QuoteResult | null>(null);
  const [loading, startQuote] = useTransition();

  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const value = useRef(1e4); // desplazamiento actual en px (0 = abierto)
  const size = useRef(1e4);
  const axis = useRef<'x' | 'y'>('x');
  const spring = useRef<SpringHandle | null>(null);
  const closingByDrag = useRef(false);

  const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const paint = useCallback((v: number) => {
    value.current = v;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (panel) panel.style.transform = axis.current === 'x' ? `translate3d(${v}px,0,0)` : `translate3d(0,${v}px,0)`;
    if (scrim) {
      const progress = Math.min(1, Math.max(0, 1 - v / size.current));
      scrim.style.opacity = String(progress * SCRIM_MAX);
    }
  }, []);

  const measure = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    axis.current = window.matchMedia('(max-width: 719px)').matches ? 'y' : 'x';
    const r = panel.getBoundingClientRect();
    size.current = axis.current === 'x' ? r.width + 24 : r.height + 24;
  }, []);

  const runTo = useCallback(
    (target: number, velocity = 0, onRest?: () => void) => {
      spring.current?.stop();
      if (reduced()) {
        paint(target);
        onRest?.();
        return;
      }
      const momentum = Math.abs(velocity) > 400;
      spring.current = animateSpring(value.current, target, {
        damping: target === 0 && momentum ? 0.82 : 1,
        response: target === 0 ? 0.42 : 0.34,
        velocity,
        onUpdate: paint,
        onRest
      });
    },
    [paint]
  );

  /* Abrir y cerrar según el contexto de la cesta. */
  useLayoutEffect(() => {
    if (cart.drawerOpen) {
      returnFocus.current = (document.activeElement as HTMLElement) ?? null;
      setVisible(true);
    } else if (visible) {
      // Si lo ha cerrado un gesto, el muelle ya está en marcha con la velocidad del dedo.
      if (closingByDrag.current) closingByDrag.current = false;
      else runTo(size.current, 0, () => setVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.drawerOpen]);

  useLayoutEffect(() => {
    if (!visible || !cart.drawerOpen) return;
    const wasClosed = value.current >= size.current;
    measure();
    if (wasClosed) paint(size.current);
    runTo(0);
    closeRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cart.drawerOpen]);

  /* Al cerrar del todo: devolver el foco y desbloquear el scroll. */
  useEffect(() => {
    const root = document.documentElement;
    if (visible) {
      const prev = root.style.overflow;
      root.style.overflow = 'hidden';
      return () => {
        root.style.overflow = prev;
        returnFocus.current?.focus?.({ preventScroll: true });
      };
    }
  }, [visible]);

  /* Cambio de página → se cierra. */
  useEffect(() => {
    if (cart.drawerOpen) cart.closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cart.closeDrawer();
      if (e.key === 'Tab' && panelRef.current) {
        // Foco atrapado dentro del panel mientras está abierto.
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onResize = () => {
      measure();
      paint(cart.drawerOpen ? 0 : size.current);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [visible, cart, measure, paint]);

  /* Precios siempre del servidor. */
  const itemsKey = JSON.stringify(cart.items);
  useEffect(() => {
    if (!visible || !cart.ready) return;
    if (!cart.items.length) {
      setData(null);
      return;
    }
    const items = cart.items;
    startQuote(async () => setData(await quote({ items, lang })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, itemsKey, lang, cart.ready]);

  /* ------------------------------------------------------- arrastre --- */

  const drag = useRef<{ id: number; start: number; from: number; moved: boolean } | null>(null);
  const tracker = useRef(new VelocityTracker());

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('button, a, input')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (drag.current) return; // un solo dedo manda
    spring.current?.stop();
    const p = axis.current === 'x' ? e.clientX : e.clientY;
    drag.current = { id: e.pointerId, start: p, from: value.current, moved: false };
    tracker.current.reset();
    tracker.current.add(value.current);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    const p = axis.current === 'x' ? e.clientX : e.clientY;
    const delta = p - g.start;
    if (!g.moved && Math.abs(delta) < 6) return; // histéresis antes de decidir que es arrastre
    g.moved = true;
    let next = g.from + delta;
    if (next < 0) next = rubberband(next, size.current); // resistencia al tirar hacia dentro
    tracker.current.add(next);
    paint(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    drag.current = null;
    if (!g.moved) return;
    const velocity = tracker.current.get();
    const landing = value.current + project(velocity);
    if (landing > size.current * 0.5) {
      // El estado de la cesta manda: el efecto de cierre parte de aquí con la velocidad del dedo.
      spring.current?.stop();
      spring.current = animateSpring(value.current, size.current, {
        damping: 1,
        response: 0.3,
        velocity,
        onUpdate: paint,
        onRest: () => setVisible(false)
      });
      closingByDrag.current = true;
      cart.closeDrawer();
    } else {
      runTo(0, velocity);
    }
  };

  if (!visible) return null;

  const lines = data?.lines ?? [];
  const count = cart.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="lp-drawer" role="presentation">
      <div className="lp-drawer__scrim" ref={scrimRef} onClick={() => cart.closeDrawer()} aria-hidden="true" />
      <div
        className="lp-drawer__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-drawer-title"
        tabIndex={-1}
      >
        <div
          className="lp-drawer__head"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="lp-drawer__grabber" aria-hidden="true" />
          <div className="lp-drawer__title">
            <h2 id="lp-drawer-title">{d.drawer.title}</h2>
            <span className="lp-drawer__count">{d.drawer.items(count)}</span>
          </div>
          <button ref={closeRef} className="lp-drawer__close" type="button" onClick={() => cart.closeDrawer()} aria-label={d.drawer.close}>
            <X size={18} weight="regular" />
          </button>
        </div>

        <div className="lp-drawer__body">
          {!cart.items.length ? (
            <div className="lp-drawer__empty">
              <p>{d.drawer.empty}</p>
              <Link className="lp-btn lp-btn--icon" href={path(lang, 'productos')} onClick={() => cart.closeDrawer()}>
                {d.drawer.emptyCta}
                <BtnIcon />
              </Link>
            </div>
          ) : !data ? (
            <ul className="lp-drawer__lines" aria-busy="true">
              {cart.items.map((i) => (
                <li key={i.variantId} className="lp-drawer__line lp-skeleton-row">
                  <span className="lp-skeleton lp-skeleton--img" />
                  <span className="lp-skeleton-stack">
                    <span className="lp-skeleton lp-skeleton--line" />
                    <span className="lp-skeleton lp-skeleton--short" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="lp-drawer__lines" aria-busy={loading}>
              {lines.map((l, idx) => (
                <li key={l.variantId} className="lp-drawer__line" data-unavailable={l.unavailable} style={{ '--i': idx } as React.CSSProperties}>
                  <Link className="lp-drawer__img" href={path(lang, 'productos', l.slug)} tabIndex={-1} aria-hidden="true">
                    {l.image ? <img src={l.image} alt="" /> : null}
                  </Link>
                  <div className="lp-drawer__info">
                    <Link className="lp-drawer__name" href={path(lang, 'productos', l.slug)}>
                      {l.nameText}
                    </Link>
                    <span className="lp-drawer__meta">
                      {l.variantText ? `${l.variantText} · ` : ''}
                      {formatPrice(l.unitPriceCents, lang)}
                    </span>
                    {l.unavailable ? (
                      <span className="lp-error">{d.cartPage.unavailable}</span>
                    ) : (
                      <div className="lp-drawer__qty">
                        <button type="button" aria-label={d.product.less} disabled={l.quantity <= 1} onClick={() => cart.set(l.variantId, l.quantity - 1)}>
                          <Minus size={14} />
                        </button>
                        <span aria-live="polite">{l.quantity}</span>
                        <button
                          type="button"
                          aria-label={d.product.more}
                          disabled={l.maxQuantity !== null && l.quantity >= l.maxQuantity}
                          onClick={() => cart.set(l.variantId, l.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="lp-drawer__side">
                    <span className="lp-drawer__total">{l.unavailable ? '—' : formatPrice(l.unitPriceCents * l.quantity, lang)}</span>
                    <button className="lp-drawer__remove" type="button" onClick={() => cart.remove(l.variantId)} aria-label={`${d.cartPage.remove}: ${l.nameText}`}>
                      <Trash size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.items.length ? (
          <div className="lp-drawer__foot">
            <div className="lp-drawer__sum">
              <span>{d.cartPage.subtotal}</span>
              <b>{data ? formatPrice(data.subtotalCents, lang) : '—'}</b>
            </div>
            <p className="lp-field__help">{d.drawer.note}</p>
            <Link className="lp-btn lp-btn--block lp-btn--icon lp-btn--lg" href={path(lang, 'finalizar-compra')}>
              {d.drawer.checkout}
              <BtnIcon />
            </Link>
            <Link className="lp-drawer__more" href={path(lang, 'carrito')}>
              {d.drawer.viewCart}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
