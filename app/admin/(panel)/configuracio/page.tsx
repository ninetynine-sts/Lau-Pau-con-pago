import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { env } from '@/lib/env';
import { r2Enabled } from '@/lib/storage';
import { createAdmin, removeAdmin, saveLegalSettings, saveStoreSettings } from '@/app/actions/admin';
import { missingLegal } from '@/lib/legal-info';
import { Flash } from '@/components/admin-ui';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Configuració' };

export default async function Settings({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { ok, e } = await searchParams;
  const me = await requireAdmin();
  const [s, admins] = await Promise.all([getSettings(), db.select().from(schema.users).where(eq(schema.users.role, 'admin'))]);
  const l = s.legal;
  const missing = missingLegal(l);
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Configuració</h1>
        </div>
      </div>
      <Flash ok={ok} e={e} />
      <div className="ad-grid ad-grid--half">
        <form className="ad-card ad-form" action={saveStoreSettings}>
          <h2>Botiga</h2>
          <div className="lp-field">
            <label htmlFor="storeEmail">Correu de contacte (es mostra a la web)</label>
            <input className="lp-input" id="storeEmail" name="storeEmail" type="email" defaultValue={s.storeEmail} required />
          </div>
          <div className="lp-field">
            <label htmlFor="notifyEmail">Correu on arriben els avisos de comandes i sol·licituds</label>
            <input className="lp-input" id="notifyEmail" name="notifyEmail" type="email" defaultValue={s.notifyEmail} required />
          </div>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="instagram">Instagram</label>
              <input className="lp-input" id="instagram" name="instagram" defaultValue={s.instagram} />
            </div>
            <div className="lp-field">
              <label htmlFor="paymentLinkDays">Dies per pagar una personalització</label>
              <input className="lp-input" id="paymentLinkDays" name="paymentLinkDays" type="number" min={1} max={60} defaultValue={s.paymentLinkDays} />
            </div>
          </div>
          <div>
            <button className="lp-btn" type="submit">
              Desa
            </button>
          </div>
        </form>

        <form className="ad-card ad-form" action={saveLegalSettings} id="legal">
          <h2>Dades legals</h2>
          <p className="ad-muted">
            El banc les revisa abans d’activar el TPV. Surten a l’avís legal, a les condicions de venda i al peu de la web.
            {missing.length ? <> Falten: <b>{missing.join(', ')}</b>.</> : ' Completes.'}
          </p>
          <div className="lp-field">
            <label htmlFor="l-company">Raó social o nom i cognoms del titular</label>
            <input className="lp-input" id="l-company" name="company" defaultValue={l.company} maxLength={160} />
          </div>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="l-nrt">NRT</label>
              <input className="lp-input" id="l-nrt" name="nrt" defaultValue={l.nrt} maxLength={40} />
            </div>
            <div className="lp-field">
              <label htmlFor="l-registry">Núm. registre de comerç (si en teniu)</label>
              <input className="lp-input" id="l-registry" name="registry" defaultValue={l.registry} maxLength={60} />
            </div>
          </div>
          <div className="lp-field">
            <label htmlFor="l-purpose-ca">Objecte social (català)</label>
            <input className="lp-input" id="l-purpose-ca" name="purposeCa" defaultValue={l.purposeCa} maxLength={400} placeholder="Comerç al detall d’accessoris i complements" />
          </div>
          <div className="lp-field">
            <label htmlFor="l-purpose-es">Objecte social (castellà)</label>
            <input className="lp-input" id="l-purpose-es" name="purposeEs" defaultValue={l.purposeEs} maxLength={400} placeholder="Comercio al por menor de accesorios y complementos" />
          </div>
          <div className="lp-field">
            <label htmlFor="l-address">Domicili complet</label>
            <input className="lp-input" id="l-address" name="address" defaultValue={l.address} maxLength={240} />
          </div>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="l-phone">Telèfon de contacte</label>
              <input className="lp-input" id="l-phone" name="phone" type="tel" defaultValue={l.phone} maxLength={40} />
            </div>
            <div className="lp-field">
              <label htmlFor="l-bank">Entitat del TPV Virtual</label>
              <input className="lp-input" id="l-bank" name="bank" defaultValue={l.bank} maxLength={60} placeholder="Creand, MoraBanc, Andbank…" />
            </div>
          </div>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="l-days">Dies per tornar un producte</label>
              <input className="lp-input" id="l-days" name="returnDays" type="number" min={1} max={365} defaultValue={l.returnDays} />
            </div>
            <div className="lp-field">
              <label htmlFor="l-ship">Enviament de tornada</label>
              <select className="lp-select" id="l-ship" name="returnShippingBy" defaultValue={l.returnShippingBy}>
                <option value="client">El paga el client</option>
                <option value="store">El paguem nosaltres</option>
              </select>
            </div>
          </div>
          <div>
            <button className="lp-btn" type="submit">
              Desa les dades legals
            </button>
          </div>
        </form>

        <section className="ad-card">
          <h2>Connexions</h2>
          <dl className="ad-kv">
            <dt>Pagaments</dt>
            <dd>
              Redsys · {env.redsys.env === 'production' ? 'producció (cobra de veritat)' : 'proves'} · comerç {env.redsys.merchantCode} / terminal {env.redsys.terminal}
            </dd>
            <dt>Correus</dt>
            <dd>{env.mail.resendKey ? `Resend · remitent ${env.mail.from}` : 'Desactivats (falta RESEND_API_KEY)'}</dd>
            <dt>Fotos</dt>
            <dd>{r2Enabled() ? 'Cloudflare R2' : 'Disc local (només per proves)'}</dd>
            <dt>Web</dt>
            <dd>{env.siteUrl}</dd>
          </dl>
          <p className="ad-muted">Aquestes dades es configuren a les variables d’entorn del servidor (Hostinger).</p>
        </section>

        <section className="ad-card">
          <h2>Qui pot entrar al tauler</h2>
          <table className="ad-table">
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.name || '—'}
                    <div className="ad-muted">{a.email}</div>
                  </td>
                  <td className="num">
                    {a.id !== me.id ? (
                      <form action={removeAdmin}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="lp-textbtn ad-danger" type="submit">
                          Treu l’accés
                        </button>
                      </form>
                    ) : (
                      <span className="ad-muted">Tu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <form className="ad-card ad-form" action={createAdmin}>
          <h2>Afegeix una persona al tauler</h2>
          <div className="lp-field">
            <label htmlFor="a-name">Nom</label>
            <input className="lp-input" id="a-name" name="name" />
          </div>
          <div className="lp-field">
            <label htmlFor="a-email">Correu</label>
            <input className="lp-input" id="a-email" name="email" type="email" required />
          </div>
          <div className="lp-field">
            <label htmlFor="a-pass">Contrasenya (mínim 12 caràcters)</label>
            <input className="lp-input" id="a-pass" name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" required />
          </div>
          <div>
            <button className="lp-btn" type="submit">
              Crea l’accés
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
