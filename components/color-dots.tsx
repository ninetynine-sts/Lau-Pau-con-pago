/**
 * Muestras de color sin JavaScript: el fondo de cada muestra y los puntos de las tarjetas.
 */
import { swatchColors } from '@/lib/catalog';

/** Fondo de la muestra: un color liso o dos en diagonal (estampados y combinados). */
export function swatchBackground(color: string | null): string {
  const [a, b] = swatchColors(color);
  if (!a) return 'var(--fill-2)';
  return b ? `linear-gradient(135deg, ${a} 0 50%, ${b} 50% 100%)` : a;
}

/** Puntos de color pequeños para las tarjetas del catálogo. */
export function ColorDots({ colors, label }: { colors: (string | null)[]; label: string }) {
  const shown = colors.slice(0, 6);
  const rest = colors.length - shown.length;
  return (
    <span className="lp-dots">
      <span className="lp-visually-hidden">{label}</span>
      {shown.map((c, i) => (
        <span key={i} className="lp-dots__dot" aria-hidden="true" style={{ background: swatchBackground(c) }} />
      ))}
      {rest > 0 ? (
        <span className="lp-dots__more" aria-hidden="true">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}
