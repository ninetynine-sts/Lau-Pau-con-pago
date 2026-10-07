/** Área de cliente de la demo: entrar, crear cuenta, pedidos, solicitudes, direcciones y datos. */
import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { Sheen } from '@/components/brand';
import { countryName } from '@/lib/countries';
import { formatDate, formatPrice, loc, orderNumber, t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';
import { CUSTOMER, db as live, nextId, save, useDB } from '../mock/store';
import { navigate } from '../shims/router';

type Tab = 'orders' | 'requests' | 'addresses' | 'details';

function Shell({ lang, active, children }: { lang: Lang; active: Tab; children: ReactNode }) {
  const db = useDB();
  const user = db.users.find((u) => u.id === db.session.customerId)!;
  const d = t(lang).accountPages;
  const tabs: { id: Tab; seg: string; label: string }[] = [
    { id: 'orders', seg: 'pedidos', label: d.orders },
    { id: 'requests', seg: 'solicitudes', label: d.requests },
    { id: 'addresses', seg: 'direcciones', label: d.addresses },
    { id: 'details', seg: 'datos', label: d.details }
  ];
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'end', marginBottom: 'clamp(20px,3vw,30px)' }}>
          <div className="lp-stack" style={{ gap: 6 }}>
            <p className="lp-eyebrow lp-eyebrow--accent">{d.title}</p>
            <h1 style={{ fontSize: 'var(--h2)' }}>{user.name || user.email}</h1>
          </div>
          <button
            className="lp-btn lp-btn--ghost lp-btn--sm"
            type="button"
            onClick={() => {
              live.session.customerId = null;
              save();
              navigate(path(lang));
            }}
          >
            <Sheen />
            {d.logout}
          </button>
        </div>
        <ul className="lp-tabs">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Link href={path(lang, 'cuenta', tab.seg)} aria-current={tab.id === active ? 'page' : undefined}>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </section>
  );
}

function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container">
        <div className="lp-auth lp-panel lp-stack--lg">
          <h1 style={{ fontSize: 'var(--h2)' }}>{title}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}

export function Login({ lang }: { lang: Lang }) {
  const d = t(lang).accountPages;
  const [err, setErr] = useState('');
  const [email, setEmail] = useState(CUSTOMER.email);
  const [pass, setPass] = useState(CUSTOMER.password);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const u = live.users.find((x) => x.email === email.trim().toLowerCase() && x.password === pass);
    if (!u) return setErr(d.errors.credentials);
    live.session.customerId = u.id;
    save();
    navigate(path(lang, 'cuenta', 'pedidos'));
  };
  return (
    <AuthCard title={d.login}>
      <p className="lp-note">Demo: la cuenta de prueba ya está rellenada.</p>
      {err ? <p className="lp-alert lp-alert--error">{err}</p> : null}
      <form className="lp-form" onSubmit={submit}>
        <div className="lp-field">
          <label htmlFor="l-email">{d.email}</label>
          <input className="lp-input" id="l-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="lp-field">
          <label htmlFor="l-pass">{d.password}</label>
          <input className="lp-input" id="l-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        <button className="lp-btn lp-btn--block" type="submit">
          <Sheen />
          {d.loginCta}
        </button>
      </form>
      <p className="lp-field__help" style={{ fontSize: 14 }}>
        {d.noAccount}{' '}
        <Link className="lp-link" href={path(lang, 'cuenta', 'registro')}>
          {d.register}
        </Link>
      </p>
    </AuthCard>
  );
}

export function Register({ lang }: { lang: Lang }) {
  const d = t(lang).accountPages;
  const [err, setErr] = useState('');
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim().toLowerCase();
    const name = String(f.get('name') ?? '').trim();
    const password = String(f.get('password') ?? '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr(d.errors.required);
    if (password.length < 10) return setErr(d.errors.password);
    if (live.users.some((u) => u.email === email)) return setErr(d.errors.exists);
    const id = nextId();
    live.users.push({ id, email, password, name, phone: String(f.get('phone') ?? '') || null, role: 'customer', lang });
    live.session.customerId = id;
    save();
    navigate(path(lang, 'cuenta', 'pedidos'));
  };
  return (
    <AuthCard title={d.register}>
      {err ? <p className="lp-alert lp-alert--error">{err}</p> : null}
      <form className="lp-form" onSubmit={submit}>
        <div className="lp-field">
          <label htmlFor="r-name2">{d.name}</label>
          <input className="lp-input" id="r-name2" name="name" />
        </div>
        <div className="lp-field">
          <label htmlFor="r-email2">{d.email}</label>
          <input className="lp-input" id="r-email2" name="email" type="email" />
        </div>
        <div className="lp-field">
          <label htmlFor="r-phone2">{d.phone}</label>
          <input className="lp-input" id="r-phone2" name="phone" type="tel" />
        </div>
        <div className="lp-field">
          <label htmlFor="r-pass2">{d.password}</label>
          <input className="lp-input" id="r-pass2" name="password" type="password" />
          <span className="lp-field__help">{d.passwordHelp}</span>
        </div>
        <button className="lp-btn lp-btn--block" type="submit">
          <Sheen />
          {d.registerCta}
        </button>
      </form>
    </AuthCard>
  );
}

export function AccountRoute({ lang, sub }: { lang: Lang; sub: string | undefined }) {
  const db = useDB();
  if (sub === 'registro') return <Register lang={lang} />;
  if (!db.session.customerId || sub === 'acceder') return <Login lang={lang} />;
  if (sub === 'solicitudes') return <Requests lang={lang} />;
  if (sub === 'direcciones') return <Addresses lang={lang} />;
  if (sub === 'datos') return <Details lang={lang} />;
  return <Orders lang={lang} />;
}

