/**
 * Lógica de la tienda en la demo. Reproduce lib/shop.ts y lib/orders.ts sobre la
 * base de datos en memoria; los correos usan las plantillas reales (lib/emails.ts).
 */
import { db, nextId, nowIso, save, token, type Order, type Product, type Req } from './store';
import type { Localized, Personalization, ProductImage } from '@/lib/db/schema';
import type { Lang } from '@/lib/routes';
import {
  orderConfirmationMail,
  orderShippedMail,
  pickupReadyMail,
  quoteReadyMail,
  requestReceivedMail,
  requestRejectedMail,
  storeNewOrderMail,
  storeNewRequestMail,
  type OrderForMail
} from '@/lib/emails';

/* ------------------------------------------------------------- catálogo --- */

export type { CatalogVariant, CatalogProduct } from '@/lib/catalog';
import type { CatalogProduct } from '@/lib/catalog';

export const isPersonalizable = (p: { personalization: Personalization }) => p.personalization.mode !== 'none';

export function totalStock(p: CatalogProduct): number | null {
  let t = 0;
  for (const v of p.variants) {
    if (v.stock === null) return null;
    t += Math.max(0, v.stock);
  }
  return t;
}

function hydrate(p: Product): CatalogProduct {
  const cat = db.categories.find((c) => c.id === p.categoryId);
  return {
    ...p,
    categoryName: cat?.name ?? null,
    variants: db.variants
      .filter((v) => v.productId === p.id && v.active)
      .sort((a, b) => a.sort - b.sort || a.id - b.id)
      .map((v) => ({ id: v.id, name: v.name, color: v.color, stock: v.stock, priceCents: v.priceCents ?? p.priceCents }))
  };
}

export function listProducts(): CatalogProduct[] {
  return db.products
    .filter((p) => p.active)
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .map(hydrate);
}

export function getProduct(slug: string): CatalogProduct | null {
  const p = db.products.find((x) => x.slug === slug && x.active);
  return p ? hydrate(p) : null;
}

/* ------------------------------------------------------------- importes --- */

export type CartInput = { variantId: number; quantity: number }[];

export function priceCart(input: CartInput) {
  const merged = new Map<number, number>();
  for (const it of input.slice(0, 50)) {
    const id = Number(it.variantId);
    const q = Math.floor(Number(it.quantity));
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(q) || q <= 0) continue;
    merged.set(id, Math.min(99, (merged.get(id) ?? 0) + q));
  }
  const lines = [];
  for (const [variantId, requested] of merged) {
    const v = db.variants.find((x) => x.id === variantId);
    const p = v && db.products.find((x) => x.id === v.productId);
    if (!v || !p) continue;
    const sellable = p.active && v.active && p.personalization.mode === 'none';
    const max = v.stock === null ? null : Math.max(0, v.stock);
    const quantity = !sellable ? 0 : max === null ? requested : Math.min(requested, max);
    lines.push({
      variantId,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      variantName: v.name,
      image: p.images[0]?.src ?? null,
      unitPriceCents: v.priceCents ?? p.priceCents,
      quantity,
      requested,
      maxQuantity: max,
      unavailable: !sellable || quantity === 0
    });
  }
  return lines;
}

export type ShippingOption = {
  id: number;
  name: Localized;
  description: Localized;
  isPickup: boolean;
  priceCents: number;
  basePriceCents: number;
  freeOverCents: number | null;
};

export function shippingOptions(country: string, eligible: number): ShippingOption[] {
  const cc = country.toUpperCase();
  return db.shipping
    .filter((m) => m.active && (m.countries.includes(cc) || m.allCountries))
    .sort((a, b) => a.sort - b.sort || a.id - b.id)
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      isPickup: m.isPickup,
      basePriceCents: m.priceCents,
      freeOverCents: m.freeOverCents,
      priceCents: m.freeOverCents !== null && eligible >= m.freeOverCents ? 0 : m.priceCents
    }));
}

export function shippingCountries() {
  const codes = new Set<string>();
  let anywhere = false;
  for (const m of db.shipping.filter((x) => x.active)) {
    m.countries.forEach((c) => codes.add(c));
    if (m.allCountries) anywhere = true;
  }
  return { codes: [...codes].sort(), anywhere };
}

export type CouponResult =
  | { ok: true; code: string; kind: 'percent' | 'fixed' | 'free_shipping'; value: number }
  | { ok: false; reason: 'invalid' | 'expired' | 'notStarted' | 'exhausted' | 'minimum'; minimumCents?: number };

