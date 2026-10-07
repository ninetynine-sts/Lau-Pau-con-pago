import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hearts, Price } from '@/components/brand';
import { AddToCart } from '@/components/add-to-cart';
import { RequestForm } from '@/components/request-form';
import { isLang, path, type Lang } from '@/lib/routes';
import { loc, t } from '@/lib/i18n';
import { getProduct, isPersonalizable } from '@/lib/shop';
import { getUser } from '@/lib/auth';

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: loc(p.name, L),
    description: loc(p.shortDescription, L),
    openGraph: { images: p.images[0] ? [p.images[0].src] : undefined }
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const p = await getProduct(slug);
  if (!p) notFound();
  const d = t(lang);
  const img = p.images[0];
  const personal = isPersonalizable(p);
  const user = personal ? await getUser() : null;

  return (
    <>
      <section className="lp-section lp-section--seamless">
        <div className="lp-container">
          <ol className="lp-breadcrumb">
            <li>
              <Link className="lp-link" href={path(lang)}>
                {d.product.home}
              </Link>
            </li>
            <li>
              <Link className="lp-link" href={path(lang, 'productos')}>
                {d.product.products}
              </Link>
            </li>
            <li aria-current="page">{loc(p.name, lang)}</li>
          </ol>

          <div className="lp-detail">
            <figure className="lp-detail__figure" data-figure>
              {img ? (
                <img src={img.src} alt={loc(img.alt, lang)} width={img.width} height={img.height} fetchPriority="high" decoding="async" />
              ) : null}
            </figure>

            <div className="lp-detail__info">
              {p.categoryName ? <p className="lp-eyebrow lp-eyebrow--accent">{loc(p.categoryName, lang)}</p> : null}
              <h1 style={{ fontSize: 'var(--h2)' }}>{loc(p.name, lang)}</h1>
              <div className="lp-stack" style={{ gap: 8 }}>
                <Price cents={p.priceCents} size="lg" lang={lang} />
                {personal ? <p className="lp-price-note">{d.product.personalNote}</p> : null}
              </div>
              <p className="lp-lead">{loc(p.description, lang)}</p>

              <dl className="lp-facts">
                {p.categoryName ? (
                  <div>
                    <dt>{d.product.category}</dt>
                    <dd>{loc(p.categoryName, lang)}</dd>
                  </div>
                ) : null}
                {p.details.map((x, i) => (
                  <div key={i}>
                    <dt>{loc(x.label, lang)}</dt>
                    <dd>{loc(x.value, lang)}</dd>
                  </div>
                ))}
                {p.ref ? (
                  <div>
                    <dt>{d.product.reference}</dt>
                    <dd>{p.ref}</dd>
                  </div>
                ) : null}
              </dl>

              {personal && p.personalization.mode !== 'none' ? (
                <>
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
                  <details className="lp-acc" open>
                    <summary>{d.product.howTitle}</summary>
                    <div className="lp-acc__body">
                      <ol className="lp-steps">
                        <li>{d.product.how1}</li>
                        <li>{d.product.how2}</li>
                        <li>{d.product.how3}</li>
                      </ol>
                    </div>
                  </details>
                </>
              ) : (
                <AddToCart
                  cartHref={path(lang, 'carrito')}
                  variants={p.variants.map((v) => ({ id: v.id, name: v.name ? loc(v.name, lang) : null, stock: v.stock }))}
                  labels={{
                    variant: d.product.variant,
                    chooseVariant: d.product.chooseVariant,
                    quantity: d.product.quantity,
                    less: d.product.less,
                    more: d.product.more,
                    addToCart: d.product.addToCart,
                    added: d.product.added,
                    viewCart: d.product.viewCart,
                    soldOut: d.product.soldOut,
                    inStock: d.product.inStock,
                    fewLeft: d.product.fewLeft(99).replace('99', '{n}'),
                    fewLeftOne: d.product.fewLeft(1),
                    maxStock: d.product.maxStock(99).replace('99', '{n}')
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {personal ? (
        <section className="lp-section lp-section--tight lp-section--seamless">
          <div className="lp-container">
            <div className="lp-surface lp-surface--rose lp-stack--lg lp-center lp-reveal">
              <Hearts set={[[28, 74], [42, 116], [24, 58]]} />
              <div className="lp-stack lp-center lp-measure--narrow">
                <h2>{d.home.perTitle}</h2>
                <p className="lp-lead">{d.personalize.note}</p>
                <Link className="lp-link" href={path(lang, 'personaliza')}>
                  {d.product.seeAllPersonal}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
