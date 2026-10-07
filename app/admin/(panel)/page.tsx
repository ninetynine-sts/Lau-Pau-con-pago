import Link from 'next/link';
import { and, count, desc, eq, gte, inArray, isNotNull, lte, sum } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { getSettings } from '@/lib/settings';
import { r2Enabled } from '@/lib/storage';
import { loc, orderNumber } from '@/lib/i18n';
import { ORDER_STATUS_CA, REQUEST_STATUS_CA, dateCa, eur } from '@/lib/admin-labels';
import { Status } from '@/components/admin-ui';

export const metadata = { title: 'Inici' };

export default async function Dashboard() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const settings = await getSettings();
  const [[toPrepare], [newRequests], [month], recent, requests, lowStock] = await Promise.all([
    db.select({ n: count() }).from(schema.orders).where(inArray(schema.orders.status, ['paid', 'preparing'])),
    db.select({ n: count() }).from(schema.requests).where(eq(schema.requests.status, 'new')),
    db
      .select({ n: count(), total: sum(schema.orders.totalCents) })
      .from(schema.orders)
      .where(and(isNotNull(schema.orders.paidAt), gte(schema.orders.paidAt, monthStart))),
    db.select().from(schema.orders).where(inArray(schema.orders.status, ['paid', 'preparing', 'shipped'])).orderBy(desc(schema.orders.createdAt)).limit(8),
    db.select().from(schema.requests).where(eq(schema.requests.status, 'new')).orderBy(desc(schema.requests.createdAt)).limit(6),
    db
      .select({ v: schema.variants, p: schema.products })
      .from(schema.variants)
      .innerJoin(schema.products, eq(schema.products.id, schema.variants.productId))
      .where(and(isNotNull(schema.variants.stock), lte(schema.variants.stock, 2), eq(schema.variants.active, true), eq(schema.products.active, true)))
  ]);

  const warnings: React.ReactNode[] = [];
  if (!settings.shippingReviewed)
    warnings.push(
      <>
        <b>Revisa els enviaments.</b> Els preus i zones són d’exemple. <Link className="lp-link" href="/admin/enviaments">Obre Enviaments</Link>
      </>
    );
  if (env.redsys.env !== 'production')
    warnings.push(
      <>
        <b>Pagaments en mode de proves.</b> Redsys funciona amb l’entorn de test{env.redsys.usingTestDefaults ? ' i el comerç genèric de proves' : ''}: no es cobra res de veritat.
      </>
    );
  if (!env.mail.resendKey)
    warnings.push(
      <>
        <b>Correus desactivats.</b> Falta RESEND_API_KEY: els correus es guarden però no s’envien.
      </>
    );
  if (!r2Enabled())
    warnings.push(
      <>
        <b>Fotos en disc local.</b> Configura Cloudflare R2 abans de publicar perquè les fotos noves no es perdin en redesplegar.
      </>
    );

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Hola!</h1>
          <p>Resum de la botiga.</p>
        </div>
      </div>

      {warnings.map((w, i) => (
        <p key={i} className="ad-warn">
          {w}
        </p>
      ))}

      <div className="ad-stats">
        <Link className="ad-stat" href="/admin/comandes?estat=pendents">
          <b>{toPrepare.n}</b>
          <span>Comandes per preparar o enviar</span>
        </Link>
        <Link className="ad-stat" href="/admin/sollicituds?estat=new">
          <b>{newRequests.n}</b>
          <span>Sol·licituds noves</span>
        </Link>
        <div className="ad-stat">
          <b>{eur(Number(month.total ?? 0))}</b>
          <span>Cobrat aquest mes · {month.n} comandes</span>
        </div>
      </div>

      <div className="ad-grid ad-grid--2">
        <section className="ad-card">
          <h2>Últimes comandes pagades</h2>
          {recent.length ? (
            <div className="ad-scroll">
              <table className="ad-table">
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/comandes/${o.id}`}>{orderNumber(o.id)}</Link>
                        <div className="ad-muted">{o.customerName}</div>
                      </td>
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
            <p className="ad-muted">Encara no hi ha comandes pagades.</p>
          )}
        </section>

        <div className="ad-grid">
          <section className="ad-card">
            <h2>Sol·licituds per revisar</h2>
            {requests.length ? (
              <table className="ad-table">
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/admin/sollicituds/${r.id}`}>{loc(r.productName, 'ca')}</Link>
                        <div className="ad-muted">
                          {r.name} · {dateCa(r.createdAt)}
                        </div>
                      </td>
                      <td>
                        <Status s={r.status} label={REQUEST_STATUS_CA[r.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ad-muted">Cap sol·licitud pendent.</p>
            )}
          </section>

          <section className="ad-card">
            <h2>Estoc baix</h2>
            {lowStock.length ? (
              <table className="ad-table">
                <tbody>
                  {lowStock.map(({ v, p }) => (
                    <tr key={v.id}>
                      <td>
                        <Link href={`/admin/productes/${p.id}`}>{loc(p.name, 'ca')}</Link>
                        {v.name ? <div className="ad-muted">{loc(v.name, 'ca')}</div> : null}
                      </td>
                      <td className="num">{v.stock === 0 ? <b className="ad-danger">Esgotat</b> : `${v.stock} u.`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ad-muted">Tot correcte.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
