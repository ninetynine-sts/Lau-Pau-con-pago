/**
 * Tipos y utilidades del catálogo sin dependencias de servidor: los usan tanto las
 * páginas reales como la demo en el navegador.
 */
import type { Localized, Personalization, ProductImage } from './db/schema';

export type CatalogVariant = {
  id: number;
  name: Localized | null;
  /** «#rrggbb» o «#rrggbb,#rrggbb»; null si la variante no es un color. */
  color: string | null;
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

/** Colores válidos de una muestra (uno o dos «#rrggbb»). Cualquier otra cosa → []. */
export function swatchColors(color: string | null | undefined): string[] {
  if (!color) return [];
  const parts = color.split(',').map((c) => c.trim());
  return parts.length <= 2 && parts.every((c) => /^#[0-9a-f]{6}$/i.test(c)) ? parts : [];
}

/** ¿El producto se elige por color? (alguna variante activa lleva muestra). */
export function hasColors(p: { variants: { color: string | null }[] }): boolean {
  return p.variants.some((v) => swatchColors(v.color).length > 0);
}

/**
 * Llegeix el color d'una variant del formulari del tauler (camps v_<k>_hascolor, _c1, _two, _c2).
 * Només accepta #rrggbb; qualsevol altra cosa queda sense color.
 */
export function colorFromForm(get: (name: string) => string, k: string): string | null {
  const hex = (name: string) => {
    const v = get(name).trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(v) ? v : null;
  };
  const c1 = get(`v_${k}_hascolor`) === 'on' ? hex(`v_${k}_c1`) : null;
  const c2 = c1 && get(`v_${k}_two`) === 'on' ? hex(`v_${k}_c2`) : null;
  return c1 ? (c2 ? `${c1},${c2}` : c1) : null;
}
