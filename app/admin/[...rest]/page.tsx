import { notFound } from 'next/navigation';

/** Cualquier dirección del panel que no existe: 404 renderizado en el servidor (con nonce de la CSP). */
export const dynamic = 'force-dynamic';

export default function AdminUnknown() {
  notFound();
}
