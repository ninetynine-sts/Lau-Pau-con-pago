import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PersonalizeView } from '@/components/views/storefront';
import { isLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { listProducts } from '@/lib/shop';
import { getUser } from '@/lib/auth';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  return { title: t(L).nav.personalize, description: t(L).home.perText };
}

export default async function Personalize({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [products, user] = await Promise.all([listProducts(), getUser()]);
  return <PersonalizeView lang={lang} products={products} defaults={{ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' }} />;
}
