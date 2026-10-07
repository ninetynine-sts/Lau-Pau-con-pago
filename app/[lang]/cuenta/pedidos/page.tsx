import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { AccountShell } from '@/components/account-ui';
import { isLang, path } from '@/lib/routes';
import { formatDate, formatPrice, orderNumber, t } from '@/lib/i18n';
import { requireCustomer } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export const metadata: Metadata = { robots: { index: false } };

export default async function Orders({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const user = await requireCustomer(path(lang, 'cuenta', 'acceder'));
  const d = t(lang);
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt)).limit(100);
  return (
    <AccountShell lang={lang} active="orders" name={user.name || user.email}>
      {orders.length ? (
        <table className="lp-table">
          <thead>
            <tr>
              <th>{d.order.title('').trim()}</th>
              <th>{d.order.date}</th>
              <th>{d.order.status}</th>
              <th>{d.checkout.total}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link className="lp-link" href={path(lang, 'pedido', o.publicId)}>
                    <b>{orderNumber(o.id)}</b>
                  </Link>
                </td>
                <td>{formatDate(o.createdAt, lang)}</td>
                <td>
                  <span className="lp-status-pill" data-s={o.status}>
                    {d.order.statuses[o.status]}
                  </span>
                </td>
                <td>
                  <b>{formatPrice(o.totalCents, lang)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="lp-lead">{d.accountPages.noOrders}</p>
      )}
    </AccountShell>
  );
}
