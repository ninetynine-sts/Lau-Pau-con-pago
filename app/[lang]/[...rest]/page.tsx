import { notFound } from 'next/navigation';

/** Cualquier ruta desconocida dentro de /es o /ca muestra la página 404 con la cabecera de la web. */
export default function CatchAll() {
  notFound();
}
