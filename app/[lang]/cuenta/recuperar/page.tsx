import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Sheen } from '@/components/brand';
import { AuthCard, FormMessage } from '@/components/account-ui';
import { requestPasswordReset } from '@/app/actions/account';
import { isLang } from '@/lib/routes';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { robots: { index: false } };

export default async function Recover({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { sent } = await searchParams;
  const d = t(lang).accountPages;
  return (
    <AuthCard title={d.recoverTitle}>
      {sent ? (
        <FormMessage ok={d.recoverSent} />
      ) : (
        <>
          <p className="lp-lead" style={{ fontSize: 15 }}>{d.recoverText}</p>
          <form className="lp-form" action={requestPasswordReset}>
            <input type="hidden" name="lang" value={lang} />
            <div className="lp-field">
              <label htmlFor="rc-email">{d.email}</label>
              <input className="lp-input" id="rc-email" name="email" type="email" autoComplete="email" required />
            </div>
            <button className="lp-btn lp-btn--block" type="submit">
              <Sheen />
              {d.recoverCta}
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
