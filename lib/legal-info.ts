/**
 * Dades legals de la botiga (les que el banc revisa abans d'activar el TPV).
 * Es desen a la configuració i s'editen des del tauler: no cal tocar codi.
 * Sense «server-only»: també les fa servir la demo del navegador.
 */

export type LegalInfo = {
  /** Raó social o nom i cognoms de la persona que explota el negoci. */
  company: string;
  nrt: string;
  /** Número d'inscripció al Registre de Comerç (si en té). */
  registry: string;
  /** Objecte social / activitat. */
  purposeEs: string;
  purposeCa: string;
  address: string;
  phone: string;
  /** Entitat del TPV Virtual (p. ex. «Creand», «MoraBanc», «Andbank»). */
  bank: string;
  returnDays: number;
  /** Qui paga l'enviament de tornada en una devolució. */
  returnShippingBy: 'client' | 'store';
};

export const EMPTY_LEGAL: LegalInfo = {
  company: '',
  nrt: '',
  registry: '',
  purposeEs: '',
  purposeCa: '',
  address: '',
  phone: '',
  bank: '',
  returnDays: 14,
  returnShippingBy: 'client'
};

/** Camps imprescindibles que encara falten (per avisar al tauler). */
export function missingLegal(l: LegalInfo): string[] {
  const out: string[] = [];
  if (!l.company) out.push('raó social');
  if (!l.nrt) out.push('NRT');
  if (!l.purposeCa && !l.purposeEs) out.push('objecte social');
  if (!l.address) out.push('domicili');
  if (!l.phone) out.push('telèfon');
  if (!l.bank) out.push('entitat del TPV');
  return out;
}
