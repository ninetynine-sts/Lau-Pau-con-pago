/**
 * Vistas de la web pública (portada, catálogo, ficha, personalización, quiénes somos).
 * Solo presentación: reciben los datos ya cargados. Las usan las páginas reales y la demo.
 */
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Amp, BtnIcon, Hearts, Price } from '@/components/brand';
import { ProductCard } from '@/components/product-card';
import { CatalogFilters } from '@/components/catalog-filters';
import { AddToCart } from '@/components/add-to-cart';
import { RequestForm } from '@/components/request-form';
import { hasColors, isPersonalizable, type CatalogProduct, type Category } from '@/lib/catalog';
import { loc, t } from '@/lib/i18n';
import { path, type Lang } from '@/lib/routes';

type Defaults = { name: string; email: string; phone: string };
const i = (n: number) => ({ '--i': n }) as CSSProperties;

/* ------------------------------------------------------------ piezas --- */

function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="lp-arrowlink" href={href}>
      {children}
      <span className="lp-arrowlink__icon" aria-hidden="true">
        <ArrowRight size={15} weight="bold" />
      </span>
    </Link>
  );
}

/** Cinta con las frases de la marca separadas por la «&». El segundo grupo solo cierra el bucle. */
function Marquee({ items }: { items: string[] }) {
  const group = (hidden: boolean) => (
    <div className="lp-marquee__group" aria-hidden={hidden || undefined}>
      {items.map((x) => (
        <span key={x} className="lp-marquee__item">
          {x}
          <Amp solid />
        </span>
      ))}
    </div>
  );
  return (
    <div className="lp-marquee">
      <div className="lp-marquee__track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

function Figure({ p, lang, className, eager = false }: { p: CatalogProduct; lang: Lang; className: string; eager?: boolean }) {
  const img = p.images[0];
  return (
    <figure className={`${className} lp-bezel`} data-figure>
      <div className="lp-bezel__core">
        {img ? (
          <img
            src={img.src}
            alt={loc(img.alt, lang)}
            width={img.width}
            height={img.height}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            decoding="async"
          />
        ) : null}
      </div>
    </figure>
  );
}

function HowItWorks({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <ol className="lp-steps">
      <li>{d.product.how1}</li>
      <li>{d.product.how2}</li>
      <li>{d.product.how3}</li>
    </ol>
  );
}

function InstagramCta({ lang, instagram }: { lang: Lang; instagram: string }) {
  const d = t(lang);
  return (
    <section className="lp-section lp-section--tight">
      <div className="lp-container">
        <div className="lp-surface lp-surface--beige lp-social lp-reveal">
          <h2>{d.home.igTitle}</h2>
          <p className="lp-lead lp-measure--narrow">{d.home.igLead}</p>
          <a className="lp-btn lp-btn--icon" href={`https://www.instagram.com/${instagram}/`} rel="noopener" target="_blank">
            {d.home.igCta} @{instagram}
            <BtnIcon kind="up" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function requestLabels(lang: Lang, p: CatalogProduct) {
  const d = t(lang);
  const pz = p.personalization;
  return {
    title: d.request.title,
    quantity: d.product.quantity,
    less: d.product.less,
    more: d.product.more,
    fieldLabel: pz.mode !== 'none' ? loc(pz.label, lang) : '',
    fieldHelp: pz.mode !== 'none' ? loc(pz.help, lang) : '',
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
  };
}

function Request({ p, lang, defaults }: { p: CatalogProduct; lang: Lang; defaults: Defaults }) {
  const pz = p.personalization;
  if (pz.mode === 'none') return null;
  return (
    <RequestForm
      productId={p.id}
      mode={pz.mode}
      maxLength={pz.mode === 'idea' ? pz.maxLength : undefined}
      lang={lang}
      defaults={defaults}
      labels={requestLabels(lang, p)}
      colors={
        hasColors(p)
          ? {
              options: p.variants.map((v) => ({
                id: v.id,
                label: v.name ? loc(v.name, lang) : '',
                color: v.color,
                // En una pieza que se fabrica por encargo, el estoc no aplica.
                soldOut: false
              })),
              label: t(lang).product.color,
              soldOutLabel: t(lang).product.soldOut
            }
          : undefined
      }
    />
  );
}

/* ----------------------------------------------------------- portada --- */

export function HomeView({ lang, products, instagram }: { lang: Lang; products: CatalogProduct[]; instagram: string }) {
  const d = t(lang);
  const personal = products.filter(isPersonalizable);
  const hero = products.find((p) => p.featured) ?? products[0];
  // Selección editorial: la destacada primero y en grande.
  const selection = [...products].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 5);

  return (
    <>
      <section className="lp-hero">
        <span className="lp-hero__glow" aria-hidden="true" />
        <div className="lp-container lp-hero__grid">
          <div className="lp-hero__text">
            <p className="lp-eyebrow lp-in" style={i(0)}>
              {d.home.eyebrow}
            </p>
            <h1>
              <span className="lp-in" style={i(1)}>
                {d.home.h1a}
              </span>
              <em className="lp-in" style={i(2)}>
                {d.home.h1b}
              </em>
            </h1>
            <p className="lp-lead lp-in" style={{ ...i(3), maxWidth: '44ch' }}>
              {d.home.lead}
            </p>
            <div className="lp-actions lp-in" style={i(4)}>
              <Link className="lp-btn lp-btn--icon" href={path(lang, 'productos')}>
                {d.home.ctaProducts}
                <BtnIcon />
              </Link>
              <Link className="lp-btn lp-btn--ghost" href={path(lang, 'personaliza')}>
                {d.home.ctaPersonalize}
              </Link>
            </div>
            <div className="lp-chips lp-in" style={i(5)}>
              <span className="lp-chip">
                <b>{products.length}</b> {d.home.chipRefs}
              </span>
              <span className="lp-chip">
                <b>{personal.length}</b> {d.home.chipPersonal}
              </span>
              <span className="lp-chip">
                {d.home.chipFrom}
                <b>Andorra</b>
              </span>
            </div>
          </div>
          {hero ? (
            <div style={{ position: 'relative' }}>
              <Figure p={hero} lang={lang} className="lp-hero__figure lp-in" eager />
              <Link className="lp-hero__chip lp-in" style={i(6)} href={path(lang, 'productos', hero.slug)}>
                <span className="lp-hero__chip-text">
                  <span className="lp-hero__chip-name">{loc(hero.name, lang)}</span>
                  <span className="lp-hero__chip-meta">{d.heroChip}</span>
                </span>
                <BtnIcon kind="up" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <Marquee items={d.marquee} />

      <section className="lp-section" aria-labelledby="seleccion">
        <div className="lp-container">
          <div className="lp-head lp-reveal">
            <div>
              <p className="lp-eyebrow lp-eyebrow--accent">{d.home.selEyebrow}</p>
              <h2 id="seleccion">{d.home.selTitle}</h2>
              <p className="lp-lead">{d.home.selLead}</p>
            </div>
            <ArrowLink href={path(lang, 'productos')}>{d.home.seeAll}</ArrowLink>
          </div>
          <ul className="lp-grid lp-grid--editorial">
            {selection.map((p, n) => (
              <ProductCard key={p.id} p={p} lang={lang} priority={n === 0} index={n} />
            ))}
          </ul>
        </div>
      </section>

      {personal.length ? (
        <section className="lp-section" aria-labelledby="personalizacion">
          <div className="lp-container">
            <div className="lp-surface lp-surface--rose lp-reveal">
              <div className="lp-stack--lg lp-center">
                <Hearts set={[[28, 74], [42, 116], [24, 58]]} />
                <div className="lp-stack lp-center lp-measure--narrow">
                  <p className="lp-eyebrow lp-eyebrow--accent">{d.personalize.eyebrow}</p>
                  <h2 id="personalizacion">{d.home.perTitle}</h2>
                  <p className="lp-lead">
                    {d.home.perLeadA} <em>{d.home.perLeadB}</em>
                  </p>
                  <p>{d.home.perText}</p>
                  <Link className="lp-btn lp-btn--icon" href={path(lang, 'personaliza')}>
                    {d.home.ctaPersonalize}
                    <BtnIcon />
                  </Link>
                </div>
                <div style={{ width: '100%', maxWidth: 680 }}>
                  <ul className="lp-grid lp-grid--duo">
                    {personal.slice(0, 2).map((p, n) => (
                      <ProductCard key={p.id} p={p} lang={lang} index={n} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="lp-section" aria-labelledby="nosotras">
        <div className="lp-container lp-split lp-reveal">
          <div className="lp-stack" style={{ justifyItems: 'start' }}>
            <p className="lp-eyebrow lp-eyebrow--accent">{d.home.aboutEyebrow}</p>
            <h2 id="nosotras" className="lp-names lp-names--inline">
              <span>Laura</span>
              <Amp />
              <span>Paula</span>
            </h2>
          </div>
          <div className="lp-stack" style={{ justifyItems: 'start' }}>
            <p className="lp-lead">{d.home.aboutText}</p>
            <ArrowLink href={path(lang, 'quienes-somos')}>{d.home.aboutLink}</ArrowLink>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--seamless" aria-labelledby="filosofia" style={{ paddingBlock: 0 }}>
        <div className="lp-container">
          <div className="lp-band lp-reveal">
            <div className="lp-container lp-band__inner">
              <p className="lp-eyebrow">{d.home.bandEyebrow}</p>
              <h2 id="filosofia">{d.home.bandTitle}</h2>
              <p className="lp-lead">{d.home.bandLead}</p>
              <Hearts set={[[30, 84], [22, 60]]} />
            </div>
          </div>
        </div>
      </section>

      <InstagramCta lang={lang} instagram={instagram} />
    </>
  );
}

/* ---------------------------------------------------------- catálogo --- */

export function CatalogView({ lang, products, categories }: { lang: Lang; products: CatalogProduct[]; categories: Category[] }) {
  const d = t(lang);
  const used = new Set(products.map((p) => p.categoryId));
  const filters = [
    { id: 'all', label: d.catalog.all },
    ...categories.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, label: loc(c.name, lang) }))
  ];
  return (
    <>
      <section className="lp-section lp-section--seamless">
        <div className="lp-container">
          <div className="lp-stack lp-measure">
            <p className="lp-eyebrow lp-eyebrow--accent lp-in" style={i(0)}>
              {d.catalog.eyebrow}
            </p>
            <h1 className="lp-in" style={i(1)}>
              {d.catalog.title}
            </h1>
            <p className="lp-lead lp-in" style={i(2)}>
              {d.catalog.lead}
            </p>
          </div>
          <CatalogFilters
            filters={filters}
            label={d.catalog.filterLabel}
            countLabels={{ one: d.catalog.count(1), other: d.catalog.count(99).replace('99', '{n}') }}
          />
          <ul className="lp-grid" data-grid>
            {products.map((p, n) => (
              <ProductCard key={p.id} p={p} lang={lang} priority={n < 3} index={n % 3} />
            ))}
          </ul>
          <p data-empty hidden>
            {d.catalog.empty}
          </p>
          <p className="lp-note" style={{ marginTop: 'clamp(28px,4vw,44px)', maxWidth: '62ch' }}>
            {d.catalog.note}
          </p>
        </div>
      </section>
      <section className="lp-section lp-section--tight">
        <div className="lp-container">
          <Hearts set={[[26, 70], [34, 96]]} />
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------- ficha --- */

export function ProductView({ lang, p, defaults }: { lang: Lang; p: CatalogProduct; defaults: Defaults }) {
  const d = t(lang);
  const personal = isPersonalizable(p);
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
            <Figure p={p} lang={lang} className="lp-detail__figure lp-in" eager />

            <div className="lp-detail__info">
              {p.categoryName ? (
                <p className="lp-eyebrow lp-eyebrow--accent lp-in" style={i(0)}>
                  {loc(p.categoryName, lang)}
                </p>
              ) : null}
              <h1 className="lp-in" style={{ ...i(1), fontSize: 'var(--h2)' }}>
                {loc(p.name, lang)}
              </h1>
              <div className="lp-stack lp-in" style={{ ...i(2), gap: 8 }}>
                <Price cents={p.priceCents} size="lg" lang={lang} />
                {personal ? <p className="lp-price-note">{d.product.personalNote}</p> : null}
              </div>
              <p className="lp-lead lp-in" style={i(3)}>
                {loc(p.description, lang)}
              </p>

              <dl className="lp-facts lp-in" style={i(4)}>
                {p.categoryName ? (
                  <div>
                    <dt>{d.product.category}</dt>
                    <dd>{loc(p.categoryName, lang)}</dd>
                  </div>
                ) : null}
                {p.details.map((x, n) => (
                  <div key={n}>
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

              <div className="lp-in" style={i(5)}>
                {personal && p.personalization.mode !== 'none' ? (
                  <div className="lp-stack--lg">
                    <Request p={p} lang={lang} defaults={defaults} />
                    <details className="lp-acc" open>
                      <summary>{d.product.howTitle}</summary>
                      <div className="lp-acc__body">
                        <HowItWorks lang={lang} />
                      </div>
                    </details>
                  </div>
                ) : (
                  <AddToCart
                    variants={p.variants.map((v) => ({ id: v.id, name: v.name ? loc(v.name, lang) : null, color: v.color, stock: v.stock }))}
                    labels={{
                      variant: d.product.variant,
                      color: d.product.color,
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
                <ArrowLink href={path(lang, 'personaliza')}>{d.product.seeAllPersonal}</ArrowLink>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

/* --------------------------------------------------- personalización --- */

export function PersonalizeView({ lang, products, defaults }: { lang: Lang; products: CatalogProduct[]; defaults: Defaults }) {
  const d = t(lang);
  const personal = products.filter((p) => isPersonalizable(p) && p.personalization.mode !== 'none');
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container">
        <div className="lp-stack--lg lp-center" style={{ marginBottom: 'clamp(34px,4.6vw,60px)' }}>
          <Hearts set={[[28, 74], [42, 116], [24, 58]]} />
          <div className="lp-stack lp-center lp-measure--narrow">
            <p className="lp-eyebrow lp-eyebrow--accent lp-in" style={i(0)}>
              {d.personalize.eyebrow}
            </p>
            <h1 className="lp-in" style={i(1)}>
              {d.home.perTitle}
            </h1>
            <p className="lp-lead lp-in" style={i(2)}>
              {d.home.perLeadA} <em>{d.home.perLeadB}</em>
            </p>
            <p className="lp-in" style={i(3)}>
              {d.home.perText}
            </p>
          </div>
        </div>

        <div className="lp-stack--lg">
          {personal.map((p) => (
            <article key={p.id} className="lp-detail--card lp-reveal">
              <div className="lp-detail__inner">
                <Figure p={p} lang={lang} className="lp-detail__figure" />
                <div className="lp-detail__info">
                  <p className="lp-eyebrow lp-eyebrow--accent">{d.personalize.eyebrow}</p>
                  <h2>{loc(p.name, lang)}</h2>
                  <div className="lp-stack" style={{ gap: 8 }}>
                    <Price cents={p.priceCents} size="lg" lang={lang} />
                    <p className="lp-price-note">{d.product.personalNote}</p>
                  </div>
                  <p className="lp-lead">{loc(p.description, lang)}</p>
                  <Request p={p} lang={lang} defaults={defaults} />
                  <ArrowLink href={path(lang, 'productos', p.slug)}>{d.personalize.fullSheet}</ArrowLink>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="lp-stack lp-reveal" style={{ marginTop: 'clamp(36px,4.4vw,60px)', maxWidth: '62ch' }}>
          <h2 style={{ fontSize: 'var(--h3)' }}>{d.product.howTitle}</h2>
          <HowItWorks lang={lang} />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- quiénes somos --- */

export function AboutView({ lang, instagram }: { lang: Lang; instagram: string }) {
  const d = t(lang);
  return (
    <>
      <section className="lp-section lp-section--seamless">
        <div className="lp-container">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <p className="lp-eyebrow lp-eyebrow--accent lp-in" style={i(0)}>
              {d.about.eyebrow}
            </p>
          </div>
          <h1 className="lp-names lp-in" style={{ ...i(1), marginBlock: 'clamp(18px,2.6vw,34px)' }}>
            <span>Laura</span>
            <Amp />
            <span>Paula</span>
          </h1>
          <div className="lp-prose lp-in" style={{ ...i(2), marginInline: 'auto' }}>
            {d.about.p.map((x, n) => (
              <p key={n}>{x}</p>
            ))}
          </div>
          <p className="lp-signoff lp-measure--narrow lp-reveal">{d.about.signoff}</p>
        </div>
      </section>

      <section className="lp-section" aria-labelledby="filosofia">
        <div className="lp-container">
          <div className="lp-surface lp-surface--mist lp-stack--lg lp-reveal">
            <h2 id="filosofia" className="lp-measure">
              {d.about.philTitle}
            </h2>
            <div className="lp-prose">
              {d.about.phil.map((x, n) => (
                <p key={n}>{x}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--tight">
        <div className="lp-container lp-stack--lg">
          <ul className="lp-values">
            {d.about.values.map(([h, p], n) => (
              <li key={h} className="lp-reveal" style={i(n)}>
                <h3>{h}</h3>
                <p>{p}</p>
              </li>
            ))}
          </ul>
          <Hearts set={[[26, 70], [34, 96]]} />
        </div>
      </section>

      <InstagramCta lang={lang} instagram={instagram} />
    </>
  );
}
