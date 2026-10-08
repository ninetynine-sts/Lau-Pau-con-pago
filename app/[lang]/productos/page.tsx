import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogView } from '@/components/views/storefront';
import { isLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { getCategories, listProducts } from '@/lib/shop';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  return { title: t(L).nav.products, description: t(L).catalog.lead };
}

export default async function Catalog({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);
  return <CatalogView lang={lang} products={products} categories={categories} />;
}
