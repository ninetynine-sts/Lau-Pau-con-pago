import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { CheckoutForm } from '@/components/checkout-form';
import { Hearts, Sheen } from '@/components/brand';
import { isLang, path } from '@/lib/routes';
import { formatDate, loc, t } from '@/lib/i18n';
import { getOrderByPublicId } from '@/lib/orders';
import { getUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { shippingCountries } from '@/lib/shop';
import { countryOptions } from '@/lib/countries';

export const metadata: Metadata = { robots: { index: false } };

/** Enlace de pago que reciben las clientas cuando la tienda confirma una personalización. */
export default async function PayLink({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const order = await getOrderByPublicId(id);
  if (!order || order.source !== 'request') notFound();
  const d = t(lang);

  const expired = order.paymentLinkExpiresAt !== null && order.paymentLinkExpiresAt < new Date();
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

  const [request] = await db.select().from(schema.requests).where(eq(schema.requests.orderId, order.id)).limit(1);
  const user = await getUser();
  const [addresses, countries] = await Promise.all([
    user ? db.select().from(schema.addresses).where(eq(schema.addresses.userId, user.id)) : Promise.resolve([]),
    shippingCountries()
  ]);

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
          lang={lang}
          mode="request"
          requestOrderId={order.publicId}
          requestItems={order.items.map((i) => ({
            name: loc(i.name, lang),
            detail: i.personalization?.letter
              ? `${d.order.letter}: ${i.personalization.letter}`
              : i.personalization?.idea
                ? `${d.order.idea}: ${i.personalization.idea}`
                : '',
            quantity: i.quantity,
            totalCents: i.unitPriceCents * i.quantity,
            image: i.image
          }))}
          defaults={{ email: order.email, name: order.customerName, phone: order.phone ?? '' }}
          loggedIn={!!user}
          loginHref={`${path(lang, 'cuenta', 'acceder')}?next=${encodeURIComponent(path(lang, 'pagar', order.publicId))}`}
          cartHref={path(lang, 'carrito')}
          addresses={addresses.map((a) => ({ id: a.id, label: a.label, data: a.data }))}
          countries={countryOptions(countries.codes, countries.anywhere, lang)}
          termsHref={path(lang, 'legal', 'condiciones')}
          privacyHref={path(lang, 'legal', 'privacidad')}
        />
      </div>
    </section>
  );
}
