'use server';

/**
 * Accions del tauler. Totes comencen comprovant que qui crida és administradora.
 * Els missatges tornen com a ?ok=… o ?e=… a la mateixa pàgina.
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import {
  authenticate,
  checkRate,
  clearFailures,
  clientIp,
  createSession,
  destroySession,
  destroyUserSessions,
  hashPassword,
  isEmail,
  normalizeEmail,
  randomToken,
  registerFailure,
  requireAdmin
} from '@/lib/auth';
import { sendMailSafe } from '@/lib/mail';
import { orderShippedMail, pickupReadyMail, quoteReadyMail, requestRejectedMail } from '@/lib/emails';
import { hasAuthorizedPayment, loadOrderForMail } from '@/lib/orders';
import { getSettings, saveSettings } from '@/lib/settings';
import { saveImage } from '@/lib/storage';
import { ORDER_STATUSES, type Localized, type OrderStatus, type Personalization, type ProductImage } from '@/lib/db/schema';
import type { Lang } from '@/lib/routes';
import { colorFromForm } from '@/lib/catalog';

const s = (f: FormData, k: string, max = 500) => String(f.get(k) ?? '').trim().slice(0, max);
const L = (f: FormData, k: string, max = 2000): Localized => ({ es: s(f, `${k}_es`, max), ca: s(f, `${k}_ca`, max) });

/** «12,50» o «12.50» → 1250. null si no és un import vàlid. */
function cents(v: string): number | null {
  const clean = v.replace(/\s|€/g, '').replace(',', '.');
  if (!clean) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}
const intOrNull = (v: string) => (v === '' ? null : Number.isSafeInteger(Number(v)) ? Number(v) : null);

/* --------------------------------------------------------------- accés --- */

export async function adminLogin(form: FormData) {
  const email = normalizeEmail(s(form, 'email', 254));
  // Límite por IP y por cuenta: probar contraseñas cambiando de IP tampoco sirve.
  const ipKey = `admin-ip:${await clientIp()}`;
  // Mismo contador por cuenta que el acceso de clientas: no se suman dos cupos de intentos.
  // Es alto a propósito (30 cada 15 min) para que nadie pueda dejar fuera a la tienda a base
  // de fallar; con contraseñas de 12+ caracteres y bcrypt, 30 intentos no sirven para adivinar.
  const emailKey = `login-email:${email}`;
  if (!checkRate(ipKey, 8) || !checkRate(emailKey, 30)) redirect('/admin/entrar?e=massa');
  const user = await authenticate(email, String(form.get('password') ?? '').slice(0, 200));
  if (!user || user.role !== 'admin') {
    registerFailure(ipKey);
    registerFailure(emailKey);
    redirect('/admin/entrar?e=dades');
  }
  clearFailures(ipKey);
  clearFailures(emailKey);
  await createSession(user.id, 'admin');
  redirect('/admin');
}

export async function adminLogout() {
  await destroySession();
  redirect('/admin/entrar');
}

/* ------------------------------------------------------------- comandes --- */

export async function updateOrder(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id'));
  const status = s(form, 'status', 30) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) redirect(`/admin/comandes/${id}?e=estat`);
  const [before] = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  if (!before) redirect('/admin/comandes');
  // Una comanda que el banc no ha cobrat mai no es pot marcar com a pagada a mà: només Redsys ho confirma.
  // Excepció: un cobrament autoritzat que ha quedat en revisió (import diferent), que la botiga accepta.
  const charged = Boolean(before.paidAt) || (await hasAuthorizedPayment(id));
  if (!charged && !['pending_payment', 'cancelled'].includes(status)) {
    redirect(`/admin/comandes/${id}?e=nopagada`);
  }
  const markPaidNow = !before.paidAt && charged && !['pending_payment', 'cancelled'].includes(status);

  const trackingNumber = s(form, 'trackingNumber', 120) || null;
  const trackingUrlRaw = s(form, 'trackingUrl', 500);
  const trackingUrl = /^https?:\/\//i.test(trackingUrlRaw) ? trackingUrlRaw : null;
  await db
    .update(schema.orders)
    .set({
      status,
      trackingNumber,
      trackingUrl,
      adminNotes: s(form, 'adminNotes', 4000) || null,
      shippedAt: status === 'shipped' && !before.shippedAt ? new Date() : before.shippedAt,
      paidAt: markPaidNow ? new Date() : before.paidAt,
      updatedAt: new Date()
    })
    .where(eq(schema.orders.id, id));

  if (form.get('notify') === 'on' && status !== before.status && (status === 'shipped' || status === 'preparing')) {
    const mail = await loadOrderForMail(id);
    if (mail) {
      if (status === 'shipped') await sendMailSafe(mail.shippingAddress ? orderShippedMail(mail) : pickupReadyMail(mail));
    }
  }
  revalidatePath('/admin');
  redirect(`/admin/comandes/${id}?ok=desat`);
}

