/**
 * Base de datos de la demo, en memoria (y guardada en este navegador si se puede).
 * Misma forma que las tablas reales; los importes en céntimos.
 */
import { useSyncExternalStore } from 'react';
import * as seed from '@/scripts/seed-data.mjs';
import type { Lang } from '@/lib/routes';
import type { Address, ItemPersonalization, Localized, Personalization, ProductImage } from '@/lib/db/schema';

export type Product = {
  id: number;
  slug: string;
  ref: string;
  categoryId: string | null;
  name: Localized;
  shortDescription: Localized;
  description: Localized;
  badge: Localized | null;
  priceCents: number;
  images: ProductImage[];
  personalization: Personalization;
  details: { label: Localized; value: Localized }[];
  active: boolean;
  featured: boolean;
  sort: number;
};
export type Variant = { id: number; productId: number; name: Localized | null; sku: string; stock: number | null; priceCents: number | null; active: boolean; sort: number };
export type Shipping = {
  id: number;
  name: Localized;
  description: Localized;
  countries: string[];
  allCountries: boolean;
  isPickup: boolean;
  priceCents: number;
  freeOverCents: number | null;
  active: boolean;
  sort: number;
};
export type Coupon = {
  id: number;
  code: string;
  kind: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  minSubtotalCents: number;
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
};
export type OrderStatus = 'pending_payment' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type Order = {
  id: number;
  publicId: string;
  userId: number | null;
  source: 'cart' | 'request';
  status: OrderStatus;
  lang: Lang;
  email: string;
  customerName: string;
  phone: string | null;
  shippingAddress: Address | null;
  shippingMethodId: number | null;
  shippingName: Localized | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  stockIssue: boolean;
  paymentLinkExpiresAt: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  createdAt: string;
};
export type OrderItem = {
  id: number;
  orderId: number;
  productId: number | null;
  variantId: number | null;
  name: Localized;
  variantName: Localized | null;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  personalization: ItemPersonalization;
};
export type Payment = { id: number; orderId: number; dsOrder: string; amountCents: number; status: 'created' | 'authorized' | 'denied'; responseCode: string | null; authCode: string | null; updatedAt: string };
export type RequestStatus = 'new' | 'quoted' | 'paid' | 'rejected' | 'expired';
export type Req = {
  id: number;
  publicId: string;
  userId: number | null;
  status: RequestStatus;
  lang: Lang;
  email: string;
  name: string;
  phone: string | null;
  productId: number | null;
  productName: Localized;
  variantId: number | null;
  quantity: number;
  personalization: ItemPersonalization;
  notes: string | null;
  quotedUnitCents: number | null;
  adminMessage: string | null;
  orderId: number | null;
  createdAt: string;
};
export type User = { id: number; email: string; password: string; name: string; phone: string | null; role: 'customer' | 'admin'; lang: Lang };
export type SavedAddress = { id: number; userId: number; label: string; data: Address; isDefault: boolean };
export type Email = { id: number; to: string; subject: string; html: string; at: string; read: boolean };
export type Settings = { storeEmail: string; notifyEmail: string; instagram: string; paymentLinkDays: number; shippingReviewed: boolean };

export type DB = {
  categories: { id: string; name: Localized; sort: number }[];
  products: Product[];
  variants: Variant[];
  shipping: Shipping[];
  coupons: Coupon[];
  orders: Order[];
  items: OrderItem[];
  payments: Payment[];
  requests: Req[];
  users: User[];
  addresses: SavedAddress[];
  emails: Email[];
  settings: Settings;
  session: { customerId: number | null; adminId: number | null };
  seq: number;
};

const KEY = 'lp-demo-v1';
export const ADMIN = { email: 'admin@laupau.ad', password: 'demo-laupau' };
export const CUSTOMER = { email: 'maria@exemple.ad', password: 'demo-maria' };

const now = () => new Date().toISOString();
const daysAgo = (d: number, h = 10) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, 12, 0, 0);
  return x.toISOString();
};

export function token(n = 18): string {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let s = '';
  const r = crypto.getRandomValues(new Uint8Array(n));
  for (const b of r) s += a[b % a.length];
  return s;
}

