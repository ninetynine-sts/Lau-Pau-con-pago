'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheen } from '@/components/brand';
import { t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';

export default function NotFound() {
  const lang: Lang = usePathname()?.startsWith('/ca') ? 'ca' : 'es';
  const d = t(lang).notFound;
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg lp-center">
        <h1>{d.title}</h1>
        <p className="lp-lead lp-measure--narrow">{d.text}</p>
        <div className="lp-actions">
          <Link className="lp-btn" href={path(lang)}>
            <Sheen />
            {d.home}
          </Link>
          <Link className="lp-btn lp-btn--ghost" href={path(lang, 'productos')}>
            <Sheen />
            {d.products}
          </Link>
        </div>
      </div>
    </section>
  );
}
