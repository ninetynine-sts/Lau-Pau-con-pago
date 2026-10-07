import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, desc, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { loc, orderNumber } from '@/lib/i18n';
import { countryName } from '@/lib/countries';
import { ORDER_STATUS_CA, dateCa, eur } from '@/lib/admin-labels';
import { updateOrder } from '@/app/actions/admin';
import { Flash, Status } from '@/components/admin-ui';
import { env } from '@/lib/env';
import { path } from '@/lib/routes';
import { ORDER_STATUSES } from '@/lib/db/schema';

export const metadata = { title: 'Comanda' };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { id } = await params;
  const { ok, e } = await searchParams;
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, Number(id))).limit(1);
  if (!o) notFound();
  const [items, payments, [request]] = await Promise.all([
    db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id)).orderBy(asc(schema.orderItems.id)),
    db.select().from(schema.payments).where(eq(schema.payments.orderId, o.id)).orderBy(desc(schema.payments.id)),
    db.select().from(schema.requests).where(eq(schema.requests.orderId, o.id)).limit(1)
  ]);
  const a = o.shippingAddress;
  const allowed = o.status === 'pending_payment' ? ['pending_payment', 'cancelled'] : ORDER_STATUSES.filter((s) => s !== 'pending_payment');

  return (
    <>
      <div className="ad-head">
        <div>
          <p className="ad-muted">
            <Link className="lp-link" href="/admin/comandes">
              ← Comandes
            </Link>
          </p>
          <h1>{orderNumber(o.id)}</h1>
          <p>
            Creada el {dateCa(o.createdAt, true)}
            {o.paidAt ? ` · pagada el ${dateCa(o.paidAt, true)}` : ''} · idioma {o.lang === 'ca' ? 'català' : 'castellà'}
          </p>
        </div>
        <Status s={o.status} label={ORDER_STATUS_CA[o.status]} />
      </div>
      <Flash ok={ok} e={e} />
      {o.stockIssue ? (
        <p className="ad-warn">
          <b>Atenció:</b> quan es va pagar, algun article no tenia prou estoc. Comprova que el pots servir abans d’enviar-la.
        </p>
      ) : null}

      <div className="ad-grid ad-grid--2">
        <div className="ad-grid">
          <section className="ad-card">
            <h2>Articles</h2>
            <table className="ad-table">
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ width: 52 }}>{it.image ? <img className="ad-thumb" src={it.image} alt="" /> : null}</td>
                    <td>
                      <b>{loc(it.name, 'ca')}</b>
                      {it.variantName ? <div className="ad-muted">{loc(it.variantName, 'ca')}</div> : null}
                      {it.personalization?.letter ? <div>Lletra: <b>{it.personalization.letter}</b></div> : null}
                      {it.personalization?.idea ? <div className="ad-pre">Idea: {it.personalization.idea}</div> : null}
                    </td>
                    <td className="num">
                      {it.quantity} × {eur(it.unitPriceCents)}
                    </td>
                    <td className="num">
                      <b>{eur(it.quantity * it.unitPriceCents)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ad-kv" style={{ justifySelf: 'end', minWidth: 260 }}>
              <dt>Subtotal</dt>
              <dd className="num">{eur(o.subtotalCents)}</dd>
              {o.discountCents ? (
                <>
                  <dt>Descompte {o.couponCode ? `(${o.couponCode})` : ''}</dt>
                  <dd>−{eur(o.discountCents)}</dd>
                </>
              ) : null}
              <dt>Enviament</dt>
              <dd>{eur(o.shippingCents)}</dd>
              <dt>
                <b>Total</b>
              </dt>
              <dd>
                <b>{eur(o.totalCents)}</b>
              </dd>
            </dl>
          </section>

          {o.customerNotes ? (
            <section className="ad-card">
              <h2>Notes de la clienta</h2>
              <p className="ad-pre">{o.customerNotes}</p>
            </section>
          ) : null}

          {request ? (
            <section className="ad-card">
              <h2>Ve d’una sol·licitud</h2>
              <p>
                <Link className="lp-link" href={`/admin/sollicituds/${request.id}`}>
                  Obre la sol·licitud
                </Link>
                {o.status === 'pending_payment' ? (
                  <>
                    {' · '}Enllaç de pagament:{' '}
                    <a className="lp-link" href={`${env.siteUrl}${path(o.lang as 'es' | 'ca', 'pagar', o.publicId)}`} target="_blank" rel="noopener">
                      obre’l
                    </a>
                    {o.paymentLinkExpiresAt ? ` (caduca el ${dateCa(o.paymentLinkExpiresAt)})` : ''}
                  </>
                ) : null}
              </p>
            </section>
          ) : null}

          <section className="ad-card">
            <h2>Pagaments Redsys</h2>
            {payments.length ? (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Operació</th>
                    <th>Data</th>
                    <th>Resultat</th>
                    <th className="num">Import</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <code>{p.dsOrder}</code>
                      </td>
                      <td>{dateCa(p.updatedAt, true)}</td>
                      <td>
                        {p.status === 'authorized' ? (
                          <span className="lp-status-pill" data-s="delivered">Autoritzat {p.authCode ? `· ${p.authCode}` : ''}</span>
                        ) : p.status === 'denied' ? (
                          <span className="lp-status-pill" data-s="cancelled">Denegat {p.responseCode ? `· ${p.responseCode}` : ''}</span>
                        ) : (
                          <span className="lp-status-pill">Iniciat, sense resposta</span>
                        )}
                      </td>
                      <td className="num">{eur(p.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ad-muted">La clienta encara no ha intentat pagar.</p>
            )}
            <p className="ad-muted">Les devolucions es fan des del portal del TPV del banc; després marca la comanda com a «Reemborsada».</p>
          </section>
        </div>

        <div className="ad-grid" style={{ alignContent: 'start' }}>
          <section className="ad-card">
            <h2>Clienta</h2>
            <dl className="ad-kv">
              <dt>Nom</dt>
              <dd>{o.customerName}</dd>
              <dt>Correu</dt>
              <dd>
                <a className="lp-link" href={`mailto:${o.email}`}>
                  {o.email}
                </a>
              </dd>
              {o.phone ? (
                <>
                  <dt>Telèfon</dt>
                  <dd>
                    <a className="lp-link" href={`tel:${o.phone}`}>
                      {o.phone}
                    </a>
                  </dd>
                </>
              ) : null}
            </dl>
          </section>

          <section className="ad-card">
            <h2>{a ? 'Enviament' : 'Lliurament'}</h2>
            <p>
              <b>{o.shippingName ? o.shippingName.ca : '—'}</b>
            </p>
            {a ? (
              <p className="ad-pre">
                {[a.name, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.region, countryName(a.country, 'ca'), a.phone].filter(Boolean).join('\n')}
              </p>
            ) : null}
          </section>

          <form className="ad-card ad-form" action={updateOrder}>
            <h2>Gestiona la comanda</h2>
            <input type="hidden" name="id" value={o.id} />
            <div className="lp-field">
              <label htmlFor="status">Estat</label>
              <select className="lp-select" id="status" name="status" defaultValue={o.status}>
                {allowed.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_CA[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="lp-field">
              <label htmlFor="trackingNumber">Número de seguiment</label>
              <input className="lp-input" id="trackingNumber" name="trackingNumber" defaultValue={o.trackingNumber ?? ''} />
            </div>
            <div className="lp-field">
              <label htmlFor="trackingUrl">Enllaç de seguiment</label>
              <input className="lp-input" id="trackingUrl" name="trackingUrl" type="url" placeholder="https://…" defaultValue={o.trackingUrl ?? ''} />
            </div>
            <div className="lp-field">
              <label htmlFor="adminNotes">Notes internes</label>
              <textarea className="lp-textarea" id="adminNotes" name="adminNotes" defaultValue={o.adminNotes ?? ''} />
            </div>
            <label className="lp-check">
              <input type="checkbox" name="notify" defaultChecked />
              En passar-la a «Enviada / a punt», envia un correu a la clienta
              {a ? ' amb el seguiment' : ' perquè la vingui a recollir'}.
            </label>
            <button className="lp-btn" type="submit">
              Desa
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
