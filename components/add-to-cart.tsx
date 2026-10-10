'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus } from '@phosphor-icons/react/dist/ssr';
import { BtnIcon } from './brand';
import { useCart } from './cart';
import { ColorPicker } from './color-picker';
import { swatchColors } from '@/lib/catalog';

export type BuyVariant = { id: number; name: string | null; color?: string | null; stock: number | null };

export type BuyLabels = {
  variant: string;
  color?: string;
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

/** Añadir a la cesta: sin esperas artificiales; al añadir se abre la cesta lateral. */
export function AddToCart({ variants, labels }: { variants: BuyVariant[]; labels: BuyLabels; cartHref?: string }) {
  const { add, items, openDrawer } = useCart();
  const firstAvailable = variants.find((v) => v.stock === null || v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState<number | undefined>(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<'idle' | 'added'>('idle');
  const [error, setError] = useState('');

  const v = variants.find((x) => x.id === variantId);
  const inCart = items.find((i) => i.variantId === variantId)?.quantity ?? 0;
  const max = v?.stock === null || v?.stock === undefined ? 99 : Math.max(0, v.stock - inCart);
  const soldOut = !v || (v.stock !== null && v.stock <= 0);
  const named = variants.length > 1 || variants.some((x) => x.name);
  // Si las variantes son colores (con muestra), se eligen con muestras en vez de un desplegable.
  const byColor = variants.some((x) => swatchColors(x.color).length > 0);
  const choose = (id: number) => {
    setVariantId(id);
    setStatus('idle');
    setError('');
  };

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
    add(v.id, qty);
    setStatus('added');
    setQty(1);
    openDrawer();
  };

  return (
    <div className="lp-buy">
      {byColor ? (
        <ColorPicker
          id="color"
          options={variants.map((x) => ({
            id: x.id,
            label: x.name ?? labels.chooseVariant,
            color: x.color ?? null,
            soldOut: x.stock !== null && x.stock <= 0
          }))}
          value={variantId}
          onChange={choose}
          label={labels.color ?? labels.variant}
          soldOutLabel={labels.soldOut}
        />
      ) : named ? (
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
              <Minus size={16} weight="bold" aria-hidden="true" />
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
              <Plus size={16} weight="bold" aria-hidden="true" />
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
        <button className="lp-btn lp-btn--lg lp-btn--icon" type="button" onClick={onAdd} disabled={soldOut || max <= 0}>
          {soldOut ? labels.soldOut : labels.addToCart}
          {soldOut ? null : <BtnIcon kind={status === 'added' ? 'check' : 'plus'} />}
        </button>
      </div>
      <p className="lp-status" role="status" aria-live="polite">
        {status === 'added' ? `✓ ${labels.added}` : ''}
      </p>
    </div>
  );
}
