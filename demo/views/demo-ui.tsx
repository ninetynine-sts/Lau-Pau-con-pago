/** Barra de la demo (cambiar entre tienda, panel y correos) y bandeja de correos simulada. */
import { useState } from 'react';
import Link from 'next/link';
import { db as live, resetDemo, save, useDB } from '../mock/store';
import { navigate, useHashPath } from '../shims/router';

export function DemoBar() {
  const db = useDB();
  const p = useHashPath();
  const [confirm, setConfirm] = useState(false);
  const unread = db.emails.filter((e) => !e.read).length;
  const where = p.startsWith('/admin') ? 'admin' : p.startsWith('/correus') ? 'mail' : p.startsWith('/pasarela') ? 'redsys' : 'shop';
  const lang = p.startsWith('/es') ? 'es' : 'ca';
  return (
    <div className="dm-bar" role="navigation" aria-label="Demo">
      <span className="dm-tag">Demo de prova</span>
      <div className="dm-links">
        <Link href={`/${lang}`} aria-current={where === 'shop' ? 'page' : undefined}>
          Botiga
        </Link>
        <Link href="/admin" aria-current={where === 'admin' ? 'page' : undefined}>
          Tauler
        </Link>
        <Link href="/correus" aria-current={where === 'mail' ? 'page' : undefined}>
          Correus{unread ? <span className="dm-count">{unread}</span> : null}
        </Link>
      </div>
      <span className="dm-hint">Els pagaments, correus i dades són simulats i es guarden només en aquest navegador.</span>
      {confirm ? (
        <span className="dm-confirm">
          Esborrar-ho tot?
          <button
            type="button"
            onClick={() => {
              resetDemo();
              setConfirm(false);
              navigate('/ca');
              window.location.reload();
            }}
          >
            Sí, reinicia
          </button>
          <button type="button" onClick={() => setConfirm(false)}>
            No
          </button>
        </span>
      ) : (
        <button className="dm-reset" type="button" onClick={() => setConfirm(true)}>
          Reinicia la demo
        </button>
      )}
    </div>
  );
}

export function Inbox() {
  const db = useDB();
  const [openId, setOpenId] = useState<number | null>(db.emails[0]?.id ?? null);
  const open = db.emails.find((e) => e.id === openId) ?? null;
  const fmt = (iso: string) => new Intl.DateTimeFormat('ca-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  return (
    <div className="dm-inbox">
      <div className="dm-inbox__head">
        <h1>Correus enviats</h1>
        <p>Tot el que la botiga enviaria per correu, a la clienta i a Lau&amp;Pau. Els botons dels correus funcionen: et porten a la pàgina de la demo.</p>
      </div>
      {db.emails.length ? (
        <div className="dm-inbox__grid">
          <ul className="dm-mails">
            {db.emails.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  aria-current={e.id === openId ? 'true' : undefined}
                  data-unread={!e.read}
                  onClick={() => {
                    setOpenId(e.id);
                    live.emails.find((x) => x.id === e.id)!.read = true;
                    save();
                  }}
                >
                  <span className="dm-mails__to">{e.to}</span>
                  <span className="dm-mails__subj">{e.subject.replace(/^Lau&Pau · /, '')}</span>
                  <span className="dm-mails__at">{fmt(e.at)}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="dm-mail">
            {open ? (
              <>
                <dl className="dm-mail__meta">
                  <dt>Per a</dt>
                  <dd>{open.to}</dd>
                  <dt>Assumpte</dt>
                  <dd>{open.subject}</dd>
                </dl>
                <div className="dm-mail__body" dangerouslySetInnerHTML={{ __html: open.html }} />
              </>
            ) : (
              <p>Tria un correu.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="dm-empty">
          Encara no s’ha enviat cap correu. Fes una compra o una sol·licitud a la <a href="/ca">botiga</a>.
        </p>
      )}
    </div>
  );
}
