import { notFound } from 'next/navigation';
import { HomeView } from '@/components/views/storefront';
import { isLang } from '@/lib/routes';
import { listProducts } from '@/lib/shop';
import { getSettings } from '@/lib/settings';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [products, settings] = await Promise.all([listProducts(), getSettings()]);
  return <HomeView lang={lang} products={products} instagram={settings.instagram} />;
}
