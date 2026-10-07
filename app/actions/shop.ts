'use server';

/**
 * Acciones de la tienda pública: solicitudes de personalización, cálculo de la cesta,
 * creación del pedido y arranque del pago.
 */
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { checkRate, clientIp, getUser, isEmail, normalizeEmail, randomToken, registerFailure } from '@/lib/auth';
import { computeTotals, priceCart, type CartInput } from '@/lib/shop';
import { createOrder, startPayment } from '@/lib/orders';
import { formatPrice, loc, t } from '@/lib/i18n';
import { isLang, type Lang } from '@/lib/routes';
import { sendMailSafe } from '@/lib/mail';
import { requestReceivedMail, storeNewRequestMail } from '@/lib/emails';
import { getSettings } from '@/lib/settings';
import type { Address } from '@/lib/db/schema';

const str = (v: FormDataEntryValue | null | unknown, max = 500) => String(v ?? '').trim().slice(0, max);

/* ------------------------------------------------- solicitud personalizada --- */

export type RequestState = { ok: boolean; errors: Record<string, string>; message?: string };

export async function submitRequest(_prev: RequestState, form: FormData): Promise<RequestState> {
  const lang: Lang = isLang(form.get('lang')) ? (form.get('lang') as Lang) : 'es';
  const d = t(lang);
  const errors: Record<string, string> = {};

  // Campo trampa: los humanos no lo ven, los bots lo rellenan.
  if (str(form.get('website'))) return { ok: true, errors: {} };

  const ip = await clientIp();
  const rateKey = `req:${ip}`;
  if (!checkRate(rateKey)) return { ok: false, errors: {}, message: d.accountPages.errors.tooMany };

  const productId = Number(form.get('productId'));
  const [product] = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.id, productId), eq(schema.products.active, true)))
    .limit(1);
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
  const email = normalizeEmail(str(form.get('email'), 254));
  if (!isEmail(email)) errors.email = d.checkout.errors.email;
  const phone = str(form.get('phone'), 40) || null;

  // Variante: los personalizables suelen tener una sola.
  const [variant] = await db
    .select()
    .from(schema.variants)
    .where(and(eq(schema.variants.productId, product.id), eq(schema.variants.active, true)))
    .limit(1);

  if (Object.keys(errors).length) return { ok: false, errors };
  registerFailure(rateKey); // cuenta como intento: máx. 8 solicitudes cada 15 min por IP

  const user = await getUser();
  const [request] = await db
    .insert(schema.requests)
    .values({
      publicId: randomToken(18),
      userId: user?.id ?? null,
      lang,
      email,
      name,
      phone,
      productId: product.id,
      productName: product.name,
      variantId: variant?.id ?? null,
      quantity,
      personalization,
      notes: notes || null
    })
    .returning();

  const settings = await getSettings();
  const forMail = { ...request, lang, personalization: request.personalization ?? null };
  await sendMailSafe(requestReceivedMail(forMail));
  await sendMailSafe(storeNewRequestMail({ ...forMail, id: request.id }, settings.notifyEmail));
  return { ok: true, errors: {} };
}

/* ------------------------------------------------------- cesta y totales --- */

export type QuoteResult = Awaited<ReturnType<typeof quote>>;

export async function quote(input: {
  items: CartInput;
  lang: Lang;
  country?: string;
  shippingMethodId?: number | null;
  couponCode?: string | null;
}) {
  const lang = isLang(input.lang) ? input.lang : 'es';
  const lines = await priceCart(input.items ?? []);
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const totals = await computeTotals({
    subtotalCents,
    country: (input.country ?? '').slice(0, 2),
    shippingMethodId: input.shippingMethodId ?? null,
    couponCode: input.couponCode ?? null
  });
  return {
    lines: lines.map((l) => ({
      ...l,
      nameText: loc(l.name, lang),
      variantText: l.variantName ? loc(l.variantName, lang) : null
    })),
    ...totals,
    couponMessage: couponMessage(totals.coupon, lang)
  };
}

