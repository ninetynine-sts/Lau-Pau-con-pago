import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Price } from './brand';
import { loc, t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';
import { hasColors, isPersonalizable, totalStock, type CatalogProduct } from '@/lib/catalog';
import { ColorDots } from './color-dots';

/**
 * Tarjeta de producto con doble bisel: bandeja exterior + núcleo con la foto.
 * `index` escalona la aparición dentro de cada fila.
 */
export function ProductCard({ p, lang, priority = false, index = 0 }: { p: CatalogProduct; lang: Lang; priority?: boolean; index?: number }) {
  const d = t(lang);
  const img = p.images[0];
  const personal = isPersonalizable(p);
  const stock = totalStock(p);
  const soldOut = !personal && (p.variants.length === 0 || stock === 0);
  return (
    <li
      className={`lp-card lp-reveal${soldOut ? ' lp-card__soldout' : ''}`}
      data-category={p.categoryId ?? ''}
      style={{ '--i': index } as CSSProperties}
    >
      <div className="lp-card__core">
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
          {hasColors(p) && p.variants.length > 1 ? (
            <ColorDots colors={p.variants.map((v) => v.color)} label={d.product.colorsCount(p.variants.length)} />
          ) : null}
          <span className="lp-card__foot">
            {soldOut ? (
              <span className="lp-badge lp-badge--muted">{d.catalog.soldOut}</span>
            ) : p.badge ? (
              <span className="lp-badge">{loc(p.badge, lang)}</span>
            ) : (
              <span />
            )}
            <span className="lp-card__go">
              {personal ? d.catalog.request : d.catalog.buy}
              <span className="lp-card__go-icon" aria-hidden="true">
                <ArrowRight size={14} weight="bold" />
              </span>
            </span>
          </span>
        </span>
      </div>
    </li>
  );
}
