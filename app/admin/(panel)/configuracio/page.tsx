import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { env } from '@/lib/env';
import { r2Enabled } from '@/lib/storage';
import { createAdmin, removeAdmin, saveStoreSettings } from '@/app/actions/admin';
import { Flash } from '@/components/admin-ui';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Configuració' };

export default async function Settings({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { ok, e } = await searchParams;
  const me = await requireAdmin();
  const [s, admins] = await Promise.all([getSettings(), db.select().from(schema.users).where(eq(schema.users.role, 'admin'))]);
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
