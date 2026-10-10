/**
 * Esquema de la base de datos de Lau&Pau.
 *
 * Importes siempre en céntimos (enteros). Los textos que ve el público van en
 * castellano y catalán dentro de un JSON { es, ca }.
 */
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core';

export type Lang = 'es' | 'ca';
export type Localized = { es: string; ca: string };

export type ProductImage = { src: string; alt: Localized; width?: number; height?: number };

/** Cómo se personaliza un producto. `none`: se compra directo desde el carrito. */
export type Personalization =
  | { mode: 'none' }
  | { mode: 'letter'; label: Localized; help: Localized }
  | { mode: 'idea'; label: Localized; help: Localized; maxLength: number };

export type Address = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  region?: string;
  country: string; // ISO 3166-1 alfa-2
  phone?: string;
};

export type ItemPersonalization = { letter?: string; idea?: string } | null;

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
};

/* ------------------------------------------------------------- personas --- */

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull().default(''),
  phone: text('phone'),
  role: text('role', { enum: ['customer', 'admin'] }).notNull().default('customer'),
  lang: text('lang', { enum: ['es', 'ca'] }).notNull().default('es'),
  ...timestamps
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // sha256 del token de la cookie: el token en claro nunca se guarda
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const passwordResets = pgTable('password_resets', {
  tokenHash: text('token_hash').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true })
});

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default(''),
  data: jsonb('data').$type<Address>().notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  ...timestamps
});

/* -------------------------------------------------------------- catálogo --- */

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: jsonb('name').$type<Localized>().notNull(),
  sort: integer('sort').notNull().default(0)
});

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    ref: text('ref').notNull().default(''),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: jsonb('name').$type<Localized>().notNull(),
    shortDescription: jsonb('short_description').$type<Localized>().notNull(),
    description: jsonb('description').$type<Localized>().notNull(),
    badge: jsonb('badge').$type<Localized | null>(),
    priceCents: integer('price_cents').notNull(),
    images: jsonb('images').$type<ProductImage[]>().notNull().default([]),
    personalization: jsonb('personalization').$type<Personalization>().notNull().default({ mode: 'none' }),
    details: jsonb('details').$type<{ label: Localized; value: Localized }[]>().notNull().default([]),
    active: boolean('active').notNull().default(true),
    featured: boolean('featured').notNull().default(false),
    sort: integer('sort').notNull().default(0),
    ...timestamps
  },
  (t) => [index('products_active_idx').on(t.active, t.sort)]
);

/** Toda compra va contra una variante. Un producto sin opciones tiene una sola, sin nombre. */
export const variants = pgTable('variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: jsonb('name').$type<Localized | null>(),
  /** Color de la muestra: «#rrggbb» o dos colores «#rrggbb,#rrggbb» (estampados, combinados). */
  color: text('color'),
  sku: text('sku').notNull().default(''),
  stock: integer('stock'), // null = sin control de existencias
  priceCents: integer('price_cents'), // null = precio del producto
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
});

/* ------------------------------------------------------- envíos y cupones --- */

export const shippingMethods = pgTable('shipping_methods', {
  id: serial('id').primaryKey(),
  name: jsonb('name').$type<Localized>().notNull(),
  description: jsonb('description').$type<Localized>().notNull(),
  countries: text('countries').array().notNull().default([]), // ISO alfa-2; vacío + allCountries = resto del mundo
  allCountries: boolean('all_countries').notNull().default(false),
  isPickup: boolean('is_pickup').notNull().default(false), // recogida: no pide dirección
  priceCents: integer('price_cents').notNull(),
  freeOverCents: integer('free_over_cents'),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0)
});

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  kind: text('kind', { enum: ['percent', 'fixed', 'free_shipping'] }).notNull(),
  value: integer('value').notNull().default(0), // % entero o céntimos
  minSubtotalCents: integer('min_subtotal_cents').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
  ...timestamps
});

/* --------------------------------------------------------------- pedidos --- */

export const ORDER_STATUSES = [
  'pending_payment', // creado, a la espera de que Redsys confirme
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    publicId: text('public_id').notNull().unique(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    source: text('source', { enum: ['cart', 'request'] }).notNull().default('cart'),
    status: text('status', { enum: ORDER_STATUSES }).notNull().default('pending_payment'),
    lang: text('lang', { enum: ['es', 'ca'] }).notNull().default('es'),
    email: text('email').notNull(),
    customerName: text('customer_name').notNull().default(''),
    phone: text('phone'),
    shippingAddress: jsonb('shipping_address').$type<Address | null>(),
    shippingMethodId: integer('shipping_method_id').references(() => shippingMethods.id, { onDelete: 'set null' }),
    shippingName: jsonb('shipping_name').$type<Localized | null>(),
    subtotalCents: integer('subtotal_cents').notNull().default(0),
    discountCents: integer('discount_cents').notNull().default(0),
    shippingCents: integer('shipping_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull().default(0),
    couponCode: text('coupon_code'),
    customerNotes: text('customer_notes'),
    adminNotes: text('admin_notes'),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url'),
    stockIssue: boolean('stock_issue').notNull().default(false),
    /** Pedidos nacidos de una solicitud: el enlace de pago caduca. */
    paymentLinkExpiresAt: timestamp('payment_link_expires_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [index('orders_status_idx').on(t.status), index('orders_user_idx').on(t.userId)]
);

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: integer('variant_id').references(() => variants.id, { onDelete: 'set null' }),
  // Copia de lo comprado: el pedido no cambia si luego se edita el producto.
  name: jsonb('name').$type<Localized>().notNull(),
  variantName: jsonb('variant_name').$type<Localized | null>(),
  image: text('image'),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  personalization: jsonb('personalization').$type<ItemPersonalization>()
});

/** Cada intento de pago es una operación Redsys con su propio número (Ds_Order). */
export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    dsOrder: text('ds_order').notNull(),
    amountCents: integer('amount_cents').notNull(),
    status: text('status', { enum: ['created', 'authorized', 'denied'] }).notNull().default('created'),
    responseCode: text('response_code'),
    authCode: text('auth_code'),
    raw: jsonb('raw'),
    ...timestamps
  },
  (t) => [uniqueIndex('payments_ds_order_idx').on(t.dsOrder)]
);

/* ------------------------------------------- solicitudes de personalización --- */

export const REQUEST_STATUSES = ['new', 'quoted', 'paid', 'rejected', 'expired'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', { enum: REQUEST_STATUSES }).notNull().default('new'),
  lang: text('lang', { enum: ['es', 'ca'] }).notNull().default('es'),
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: jsonb('product_name').$type<Localized>().notNull(),
  variantId: integer('variant_id').references(() => variants.id, { onDelete: 'set null' }),
  /** Color elegido, copiado al pedir: sigue visible aunque luego se borre la variante. */
  variantName: jsonb('variant_name').$type<Localized | null>(),
  quantity: integer('quantity').notNull().default(1),
  personalization: jsonb('personalization').$type<ItemPersonalization>(),
  notes: text('notes'),
  quotedUnitCents: integer('quoted_unit_cents'),
  adminMessage: text('admin_message'),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
  ...timestamps
});

/* ----------------------------------------------------------------- otros --- */

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull()
});

export const emailLog = pgTable('email_log', {
  id: serial('id').primaryKey(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  html: text('html').notNull(),
  status: text('status', { enum: ['sent', 'failed', 'logged'] }).notNull(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});