/* --------------------------------------------------------- sol·licituds --- */

export async function quoteRequest(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id'));
  const unit = cents(s(form, 'unitPrice', 20));
  const message = s(form, 'message', 2000) || null;
  if (!unit || unit <= 0) redirect(`/admin/sollicituds/${id}?e=preu`);
  const [r] = await db.select().from(schema.requests).where(eq(schema.requests.id, id)).limit(1);
  if (!r) redirect('/admin/sollicituds');
  if (r.status === 'paid') redirect(`/admin/sollicituds/${id}?e=pagada`);

  const settings = await getSettings();
  const days = Math.max(1, Math.min(60, Number(s(form, 'days', 3)) || settings.paymentLinkDays));
  const expiresAt = new Date(Date.now() + days * 86400_000);
  const [product] = r.productId ? await db.select().from(schema.products).where(eq(schema.products.id, r.productId)).limit(1) : [];
  const subtotal = unit * r.quantity;

  let orderId = r.orderId;
  const existing = orderId ? (await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1))[0] : undefined;

  if (existing && existing.status === 'pending_payment') {
    // Es torna a enviar l'enllaç: s'actualitza el preu i la caducitat.
    await db.update(schema.orderItems).set({ unitPriceCents: unit }).where(eq(schema.orderItems.orderId, existing.id));
    await db
      .update(schema.orders)
      .set({ subtotalCents: subtotal, totalCents: subtotal - existing.discountCents + existing.shippingCents, paymentLinkExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(schema.orders.id, existing.id));
  } else {
    const order = await db.transaction(async (tx) => {
      const [o] = await tx
        .insert(schema.orders)
        .values({
          publicId: randomToken(18),
          source: 'request',
          status: 'pending_payment',
          userId: r.userId,
          lang: r.lang,
          email: r.email,
          customerName: r.name,
          phone: r.phone,
          subtotalCents: subtotal,
          totalCents: subtotal,
          customerNotes: r.notes,
          paymentLinkExpiresAt: expiresAt
        })
        .returning();
      await tx.insert(schema.orderItems).values({
        orderId: o.id,
        productId: r.productId,
        variantId: r.variantId,
        name: r.productName,
        variantName: r.variantName ?? null,
        image: product?.images[0]?.src ?? null,
        unitPriceCents: unit,
        quantity: r.quantity,
        personalization: r.personalization ?? null
      });
      return o;
    });
    orderId = order.id;
  }

  await db
    .update(schema.requests)
    .set({ status: 'quoted', quotedUnitCents: unit, adminMessage: message, orderId, updatedAt: new Date() })
    .where(eq(schema.requests.id, id));

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId!)).limit(1);
  await sendMailSafe(
    quoteReadyMail(
      { ...r, lang: r.lang as Lang, personalization: r.personalization ?? null },
      { publicId: order.publicId, totalCents: subtotal, unitCents: unit, expiresAt },
      message
    )
  );
  revalidatePath('/admin');
  redirect(`/admin/sollicituds/${id}?ok=enviat`);
}

