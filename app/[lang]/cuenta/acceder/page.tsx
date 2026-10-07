import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Sheen } from '@/components/brand';
import { AuthCard, FormMessage } from '@/components/account-ui';
import { login } from '@/app/actions/account';
import { isLang, path } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = { robots: { index: false } };

export default async function Login({
  params,
  searchParams
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ e?: string; next?: string; reset?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { e, next, reset } = await searchParams;
  if (await getUser()) redirect(next && next.startsWith(`/${lang}`) ? next : path(lang, 'cuenta'));
  const d = t(lang).accountPages;
  const errors = d.errors as Record<string, string>;
  const nextQ = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <AuthCard title={d.login}>
      <FormMessage error={e ? errors[e] ?? d.errors.credentials : null} ok={reset ? d.resetDone : null} />
      <form className="lp-form" action={login}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="next" value={next ?? ''} />
        <div className="lp-field">
          <label htmlFor="l-email">{d.email}</label>
          <input className="lp-input" id="l-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="lp-field">
          <label htmlFor="l-pass">{d.password}</label>
          <input className="lp-input" id="l-pass" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="lp-btn lp-btn--block" type="submit">
          <Sheen />
          {d.loginCta}
        </button>
      </form>
      <p className="lp-field__help" style={{ fontSize: 14 }}>
        <Link className="lp-link" href={path(lang, 'cuenta', 'recuperar')}>
          {d.forgot}
        </Link>
      </p>
      <p className="lp-field__help" style={{ fontSize: 14 }}>
        {d.noAccount}{' '}
        <Link className="lp-link" href={`${path(lang, 'cuenta', 'registro')}${nextQ}`}>
          {d.register}
        </Link>
      </p>
    </AuthCard>
  );
}
