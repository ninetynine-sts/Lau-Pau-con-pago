/**
 * Plantillas de correo. A clientes: en su idioma. A la tienda: en catalán.
 */
import 'server-only';
import { env } from './env';
import { formatDate, formatPrice, loc, orderNumber, t } from './i18n';
import { path, type Lang } from './routes';
import type { Address, ItemPersonalization, Localized } from './db/schema';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const C = { bg: '#FAF9F6', ink: '#190D08', soft: '#5C4435', muted: '#856A55', line: '#E7DDCC', accent: '#A86000', btn: '#5C4435' };

function layout(body: string, lang: Lang): string {
  const logo = `${env.siteUrl}/laupau/marca/logo-final.png`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${C.bg};font-family:Helvetica,Arial,sans-serif;color:${C.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid ${C.line};border-radius:20px;">
<tr><td align="center" style="padding:28px 28px 8px;"><img src="${logo}" width="88" height="88" alt="Lau&amp;Pau" style="display:block;border:0;"></td></tr>
<tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.6;">${body}</td></tr>
</table>
<p style="font-size:12px;color:${C.muted};margin:18px 0 0;">Lau&amp;Pau · Andorra</p>
</td></tr></table></body></html>`;
}

const h1 = (s: string) =>
  `<h1 style="font-family:Georgia,serif;font-weight:600;font-size:24px;line-height:1.2;margin:8px 0 14px;color:${C.ink};">${s}</h1>`;
const p = (s: string) => `<p style="margin:0 0 14px;color:${C.soft};">${s}</p>`;
/** Solo enlaces http(s); el atributo va escapado (un «"» no puede romper la etiqueta). */
const safeHref = (href: string) => (/^https?:\/\//i.test(href) ? esc(href) : '#');
const button = (href: string, label: string) =>
  `<p style="margin:22px 0;"><a href="${safeHref(href)}" style="display:inline-block;background:${C.btn};color:#FAF9F6;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;">${esc(label)}</a></p>`;

type Line = { name: Localized; variantName: Localized | null; quantity: number; unitPriceCents: number; personalization?: ItemPersonalization };

function personalizationText(pz: ItemPersonalization | undefined, lang: Lang): string {
  if (!pz) return '';
  const d = t(lang).order;
  if (pz.letter) return `${d.letter}: ${esc(pz.letter)}`;
  if (pz.idea) return `${d.idea}: ${esc(pz.idea)}`;
  return '';
}

function itemsTable(lines: Line[], lang: Lang, totals?: { subtotal: number; discount: number; shipping: number; total: number }) {
  const d = t(lang).checkout;
  const rows = lines
    .map((l) => {
      const extra = [l.variantName ? esc(loc(l.variantName, lang)) : '', personalizationText(l.personalization, lang)]
        .filter(Boolean)
        .join(' · ');
      return `<tr><td style="padding:10px 0;border-top:1px solid ${C.line};">${esc(loc(l.name, lang))}${extra ? `<br><span style="font-size:13px;color:${C.muted};">${extra}</span>` : ''}<br><span style="font-size:13px;color:${C.muted};">× ${l.quantity}</span></td>
<td align="right" style="padding:10px 0;border-top:1px solid ${C.line};white-space:nowrap;">${formatPrice(l.unitPriceCents * l.quantity, lang)}</td></tr>`;
    })
    .join('');
  const tot = totals
    ? [
        [d.subtotal, formatPrice(totals.subtotal, lang)],
        ...(totals.discount ? [[d.discount, `−${formatPrice(totals.discount, lang)}`]] : []),
        [d.shippingCost, totals.shipping ? formatPrice(totals.shipping, lang) : d.free],
        [`<b>${d.total}</b>`, `<b>${formatPrice(totals.total, lang)}</b>`]
      ]
        .map(([a, b]) => `<tr><td style="padding:6px 0;">${a}</td><td align="right" style="padding:6px 0;">${b}</td></tr>`)
        .join('')
    : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:6px 0 18px;">${rows}${
    tot ? `<tr><td colspan="2" style="border-top:1px solid ${C.line};"></td></tr>${tot}` : ''
  }</table>`;
}

function addressBlock(a: Address | null, pickupLabel: string | null): string {
  if (!a) return pickupLabel ? p(esc(pickupLabel)) : '';
  const parts = [a.name, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.region, a.country].filter(Boolean).map((s) => esc(String(s)));
  return p(parts.join('<br>'));
}

export type OrderForMail = {
  id: number;
  publicId: string;
  lang: Lang;
  email: string;
  customerName: string;
  phone: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  customerNotes: string | null;
  shippingAddress: Address | null;
  shippingName: Localized | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  stockIssue: boolean;
  items: Line[];
};

const orderUrl = (o: { lang: Lang; publicId: string }) => `${env.siteUrl}${path(o.lang, 'pedido', o.publicId)}`;

const totalsOf = (o: OrderForMail) => ({
  subtotal: o.subtotalCents,
  discount: o.discountCents,
  shipping: o.shippingCents,
  total: o.totalCents
});

/* --------------------------------------------------------- a la clienta --- */

export function orderConfirmationMail(o: OrderForMail) {
  const L = o.lang;
  const n = orderNumber(o.id);
  const sub = L === 'ca' ? `Hem rebut la teva comanda ${n}` : `Hemos recibido tu pedido ${n}`;
  const intro =
    L === 'ca'
      ? `Hola, ${esc(o.customerName)}! Gràcies per comprar a Lau&amp;Pau. Hem rebut el pagament i ja ens posem a preparar la comanda. T’avisarem quan l’enviem.`
      : `¡Hola, ${esc(o.customerName)}! Gracias por comprar en Lau&amp;Pau. Hemos recibido el pago y ya nos ponemos a preparar tu pedido. Te avisaremos cuando lo enviemos.`;
  const body =
    h1(esc(sub)) +
    p(intro) +
    itemsTable(o.items, L, totalsOf(o)) +
    `<p style="margin:0 0 6px;font-weight:700;">${o.shippingAddress ? t(L).order.shipTo : t(L).order.pickup}</p>` +
    addressBlock(o.shippingAddress, loc(o.shippingName, L)) +
    button(orderUrl(o), L === 'ca' ? 'Veure la comanda' : 'Ver el pedido');
  return { to: o.email, subject: `Lau&Pau · ${sub}`, html: layout(body, L) };
}

export function orderShippedMail(o: OrderForMail) {
  const L = o.lang;
  const n = orderNumber(o.id);
  const sub = L === 'ca' ? `La teva comanda ${n} ja és en camí` : `Tu pedido ${n} ya está en camino`;
  const tracking = o.trackingNumber
    ? p(`${t(L).order.tracking}: <b>${esc(o.trackingNumber)}</b>`) + (o.trackingUrl ? button(o.trackingUrl, t(L).order.tracking) : '')
    : '';
  const body =
    h1(esc(sub)) +
    p(L === 'ca' ? 'Hem enviat la teva comanda. Esperem que t’agradi molt!' : 'Hemos enviado tu pedido. ¡Esperamos que te encante!') +
    tracking +
    itemsTable(o.items, L) +
    (o.trackingUrl ? '' : button(orderUrl(o), L === 'ca' ? 'Veure la comanda' : 'Ver el pedido'));
  return { to: o.email, subject: `Lau&Pau · ${sub}`, html: layout(body, L) };
}

export function pickupReadyMail(o: OrderForMail) {
  const L = o.lang;
  const n = orderNumber(o.id);
  const sub = L === 'ca' ? `La teva comanda ${n} està a punt per recollir` : `Tu pedido ${n} está listo para recoger`;
  const body =
    h1(esc(sub)) +
    p(L === 'ca' ? 'Ja pots passar a recollir la comanda. Si tens cap dubte, respon aquest correu.' : 'Ya puedes pasar a recoger tu pedido. Si tienes cualquier duda, responde a este correo.') +
    itemsTable(o.items, L);
  return { to: o.email, subject: `Lau&Pau · ${sub}`, html: layout(body, L) };
}

export type RequestForMail = {
  publicId: string;
  lang: Lang;
  email: string;
  name: string;
  phone: string | null;
  productName: Localized;
  variantName?: Localized | null;
  quantity: number;
  personalization: ItemPersonalization;
  notes: string | null;
};

function requestSummary(r: RequestForMail, L: Lang) {
  const pz = personalizationText(r.personalization, L);
  return p(
    `<b>${esc(loc(r.productName, L))}</b> × ${r.quantity}${r.variantName ? `<br>${esc(loc(r.variantName, L))}` : ''}${pz ? `<br>${pz}` : ''}${
      r.notes ? `<br><span style="color:${C.muted};">${esc(r.notes)}</span>` : ''
    }`
  );
}

export function requestReceivedMail(r: RequestForMail) {
  const L = r.lang;
  const sub = L === 'ca' ? 'Hem rebut la teva sol·licitud de personalització' : 'Hemos recibido tu solicitud de personalización';
  const body =
    h1(esc(sub)) +
    p(
      L === 'ca'
        ? `Hola, ${esc(r.name)}! La Laura i la Paula revisaran la teva sol·licitud i t’escriuran amb el preu final i un enllaç per pagar. No pagues res fins aleshores.`
        : `¡Hola, ${esc(r.name)}! Laura y Paula revisarán tu solicitud y te escribirán con el precio final y un enlace para pagar. No pagas nada hasta entonces.`
    ) +
    requestSummary(r, L);
  return { to: r.email, subject: `Lau&Pau · ${sub}`, html: layout(body, L) };
}

export function quoteReadyMail(r: RequestForMail, o: { publicId: string; totalCents: number; unitCents: number; expiresAt: Date }, message: string | null) {
  const L = r.lang;
  const link = `${env.siteUrl}${path(L, 'pagar', o.publicId)}`;
  const sub = L === 'ca' ? 'La teva personalització està a punt per pagar' : 'Tu personalización está lista para pagar';
  const body =
    h1(esc(sub)) +
    p(
      L === 'ca'
        ? `Hola, ${esc(r.name)}! Hem revisat la teva sol·licitud i la podem fer. Aquí tens el preu final:`
        : `¡Hola, ${esc(r.name)}! Hemos revisado tu solicitud y podemos hacerla. Este es el precio final:`
    ) +
    requestSummary(r, L) +
    p(`${L === 'ca' ? 'Preu' : 'Precio'}: <b>${formatPrice(o.unitCents, L)}</b> × ${r.quantity} = <b>${formatPrice(o.totalCents, L)}</b> <span style="color:${C.muted};">(${L === 'ca' ? 'enviament a part' : 'envío aparte'})</span>`) +
    (message ? `<blockquote style="margin:0 0 14px;padding:12px 16px;border-left:2px solid ${C.accent};background:#F2EEE5;color:${C.soft};">${esc(message).replace(/\n/g, '<br>')}</blockquote>` : '') +
    button(link, L === 'ca' ? 'Tria l’enviament i paga' : 'Elegir envío y pagar') +
    p(`<span style="font-size:13px;color:${C.muted};">${esc(t(L).payLink.validUntil(formatDate(o.expiresAt, L)))}</span>`);
  return { to: r.email, subject: `Lau&Pau · ${sub}`, html: layout(body, L) };
}

export function requestRejectedMail(r: RequestForMail, message: string | null) {
  const L = r.lang;
  const sub = L === 'ca' ? 'Sobre la teva sol·licitud de personalització' : 'Sobre tu solicitud de personalización';
  const body =
    h1(esc(sub)) +
    p(
      L === 'ca'
        ? `Hola, ${esc(r.name)}. Ho sentim, però aquesta vegada no podem fer la personalització que ens demanes.`
        : `Hola, ${esc(r.name)}. Lo sentimos, pero esta vez no podemos hacer la personalización que nos pides.`
    ) +
    requestSummary(r, L) +
    (message ? p(esc(message).replace(/\n/g, '<br>')) : '') +
    p(L === 'ca' ? 'Si vols, respon aquest correu i en parlem.' : 'Si quieres, responde a este correo y lo hablamos.');
  return { to: r.email, subject: `Lau&Pau · ${sub}`, html: layout(body, L) };
}

export function passwordResetMail(to: string, lang: Lang, token: string) {
  const link = `${env.siteUrl}${path(lang, 'cuenta', 'restablecer')}?token=${encodeURIComponent(token)}`;
  const sub = lang === 'ca' ? 'Crea una contrasenya nova' : 'Crea una nueva contraseña';
  const body =
    h1(esc(sub)) +
    p(
      lang === 'ca'
        ? 'Hem rebut una petició per canviar la contrasenya del teu compte. L’enllaç és vàlid durant 1 hora.'
        : 'Hemos recibido una petición para cambiar la contraseña de tu cuenta. El enlace es válido durante 1 hora.'
    ) +
    button(link, sub) +
    p(
      `<span style="font-size:13px;color:${C.muted};">${
        lang === 'ca' ? 'Si no has estat tu, pots ignorar aquest correu.' : 'Si no has sido tú, puedes ignorar este correo.'
      }</span>`
    );
  return { to, subject: `Lau&Pau · ${sub}`, html: layout(body, lang), sensitive: true };
}

/* ------------------------------------------------------- a la tienda (CA) --- */

export function storeNewOrderMail(o: OrderForMail, to: string) {
  const n = orderNumber(o.id);
  const body =
    h1(`Comanda nova ${n} · ${formatPrice(o.totalCents, 'ca')}`) +
    (o.stockIssue
      ? `<p style="margin:0 0 14px;padding:12px 16px;background:#FBEAE7;color:#9B2C1E;border-radius:12px;"><b>Atenció:</b> algun article no tenia prou estoc quan s’ha pagat. Revisa la comanda.</p>`
      : '') +
    p(`${esc(o.customerName)} · ${esc(o.email)}${o.phone ? ` · ${esc(o.phone)}` : ''}`) +
    itemsTable(o.items, 'ca', totalsOf(o)) +
    (o.couponCode ? p(`Cupó: <b>${esc(o.couponCode)}</b>`) : '') +
    `<p style="margin:0 0 6px;font-weight:700;">${o.shippingAddress ? 'Enviament a' : 'Recollida'}</p>` +
    addressBlock(o.shippingAddress, loc(o.shippingName, 'ca')) +
    (o.customerNotes ? p(`<b>Notes de la clienta:</b> ${esc(o.customerNotes)}`) : '') +
    button(`${env.siteUrl}/admin/comandes/${o.id}`, 'Obre la comanda al tauler');
  return { to, subject: `Lau&Pau · Comanda nova ${n}`, html: layout(body, 'ca'), replyTo: o.email };
}

export function storeNewRequestMail(r: RequestForMail & { id: number }, to: string) {
  const body =
    h1('Sol·licitud de personalització nova') +
    p(`${esc(r.name)} · ${esc(r.email)}${r.phone ? ` · ${esc(r.phone)}` : ''}`) +
    requestSummary(r, 'ca') +
    button(`${env.siteUrl}/admin/sollicituds/${r.id}`, 'Revisa-la i envia el preu');
  return { to, subject: 'Lau&Pau · Sol·licitud de personalització nova', html: layout(body, 'ca'), replyTo: r.email };
}

/** Aviso a la tienda: pago cobrado que necesita revisión manual (importe distinto, pedido cancelado…). */
export function storePaymentAlertMail(to: string, orderId: number, reason: string, amountCents: number) {
  const n = orderNumber(orderId);
  const body =
    h1(`Revisa el pagament de la comanda ${n}`) +
    `<p style="margin:0 0 14px;padding:12px 16px;background:#FBEAE7;color:#9B2C1E;border-radius:12px;"><b>Atenció:</b> ${esc(reason)}</p>` +
    p(`Import cobrat per Redsys: <b>${formatPrice(amountCents, 'ca')}</b>. La comanda no s’ha marcat com a pagada automàticament.`) +
    button(`${env.siteUrl}/admin/comandes/${orderId}`, 'Obre la comanda al tauler');
  return { to, subject: `Lau&Pau · Revisa el pagament ${n}`, html: layout(body, 'ca') };
}
