import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { Sheen } from '@/components/brand';
import { AccountShell, FormMessage } from '@/components/account-ui';
import { defaultAddress, deleteAddress, saveAddress } from '@/app/actions/account';
import { isLang, path } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { requireCustomer } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { countryName, countryOptions } from '@/lib/countries';
import { shippingCountries } from '@/lib/shop';

export const metadata: Metadata = { robots: { index: false } };

export default async function Addresses({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ e?: string; ok?: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { e, ok } = await searchParams;
  const user = await requireCustomer(path(lang, 'cuenta', 'acceder'));
  const d = t(lang);
  const a = d.accountPages;
  const c = d.checkout;
  const [rows, countries] = await Promise.all([
    db.select().from(schema.addresses).where(eq(schema.addresses.userId, user.id)).orderBy(asc(schema.addresses.id)),
    shippingCountries()
  ]);
  const options = countryOptions(countries.codes, true, lang);
  return (
    <AccountShell lang={lang} active="addresses" name={user.name || user.email}>
      <div className="lp-stack--lg">
        <FormMessage error={e ? a.errors.required : null} ok={ok ? a.saved : null} />
        {rows.length ? (
          <div className="lp-addresses">
            {rows.map((r) => (
              <div key={r.id} className="lp-panel lp-stack">
                <p className="lp-address">
                  {r.label ? <b>{r.label}</b> : null}
                  {r.isDefault ? <span className="lp-status-pill" style={{ marginLeft: 8 }}>{a.default}</span> : null}
                  <br />
                  {r.data.name}
                  <br />
                  {r.data.line1}
                  {r.data.line2 ? `, ${r.data.line2}` : ''}
                  <br />
                  {r.data.postalCode} {r.data.city}
                  {r.data.region ? `, ${r.data.region}` : ''}
                  <br />
                  {countryName(r.data.country, lang)}
                </p>
                <div className="lp-buy__row">
                  {!r.isDefault ? (
                    <form action={defaultAddress}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="id" value={r.id} />
                      <button className="lp-textbtn" type="submit">{a.makeDefault}</button>
                    </form>
                  ) : null}
                  <form action={deleteAddress}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="id" value={r.id} />
                    <button className="lp-textbtn" type="submit">{a.delete}</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="lp-lead">{a.noAddresses}</p>
        )}

        <form className="lp-panel lp-form" action={saveAddress} style={{ maxWidth: 680 }}>
          <h2 style={{ fontSize: 'var(--h3)' }}>{a.addAddress}</h2>
          <input type="hidden" name="lang" value={lang} />
          <div className="lp-field">
            <label htmlFor="ad-label">{a.label}</label>
            <input className="lp-input" id="ad-label" name="label" maxLength={60} />
          </div>
          <div className="lp-field">
            <label htmlFor="ad-name">{c.name}</label>
            <input className="lp-input" id="ad-name" name="name" defaultValue={user.name} autoComplete="name" />
          </div>
          <div className="lp-field">
            <label htmlFor="ad-line1">{c.line1}</label>
            <input className="lp-input" id="ad-line1" name="line1" required autoComplete="address-line1" />
          </div>
          <div className="lp-field">
            <label htmlFor="ad-line2">{c.line2}</label>
            <input className="lp-input" id="ad-line2" name="line2" autoComplete="address-line2" />
          </div>
          <div className="lp-row lp-row--3">
            <div className="lp-field">
              <label htmlFor="ad-city">{c.city}</label>
              <input className="lp-input" id="ad-city" name="city" required autoComplete="address-level2" />
            </div>
            <div className="lp-field">
              <label htmlFor="ad-pc">{c.postalCode}</label>
              <input className="lp-input" id="ad-pc" name="postalCode" required autoComplete="postal-code" />
            </div>
          </div>
          <div className="lp-row lp-row--2">
            <div className="lp-field">
              <label htmlFor="ad-region">{c.region}</label>
              <input className="lp-input" id="ad-region" name="region" autoComplete="address-level1" />
            </div>
            <div className="lp-field">
              <label htmlFor="ad-country">{c.country}</label>
              <select className="lp-select" id="ad-country" name="country" defaultValue="AD">
                {options.map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <button className="lp-btn" type="submit">
              <Sheen />
              {a.save}
            </button>
          </div>
        </form>
      </div>
    </AccountShell>
  );
}
