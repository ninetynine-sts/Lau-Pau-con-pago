/**
 * Pedidos y pagos.
 *
 * Un pedido nace «pendiente de pago». Solo la notificación firmada de Redsys lo pasa a
 * «pagado»: volver a la URL de OK no demuestra nada.
 */
import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db, schema } from './db';
import { env } from './env';
import { createPaymentForm, newDsOrder, verifyNotification, type RedsysForm } from './redsys';
import { randomToken } from './auth';
import { consumeStock } from './shop';
import { path, type Lang } from './routes';
import { sendMailSafe } from './mail';
import { orderConfirmationMail, storeNewOrderMail, type OrderForMail } from './emails';
import { getSettings } from './settings';
import { orderNumber } from './i18n';
import type { Address, ItemPersonalization, Localized } from './db/schema';

export type NewOrderItem = {
  productId: number | null;
  variantId: number | null;
  name: Localized;
  variantName: Localized | null;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  personalization?: ItemPersonalization;
};

export type NewOrder = {
  userId: number | null;
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
  items: NewOrderItem[];
};

export async function createOrder(o: NewOrder, source: 'cart' | 'request' = 'cart') {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(schema.orders)
      .values({
        publicId: randomToken(18),
        source,
        status: 'pending_payment',
        userId: o.userId,
        lang: o.lang,
        email: o.email,
        customerName: o.customerName,
        phone: o.phone,
        shippingAddress: o.shippingAddress,
        shippingMethodId: o.shippingMethodId,
        shippingName: o.shippingName,
        subtotalCents: o.subtotalCents,
        discountCents: o.discountCents,
        shippingCents: o.shippingCents,
        totalCents: o.totalCents,
        couponCode: o.couponCode,
        customerNotes: o.customerNotes
      })
      .returning();
    await tx.insert(schema.orderItems).values(
      o.items.map((it) => ({
        orderId: order.id,
        productId: it.productId,
        variantId: it.variantId,
        name: it.name,
        variantName: it.variantName,
        image: it.image,
        unitPriceCents: it.unitPriceCents,
        quantity: it.quantity,
        personalization: it.personalization ?? null
      }))
    );
    return order;
  });
}

/** Abre un intento de pago y devuelve el formulario firmado para Redsys. */
export async function startPayment(orderId: number): Promise<RedsysForm> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order) throw new Error('Pedido no encontrado.');
  if (order.status !== 'pending_payment') throw new Error('Este pedido no está pendiente de pago.');
  if (order.totalCents <= 0) throw new Error('Importe inválido.');

  // Reintenta si el número aleatorio coincide con uno ya usado (muy improbable).
  let dsOrder = newDsOrder();
  for (let i = 0; i < 5; i += 1) {
    const [exists] = await db.select({ id: schema.payments.id }).from(schema.payments).where(eq(schema.payments.dsOrder, dsOrder));
    if (!exists) break;
    dsOrder = newDsOrder();
  }
  await db.insert(schema.payments).values({ orderId, dsOrder, amountCents: order.totalCents });

  const lang = order.lang as Lang;
  const back = `${env.siteUrl}${path(lang, 'pedido', order.publicId)}`;
  return createPaymentForm(
    { merchantCode: env.redsys.merchantCode, terminal: env.redsys.terminal, secretKey: env.redsys.secretKey, url: env.redsys.url },
    {
      dsOrder,
      amountCents: order.totalCents,
      merchantUrl: `${env.siteUrl}/api/redsys/notify`,
      urlOk: `${back}?r=ok`,
      urlKo: `${back}?r=ko`,
      lang,
      description: `Lau&Pau · ${orderNumber(order.id)}`,
      titular: order.customerName
    }
  );
}