export function checkCoupon(raw: string, subtotal: number): CouponResult {
  const code = raw.trim().toUpperCase();
  const c = db.coupons.find((x) => x.code === code);
  if (!c || !c.active) return { ok: false, reason: 'invalid' };
  const n = new Date();
  if (c.startsAt && new Date(c.startsAt) > n) return { ok: false, reason: 'notStarted' };
  if (c.expiresAt && new Date(c.expiresAt) < n) return { ok: false, reason: 'expired' };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { ok: false, reason: 'exhausted' };
  if (subtotal < c.minSubtotalCents) return { ok: false, reason: 'minimum', minimumCents: c.minSubtotalCents };
  return { ok: true, code: c.code, kind: c.kind, value: c.value };
}

export function computeTotals(o: { subtotalCents: number; country: string; shippingMethodId?: number | null; couponCode?: string | null }) {
  const coupon = o.couponCode ? checkCoupon(o.couponCode, o.subtotalCents) : null;
  let discountCents = 0;
  if (coupon?.ok && coupon.kind === 'percent') discountCents = Math.round((o.subtotalCents * Math.min(100, coupon.value)) / 100);
  if (coupon?.ok && coupon.kind === 'fixed') discountCents = Math.min(coupon.value, o.subtotalCents);
  const options = o.country ? shippingOptions(o.country, o.subtotalCents - discountCents) : [];
  const shipping = options.find((x) => x.id === o.shippingMethodId) ?? null;
  let shippingCents = shipping?.priceCents ?? 0;
  if (coupon?.ok && coupon.kind === 'free_shipping') shippingCents = 0;
  return {
    subtotalCents: o.subtotalCents,
    discountCents,
    shippingCents,
    totalCents: Math.max(0, o.subtotalCents - discountCents + shippingCents),
    shipping,
    options,
    coupon
  };
}

/* --------------------------------------------------------------- correos --- */

const SITE = 'https://demo.laupau';

export function sendMail(m: { to: string; subject: string; html: string }) {
  const html = m.html.replaceAll(SITE, '').replaceAll('src="/laupau', 'src="laupau');
  db.emails.unshift({ id: nextId(), to: m.to, subject: m.subject, html, at: nowIso(), read: false });
}

export function orderForMail(orderId: number): OrderForMail | null {
  const o = db.orders.find((x) => x.id === orderId);
  if (!o) return null;
  return {
    id: o.id,
    publicId: o.publicId,
    lang: o.lang,
    email: o.email,
    customerName: o.customerName,
    phone: o.phone,
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    couponCode: o.couponCode,
    customerNotes: o.customerNotes,
    shippingAddress: o.shippingAddress,
    shippingName: o.shippingName,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    stockIssue: o.stockIssue,
    items: db.items
      .filter((i) => i.orderId === o.id)
      .map((i) => ({ name: i.name, variantName: i.variantName, quantity: i.quantity, unitPriceCents: i.unitPriceCents, personalization: i.personalization }))
  };
}

const reqForMail = (r: Req) => ({ ...r, personalization: r.personalization ?? null });

export function mailRequestReceived(r: Req) {
  sendMail(requestReceivedMail(reqForMail(r)));
  sendMail(storeNewRequestMail({ ...reqForMail(r), id: r.id }, db.settings.notifyEmail));
}

export function mailQuote(r: Req, o: Order, unit: number, message: string | null) {
  sendMail(quoteReadyMail(reqForMail(r), { publicId: o.publicId, totalCents: unit * r.quantity, unitCents: unit, expiresAt: new Date(o.paymentLinkExpiresAt!) }, message));
}

export function mailRejected(r: Req, message: string | null) {
  sendMail(requestRejectedMail(reqForMail(r), message));
}

export function mailShipped(orderId: number) {
  const m = orderForMail(orderId);
  if (m) sendMail(m.shippingAddress ? orderShippedMail(m) : pickupReadyMail(m));
}

/* ----------------------------------------------------- pedidos y Redsys --- */

export function newDsOrder(): string {
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const a = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rest = '';
  for (let i = 0; i < 8; i += 1) rest += a[Math.floor(Math.random() * a.length)];
  return digits + rest;
}

export type SimRedsys = { url: string; fields: Record<string, string> };

