import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutView } from '@/components/views/storefront';
import { isLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  return { title: t(L).nav.about, description: t(L).about.p[0] };
}

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const settings = await getSettings();
  return <AboutView lang={lang} instagram={settings.instagram} />;
}
