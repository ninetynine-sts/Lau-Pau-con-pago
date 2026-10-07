import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Sheen } from '@/components/brand';
import { AuthCard, FormMessage } from '@/components/account-ui';
import { register } from '@/app/actions/account';
import { isLang, path } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = { robots: { index: false } };

export default async function Register({
  params,
  searchParams
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ e?: string; next?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { e, next } = await searchParams;
  if (await getUser()) redirect(path(lang, 'cuenta'));
  const d = t(lang).accountPages;
  const errors = d.errors as Record<string, string>;
  const nextQ = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <AuthCard title={d.register}>
      <FormMessage error={e ? errors[e] ?? d.errors.required : null} />
      <form className="lp-form" action={register}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="next" value={next ?? ''} />
        <div className="lp-field">
          <label htmlFor="r-name">{d.name}</label>
          <input className="lp-input" id="r-name" name="name" autoComplete="name" required />
        </div>
        <div className="lp-field">
          <label htmlFor="r-email">{d.email}</label>
          <input className="lp-input" id="r-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="lp-field">
          <label htmlFor="r-phone">{d.phone}</label>
          <input className="lp-input" id="r-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="lp-field">
          <label htmlFor="r-pass">{d.password}</label>
          <input className="lp-input" id="r-pass" name="password" type="password" autoComplete="new-password" minLength={10} required />
          <span className="lp-field__help">{d.passwordHelp}</span>
        </div>
        <button className="lp-btn lp-btn--block" type="submit">
          <Sheen />
          {d.registerCta}
        </button>
      </form>
      <p className="lp-field__help" style={{ fontSize: 14 }}>
        {d.hasAccount}{' '}
        <Link className="lp-link" href={`${path(lang, 'cuenta', 'acceder')}${nextQ}`}>
          {d.login}
        </Link>
      </p>
    </AuthCard>
  );
}
