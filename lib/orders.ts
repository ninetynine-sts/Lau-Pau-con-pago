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
import { CURRENCY_EUR, createPaymentForm, newDsOrder, verifyNotification, type RedsysForm } from './redsys';
import { randomToken } from './auth';
import { checkCoupon, consumeStock } from './shop';
import { path, type Lang } from './routes';
import { sendMailSafe } from './mail';
import { orderConfirmationMail, storeNewOrderMail, storePaymentAlertMail, type OrderForMail } from './emails';
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

/** ¿El banco ya ha cobrado algún intento de este pedido? */
export async function hasAuthorizedPayment(orderId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.payments.id })
    .from(schema.payments)
    .where(and(eq(schema.payments.orderId, orderId), eq(schema.payments.status, 'authorized')))
    .limit(1);
  return Boolean(row);
}

/** Abre un intento de pago y devuelve el formulario firmado para Redsys. */
export async function startPayment(orderId: number): Promise<RedsysForm> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order) throw new Error('Pedido no encontrado.');
  if (order.status !== 'pending_payment') throw new Error('Este pedido no está pendiente de pago.');
  if (order.totalCents <= 0) throw new Error('Importe inválido.');
  // Si ya hay un cobro autorizado (p. ej. pendiente de revisión), no se abre otro: evita cobrar dos veces.
  if (await hasAuthorizedPayment(orderId)) throw new Error('Este pedido ya tiene un pago recibido.');
  // Un cupón de usos limitados puede haberse agotado mientras el pedido esperaba.
  if (order.couponCode) {
    const c = await checkCoupon(order.couponCode, order.subtotalCents);
    if (!c.ok && c.reason === 'exhausted') throw new Error('El cupón ya no tiene usos disponibles.');
  }

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
  | { status: 'review'; orderId: number }
  | { status: 'unknown' };

/** Pago cobrado que no se puede aplicar solo: queda registrado y se avisa a la tienda. */
async function alertStore(orderId: number, reason: string, amountCents: number) {
  console.error(`[redsys] revisar pedido ${orderId}: ${reason}`);
  const s = await getSettings();
  await sendMailSafe(storePaymentAlertMail(s.notifyEmail, orderId, reason, amountCents));
}

/**
 * Procesa la notificación online de Redsys. Idempotente: Redsys puede reintentar y
 * cada pago solo se aplica una vez.
 */
