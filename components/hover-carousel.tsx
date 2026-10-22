'use client';

/**
 * Carrusel de fotos de la ficha (de momento, solo Mocadors).
 *
 * - Ratón: en el tercio derecho avanza y en el izquierdo retrocede, de una en una.
 *   Primer paso a los 300 ms y después uno cada 1,2 s mientras el ratón siga en esa
 *   zona. Se para al instante si el ratón sale del carrusel o vuelve al centro.
 *   No hay capas por encima de la foto: los clics y el botón de compra funcionan igual.
 * - Táctil: se desliza con el dedo; el desplazamiento vertical de la página no se bloquea.
 * - Teclado: flechas izquierda/derecha y botones anterior/siguiente.
 * - Si hay tantas fotos como colores, cada foto es un color: al elegir un color se va a
 *   su foto y al pasar de foto se elige ese color (lo que se ve es lo que se compra).
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type TouchEvent } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';
import { loc } from '@/lib/i18n';
import type { Lang } from '@/lib/routes';
import type { CatalogProduct } from '@/lib/catalog';

const FIRST_DELAY = 300;
const INTERVAL = 1200;
/** Ancho de cada zona activa (izquierda y derecha), en fracción del carrusel. */
const ZONE = 1 / 3;

export const VARIANT_EVENT = 'lp:variant';
export const SLIDE_EVENT = 'lp:slide';

export type CarouselLabels = {
  region: string;
  prev: string;
  next: string;
  /** «{n}» = número de foto. */
  photo: string;
  /** «{n}» de «{total}». */
  counter: string;
};

