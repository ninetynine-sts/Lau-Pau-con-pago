/**
 * Tipos y utilidades del catálogo sin dependencias de servidor: los usan tanto las
 * páginas reales como la demo en el navegador.
 */
import type { Localized, Personalization, ProductImage } from './db/schema';

export type CatalogVariant = {
  id: number;
  name: Localized | null;
  stock: number | null;
  priceCents: number;
};

export type CatalogProduct = {
  id: number;
  slug: string;
  ref: string;
  categoryId: string | null;
  categoryName: Localized | null;
  name: Localized;
  shortDescription: Localized;
  description: Localized;
  badge: Localized | null;
  priceCents: number;
  images: ProductImage[];
  personalization: Personalization;
  details: { label: Localized; value: Localized }[];
  featured: boolean;
  variants: CatalogVariant[];
};

export type Category = { id: string; name: Localized; sort: number };

export function isPersonalizable(p: { personalization: Personalization }): boolean {
  return p.personalization.mode !== 'none';
}

/** Existencias totales de las variantes activas; null si alguna no lleva control. */
export function totalStock(p: CatalogProduct): number | null {
  let total = 0;
  for (const v of p.variants) {
    if (v.stock === null) return null;
    total += Math.max(0, v.stock);
  }
  return total;
}

export function isSoldOut(p: CatalogProduct): boolean {
  return !isPersonalizable(p) && (p.variants.length === 0 || totalStock(p) === 0);
}
