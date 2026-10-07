import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLang, type Lang } from '@/lib/routes';
import { LEGAL_PAGES, legalDoc, type LegalPage } from '@/lib/legal';
import { getSettings } from '@/lib/settings';

type Props = { params: Promise<{ lang: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, page } = await params;
  if (!LEGAL_PAGES.includes(page as LegalPage)) return {};
  const L: Lang = isLang(lang) ? lang : 'es';
  return { title: legalDoc(page as LegalPage, L, '').title };
}

export default async function Legal({ params }: Props) {
  const { lang, page } = await params;
  if (!isLang(lang) || !LEGAL_PAGES.includes(page as LegalPage)) notFound();
  const { storeEmail } = await getSettings();
  const doc = legalDoc(page as LegalPage, lang, storeEmail);
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <h1 style={{ fontSize: 'var(--h2)' }}>{doc.title}</h1>
        {/* Contenido estático del propio proyecto (lib/legal.ts), no de usuarios. */}
        <div className="lp-legal" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </section>
  );
}
