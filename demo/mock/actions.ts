/**
 * Sustituye a app/actions/shop.ts en la demo: misma API que las acciones del servidor,
 * para que los componentes reales (cesta, compra, solicitud) funcionen sin cambios.
 */
import { db, nextId, nowIso, save, token } from './store';
import {
  computeTotals,
  langOf,
  mailRequestReceived,
  newOrder,
  priceCart,
  startPayment,
  type CartInput,
  type CouponResult
} from './shop';
import { formatPrice, loc, t } from '@/lib/i18n';
import type { Lang } from '@/lib/routes';
import type { Address } from '@/lib/db/schema';

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const str = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* --------------------------------------------------------- solicitudes --- */

export type RequestState = { ok: boolean; errors: Record<string, string>; message?: string };

export async function submitRequest(_prev: RequestState, form: FormData): Promise<RequestState> {
  await wait();
  const lang = langOf(form.get('lang'));
  const d = t(lang);
  const errors: Record<string, string> = {};
  const product = db.products.find((p) => p.id === Number(form.get('productId')) && p.active);
  if (!product || product.personalization.mode === 'none') return { ok: false, errors: {}, message: d.checkout.errors.generic };
  const quantity = Math.floor(Number(form.get('quantity')));
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 50) errors.quantity = d.checkout.errors.required;
  const pz = product.personalization;
  let personalization: { letter?: string; idea?: string } = {};
  if (pz.mode === 'letter') {
    const raw = str(form.get('letter'), 4).normalize('NFC');
    if (!/^\p{L}$/u.test(raw)) errors.letter = d.request.letterError;
    else personalization = { letter: raw.toLocaleUpperCase(lang === 'ca' ? 'ca-ES' : 'es-ES') };
  } else if (pz.mode === 'idea') {
    const idea = str(form.get('idea'), 2000);
    if (!idea) errors.idea = d.request.ideaError;
    else if (idea.length > pz.maxLength) errors.idea = d.request.ideaTooLong(pz.maxLength);
    else personalization = { idea };
  }
  const notes = str(form.get('notes'), 2000);
  if (notes.length > 500) errors.notes = d.request.notesTooLong;
  const name = str(form.get('name'), 120);
  if (!name) errors.name = d.checkout.errors.required;
  const email = str(form.get('email'), 254).toLowerCase();
  if (!isEmail(email)) errors.email = d.checkout.errors.email;
  if (Object.keys(errors).length) return { ok: false, errors };

  const variant = db.variants.find((v) => v.productId === product.id && v.active);
  const r = {
    id: nextId(),
    publicId: token(),
    userId: db.session.customerId,
    status: 'new' as const,
    lang,
    email,
    name,
    phone: str(form.get('phone'), 40) || null,
    productId: product.id,
    productName: product.name,
    variantId: variant?.id ?? null,
    quantity,
    personalization,
    notes: notes || null,
    quotedUnitCents: null,
    adminMessage: null,
    orderId: null,
    createdAt: nowIso()
  };
  db.requests.unshift(r);
  mailRequestReceived(r);
  save();
  return { ok: true, errors: {} };
}

/* ----------------------------------------------------------- totales --- */

function couponMessage(c: CouponResult | null, lang: Lang): string | null {
  if (!c) return null;
  const d = t(lang).checkout;
  if (c.ok) return d.couponApplied(c.code);
  if (c.reason === 'minimum') return d.couponErrors.minimum(formatPrice(c.minimumCents ?? 0, lang));
  return d.couponErrors[c.reason];
}

export async function quote(input: { items: CartInput; lang: Lang; country?: string; shippingMethodId?: number | null; couponCode?: string | null }) {
  await wait(120);
  const lang = langOf(input.lang);
  const lines = priceCart(input.items ?? []);
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const totals = computeTotals({ subtotalCents, country: (input.country ?? '').slice(0, 2), shippingMethodId: input.shippingMethodId ?? null, couponCode: input.couponCode ?? null });
  return {
    lines: lines.map((l) => ({ ...l, nameText: loc(l.name, lang), variantText: l.variantName ? loc(l.variantName, lang) : null })),
    ...totals,
    couponMessage: couponMessage(totals.coupon, lang)
  };
}

export type QuoteResult = Awaited<ReturnType<typeof quote>>;

export async function quoteRequest(input: { publicId: string; lang: Lang; country?: string; shippingMethodId?: number | null; couponCode?: string | null }) {
  await wait(120);
  const lang = langOf(input.lang);
  const o = db.orders.find((x) => x.publicId === input.publicId && x.source === 'request');
  const totals = computeTotals({ subtotalCents: o?.subtotalCents ?? 0, country: (input.country ?? '').slice(0, 2), shippingMethodId: input.shippingMethodId ?? null, couponCode: input.couponCode ?? null });
  return { lines: [] as QuoteResult['lines'], ...totals, couponMessage: couponMessage(totals.coupon, lang) };
}

/* -------------------------------------------------------------- compra --- */

export type CheckoutPayload = {
  lang: Lang;
  items?: CartInput;
  requestOrderId?: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  shippingMethodId: number | null;
  address: { line1: string; line2: string; city: string; postalCode: string; region: string };
  couponCode: string;
  notes: string;
  acceptTerms: boolean;
  saveAddress: boolean;
};

export type CheckoutResult = { ok: true; redsys: { url: string; fields: Record<string, string> } } | { ok: false; errors: Record<string, string>; message?: string };

