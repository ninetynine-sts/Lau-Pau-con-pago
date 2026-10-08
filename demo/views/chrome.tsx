import type { ReactNode } from 'react';
import { Ambient, AmpTemplate, Loader, SvgDefs } from '@/components/brand';
import { Effects } from '@/components/effects';
import { CartDrawer } from '@/components/cart-drawer';
import { Footer, Header } from '@/components/site-chrome';
import type { Lang } from '@/lib/routes';
import { useDB } from '../mock/store';

/** Mismo armazón que app/[lang]/layout.tsx: cabecera, pie y cesta lateral reales. */
export function PublicShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const db = useDB();
  return (
    <>
      <Loader />
      <AmpTemplate />
      <SvgDefs />
      <Ambient />
      <Header lang={lang} loggedIn={!!db.session.customerId} />
      <main id="contenido">{children}</main>
      <Footer lang={lang} storeEmail={db.settings.storeEmail} instagram={db.settings.instagram} />
      <CartDrawer lang={lang} />
      <Effects />
    </>
  );
}
