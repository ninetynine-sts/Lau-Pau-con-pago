'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Amp, Sheen } from './brand';
import { retryPayment } from '@/app/actions/shop';

/** Mientras Redsys confirma, la página se refresca sola durante un minuto. */
export function AutoRefresh({ seconds = 3, maxTries = 20 }: { seconds?: number; maxTries?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      if (n > maxTries) window.clearInterval(id);
      else router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds, maxTries]);
  return null;
}

export function RetryPaymentButton({ publicId, label }: { publicId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <div className="lp-stack" style={{ justifyItems: 'center' }}>
      <button
        className="lp-btn"
        type="button"
        disabled={busy}
        data-busy={busy}
        onClick={async () => {
          setBusy(true);
          setMsg('');
          const res = await retryPayment(publicId);
          if (!res.ok) {
            setMsg(res.message ?? '');
            setBusy(false);
            return;
          }
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = res.redsys.url;
          for (const [k, v] of Object.entries(res.redsys.fields)) {
            const i = document.createElement('input');
            i.type = 'hidden';
            i.name = k;
            i.value = v;
            form.appendChild(i);
          }
          document.body.appendChild(form);
          form.submit();
        }}
      >
        <Sheen />
        {busy ? <Amp className="lp-btn__amp" /> : null}
        {label}
      </button>
      {msg ? <p className="lp-alert lp-alert--error">{msg}</p> : null}
    </div>
  );
}
