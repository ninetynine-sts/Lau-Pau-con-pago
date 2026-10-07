import type { AnchorHTMLAttributes, ReactNode } from 'react';

/** <Link> de la demo: un enlace normal; el interceptor global lo convierte en navegación por hash. */
export default function Link({
  href,
  children,
  prefetch: _p,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; prefetch?: boolean }) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
