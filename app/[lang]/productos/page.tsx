import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Hearts } from '@/components/brand';
import { ProductCard } from '@/components/product-card';
import { CatalogFilters } from '@/components/catalog-filters';
import { isLang, type Lang } from '@/lib/routes';
import { loc, t } from '@/lib/i18n';
import { getCategories, listProducts } from '@/lib/shop';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  return { title: t(L).nav.products, description: t(L).catalog.lead };
}

export default async function Catalog({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);
  const used = new Set(products.map((p) => p.categoryId));
  const filters = [
    { id: 'all', label: d.catalog.all },
    ...categories.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, label: loc(c.name, lang) }))
  ];

  return (
    <>
      <section className="lp-section lp-section--seamless">
        <div className="lp-container">
          <div className="lp-stack lp-measure">
            <p className="lp-eyebrow lp-eyebrow--accent">{d.catalog.eyebrow}</p>
            <h1>{d.catalog.title}</h1>
            <p className="lp-lead">{d.catalog.lead}</p>
          </div>
          <CatalogFilters
            filters={filters}
            label={d.catalog.filterLabel}
            countLabels={{ one: d.catalog.count(1), other: d.catalog.count(99).replace('99', '{n}') }}
          />
          <ul className="lp-grid" data-grid>
            {products.map((p, i) => (
              <ProductCard key={p.id} p={p} lang={lang} priority={i < 3} />
            ))}
          </ul>
          <p data-empty hidden>
            {d.catalog.empty}
          </p>
          <p className="lp-note" style={{ marginTop: 'clamp(28px,4vw,44px)', maxWidth: '62ch' }}>
            {d.catalog.note}
          </p>
        </div>
      </section>
      <section className="lp-section lp-section--tight">
        <div className="lp-container">
          <Hearts set={[[26, 70], [34, 96]]} />
        </div>
      </section>
    </>
  );
}
