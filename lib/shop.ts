/**
 * Catálogo y cálculo de importes. Todo precio que se cobra se calcula aquí, en el
 * servidor, a partir de la base de datos: lo que envía el navegador solo dice qué
 * variantes y cuántas unidades.
 */
import 'server-only';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from './db';
import type { Localized, Personalization, ProductImage } from './db/schema';

export type CatalogVariant = {
  id: number;
  name: Localized | null;
  stock: number | null;
  priceCents: number;
};

export type CatalogProduct = {
  id: number;
  slug: string;
  ref: string;
  categoryId: string | null;
  categoryName: Localized | null;
  name: Localized;
  shortDescription: Localized;
  description: Localized;
  badge: Localized | null;
  priceCents: number;
  images: ProductImage[];
  personalization: Personalization;
  details: { label: Localized; value: Localized }[];
  featured: boolean;
  variants: CatalogVariant[];
};

export function isPersonalizable(p: { personalization: Personalization }): boolean {
  return p.personalization.mode !== 'none';
}

/** Existencias totales de las variantes activas; null si alguna no lleva control. */
export function totalStock(p: CatalogProduct): number | null {
  let total = 0;
  for (const v of p.variants) {
    if (v.stock === null) return null;
    total += Math.max(0, v.stock);
  }
  return total;
}

export async function getCategories() {
  return db.select().from(schema.categories).orderBy(asc(schema.categories.sort));
}

async function hydrate(rows: (typeof schema.products.$inferSelect)[]): Promise<CatalogProduct[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [vs, cats] = await Promise.all([
    db
      .select()
      .from(schema.variants)
      .where(and(inArray(schema.variants.productId, ids), eq(schema.variants.active, true)))
      .orderBy(asc(schema.variants.sort), asc(schema.variants.id)),
    getCategories()
  ]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    ref: p.ref,
    categoryId: p.categoryId,
    categoryName: p.categoryId ? catName.get(p.categoryId) ?? null : null,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    badge: p.badge ?? null,
    priceCents: p.priceCents,
    images: p.images,
    personalization: p.personalization,
    details: p.details,
    featured: p.featured,
    variants: vs
      .filter((v) => v.productId === p.id)
      .map((v) => ({ id: v.id, name: v.name ?? null, stock: v.stock, priceCents: v.priceCents ?? p.priceCents }))
  }));
}

export async function listProducts(): Promise<CatalogProduct[]> {
  const rows = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.active, true))
    .orderBy(asc(schema.products.sort), asc(schema.products.id));
  return hydrate(rows);
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  const rows = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.slug, slug), eq(schema.products.active, true)))
    .limit(1);
  const [p] = await hydrate(rows);
  return p ?? null;
}

/* ------------------------------------------------------------------ cesta --- */

export type CartInput = { variantId: number; quantity: number }[];

export type QuoteLine = {
  variantId: number;
  productId: number;
  slug: string;
  name: Localized;
  variantName: Localized | null;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  requested: number;
  maxQuantity: number | null;
  unavailable: boolean;
};

/** Normaliza la cesta y la contrasta con el catálogo y las existencias. */
export async function priceCart(input: CartInput): Promise<QuoteLine[]> {
  const merged = new Map<number, number>();
  for (const it of input.slice(0, 50)) {
    const id = Number(it.variantId);
    const q = Math.floor(Number(it.quantity));
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(q) || q <= 0) continue;
    merged.set(id, Math.min(99, (merged.get(id) ?? 0) + q));
  }
  if (!merged.size) return [];

  const rows = await db
    .select({ v: schema.variants, p: schema.products })
    .from(schema.variants)
    .innerJoin(schema.products, eq(schema.products.id, schema.variants.productId))
    .where(inArray(schema.variants.id, [...merged.keys()]));

  const byId = new Map(rows.map((r) => [r.v.id, r]));
  const lines: QuoteLine[] = [];
  for (const [variantId, requested] of merged) {
    const r = byId.get(variantId);
    if (!r) continue;
    const { v, p } = r;
    const sellable = p.active && v.active && p.personalization.mode === 'none';
    const max = v.stock === null ? null : Math.max(0, v.stock);
    const quantity = !sellable ? 0 : max === null ? requested : Math.min(requested, max);
    lines.push({
      variantId,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      variantName: v.name ?? null,
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

/* ------------------------------------------------------ envío y descuento --- */

export type ShippingOption = {
  id: number;
  name: Localized;
  description: Localized;
  isPickup: boolean;
  priceCents: number; // ya aplicado el «gratis a partir de»
  basePriceCents: number;
  freeOverCents: number | null;
};

export async function shippingOptions(country: string, eligibleCents: number): Promise<ShippingOption[]> {
  const cc = country.toUpperCase();
  const methods = await db
    .select()
    .from(schema.shippingMethods)
    .where(eq(schema.shippingMethods.active, true))
    .orderBy(asc(schema.shippingMethods.sort), asc(schema.shippingMethods.id));
  return methods
    .filter((m) => m.countries.includes(cc) || m.allCountries)
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      isPickup: m.isPickup,
      basePriceCents: m.priceCents,
      freeOverCents: m.freeOverCents,
      priceCents: m.freeOverCents !== null && eligibleCents >= m.freeOverCents ? 0 : m.priceCents
    }));
}

