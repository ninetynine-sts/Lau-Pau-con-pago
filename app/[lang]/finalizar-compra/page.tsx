import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { CheckoutForm } from '@/components/checkout-form';
import { isLang, path } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { getUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { shippingCountries } from '@/lib/shop';
import { countryOptions } from '@/lib/countries';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : 'es').checkout.title, robots: { index: false } };
}

export default async function Checkout({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const user = await getUser();
  const [addresses, countries] = await Promise.all([
    user ? db.select().from(schema.addresses).where(eq(schema.addresses.userId, user.id)) : Promise.resolve([]),
    shippingCountries()
  ]);
  addresses.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <h1 style={{ fontSize: 'var(--h2)' }}>{d.checkout.title}</h1>
        <CheckoutForm
          lang={lang}
          mode="cart"
          defaults={{ email: user?.email ?? '', name: user?.name ?? '', phone: user?.phone ?? '' }}
          loggedIn={!!user}
          loginHref={`${path(lang, 'cuenta', 'acceder')}?next=${encodeURIComponent(path(lang, 'finalizar-compra'))}`}
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