function validateContact(p: CheckoutPayload, lang: Lang) {
  const d = t(lang).checkout.errors;
  const errors: Record<string, string> = {};
  const email = str(p.email, 254).toLowerCase();
  if (!isEmail(email)) errors.email = d.email;
  const name = str(p.name, 120);
  if (!name) errors.name = d.required;
  const phone = str(p.phone, 40);
  if (!phone) errors.phone = d.required;
  const country = str(p.country, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) errors.country = d.required;
  if (!p.acceptTerms) errors.terms = d.terms;
  return { errors, email, name, phone, country };
}

function resolveShipping(p: CheckoutPayload, lang: Lang, subtotalCents: number, country: string, errors: Record<string, string>) {
  const d = t(lang).checkout.errors;
  const totals = computeTotals({ subtotalCents, country, shippingMethodId: p.shippingMethodId, couponCode: str(p.couponCode, 40) || null });
  if (!totals.shipping) errors.method = d.method;
  let address: Address | null = null;
  if (totals.shipping && !totals.shipping.isPickup) {
    const a = p.address;
    const line1 = str(a.line1, 200);
    const city = str(a.city, 120);
    const postalCode = str(a.postalCode, 20);
    if (!line1) errors.line1 = d.required;
    if (!city) errors.city = d.required;
    if (!postalCode) errors.postalCode = d.required;
    address = { name: str(p.name, 120), line1, line2: str(a.line2, 200) || undefined, city, postalCode, region: str(a.region, 120) || undefined, country, phone: str(p.phone, 40) || undefined };
  }
  return { totals, address, couponCode: totals.coupon?.ok ? totals.coupon.code : null };
}

function maybeSaveAddress(save: boolean, address: Address | null) {
  const uid = db.session.customerId;
  if (!uid || !save || !address) return;
  const existing = db.addresses.filter((a) => a.userId === uid);
  if (!existing.some((e) => e.data.line1 === address.line1 && e.data.postalCode === address.postalCode)) {
    db.addresses.push({ id: nextId(), userId: uid, label: '', data: address, isDefault: existing.length === 0 });
  }
}

export async function placeOrder(p: CheckoutPayload): Promise<CheckoutResult> {
  await wait(600);
  const lang = langOf(p.lang);
  const { errors, email, name, phone, country } = validateContact(p, lang);
  const lines = priceCart(p.items ?? []);
  const sellable = lines.filter((l) => !l.unavailable);
  if (!sellable.length) return { ok: false, errors, message: t(lang).checkout.emptyCart };
  if (sellable.some((l) => l.quantity < l.requested) || lines.some((l) => l.unavailable)) return { ok: false, errors, message: t(lang).checkout.errors.stock };
  const subtotalCents = sellable.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const { totals, address, couponCode } = resolveShipping(p, lang, subtotalCents, country, errors);
  if (Object.keys(errors).length) return { ok: false, errors };

  const order = newOrder({
    userId: db.session.customerId,
    source: 'cart',
    lang,
    email,
    customerName: name,
    phone,
    shippingAddress: address,
    shippingMethodId: totals.shipping!.id,
    shippingName: totals.shipping!.name,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
    couponCode,
    customerNotes: str(p.notes, 1000) || null
  });
  for (const l of sellable) {
    db.items.push({ id: nextId(), orderId: order.id, productId: l.productId, variantId: l.variantId, name: l.name, variantName: l.variantName, image: l.image, unitPriceCents: l.unitPriceCents, quantity: l.quantity, personalization: null });
  }
  maybeSaveAddress(p.saveAddress, address);
  save();
  return { ok: true, redsys: startPayment(order.id) };
}

export async function payRequestOrder(p: CheckoutPayload): Promise<CheckoutResult> {
  await wait(600);
  const lang = langOf(p.lang);
  const order = db.orders.find((o) => o.publicId === p.requestOrderId && o.source === 'request');
  if (!order || order.status !== 'pending_payment') return { ok: false, errors: {}, message: t(lang).payLink.paid };
  if (order.paymentLinkExpiresAt && new Date(order.paymentLinkExpiresAt) < new Date()) return { ok: false, errors: {}, message: t(lang).payLink.expired };
  const { errors, email, name, phone, country } = validateContact(p, lang);
  const { totals, address, couponCode } = resolveShipping(p, lang, order.subtotalCents, country, errors);
  if (Object.keys(errors).length) return { ok: false, errors };
  Object.assign(order, {
    email,
    customerName: name,
    phone,
    userId: order.userId ?? db.session.customerId,
    shippingAddress: address,
    shippingMethodId: totals.shipping!.id,
    shippingName: totals.shipping!.name,
    discountCents: totals.discountCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
    couponCode,
    customerNotes: str(p.notes, 1000) || order.customerNotes
  });
  maybeSaveAddress(p.saveAddress, address);
  save();
  return { ok: true, redsys: startPayment(order.id) };
}

export async function retryPayment(publicId: string): Promise<CheckoutResult> {
  await wait(400);
  const order = db.orders.find((o) => o.publicId === publicId);
  const lang = (order?.lang ?? 'es') as Lang;
  if (!order || order.status !== 'pending_payment') return { ok: false, errors: {}, message: t(lang).payLink.paid };
  if (order.source === 'cart') {
    const items = db.items.filter((i) => i.orderId === order.id && i.variantId);
    const lines = priceCart(items.map((i) => ({ variantId: i.variantId!, quantity: i.quantity })));
    if (lines.some((l) => l.unavailable || l.quantity < l.requested)) return { ok: false, errors: {}, message: t(lang).checkout.errors.stock };
  }
  return { ok: true, redsys: startPayment(order.id) };
}
