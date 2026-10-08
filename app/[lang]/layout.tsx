import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import '../styles/laupau.css';
import '../styles/shop.css';
import { Ambient, AmpTemplate, Loader, SvgDefs } from '@/components/brand';
import { Effects } from '@/components/effects';
import { CartDrawer } from '@/components/cart-drawer';
import { BOOT } from '@/lib/boot';
import { CartProvider } from '@/components/cart';
import { Footer, Header } from '@/components/site-chrome';
import { isLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { getUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { env } from '@/lib/env';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  const desc = t(L).home.lead;
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: 'Lau&Pau · ' + t(L).home.eyebrow, template: '%s · Lau&Pau' },
    description: desc,
    icons: { icon: '/laupau/marca/logo-final.png', apple: '/laupau/marca/logo-final.png' },
    openGraph: {
      type: 'website',
      siteName: 'Lau&Pau',
      locale: L === 'ca' ? 'ca_ES' : 'es_ES',
      images: ['/laupau/marca/logo-final.png'],
      description: desc
    }
  };
}

export const viewport: Viewport = { themeColor: '#FAF9F6', colorScheme: 'light' };

export default async function PublicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [user, settings] = await Promise.all([getUser(), getSettings()]);
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const d = t(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preload" href="/laupau/fonts/fraunces-regular.woff" as="font" type="font/woff" crossOrigin="" />
        <link rel="preload" href="/laupau/fonts/manrope.woff" as="font" type="font/woff" crossOrigin="" />
        {/* Marca que hay JavaScript (las apariciones dependen de él) y salta la carga si ya se vio. */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: BOOT
          }}
        />
      </head>
      <body>
        <CartProvider>
          <Loader />
          <AmpTemplate />
          <SvgDefs />
          <Ambient />
          <a className="lp-skip" href="#contenido">
            {d.skip}
          </a>
          <Header lang={lang} loggedIn={!!user} />
          <main id="contenido">{children}</main>
          <Footer lang={lang} storeEmail={settings.storeEmail} instagram={settings.instagram} />
          <CartDrawer lang={lang} />
          <Effects />
        </CartProvider>
      </body>
    </html>
  );
}