export async function handleRedsysNotification(body: Record<string, string>): Promise<NotificationResult> {
  const n = verifyNotification(env.redsys.secretKey, body); // lanza si la firma no es válida

  // La firma ya liga el mensaje a nuestra clave; aun así, debe ser de nuestro comercio, en euros y un pago normal.
  if (n.merchantCode && Number(n.merchantCode) !== Number(env.redsys.merchantCode)) throw new Error('Código de comercio distinto.');
  if (n.currency && Number(n.currency) !== Number(CURRENCY_EUR)) throw new Error('Moneda distinta del euro.');
  if (n.transactionType && n.transactionType !== '0') throw new Error('Tipo de operación inesperado.');

  const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.dsOrder, n.dsOrder)).limit(1);
  if (!payment) return { status: 'unknown' };

  if (!n.authorized || n.amountCents !== payment.amountCents) {
    await db
      .update(schema.payments)
      .set({ status: 'denied', responseCode: String(n.responseCode), raw: n.params, updatedAt: new Date() })
      .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, 'created')));
    if (n.authorized) {
      await alertStore(payment.orderId, `Redsys ha cobrat ${n.amountCents} cèntims però l’intent era de ${payment.amountCents}.`, n.amountCents);
    }
    return { status: 'denied', orderId: payment.orderId };
  }

  // El pedido puede haber cambiado después de abrir este intento (otro envío, otro precio).
  // Solo se da por pagado si lo cobrado coincide con lo que vale el pedido ahora.
  const [current] = await db
    .select({ totalCents: schema.orders.totalCents, status: schema.orders.status })
    .from(schema.orders)
    .where(eq(schema.orders.id, payment.orderId))
    .limit(1);
  if (current && current.status === 'pending_payment' && current.totalCents !== payment.amountCents) {
    const upd = await db
      .update(schema.payments)
      .set({ status: 'authorized', responseCode: String(n.responseCode).padStart(4, '0'), authCode: n.authCode ?? null, raw: n.params, updatedAt: new Date() })
      .where(and(eq(schema.payments.id, payment.id), sql`${schema.payments.status} <> 'authorized'`))
      .returning({ id: schema.payments.id });
    if (upd.length) {
      await alertStore(
        payment.orderId,
        `S’ha cobrat un intent antic de ${payment.amountCents} cèntims, però la comanda ara val ${current.totalCents}. Revisa-la abans d’enviar-la.`,
        n.amountCents
      );
    }
    return { status: 'review', orderId: payment.orderId };
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
    if (!upd.length) return 'repeat' as const; // Redsys reintenta el mismo aviso

    const [order] = await tx
      .update(schema.orders)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(schema.orders.id, payment.orderId),
          eq(schema.orders.status, 'pending_payment'),
          // Dentro de la misma operación: el pedido vale exactamente lo cobrado.
          eq(schema.orders.totalCents, payment.amountCents)
        )
      )
      .returning();
    // Cobro nuevo, pero el pedido ya no estaba pendiente (cancelado o pagado con otro intento):
    // no se toca el stock dos veces y se avisa a la tienda.
    if (!order) {
      const [o] = await tx.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, payment.orderId)).limit(1);
      return o?.status === 'pending_payment' ? ('review' as const) : ('orphan' as const);
    }

    const items = await tx
      .select({ variantId: schema.orderItems.variantId, quantity: schema.orderItems.quantity })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));
    // Las piezas personalizadas se fabrican: no se descuentan de existencias.
    const stockIssue = order.source === 'cart' ? await consumeStock(tx, items) : false;
    if (stockIssue) await tx.update(schema.orders).set({ stockIssue: true }).where(eq(schema.orders.id, order.id));

    let couponOver = false;
    if (order.couponCode) {
      // Solo suma si aún quedan usos: dos pedidos pagados a la vez no pueden pasarse del límite sin que se sepa.
      const used = await tx
        .update(schema.coupons)
        .set({ usedCount: sql`${schema.coupons.usedCount} + 1` })
        .where(
          and(
            eq(schema.coupons.code, order.couponCode),
            sql`(${schema.coupons.maxUses} is null or ${schema.coupons.usedCount} < ${schema.coupons.maxUses})`
          )
        )
        .returning({ id: schema.coupons.id });
      couponOver = used.length === 0;
    }
    if (order.source === 'request') {
      await tx
        .update(schema.requests)
        .set({ status: 'paid', updatedAt: new Date() })
        .where(eq(schema.requests.orderId, order.id));
    }
    return couponOver ? ('applied-coupon-over' as const) : ('applied' as const);
  });

  if (applied === 'review') {
    await alertStore(payment.orderId, 'La comanda ha canviat mentre es pagava: l’import cobrat no coincideix amb el total actual.', n.amountCents);
    return { status: 'review', orderId: payment.orderId };
  }
  if (applied === 'applied-coupon-over') {
    await alertStore(payment.orderId, 'Pagament correcte, però el cupó ja havia arribat al límit d’usos (s’ha aplicat igualment).', n.amountCents);
  }
  if (applied === 'orphan') {
    const [o] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, payment.orderId)).limit(1);
    await alertStore(payment.orderId, `Cobrament rebut per a una comanda que ja estava «${o?.status ?? '?'}» (possible doble cobrament).`, n.amountCents);
  }
  if (applied !== 'applied' && applied !== 'applied-coupon-over') return { status: 'duplicate', orderId: payment.orderId };

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
  // Cobro recibido pero pendiente de revisión: la clienta no debe volver a pagar.
  const authorized = await hasAuthorizedPayment(o.id);
  return { ...o, items, lastPayment: lastPayment ?? null, authorized };
}
