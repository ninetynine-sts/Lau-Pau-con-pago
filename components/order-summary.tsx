import { formatPrice, loc, t } from '@/lib/i18n';
import { countryName } from '@/lib/countries';
import type { Lang } from '@/lib/routes';
import type { Address, ItemPersonalization, Localized } from '@/lib/db/schema';

type Item = {
  id: number;
  name: Localized;
  variantName: Localized | null;
  image: string | null;
  unitPriceCents: number;
  quantity: number;
  personalization: ItemPersonalization | null;
};

export function OrderSummary({
  lang,
  items,
  subtotalCents,
  discountCents,
  shippingCents,
  totalCents,
  couponCode,
  shippingAddress,
  shippingName,
  trackingNumber,
  trackingUrl
}: {
  lang: Lang;
  items: Item[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  shippingAddress: Address | null;
  shippingName: Localized | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}) {
  const d = t(lang);
  return (
    <div className="lp-stack--lg">
      <div className="lp-panel lp-stack">
        <h2 style={{ fontSize: 'var(--h3)' }}>{d.order.items}</h2>
        <ul className="lp-mini">
          {items.map((it) => (
            <li key={it.id}>
              <span className="lp-mini__img">
                {it.image ? <img src={it.image} alt="" /> : null}
                <span className="lp-mini__qty">{it.quantity}</span>
              </span>
              <span>
                <b>{loc(it.name, lang)}</b>
                {it.variantName ? <span className="lp-line__meta" style={{ display: 'block' }}>{loc(it.variantName, lang)}</span> : null}
                {it.personalization?.letter ? (
                  <span className="lp-line__meta" style={{ display: 'block' }}>
                    {d.order.letter}: {it.personalization.letter}
                  </span>
                ) : null}
                {it.personalization?.idea ? (
                  <span className="lp-line__meta" style={{ display: 'block' }}>
                    {d.order.idea}: {it.personalization.idea}
                  </span>
                ) : null}
              </span>
              <span style={{ fontWeight: 700 }}>{formatPrice(it.unitPriceCents * it.quantity, lang)}</span>
            </li>
          ))}
        </ul>
        <dl className="lp-totals">
          <div>
            <dt>{d.checkout.subtotal}</dt>
            <dd>{formatPrice(subtotalCents, lang)}</dd>
          </div>
          {discountCents ? (
            <div>
              <dt>
                {d.checkout.discount}
                {couponCode ? ` (${couponCode})` : ''}
              </dt>
              <dd>−{formatPrice(discountCents, lang)}</dd>
            </div>
          ) : null}
          <div>
            <dt>{d.checkout.shippingCost}</dt>
            <dd>{shippingCents ? formatPrice(shippingCents, lang) : d.checkout.free}</dd>
          </div>
          <div className="lp-totals__grand">
            <dt>{d.checkout.total}</dt>
            <dd>{formatPrice(totalCents, lang)}</dd>
          </div>
        </dl>
      </div>

      {shippingName ? (
        <div className="lp-panel lp-stack">
          <h2 style={{ fontSize: 'var(--h3)' }}>{shippingAddress ? d.order.shipTo : d.order.pickup}</h2>
          <p className="lp-address">
            <b>{loc(shippingName, lang)}</b>
            {shippingAddress ? (
              <>
                <br />
                {shippingAddress.name}
                <br />
                {shippingAddress.line1}
                {shippingAddress.line2 ? (
                  <>
                    <br />
                    {shippingAddress.line2}
                  </>
                ) : null}
                <br />
                {shippingAddress.postalCode} {shippingAddress.city}
                {shippingAddress.region ? `, ${shippingAddress.region}` : ''}
                <br />
                {countryName(shippingAddress.country, lang)}
              </>
            ) : null}
          </p>
          {trackingNumber ? (
            <p className="lp-address">
              {d.order.tracking}:{' '}
              {trackingUrl ? (
                <a className="lp-link" href={trackingUrl} rel="noopener" target="_blank">
                  {trackingNumber}
                </a>
              ) : (
                <b>{trackingNumber}</b>
              )}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
