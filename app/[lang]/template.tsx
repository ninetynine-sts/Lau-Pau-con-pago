/** Se vuelve a montar en cada navegación: el contenido nuevo entra con un fundido corto. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="lp-page">{children}</div>;
}
