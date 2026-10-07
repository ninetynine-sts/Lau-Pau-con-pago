import { desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { COUPON_KIND_CA, dateCa, eur, eurInput } from '@/lib/admin-labels';
import { deleteCoupon, saveCoupon } from '@/app/actions/admin';
import { Flash } from '@/components/admin-ui';

export const metadata = { title: 'Cupons' };

const day = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

type C = typeof schema.coupons.$inferSelect;

function CouponForm({ c }: { c?: C }) {
  const k = c?.id ?? 'nou';
  return (
    <form className="ad-card ad-form" action={saveCoupon}>
      <h2>{c ? c.code : 'Nou cupó'}</h2>
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <div className="ad-row ad-row--3">
        <div className="lp-field">
          <label htmlFor={`code-${k}`}>Codi</label>
          <input className="lp-input" id={`code-${k}`} name="code" defaultValue={c?.code ?? ''} style={{ textTransform: 'uppercase' }} required />
        </div>
        <div className="lp-field">
          <label htmlFor={`kind-${k}`}>Tipus</label>
          <select className="lp-select" id={`kind-${k}`} name="kind" defaultValue={c?.kind ?? 'percent'}>
            {Object.entries(COUPON_KIND_CA).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="lp-field">
          <label htmlFor={`value-${k}`}>Valor (% o €)</label>
          <input
            className="lp-input"
            id={`value-${k}`}
            name="value"
            inputMode="decimal"
            defaultValue={c ? (c.kind === 'fixed' ? eurInput(c.value) : c.kind === 'percent' ? String(c.value) : '') : ''}
            placeholder="10"
          />
        </div>
      </div>
      <div className="ad-row ad-row--4">
        <div className="lp-field">
          <label htmlFor={`min-${k}`}>Compra mínima (€)</label>
          <input className="lp-input" id={`min-${k}`} name="minSubtotal" inputMode="decimal" defaultValue={c?.minSubtotalCents ? eurInput(c.minSubtotalCents) : ''} />
        </div>
        <div className="lp-field">
          <label htmlFor={`from-${k}`}>Des de</label>
          <input className="lp-input" id={`from-${k}`} name="startsAt" type="date" defaultValue={day(c?.startsAt ?? null)} />
        </div>
        <div className="lp-field">
          <label htmlFor={`to-${k}`}>Fins a</label>
          <input className="lp-input" id={`to-${k}`} name="expiresAt" type="date" defaultValue={day(c?.expiresAt ?? null)} />
        </div>
        <div className="lp-field">
          <label htmlFor={`max-${k}`}>Usos màxims</label>
          <input className="lp-input" id={`max-${k}`} name="maxUses" type="number" min={1} defaultValue={c?.maxUses ?? ''} placeholder="Il·limitats" />
        </div>
      </div>
      <div className="ad-actions">
        <label className="lp-check">
          <input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Actiu
        </label>
        <button className="lp-btn lp-btn--sm" type="submit">
          Desa
        </button>
      </div>
    </form>
  );
}

export default async function Coupons({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { ok, e } = await searchParams;
  const coupons = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.createdAt));
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Cupons de descompte</h1>
          <p>La clienta escriu el codi en finalitzar la compra.</p>
        </div>
      </div>
      <Flash ok={ok} e={e} />
      {coupons.length ? (
        <section className="ad-card">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Codi</th>
                <th>Descompte</th>
                <th>Vigència</th>
                <th>Usos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} style={c.active ? undefined : { opacity: 0.55 }}>
                  <td>
                    <b>{c.code}</b>
                  </td>
                  <td>
                    {c.kind === 'percent' ? `${c.value} %` : c.kind === 'fixed' ? eur(c.value) : 'Enviament gratuït'}
                    {c.minSubtotalCents ? <div className="ad-muted">a partir de {eur(c.minSubtotalCents)}</div> : null}
                  </td>
                  <td>
                    {c.startsAt || c.expiresAt ? `${dateCa(c.startsAt)} → ${dateCa(c.expiresAt)}` : 'Sempre'}
                  </td>
                  <td>
                    {c.usedCount}
                    {c.maxUses ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="num">
                    <form action={deleteCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="lp-textbtn ad-danger" type="submit">
                        Elimina
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      <div className="ad-grid ad-grid--half">
        {coupons.map((c) => (
          <CouponForm key={c.id} c={c} />
        ))}
        <CouponForm />
      </div>
    </>
  );
}
