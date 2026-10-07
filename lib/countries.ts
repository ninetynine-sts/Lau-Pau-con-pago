import type { Lang } from './routes';

/** Países que se ofrecen cuando hay un envío «a cualquier país». */
export const COMMON_COUNTRIES = [
  'AD', 'ES', 'FR', 'PT', 'IT', 'DE', 'BE', 'NL', 'LU', 'IE', 'AT', 'CH', 'GB', 'DK', 'SE', 'FI', 'NO',
  'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'GR', 'RO', 'BG', 'EE', 'LV', 'LT', 'MT', 'CY', 'MC', 'US', 'CA', 'MX', 'AR'
];

export function countryName(code: string, lang: Lang): string {
  try {
    return new Intl.DisplayNames([lang === 'ca' ? 'ca' : 'es'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function countryOptions(codes: string[], anywhere: boolean, lang: Lang) {
  const set = new Set(codes);
  if (anywhere) COMMON_COUNTRIES.forEach((c) => set.add(c));
  const list = [...set].map((code) => ({ code, name: countryName(code, lang) }));
  list.sort((a, b) => a.name.localeCompare(b.name, lang));
  // Andorra y España primero: son los destinos habituales.
  const first = ['AD', 'ES'].filter((c) => set.has(c));
  return [...first.map((c) => list.find((x) => x.code === c)!), ...list.filter((x) => !first.includes(x.code))];
}
