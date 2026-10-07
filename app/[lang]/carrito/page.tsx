import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CartView } from '@/components/cart-view';
import { isLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(isLang(lang) ? lang : 'es').cartPage.title, robots: { index: false } };
}

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <h1 style={{ fontSize: 'var(--h2)' }}>{t(lang as Lang).cartPage.title}</h1>
        <CartView lang={lang} />
      </div>
    </section>
  );
}
