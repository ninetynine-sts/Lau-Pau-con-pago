'use client';

/**
 * Cesta en el navegador. Solo guarda qué variantes y cuántas unidades: los precios y
 * las existencias los vuelve a calcular el servidor en cada paso.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartItem = { variantId: number; quantity: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  ready: boolean;
  add: (variantId: number, quantity: number) => void;
  set: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  /** Panel lateral de la cesta. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'lp-cart';

function read(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .map((i) => ({ variantId: Number(i?.variantId), quantity: Math.floor(Number(i?.quantity)) }))
      .filter((i) => Number.isSafeInteger(i.variantId) && i.variantId > 0 && i.quantity > 0)
      .slice(0, 50);
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* sin almacenamiento: la cesta dura lo que dure la pestaña */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((fn: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = fn(prev).filter((i) => i.quantity > 0);
      write(next);
      return next;
    });
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      add: (variantId, quantity) =>
        update((prev) => {
          const found = prev.find((i) => i.variantId === variantId);
          if (found) return prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i));
          return [...prev, { variantId, quantity: Math.min(99, quantity) }];
        }),
      set: (variantId, quantity) =>
        update((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(0, Math.min(99, quantity)) } : i))),
      remove: (variantId) => update((prev) => prev.filter((i) => i.variantId !== variantId)),
      clear: () => update(() => []),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false)
    }),
    [items, ready, update, drawerOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart fuera de CartProvider');
  return c;
}
