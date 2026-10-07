import Link from 'next/link';
import { Price } from './brand';
import { loc, t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';
import { isPersonalizable, totalStock, type CatalogProduct } from '@/lib/shop';

export function ProductCard({ p, lang, priority = false }: { p: CatalogProduct; lang: Lang; priority?: boolean }) {
  const d = t(lang);
  const img = p.images[0];
  const personal = isPersonalizable(p);
  const stock = totalStock(p);
  const soldOut = !personal && (p.variants.length === 0 || stock === 0);
  return (
    <li className={`lp-card lp-reveal${soldOut ? ' lp-card__soldout' : ''}`} data-category={p.categoryId ?? ''}>
      <span className="lp-card__media" data-figure>
        {img ? (
          <img
            src={img.src}
            alt={loc(img.alt, lang)}
            width={img.width}
            height={img.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : null}
        <span className="lp-price-glass">
          <Price cents={p.priceCents} size="sm" lang={lang} />
        </span>
      </span>
      <span className="lp-card__body">
        {p.categoryName ? <span className="lp-card__cat">{loc(p.categoryName, lang)}</span> : null}
        <h3 className="lp-card__name">
          <Link href={path(lang, 'productos', p.slug)}>{loc(p.name, lang)}</Link>
        </h3>
        <span className="lp-card__desc">{loc(p.shortDescription, lang)}</span>
        <span className="lp-card__foot">
          {soldOut ? (
            <span className="lp-badge lp-badge--muted">{d.catalog.soldOut}</span>
          ) : p.badge ? (
            <span className="lp-badge">{loc(p.badge, lang)}</span>
          ) : (
            <span />
          )}
          <span className="lp-card__go">
            {personal ? d.catalog.request : d.catalog.buy} <span aria-hidden="true">&rarr;</span>
          </span>
        </span>
      </span>
    </li>
  );
}