export function HoverCarousel({
  p,
  lang,
  className,
  labels
}: {
  p: CatalogProduct;
  lang: Lang;
  className: string;
  labels: CarouselLabels;
}) {
  const images = p.images;
  const total = images.length;
  const linked = total > 1 && p.variants.length === total;
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [drag, setDrag] = useState<number | null>(null);
  const [zone, setZone] = useState<-1 | 0 | 1>(0);

  const indexRef = useRef(0);
  const viewport = useRef<HTMLDivElement>(null);
  const timers = useRef<{ t?: number; i?: number }>({});
  const touch = useRef<{ id: number; x: number; y: number; axis: 'x' | 'y' | null } | null>(null);

  const go = useCallback(
    (n: number, announce = true) => {
      const next = Math.max(0, Math.min(total - 1, n));
      if (next === indexRef.current) return false;
      indexRef.current = next;
      setIndex(next);
      if (announce && linked) {
        window.dispatchEvent(new CustomEvent(SLIDE_EVENT, { detail: { variantId: p.variants[next].id } }));
      }
      return true;
    },
    [total, linked, p.variants]
  );

  const stop = useCallback(() => {
    window.clearTimeout(timers.current.t);
    window.clearInterval(timers.current.i);
    timers.current = {};
  }, []);

  // Al elegir un color en el selector, ir a su foto (sin volver a avisar al selector).
  useEffect(() => {
    if (!linked) return;
    const onVariant = (e: Event) => {
      const id = (e as CustomEvent<{ variantId: number }>).detail?.variantId;
      const n = p.variants.findIndex((v) => v.id === id);
      if (n >= 0) {
        stop();
        go(n, false);
      }
    };
    window.addEventListener(VARIANT_EVENT, onVariant);
    return () => window.removeEventListener(VARIANT_EVENT, onVariant);
  }, [linked, p.variants, go, stop]);

  useEffect(() => stop, [stop]);

  const startZone = (dir: -1 | 1) => {
    stop();
    const step = () => {
      if (!go(indexRef.current + dir)) stop();
    };
    timers.current.t = window.setTimeout(() => {
      step();
      timers.current.i = window.setInterval(step, INTERVAL);
    }, FIRST_DELAY);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const next: -1 | 0 | 1 = x < ZONE ? -1 : x > 1 - ZONE ? 1 : 0;
    if (next === zone) return;
    setZone(next);
    if (next === 0) stop();
    else startZone(next);
  };

  const onPointerLeave = () => {
    stop();
    setZone(0);
  };

  /* ---- táctil: arrastrar con el dedo ---- */
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = { id: t.identifier, x: t.clientX, y: t.clientY, axis: null };
    stop();
  };
  const onTouchMove = (e: TouchEvent) => {
    const s = touch.current;
    if (!s) return;
    const t = Array.from(e.touches).find((x) => x.identifier === s.id);
    if (!t) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (!s.axis && Math.hypot(dx, dy) > 8) s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (s.axis !== 'x') return;
    // Resistencia en los extremos.
    const atEdge = (dx > 0 && indexRef.current === 0) || (dx < 0 && indexRef.current === total - 1);
    setDrag(atEdge ? dx / 3 : dx);
  };
  const onTouchEnd = () => {
    const s = touch.current;
    touch.current = null;
    if (!s || s.axis !== 'x' || drag === null) {
      setDrag(null);
      return;
    }
    const w = viewport.current?.clientWidth ?? 1;
    if (Math.abs(drag) > w * 0.18) go(indexRef.current + (drag < 0 ? 1 : -1));
    setDrag(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(indexRef.current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(indexRef.current - 1);
    }
  };

  const markLoaded = (n: number) => setLoaded((s) => (s[n] ? s : { ...s, [n]: true }));
  const caption = linked ? loc(p.variants[index].name, lang) : '';
  const offset = drag === null ? `${-index * 100}%` : `calc(${-index * 100}% + ${drag}px)`;

  return (
    <div className={`${className} lp-gallery lp-carousel`} data-zone={zone || undefined}>
      <div
        className="lp-bezel lp-carousel__frame"
        role="region"
        aria-roledescription="carrusel"
        aria-label={labels.region}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div
          className="lp-bezel__core lp-carousel__viewport"
          ref={viewport}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <ul className="lp-carousel__track" style={{ transform: `translate3d(${offset}, 0, 0)` }} data-dragging={drag !== null || undefined}>
            {images.map((im, n) => (
              <li
                key={im.src}
                className="lp-carousel__slide"
                role="group"
                aria-roledescription="foto"
                aria-label={labels.counter.replace('{n}', String(n + 1)).replace('{total}', String(total))}
                aria-hidden={n !== index}
              >
                <img
                  ref={(el) => {
                    if (el && el.complete && el.naturalWidth > 0) markLoaded(n);
                  }}
                  src={im.src}
                  alt={loc(im.alt, lang)}
                  width={im.width}
                  height={im.height}
                  loading="eager"
                  fetchPriority={n === 0 ? 'high' : 'low'}
                  decoding="async"
                  draggable={false}
                  data-loaded={loaded[n] ? 'true' : undefined}
                  onLoad={() => markLoaded(n)}
                  onError={() => markLoaded(n)}
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="lp-carousel__arrow lp-carousel__arrow--prev"
            aria-label={labels.prev}
            onClick={() => {
              stop();
              go(indexRef.current - 1);
            }}
            disabled={index === 0}
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <button
            type="button"
            className="lp-carousel__arrow lp-carousel__arrow--next"
            aria-label={labels.next}
            onClick={() => {
              stop();
              go(indexRef.current + 1);
            }}
            disabled={index === total - 1}
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>

      <p className="lp-carousel__meta" aria-live="polite">
        <span className="lp-carousel__name">{caption}</span>
        <span className="lp-carousel__count">
          {index + 1} / {total}
        </span>
      </p>

      <div className="lp-gallery__thumbs" role="group" aria-label={loc(p.name, lang)}>
        {images.map((im, n) => (
          <button
            key={im.src}
            type="button"
            className="lp-gallery__thumb"
            aria-pressed={n === index}
            aria-label={labels.photo.replace('{n}', String(n + 1))}
            onClick={() => {
              stop();
              go(n);
            }}
          >
            <img src={im.src} alt="" width={im.width} height={im.height} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
}
