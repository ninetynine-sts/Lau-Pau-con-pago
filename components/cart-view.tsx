'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { Sheen } from './brand';
import { useCart } from './cart';
import { quote, type QuoteResult } from '@/app/actions/shop';
import { formatPrice, t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';

export function CartView({ lang }: { lang: Lang }) {
  const d = t(lang);
  const cart = useCart();
  const [data, setData] = useState<QuoteResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!cart.ready) return;
    if (!cart.items.length) {
      setData(null);
      return;
    }
    const items = cart.items;
    startTransition(async () => {
      const q = await quote({ items, lang });
      setData(q);
      // Si el servidor rebaja una cantidad por falta de existencias, la cesta se ajusta.
      q.lines.forEach((l) => {
        if (!l.unavailable && l.quantity < l.requested) cart.set(l.variantId, l.quantity);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready, JSON.stringify(cart.items), lang]);

  if (!cart.ready) return <p className="lp-lead">…</p>;

  if (!cart.items.length) {
    return (
      <div className="lp-stack" style={{ justifyItems: 'start' }}>
        <p className="lp-lead">{d.cartPage.empty}</p>
        <Link className="lp-btn" href={path(lang, 'productos')}>
          <Sheen />
          {d.cartPage.browse}
        </Link>
      </div>
    );
  }

  const lines = data?.lines ?? [];
  const subtotal = data?.subtotalCents ?? 0;
  const hasSellable = lines.some((l) => !l.unavailable);

  return (
    <div className="lp-shop">
      <ul className="lp-lines" aria-busy={pending}>
        {lines.map((l) => (
          <li key={l.variantId} className="lp-line" data-unavailable={l.unavailable}>
            <Link className="lp-line__img" href={path(lang, 'productos', l.slug)} tabIndex={-1} aria-hidden="true">
              {l.image ? <img src={l.image} alt="" /> : null}
            </Link>
            <div>
              <Link className="lp-line__name" href={path(lang, 'productos', l.slug)}>
                {l.nameText}
              </Link>
              <div className="lp-line__meta">
                {l.variantText ? `${l.variantText} · ` : ''}
                {formatPrice(l.unitPriceCents, lang)}
              </div>
              {l.unavailable ? (
                <p className="lp-error" style={{ marginTop: 6 }}>
                  {d.cartPage.unavailable}
                </p>
              ) : l.maxQuantity !== null && l.requested > l.maxQuantity ? (
                <p className="lp-field__help" style={{ marginTop: 6 }}>
                  {d.cartPage.adjusted(l.maxQuantity)}
                </p>
              ) : null}
              <div className="lp-line__controls">
                {!l.unavailable ? (
                  <div className="lp-stepper lp-stepper--sm">
                    <button
                      type="button"
                      aria-label={d.product.less}
                      disabled={l.quantity <= 1}
                      onClick={() => cart.set(l.variantId, l.quantity - 1)}
                    >
                      &minus;
                    </button>
                    <input type="number" readOnly value={l.quantity} aria-label={d.product.quantity} />
                    <button
                      type="button"
                      aria-label={d.product.more}
                      disabled={l.maxQuantity !== null && l.quantity >= l.maxQuantity}
                      onClick={() => cart.set(l.variantId, l.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                ) : null}
                <button className="lp-textbtn" type="button" onClick={() => cart.remove(l.variantId)}>
                  {d.cartPage.remove}
                </button>
              </div>
            </div>
            <div className="lp-line__total">{l.unavailable ? '—' : formatPrice(l.unitPriceCents * l.quantity, lang)}</div>
          </li>
        ))}
      </ul>

      <aside className="lp-panel lp-sticky lp-stack">
        <dl className="lp-totals">
          <div className="lp-totals__grand">
            <dt>{d.cartPage.subtotal}</dt>
            <dd>{formatPrice(subtotal, lang)}</dd>
          </div>
        </dl>
        <p className="lp-field__help">{d.cartPage.shippingNote}</p>
        {hasSellable ? (
          <Link className="lp-btn lp-btn--block" href={path(lang, 'finalizar-compra')}>
            <Sheen />
            {d.cartPage.checkout}
          </Link>
        ) : null}
        <Link className="lp-link" href={path(lang, 'productos')} style={{ justifySelf: 'center', fontSize: 14 }}>
          {d.cartPage.continue}
        </Link>
      </aside>
    </div>
  );
}
