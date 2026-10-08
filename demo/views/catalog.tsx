/** Portada, catálogo, ficha, personalización, quiénes somos y legales: las mismas vistas que la web real. */
import Link from 'next/link';
import { BtnIcon } from '@/components/brand';
import { AboutView, CatalogView, HomeView, PersonalizeView, ProductView } from '@/components/views/storefront';
import { path, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { LEGAL_PAGES, legalDoc, type LegalPage } from '@/lib/legal';
import { useDB } from '../mock/store';
import { getProduct, listProducts } from '../mock/shop';

function useDefaults() {
  const db = useDB();
  const u = db.users.find((x) => x.id === db.session.customerId) ?? null;
  return { name: u?.name ?? '', email: u?.email ?? '', phone: u?.phone ?? '' };
}

export function Home({ lang }: { lang: Lang }) {
  const db = useDB();
  return <HomeView lang={lang} products={listProducts()} instagram={db.settings.instagram} />;
}

export function Catalog({ lang }: { lang: Lang }) {
  const db = useDB();
  return <CatalogView lang={lang} products={listProducts()} categories={db.categories} />;
}

export function ProductPage({ lang, slug }: { lang: Lang; slug: string }) {
  const defaults = useDefaults();
  const p = getProduct(slug);
  if (!p) return <NotFound lang={lang} />;
  return <ProductView lang={lang} p={p} defaults={defaults} />;
}

export function Personalize({ lang }: { lang: Lang }) {
  const defaults = useDefaults();
  return <PersonalizeView lang={lang} products={listProducts()} defaults={defaults} />;
}

export function About({ lang }: { lang: Lang }) {
  const db = useDB();
  return <AboutView lang={lang} instagram={db.settings.instagram} />;
}

export function Legal({ lang, page }: { lang: Lang; page: string }) {
  const db = useDB();
  if (!LEGAL_PAGES.includes(page as LegalPage)) return <NotFound lang={lang} />;
  const doc = legalDoc(page as LegalPage, lang, db.settings.storeEmail);
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <h1 style={{ fontSize: 'var(--h2)' }}>{doc.title}</h1>
        <div className="lp-legal" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </section>
  );
}

export function NotFound({ lang }: { lang: Lang }) {
  const d = t(lang).notFound;
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg lp-center">
        <h1>{d.title}</h1>
        <p className="lp-lead lp-measure--narrow">{d.text}</p>
        <div className="lp-actions">
          <Link className="lp-btn lp-btn--icon" href={path(lang)}>
            {d.home}
            <BtnIcon />
          </Link>
          <Link className="lp-btn lp-btn--ghost" href={path(lang, 'productos')}>
            {d.products}
          </Link>
        </div>
      </div>
    </section>
  );
}
