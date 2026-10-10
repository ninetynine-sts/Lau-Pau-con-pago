/** Camp de color d'una variant al tauler (el fan servir el tauler real i la demo). */
/** Color de la mostra: un o dos tons (estampats). Sense marcar «Té color», la variant no mostra mostra. */
export function VariantColor({ k, color }: { k: string; color: string | null }) {
  const [c1, c2] = (color ?? '').split(',');
  const valid = (c?: string) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : undefined);
  return (
    <div className="lp-field ad-color">
      <span className="ad-color__label">Color</span>
      <div className="ad-color__row">
        <label className="lp-check" style={{ fontSize: 13 }}>
          <input type="checkbox" name={`v_${k}_hascolor`} defaultChecked={Boolean(valid(c1))} /> Té color
        </label>
        <input className="ad-color__input" type="color" name={`v_${k}_c1`} defaultValue={valid(c1) ?? '#c8b8a6'} aria-label="Color principal" />
        <input className="ad-color__input" type="color" name={`v_${k}_c2`} defaultValue={valid(c2) ?? '#ffffff'} aria-label="Segon color" />
        <label className="lp-check" style={{ fontSize: 13 }}>
          <input type="checkbox" name={`v_${k}_two`} defaultChecked={Boolean(valid(c2))} /> Dos colors
        </label>
      </div>
    </div>
  );
}

