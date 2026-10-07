import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { AccountShell } from '@/components/account-ui';
import { isLang, path } from '@/lib/routes';
import { formatDate, loc, t } from '@/lib/i18n';
import { requireCustomer } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export const metadata: Metadata = { robots: { index: false } };

export default async function Requests({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const user = await requireCustomer(path(lang, 'cuenta', 'acceder'));
  const d = t(lang);
  const rows = await db
    .select({ r: schema.requests, orderPublicId: schema.orders.publicId })
    .from(schema.requests)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.requests.orderId))
    .where(eq(schema.requests.userId, user.id))
    .orderBy(desc(schema.requests.createdAt))
    .limit(100);
  return (
    <AccountShell lang={lang} active="requests" name={user.name || user.email}>
      {rows.length ? (
        <table className="lp-table">
          <thead>
            <tr>
              <th>{d.product.products}</th>
              <th>{d.order.date}</th>
              <th>{d.order.status}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, orderPublicId }) => (
              <tr key={r.id}>
                <td>
                  <b>{loc(r.productName, lang)}</b> × {r.quantity}
                  <span className="lp-line__meta" style={{ display: 'block' }}>
                    {r.personalization?.letter ? `${d.order.letter}: ${r.personalization.letter}` : r.personalization?.idea ?? ''}
                  </span>
                </td>
                <td>{formatDate(r.createdAt, lang)}</td>
                <td>
                  <span className="lp-status-pill" data-s={r.status}>
                    {d.accountPages.requestStatuses[r.status]}
                  </span>
                </td>
                <td>
                  {r.status === 'quoted' && orderPublicId ? (
                    <Link className="lp-btn lp-btn--sm" href={path(lang, 'pagar', orderPublicId)}>
                      {d.accountPages.pay}
                    </Link>
                  ) : r.status === 'paid' && orderPublicId ? (
                    <Link className="lp-link" href={path(lang, 'pedido', orderPublicId)}>
                      {d.accountPages.view}
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="lp-lead">{d.accountPages.noRequests}</p>
      )}
    </AccountShell>
  );
}
