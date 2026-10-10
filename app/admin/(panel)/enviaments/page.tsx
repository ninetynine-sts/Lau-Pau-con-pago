import { asc } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { eurInput } from '@/lib/admin-labels';
import { deleteShipping, markShippingReviewed, saveShipping } from '@/app/actions/admin';
import { Flash } from '@/components/admin-ui';
import { getSettings } from '@/lib/settings';
import type { Localized } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Enviaments' };

type M = {
  id?: number;
  name?: Localized;
  description?: Localized;
  countries?: string[];
  allCountries?: boolean;
  isPickup?: boolean;
  priceCents?: number;
  freeOverCents?: number | null;
  active?: boolean;
  sort?: number;
};

function MethodForm({ m }: { m: M }) {
  const k = m.id ?? 'nou';
  return (
    <form className="ad-card ad-form" action={saveShipping}>
      <h2>{m.id ? m.name?.ca : 'Nou mètode d’enviament'}</h2>
      {m.id ? <input type="hidden" name="id" value={m.id} /> : null}
      <div className="ad-row ad-row--2">
        {(['es', 'ca'] as const).map((l) => (
          <div className="lp-field" key={l}>
            <label htmlFor={`n-${k}-${l}`}>
              Nom<span className="ad-lang">{l.toUpperCase()}</span>
            </label>
            <input className="lp-input" id={`n-${k}-${l}`} name={`name_${l}`} defaultValue={m.name?.[l] ?? ''} required />
          </div>
        ))}
        {(['es', 'ca'] as const).map((l) => (
          <div className="lp-field" key={`d${l}`}>
            <label htmlFor={`d-${k}-${l}`}>
              Descripció (termini…)<span className="ad-lang">{l.toUpperCase()}</span>
            </label>
            <input className="lp-input" id={`d-${k}-${l}`} name={`description_${l}`} defaultValue={m.description?.[l] ?? ''} />
          </div>
        ))}
      </div>
      <div className="ad-row ad-row--4">
        <div className="lp-field">
          <label htmlFor={`p-${k}`}>Preu (€)</label>
          <input className="lp-input" id={`p-${k}`} name="price" inputMode="decimal" defaultValue={eurInput(m.priceCents ?? 0)} />
        </div>
        <div className="lp-field">
          <label htmlFor={`f-${k}`}>Gratuït a partir de (€)</label>
          <input className="lp-input" id={`f-${k}`} name="freeOver" inputMode="decimal" defaultValue={eurInput(m.freeOverCents)} placeholder="Mai" />
        </div>
        <div className="lp-field">
          <label htmlFor={`c-${k}`}>Països (codis)</label>
          <input className="lp-input" id={`c-${k}`} name="countries" defaultValue={(m.countries ?? []).join(', ')} placeholder="AD, ES, FR" />
        </div>
        <div className="lp-field">
          <label htmlFor={`s-${k}`}>Ordre</label>
          <input className="lp-input" id={`s-${k}`} name="sort" type="number" defaultValue={m.sort ?? 0} />
        </div>
      </div>
      <div className="ad-actions">
        <label className="lp-check">
          <input type="checkbox" name="active" defaultChecked={m.active ?? true} /> Actiu
        </label>
        <label className="lp-check">
          <input type="checkbox" name="isPickup" defaultChecked={m.isPickup ?? false} /> És recollida (no demana adreça)
        </label>
        <label className="lp-check">
          <input type="checkbox" name="allCountries" defaultChecked={m.allCountries ?? false} /> Qualsevol altre país
        </label>
      </div>
      <div className="ad-actions">
        <button className="lp-btn lp-btn--sm" type="submit">
          Desa
        </button>
      </div>
    </form>
  );
}

export default async function Shipping({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  // Cada pàgina comprova l'accés per si mateixa: la comprovació del layout sola no n'hi ha prou.
  await requireAdmin();
  const { ok, e } = await searchParams;
  const [methods, settings] = await Promise.all([
    db.select().from(schema.shippingMethods).orderBy(asc(schema.shippingMethods.sort), asc(schema.shippingMethods.id)),
    getSettings()
  ]);
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Enviaments</h1>
          <p>Cada mètode s’ofereix als països indicats (codis de 2 lletres: AD Andorra, ES Espanya, FR França…).</p>
        </div>
      </div>
      <Flash ok={ok} e={e} />
      {!settings.shippingReviewed ? (
        <div className="ad-warn" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            <b>Aquests preus i zones són d’exemple.</b> Ajusta’ls i desa’ls; recorda que els enviaments fora d’Andorra poden tenir tràmits de duana.
          </span>
          <form action={markShippingReviewed}>
            <button className="lp-btn lp-btn--sm lp-btn--quiet" type="submit">
              Ja els he revisat
            </button>
          </form>
        </div>
      ) : null}
      {methods.map((m) => (
        <div key={m.id} className="ad-grid">
          <MethodForm m={m} />
          <form action={deleteShipping} style={{ marginTop: -8 }}>
            <input type="hidden" name="id" value={m.id} />
            <button className="lp-textbtn ad-danger" type="submit">
              Elimina «{m.name.ca}»
            </button>
          </form>
        </div>
      ))}
      <MethodForm m={{}} />
    </>
  );
}