/** Abre un intento de pago y devuelve el «formulario» para la pasarela simulada. */
export function startPayment(orderId: number): SimRedsys {
  const o = db.orders.find((x) => x.id === orderId)!;
  const dsOrder = newDsOrder();
  db.payments.push({ id: nextId(), orderId, dsOrder, amountCents: o.totalCents, status: 'created', responseCode: null, authCode: null, updatedAt: nowIso() });
  save();
  const back = `/${o.lang}/${o.lang === 'ca' ? 'comanda' : 'pedido'}/${o.publicId}`;
  const params = {
    DS_MERCHANT_AMOUNT: String(o.totalCents),
    DS_MERCHANT_ORDER: dsOrder,
    DS_MERCHANT_MERCHANTCODE: '999008881',
    DS_MERCHANT_CURRENCY: '978',
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: '1',
    DS_MERCHANT_MERCHANTURL: '/api/redsys/notify',
    DS_MERCHANT_URLOK: `${back}?r=ok`,
    DS_MERCHANT_URLKO: `${back}?r=ko`,
    DS_MERCHANT_CONSUMERLANGUAGE: o.lang === 'ca' ? '003' : '001',
    DS_MERCHANT_PRODUCTDESCRIPTION: `Lau&Pau · LP-${1000 + o.id}`,
    DS_MERCHANT_TITULAR: o.customerName
  };
  return {
    url: 'redsys-sim',
    fields: {
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: btoa(unescape(encodeURIComponent(JSON.stringify(params)))),
      Ds_Signature: '(firma simulada en la demo)'
    }
  };
}

/** Lo que haría la notificación online de Redsys al servidor. */
export function applyNotification(dsOrder: string, authorized: boolean): 'paid' | 'denied' | 'duplicate' {
  const pay = db.payments.find((p) => p.dsOrder === dsOrder);
  if (!pay) return 'denied';
  if (!authorized) {
    if (pay.status === 'created') Object.assign(pay, { status: 'denied', responseCode: '0190', updatedAt: nowIso() });
    save();
    return 'denied';
  }
  if (pay.status === 'authorized') return 'duplicate';
  Object.assign(pay, { status: 'authorized', responseCode: '0000', authCode: String(100000 + Math.floor(Math.random() * 899999)), updatedAt: nowIso() });
  const o = db.orders.find((x) => x.id === pay.orderId)!;
  if (o.status !== 'pending_payment') {
    save();
    return 'duplicate';
  }
  o.status = 'paid';
  o.paidAt = nowIso();
  if (o.source === 'cart') {
    for (const it of db.items.filter((i) => i.orderId === o.id)) {
      const v = db.variants.find((x) => x.id === it.variantId);
      if (v && v.stock !== null) {
        if (v.stock < it.quantity) o.stockIssue = true;
        v.stock = Math.max(0, v.stock - it.quantity);
      }
    }
  }
  if (o.couponCode) {
    const c = db.coupons.find((x) => x.code === o.couponCode);
    if (c) c.usedCount += 1;
  }
  if (o.source === 'request') db.requests.filter((r) => r.orderId === o.id).forEach((r) => (r.status = 'paid'));
  const m = orderForMail(o.id)!;
  sendMail(orderConfirmationMail(m));
  sendMail(storeNewOrderMail(m, db.settings.notifyEmail));
  save();
  return 'paid';
}

export function newOrder(o: Omit<Order, 'id' | 'publicId' | 'status' | 'adminNotes' | 'trackingNumber' | 'trackingUrl' | 'stockIssue' | 'paidAt' | 'shippedAt' | 'createdAt' | 'paymentLinkExpiresAt'> & { paymentLinkExpiresAt?: string | null }): Order {
  const order: Order = {
    ...o,
    id: nextId(),
    publicId: token(),
    status: 'pending_payment',
    adminNotes: null,
    trackingNumber: null,
    trackingUrl: null,
    stockIssue: false,
    paidAt: null,
    shippedAt: null,
    createdAt: nowIso(),
    paymentLinkExpiresAt: o.paymentLinkExpiresAt ?? null
  };
  db.orders.push(order);
  return order;
}

export function orderByPublicId(publicId: string) {
  const o = db.orders.find((x) => x.publicId === publicId);
  if (!o) return null;
  const items = db.items.filter((i) => i.orderId === o.id);
  const pays = db.payments.filter((p) => p.orderId === o.id);
  return { ...o, items, lastPayment: pays[pays.length - 1] ?? null };
}

export const langOf = (v: unknown): Lang => (v === 'ca' ? 'ca' : 'es');
