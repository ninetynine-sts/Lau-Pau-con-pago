import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Sheen } from '@/components/brand';
import { AccountShell, FormMessage } from '@/components/account-ui';
import { changePassword, updateProfile } from '@/app/actions/account';
import { isLang, path } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { requireCustomer } from '@/lib/auth';

export const metadata: Metadata = { robots: { index: false } };

export default async function Details({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ e?: string; ok?: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { e, ok } = await searchParams;
  const user = await requireCustomer(path(lang, 'cuenta', 'acceder'));
  const a = t(lang).accountPages;
  const errors = a.errors as Record<string, string>;
  return (
    <AccountShell lang={lang} active="details" name={user.name || user.email}>
      <div className="lp-stack--lg" style={{ maxWidth: 620 }}>
        <FormMessage error={e ? errors[e] ?? a.errors.required : null} ok={ok ? a.saved : null} />
        <form className="lp-panel lp-form" action={updateProfile}>
          <input type="hidden" name="lang" value={lang} />
          <div className="lp-field">
            <label htmlFor="d-email">{a.email}</label>
            <input className="lp-input" id="d-email" value={user.email} readOnly disabled />
          </div>
          <div className="lp-field">
            <label htmlFor="d-name">{a.name}</label>
            <input className="lp-input" id="d-name" name="name" defaultValue={user.name} required autoComplete="name" />
          </div>
          <div className="lp-field">
            <label htmlFor="d-phone">{a.phone}</label>
            <input className="lp-input" id="d-phone" name="phone" defaultValue={user.phone ?? ''} autoComplete="tel" />
          </div>
          <div className="lp-field">
            <label htmlFor="d-lang">Idioma</label>
            <select className="lp-select" id="d-lang" name="userLang" defaultValue={user.lang}>
              <option value="es">Castellano</option>
              <option value="ca">Català</option>
            </select>
          </div>
          <div>
            <button className="lp-btn" type="submit">
              <Sheen />
              {a.save}
            </button>
          </div>
        </form>

        <form className="lp-panel lp-form" action={changePassword}>
          <h2 style={{ fontSize: 'var(--h3)' }}>{a.changePassword}</h2>
          <input type="hidden" name="lang" value={lang} />
          <div className="lp-field">
            <label htmlFor="d-cur">{a.currentPassword}</label>
            <input className="lp-input" id="d-cur" name="current" type="password" autoComplete="current-password" required />
          </div>
          <div className="lp-field">
            <label htmlFor="d-new">{a.newPassword}</label>
            <input className="lp-input" id="d-new" name="password" type="password" autoComplete="new-password" minLength={10} required />
            <span className="lp-field__help">{a.passwordHelp}</span>
          </div>
          <div>
            <button className="lp-btn lp-btn--ghost" type="submit">
              <Sheen />
              {a.save}
            </button>
          </div>
        </form>
      </div>
    </AccountShell>
  );
}