function Orders({ lang }: { lang: Lang }) {
  const db = useDB();
  const d = t(lang);
  const orders = db.orders.filter((o) => o.userId === db.session.customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Shell lang={lang} active="orders">
      {orders.length ? (
        <table className="lp-table">
          <thead>
            <tr>
              <th>{d.order.title('').trim()}</th>
              <th>{d.order.date}</th>
              <th>{d.order.status}</th>
              <th>{d.checkout.total}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link className="lp-link" href={path(lang, 'pedido', o.publicId)}>
                    <b>{orderNumber(o.id)}</b>
                  </Link>
                </td>
                <td>{formatDate(o.createdAt, lang)}</td>
                <td>
                  <span className="lp-status-pill" data-s={o.status}>
                    {d.order.statuses[o.status]}
                  </span>
                </td>
                <td>
                  <b>{formatPrice(o.totalCents, lang)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="lp-lead">{d.accountPages.noOrders}</p>
      )}
    </Shell>
  );
}

function Requests({ lang }: { lang: Lang }) {
  const db = useDB();
  const d = t(lang);
  const me = db.users.find((u) => u.id === db.session.customerId);
  const rows = db.requests.filter((r) => r.userId === me?.id || r.email === me?.email);
  return (
    <Shell lang={lang} active="requests">
      {rows.length ? (
        <table className="lp-table">
          <thead>
            <tr>
              <th>{d.product.products}</th>
              <th>{d.order.date}</th>
              <th>{d.order.status}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const o = db.orders.find((x) => x.id === r.orderId);
              return (
                <tr key={r.id}>
                  <td>
                    <b>{loc(r.productName, lang)}</b> × {r.quantity}
                    <span className="lp-line__meta" style={{ display: 'block' }}>
                      {r.personalization?.letter ? `${d.order.letter}: ${r.personalization.letter}` : r.personalization?.idea ?? ''}
                    </span>
                  </td>
                  <td>{formatDate(r.createdAt, lang)}</td>
                  <td>
                    <span className="lp-status-pill" data-s={r.status}>
                      {d.accountPages.requestStatuses[r.status]}
                    </span>
                  </td>
                  <td>
                    {r.status === 'quoted' && o ? (
                      <Link className="lp-btn lp-btn--sm" href={path(lang, 'pagar', o.publicId)}>
                        {d.accountPages.pay}
                      </Link>
                    ) : r.status === 'paid' && o ? (
                      <Link className="lp-link" href={path(lang, 'pedido', o.publicId)}>
                        {d.accountPages.view}
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="lp-lead">{d.accountPages.noRequests}</p>
      )}
    </Shell>
  );
}

function Addresses({ lang }: { lang: Lang }) {
  const db = useDB();
  const a = t(lang).accountPages;
  const rows = db.addresses.filter((x) => x.userId === db.session.customerId);
  return (
    <Shell lang={lang} active="addresses">
      {rows.length ? (
        <div className="lp-addresses">
          {rows.map((r) => (
            <div key={r.id} className="lp-panel lp-stack">
              <p className="lp-address">
                {r.label ? <b>{r.label}</b> : null}
                {r.isDefault ? (
                  <span className="lp-status-pill" style={{ marginLeft: 8 }}>
                    {a.default}
                  </span>
                ) : null}
                <br />
                {r.data.name}
                <br />
                {r.data.line1}
                <br />
                {r.data.postalCode} {r.data.city}
                <br />
                {countryName(r.data.country, lang)}
              </p>
              <div>
                <button
                  className="lp-textbtn"
                  type="button"
                  onClick={() => {
                    live.addresses = live.addresses.filter((x) => x.id !== r.id);
                    save();
                  }}
                >
                  {a.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="lp-lead">{a.noAddresses}</p>
      )}
      <p className="lp-field__help" style={{ marginTop: 18 }}>
        {lang === 'ca' ? 'Les adreces noves es desen en finalitzar una compra.' : 'Las direcciones nuevas se guardan al finalizar una compra.'}
      </p>
    </Shell>
  );
}

function Details({ lang }: { lang: Lang }) {
  const db = useDB();
  const a = t(lang).accountPages;
  const user = db.users.find((u) => u.id === db.session.customerId)!;
  const [ok, setOk] = useState(false);
  return (
    <Shell lang={lang} active="details">
      <form
        className="lp-panel lp-form"
        style={{ maxWidth: 620 }}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const u = live.users.find((x) => x.id === user.id)!;
          u.name = String(f.get('name') ?? '').trim() || u.name;
          u.phone = String(f.get('phone') ?? '').trim() || null;
          save();
          setOk(true);
        }}
      >
        {ok ? <p className="lp-alert lp-alert--ok">{a.saved}</p> : null}
        <div className="lp-field">
          <label htmlFor="d-email">{a.email}</label>
          <input className="lp-input" id="d-email" value={user.email} readOnly disabled />
        </div>
        <div className="lp-field">
          <label htmlFor="d-name">{a.name}</label>
          <input className="lp-input" id="d-name" name="name" defaultValue={user.name} />
        </div>
        <div className="lp-field">
          <label htmlFor="d-phone">{a.phone}</label>
          <input className="lp-input" id="d-phone" name="phone" defaultValue={user.phone ?? ''} />
        </div>
        <div>
          <button className="lp-btn" type="submit">
            <Sheen />
            {a.save}
          </button>
        </div>
      </form>
    </Shell>
  );
}
