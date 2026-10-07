'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Amp, Sheen } from './brand';
import { useCart } from './cart';
import { placeOrder, payRequestOrder, quote, quoteRequest, type CheckoutPayload, type CheckoutResult, type QuoteResult } from '@/app/actions/shop';
import { formatPrice, loc, t } from '@/lib/i18n';
import type { Lang } from '@/lib/routes';
import type { Address } from '@/lib/db/schema';

type SavedAddress = { id: number; label: string; data: Address };
type FixedItem = { name: string; detail: string; quantity: number; totalCents: number; image: string | null };

export type CheckoutProps = {
  lang: Lang;
  mode: 'cart' | 'request';
  requestOrderId?: string;
  requestItems?: FixedItem[];
  defaults: { email: string; name: string; phone: string; notes?: string };
  loggedIn: boolean;
  loginHref: string;
  cartHref: string;
  addresses: SavedAddress[];
  countries: { code: string; name: string }[];
  termsHref: string;
  privacyHref: string;
};

/** Envía el navegador a Redsys con un POST, como exige la pasarela. */
function goToRedsys(r: { url: string; fields: Record<string, string> }) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = r.url;
  form.style.display = 'none';
  for (const [k, v] of Object.entries(r.fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutForm(props: CheckoutProps) {
  const { lang, mode } = props;
  const d = t(lang);
  const c = d.checkout;
  const cart = useCart();

  const def = props.addresses.find((a) => a.data) ?? null;
  const [email, setEmail] = useState(props.defaults.email);
  const [name, setName] = useState(props.defaults.name);
  const [phone, setPhone] = useState(props.defaults.phone);
  const initialCountry =
    def && props.countries.some((x) => x.code === def.data.country)
      ? def.data.country
      : props.countries.find((x) => x.code === 'AD')?.code ?? props.countries[0]?.code ?? '';
  const [country, setCountry] = useState(initialCountry);
  const [methodId, setMethodId] = useState<number | null>(null);
  const [addr, setAddr] = useState({
    line1: def?.data.line1 ?? '',
    line2: def?.data.line2 ?? '',
    city: def?.data.city ?? '',
    postalCode: def?.data.postalCode ?? '',
    region: def?.data.region ?? ''
  });
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [notes, setNotes] = useState(props.defaults.notes ?? '');
  const [terms, setTerms] = useState(false);
  const [saveAddress, setSaveAddress] = useState(props.loggedIn && props.addresses.length === 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [q, setQ] = useState<QuoteResult | null>(null);
  const [loading, startQuote] = useTransition();
  const firstError = useRef<HTMLDivElement>(null);

  const itemsKey = JSON.stringify(cart.items);
  useEffect(() => {
    if (mode === 'cart' && !cart.ready) return;
    startQuote(async () => {
      const res =
        mode === 'cart'
          ? await quote({ items: cart.items, lang, country, shippingMethodId: methodId, couponCode: coupon || null })
          : await quoteRequest({ publicId: props.requestOrderId ?? '', lang, country, shippingMethodId: methodId, couponCode: coupon || null });
      setQ(res);
      if (!res.options.some((o) => o.id === methodId)) setMethodId(res.options[0]?.id ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cart.ready, itemsKey, country, methodId, coupon, lang]);

  const selected = q?.options.find((o) => o.id === methodId) ?? null;
  const needsAddress = !!selected && !selected.isPickup;
  const sellable = useMemo(() => (q?.lines ?? []).filter((l) => !l.unavailable), [q]);
  const empty = mode === 'cart' && cart.ready && (cart.items.length === 0 || (q && sellable.length === 0));

  const field = (key: string) => (errors[key] ? { 'aria-invalid': 'true' as const } : {});
  const err = (key: string) => (
    <span className="lp-error" role="alert">
      {errors[key] ?? ''}
    </span>
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setMessage('');
    setErrors({});
    setSubmitting(true);
    const payload: CheckoutPayload = {
      lang,
      items: mode === 'cart' ? cart.items : undefined,
      requestOrderId: props.requestOrderId,
      email,
      name,
      phone,
      country,
      shippingMethodId: methodId,
      address: addr,
      couponCode: coupon,
      notes,
      acceptTerms: terms,
      saveAddress
    };
    let res: CheckoutResult;
    try {
      res = mode === 'cart' ? await placeOrder(payload) : await payRequestOrder(payload);
    } catch {
      res = { ok: false, errors: {}, message: c.errors.generic };
    }
    if (res.ok) {
      setMessage(c.redirecting);
      if (mode === 'cart') cart.clear();
      goToRedsys(res.redsys);
      return; // el botón queda ocupado mientras el navegador sale hacia Redsys
    }
    setErrors(res.errors);
    setMessage(res.message ?? '');
    setSubmitting(false);
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"], .lp-alert--error');
      el?.focus?.();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  }

  if (empty) {
    return (
      <div className="lp-stack" style={{ justifyItems: 'start' }}>
        <p className="lp-lead">{c.emptyCart}</p>
        <Link className="lp-btn" href={props.cartHref}>
          <Sheen />
          {d.cartPage.title}
        </Link>
      </div>
    );
  }

  const summaryItems: FixedItem[] =
    mode === 'request'
      ? props.requestItems ?? []
      : sellable.map((l) => ({
          name: l.nameText,
          detail: l.variantText ?? '',
          quantity: l.quantity,
          totalCents: l.unitPriceCents * l.quantity,
          image: l.image
        }));

  return (
    <form className="lp-shop" onSubmit={onSubmit} noValidate>
      <div className="lp-stack--lg" ref={firstError}>
        {/* Contacto */}
        <fieldset className="lp-panel lp-form" style={{ margin: 0 }}>
          <legend className="lp-eyebrow" style={{ padding: 0, marginBottom: 6 }}>
            {c.contact}
          </legend>
          {!props.loggedIn ? (
            <p className="lp-field__help">
              {c.haveAccount}{' '}
              <Link className="lp-link" href={props.loginHref}>
                {c.login}
              </Link>
            </p>
          ) : (
            <p className="lp-field__help">{c.loggedAs(email)}</p>
          )}
          <div className="lp-field">
            <label htmlFor="c-email">{c.email}</label>
            <input className="lp-input" id="c-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required {...field('email')} />
            {err('email')}
          </div>
          <div className="lp-row lp-row--2">
            <div className="lp-field">
              <label htmlFor="c-name">{c.name}</label>
              <input className="lp-input" id="c-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required {...field('name')} />
              {err('name')}
            </div>
            <div className="lp-field">
              <label htmlFor="c-phone">{c.phone}</label>
              <input className="lp-input" id="c-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required {...field('phone')} />
              {err('phone')}
            </div>
          </div>
        </fieldset>

        {/* Envío */}
        <fieldset className="lp-panel lp-form" style={{ margin: 0 }}>
          <legend className="lp-eyebrow" style={{ padding: 0, marginBottom: 6 }}>
            {c.shipping}
          </legend>
          <div className="lp-field">
            <label htmlFor="c-country">{c.country}</label>
            <select className="lp-select" id="c-country" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country" {...field('country')}>
              {props.countries.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.name}
                </option>
              ))}
            </select>
            {err('country')}
          </div>

          <div className="lp-field" role="radiogroup" aria-labelledby="c-method-label">
            <span className="lp-field__label" id="c-method-label" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--label-3)' }}>
              {c.method}
            </span>
            {q && !q.options.length ? <p className="lp-alert">{c.noMethods}</p> : null}
            <div className="lp-choices">
              {(q?.options ?? []).map((o) => (
                <label key={o.id} className="lp-choice">
                  <input type="radio" name="method" checked={methodId === o.id} onChange={() => setMethodId(o.id)} />
                  <span className="lp-choice__name">{loc(o.name, lang)}</span>
                  <span className="lp-choice__price">{o.priceCents === 0 ? c.free : formatPrice(o.priceCents, lang)}</span>
                  {loc(o.description, lang) || (o.freeOverCents && o.priceCents > 0) ? (
                    <span className="lp-choice__desc">
                      {loc(o.description, lang)}
                      {o.freeOverCents && o.priceCents > 0 ? ` ${c.freeFrom(formatPrice(o.freeOverCents, lang))}` : ''}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
            {err('method')}
          </div>

          {needsAddress ? (
            <>
              {props.addresses.length ? (
                <div className="lp-field">
                  <label htmlFor="c-saved">{c.savedAddresses}</label>
                  <select
                    className="lp-select"
                    id="c-saved"
                    defaultValue=""
                    onChange={(e) => {
                      const a = props.addresses.find((x) => String(x.id) === e.target.value);
                      if (!a) return;
                      setAddr({ line1: a.data.line1, line2: a.data.line2 ?? '', city: a.data.city, postalCode: a.data.postalCode, region: a.data.region ?? '' });
                      if (props.countries.some((x) => x.code === a.data.country)) setCountry(a.data.country);
                    }}
                  >
                    <option value="">—</option>
                    {props.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label || a.data.line1} · {a.data.city}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="lp-field">
                <label htmlFor="c-line1">{c.line1}</label>
                <input className="lp-input" id="c-line1" autoComplete="address-line1" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} {...field('line1')} />
                {err('line1')}
              </div>
              <div className="lp-field">
                <label htmlFor="c-line2">{c.line2}</label>
                <input className="lp-input" id="c-line2" autoComplete="address-line2" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} />
              </div>
              <div className="lp-row lp-row--3">
                <div className="lp-field">
                  <label htmlFor="c-city">{c.city}</label>
                  <input className="lp-input" id="c-city" autoComplete="address-level2" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} {...field('city')} />
                  {err('city')}
                </div>
                <div className="lp-field">
                  <label htmlFor="c-pc">{c.postalCode}</label>
                  <input className="lp-input" id="c-pc" autoComplete="postal-code" value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} {...field('postalCode')} />
                  {err('postalCode')}
                </div>
              </div>
              <div className="lp-field">
                <label htmlFor="c-region">{c.region}</label>
                <input className="lp-input" id="c-region" autoComplete="address-level1" value={addr.region} onChange={(e) => setAddr({ ...addr, region: e.target.value })} />
              </div>
              {props.loggedIn ? (
                <label className="lp-check">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  {c.saveAddress}
                </label>
              ) : null}
            </>
          ) : null}
        </fieldset>

        <div className="lp-panel lp-form">
          <div className="lp-field">
            <label htmlFor="c-notes">{c.notes}</label>
            <textarea className="lp-textarea" id="c-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <span className="lp-field__help">{c.notesHelp}</span>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <aside className="lp-panel lp-sticky lp-stack" aria-busy={loading}>
        <h2 style={{ fontSize: 'var(--h3)' }}>{c.summary}</h2>
        <ul className="lp-mini">
          {summaryItems.map((it, i) => (
            <li key={i}>
              <span className="lp-mini__img">
                {it.image ? <img src={it.image} alt="" /> : null}
                <span className="lp-mini__qty">{it.quantity}</span>
              </span>
              <span>
                <b>{it.name}</b>
                {it.detail ? <span className="lp-line__meta" style={{ display: 'block' }}>{it.detail}</span> : null}
              </span>
              <span style={{ fontWeight: 700 }}>{formatPrice(it.totalCents, lang)}</span>
            </li>
          ))}
        </ul>

        <div className="lp-field">
          <label htmlFor="c-coupon">{c.coupon}</label>
          {coupon && q?.coupon?.ok ? (
            <div className="lp-buy__row">
              <span className="lp-alert lp-alert--ok" style={{ flex: 1 }}>
                {q.couponMessage}
              </span>
              <button
                className="lp-textbtn"
                type="button"
                onClick={() => {
                  setCoupon('');
                  setCouponInput('');
                }}
              >
                {c.removeCoupon}
              </button>
            </div>
          ) : (
            <>
              <div className="lp-coupon">
                <input
                  className="lp-input"
                  id="c-coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setCoupon(couponInput.trim().toUpperCase());
                    }
                  }}
                  autoComplete="off"
                />
                <button className="lp-btn lp-btn--quiet lp-btn--sm" type="button" onClick={() => setCoupon(couponInput.trim().toUpperCase())}>
                  {c.apply}
                </button>
              </div>
              {coupon && q?.coupon && !q.coupon.ok ? <span className="lp-error">{q.couponMessage}</span> : null}
            </>
          )}
        </div>

        <dl className="lp-totals">
          <div>
            <dt>{c.subtotal}</dt>
            <dd>{formatPrice(q?.subtotalCents ?? 0, lang)}</dd>
          </div>
          {q?.discountCents ? (
            <div>
              <dt>{c.discount}</dt>
              <dd>−{formatPrice(q.discountCents, lang)}</dd>
            </div>
          ) : null}
          <div>
            <dt>{c.shippingCost}</dt>
            <dd>{selected ? (q?.shippingCents ? formatPrice(q.shippingCents, lang) : c.free) : '—'}</dd>
          </div>
          <div className="lp-totals__grand">
            <dt>{c.total}</dt>
            <dd>{formatPrice(q?.totalCents ?? 0, lang)}</dd>
          </div>
        </dl>
        <p className="lp-field__help" style={{ marginTop: -4 }}>
          {c.taxes}
        </p>

        <label className="lp-check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} {...field('terms')} />
          <span>
            {c.terms}{' '}
            <a className="lp-link" href={props.termsHref} target="_blank" rel="noopener">
              {c.termsLink}
            </a>{' '}
            {c.and}{' '}
            <a className="lp-link" href={props.privacyHref} target="_blank" rel="noopener">
              {c.privacyLink}
            </a>
            .
          </span>
        </label>
        {err('terms')}

        {message ? (
          <p className={`lp-alert${submitting ? '' : ' lp-alert--error'}`} tabIndex={-1} role="alert">
            {message}
          </p>
        ) : null}

        <button className="lp-btn lp-btn--block lp-btn--lg" type="submit" disabled={submitting || loading || !selected} data-busy={submitting} aria-busy={submitting}>
          <Sheen />
          {submitting ? <Amp className="lp-btn__amp" /> : null}
          {c.pay} · {formatPrice(q?.totalCents ?? 0, lang)}
        </button>
        <p className="lp-field__help">{c.secure}</p>
      </aside>
    </form>
  );
}
