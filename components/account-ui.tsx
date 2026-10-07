import Link from 'next/link';
import { Sheen } from './brand';
import { logout } from '@/app/actions/account';
import { t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';

export type AccountTab = 'orders' | 'requests' | 'addresses' | 'details';

export function AccountShell({ lang, active, name, children }: { lang: Lang; active: AccountTab; name: string; children: React.ReactNode }) {
  const d = t(lang).accountPages;
  const tabs: { id: AccountTab; href: string; label: string }[] = [
    { id: 'orders', href: path(lang, 'cuenta', 'pedidos'), label: d.orders },
    { id: 'requests', href: path(lang, 'cuenta', 'solicitudes'), label: d.requests },
    { id: 'addresses', href: path(lang, 'cuenta', 'direcciones'), label: d.addresses },
    { id: 'details', href: path(lang, 'cuenta', 'datos'), label: d.details }
  ];
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'end', marginBottom: 'clamp(20px,3vw,30px)' }}>
          <div className="lp-stack" style={{ gap: 6 }}>
            <p className="lp-eyebrow lp-eyebrow--accent">{d.title}</p>
            <h1 style={{ fontSize: 'var(--h2)' }}>{name}</h1>
          </div>
          <form action={logout}>
            <input type="hidden" name="lang" value={lang} />
            <button className="lp-btn lp-btn--ghost lp-btn--sm" type="submit">
              <Sheen />
              {d.logout}
            </button>
          </form>
        </div>
        <ul className="lp-tabs">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Link href={tab.href} aria-current={tab.id === active ? 'page' : undefined}>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </section>
  );
}

export function FormMessage({ error, ok }: { error?: string | null; ok?: string | null }) {
  if (error) return <p className="lp-alert lp-alert--error" role="alert">{error}</p>;
  if (ok) return <p className="lp-alert lp-alert--ok" role="status">{ok}</p>;
  return null;
}

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container">
        <div className="lp-auth lp-panel lp-stack--lg">
          <h1 style={{ fontSize: 'var(--h2)' }}>{title}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}
