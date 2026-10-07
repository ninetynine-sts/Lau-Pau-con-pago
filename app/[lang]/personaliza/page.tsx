import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hearts, Price } from '@/components/brand';
import { RequestForm } from '@/components/request-form';
import { isLang, path, type Lang } from '@/lib/routes';
import { loc, t } from '@/lib/i18n';
import { isPersonalizable, listProducts } from '@/lib/shop';
import { getUser } from '@/lib/auth';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  return { title: t(L).nav.personalize, description: t(L).home.perText };
}

export default async function Personalize({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const [products, user] = await Promise.all([listProducts(), getUser()]);
  const personal = products.filter(isPersonalizable);

  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container">
        <div className="lp-stack--lg lp-center" style={{ marginBottom: 'clamp(34px,4.6vw,60px)' }}>
          <Hearts set={[[28, 74], [42, 116], [24, 58]]} />
          <div className="lp-stack lp-center lp-measure--narrow">
            <p className="lp-eyebrow lp-eyebrow--accent">{d.personalize.eyebrow}</p>
            <h1>{d.home.perTitle}</h1>
            <p className="lp-lead">
              {d.home.perLeadA} <em>{d.home.perLeadB}</em>
            </p>
            <p>{d.home.perText}</p>
          </div>
        </div>

        {personal.map((p) =>
          p.personalization.mode === 'none' ? null : (
            <div key={p.id} className="lp-detail lp-reveal" style={{ marginTop: 'clamp(26px,3.4vw,42px)' }}>
              <figure className="lp-detail__figure" data-figure>
                {p.images[0] ? (
                  <img
                    src={p.images[0].src}
                    alt={loc(p.images[0].alt, lang)}
                    width={p.images[0].width}
                    height={p.images[0].height}
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </figure>
              <div className="lp-detail__info">
                <p className="lp-eyebrow lp-eyebrow--accent">{d.personalize.eyebrow}</p>
                <h2>{loc(p.name, lang)}</h2>
                <div className="lp-stack" style={{ gap: 8 }}>
                  <Price cents={p.priceCents} size="lg" lang={lang} />
                  <p className="lp-price-note">{d.product.personalNote}</p>
                </div>
                <p className="lp-lead">{loc(p.description, lang)}</p>
                <RequestForm
                  productId={p.id}
                  mode={p.personalization.mode}
                  maxLength={p.personalization.mode === 'idea' ? p.personalization.maxLength : undefined}
                  lang={lang}
                  defaults={{ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' }}
                  labels={{
                    title: d.request.title,
                    quantity: d.product.quantity,
                    less: d.product.less,
                    more: d.product.more,
                    fieldLabel: loc(p.personalization.label, lang),
                    fieldHelp: loc(p.personalization.help, lang),
                    notes: d.request.notes,
                    name: d.request.name,
                    email: d.request.email,
                    phone: d.request.phone,
                    privacy: d.request.privacy,
                    submit: d.request.submit,
                    doneTitle: d.request.doneTitle,
                    doneText: d.request.doneText,
                    another: d.request.another,
                    note: d.request.note
                  }}
                />
                <p>
                  <Link className="lp-link" href={path(lang, 'productos', p.slug)}>
                    {d.personalize.fullSheet}
                  </Link>
                </p>
              </div>
            </div>
          )
        )}

        <div className="lp-stack" style={{ marginTop: 'clamp(28px,3.4vw,44px)', maxWidth: '62ch' }}>
          <h2 style={{ fontSize: 'var(--h3)' }}>{d.product.howTitle}</h2>
          <ol className="lp-steps">
            <li>{d.product.how1}</li>
            <li>{d.product.how2}</li>
            <li>{d.product.how3}</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