export async function rejectRequest(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id'));
  const message = s(form, 'message', 2000) || null;
  const [r] = await db.select().from(schema.requests).where(eq(schema.requests.id, id)).limit(1);
  if (!r || r.status === 'paid') redirect(`/admin/sollicituds/${id}`);
  await db.update(schema.requests).set({ status: 'rejected', adminMessage: message, updatedAt: new Date() }).where(eq(schema.requests.id, id));
  if (r.orderId) {
    await db
      .update(schema.orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(schema.orders.id, r.orderId), eq(schema.orders.status, 'pending_payment')));
  }
  if (form.get('notify') === 'on') {
    await sendMailSafe(requestRejectedMail({ ...r, lang: r.lang as Lang, personalization: r.personalization ?? null }, message));
  }
  revalidatePath('/admin');
  redirect(`/admin/sollicituds/${id}?ok=rebutjada`);
}

/* ------------------------------------------------------------- productes --- */

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function saveProduct(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id')) || null;
  const back = (q: string) => redirect(id ? `/admin/productes/${id}?${q}` : `/admin/productes/nou?${q}`);

  const name = L(form, 'name', 160);
  if (!name.es || !name.ca) back('e=nom');
  const price = cents(s(form, 'price', 20));
  if (price === null || price <= 0) back('e=preu');

  let slug = slugify(s(form, 'slug', 100) || name.es);
  if (!slug) back('e=slug');
  const [clash] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, slug)).limit(1);
  if (clash && clash.id !== id) slug = `${slug}-${randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const mode = s(form, 'pmode', 10);
  let personalization: Personalization = { mode: 'none' };
  if (mode === 'letter') {
    personalization = {
      mode: 'letter',
      label: { es: s(form, 'plabel_es', 200) || '¿Qué letra quieres?', ca: s(form, 'plabel_ca', 200) || 'Quina lletra vols?' },
      help: L(form, 'phelp', 400)
    };
  } else if (mode === 'idea') {
    personalization = {
      mode: 'idea',
      label: {
        es: s(form, 'plabel_es', 200) || 'Cuéntanos cómo te gustaría personalizarlo',
        ca: s(form, 'plabel_ca', 200) || "Explica'ns com t'agradaria personalitzar-lo"
      },
      help: L(form, 'phelp', 400),
      maxLength: Math.max(20, Math.min(1000, Number(s(form, 'pmax', 5)) || 300))
    };
  }

  // Fotos: es conserven les marcades, s'hi afegeixen les noves.
  const current: ProductImage[] = id
    ? ((await db.select({ images: schema.products.images }).from(schema.products).where(eq(schema.products.id, id)).limit(1))[0]?.images ?? [])
    : [];
  const keep = new Set(form.getAll('keepImage').map(String));
  const images: ProductImage[] = current.filter((im) => keep.has(im.src));
  const order = s(form, 'firstImage', 500);
  if (order) images.sort((a, b) => Number(b.src === order) - Number(a.src === order));
  const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files.slice(0, 8)) {
    try {
      images.push({ src: await saveImage(file), alt: { es: name.es, ca: name.ca } });
    } catch (e) {
      console.error('[admin] foto', e);
      back(`e=foto&msg=${encodeURIComponent(e instanceof Error ? e.message : 'Error')}`);
    }
  }

  const badge = L(form, 'badge', 40);
  const values = {
    slug,
    ref: s(form, 'ref', 40),
    categoryId: s(form, 'categoryId', 60) || null,
    name,
    shortDescription: L(form, 'short', 200),
    description: L(form, 'description', 3000),
    badge: badge.es || badge.ca ? badge : null,
    priceCents: price!,
    images,
    personalization,
    active: form.get('active') === 'on',
    featured: form.get('featured') === 'on',
    sort: Number(s(form, 'sort', 6)) || 0,
    updatedAt: new Date()
  };

  let productId = id;
  if (id) await db.update(schema.products).set(values).where(eq(schema.products.id, id));
  else productId = (await db.insert(schema.products).values(values).returning({ id: schema.products.id }))[0].id;

  // Variants: files vXX_*; «new» per afegir-ne.
  const keys = new Set<string>();
  for (const k of form.keys()) {
    const m = k.match(/^v_(\w+)_present$/);
    if (m) keys.add(m[1]);
  }
  const existing = await db.select().from(schema.variants).where(eq(schema.variants.productId, productId!));
  const seen = new Set<number>();
  let sort = 0;
  for (const key of keys) {
    const vName = { es: s(form, `v_${key}_name_es`, 80), ca: s(form, `v_${key}_name_ca`, 80) };
    const stock = intOrNull(s(form, `v_${key}_stock`, 6));
    const vPrice = cents(s(form, `v_${key}_price`, 20));
    const remove = form.get(`v_${key}_delete`) === 'on';
    const color = colorFromForm((n) => String(form.get(n) ?? ''), key);
    const isNew = key.startsWith('new');
    if (isNew && !vName.es && !vName.ca && stock === null) continue; // fila buida
    sort += 1;
    const row = {
      name: vName.es || vName.ca ? { es: vName.es || vName.ca, ca: vName.ca || vName.es } : null,
      color,
      sku: s(form, `v_${key}_sku`, 60),
      stock: stock === null ? null : Math.max(0, stock),
      priceCents: vPrice,
      active: form.get(`v_${key}_active`) === 'on',
      sort
    };
    if (isNew) {
      if (!remove) await db.insert(schema.variants).values({ ...row, productId: productId! });
    } else {
      const vid = Number(key);
      if (!existing.some((e) => e.id === vid)) continue;
      seen.add(vid);
      if (remove) await db.delete(schema.variants).where(eq(schema.variants.id, vid));
      else await db.update(schema.variants).set(row).where(eq(schema.variants.id, vid));
    }
  }
  // Tot producte necessita almenys una variant activa per poder-se vendre.
  const [any] = await db.select({ id: schema.variants.id }).from(schema.variants).where(eq(schema.variants.productId, productId!)).limit(1);
  if (!any) await db.insert(schema.variants).values({ productId: productId!, name: null, sku: values.ref, stock: null });

  revalidatePath('/', 'layout');
  redirect(`/admin/productes/${productId}?ok=desat`);
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id'));
  await db.delete(schema.products).where(eq(schema.products.id, id));
  revalidatePath('/', 'layout');
  redirect('/admin/productes?ok=eliminat');
}

export async function adjustStock(form: FormData) {
  await requireAdmin();
  const vid = Number(form.get('variantId'));
  const stock = intOrNull(s(form, 'stock', 6));
  await db.update(schema.variants).set({ stock: stock === null ? null : Math.max(0, stock) }).where(eq(schema.variants.id, vid));
  revalidatePath('/', 'layout');
  redirect('/admin/productes?ok=estoc');
}

/* ------------------------------------------------------------ enviaments --- */

export async function saveShipping(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id')) || null;
  const price = cents(s(form, 'price', 20)) ?? 0;
  const freeOver = cents(s(form, 'freeOver', 20));
  const countries = s(form, 'countries', 400)
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter((c) => /^[A-Z]{2}$/.test(c));
  const name = L(form, 'name', 120);
  if (!name.es || !name.ca) redirect('/admin/enviaments?e=nom');
  const values = {
    name,
    description: L(form, 'description', 300),
    countries,
    allCountries: form.get('allCountries') === 'on',
    isPickup: form.get('isPickup') === 'on',
    priceCents: price,
    freeOverCents: freeOver,
    active: form.get('active') === 'on',
    sort: Number(s(form, 'sort', 4)) || 0
  };
  if (id) await db.update(schema.shippingMethods).set(values).where(eq(schema.shippingMethods.id, id));
  else await db.insert(schema.shippingMethods).values(values);
  await saveSettings({ shippingReviewed: true });
  redirect('/admin/enviaments?ok=desat');
}

export async function deleteShipping(form: FormData) {
  await requireAdmin();
  await db.delete(schema.shippingMethods).where(eq(schema.shippingMethods.id, Number(form.get('id'))));
  redirect('/admin/enviaments?ok=eliminat');
}

export async function markShippingReviewed() {
  await requireAdmin();
  await saveSettings({ shippingReviewed: true });
  redirect('/admin/enviaments?ok=revisat');
}

/* ---------------------------------------------------------------- cupons --- */

export async function saveCoupon(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id')) || null;
  const code = s(form, 'code', 40).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!code) redirect('/admin/cupons?e=codi');
  const kind = s(form, 'kind', 20) as 'percent' | 'fixed' | 'free_shipping';
  if (!['percent', 'fixed', 'free_shipping'].includes(kind)) redirect('/admin/cupons?e=tipus');
  const rawValue = s(form, 'value', 20);
  const value = kind === 'percent' ? Math.max(1, Math.min(100, Math.round(Number(rawValue.replace(',', '.')) || 0))) : kind === 'fixed' ? cents(rawValue) ?? 0 : 0;
  if (kind !== 'free_shipping' && value <= 0) redirect('/admin/cupons?e=valor');
  const date = (k: string) => {
    const v = s(form, k, 20);
    return v ? new Date(`${v}T${k === 'expiresAt' ? '23:59:59' : '00:00:00'}`) : null;
  };
  const [clash] = await db.select({ id: schema.coupons.id }).from(schema.coupons).where(eq(schema.coupons.code, code)).limit(1);
  if (clash && clash.id !== id) redirect('/admin/cupons?e=repetit');
  const values = {
    code,
    kind,
    value,
    minSubtotalCents: cents(s(form, 'minSubtotal', 20)) ?? 0,
    startsAt: date('startsAt'),
    expiresAt: date('expiresAt'),
    maxUses: intOrNull(s(form, 'maxUses', 6)),
    active: form.get('active') === 'on',
    updatedAt: new Date()
  };
  if (id) await db.update(schema.coupons).set(values).where(eq(schema.coupons.id, id));
  else await db.insert(schema.coupons).values(values);
  redirect('/admin/cupons?ok=desat');
}

export async function deleteCoupon(form: FormData) {
  await requireAdmin();
  await db.delete(schema.coupons).where(eq(schema.coupons.id, Number(form.get('id'))));
  redirect('/admin/cupons?ok=eliminat');
}

/* --------------------------------------------------------- configuració --- */

export async function saveStoreSettings(form: FormData) {
  await requireAdmin();
  const storeEmail = normalizeEmail(s(form, 'storeEmail', 254));
  const notifyEmail = normalizeEmail(s(form, 'notifyEmail', 254));
  if (!isEmail(storeEmail) || !isEmail(notifyEmail)) redirect('/admin/configuracio?e=correu');
  await saveSettings({
    storeEmail,
    notifyEmail,
    instagram: s(form, 'instagram', 60).replace(/^@/, '').replace(/[^\w.]/g, ''),
    paymentLinkDays: Math.max(1, Math.min(60, Number(s(form, 'paymentLinkDays', 3)) || 7))
  });
  revalidatePath('/', 'layout');
  redirect('/admin/configuracio?ok=desat');
}

export async function createAdmin(form: FormData) {
  await requireAdmin();
  const email = normalizeEmail(s(form, 'email', 254));
  const password = String(form.get('password') ?? '');
  if (!isEmail(email)) redirect('/admin/configuracio?e=correu');
  if (password.length < 12 || password.length > 200) redirect('/admin/configuracio?e=contrasenya');
  const hash = await hashPassword(password);
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash: hash, name: s(form, 'name', 120), role: 'admin', lang: 'ca' })
    .onConflictDoUpdate({ target: schema.users.email, set: { role: 'admin', passwordHash: hash } })
    .returning({ id: schema.users.id });
  // Si el correu ja tenia compte, es tanquen totes les seves sessions: només la contrasenya nova hi dona accés.
  await destroyUserSessions(user.id);
  redirect('/admin/configuracio?ok=admin');
}

export async function removeAdmin(form: FormData) {
  const me = await requireAdmin();
  const id = Number(form.get('id'));
  if (id === me.id) redirect('/admin/configuracio?e=tumateixa');
  await db.update(schema.users).set({ role: 'customer' }).where(and(eq(schema.users.id, id), eq(schema.users.role, 'admin')));
  await destroyUserSessions(id);
  redirect('/admin/configuracio?ok=treta');
}

/** Utilitat per a la llista de comandes: marca diverses com a preparades. */
export async function bulkPreparing(form: FormData) {
  await requireAdmin();
  const ids = form.getAll('ids').map(Number).filter(Boolean);
  if (ids.length) {
    await db
      .update(schema.orders)
      .set({ status: 'preparing', updatedAt: new Date() })
      .where(and(inArray(schema.orders.id, ids), eq(schema.orders.status, 'paid')));
  }
  redirect('/admin/comandes?ok=desat');
}
