export const ORDER_STATUS_CA: Record<string, string> = {
  pending_payment: 'Pendent de pagament',
  paid: 'Pagada · per preparar',
  preparing: 'En preparació',
  shipped: 'Enviada / a punt',
  delivered: 'Lliurada',
  cancelled: 'Cancel·lada',
  refunded: 'Reemborsada'
};

export const REQUEST_STATUS_CA: Record<string, string> = {
  new: 'Nova',
  quoted: 'Enllaç enviat',
  paid: 'Pagada',
  rejected: 'Rebutjada',
  expired: 'Caducada'
};

export const COUPON_KIND_CA: Record<string, string> = {
  percent: 'Percentatge',
  fixed: 'Import fix',
  free_shipping: 'Enviament gratuït'
};

export function eur(cents: number): string {
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Import en format editable: 1250 → «12,50». */
export function eurInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function dateCa(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('ca-ES', withTime ? { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Andorra' } : { dateStyle: 'medium', timeZone: 'Europe/Andorra' }).format(new Date(d));
}
