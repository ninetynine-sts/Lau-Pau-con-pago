'use client';

/**
 * Comportamiento visual de la web, portado de laupau.js:
 *  - cabecera (borde al hacer scroll) y menú móvil,
 *  - pantalla de carga con la «&» (primera visita de la sesión),
 *  - transición entre páginas,
 *  - «&» en bucle mientras carga cada fotografía,
 *  - corazones colgantes de cristal (cuerda Verlet, arrastre, inercia al scroll),
 *  - corazones de fondo en los márgenes,
 *  - brillo de los botones y aparición al hacer scroll.
 *
 * Se vuelve a montar en cada cambio de ruta y limpia sus escuchas al desmontarse.
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HEART_PATH } from './brand';

type Cleanup = () => void;

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG_NS = 'http://www.w3.org/2000/svg';
const HEART_VIEWBOX = '0 0 100 93.99';

function measureAmpersands(root: ParentNode = document) {
  root.querySelectorAll<SVGPathElement>('.lp-amp:not(.lp-amp--solid) path').forEach((p) => {
    try {
      const len = p.getTotalLength();
      if (len > 0) p.style.setProperty('--len', String(Math.ceil(len)));
    } catch {
      /* sin layout todavía */
    }
  });
}

/* ------------------------------------------------------------- cabecera --- */

function initHeader(): Cleanup {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!header) return () => {};
  const desktop = window.matchMedia('(min-width: 880px)');
  const sync = () => {
    if (!nav || !toggle) return;
    if (desktop.matches) {
      nav.hidden = false;
      toggle.setAttribute('aria-expanded', 'false');
    } else if (toggle.getAttribute('aria-expanded') !== 'true') nav.hidden = true;
  };
  const onToggle = () => {
    if (!toggle || !nav) return;
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.hidden = open;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      toggle.setAttribute('aria-expanded', 'false');
      if (nav) nav.hidden = true;
      toggle.focus();
    }
  };
  if (toggle && nav) {
    toggle.hidden = false;
    toggle.setAttribute('aria-expanded', 'false');
    sync();
    desktop.addEventListener('change', sync);
    toggle.addEventListener('click', onToggle);
    document.addEventListener('keydown', onKey);
  }
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.dataset.scrolled = String(window.scrollY > 8);
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    desktop.removeEventListener('change', sync);
    toggle?.removeEventListener('click', onToggle);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
  };
}

/* ---------------------------------------------------- pantalla de carga --- */

function initLoader() {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!loader) return;
  measureAmpersands(loader);
  try {
    sessionStorage.setItem('lp-visto', '1');
  } catch {
    /* sin almacenamiento: la carga funciona igual */
  }
  const start = performance.now();
  const MIN = reduce() ? 0 : 1500;
  let done = false;
  const remove = () => {
    if (done) return;
    done = true;
    loader.dataset.done = 'true';
    // Se oculta en vez de borrarse: el nodo es de React y debe seguir donde React lo dejó.
    window.setTimeout(() => (loader.hidden = true), 700);
  };
  const whenReady = () => window.setTimeout(remove, Math.max(0, MIN - (performance.now() - start)));
  if (document.readyState === 'complete') whenReady();
  else window.addEventListener('load', whenReady, { once: true });
  window.setTimeout(remove, 5200);
}

/* ------------------------------------------- transición entre páginas --- */

function initTransitions(): Cleanup {
  const template = document.querySelector<HTMLTemplateElement>('[data-amp-template]');
  if (!template || reduce()) return () => {};
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link || link.target === '_blank' || link.hasAttribute('download') || link.dataset.noTransition !== undefined) return;
    let url: URL;
    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return;
    if (document.querySelector('.lp-transition')) return;
    const overlay = document.createElement('div');
    overlay.className = 'lp-transition';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.appendChild(template.content.cloneNode(true));
    document.body.appendChild(overlay);
    measureAmpersands(overlay);
    // Red de seguridad: si la navegación no llega, el velo se retira solo.
    window.setTimeout(() => overlay.remove(), 4000);
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

