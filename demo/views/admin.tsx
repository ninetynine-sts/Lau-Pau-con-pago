/** Tauler d'administració de la demo (mateixa estructura i textos que /admin real). */
import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { loc, orderNumber } from '@/lib/i18n';
import { countryName } from '@/lib/countries';
import { path } from '@/lib/routes';
import { COUPON_KIND_CA, ORDER_STATUS_CA, REQUEST_STATUS_CA, dateCa, eur, eurInput } from '@/lib/admin-labels';
import { ADMIN, db as live, nextId, nowIso, save, useDB, type OrderStatus } from '../mock/store';
import { mailQuote, mailRejected, mailShipped, newOrder } from '../mock/shop';
import { navigate, useHashPath } from '../shims/router';
import { VariantColor } from '@/components/variant-color';
import { colorFromForm } from '@/lib/catalog';

const cents = (v: string): number | null => {
  const c = v.replace(/\s|€/g, '').replace(',', '.');
  if (!c || !/^\d+(\.\d{1,2})?$/.test(c)) return null;
  return Math.round(Number(c) * 100);
};

function Status({ s, label }: { s: string; label: string }) {
  return (
    <span className="lp-status-pill" data-s={s}>
      {label}
    </span>
  );
}

function Flash({ msg, error = false }: { msg: string; error?: boolean }) {
  if (!msg) return null;
  return (
    <p className={`lp-alert ${error ? 'lp-alert--error' : 'lp-alert--ok'}`} role="status">
      {msg}
    </p>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState(ADMIN.email);
  const [pass, setPass] = useState(ADMIN.password);
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const u = live.users.find((x) => x.email === email.trim().toLowerCase() && x.password === pass && x.role === 'admin');
    if (!u) return setErr('El correu o la contrasenya no són correctes, o el compte no té accés al tauler.');
    live.session.adminId = u.id;
    save();
  };
  return (
    <main style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form className="ad-card ad-form" onSubmit={submit} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
          <img src="laupau/marca/logo-final.png" alt="Lau&Pau" width={84} height={84} />
          <h1 style={{ fontSize: '1.5rem' }}>Tauler de Lau&amp;Pau</h1>
        </div>
        <p className="lp-note">Demo: el compte de prova ja està omplert.</p>
        {err ? <p className="lp-alert lp-alert--error">{err}</p> : null}
        <div className="lp-field">
          <label htmlFor="a-email">Correu</label>
          <input className="lp-input" id="a-email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="lp-field">
          <label htmlFor="a-pass">Contrasenya</label>
          <input className="lp-input" id="a-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        <button className="lp-btn lp-btn--block" type="submit">
          Entra
        </button>
      </form>
    </main>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const db = useDB();
  const pathname = useHashPath();
  const user = db.users.find((u) => u.id === db.session.adminId)!;
  const items = [
    { href: '/admin', label: 'Inici' },
    { href: '/admin/comandes', label: 'Comandes', count: db.orders.filter((o) => o.status === 'paid').length },
    { href: '/admin/sollicituds', label: 'Sol·licituds', count: db.requests.filter((r) => r.status === 'new').length },
    { href: '/admin/productes', label: 'Productes' },
    { href: '/admin/enviaments', label: 'Enviaments' },
    { href: '/admin/cupons', label: 'Cupons' },
    { href: '/admin/configuracio', label: 'Configuració' }
  ];
  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <Link className="ad-brand" href="/admin">
          <img src="laupau/marca/logo-final.png" alt="" width={44} height={44} />
          <span>
            Lau&amp;Pau
            <small>Tauler</small>
          </span>
        </Link>
        <nav className="ad-nav" aria-label="Tauler">
          {items.map((i) => {
            const active = i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}>
                <span>{i.label}</span>
                {i.count ? <span className="ad-nav__count">{i.count}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="ad-side__foot">
          <span>{user.name}</span>
          <Link className="lp-link" href="/ca">
            Veure la botiga
          </Link>
          <button
            className="lp-textbtn"
            type="button"
            onClick={() => {
              live.session.adminId = null;
              save();
            }}
          >
            Tanca la sessió
          </button>
        </div>
      </aside>
      <main className="ad-main">{children}</main>
    </div>
  );
}

export function AdminRoute({ segs }: { segs: string[] }) {
  const db = useDB();
  if (!db.session.adminId) return <AdminLogin />;
  const [section, id] = segs;
  let body: ReactNode;
  if (!section) body = <Dashboard />;
  else if (section === 'comandes') body = id ? <OrderDetail id={Number(id)} /> : <Orders />;
  else if (section === 'sollicituds') body = id ? <RequestDetail id={Number(id)} /> : <Requests />;
  else if (section === 'productes') body = id ? <ProductEdit id={Number(id)} /> : <Products />;
  else if (section === 'enviaments') body = <Shipping />;
  else if (section === 'cupons') body = <Coupons />;
  else if (section === 'configuracio') body = <Settings />;
  else body = <p>Pàgina no trobada.</p>;
  return <Shell>{body}</Shell>;
}

/* ---------------------------------------------------------------- inici --- */

function Dashboard() {
  const db = useDB();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const paidMonth = db.orders.filter((o) => o.paidAt && new Date(o.paidAt) >= monthStart);
  const recent = db.orders.filter((o) => ['paid', 'preparing', 'shipped'].includes(o.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const newReq = db.requests.filter((r) => r.status === 'new');
  const low = db.variants
    .filter((v) => v.stock !== null && v.stock <= 2 && v.active)
    .map((v) => ({ v, p: db.products.find((p) => p.id === v.productId)! }))
    .filter((x) => x.p?.active && x.p.personalization.mode === 'none');
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Hola!</h1>
          <p>Resum de la botiga.</p>
        </div>
      </div>
      {!db.settings.shippingReviewed ? (
        <p className="ad-warn">
          <b>Revisa els enviaments.</b> Els preus i zones són d’exemple.{' '}
          <Link className="lp-link" href="/admin/enviaments">
            Obre Enviaments
          </Link>
        </p>
      ) : null}
      <p className="ad-warn">
        <b>Pagaments en mode de proves.</b> Redsys funciona amb l’entorn de test: no es cobra res de veritat.
      </p>
      <div className="ad-stats">
        <Link className="ad-stat" href="/admin/comandes">
          <b>{db.orders.filter((o) => o.status === 'paid' || o.status === 'preparing').length}</b>
          <span>Comandes per preparar o enviar</span>
        </Link>
        <Link className="ad-stat" href="/admin/sollicituds">
          <b>{newReq.length}</b>
          <span>Sol·licituds noves</span>
        </Link>
        <div className="ad-stat">
          <b>{eur(paidMonth.reduce((s, o) => s + o.totalCents, 0))}</b>
          <span>Cobrat aquest mes · {paidMonth.length} comandes</span>
        </div>
      </div>
      <div className="ad-grid ad-grid--2">
        <section className="ad-card">
          <h2>Últimes comandes pagades</h2>
          {recent.length ? (
            <table className="ad-table">
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/comandes/${o.id}`}>{orderNumber(o.id)}</Link>
                      <div className="ad-muted">{o.customerName}</div>
                    </td>
                    <td>
                      <Status s={o.status} label={ORDER_STATUS_CA[o.status]} />
                    </td>
                    <td className="num">{eur(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="ad-muted">Encara no hi ha comandes pagades.</p>
          )}
        </section>
        <div className="ad-grid">
          <section className="ad-card">
            <h2>Sol·licituds per revisar</h2>
            {newReq.length ? (
              <table className="ad-table">
                <tbody>
                  {newReq.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/admin/sollicituds/${r.id}`}>{loc(r.productName, 'ca')}</Link>
                        <div className="ad-muted">
                          {r.name} · {dateCa(r.createdAt)}
                        </div>
                      </td>
                      <td>
                        <Status s={r.status} label={REQUEST_STATUS_CA[r.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ad-muted">Cap sol·licitud pendent.</p>
            )}
          </section>
          <section className="ad-card">
            <h2>Estoc baix</h2>
            {low.length ? (
              <table className="ad-table">
                <tbody>
                  {low.map(({ v, p }) => (
                    <tr key={v.id}>
                      <td>
                        <Link href={`/admin/productes/${p.id}`}>{loc(p.name, 'ca')}</Link>
                        {v.name ? <div className="ad-muted">{loc(v.name, 'ca')}</div> : null}
                      </td>
                      <td className="num">{v.stock === 0 ? <b className="ad-danger">Esgotat</b> : `${v.stock} u.`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ad-muted">Tot correcte.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------- comandes --- */

const FILTERS: { id: string; label: string; statuses: string[] | null }[] = [
  { id: 'pendents', label: 'Per preparar', statuses: ['paid', 'preparing'] },
  { id: 'enviades', label: 'Enviades', statuses: ['shipped', 'delivered'] },
  { id: 'sensepagar', label: 'Sense pagar', statuses: ['pending_payment'] },
  { id: 'cancelades', label: 'Cancel·lades', statuses: ['cancelled', 'refunded'] },
  { id: 'totes', label: 'Totes', statuses: null }
];

function Orders() {
  const db = useDB();
  const [f, setF] = useState(FILTERS[0]);
  const rows = db.orders.filter((o) => !f.statuses || f.statuses.includes(o.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Comandes</h1>
          <p>Les comandes passen a «Pagada» soles quan el banc confirma el pagament.</p>
        </div>
      </div>
      <div className="ad-filter">
        {FILTERS.map((x) => (
          <a
            key={x.id}
            href="#"
            aria-current={x.id === f.id ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              setF(x);
            }}
          >
            {x.label}
          </a>
        ))}
      </div>
      <section className="ad-card">
        {rows.length ? (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Comanda</th>
                  <th>Data</th>
                  <th>Clienta</th>
                  <th>Lliurament</th>
                  <th>Estat</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/comandes/${o.id}`}>{orderNumber(o.id)}</Link>
                      {o.source === 'request' ? <div className="ad-muted">Personalització</div> : null}
                      {o.stockIssue ? (
                        <div className="ad-danger" style={{ fontSize: 12, fontWeight: 700 }}>
                          Revisa l’estoc
                        </div>
                      ) : null}
                    </td>
                    <td>{dateCa(o.paidAt ?? o.createdAt, true)}</td>
                    <td>
                      {o.customerName}
                      <div className="ad-muted">{o.email}</div>
                    </td>
                    <td>{o.shippingName ? o.shippingName.ca : '—'}</td>
                    <td>
                      <Status s={o.status} label={ORDER_STATUS_CA[o.status]} />
                    </td>
                    <td className="num">{eur(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ad-muted">No hi ha comandes en aquesta llista.</p>
        )}
      </section>
    </>
  );
}

function OrderDetail({ id }: { id: number }) {
  const db = useDB();
  const [msg, setMsg] = useState('');
  const o = db.orders.find((x) => x.id === id);
  if (!o) return <p>Comanda no trobada.</p>;
  const items = db.items.filter((i) => i.orderId === o.id);
  const payments = db.payments.filter((p) => p.orderId === o.id).reverse();
  const request = db.requests.find((r) => r.orderId === o.id);
  const a = o.shippingAddress;
  const allowed = (o.status === 'pending_payment' ? ['pending_payment', 'cancelled'] : Object.keys(ORDER_STATUS_CA).filter((s) => s !== 'pending_payment')) as OrderStatus[];
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const before = o.status;
    const status = String(f.get('status')) as OrderStatus;
    const order = live.orders.find((x) => x.id === id)!;
    order.status = status;
    order.trackingNumber = String(f.get('trackingNumber') ?? '').trim() || null;
    const url = String(f.get('trackingUrl') ?? '').trim();
    order.trackingUrl = /^https?:\/\//.test(url) ? url : null;
    order.adminNotes = String(f.get('adminNotes') ?? '').trim() || null;
    if (status === 'shipped' && !order.shippedAt) order.shippedAt = nowIso();
    let extra = '';
    if (f.get('notify') === 'on' && status !== before && status === 'shipped') {
      mailShipped(id);
      extra = ' S’ha enviat el correu a la clienta (mira la safata de correus de la demo).';
    }
    save();
    setMsg('Canvis desats.' + extra);
  };
  return (
    <>
      <div className="ad-head">
        <div>
          <p className="ad-muted">
            <Link className="lp-link" href="/admin/comandes">
              ← Comandes
            </Link>
          </p>
          <h1>{orderNumber(o.id)}</h1>
          <p>
            Creada el {dateCa(o.createdAt, true)}
            {o.paidAt ? ` · pagada el ${dateCa(o.paidAt, true)}` : ''} · idioma {o.lang === 'ca' ? 'català' : 'castellà'}
          </p>
        </div>
        <Status s={o.status} label={ORDER_STATUS_CA[o.status]} />
      </div>
      <Flash msg={msg} />
      {o.stockIssue ? (
        <p className="ad-warn">
          <b>Atenció:</b> quan es va pagar, algun article no tenia prou estoc.
        </p>
      ) : null}
      <div className="ad-grid ad-grid--2">
        <div className="ad-grid" style={{ alignContent: 'start' }}>
          <section className="ad-card">
            <h2>Articles</h2>
            <table className="ad-table">
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ width: 52 }}>{it.image ? <img className="ad-thumb" src={it.image} alt="" /> : null}</td>
                    <td>
                      <b>{loc(it.name, 'ca')}</b>
                      {it.personalization?.letter ? (
                        <div>
                          Lletra: <b>{it.personalization.letter}</b>
                        </div>
                      ) : null}
                      {it.personalization?.idea ? <div className="ad-pre">Idea: {it.personalization.idea}</div> : null}
                    </td>
                    <td className="num">
                      {it.quantity} × {eur(it.unitPriceCents)}
                    </td>
                    <td className="num">
                      <b>{eur(it.quantity * it.unitPriceCents)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ad-kv" style={{ justifySelf: 'end', minWidth: 240 }}>
              <dt>Subtotal</dt>
              <dd>{eur(o.subtotalCents)}</dd>
              {o.discountCents ? (
                <>
                  <dt>Descompte {o.couponCode ? `(${o.couponCode})` : ''}</dt>
                  <dd>−{eur(o.discountCents)}</dd>
                </>
              ) : null}
              <dt>Enviament</dt>
              <dd>{eur(o.shippingCents)}</dd>
              <dt>
                <b>Total</b>
              </dt>
              <dd>
                <b>{eur(o.totalCents)}</b>
              </dd>
            </dl>
          </section>
          {o.customerNotes ? (
            <section className="ad-card">
              <h2>Notes de la clienta</h2>
              <p className="ad-pre">{o.customerNotes}</p>
            </section>
          ) : null}
          {request ? (
            <section className="ad-card">
              <h2>Ve d’una sol·licitud</h2>
              <p>
                <Link className="lp-link" href={`/admin/sollicituds/${request.id}`}>
                  Obre la sol·licitud
                </Link>
                {o.status === 'pending_payment' ? (
                  <>
                    {' · '}
                    <Link className="lp-link" href={path(o.lang, 'pagar', o.publicId)}>
                      Obre l’enllaç de pagament
                    </Link>
                  </>
                ) : null}
              </p>
            </section>
          ) : null}
          <section className="ad-card">
            <h2>Pagaments Redsys</h2>
            {payments.length ? (
              <table className="ad-table">
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <code>{p.dsOrder}</code>
                      </td>
                      <td>{dateCa(p.updatedAt, true)}</td>
                      <td>
                        {p.status === 'authorized' ? (
                          <span className="lp-status-pill" data-s="delivered">
                            Autoritzat · {p.authCode}
                          </span>
                        ) : p.status === 'denied' ? (
                          <span className="lp-status-pill" data-s="cancelled">
                            Denegat · {p.responseCode}
                          </span>
                        ) : (
                          <span className="lp-status-pill">Iniciat, sense resposta</span>
                        )}
                      </td>
                      <td className="num">{eur(p.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ad-muted">La clienta encara no ha intentat pagar.</p>
            )}
          </section>
        </div>
        <div className="ad-grid" style={{ alignContent: 'start' }}>
          <section className="ad-card">
            <h2>Clienta</h2>
            <dl className="ad-kv">
              <dt>Nom</dt>
              <dd>{o.customerName}</dd>
              <dt>Correu</dt>
              <dd>{o.email}</dd>
              {o.phone ? (
                <>
                  <dt>Telèfon</dt>
                  <dd>{o.phone}</dd>
                </>
              ) : null}
            </dl>
          </section>
          <section className="ad-card">
            <h2>{a ? 'Enviament' : 'Lliurament'}</h2>
            <p>
              <b>{o.shippingName ? o.shippingName.ca : '—'}</b>
            </p>
            {a ? <p className="ad-pre">{[a.name, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.region, countryName(a.country, 'ca')].filter(Boolean).join('\n')}</p> : null}
          </section>
          <form className="ad-card ad-form" onSubmit={submit} key={o.status}>
            <h2>Gestiona la comanda</h2>
            <div className="lp-field">
              <label htmlFor="status">Estat</label>
              <select className="lp-select" id="status" name="status" defaultValue={o.status}>
                {allowed.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_CA[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="lp-field">
              <label htmlFor="trackingNumber">Número de seguiment</label>
              <input className="lp-input" id="trackingNumber" name="trackingNumber" defaultValue={o.trackingNumber ?? ''} />
            </div>
            <div className="lp-field">
              <label htmlFor="trackingUrl">Enllaç de seguiment</label>
              <input className="lp-input" id="trackingUrl" name="trackingUrl" placeholder="https://…" defaultValue={o.trackingUrl ?? ''} />
            </div>
            <div className="lp-field">
              <label htmlFor="adminNotes">Notes internes</label>
              <textarea className="lp-textarea" id="adminNotes" name="adminNotes" defaultValue={o.adminNotes ?? ''} />
            </div>
            <label className="lp-check">
              <input type="checkbox" name="notify" defaultChecked />
              En passar-la a «Enviada / a punt», envia un correu a la clienta.
            </label>
            <button className="lp-btn" type="submit">
              Desa
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------- sol·licituds --- */

function Requests() {
  const db = useDB();
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Sol·licituds de personalització</h1>
          <p>Revisa cada sol·licitud, fixa el preu final i envia l’enllaç de pagament.</p>
        </div>
      </div>
      <section className="ad-card">
        {db.requests.length ? (
          <div className="ad-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Producte</th>
                  <th>Personalització</th>
                  <th>Clienta</th>
                  <th>Data</th>
                  <th>Estat</th>
                </tr>
              </thead>
              <tbody>
                {db.requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/sollicituds/${r.id}`}>{loc(r.productName, 'ca')}</Link>
                      <div className="ad-muted">{r.quantity} u.</div>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      {r.personalization?.letter ? (
                        <>
                          Lletra <b>{r.personalization.letter}</b>
                        </>
                      ) : (
                        <span className="ad-muted">{(r.personalization?.idea ?? '').slice(0, 90)}</span>
                      )}
                    </td>
                    <td>
                      {r.name}
                      <div className="ad-muted">{r.email}</div>
                    </td>
                    <td>{dateCa(r.createdAt, true)}</td>
                    <td>
                      <Status s={r.status} label={REQUEST_STATUS_CA[r.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ad-muted">No hi ha sol·licituds.</p>
        )}
      </section>
    </>
  );
}

function RequestDetail({ id }: { id: number }) {
  const db = useDB();
  const [msg, setMsg] = useState<{ text: string; error?: boolean }>({ text: '' });
  const r = db.requests.find((x) => x.id === id);
  if (!r) return <p>Sol·licitud no trobada.</p>;
  const product = db.products.find((p) => p.id === r.productId);
  const order = db.orders.find((o) => o.id === r.orderId);
  const canQuote = r.status !== 'paid' && (!order || order.status === 'pending_payment' || order.status === 'cancelled');

  const quote = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const unit = cents(String(f.get('unitPrice') ?? ''));
    if (!unit) return setMsg({ text: 'Revisa el preu (per exemple, 12,50).', error: true });
    const days = Math.max(1, Math.min(60, Number(f.get('days')) || live.settings.paymentLinkDays));
    const message = String(f.get('message') ?? '').trim() || null;
    const expires = new Date(Date.now() + days * 86400000).toISOString();
    const req = live.requests.find((x) => x.id === id)!;
    let o = live.orders.find((x) => x.id === req.orderId && x.status === 'pending_payment');
    const subtotal = unit * req.quantity;
    if (o) {
      live.items.filter((i) => i.orderId === o!.id).forEach((i) => (i.unitPriceCents = unit));
      Object.assign(o, { subtotalCents: subtotal, totalCents: subtotal - o.discountCents + o.shippingCents, paymentLinkExpiresAt: expires });
    } else {
      o = newOrder({
        userId: req.userId,
        source: 'request',
        lang: req.lang,
        email: req.email,
        customerName: req.name,
        phone: req.phone,
        shippingAddress: null,
        shippingMethodId: null,
        shippingName: null,
        subtotalCents: subtotal,
        discountCents: 0,
        shippingCents: 0,
        totalCents: subtotal,
        couponCode: null,
        customerNotes: req.notes,
        paymentLinkExpiresAt: expires
      });
      live.items.push({ id: nextId(), orderId: o.id, productId: req.productId, variantId: req.variantId, name: req.productName, variantName: req.variantName ?? null, image: product?.images[0]?.src ?? null, unitPriceCents: unit, quantity: req.quantity, personalization: req.personalization });
    }
    Object.assign(req, { status: 'quoted', quotedUnitCents: unit, adminMessage: message, orderId: o.id });
    mailQuote(req, o, unit, message);
    save();
    setMsg({ text: 'Enllaç de pagament enviat a la clienta. Obre la safata de correus de la demo per seguir el camí de la clienta.' });
  };

  const reject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const req = live.requests.find((x) => x.id === id)!;
    const message = String(f.get('message') ?? '').trim() || null;
    req.status = 'rejected';
    req.adminMessage = message;
    const o = live.orders.find((x) => x.id === req.orderId && x.status === 'pending_payment');
    if (o) o.status = 'cancelled';
    if (f.get('notify') === 'on') mailRejected(req, message);
    save();
    setMsg({ text: 'Sol·licitud rebutjada.' });
  };

  return (
    <>
      <div className="ad-head">
        <div>
          <p className="ad-muted">
            <Link className="lp-link" href="/admin/sollicituds">
              ← Sol·licituds
            </Link>
          </p>
          <h1>{loc(r.productName, 'ca')}</h1>
          <p>
            Rebuda el {dateCa(r.createdAt, true)} · idioma {r.lang === 'ca' ? 'català' : 'castellà'}
          </p>
        </div>
        <Status s={r.status} label={REQUEST_STATUS_CA[r.status]} />
      </div>
      <Flash msg={msg.text} error={msg.error} />
      <div className="ad-grid ad-grid--2">
        <div className="ad-grid" style={{ alignContent: 'start' }}>
          <section className="ad-card">
            <h2>Què demana</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {product?.images[0] ? <img className="ad-thumb" style={{ width: 88, height: 88 }} src={product.images[0].src} alt="" /> : null}
              <dl className="ad-kv" style={{ minWidth: 0, flex: 1 }}>
                <dt>Unitats</dt>
                <dd>
                  <b>{r.quantity}</b>
                </dd>
                {r.personalization?.letter ? (
                  <>
                    <dt>Lletra</dt>
                    <dd style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{r.personalization.letter}</dd>
                  </>
                ) : null}
                {r.personalization?.idea ? (
                  <>
                    <dt>Idea</dt>
                    <dd className="ad-pre">{r.personalization.idea}</dd>
                  </>
                ) : null}
                {r.notes ? (
                  <>
                    <dt>Notes</dt>
                    <dd className="ad-pre">{r.notes}</dd>
                  </>
                ) : null}
                {product ? (
                  <>
                    <dt>Preu base</dt>
                    <dd>{eur(product.priceCents)}</dd>
                  </>
                ) : null}
              </dl>
            </div>
          </section>
          <section className="ad-card">
            <h2>Clienta</h2>
            <dl className="ad-kv">
              <dt>Nom</dt>
              <dd>{r.name}</dd>
              <dt>Correu</dt>
              <dd>{r.email}</dd>
            </dl>
          </section>
          {order ? (
            <section className="ad-card">
              <h2>Comanda</h2>
              <p>
                <Link className="lp-link" href={`/admin/comandes/${order.id}`}>
                  {orderNumber(order.id)}
                </Link>{' '}
                · <Status s={order.status} label={ORDER_STATUS_CA[order.status]} /> · {eur(order.totalCents)}
              </p>
              {order.status === 'pending_payment' ? (
                <p>
                  <Link className="lp-link" href={path(order.lang, 'pagar', order.publicId)}>
                    Obre l’enllaç de pagament (com la clienta)
                  </Link>
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
        <div className="ad-grid" style={{ alignContent: 'start' }}>
          {canQuote ? (
            <form className="ad-card ad-form" onSubmit={quote}>
              <h2>{r.status === 'quoted' ? 'Torna a enviar l’enllaç' : 'Confirma i envia l’enllaç de pagament'}</h2>
              <div className="ad-row ad-row--2">
                <div className="lp-field">
                  <label htmlFor="unitPrice">Preu final per unitat (€)</label>
                  <input className="lp-input" id="unitPrice" name="unitPrice" inputMode="decimal" defaultValue={eurInput(r.quotedUnitCents ?? product?.priceCents ?? 0)} />
                </div>
                <div className="lp-field">
                  <label htmlFor="days">Dies per pagar</label>
                  <input className="lp-input" id="days" name="days" type="number" min={1} max={60} defaultValue={db.settings.paymentLinkDays} />
                </div>
              </div>
              <div className="lp-field">
                <label htmlFor="message">Missatge per a la clienta (opcional)</label>
                <textarea className="lp-textarea" id="message" name="message" defaultValue={r.adminMessage ?? ''} placeholder="Per exemple: el brodat inclou el nom en color torrat." />
              </div>
              <button className="lp-btn" type="submit">
                Envia l’enllaç de pagament
              </button>
            </form>
          ) : null}
          {r.status !== 'paid' && r.status !== 'rejected' ? (
            <form className="ad-card ad-form" onSubmit={reject}>
              <h2>No es pot fer</h2>
              <div className="lp-field">
                <label htmlFor="rmessage">Motiu (opcional)</label>
                <textarea className="lp-textarea" id="rmessage" name="message" />
              </div>
              <label className="lp-check">
                <input type="checkbox" name="notify" defaultChecked />
                Avisa la clienta per correu
              </label>
              <button className="lp-btn ad-btn-danger" type="submit">
                Rebutja la sol·licitud
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------- productes --- */

function Products() {
  const db = useDB();
  const [msg, setMsg] = useState('');
  const products = [...db.products].sort((a, b) => a.sort - b.sort);
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Productes</h1>
          <p>{products.length} productes · ajusta l’estoc aquí mateix o obre’n un per editar-lo.</p>
        </div>
      </div>
      <Flash msg={msg} />
      <section className="ad-card">
        <div className="ad-scroll">
          <table className="ad-table">
            <thead>
              <tr>
                <th />
                <th>Producte</th>
                <th>Tipus</th>
                <th>Estoc</th>
                <th className="num">Preu</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={p.active ? undefined : { opacity: 0.55 }}>
                  <td style={{ width: 52 }}>{p.images[0] ? <img className="ad-thumb" src={p.images[0].src} alt="" /> : null}</td>
                  <td>
                    <Link href={`/admin/productes/${p.id}`}>{loc(p.name, 'ca')}</Link>
                    <div className="ad-muted">
                      {p.ref}
                      {!p.active ? ' · amagat' : ''}
                      {p.featured ? ' · destacat' : ''}
                    </div>
                  </td>
                  <td>{p.personalization.mode === 'none' ? 'Compra directa' : 'Per sol·licitud'}</td>
                  <td>
                    {p.personalization.mode === 'none' ? (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {db.variants
                          .filter((v) => v.productId === p.id)
                          .map((v) => (
                            <form
                              key={v.id}
                              style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                              onSubmit={(e) => {
                                e.preventDefault();
                                const val = String(new FormData(e.currentTarget).get('stock') ?? '');
                                live.variants.find((x) => x.id === v.id)!.stock = val === '' ? null : Math.max(0, Math.floor(Number(val)));
                                save();
                                setMsg('Estoc actualitzat.');
                              }}
                            >
                              <span style={{ minWidth: 70, fontSize: 13 }}>{v.name ? loc(v.name, 'ca') : 'Únic'}</span>
                              <input className="lp-input" name="stock" type="number" min={0} defaultValue={v.stock ?? ''} placeholder="∞" aria-label="Estoc" style={{ width: 84, padding: '7px 10px', fontSize: 14 }} />
                              <button className="lp-textbtn" type="submit">
                                Desa
                              </button>
                            </form>
                          ))}
                      </div>
                    ) : (
                      <span className="ad-muted">Es fabrica per encàrrec</span>
                    )}
                  </td>
                  <td className="num">{eur(p.priceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ProductEdit({ id }: { id: number }) {
  const db = useDB();
  const [msg, setMsg] = useState<{ text: string; error?: boolean }>({ text: '' });
  const p = db.products.find((x) => x.id === id);
  if (!p) return <p>Producte no trobat.</p>;
  const variants = db.variants.filter((v) => v.productId === p.id);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? '').trim();
    const price = cents(g('price'));
    if (!price) return setMsg({ text: 'Revisa el preu (per exemple, 12,50).', error: true });
    if (!g('name_es') || !g('name_ca')) return setMsg({ text: 'Cal el nom en castellà i en català.', error: true });
    const prod = live.products.find((x) => x.id === id)!;
    Object.assign(prod, {
      name: { es: g('name_es'), ca: g('name_ca') },
      shortDescription: { es: g('short_es'), ca: g('short_ca') },
      description: { es: g('description_es'), ca: g('description_ca') },
      priceCents: price,
      active: f.get('active') === 'on',
      featured: f.get('featured') === 'on'
    });
    for (const v of live.variants.filter((x) => x.productId === id)) {
      const k = `v_${v.id}`;
      if (f.get(`${k}_delete`) === 'on' && live.variants.filter((x) => x.productId === id).length > 1) {
        live.variants = live.variants.filter((x) => x.id !== v.id);
        continue;
      }
      const es = g(`${k}_es`);
      const ca = g(`${k}_ca`);
      v.name = es || ca ? { es: es || ca, ca: ca || es } : null;
      const st = g(`${k}_stock`);
      v.stock = st === '' ? null : Math.max(0, Math.floor(Number(st)));
      v.color = colorFromForm(g, String(v.id));
    }
    if (g('new_es') || g('new_ca')) {
      live.variants.push({ id: nextId(), productId: id, name: { es: g('new_es') || g('new_ca'), ca: g('new_ca') || g('new_es') }, color: colorFromForm(g, 'new'), sku: '', stock: g('new_stock') === '' ? null : Math.max(0, Number(g('new_stock'))), priceCents: null, active: true, sort: 99 });
    }
    save();
    setMsg({ text: 'Canvis desats. Ja es veuen a la botiga.' });
  };
  const Bi = ({ name, label, value, area = false }: { name: string; label: string; value: { es: string; ca: string }; area?: boolean }) => (
    <div className="ad-row ad-row--2">
      {(['es', 'ca'] as const).map((l) => (
        <div className="lp-field" key={l}>
          <label htmlFor={`${name}_${l}`}>
            {label}
            <span className="ad-lang">{l.toUpperCase()}</span>
          </label>
          {area ? <textarea className="lp-textarea" id={`${name}_${l}`} name={`${name}_${l}`} defaultValue={value[l]} /> : <input className="lp-input" id={`${name}_${l}`} name={`${name}_${l}`} defaultValue={value[l]} />}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <div className="ad-head">
        <div>
          <p className="ad-muted">
            <Link className="lp-link" href="/admin/productes">
              ← Productes
            </Link>
          </p>
          <h1>{loc(p.name, 'ca')}</h1>
        </div>
        <Link className="lp-link" href={path('ca', 'productos', p.slug)}>
          Veure a la botiga
        </Link>
      </div>
      <Flash msg={msg.text} error={msg.error} />
      <form className="ad-grid ad-grid--2" onSubmit={submit} key={p.id + JSON.stringify(variants.map((v) => v.id))}>
        <div className="ad-grid" style={{ alignContent: 'start' }}>
          <section className="ad-card ad-form">
            <h2>Fitxa</h2>
            <Bi name="name" label="Nom" value={p.name} />
            <Bi name="short" label="Frase curta (targeta)" value={p.shortDescription} />
            <Bi name="description" label="Descripció" value={p.description} area />
          </section>
          {p.personalization.mode === 'none' ? (
            <section className="ad-card ad-form">
              <h2>Models i estoc</h2>
              <p className="ad-muted">Cada fila és un color que la clienta pot triar, amb el to que es veu a la foto. Estoc buit = sense control.</p>
              <div className="ad-variants">
                {variants.map((v) => (
                  <div className="ad-variant" key={v.id} style={{ gridTemplateColumns: undefined }}>
                    <div className="lp-field">
                      <label htmlFor={`v_${v.id}_es`}>
                        Model<span className="ad-lang">ES</span>
                      </label>
                      <input className="lp-input" id={`v_${v.id}_es`} name={`v_${v.id}_es`} defaultValue={v.name?.es ?? ''} placeholder="Sense nom" />
                    </div>
                    <div className="lp-field">
                      <label htmlFor={`v_${v.id}_ca`}>
                        Model<span className="ad-lang">CA</span>
                      </label>
                      <input className="lp-input" id={`v_${v.id}_ca`} name={`v_${v.id}_ca`} defaultValue={v.name?.ca ?? ''} />
                    </div>
                    <div className="lp-field">
                      <label htmlFor={`v_${v.id}_stock`}>Estoc</label>
                      <input className="lp-input" id={`v_${v.id}_stock`} name={`v_${v.id}_stock`} type="number" min={0} defaultValue={v.stock ?? ''} placeholder="∞" />
                    </div>
                    <VariantColor k={String(v.id)} color={v.color} />
                    <label className="lp-check ad-danger" style={{ fontSize: 13, paddingBottom: 10 }}>
                      <input type="checkbox" name={`v_${v.id}_delete`} /> Elimina
                    </label>
                  </div>
                ))}
                <div className="ad-variant">
                  <div className="lp-field">
                    <label htmlFor="new_es">
                      Model nou<span className="ad-lang">ES</span>
                    </label>
                    <input className="lp-input" id="new_es" name="new_es" placeholder="Per exemple, Negro" />
                  </div>
                  <div className="lp-field">
                    <label htmlFor="new_ca">
                      Model nou<span className="ad-lang">CA</span>
                    </label>
                    <input className="lp-input" id="new_ca" name="new_ca" placeholder="Per exemple, Negre" />
                  </div>
                  <div className="lp-field">
                    <label htmlFor="new_stock">Estoc</label>
                    <input className="lp-input" id="new_stock" name="new_stock" type="number" min={0} placeholder="∞" />
                  </div>
                  <VariantColor k="new" color={null} />
                </div>
              </div>
            </section>
          ) : (
            <section className="ad-card">
              <h2>Personalització</h2>
              <p className="ad-muted">Aquest producte es ven per sol·licitud ({p.personalization.mode === 'letter' ? 'una lletra' : 'idea lliure'}): no va a la cistella.</p>
            </section>
          )}
        </div>
        <div className="ad-grid" style={{ alignContent: 'start' }}>
          <section className="ad-card ad-form">
            <h2>Venda</h2>
            <div className="lp-field">
              <label htmlFor="price">Preu (€, impostos inclosos)</label>
              <input className="lp-input" id="price" name="price" inputMode="decimal" defaultValue={eurInput(p.priceCents)} />
            </div>
            <label className="lp-check">
              <input type="checkbox" name="active" defaultChecked={p.active} /> Visible a la botiga
            </label>
            <label className="lp-check">
              <input type="checkbox" name="featured" defaultChecked={p.featured} /> Destacat a la portada
            </label>
          </section>
          <section className="ad-card">
            <h2>Fotos</h2>
            <div className="ad-images">
              {p.images.map((im) => (
                <div className="ad-image" key={im.src}>
                  <img src={im.src} alt="" />
                </div>
              ))}
            </div>
            <p className="ad-muted">A la botiga real es poden pujar fotos noves des d’aquí. A la demo només es mostren.</p>
          </section>
          <div className="ad-actions">
            <button className="lp-btn lp-btn--lg" type="submit">
              Desa el producte
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------ enviaments --- */

function Shipping() {
  const db = useDB();
  const [msg, setMsg] = useState('');
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Enviaments</h1>
          <p>Cada mètode s’ofereix als països indicats (AD Andorra, ES Espanya, FR França…).</p>
        </div>
      </div>
      <Flash msg={msg} />
      {!db.settings.shippingReviewed ? (
        <p className="ad-warn">
          <b>Aquests preus i zones són d’exemple.</b> Ajusta’ls i desa’ls.
        </p>
      ) : null}
      {db.shipping.map((m) => (
        <form
          key={m.id}
          className="ad-card ad-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const g = (k: string) => String(f.get(k) ?? '').trim();
            const mm = live.shipping.find((x) => x.id === m.id)!;
            mm.name = { es: g('name_es') || mm.name.es, ca: g('name_ca') || mm.name.ca };
            mm.priceCents = cents(g('price')) ?? 0;
            mm.freeOverCents = cents(g('freeOver'));
            mm.countries = g('countries').toUpperCase().split(/[\s,;]+/).filter((c) => /^[A-Z]{2}$/.test(c));
            mm.isPickup = f.get('isPickup') === 'on';
            mm.active = f.get('active') === 'on';
            live.settings.shippingReviewed = true;
            save();
            setMsg('Canvis desats. El càlcul de la compra ja fa servir aquests preus.');
          }}
        >
          <h2>{m.name.ca}</h2>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor={`n-${m.id}-es`}>
                Nom<span className="ad-lang">ES</span>
              </label>
              <input className="lp-input" id={`n-${m.id}-es`} name="name_es" defaultValue={m.name.es} />
            </div>
            <div className="lp-field">
              <label htmlFor={`n-${m.id}-ca`}>
                Nom<span className="ad-lang">CA</span>
              </label>
              <input className="lp-input" id={`n-${m.id}-ca`} name="name_ca" defaultValue={m.name.ca} />
            </div>
          </div>
          <div className="ad-row ad-row--3">
            <div className="lp-field">
              <label htmlFor={`p-${m.id}`}>Preu (€)</label>
              <input className="lp-input" id={`p-${m.id}`} name="price" defaultValue={eurInput(m.priceCents)} />
            </div>
            <div className="lp-field">
              <label htmlFor={`f-${m.id}`}>Gratuït a partir de (€)</label>
              <input className="lp-input" id={`f-${m.id}`} name="freeOver" defaultValue={eurInput(m.freeOverCents)} placeholder="Mai" />
            </div>
            <div className="lp-field">
              <label htmlFor={`c-${m.id}`}>Països</label>
              <input className="lp-input" id={`c-${m.id}`} name="countries" defaultValue={m.countries.join(', ')} />
            </div>
          </div>
          <div className="ad-actions">
            <label className="lp-check">
              <input type="checkbox" name="active" defaultChecked={m.active} /> Actiu
            </label>
            <label className="lp-check">
              <input type="checkbox" name="isPickup" defaultChecked={m.isPickup} /> És recollida (no demana adreça)
            </label>
            <button className="lp-btn lp-btn--sm" type="submit">
              Desa
            </button>
          </div>
        </form>
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- cupons --- */

function Coupons() {
  const db = useDB();
  const [msg, setMsg] = useState<{ text: string; error?: boolean }>({ text: '' });
  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const code = String(f.get('code') ?? '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const kind = String(f.get('kind')) as 'percent' | 'fixed' | 'free_shipping';
    const raw = String(f.get('value') ?? '');
    const value = kind === 'percent' ? Math.max(1, Math.min(100, Math.round(Number(raw.replace(',', '.')) || 0))) : kind === 'fixed' ? cents(raw) ?? 0 : 0;
    if (!code) return setMsg({ text: 'Cal un codi (lletres i números).', error: true });
    if (live.coupons.some((c) => c.code === code)) return setMsg({ text: 'Ja existeix un cupó amb aquest codi.', error: true });
    if (kind !== 'free_shipping' && value <= 0) return setMsg({ text: 'Indica el valor del descompte.', error: true });
    const max = String(f.get('maxUses') ?? '');
    live.coupons.unshift({ id: nextId(), code, kind, value, minSubtotalCents: cents(String(f.get('min') ?? '')) ?? 0, startsAt: null, expiresAt: null, maxUses: max ? Number(max) : null, usedCount: 0, active: true, createdAt: nowIso() });
    save();
    e.currentTarget.reset();
    setMsg({ text: `Cupó ${code} creat. Prova’l a la compra.` });
  };
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Cupons de descompte</h1>
          <p>La clienta escriu el codi en finalitzar la compra.</p>
        </div>
      </div>
      <Flash msg={msg.text} error={msg.error} />
      <section className="ad-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Codi</th>
              <th>Descompte</th>
              <th>Usos</th>
              <th>Actiu</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {db.coupons.map((c) => (
              <tr key={c.id} style={c.active ? undefined : { opacity: 0.55 }}>
                <td>
                  <b>{c.code}</b>
                </td>
                <td>
                  {c.kind === 'percent' ? `${c.value} %` : c.kind === 'fixed' ? eur(c.value) : COUPON_KIND_CA.free_shipping}
                  {c.minSubtotalCents ? <div className="ad-muted">a partir de {eur(c.minSubtotalCents)}</div> : null}
                </td>
                <td>
                  {c.usedCount}
                  {c.maxUses ? ` / ${c.maxUses}` : ''}
                </td>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Actiu ${c.code}`}
                    checked={c.active}
                    onChange={(e) => {
                      live.coupons.find((x) => x.id === c.id)!.active = e.target.checked;
                      save();
                    }}
                  />
                </td>
                <td className="num">
                  <button
                    className="lp-textbtn ad-danger"
                    type="button"
                    onClick={() => {
                      live.coupons = live.coupons.filter((x) => x.id !== c.id);
                      save();
                    }}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <form className="ad-card ad-form" onSubmit={create} style={{ maxWidth: 760 }}>
        <h2>Nou cupó</h2>
        <div className="ad-row ad-row--3">
          <div className="lp-field">
            <label htmlFor="c-code">Codi</label>
            <input className="lp-input" id="c-code" name="code" placeholder="NADAL" style={{ textTransform: 'uppercase' }} />
          </div>
          <div className="lp-field">
            <label htmlFor="c-kind">Tipus</label>
            <select className="lp-select" id="c-kind" name="kind" defaultValue="percent">
              {Object.entries(COUPON_KIND_CA).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="lp-field">
            <label htmlFor="c-value">Valor (% o €)</label>
            <input className="lp-input" id="c-value" name="value" placeholder="15" />
          </div>
        </div>
        <div className="ad-row ad-row--2">
          <div className="lp-field">
            <label htmlFor="c-min">Compra mínima (€)</label>
            <input className="lp-input" id="c-min" name="min" />
          </div>
          <div className="lp-field">
            <label htmlFor="c-max">Usos màxims</label>
            <input className="lp-input" id="c-max" name="maxUses" type="number" min={1} placeholder="Il·limitats" />
          </div>
        </div>
        <div>
          <button className="lp-btn lp-btn--sm" type="submit">
            Crea el cupó
          </button>
        </div>
      </form>
    </>
  );
}

/* --------------------------------------------------------- configuració --- */

function Settings() {
  const db = useDB();
  const [ok, setOk] = useState(false);
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Configuració</h1>
        </div>
      </div>
      {ok ? <Flash msg="Canvis desats." /> : null}
      <div className="ad-grid ad-grid--half">
        <form
          className="ad-card ad-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            live.settings.storeEmail = String(f.get('storeEmail') ?? '').trim() || live.settings.storeEmail;
            live.settings.notifyEmail = String(f.get('notifyEmail') ?? '').trim() || live.settings.notifyEmail;
            live.settings.paymentLinkDays = Math.max(1, Math.min(60, Number(f.get('days')) || 7));
            save();
            setOk(true);
          }}
        >
          <h2>Botiga</h2>
          <div className="lp-field">
            <label htmlFor="s-store">Correu de contacte (es mostra a la web)</label>
            <input className="lp-input" id="s-store" name="storeEmail" defaultValue={db.settings.storeEmail} />
          </div>
          <div className="lp-field">
            <label htmlFor="s-notify">Correu on arriben els avisos</label>
            <input className="lp-input" id="s-notify" name="notifyEmail" defaultValue={db.settings.notifyEmail} />
          </div>
          <div className="lp-field">
            <label htmlFor="s-days">Dies per pagar una personalització</label>
            <input className="lp-input" id="s-days" name="days" type="number" min={1} max={60} defaultValue={db.settings.paymentLinkDays} />
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
            <dd>Redsys · proves (simulat a la demo)</dd>
            <dt>Correus</dt>
            <dd>Safata de la demo (a la botiga real, Resend)</dd>
            <dt>Fotos</dt>
            <dd>Cloudflare R2 a la botiga real</dd>
          </dl>
        </section>
      </div>
    </>
  );
}

export { navigate };
