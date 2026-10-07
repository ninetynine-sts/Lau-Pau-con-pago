import Link from 'next/link';
import { desc, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { orderNumber } from '@/lib/i18n';
import { ORDER_STATUS_CA, dateCa, eur } from '@/lib/admin-labels';
import { Flash, Status } from '@/components/admin-ui';

export const metadata = { title: 'Comandes' };

const FILTERS: { id: string; label: string; statuses: string[] | null }[] = [
  { id: 'pendents', label: 'Per preparar', statuses: ['paid', 'preparing'] },
  { id: 'enviades', label: 'Enviades', statuses: ['shipped', 'delivered'] },
  { id: 'sensepagar', label: 'Sense pagar', statuses: ['pending_payment'] },
  { id: 'cancelades', label: 'Cancel·lades', statuses: ['cancelled', 'refunded'] },
  { id: 'totes', label: 'Totes', statuses: null }
];

export default async function Orders({ searchParams }: { searchParams: Promise<{ estat?: string; q?: string; ok?: string }> }) {
  const { estat = 'pendents', q = '', ok } = await searchParams;
  const f = FILTERS.find((x) => x.id === estat) ?? FILTERS[0];
  const conds: SQL[] = [];
  if (f.statuses) conds.push(inArray(schema.orders.status, f.statuses as never[]));
  const term = q.trim();
  if (term) {
    const num = Number(term.replace(/\D/g, '')) - 1000;
    const like = `%${term}%`;
    conds.push(
      or(
        ilike(schema.orders.email, like),
        ilike(schema.orders.customerName, like),
        ...(Number.isSafeInteger(num) && num > 0 ? [sql`${schema.orders.id} = ${num}`] : [])
      )!
    );
  }
  const where = conds.length ? sql.join(conds, sql` and `) : undefined;
  const rows = await db.select().from(schema.orders).where(where).orderBy(desc(schema.orders.createdAt)).limit(200);

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Comandes</h1>
          <p>Les comandes passen a «Pagada» soles quan el banc confirma el pagament.</p>
        </div>
        <form className="ad-actions" method="get">
          <input type="hidden" name="estat" value={f.id} />
          <input className="lp-input" name="q" defaultValue={term} placeholder="Cerca per nom, correu o LP-…" style={{ padding: '10px 14px', fontSize: 14, minWidth: 260 }} />
        </form>
      </div>
      <Flash ok={ok} />
      <div className="ad-filter">
        {FILTERS.map((x) => (
          <Link key={x.id} href={`/admin/comandes?estat=${x.id}`} aria-current={x.id === f.id ? 'true' : undefined}>
            {x.label}
          </Link>
        ))}
      </div>
      <section className="ad-card">
        {rows.length ? (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Comanda</th>
                  <th>Data</th>
                  <th>Clienta</th>
                  <th>Lliurament</th>
                  <th>Estat</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/comandes/${o.id}`}>{orderNumber(o.id)}</Link>
                      {o.source === 'request' ? <div className="ad-muted">Personalització</div> : null}
                      {o.stockIssue ? <div className="ad-danger" style={{ fontSize: 12, fontWeight: 700 }}>Revisa l’estoc</div> : null}
                    </td>
                    <td>{dateCa(o.paidAt ?? o.createdAt, true)}</td>
                    <td>
                      {o.customerName}
                      <div className="ad-muted">{o.email}</div>
                    </td>
                    <td>{o.shippingName ? o.shippingName.ca : '—'}</td>
                    <td>
                      <Status s={o.status} label={ORDER_STATUS_CA[o.status]} />
                    </td>
                    <td className="num">{eur(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ad-muted">No hi ha comandes en aquesta llista.</p>
        )}
      </section>
    </>
  );
}