function clearTransitions() {
  document.querySelectorAll('.lp-transition').forEach((el) => {
    (el as HTMLElement).style.transition = 'opacity 200ms';
    (el as HTMLElement).style.opacity = '0';
    window.setTimeout(() => el.remove(), 220);
  });
}

/* ------------------------------------------ cargadores de fotografía --- */

function initImageLoaders() {
  const template = document.querySelector<HTMLTemplateElement>('[data-amp-template]');
  document.querySelectorAll<HTMLElement>('[data-figure]').forEach((figure) => {
    const img = figure.querySelector('img');
    if (!img || img.dataset.loaded === 'true') return;
    const done = () => {
      img.dataset.loaded = 'true';
      const spinner = figure.querySelector<HTMLElement>('.lp-amp-spinner');
      if (spinner) {
        spinner.dataset.done = 'true';
        window.setTimeout(() => spinner.remove(), 320);
      }
    };
    if (img.complete && img.naturalWidth > 0) {
      img.dataset.loaded = 'true';
      return;
    }
    if (template && !reduce() && !figure.querySelector('.lp-amp-spinner')) {
      const spinner = document.createElement('span');
      spinner.className = 'lp-amp-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      spinner.appendChild(template.content.cloneNode(true));
      figure.appendChild(spinner);
      measureAmpersands(spinner);
    }
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}

/* ----------------------------------------- corazones colgantes de cristal --- */

const MAX_STEP = 0.75;
const DENSITY = 0.062;
const THICKNESS = 0.4;
const BEVEL = 3.5;

function buildHeart(scene: HTMLElement, { light = false } = {}) {
  if (scene.dataset.built === 'true') return;
  scene.dataset.built = 'true';
  const size = parseFloat(getComputedStyle(scene).width) || 32;
  const depth = size * THICKNESS;
  const layers = light ? 10 : Math.min(30, Math.max(16, Math.ceil(depth / MAX_STEP) + 1));
  const step = depth / (layers - 1);
  const frag = document.createDocumentFragment();

  const shape = (attrs: Record<string, string>) => {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', HEART_PATH);
    Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v));
    return p;
  };
  const layer = (z: number, kids: Element[]) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'lp-heart__layer');
    svg.setAttribute('viewBox', HEART_VIEWBOX);
    svg.setAttribute('aria-hidden', 'true');
    svg.style.setProperty('--z', `${z.toFixed(3)}px`);
    kids.forEach((k) => svg.appendChild(k));
    frag.appendChild(svg);
  };
  const clipped = (kids: Element[], opacity?: number) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('clip-path', 'url(#lp-heart-clip)');
    if (opacity != null) g.setAttribute('opacity', String(opacity));
    kids.forEach((k) => g.appendChild(k));
    return g;
  };

  if (!light) {
    const refrac = document.createElement('span');
    refrac.className = 'lp-heart__refrac';
    frag.appendChild(refrac);
  }
  for (let i = 0; i < layers; i += 1) {
    layer(-depth / 2 + step * i, [shape({ fill: 'url(#lp-glass-body)', 'fill-opacity': String(DENSITY) })]);
  }
  const edge = document.createElement('span');
  edge.className = 'lp-heart__edge';
  edge.style.setProperty('--grosor', `${depth.toFixed(2)}px`);
  frag.appendChild(edge);
  (
    [
      [depth / 2, 0.75],
      [-depth / 2, 0.375]
    ] as const
  ).forEach(([z, op]) => {
    layer(z, [clipped([shape({ fill: 'none', stroke: 'url(#lp-glass-bevel)', 'stroke-width': String(BEVEL) })], op)]);
  });
  layer(depth / 2 + 0.2, [
    clipped([shape({ fill: 'url(#lp-glass-caustic)' })]),
    shape({ fill: 'url(#lp-glass-spec)', opacity: '.55' }),
    shape({ fill: 'url(#lp-glass-hot)', opacity: '.55' })
  ]);
  scene.appendChild(frag);
}

const KNOTS = 10;
const GRAVITY = 0.5;
const DAMP = 0.988;
const STIFF = 6;
const SPIN_BRAKE = 0.972;
const DRIFT = 0.18;

