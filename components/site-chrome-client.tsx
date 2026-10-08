'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Handbag, UserCircle, Translate } from '@phosphor-icons/react/dist/ssr';
import { path, switchLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { useCart } from './cart';

type NavItem = { href: string; label: string };

export function LangSwitch({ lang, label, className }: { lang: Lang; label: string; className?: string }) {
  const pathname = usePathname();
  const other: Lang = lang === 'es' ? 'ca' : 'es';
  return (
    <a className={className} href={switchLang(pathname, other)} hrefLang={other} lang={other} data-no-transition>
      <Translate size={18} weight="light" aria-hidden="true" />
      {label}
    </a>
  );
}

/** Botón de la cesta: abre el panel lateral. Sin JavaScript, el enlace lleva a la cesta. */
export function CartLink({ lang, label }: { lang: Lang; label: string; countLabel?: string }) {
  const { count, ready, openDrawer } = useCart();
  const prev = useRef(count);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (ready && count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count, ready]);
  return (
    <a
      className="lp-cartlink"
      href={path(lang, 'carrito')}
      aria-label={`${label}: ${t(lang).cartCount(ready ? count : 0)}`}
      aria-haspopup="dialog"
      onClick={(e) => {
        e.preventDefault();
        openDrawer();
      }}
    >
      <span className="lp-cartlink__label">{label}</span>
      <span key={bump} className={`lp-cartlink__count${bump ? ' is-bump' : ''}`} data-filled={ready && count > 0}>
        {ready && count > 0 ? count : <Handbag size={17} weight="regular" aria-hidden="true" />}
      </span>
    </a>
  );
}

function isActive(pathname: string, href: string): boolean {
  const base = href.split('#')[0];
  if (href.includes('#')) return false;
  return pathname === base || pathname.startsWith(base + '/');
}

export function SiteHeader({ lang, loggedIn, items }: { lang: Lang; loggedIn: boolean; items: NavItem[] }) {
  const d = t(lang);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Cabecera más opaca en cuanto hay contenido debajo.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const accountLabel = loggedIn ? d.account : d.accountPages.login;

  return (
    <>
      <header className="lp-header" data-header data-scrolled={scrolled}>
        <div className="lp-header__bar">
          <Link className="lp-logo" href={path(lang)} aria-label={d.logoHome}>
            <img src={LOGO_SRC} alt={d.logoAlt} width={512} height={512} />
          </Link>
          <nav className="lp-nav" aria-label="Principal">
            <ul>
              {items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} aria-current={isActive(pathname, i.href) ? 'page' : undefined}>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="lp-tools" style={{ justifySelf: 'end' }}>
            <LangSwitch lang={lang} label={lang === 'es' ? 'CA' : 'ES'} className="lp-tool lp-tool--desk" />
            <Link className="lp-tool lp-tool--desk" href={path(lang, 'cuenta')} aria-label={accountLabel} title={accountLabel}>
              <UserCircle size={22} weight="light" aria-hidden="true" />
            </Link>
            <CartLink lang={lang} label={d.cart} />
            <button
              ref={btnRef}
              className="lp-menu-btn"
              type="button"
              aria-expanded={open}
              aria-controls="lp-menu"
              aria-label={open ? d.menuClose : d.menu}
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className="lp-menu" id="lp-menu" data-open={open} aria-hidden={!open} inert={!open ? true : undefined}>
        <nav aria-label="Principal">
          <ul>
            {[...items, { href: path(lang, 'carrito'), label: d.cart }].map((i, idx) => (
              <li key={i.href}>
                <Link
                  className="lp-menu__link"
                  href={i.href}
                  style={{ '--i': idx } as React.CSSProperties}
                  aria-current={isActive(pathname, i.href) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lp-menu__foot">
          <Link className="lp-btn lp-btn--quiet lp-btn--sm" href={path(lang, 'cuenta')} onClick={() => setOpen(false)}>
            <UserCircle size={18} weight="light" aria-hidden="true" />
            {accountLabel}
          </Link>
          <LangSwitch lang={lang} label={d.otherLangLabel} className="lp-btn lp-btn--quiet lp-btn--sm" />
        </div>
      </div>
    </>
  );
}

/** Ruta del logo: en la demo se reescribe a relativa. */
export const LOGO_SRC = '/laupau/marca/logo-final.png';
