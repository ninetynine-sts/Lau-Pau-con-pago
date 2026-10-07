import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Sheen } from '@/components/brand';
import { AuthCard, FormMessage } from '@/components/account-ui';
import { resetPassword } from '@/app/actions/account';
import { isLang } from '@/lib/routes';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { robots: { index: false } };

export default async function Reset({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ token?: string; e?: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { token, e } = await searchParams;
  const d = t(lang).accountPages;
  return (
    <AuthCard title={d.resetTitle}>
      <FormMessage error={e === 'invalid' || !token ? d.resetInvalid : e === 'password' ? d.errors.password : null} />
      {token ? (
        <form className="lp-form" action={resetPassword}>
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="token" value={token} />
          <div className="lp-field">
            <label htmlFor="rs-pass">{d.newPassword}</label>
            <input className="lp-input" id="rs-pass" name="password" type="password" autoComplete="new-password" minLength={10} required />
            <span className="lp-field__help">{d.passwordHelp}</span>
          </div>
          <button className="lp-btn lp-btn--block" type="submit">
            <Sheen />
            {d.resetCta}
          </button>
        </form>
      ) : null}
    </AuthCard>
  );
}
