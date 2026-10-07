'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { path, switchLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { useCart } from './cart';

export function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname();
  const other: Lang = lang === 'es' ? 'ca' : 'es';
  return (
    <a href={switchLang(pathname, other)} hrefLang={other} lang={other} data-no-transition>
      {label}
    </a>
  );
}

export function CartLink({ lang, label }: { lang: Lang; label: string; countLabel: string }) {
  const { count, ready } = useCart();
  return (
    <Link className="lp-cartlink" href={path(lang, 'carrito')} aria-label={`${label}: ${t(lang).cartCount(count)}`}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path
          d="M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="lp-cartlink__label">{label}</span>
      {ready && count > 0 ? <span className="lp-cartlink__count">{count}</span> : null}
    </Link>
  );
}
