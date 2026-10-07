'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Amp, Sheen } from './brand';
import { submitRequest, type RequestState } from '@/app/actions/shop';

export type RequestLabels = {
  title: string;
  quantity: string;
  less: string;
  more: string;
  fieldLabel: string;
  fieldHelp: string;
  notes: string;
  name: string;
  email: string;
  phone: string;
  privacy: string;
  submit: string;
  doneTitle: string;
  doneText: string;
  another: string;
  note: string;
};

export function RequestForm({
  productId,
  mode,
  maxLength = 300,
  lang,
  labels,
  defaults
}: {
  productId: number;
  mode: 'letter' | 'idea';
  maxLength?: number;
  lang: 'es' | 'ca';
  labels: RequestLabels;
  defaults: { name: string; email: string; phone: string };
}) {
  const [state, action, pending] = useActionState<RequestState, FormData>(submitRequest, { ok: false, errors: {} });
  const [qty, setQty] = useState(1);
  const [idea, setIdea] = useState('');
  const [notes, setNotes] = useState('');
  const [dismissed, setDismissed] = useState<RequestState | null>(null);
  const done = state.ok && dismissed !== state;
  const doneRef = useRef<HTMLDivElement>(null);
  const e = state.errors;

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  if (done) {
    return (
      <div className="lp-summary" ref={doneRef} tabIndex={-1} role="status">
        <h3 style={{ fontSize: 'var(--h3)' }}>{labels.doneTitle}</h3>
        <p className="lp-field__help" style={{ fontSize: 14 }}>
          {labels.doneText}
        </p>
        <div>
          <button className="lp-btn lp-btn--ghost lp-btn--sm" type="button" onClick={() => {
              setDismissed(state);
              setIdea('');
              setNotes('');
              setQty(1);
            }}>
            <Sheen />
            {labels.another}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="lp-form" action={action} noValidate>
      <h2 className="lp-visually-hidden">{labels.title}</h2>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="lang" value={lang} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>
          Web <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="lp-field">
        <label htmlFor="r-qty">{labels.quantity}</label>
        <div className="lp-stepper">
          <button type="button" aria-label={labels.less} disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
            &minus;
          </button>
          <input
            id="r-qty"
            name="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            value={qty}
            onChange={(ev) => setQty(Math.max(1, Math.min(50, Math.floor(Number(ev.target.value) || 1))))}
          />
          <button type="button" aria-label={labels.more} onClick={() => setQty((q) => Math.min(50, q + 1))}>
            +
          </button>
        </div>
      </div>

      {mode === 'letter' ? (
        <div className="lp-field">
          <label htmlFor="r-letter">{labels.fieldLabel}</label>
          <input
            className="lp-input lp-input--letter"
            id="r-letter"
            name="letter"
            type="text"
            autoComplete="off"
            maxLength={2}
            required
            placeholder="A"
            aria-invalid={e.letter ? 'true' : undefined}
            aria-describedby="r-letter-help r-letter-err"
          />
          <span className="lp-field__help" id="r-letter-help">
            {labels.fieldHelp}
          </span>
          <span className="lp-error" id="r-letter-err" role="alert">
            {e.letter ?? ''}
          </span>
        </div>
      ) : (
        <div className="lp-field">
          <label htmlFor="r-idea">{labels.fieldLabel}</label>
          <textarea
            className="lp-textarea"
            id="r-idea"
            name="idea"
            maxLength={maxLength}
            required
            value={idea}
            onChange={(ev) => setIdea(ev.target.value)}
            aria-invalid={e.idea ? 'true' : undefined}
            aria-describedby="r-idea-help r-idea-count r-idea-err"
          />
          <span className="lp-field__help" id="r-idea-help">
            {labels.fieldHelp}
          </span>
          <span className="lp-counter" id="r-idea-count" data-full={idea.length >= maxLength}>
            {idea.length} / {maxLength}
          </span>
          <span className="lp-error" id="r-idea-err" role="alert">
            {e.idea ?? ''}
          </span>
        </div>
      )}

      <div className="lp-field">
        <label htmlFor="r-notes">{labels.notes}</label>
        <textarea
          className="lp-textarea"
          id="r-notes"
          name="notes"
          maxLength={500}
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          aria-invalid={e.notes ? 'true' : undefined}
          aria-describedby="r-notes-count"
        />
        <span className="lp-counter" id="r-notes-count" data-full={notes.length >= 500}>
          {notes.length} / 500
        </span>
        <span className="lp-error" role="alert">
          {e.notes ?? ''}
        </span>
      </div>

      <div className="lp-row lp-row--2">
        <div className="lp-field">
          <label htmlFor="r-name">{labels.name}</label>
          <input className="lp-input" id="r-name" name="name" autoComplete="name" defaultValue={defaults.name} required aria-invalid={e.name ? 'true' : undefined} />
          <span className="lp-error" role="alert">
            {e.name ?? ''}
          </span>
        </div>
        <div className="lp-field">
          <label htmlFor="r-email">{labels.email}</label>
          <input
            className="lp-input"
            id="r-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaults.email}
            required
            aria-invalid={e.email ? 'true' : undefined}
          />
          <span className="lp-error" role="alert">
            {e.email ?? ''}
          </span>
        </div>
      </div>
      <div className="lp-field">
        <label htmlFor="r-phone">{labels.phone}</label>
        <input className="lp-input" id="r-phone" name="phone" type="tel" autoComplete="tel" defaultValue={defaults.phone} />
      </div>

      <p className="lp-note">{labels.note}</p>
      {state.message ? <p className="lp-alert lp-alert--error">{state.message}</p> : null}

      <div className="lp-actions">
        <button className="lp-btn" type="submit" disabled={pending} data-busy={pending} aria-busy={pending}>
          <Sheen />
          {pending ? <Amp className="lp-btn__amp" /> : null}
          {labels.submit}
        </button>
      </div>
      <p className="lp-field__help">{labels.privacy}</p>
    </form>
  );
}
