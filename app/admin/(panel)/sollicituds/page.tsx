import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { loc } from '@/lib/i18n';
import { REQUEST_STATUS_CA, dateCa } from '@/lib/admin-labels';
import { Status } from '@/components/admin-ui';
import { REQUEST_STATUSES, type RequestStatus } from '@/lib/db/schema';

export const metadata = { title: 'Sol·licituds' };

export default async function Requests({ searchParams }: { searchParams: Promise<{ estat?: string }> }) {
  const { estat = 'new' } = await searchParams;
  const status = (REQUEST_STATUSES as readonly string[]).includes(estat) ? (estat as RequestStatus) : null;
  const rows = await db
    .select()
    .from(schema.requests)
    .where(status ? eq(schema.requests.status, status) : undefined)
    .orderBy(desc(schema.requests.createdAt))
    .limit(200);
  const tabs = [...REQUEST_STATUSES.map((s) => ({ id: s, label: REQUEST_STATUS_CA[s] })), { id: 'totes', label: 'Totes' }];
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Sol·licituds de personalització</h1>
          <p>Revisa cada sol·licitud, fixa el preu final i envia l’enllaç de pagament.</p>
        </div>
      </div>
      <div className="ad-filter">
        {tabs.map((t) => (
          <Link key={t.id} href={`/admin/sollicituds?estat=${t.id}`} aria-current={(status ?? 'totes') === t.id ? 'true' : undefined}>
            {t.label}
          </Link>
        ))}
      </div>
      <section className="ad-card">
        {rows.length ? (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Producte</th>
                  <th>Personalització</th>
                  <th>Clienta</th>
                  <th>Data</th>
                  <th>Estat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/sollicituds/${r.id}`}>{loc(r.productName, 'ca')}</Link>
                      <div className="ad-muted">{r.quantity} u.</div>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      {r.personalization?.letter ? (
                        <>
                          Lletra <b>{r.personalization.letter}</b>
                        </>
                      ) : (
                        <span className="ad-muted">{(r.personalization?.idea ?? '').slice(0, 90)}</span>
                      )}
                    </td>
                    <td>
                      {r.name}
                      <div className="ad-muted">{r.email}</div>
                    </td>
                    <td>{dateCa(r.createdAt, true)}</td>
                    <td>
                      <Status s={r.status} label={REQUEST_STATUS_CA[r.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ad-muted">No hi ha sol·licituds en aquesta llista.</p>
        )}
      </section>
    </>
  );
}
