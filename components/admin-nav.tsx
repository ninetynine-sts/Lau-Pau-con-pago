'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNav({ items }: { items: { href: string; label: string; count?: number }[] }) {
  const pathname = usePathname();
  return (
    <nav className="ad-nav" aria-label="Tauler">
      {items.map((i) => {
        const active = i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}>
            <span>{i.label}</span>
            {i.count ? <span className="ad-nav__count">{i.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