type Knot = { x: number; y: number; px: number; py: number; held?: boolean };
type Piece = {
  heart: HTMLElement;
  scene: HTMLElement;
  rope: SVGSVGElement;
  hang: HTMLElement;
  path: SVGPathElement;
  knots: Knot[];
  seg: number;
  width: number;
  length: number;
  spin: number;
  spinVel: number;
  delay: number;
  released: boolean;
  visible: boolean;
  dragging: boolean;
  moved?: boolean;
  grabX?: number;
  grabY?: number;
  taps?: number;
  t0?: number;
};

function initHearts(): Cleanup {
  const hearts = Array.from(document.querySelectorAll<HTMLElement>('[data-hearts] .lp-heart'));
  if (!hearts.length) return () => {};
  const pieces: Piece[] = [];
  const cleanups: Cleanup[] = [];

  hearts.forEach((heart, i) => {
    const scene = heart.querySelector<HTMLElement>('.lp-heart__scene');
    if (!scene) return;
    buildHeart(scene);
    if (reduce()) return;
    const st = getComputedStyle(heart);
    const length = parseFloat(st.getPropertyValue('--thread')) || 72;
    const size = parseFloat(st.getPropertyValue('--size')) || 32;
    const rope = heart.querySelector<SVGSVGElement>('.lp-heart__rope');
    const hang = heart.querySelector<HTMLElement>('.lp-heart__hang');
    const path = rope?.querySelector('path');
    if (!rope || !hang || !path) return;
    const width = size;
    const height = length * 1.08 + size * 1.3;
    rope.setAttribute('viewBox', `0 0 ${width} ${height}`);
    rope.setAttribute('width', String(width));
    rope.setAttribute('height', String(height));
    const seg = length / (KNOTS - 1);
    const incl = ((i % 2 ? 1 : -1) * (18 + i * 3) * Math.PI) / 180;
    const knots = Array.from({ length: KNOTS }, (_, k) => {
      const x = width / 2 + Math.sin(incl) * k * seg;
      const y = Math.cos(incl) * k * seg;
      return { x, y, px: x, py: y };
    });
    pieces.push({ heart, scene, rope, hang, path, knots, seg, width, length, spin: i * 40, spinVel: 0, delay: i * 140, released: false, visible: false, dragging: false });
  });
  if (reduce() || !pieces.length) return () => {};

  const stepRope = (p: Piece) => {
    const n = p.knots;
    for (let k = 1; k < n.length; k += 1) {
      const kn = n[k];
      if (kn.held) continue;
      const vx = (kn.x - kn.px) * DAMP;
      const vy = (kn.y - kn.py) * DAMP;
      kn.px = kn.x;
      kn.py = kn.y;
      kn.x += vx;
      kn.y += vy + GRAVITY * (k === n.length - 1 ? 1.6 : 1);
    }
    for (let it = 0; it < STIFF; it += 1) {
      for (let k = 0; k < n.length - 1; k += 1) {
        const a = n[k];
        const b = n[k + 1];
        let dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.abs(dx) < 1e-4) dx = (k % 2 ? 1 : -1) * 1e-4;
        const d = Math.hypot(dx, dy) || 1e-4;
        const adj = ((d - p.seg) / d) * 0.5;
        const ox = dx * adj;
        const oy = dy * adj;
        const fixA = k === 0 || a.held;
        const fixB = b.held;
        if (fixA && fixB) continue;
        if (fixA) {
          b.x -= ox * 2;
          b.y -= oy * 2;
        } else if (fixB) {
          a.x += ox * 2;
          a.y += oy * 2;
        } else {
          a.x += ox;
          a.y += oy;
          b.x -= ox;
          b.y -= oy;
        }
      }
    }
  };

  const paintRope = (p: Piece) => {
    const n = p.knots;
    let d = `M${n[0].x.toFixed(2)} ${n[0].y.toFixed(2)}`;
    for (let k = 0; k < n.length - 1; k += 1) {
      const mx = (n[k].x + n[k + 1].x) / 2;
      const my = (n[k].y + n[k + 1].y) / 2;
      d += `Q${n[k].x.toFixed(2)} ${n[k].y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
    }
    const u = n[n.length - 1];
    d += `L${u.x.toFixed(2)} ${u.y.toFixed(2)}`;
    p.path.setAttribute('d', d);
  };

  const paint = (p: Piece) => {
    const n = p.knots;
    const u = n[n.length - 1];
    const prev = n[n.length - 2];
    const ang = (Math.atan2(u.x - prev.x, u.y - prev.y) * 180) / Math.PI;
    p.hang.style.setProperty('--hx', `${(u.x - p.width / 2).toFixed(2)}px`);
    p.hang.style.setProperty('--hy', `${u.y.toFixed(2)}px`);
    p.hang.style.setProperty('--ha', `${(-ang).toFixed(2)}deg`);
    p.scene.style.setProperty('--spin', `${(p.spin % 360).toFixed(1)}deg`);
    p.scene.style.setProperty('--tilt', `${(-6 - ang * 0.3).toFixed(1)}deg`);
    paintRope(p);
  };

  let running = false;
  let lastT = 0;
  let acc = 0;
  let alive = true;
  const DT = 1000 / 60;

  const start = () => {
    if (running || !alive) return;
    running = true;
    lastT = 0;
    requestAnimationFrame(tick);
  };

  function tick(now: number) {
    running = false;
    if (!alive) return;
    if (!lastT) lastT = now - DT;
    acc = Math.min(acc + (now - lastT), 250);
    lastT = now;
    const steps = Math.max(1, Math.min(8, Math.round(acc / DT)));
    acc = Math.max(0, acc - steps * DT);
    let keep = false;
    pieces.forEach((p) => {
      if (!p.visible || !p.released || now < (p.t0 || 0)) return;
      keep = true;
      for (let s = 0; s < steps; s += 1) {
        stepRope(p);
        p.spinVel = p.spinVel * SPIN_BRAKE + DRIFT * (1 - SPIN_BRAKE) * 34;
        p.spin += p.spinVel;
      }
      paint(p);
    });
    if (keep) start();
  }

  pieces.forEach((p) => {
    p.heart.classList.add('is-interactive');
    const last = () => p.knots[p.knots.length - 1];
    const local = (e: PointerEvent) => {
      const r = p.heart.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      if (!p.dragging) return;
      const l = local(e);
      const u = last();
      let nx = l.x + (p.grabX ?? 0);
      let ny = l.y + (p.grabY ?? 0);
      if (Math.hypot(nx - u.x, ny - u.y) > 1.5) p.moved = true;
      const dx = nx - p.width / 2;
      const dy = ny;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const cap = p.length * 1.1;
      if (dist > cap) {
        nx = p.width / 2 + (dx / dist) * cap;
        ny = (dy / dist) * cap;
      }
      const adv = nx - u.x;
      u.px = u.x;
      u.py = u.y;
      u.x = nx;
      u.y = ny;
      p.spinVel += Math.max(-9, Math.min(9, adv)) * 0.45;
      paint(p);
      start();
    };
    const release = () => {
      if (!p.dragging) return;
      p.dragging = false;
      delete p.heart.dataset.grabbing;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      const u = last();
      delete u.held;
      if (!p.moved) {
        p.taps = (p.taps || 0) + 1;
        const side = p.taps % 2 ? 1 : -1;
        u.px = u.x + side * 7;
        p.spinVel += side * 18;
      }
      start();
    };
    const onDown = (e: PointerEvent) => {
      if (p.dragging) return;
      p.dragging = true;
      p.moved = false;
      p.heart.dataset.grabbing = 'true';
      const l = local(e);
      const u = last();
      p.grabX = u.x - l.x;
      p.grabY = u.y - l.y;
      u.held = true;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
      window.addEventListener('blur', release);
      e.preventDefault();
      start();
    };
    p.hang.addEventListener('pointerdown', onDown);
    cleanups.push(() => {
      p.hang.removeEventListener('pointerdown', onDown);
      release();
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const piece = pieces.find((p) => p.heart === entry.target);
        if (!piece) return;
        piece.visible = entry.isIntersecting;
        if (entry.isIntersecting && !piece.released) {
          piece.released = true;
          piece.t0 = performance.now() + piece.delay;
        }
      });
      start();
    },
    { rootMargin: '140px 0px' }
  );
  pieces.forEach((p) => io.observe(p.heart));

  let lastScroll = window.scrollY;
  const onScroll = () => {
    const delta = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    pieces.forEach((p) => {
      if (!p.visible) return;
      const pull = Math.max(-14, Math.min(14, delta)) * 0.02;
      p.knots.forEach((n, k) => {
        if (k === 0 || n.held) return;
        n.py += pull * (k / (KNOTS - 1));
      });
      p.spinVel += Math.max(-14, Math.min(14, delta)) * 0.5;
    });
    start();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  pieces.forEach(paint);
  start();

  return () => {
    alive = false;
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    cleanups.forEach((c) => c());
  };
}

/* --------------------------------------------------- fondo ambiental --- */

function initAmbient(): Cleanup {
  const layer = document.querySelector('[data-ambient]');
  if (!layer || reduce() || !window.matchMedia('(min-width: 1280px)').matches) return () => {};
  const pieces = Array.from(layer.querySelectorAll<HTMLElement>('.lp-ambient__piece')).map((el) => {
    const st = getComputedStyle(el);
    const scene = el.querySelector<HTMLElement>('.lp-heart__scene')!;
    buildHeart(scene, { light: true });
    return {
      el,
      scene,
      base: parseFloat(st.getPropertyValue('--base')) || 0,
      par: parseFloat(st.getPropertyValue('--par')) || 0.1,
      thread: parseFloat(st.getPropertyValue('--thread')) || 48,
      vel: 0.18 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      amp: 30 + Math.random() * 14
    };
  });
  if (!pieces.length) return () => {};
  let ticking = false;
  const place = () => {
    ticking = false;
    const vh = window.innerHeight;
    const cycle = vh + 260;
    const y = window.scrollY;
    const t = performance.now() / 1000;
    pieces.forEach((p) => {
      let pos = (p.base * vh - y * p.par - p.thread) % cycle;
      if (pos < 0) pos += cycle;
      p.el.style.setProperty('--y', `${(pos - 180).toFixed(1)}px`);
      p.el.style.setProperty('--sway', `${(Math.sin(t * 0.55 + p.phase) * 4).toFixed(2)}deg`);
      p.scene.style.setProperty('--spin', `${(Math.sin(t * p.vel + p.phase) * p.amp).toFixed(1)}deg`);
    });
  };
  const ask = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(place);
  };
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask, { passive: true });
  const timer = window.setInterval(ask, 90);
  place();
  return () => {
    window.removeEventListener('scroll', ask);
    window.removeEventListener('resize', ask);
    window.clearInterval(timer);
  };
}

/* ------------------------------------------------------ botones y scroll --- */

function initButtonShine(): Cleanup {
  if (reduce()) return () => {};
  const onMove = (e: PointerEvent) => {
    const btn = (e.target as Element)?.closest?.('.lp-btn') as HTMLElement | null;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    btn.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  return () => document.removeEventListener('pointermove', onMove);
}

function initReveal(): Cleanup {
  const items = document.querySelectorAll<HTMLElement>('.lp-reveal:not([data-visible="true"])');
  if (!items.length) return () => {};
  if (reduce() || !('IntersectionObserver' in window)) {
    items.forEach((el) => (el.dataset.visible = 'true'));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.visible = 'true';
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export function Effects() {
  const pathname = usePathname();

  // Una sola vez: pantalla de carga, brillo de botones, transiciones.
  useEffect(() => {
    initLoader();
    const a = initButtonShine();
    const b = initTransitions();
    return () => {
      a();
      b();
    };
  }, []);

  // En cada página.
  useEffect(() => {
    clearTransitions();
    measureAmpersands();
    initImageLoaders();
    const cs = [initHeader(), initHearts(), initAmbient(), initReveal()];
    return () => cs.forEach((c) => c());
  }, [pathname]);

  return null;
}
