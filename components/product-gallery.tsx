'use client';

/**
 * Fotos de la ficha: la principal y, si hay más de una, miniaturas para cambiarla.
 * El estado «cargada» se lleva aquí (el cargador global solo mira la primera foto
 * de cada página), así cada foto nueva entra con el mismo fundido que las demás.
 */
import { useCallback, useState } from 'react';
import { loc } from '@/lib/i18n';
import type { Lang } from '@/lib/routes';
import type { CatalogProduct } from '@/lib/catalog';

export function ProductGallery({
  p,
  lang,
  className,
  eager = false,
  label
}: {
  p: CatalogProduct;
  lang: Lang;
  className: string;
  eager?: boolean;
  /** Texto de cada miniatura; «{n}» se sustituye por el número de foto. */
  label: string;
}) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const img = p.images[index] ?? p.images[0];
  const markLoaded = useCallback((n: number) => setLoaded((s) => (s[n] ? s : { ...s, [n]: true })), []);
  const many = p.images.length > 1;

  return (
    <div className={`${className} lp-gallery`}>
      <figure className="lp-bezel lp-gallery__main" data-figure>
        <div className="lp-bezel__core">
          {img ? (
            <img
              key={img.src}
              ref={(el) => {
                if (el && el.complete && el.naturalWidth > 0) markLoaded(index);
              }}
              src={img.src}
              alt={loc(img.alt, lang)}
              width={img.width}
              height={img.height}
              loading={eager || index > 0 ? 'eager' : 'lazy'}
              fetchPriority={eager && index === 0 ? 'high' : undefined}
              decoding="async"
              data-loaded={loaded[index] ? 'true' : undefined}
              onLoad={() => markLoaded(index)}
              onError={() => markLoaded(index)}
            />
          ) : null}
        </div>
      </figure>
      {many ? (
        <div className="lp-gallery__thumbs" role="group" aria-label={loc(p.name, lang)}>
          {p.images.map((im, n) => (
            <button
              key={im.src}
              type="button"
              className="lp-gallery__thumb"
              aria-pressed={n === index}
              aria-label={label.replace('{n}', String(n + 1))}
              onClick={() => setIndex(n)}
            >
              <img src={im.src} alt="" width={im.width} height={im.height} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
