'use client';

/**
 * Selector de color: una muestra por variante, con los colores reales de las fotos.
 * Accesible como grupo de opciones (flechas para moverse, la opción elegida es la que
 * recibe el foco). Las agotadas se ven tachadas y no se pueden elegir.
 */
import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { swatchBackground } from './color-dots';

export type ColorOption = { id: number; label: string; color: string | null; soldOut?: boolean };

export function ColorPicker({
  options,
  value,
  onChange,
  label,
  soldOutLabel,
  name,
  id
}: {
  options: ColorOption[];
  value: number | undefined;
  onChange: (id: number) => void;
  label: string;
  soldOutLabel: string;
  /** Si se indica, envía el id elegido en formularios normales. */
  name?: string;
  id?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.find((o) => o.id === value);
  const enabled = options.filter((o) => !o.soldOut);

  const move = (e: KeyboardEvent, from: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const list = enabled.length ? enabled : options;
    const pos = list.findIndex((o) => o.id === options[from].id);
    let next = pos;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    else next = (pos + keys[e.key] + list.length) % list.length;
    const target = list[next];
    onChange(target.id);
    refs.current[options.indexOf(target)]?.focus();
  };

  const labelId = `${id ?? 'color'}-label`;
  return (
    <div className="lp-field lp-colors">
      <p className="lp-colors__head" id={labelId}>
        <span className="lp-colors__label">{label}</span>
        <span className="lp-colors__name" aria-live="polite">
          {selected ? selected.label : ''}
          {selected?.soldOut ? ` · ${soldOutLabel}` : ''}
        </span>
      </p>
      <div className="lp-colors__list" role="radiogroup" aria-labelledby={labelId} id={id}>
        {options.map((o, i) => {
          const checked = o.id === value;
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={o.soldOut ? `${o.label} (${soldOutLabel})` : o.label}
              aria-disabled={o.soldOut || undefined}
              title={o.label}
              tabIndex={checked || (!value && i === 0) ? 0 : -1}
              className="lp-swatch"
              data-soldout={o.soldOut || undefined}
              style={{ '--swatch': swatchBackground(o.color) } as CSSProperties}
              onClick={() => !o.soldOut && onChange(o.id)}
              onKeyDown={(e) => move(e, i)}
            >
              <span className="lp-swatch__dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}
    </div>
  );
}
