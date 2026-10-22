'use client';

/**
 * Portada (home) · tarjeta de Mocadors: con el ratón sobre la foto, los modelos se
 * suceden en orden con un fundido, uno cada 1,5 s. Al salir, vuelve con un fundido a la
 * foto de portada. En pantallas táctiles no hace nada (la foto queda estática).
 *
 * Las fotos van en una capa encima de la foto de portada, sin eventos de puntero: no tapan
 * el enlace de la tarjeta ni cambian ningún tamaño. Se precargan cuando la página está en
 * reposo, solo en dispositivos con ratón.
 */
import { useEffect, useRef, useState } from 'react';

const FIRST = 600;
const EVERY = 1500;

export function CardCycle({ images }: { images: { src: string; width?: number; height?: number }[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);
  // Capa visible (índice en images) y la anterior, que se queda debajo mientras la nueva
  // se funde: así nunca asoma la portada entre dos modelos. -1 = solo la portada.
  const [{ active, prev }, setLayers] = useState({ active: -1, prev: -1 });
  const total = images.length;

  useEffect(() => {
    if (total < 2 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const card = ref.current?.closest<HTMLElement>('.lp-card');
    const media = ref.current?.closest<HTMLElement>('.lp-card__media');
    if (!card || !media) return;

    // Precarga en reposo: monta las capas y descarga/decodifica las fotos.
    const idle = (cb: () => void) => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb, { timeout: 2500 });
      else setTimeout(cb, 1200);
    };
    idle(() => {
      setArmed(true);
      images.forEach((im) => {
        const pre = new Image();
        pre.decoding = 'async';
        pre.src = im.src;
      });
    });

    let inside = false;
    let t: number | undefined;
    let iv: number | undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = () => {
      if (reduce) return;
      setArmed(true);
      const step = () => setLayers(({ active: a }) => ({ prev: a, active: ((a < 0 ? 0 : a) + 1) % total }));
      t = window.setTimeout(() => {
        step();
        iv = window.setInterval(step, EVERY);
      }, FIRST);
    };
    const stop = () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
      setLayers({ active: -1, prev: -1 });
    };

    // El enlace de la tarjeta cubre toda la tarjeta: se mira si el ratón está sobre la foto.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = media.getBoundingClientRect();
      const now = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (now === inside) return;
      inside = now;
      if (now) start();
      else stop();
    };
    const onLeave = () => {
      if (!inside) return;
      inside = false;
      stop();
    };
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    return () => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
      window.clearTimeout(t);
      window.clearInterval(iv);
    };
  }, [images, total]);

  return (
    <span className="lp-card__cycle" ref={ref} aria-hidden="true">
      {armed
        ? images.map((im, n) => (
            <img
              key={im.src}
              src={im.src}
              alt=""
              width={im.width}
              height={im.height}
              decoding="async"
              data-active={active === n || undefined}
              data-prev={prev === n || undefined}
            />
          ))
        : null}
    </span>
  );
}
