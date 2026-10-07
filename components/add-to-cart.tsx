'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Amp, Sheen } from './brand';
import { useCart } from './cart';

export type BuyVariant = { id: number; name: string | null; stock: number | null };

export type BuyLabels = {
  variant: string;
  chooseVariant: string;
  quantity: string;
  less: string;
  more: string;
  addToCart: string;
  added: string;
  viewCart: string;
  soldOut: string;
  inStock: string;
  fewLeft: string; // con {n}
  fewLeftOne: string;
  maxStock: string; // con {n}
};

export function AddToCart({ variants, labels, cartHref }: { variants: BuyVariant[]; labels: BuyLabels; cartHref: string }) {
  const { add, items } = useCart();
  const firstAvailable = variants.find((v) => v.stock === null || v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState<number | undefined>(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<'idle' | 'busy' | 'added'>('idle');
  const [error, setError] = useState('');

  const v = variants.find((x) => x.id === variantId);
  const inCart = items.find((i) => i.variantId === variantId)?.quantity ?? 0;
  const max = v?.stock === null || v?.stock === undefined ? 99 : Math.max(0, v.stock - inCart);
  const soldOut = !v || (v.stock !== null && v.stock <= 0);
  const named = variants.length > 1 || variants.some((x) => x.name);

  const stockText = useMemo(() => {
    if (!v) return null;
    if (v.stock === null) return { level: 'ok', text: labels.inStock };
    if (v.stock <= 0) return { level: 'out', text: labels.soldOut };
    if (v.stock <= 3) return { level: 'low', text: v.stock === 1 ? labels.fewLeftOne : labels.fewLeft.replace('{n}', String(v.stock)) };
    return { level: 'ok', text: labels.inStock };
  }, [v, labels]);

  const onAdd = () => {
    setError('');
    if (!v || soldOut) return;
    if (qty > max) {
      setError(labels.maxStock.replace('{n}', String(v.stock ?? 0)));
      return;
    }
    setStatus('busy');
    window.setTimeout(() => {
      add(v.id, qty);
      setStatus('added');
      setQty(1);
    }, 450);
  };

  return (
    <div className="lp-buy">
      {named ? (
        <div className="lp-field">
          <label htmlFor="variante">{labels.variant}</label>
          <select
            id="variante"
            className="lp-select"
            value={variantId}
            onChange={(e) => {
              setVariantId(Number(e.target.value));
              setStatus('idle');
              setError('');
            }}
          >
            {variants.map((x) => (
              <option key={x.id} value={x.id} disabled={x.stock !== null && x.stock <= 0}>
                {x.name ?? labels.chooseVariant}
                {x.stock !== null && x.stock <= 0 ? ` · ${labels.soldOut}` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {stockText ? (
        <span className="lp-stock" data-level={stockText.level}>
          {stockText.text}
        </span>
      ) : null}

      {!soldOut ? (
        <div className="lp-field">
          <label htmlFor="cantidad">{labels.quantity}</label>
          <div className="lp-stepper">
            <button type="button" aria-label={labels.less} disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
              &minus;
            </button>
            <input
              id="cantidad"
              type="number"
              inputMode="numeric"
              min={1}
              max={max || 1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(99, Math.floor(Number(e.target.value) || 1))))}
            />
            <button type="button" aria-label={labels.more} disabled={qty >= max} onClick={() => setQty((q) => Math.min(max || 1, q + 1))}>
              +
            </button>
          </div>
          {error ? (
            <span className="lp-error" role="alert">
              {error}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="lp-buy__row">
        <button
          className="lp-btn lp-btn--lg"
          type="button"
          onClick={onAdd}
          disabled={soldOut || max <= 0}
          data-busy={status === 'busy'}
          aria-busy={status === 'busy'}
        >
          <Sheen />
          {status === 'busy' ? <Amp className="lp-btn__amp" /> : null}
          {soldOut ? labels.soldOut : labels.addToCart}
        </button>
        {status === 'added' ? (
          <Link className="lp-btn lp-btn--ghost" href={cartHref}>
            <Sheen />
            {labels.viewCart} &rarr;
          </Link>
        ) : null}
      </div>
      <p className="lp-status" role="status" aria-live="polite">
        {status === 'added' ? `✓ ${labels.added}` : ''}
      </p>
    </div>
  );
}
