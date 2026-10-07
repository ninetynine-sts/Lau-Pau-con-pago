'use client';

import { useEffect, useState } from 'react';

/** Filtros por categoría del catálogo: ocultan tarjetas sin recargar y recuerdan el filtro en la URL. */
export function CatalogFilters({
  filters,
  label,
  countLabels
}: {
  filters: { id: string; label: string }[];
  label: string;
  countLabels: { one: string; other: string };
}) {
  const [active, setActive] = useState('all');
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const initial = new URL(window.location.href).searchParams.get('categoria');
    if (initial && filters.some((f) => f.id === initial)) setActive(initial);
  }, [filters]);

  useEffect(() => {
    const grid = document.querySelector('[data-grid]');
    if (!grid) return;
    let visible = 0;
    grid.querySelectorAll<HTMLElement>('[data-category]').forEach((li) => {
      const match = active === 'all' || li.dataset.category === active;
      li.hidden = !match;
      if (match) {
        visible += 1;
        li.dataset.visible = 'true';
      }
    });
    const empty = document.querySelector<HTMLElement>('[data-empty]');
    if (empty) empty.hidden = visible > 0;
    setCount(visible);
    const url = new URL(window.location.href);
    if (active === 'all') url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', active);
    history.replaceState(history.state, '', url);
  }, [active]);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 'clamp(28px,4vw,48px) 0 clamp(22px,3vw,32px)'
      }}
    >
      <ul className="lp-filters" aria-label={label}>
        {filters.map((f) => (
          <li key={f.id}>
            <button className="lp-filter" type="button" aria-pressed={active === f.id} onClick={() => setActive(f.id)}>
              {f.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="lp-counter" role="status" aria-live="polite">
        {count === null ? '' : count === 1 ? countLabels.one : countLabels.other.replace('{n}', String(count))}
      </p>
    </div>
  );
}
