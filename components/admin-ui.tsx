export const OK_CA: Record<string, string> = {
  desat: 'Canvis desats.',
  eliminat: 'Eliminat.',
  enviat: "Enllaç de pagament enviat a la clienta.",
  rebutjada: 'Sol·licitud rebutjada.',
  estoc: 'Estoc actualitzat.',
  revisat: 'Enviaments marcats com a revisats.',
  admin: 'Compte d’administració creat.',
  treta: 'Accés al tauler retirat.'
};

export const ERR_CA: Record<string, string> = {
  nom: 'Cal el nom en castellà i en català.',
  preu: 'Revisa el preu (per exemple, 12,50).',
  slug: 'L’adreça del producte no és vàlida.',
  foto: 'No s’ha pogut pujar alguna foto.',
  estat: 'Estat no vàlid.',
  nopagada: 'Una comanda pendent de pagament només es pot cancel·lar: el pagament el confirma el banc.',
  pagada: 'Aquesta sol·licitud ja està pagada.',
  codi: 'Cal un codi (lletres i números).',
  tipus: 'Tipus de cupó no vàlid.',
  valor: 'Indica el valor del descompte.',
  repetit: 'Ja existeix un cupó amb aquest codi.',
  correu: 'Revisa el correu electrònic.',
  contrasenya: 'La contrasenya ha de tenir almenys 12 caràcters.',
  tumateixa: 'No et pots treure l’accés a tu mateixa.'
};

export function Flash({ ok, e, msg }: { ok?: string; e?: string; msg?: string }) {
  if (e) return <p className="lp-alert lp-alert--error" role="alert">{ERR_CA[e] ?? 'Hi ha hagut un error.'}{msg ? ` ${msg}` : ''}</p>;
  if (ok) return <p className="lp-alert lp-alert--ok" role="status">{OK_CA[ok] ?? 'Fet.'}</p>;
  return null;
}

export function Status({ s, label }: { s: string; label: string }) {
  return (
    <span className="lp-status-pill" data-s={s}>
      {label}
    </span>
  );
}
