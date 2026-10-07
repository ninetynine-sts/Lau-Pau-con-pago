/**
 * Cabecera y pie de la web pública.
 */
import Link from 'next/link';
import { path, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { CartLink, LangSwitch } from './site-chrome-client';

export function Header({ lang, loggedIn }: { lang: Lang; loggedIn: boolean }) {
  const d = t(lang);
  const items = [
    { href: path(lang, 'productos'), label: d.nav.products },
    { href: path(lang, 'personaliza'), label: d.nav.personalize },
    { href: path(lang, 'quienes-somos'), label: d.nav.about },
    { href: `${path(lang)}#contacto`, label: d.nav.contact }
  ];
  return (
    <header className="lp-header" data-header>
      <div className="lp-container lp-header__inner">
        <Link className="lp-logo" href={path(lang)} aria-label={d.logoHome}>
          <img src="/laupau/marca/logo-final.png" alt={d.logoAlt} width={512} height={512} fetchPriority="high" />
        </Link>
        <div className="lp-header__tools">
          <button className="lp-nav__toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="lp-nav" hidden>
            <span className="lp-nav__bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {d.menu}
          </button>
          <nav className="lp-nav" id="lp-nav" data-nav aria-label="Principal">
            <ul>
              {items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href}>{i.label}</Link>
                </li>
              ))}
              <li className="lp-nav__account">
                <Link href={path(lang, 'cuenta')}>{loggedIn ? d.account : d.accountPages.login}</Link>
              </li>
              <li className="lp-nav__lang">
                <LangSwitch lang={lang} label={d.otherLangLabel} />
              </li>
            </ul>
          </nav>
          <CartLink lang={lang} label={d.cart} countLabel={d.cartCount(0)} />
        </div>
      </div>
    </header>
  );
}

export function Footer({ lang, storeEmail, instagram }: { lang: Lang; storeEmail: string; instagram: string }) {
  const d = t(lang);
  const nav = [
    { href: path(lang, 'productos'), label: d.nav.products },
    { href: path(lang, 'personaliza'), label: d.nav.personalize },
    { href: path(lang, 'quienes-somos'), label: d.nav.about },
    { href: path(lang, 'cuenta'), label: d.account }
  ];
  const legal = [
    { href: path(lang, 'legal', 'aviso-legal'), label: d.legalLinks.notice },
    { href: path(lang, 'legal', 'condiciones'), label: d.legalLinks.terms },
    { href: path(lang, 'legal', 'envios-y-devoluciones'), label: d.legalLinks.shipping },
    { href: path(lang, 'legal', 'privacidad'), label: d.legalLinks.privacy },
    { href: path(lang, 'legal', 'cookies'), label: d.legalLinks.cookies }
  ];
  return (
    <footer className="lp-footer" id="contacto">
      <div className="lp-container">
        <div className="lp-footer__grid lp-footer__grid--4">
          <div>
            <Link className="lp-logo" href={path(lang)} aria-label={d.logoHome}>
              <img src="/laupau/marca/logo-final.png" alt={d.logoAlt} width={512} height={512} loading="lazy" />
            </Link>
          </div>
          <div>
            <h2>{d.footer.contact}</h2>
            <ul>
              <li>
                {d.footer.writeUs}{' '}
                <a className="lp-link" href={`mailto:${storeEmail}`}>
                  {storeEmail}
                </a>
              </li>
              <li>
                {d.footer.instagram}{' '}
                <a className="lp-link" href={`https://www.instagram.com/${instagram}/`} rel="noopener">
                  @{instagram}
                </a>
              </li>
              <li>{d.footer.country}</li>
            </ul>
          </div>
          <div>
            <h2>{d.footer.navigation}</h2>
            <ul>
              {nav.map((n) => (
                <li key={n.href}>
                  <Link className="lp-link" href={n.href}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>{d.footer.legal}</h2>
            <ul>
              {legal.map((n) => (
                <li key={n.href}>
                  <Link className="lp-link" href={n.href}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="lp-footer__legal">
          <span>© {new Date().getFullYear()} Lau&amp;Pau · Andorra</span>
          <span>{d.footer.taxes}</span>
        </p>
      </div>
    </footer>
  );
}