/** Países a los que hay algún envío activo (para el desplegable). */
export async function shippingCountries(): Promise<{ codes: string[]; anywhere: boolean }> {
  const methods = await db.select().from(schema.shippingMethods).where(eq(schema.shippingMethods.active, true));
  const codes = new Set<string>();
  let anywhere = false;
  for (const m of methods) {
    m.countries.forEach((c) => codes.add(c));
    if (m.allCountries) anywhere = true;
  }
  return { codes: [...codes].sort(), anywhere };
}

export type CouponResult =
  | { ok: true; code: string; kind: 'percent' | 'fixed' | 'free_shipping'; value: number }
  | { ok: false; reason: 'invalid' | 'expired' | 'notStarted' | 'exhausted' | 'minimum'; minimumCents?: number };

export async function checkCoupon(codeRaw: string, subtotalCents: number): Promise<CouponResult> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'invalid' };
  const [c] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, code)).limit(1);
  if (!c || !c.active) return { ok: false, reason: 'invalid' };
  const now = new Date();
  if (c.startsAt && c.startsAt > now) return { ok: false, reason: 'notStarted' };
  if (c.expiresAt && c.expiresAt < now) return { ok: false, reason: 'expired' };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { ok: false, reason: 'exhausted' };
  if (subtotalCents < c.minSubtotalCents) return { ok: false, reason: 'minimum', minimumCents: c.minSubtotalCents };
  return { ok: true, code: c.code, kind: c.kind, value: c.value };
}

export type Totals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  shipping: ShippingOption | null;
  options: ShippingOption[];
  coupon: CouponResult | null;
};

export async function computeTotals(opts: {
  subtotalCents: number;
  country: string;
  shippingMethodId?: number | null;
  couponCode?: string | null;
}): Promise<Totals> {
  const { subtotalCents } = opts;
  const coupon = opts.couponCode ? await checkCoupon(opts.couponCode, subtotalCents) : null;

  let discountCents = 0;
  if (coupon?.ok && coupon.kind === 'percent') discountCents = Math.round((subtotalCents * Math.min(100, coupon.value)) / 100);
  if (coupon?.ok && coupon.kind === 'fixed') discountCents = Math.min(coupon.value, subtotalCents);

  const options = opts.country ? await shippingOptions(opts.country, subtotalCents - discountCents) : [];
  const shipping = options.find((o) => o.id === opts.shippingMethodId) ?? null;
  let shippingCents = shipping?.priceCents ?? 0;
  if (coupon?.ok && coupon.kind === 'free_shipping') shippingCents = 0;

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: Math.max(0, subtotalCents - discountCents + shippingCents),
    shipping,
    options,
    coupon
  };
}

/** Descuenta existencias al confirmarse un pago. Devuelve true si alguna línea no llegaba. */
export async function consumeStock(
  tx: Pick<typeof db, 'update' | 'select'>,
  items: { variantId: number | null; quantity: number }[]
): Promise<boolean> {
  let issue = false;
  for (const it of items) {
    if (!it.variantId) continue;
    const [before] = await tx
      .select({ stock: schema.variants.stock })
      .from(schema.variants)
      .where(eq(schema.variants.id, it.variantId));
    if (!before || before.stock === null) continue;
    if (before.stock < it.quantity) issue = true;
    await tx
      .update(schema.variants)
      .set({ stock: sql`greatest(0, ${schema.variants.stock} - ${it.quantity})` })
      .where(eq(schema.variants.id, it.variantId));
  }
  return issue;
}
