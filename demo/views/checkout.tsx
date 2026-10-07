/** Cesta, compra, pasarela Redsys simulada, página del pedido y enlace de pago. */
import { useState } from 'react';
import Link from 'next/link';
import { Hearts, Sheen, Amp } from '@/components/brand';
import { CartView } from '@/components/cart-view';
import { CheckoutForm } from '@/components/checkout-form';
import { OrderSummary } from '@/components/order-summary';
import { AutoRefresh, RetryPaymentButton } from '@/components/order-client';
import { countryOptions } from '@/lib/countries';
import { formatDate, formatPrice, loc, orderNumber, t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';
import { useDB } from '../mock/store';
import { applyNotification, orderByPublicId, shippingCountries } from '../mock/shop';
import { navigate } from '../shims/router';
import { NotFound } from './catalog';

export function CartPage({ lang }: { lang: Lang }) {
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <h1 style={{ fontSize: 'var(--h2)' }}>{t(lang).cartPage.title}</h1>
        <CartView lang={lang} />
      </div>
    </section>
  );
}

function useCheckoutProps(lang: Lang) {
  const db = useDB();
  const user = db.users.find((u) => u.id === db.session.customerId) ?? null;
  const addresses = user ? db.addresses.filter((a) => a.userId === user.id).sort((a, b) => Number(b.isDefault) - Number(a.isDefault)) : [];
  const c = shippingCountries();
  return {
    user,
    common: {
      lang,
      loggedIn: !!user,
      cartHref: path(lang, 'carrito'),
      addresses: addresses.map((a) => ({ id: a.id, label: a.label, data: a.data })),
      countries: countryOptions(c.codes, c.anywhere, lang),
      termsHref: path(lang, 'legal', 'condiciones'),
      privacyHref: path(lang, 'legal', 'privacidad')
    }
  };
}