/** Totales de un pedido de personalización: el subtotal lo fija la tienda, aquí solo cambia el envío. */
export async function quoteRequest(input: {
  publicId: string;
  lang: Lang;
  country?: string;
  shippingMethodId?: number | null;
  couponCode?: string | null;
}) {
  const lang = isLang(input.lang) ? input.lang : 'es';
  const [order] = await db
    .select({ subtotalCents: schema.orders.subtotalCents })
    .from(schema.orders)
    .where(and(eq(schema.orders.publicId, str(input.publicId, 64)), eq(schema.orders.source, 'request')))
    .limit(1);
  const totals = await computeTotals({
    subtotalCents: order?.subtotalCents ?? 0,
    country: (input.country ?? '').slice(0, 2),
    shippingMethodId: input.shippingMethodId ?? null,
    couponCode: input.couponCode ?? null
  });
  return { lines: [], ...totals, couponMessage: couponMessage(totals.coupon, lang) };
}

function couponMessage(c: Awaited<ReturnType<typeof computeTotals>>['coupon'], lang: Lang): string | null {
  if (!c) return null;
  const d = t(lang).checkout;
  if (c.ok) return d.couponApplied(c.code);
  if (c.reason === 'minimum') return d.couponErrors.minimum(formatPrice(c.minimumCents ?? 0, lang));
  return d.couponErrors[c.reason];
}

/* --------------------------------------------------------------- compra --- */

export type CheckoutPayload = {
  lang: Lang;
  items?: CartInput; // compra desde la cesta
  requestOrderId?: string; // pago de una personalización (publicId del pedido)
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

export type CheckoutResult =
  | { ok: true; redsys: { url: string; fields: Record<string, string> } }
  | { ok: false; errors: Record<string, string>; message?: string };

function validateContact(p: CheckoutPayload, lang: Lang) {
  const d = t(lang).checkout.errors;
  const errors: Record<string, string> = {};
  const email = normalizeEmail(str(p.email, 254));
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

async function resolveShipping(p: CheckoutPayload, lang: Lang, subtotalCents: number, country: string, errors: Record<string, string>) {
  const d = t(lang).checkout.errors;
  const totals = await computeTotals({
    subtotalCents,
    country,
    shippingMethodId: p.shippingMethodId,
    couponCode: str(p.couponCode, 40) || null
  });
  if (!totals.shipping) errors.method = d.method;
  let address: Address | null = null;
  if (totals.shipping && !totals.shipping.isPickup) {
    const a = p.address ?? ({} as CheckoutPayload['address']);
    const line1 = str(a.line1, 200);
    const city = str(a.city, 120);
    const postalCode = str(a.postalCode, 20);
    if (!line1) errors.line1 = d.required;
    if (!city) errors.city = d.required;
    if (!postalCode) errors.postalCode = d.required;
    address = {
      name: str(p.name, 120),
      line1,
      line2: str(a.line2, 200) || undefined,
      city,
      postalCode,
      region: str(a.region, 120) || undefined,
      country,
      phone: str(p.phone, 40) || undefined
    };
  }
  // Un cupón no válido no bloquea la compra: simplemente no se aplica.
  const couponCode = totals.coupon?.ok ? totals.coupon.code : null;
  return { totals, address, couponCode };
}

async function maybeSaveAddress(userId: number | undefined, save: boolean, address: Address | null) {
  if (!userId || !save || !address) return;
  const existing = await db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId));
  const same = existing.some((e) => e.data.line1 === address.line1 && e.data.postalCode === address.postalCode);
  if (!same) await db.insert(schema.addresses).values({ userId, data: address, isDefault: existing.length === 0 });
}

