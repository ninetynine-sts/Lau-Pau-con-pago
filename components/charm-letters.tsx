'use client';

/**
 * Tarjeta del charm de estrella: el llavero se balancea suavemente desde la anilla y la
 * letra (personalizable) va girando sobre el cordón y cambiando: P, L, A, M…
 *
 * Usa una foto del mismo llavero sin la letra y dibuja la letra encima, así cualquier
 * letra queda en su sitio. Mientras esa capa no está lista se ve la foto original.
 * Se pausa fuera de pantalla y no se activa con «reducir movimiento».
 * La capa no recibe eventos de puntero: no tapa el enlace ni el botón de la tarjeta.
 */
import { useEffect, useRef, useState } from 'react';

const LETTERS = ['P', 'L', 'A', 'M', 'J', 'S', 'C', 'E', 'N', 'R'];
const EVERY = 2400;
const FLIP = 260;

export function CharmLetters({ src, width, height }: { src: string; width: number; height: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [n, setN] = useState(0);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setOn(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Oculta la foto original cuando la capa animada ya se ve (sin parpadeo).
  useEffect(() => {
    const media = ref.current?.closest<HTMLElement>('.lp-card__media');
    if (!media) return;
    if (ready) media.setAttribute('data-charm', 'on');
    return () => media.removeAttribute('data-charm');
  }, [ready]);

  useEffect(() => {
    if (!ready || !visible) return;
    let t: number | undefined;
    const iv = window.setInterval(() => {
      setFlip(true);
      t = window.setTimeout(() => {
        setN((k) => (k + 1) % LETTERS.length);
        setFlip(false);
      }, FLIP);
    }, EVERY);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(t);
    };
  }, [ready, visible]);

  return (
    <span className="lp-charm" ref={ref} aria-hidden="true" data-ready={ready || undefined} data-paused={!visible || undefined}>
      {on ? (
        <span className="lp-charm__stage">
          <span className="lp-charm__fit" style={{ aspectRatio: `${width} / ${height}` }}>
            <span className="lp-charm__sway">
              <img
                src={src}
                alt=""
                width={width}
                height={height}
                decoding="async"
                ref={(img) => {
                  if (img && img.complete && img.naturalWidth > 0) setReady(true);
                }}
                onLoad={() => setReady(true)}
              />
              <span className="lp-charm__bead">
                <span className="lp-charm__letter" data-l={LETTERS[n]} data-flip={flip || undefined}>
                  {LETTERS[n]}
                </span>
              </span>
            </span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
