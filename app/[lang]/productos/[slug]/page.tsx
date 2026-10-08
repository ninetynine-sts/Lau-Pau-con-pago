import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductView } from '@/components/views/storefront';
import { isLang, type Lang } from '@/lib/routes';
import { loc } from '@/lib/i18n';
import { getProduct, isPersonalizable } from '@/lib/shop';
import { getUser } from '@/lib/auth';

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: loc(p.name, L),
    description: loc(p.shortDescription, L),
    openGraph: { images: p.images[0] ? [p.images[0].src] : undefined }
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const p = await getProduct(slug);
  if (!p) notFound();
  const user = isPersonalizable(p) ? await getUser() : null;
  return <ProductView lang={lang} p={p} defaults={{ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' }} />;
}
