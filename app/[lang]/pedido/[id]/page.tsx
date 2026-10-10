import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OrderSummary } from '@/components/order-summary';
import { AutoRefresh, RetryPaymentButton } from '@/components/order-client';
import { isLang } from '@/lib/routes';
import { formatDate, orderNumber, t } from '@/lib/i18n';
import { getOrderByPublicId } from '@/lib/orders';

export const metadata: Metadata = { robots: { index: false } };

type Props = { params: Promise<{ lang: string; id: string }>; searchParams: Promise<{ r?: string }> };

function Icon({ tone }: { tone: 'ok' | 'ko' | 'wait' }) {
  return (
    <span className="lp-result__icon" data-tone={tone} aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {tone === 'ok' ? <path d="M5 12.5l4.2 4.2L19 7" /> : tone === 'ko' ? <path d="M7 7l10 10M17 7L7 17" /> : <path d="M12 7v5l3 2" />}
      </svg>
    </span>
  );
}

/**
 * Página del pedido (URL privada con identificador aleatorio). Es también la vuelta
 * desde Redsys: el estado sale de la base de datos, nunca de los parámetros de la URL.
 */
export default async function OrderPage({ params, searchParams }: Props) {
  const { lang, id } = await params;
  const { r } = await searchParams;
  if (!isLang(lang)) notFound();
  const order = await getOrderByPublicId(id);
  if (!order) notFound();
  const d = t(lang);

  const pending = order.status === 'pending_payment';
  // Cobro recibido que la tienda está revisando: se muestra «confirmando», nunca otro botón de pago.
  const failed = pending && !order.authorized && (r === 'ko' || order.lastPayment?.status === 'denied');
  const waiting = pending && !failed && (r === 'ok' || order.authorized);

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
          shippingAddress={order.shippingAddress ?? null}
          shippingName={order.shippingName ?? null}
          trackingNumber={order.trackingNumber}
          trackingUrl={order.trackingUrl}
        />
      </div>
    </section>
  );
}
