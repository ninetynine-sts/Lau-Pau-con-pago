import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { loc, orderNumber } from '@/lib/i18n';
import { ORDER_STATUS_CA, REQUEST_STATUS_CA, dateCa, eur, eurInput } from '@/lib/admin-labels';
import { quoteRequest, rejectRequest } from '@/app/actions/admin';
import { Flash, Status } from '@/components/admin-ui';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Sol·licitud' };

export default async function RequestDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { id } = await params;
  const { ok, e } = await searchParams;
  const [r] = await db.select().from(schema.requests).where(eq(schema.requests.id, Number(id))).limit(1);
  if (!r) notFound();
  const [product] = r.productId ? await db.select().from(schema.products).where(eq(schema.products.id, r.productId)).limit(1) : [];
  const [order] = r.orderId ? await db.select().from(schema.orders).where(eq(schema.orders.id, r.orderId)).limit(1) : [];
  const settings = await getSettings();
  const canQuote = r.status !== 'paid' && (!order || order.status === 'pending_payment' || order.status === 'cancelled');
  const base = r.quotedUnitCents ?? product?.priceCents ?? 0;

  return (
    <>
      <div className="ad-head">
        <div>
          <p className="ad-muted">
            <Link className="lp-link" href="/admin/sollicituds">
              ← Sol·licituds
            </Link>
          </p>
          <h1>{loc(r.productName, 'ca')}</h1>
          <p>
            Rebuda el {dateCa(r.createdAt, true)} · idioma {r.lang === 'ca' ? 'català' : 'castellà'}
          </p>
        </div>
        <Status s={r.status} label={REQUEST_STATUS_CA[r.status]} />
      </div>
      <Flash ok={ok} e={e} />

      <div className="ad-grid ad-grid--2">
        <div className="ad-grid" style={{ alignContent: 'start' }}>
          <section className="ad-card">
            <h2>Què demana</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {product?.images[0] ? <img className="ad-thumb" style={{ width: 88, height: 88 }} src={product.images[0].src} alt="" /> : null}
              <dl className="ad-kv">
                <dt>Unitats</dt>
                <dd>
                  <b>{r.quantity}</b>
                </dd>
                {r.personalization?.letter ? (
                  <>
                    <dt>Lletra</dt>
                    <dd style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{r.personalization.letter}</dd>
                  </>
                ) : null}
                {r.personalization?.idea ? (
                  <>
                    <dt>Idea</dt>
                    <dd className="ad-pre">{r.personalization.idea}</dd>
                  </>
                ) : null}
                {r.notes ? (
                  <>
                    <dt>Notes</dt>
                    <dd className="ad-pre">{r.notes}</dd>
                  </>
                ) : null}
                {product ? (
                  <>
                    <dt>Preu base</dt>
                    <dd>{eur(product.priceCents)}</dd>
                  </>
                ) : null}
              </dl>
            </div>
          </section>

          <section className="ad-card">
            <h2>Clienta</h2>
            <dl className="ad-kv">
              <dt>Nom</dt>
              <dd>{r.name}</dd>
              <dt>Correu</dt>
              <dd>
                <a className="lp-link" href={`mailto:${r.email}`}>
                  {r.email}
                </a>
              </dd>
              {r.phone ? (
                <>
                  <dt>Telèfon</dt>
                  <dd>{r.phone}</dd>
                </>
              ) : null}
            </dl>
          </section>

          {order ? (
            <section className="ad-card">
              <h2>Comanda</h2>
              <p>
                <Link className="lp-link" href={`/admin/comandes/${order.id}`}>
                  {orderNumber(order.id)}
                </Link>{' '}
                · <Status s={order.status} label={ORDER_STATUS_CA[order.status]} /> · {eur(order.totalCents)}
              </p>
              {order.paymentLinkExpiresAt && order.status === 'pending_payment' ? (
                <p className="ad-muted">L’enllaç caduca el {dateCa(order.paymentLinkExpiresAt)}.</p>
              ) : null}
              {r.adminMessage ? <p className="ad-pre">Missatge enviat: {r.adminMessage}</p> : null}
            </section>
          ) : null}
        </div>

        <div className="ad-grid" style={{ alignContent: 'start' }}>
          {canQuote ? (
            <form className="ad-card ad-form" action={quoteRequest}>
              <h2>{r.status === 'quoted' ? 'Torna a enviar l’enllaç' : 'Confirma i envia l’enllaç de pagament'}</h2>
              <input type="hidden" name="id" value={r.id} />
              <div className="ad-row ad-row--2">
                <div className="lp-field">
                  <label htmlFor="unitPrice">Preu final per unitat (€)</label>
                  <input className="lp-input" id="unitPrice" name="unitPrice" inputMode="decimal" defaultValue={eurInput(base)} required />
                </div>
                <div className="lp-field">
                  <label htmlFor="days">Dies per pagar</label>
                  <input className="lp-input" id="days" name="days" type="number" min={1} max={60} defaultValue={settings.paymentLinkDays} />
                </div>
              </div>
              <p className="ad-muted">
                Total: {r.quantity} × preu. L’enviament el tria la clienta en pagar.
              </p>
              <div className="lp-field">
                <label htmlFor="message">Missatge per a la clienta (opcional)</label>
                <textarea className="lp-textarea" id="message" name="message" defaultValue={r.adminMessage ?? ''} placeholder="Per exemple: el suplement inclou el gravat en daurat." />
              </div>
              <button className="lp-btn" type="submit">
                Envia l’enllaç de pagament
              </button>
            </form>
          ) : null}

          {r.status !== 'paid' && r.status !== 'rejected' ? (
            <form className="ad-card ad-form" action={rejectRequest}>
              <h2>No es pot fer</h2>
              <input type="hidden" name="id" value={r.id} />
              <div className="lp-field">
                <label htmlFor="rmessage">Motiu (opcional)</label>
                <textarea className="lp-textarea" id="rmessage" name="message" />
              </div>
              <label className="lp-check">
                <input type="checkbox" name="notify" defaultChecked />
                Avisa la clienta per correu
              </label>
              <button className="lp-btn ad-btn-danger" type="submit">
                Rebutja la sol·licitud
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </>
  );
}
