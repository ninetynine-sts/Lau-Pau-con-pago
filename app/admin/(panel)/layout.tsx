import Link from 'next/link';
import { count, eq } from 'drizzle-orm';
import { AdminNav } from '@/components/admin-nav';
import { adminLogout } from '@/app/actions/admin';
import { requireAdmin } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [[paid], [fresh]] = await Promise.all([
    db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.status, 'paid')),
    db.select({ n: count() }).from(schema.requests).where(eq(schema.requests.status, 'new'))
  ]);
  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <Link className="ad-brand" href="/admin">
          <img src="/laupau/marca/logo-final.png" alt="" width={44} height={44} />
          <span>
            Lau&amp;Pau
            <small>Tauler</small>
          </span>
        </Link>
        <AdminNav
          items={[
            { href: '/admin', label: 'Inici' },
            { href: '/admin/comandes', label: 'Comandes', count: paid.n },
            { href: '/admin/sollicituds', label: 'Sol·licituds', count: fresh.n },
            { href: '/admin/productes', label: 'Productes' },
            { href: '/admin/enviaments', label: 'Enviaments' },
            { href: '/admin/cupons', label: 'Cupons' },
            { href: '/admin/configuracio', label: 'Configuració' }
          ]}
        />
        <div className="ad-side__foot">
          <span>{user.name || user.email}</span>
          <a className="lp-link" href="/ca" target="_blank" rel="noopener">
            Veure la botiga ↗
          </a>
          <form action={adminLogout}>
            <button className="lp-textbtn" type="submit">
              Tanca la sessió
            </button>
          </form>
        </div>
      </aside>
      <main className="ad-main">{children}</main>
    </div>
  );
}