function fresh(): DB {
  const db: DB = {
    categories: seed.categories,
    products: [],
    variants: [],
    shipping: [],
    coupons: [],
    orders: [],
    items: [],
    payments: [],
    requests: [],
    users: [],
    addresses: [],
    emails: [],
    settings: { ...seed.settings },
    session: { customerId: null, adminId: null },
    seq: 1
  };
  const id = () => db.seq++;
  for (const p of seed.products as any[]) {
    const pid = id();
    db.products.push({
      id: pid,
      slug: p.slug,
      ref: p.ref,
      categoryId: p.categoryId,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      badge: p.badge ?? null,
      priceCents: p.priceCents,
      // En la demo las fotos van junto a la página: ruta relativa.
      images: p.images.map((im: ProductImage) => ({ ...im, src: im.src.replace(/^\//, '') })),
      personalization: p.personalization ?? { mode: 'none' },
      details: p.details ?? [],
      active: true,
      featured: !!p.featured,
      sort: p.sort
    });
    db.variants.push({ id: id(), productId: pid, name: null, sku: p.ref, stock: null, priceCents: null, active: true, sort: 1 });
  }
  // Ejemplo de existencias para ver el aviso de «quedan pocas».
  const bolso = db.products.find((p) => p.slug === 'bolso-cierre-hueso')!;
  db.variants.find((v) => v.productId === bolso.id)!.stock = 3;

  for (const s of seed.shippingMethods as any[]) db.shipping.push({ id: id(), ...s, active: true });
  db.coupons.push({ id: id(), code: 'BENVINGUDA', kind: 'percent', value: 10, minSubtotalCents: 0, startsAt: null, expiresAt: null, maxUses: null, usedCount: 1, active: true, createdAt: now() });

  db.users.push({ id: id(), email: ADMIN.email, password: ADMIN.password, name: 'Laura i Paula', phone: null, role: 'admin', lang: 'ca' });
  const maria = { id: id(), email: CUSTOMER.email, password: CUSTOMER.password, name: 'Maria Prova', phone: '+376 600 123', role: 'customer' as const, lang: 'ca' as Lang };
  db.users.push(maria);
  const addr: Address = { name: 'Maria Prova', line1: 'Av. Meritxell, 21, 2n 1a', city: 'Andorra la Vella', postalCode: 'AD500', country: 'AD', phone: '+376 600 123' };
  db.addresses.push({ id: id(), userId: maria.id, label: 'Casa', data: addr, isDefault: true });

  // Una comanda pagada d'exemple, per veure el tauler amb dades.
  const calcetines = db.products.find((p) => p.slug === 'calcetines-glitter')!;
  const panuelos = db.products.find((p) => p.slug === 'panuelos')!;
  const ship = db.shipping.find((s) => !s.isPickup && s.countries.includes('AD'))!;
  const o1: Order = {
    id: id(),
    publicId: token(),
    userId: maria.id,
    source: 'cart',
    status: 'paid',
    lang: 'ca',
    email: maria.email,
    customerName: maria.name,
    phone: maria.phone,
    shippingAddress: addr,
    shippingMethodId: ship.id,
    shippingName: ship.name,
    subtotalCents: 499 * 2 + 799,
    discountCents: 180,
    shippingCents: 400,
    totalCents: 499 * 2 + 799 - 180 + 400,
    couponCode: 'BENVINGUDA',
    customerNotes: 'Si pot ser, els mitjons en rosa i blau.',
    adminNotes: null,
    trackingNumber: null,
    trackingUrl: null,
    stockIssue: false,
    paymentLinkExpiresAt: null,
    paidAt: daysAgo(1),
    shippedAt: null,
    createdAt: daysAgo(1)
  };
  db.orders.push(o1);
  const im = (p: Product) => p.images[0]?.src ?? null;
  db.items.push(
    { id: id(), orderId: o1.id, productId: calcetines.id, variantId: db.variants.find((v) => v.productId === calcetines.id)!.id, name: calcetines.name, variantName: null, image: im(calcetines), unitPriceCents: 499, quantity: 2, personalization: null },
    { id: id(), orderId: o1.id, productId: panuelos.id, variantId: db.variants.find((v) => v.productId === panuelos.id)!.id, name: panuelos.name, variantName: null, image: im(panuelos), unitPriceCents: 799, quantity: 1, personalization: null }
  );
  db.payments.push({ id: id(), orderId: o1.id, dsOrder: '4821K7Q2MZ0A', amountCents: o1.totalCents, status: 'authorized', responseCode: '0000', authCode: '123456', updatedAt: daysAgo(1) });

  // Una sol·licitud nova pendent de revisar.
  const manta = db.products.find((p) => p.slug === 'manta-polar-personalizable')!;
  db.requests.push({
    id: id(),
    publicId: token(),
    userId: null,
    status: 'new',
    lang: 'es',
    email: 'lucia@ejemplo.es',
    name: 'Lucía Ejemplo',
    phone: null,
    productId: manta.id,
    productName: manta.name,
    variantId: db.variants.find((v) => v.productId === manta.id)!.id,
    quantity: 1,
    personalization: { idea: 'El nombre «Martina» bordado en una esquina, en color tostado.' },
    notes: 'Es para un regalo de nacimiento.',
    quotedUnitCents: null,
    adminMessage: null,
    orderId: null,
    createdAt: daysAgo(0, 9)
  });
  return db;
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* sin almacenamiento: se empieza de cero */
  }
  return fresh();
}

export let db: DB = load();
let version = 0;
const listeners = new Set<() => void>();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* la demo sigue funcionando en memoria */
  }
  bump();
}

export function bump() {
  version += 1;
  listeners.forEach((l) => l());
}

export function resetDemo() {
  db = fresh();
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem('lp-cart');
  } catch {
    /* nada que borrar */
  }
  save();
}

export function nextId(): number {
  return db.seq++;
}

export function useDB(): DB {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version
  );
  return db;
}

export const nowIso = now;