export function CheckoutPage({ lang }: { lang: Lang }) {
  const { user, common } = useCheckoutProps(lang);
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <h1 style={{ fontSize: 'var(--h2)' }}>{t(lang).checkout.title}</h1>
        <CheckoutForm
          {...common}
          mode="cart"
          defaults={{ email: user?.email ?? '', name: user?.name ?? '', phone: user?.phone ?? '' }}
          loginHref={path(lang, 'cuenta', 'acceder')}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------- pasarela simulada --- */

export let pendingRedsys: { url: string; fields: Record<string, string> } | null = null;
export function setPendingRedsys(v: typeof pendingRedsys) {
  pendingRedsys = v;
}

export function RedsysSim() {
  const [busy, setBusy] = useState<'' | 'ok' | 'ko'>('');
  if (!pendingRedsys) {
    return (
      <div className="rs-page">
        <div className="rs-card">
          <p>No hay ningún pago en curso.</p>
          <a className="rs-link" href="/ca">
            Volver a la tienda
          </a>
        </div>
      </div>
    );
  }
  const params = JSON.parse(decodeURIComponent(escape(atob(pendingRedsys.fields.Ds_MerchantParameters)))) as Record<string, string>;
  const ca = params.DS_MERCHANT_CONSUMERLANGUAGE === '003';
  const amount = formatPrice(Number(params.DS_MERCHANT_AMOUNT), ca ? 'ca' : 'es');
  const finish = (ok: boolean) => {
    setBusy(ok ? 'ok' : 'ko');
    window.setTimeout(() => {
      applyNotification(params.DS_MERCHANT_ORDER, ok); // lo que haría la notificación online
      pendingRedsys = null;
      navigate(ok ? params.DS_MERCHANT_URLOK : params.DS_MERCHANT_URLKO);
    }, 1100);
  };
  return (
    <div className="rs-page">
      <div className="rs-banner">Pantalla simulada · en la tienda real aquí aparece la página de pago del banco (Redsys)</div>
      <div className="rs-card">
        <div className="rs-head">
          <span className="rs-logo">{ca ? "Passarel·la de pagament" : "Pasarela de pago"}</span>
          <span className="rs-secure">{ca ? 'Pagament segur' : 'Pago seguro'}</span>
        </div>
        <dl className="rs-data">
          <dt>{ca ? 'Comerç' : 'Comercio'}</dt>
          <dd>Lau&amp;Pau · {params.DS_MERCHANT_MERCHANTCODE}</dd>
          <dt>{ca ? 'Import' : 'Importe'}</dt>
          <dd className="rs-amount">{amount}</dd>
          <dt>{ca ? 'Comanda' : 'Pedido'}</dt>
          <dd>{params.DS_MERCHANT_ORDER}</dd>
          <dt>{ca ? 'Concepte' : 'Concepto'}</dt>
          <dd>{params.DS_MERCHANT_PRODUCTDESCRIPTION}</dd>
        </dl>
        <div className="rs-form">
          <label>
            {ca ? 'Número de targeta' : 'Número de tarjeta'}
            <input className="rs-input" id="rs-card" defaultValue="4548 8100 0000 0003" readOnly />
          </label>
          <div className="rs-row">
            <label>
              {ca ? 'Caducitat' : 'Caducidad'}
              <input className="rs-input" id="rs-exp" defaultValue="12/49" readOnly />
            </label>
            <label>
              CVV
              <input className="rs-input" id="rs-cvv" defaultValue="123" readOnly />
            </label>
          </div>
        </div>
        <button className="rs-pay" type="button" disabled={!!busy} onClick={() => finish(true)}>
          {busy === 'ok' ? (ca ? 'Autoritzant…' : 'Autorizando…') : ca ? `Paga ${amount}` : `Pagar ${amount}`}
        </button>
        <button className="rs-deny" type="button" disabled={!!busy} onClick={() => finish(false)}>
          {busy === 'ko' ? 'Denegando…' : 'Simular pago denegado'}
        </button>
        <details className="rs-tech">
          <summary>Qué recibe Redsys (datos firmados)</summary>
          <pre>{JSON.stringify(params, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- pedido --- */

function Icon({ tone }: { tone: 'ok' | 'ko' | 'wait' }) {
  return (
    <span className="lp-result__icon" data-tone={tone} aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {tone === 'ok' ? <path d="M5 12.5l4.2 4.2L19 7" /> : tone === 'ko' ? <path d="M7 7l10 10M17 7L7 17" /> : <path d="M12 7v5l3 2" />}
      </svg>
    </span>
  );
}

export function OrderPage({ lang, id, r }: { lang: Lang; id: string; r: string | null }) {
  useDB();
  const order = orderByPublicId(id);
  if (!order) return <NotFound lang={lang} />;
  const d = t(lang);
  const pending = order.status === 'pending_payment';
  const failed = pending && (r === 'ko' || order.lastPayment?.status === 'denied');
  const waiting = pending && !failed && r === 'ok';
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg" style={{ maxWidth: 820 }}>
        <div className="lp-result">
          {pending ? (
            failed ? (
              <>
                <Icon tone="ko" />
                <h1 style={{ fontSize: 'var(--h2)' }}>{d.order.failedTitle}</h1>
                <p className="lp-lead lp-measure--narrow">{d.order.failedText}</p>
                <RetryPaymentButton publicId={order.publicId} label={d.order.retry} />
              </>
            ) : waiting ? (
              <>
                <Icon tone="wait" />
                <h1 style={{ fontSize: 'var(--h2)' }}>{d.order.pendingTitle}</h1>
                <p className="lp-lead lp-measure--narrow">{d.order.pendingText}</p>
                <AutoRefresh />
              </>
            ) : (
              <>
                <Icon tone="wait" />
                <h1 style={{ fontSize: 'var(--h2)' }}>{d.order.title(orderNumber(order.id))}</h1>
                <p className="lp-lead">{d.order.statuses.pending_payment}</p>
                <RetryPaymentButton publicId={order.publicId} label={d.checkout.pay} />
              </>
            )
          ) : (
            <>
              <Icon tone={order.status === 'cancelled' || order.status === 'refunded' ? 'ko' : 'ok'} />
              <h1 style={{ fontSize: 'var(--h2)' }}>{r === 'ok' ? d.order.thanks : d.order.title(orderNumber(order.id))}</h1>
              {r === 'ok' ? <p className="lp-lead lp-measure--narrow">{d.order.paidText}</p> : null}
            </>
          )}
        </div>
        <dl className="lp-facts">
          <div>
            <dt>{d.order.title('').trim()}</dt>
            <dd>{orderNumber(order.id)}</dd>
          </div>
          <div>
            <dt>{d.order.date}</dt>
            <dd>{formatDate(order.createdAt, lang)}</dd>
          </div>
          <div>
            <dt>{d.order.status}</dt>
            <dd>
              <span className="lp-status-pill" data-s={order.status}>
                {d.order.statuses[order.status]}
              </span>
            </dd>
          </div>
        </dl>
        <OrderSummary
          lang={lang}
          items={order.items}
          subtotalCents={order.subtotalCents}
          discountCents={order.discountCents}
          shippingCents={order.shippingCents}
          totalCents={order.totalCents}
          couponCode={order.couponCode}
          shippingAddress={order.shippingAddress}
          shippingName={order.shippingName}
          trackingNumber={order.trackingNumber}
          trackingUrl={order.trackingUrl}
        />
      </div>
    </section>
  );
}

export function PayLinkPage({ lang, id }: { lang: Lang; id: string }) {
  const { common } = useCheckoutProps(lang);
  const db = useDB();
  const order = orderByPublicId(id);
  const d = t(lang);
  if (!order || order.source !== 'request') return <NotFound lang={lang} />;
  const expired = !!order.paymentLinkExpiresAt && new Date(order.paymentLinkExpiresAt) < new Date();
  if (order.status !== 'pending_payment' || expired) {
    return (
      <section className="lp-section lp-section--seamless">
        <div className="lp-container lp-stack--lg lp-center">
          <Hearts set={[[26, 70], [34, 96]]} />
          <h1 style={{ fontSize: 'var(--h2)' }}>{order.status === 'pending_payment' ? d.payLink.expired : d.payLink.paid}</h1>
          <Link className="lp-btn" href={path(lang, 'pedido', order.publicId)}>
            <Sheen />
            {d.accountPages.view}
          </Link>
        </div>
      </section>
    );
  }
  const request = db.requests.find((r) => r.orderId === order.id);
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <div className="lp-stack lp-measure">
          <p className="lp-eyebrow lp-eyebrow--accent">{d.personalize.eyebrow}</p>
          <h1 style={{ fontSize: 'var(--h2)' }}>{d.payLink.title}</h1>
          <p className="lp-lead">{d.payLink.intro}</p>
          {request?.adminMessage ? (
            <p className="lp-note">
              <b>{d.payLink.message}:</b> {request.adminMessage}
            </p>
          ) : null}
          {order.paymentLinkExpiresAt ? <p className="lp-field__help">{d.payLink.validUntil(formatDate(order.paymentLinkExpiresAt, lang))}</p> : null}
        </div>
        <CheckoutForm
          {...common}
          mode="request"
          requestOrderId={order.publicId}
          requestItems={order.items.map((i) => ({
            name: loc(i.name, lang),
            detail: i.personalization?.letter ? `${d.order.letter}: ${i.personalization.letter}` : i.personalization?.idea ? `${d.order.idea}: ${i.personalization.idea}` : '',
            quantity: i.quantity,
            totalCents: i.unitPriceCents * i.quantity,
            image: i.image
          }))}
          defaults={{ email: order.email, name: order.customerName, phone: order.phone ?? '' }}
          loginHref={path(lang, 'cuenta', 'acceder')}
        />
      </div>
    </section>
  );
}

export { Amp };