export async function loadOrderForMail(orderId: number): Promise<OrderForMail | null> {
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!o) return null;
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, orderId))
    .orderBy(asc(schema.orderItems.id));
  return {
    id: o.id,
    publicId: o.publicId,
    lang: o.lang as Lang,
    email: o.email,
    customerName: o.customerName,
    phone: o.phone,
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    couponCode: o.couponCode,
    customerNotes: o.customerNotes,
    shippingAddress: o.shippingAddress ?? null,
    shippingName: o.shippingName ?? null,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    stockIssue: o.stockIssue,
    items: items.map((i) => ({
      name: i.name,
      variantName: i.variantName ?? null,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      personalization: i.personalization ?? null
    }))
  };
}

export type NotificationResult =
  | { status: 'paid'; orderId: number }
  | { status: 'denied'; orderId: number }
  | { status: 'duplicate'; orderId: number }
  | { status: 'unknown' };

/**
 * Procesa la notificación online de Redsys. Idempotente: Redsys puede reintentar y
 * cada pago solo se aplica una vez.
 */
export async function handleRedsysNotification(body: Record<string, string>): Promise<NotificationResult> {
  const n = verifyNotification(env.redsys.secretKey, body); // lanza si la firma no es válida

  const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.dsOrder, n.dsOrder)).limit(1);
  if (!payment) return { status: 'unknown' };

  if (!n.authorized || n.amountCents !== payment.amountCents) {
    await db
      .update(schema.payments)
      .set({ status: 'denied', responseCode: String(n.responseCode), raw: n.params, updatedAt: new Date() })
      .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, 'created')));
    if (n.authorized) console.error(`[redsys] importe distinto en ${n.dsOrder}: ${n.amountCents} ≠ ${payment.amountCents}`);
    return { status: 'denied', orderId: payment.orderId };
  }

  const applied = await db.transaction(async (tx) => {
    // Solo una transición created → authorized: si ya se aplicó, no hace nada.
    const upd = await tx
      .update(schema.payments)
      .set({
        status: 'authorized',
        responseCode: String(n.responseCode).padStart(4, '0'),
        authCode: n.authCode ?? null,
        raw: n.params,
        updatedAt: new Date()
      })
      .where(and(eq(schema.payments.id, payment.id), sql`${schema.payments.status} <> 'authorized'`))
      .returning({ id: schema.payments.id });
    if (!upd.length) return false;

    const [order] = await tx
      .update(schema.orders)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.orders.id, payment.orderId), eq(schema.orders.status, 'pending_payment')))
      .returning();
    if (!order) return false; // ya estaba pagado por otro intento: no se toca el stock dos veces

    const items = await tx
      .select({ variantId: schema.orderItems.variantId, quantity: schema.orderItems.quantity })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));
    // Las piezas personalizadas se fabrican: no se descuentan de existencias.
    const stockIssue = order.source === 'cart' ? await consumeStock(tx, items) : false;
    if (stockIssue) await tx.update(schema.orders).set({ stockIssue: true }).where(eq(schema.orders.id, order.id));

    if (order.couponCode) {
      await tx
        .update(schema.coupons)
        .set({ usedCount: sql`${schema.coupons.usedCount} + 1` })
        .where(eq(schema.coupons.code, order.couponCode));
    }
    if (order.source === 'request') {
      await tx
        .update(schema.requests)
        .set({ status: 'paid', updatedAt: new Date() })
        .where(eq(schema.requests.orderId, order.id));
    }
    return true;
  });

  if (!applied) return { status: 'duplicate', orderId: payment.orderId };

  const mail = await loadOrderForMail(payment.orderId);
  if (mail) {
    const s = await getSettings();
    await sendMailSafe(orderConfirmationMail(mail));
    await sendMailSafe(storeNewOrderMail(mail, s.notifyEmail));
  }
  return { status: 'paid', orderId: payment.orderId };
}

export async function getOrderByPublicId(publicId: string) {
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.publicId, publicId)).limit(1);
  if (!o) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id)).orderBy(asc(schema.orderItems.id));
  const [lastPayment] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, o.id))
    .orderBy(sql`${schema.payments.id} desc`)
    .limit(1);
  return { ...o, items, lastPayment: lastPayment ?? null };
}
