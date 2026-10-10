import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <main className="ad-login">
      <section className="ad-card" style={{ maxWidth: 420, margin: '15vh auto', textAlign: 'center' }}>
        <h1>Aquesta pàgina no existeix</h1>
        <p className="ad-muted">
          <Link className="lp-link" href="/admin">
            Torna al tauler
          </Link>
        </p>
      </section>
    </main>
  );
}
