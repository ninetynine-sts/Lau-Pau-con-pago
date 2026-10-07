import { redirect } from 'next/navigation';
import { adminLogin } from '@/app/actions/admin';
import { getUser } from '@/lib/auth';

export const metadata = { title: 'Entrar' };

const ERRORS: Record<string, string> = {
  dades: 'El correu o la contrasenya no són correctes, o el compte no té accés al tauler.',
  massa: 'Massa intents. Espera uns minuts i torna-ho a provar.'
};

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const user = await getUser();
  if (user?.role === 'admin') redirect('/admin');
  const { e } = await searchParams;
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form className="ad-card ad-form" action={adminLogin} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
          <img src="/laupau/marca/logo-final.png" alt="Lau&Pau" width={84} height={84} />
          <h1 style={{ fontSize: '1.5rem' }}>Tauler de Lau&amp;Pau</h1>
        </div>
        {e ? <p className="lp-alert lp-alert--error">{ERRORS[e] ?? ERRORS.dades}</p> : null}
        <div className="lp-field">
          <label htmlFor="email">Correu</label>
          <input className="lp-input" id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div className="lp-field">
          <label htmlFor="password">Contrasenya</label>
          <input className="lp-input" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="lp-btn lp-btn--block" type="submit">
          Entra
        </button>
      </form>
    </main>
  );
}