export async function placeOrder(p: CheckoutPayload): Promise<CheckoutResult> {
  const lang: Lang = isLang(p.lang) ? p.lang : 'es';
  const d = t(lang).checkout.errors;
  const { errors, email, name, phone, country } = validateContact(p, lang);

  const lines = await priceCart(p.items ?? []);
  const sellable = lines.filter((l) => !l.unavailable);
  if (!sellable.length) return { ok: false, errors, message: t(lang).checkout.emptyCart };
  if (sellable.some((l) => l.quantity < l.requested) || lines.some((l) => l.unavailable)) {
    return { ok: false, errors, message: d.stock };
  }
  const subtotalCents = sellable.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const { totals, address, couponCode } = await resolveShipping(p, lang, subtotalCents, country, errors);
  if (Object.keys(errors).length) return { ok: false, errors };

  const user = await getUser();
  try {
    const order = await createOrder({
      userId: user?.id ?? null,
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
      customerNotes: str(p.notes, 1000) || null,
      items: sellable.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        name: l.name,
        variantName: l.variantName,
        image: l.image,
        unitPriceCents: l.unitPriceCents,
        quantity: l.quantity
      }))
    });
    await maybeSaveAddress(user?.id, p.saveAddress, address);
    const form = await startPayment(order.id);
    return { ok: true, redsys: { url: form.url, fields: form.fields } };
  } catch (e) {
    console.error('[checkout]', e);
    return { ok: false, errors: {}, message: d.generic };
  }
}

/** Pago de un pedido nacido de una solicitud: completa envío y datos y arranca Redsys. */
export async function payRequestOrder(p: CheckoutPayload): Promise<CheckoutResult> {
  const lang: Lang = isLang(p.lang) ? p.lang : 'es';
  const d = t(lang).checkout.errors;
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.publicId, str(p.requestOrderId, 64)), eq(schema.orders.source, 'request')))
    .limit(1);
  if (!order || order.status !== 'pending_payment') return { ok: false, errors: {}, message: t(lang).payLink.paid };
  if (order.paymentLinkExpiresAt && order.paymentLinkExpiresAt < new Date()) {
    return { ok: false, errors: {}, message: t(lang).payLink.expired };
  }

  const { errors, email, name, phone, country } = validateContact(p, lang);
  const { totals, address, couponCode } = await resolveShipping(p, lang, order.subtotalCents, country, errors);
  if (Object.keys(errors).length) return { ok: false, errors };

  const user = await getUser();
  try {
    await db
      .update(schema.orders)
      .set({
        email,
        customerName: name,
        phone,
        userId: order.userId ?? user?.id ?? null,
        shippingAddress: address,
        shippingMethodId: totals.shipping!.id,
        shippingName: totals.shipping!.name,
        discountCents: totals.discountCents,
        shippingCents: totals.shippingCents,
        totalCents: totals.totalCents,
        couponCode,
        customerNotes: str(p.notes, 1000) || order.customerNotes,
        updatedAt: new Date()
      })
      .where(eq(schema.orders.id, order.id));
    await maybeSaveAddress(user?.id, p.saveAddress, address);
    const form = await startPayment(order.id);
    return { ok: true, redsys: { url: form.url, fields: form.fields } };
  } catch (e) {
    console.error('[pay-request]', e);
    return { ok: false, errors: {}, message: d.generic };
  }
}

/** Reintento de pago de un pedido pendiente (desde la página del pedido). */
export async function retryPayment(publicId: string): Promise<CheckoutResult> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.publicId, str(publicId, 64))).limit(1);
  const lang: Lang = (order?.lang as Lang) ?? 'es';
  if (!order || order.status !== 'pending_payment') return { ok: false, errors: {}, message: t(lang).payLink.paid };
  if (order.paymentLinkExpiresAt && order.paymentLinkExpiresAt < new Date()) {
    return { ok: false, errors: {}, message: t(lang).payLink.expired };
  }
  if (order.source === 'cart') {
    // Las existencias pueden haber cambiado desde que se creó el pedido.
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
    const lines = await priceCart(items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, quantity: i.quantity })));
    if (lines.some((l) => l.unavailable || l.quantity < l.requested)) {
      return { ok: false, errors: {}, message: t(lang).checkout.errors.stock };
    }
  }
  const form = await startPayment(order.id);
  return { ok: true, redsys: { url: form.url, fields: form.fields } };
}
