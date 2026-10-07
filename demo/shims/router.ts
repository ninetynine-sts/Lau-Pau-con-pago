/**
 * Enrutado por hash para la demo: #/es/productos ↔ ruta «/es/productos».
 * Las rutas catalanas (/ca/productes) se traducen a las internas como hace el middleware real.
 */
import { useSyncExternalStore } from 'react';
import { SEGMENTS_ES } from '@/lib/routes';

export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h.split('?')[0] : '/ca';
}

export function currentQuery(): URLSearchParams {
  const h = window.location.hash.replace(/^#/, '');
  const i = h.indexOf('?');
  return new URLSearchParams(i >= 0 ? h.slice(i + 1) : '');
}

/** Segmentos internos (castellanos) de la ruta actual. */
export function internalSegments(p = currentPath()): string[] {
  const parts = p.split('/').filter(Boolean);
  if (parts[0] === 'ca') return ['ca', ...parts.slice(1).map((s) => SEGMENTS_ES[s] ?? s)];
  return parts;
}

let pendingScroll = true;
export function navigate(to: string, { replace = false } = {}) {
  const target = '#' + (to.startsWith('/') ? to : '/' + to);
  pendingScroll = true;
  if (replace) history.replaceState(history.state, '', target);
  else if (window.location.hash !== target) window.location.hash = target;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function consumeScroll(): boolean {
  const s = pendingScroll;
  pendingScroll = false;
  return s;
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useHashPath(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/ca');
}

export function useHashFull(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => '');
}
