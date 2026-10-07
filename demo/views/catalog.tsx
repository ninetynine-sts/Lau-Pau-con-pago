/** Portada, catálogo, ficha, personalización, quiénes somos y legales: copia de las páginas reales. */
import Link from 'next/link';
import { Amp, Hearts, Price, Sheen } from '@/components/brand';
import { AddToCart } from '@/components/add-to-cart';
import { RequestForm } from '@/components/request-form';
import { CatalogFilters } from '@/components/catalog-filters';
import { path, type Lang } from '@/lib/routes';
import { loc, t } from '@/lib/i18n';
import { LEGAL_PAGES, legalDoc, type LegalPage } from '@/lib/legal';
import { useDB } from '../mock/store';
import { getProduct, isPersonalizable, listProducts, totalStock, type CatalogProduct } from '../mock/shop';

export function ProductCard({ p, lang, priority = false }: { p: CatalogProduct; lang: Lang; priority?: boolean }) {
  const d = t(lang);
  const img = p.images[0];
  const personal = isPersonalizable(p);
  const stock = totalStock(p);
  const soldOut = !personal && (p.variants.length === 0 || stock === 0);
  return (
    <li className={`lp-card lp-reveal${soldOut ? ' lp-card__soldout' : ''}`} data-category={p.categoryId ?? ''}>
      <span className="lp-card__media" data-figure>
        {img ? <img src={img.src} alt={loc(img.alt, lang)} width={img.width} height={img.height} loading={priority ? 'eager' : 'lazy'} decoding="async" /> : null}
        <span className="lp-price-glass">
          <Price cents={p.priceCents} size="sm" lang={lang} />
        </span>
      </span>
      <span className="lp-card__body">
        {p.categoryName ? <span className="lp-card__cat">{loc(p.categoryName, lang)}</span> : null}
        <h3 className="lp-card__name">
          <Link href={path(lang, 'productos', p.slug)}>{loc(p.name, lang)}</Link>
        </h3>
        <span className="lp-card__desc">{loc(p.shortDescription, lang)}</span>
        <span className="lp-card__foot">
          {soldOut ? <span className="lp-badge lp-badge--muted">{d.catalog.soldOut}</span> : p.badge ? <span className="lp-badge">{loc(p.badge, lang)}</span> : <span />}
          <span className="lp-card__go">
            {personal ? d.catalog.request : d.catalog.buy} <span aria-hidden="true">&rarr;</span>
          </span>
        </span>
      </span>
    </li>
  );
}

export function Home({ lang }: { lang: Lang }) {
  const db = useDB();
  const d = t(lang);
  const products = listProducts();
  const personal = products.filter(isPersonalizable);
  const hero = products.find((p) => p.featured) ?? products[0];
  const heroImg = hero?.images[0];
  const selection = [...products].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6);
  return (
    <>
      <section className="lp-hero">
        <span className="lp-hero__glow" aria-hidden="true" />
        <div className="lp-container lp-hero__grid">
          <div className="lp-hero__text">
            <p className="lp-eyebrow">{d.home.eyebrow}</p>
            <h1>
              {d.home.h1a}
              {'\n'}
              <em>{d.home.h1b}</em>
            </h1>
            <p className="lp-lead" style={{ maxWidth: '44ch' }}>
              {d.home.lead}
            </p>
            <div className="lp-actions">
              <Link className="lp-btn" href={path(lang, 'productos')}>
                <Sheen />
                {d.home.ctaProducts}
              </Link>
              <Link className="lp-btn lp-btn--ghost" href={path(lang, 'personaliza')}>
                <Sheen />
                {d.home.ctaPersonalize}
              </Link>
            </div>
            <div className="lp-chips">
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
          {heroImg ? (
            <figure className="lp-hero__figure" data-figure>
              <img src={heroImg.src} alt={loc(heroImg.alt, lang)} width={heroImg.width} height={heroImg.height} decoding="async" />
            </figure>
          ) : null}
        </div>
      </section>

      <section className="lp-section lp-section--seamless" aria-labelledby="seleccion">
        <div className="lp-container">
          <div className="lp-stack lp-measure lp-reveal" style={{ marginBottom: 'clamp(30px,4vw,48px)' }}>
            <p className="lp-eyebrow lp-eyebrow--accent">{d.home.selEyebrow}</p>
            <h2 id="seleccion">{d.home.selTitle}</h2>
            <p className="lp-lead">{d.home.selLead}</p>
          </div>
          <ul className="lp-grid lp-grid--editorial">
            {selection.map((p, i) => (
              <ProductCard key={p.id} p={p} lang={lang} priority={i === 0} />
            ))}
          </ul>
          <p style={{ marginTop: 'clamp(28px,3.4vw,44px)' }}>
            <Link className="lp-link" href={path(lang, 'productos')}>
              {d.home.seeAll}
            </Link>
          </p>
        </div>
      </section>

      {personal.length ? (
        <section className="lp-section" aria-labelledby="personalizacion">
          <div className="lp-container">
            <div className="lp-surface lp-surface--rose lp-reveal">
              <div className="lp-stack--lg lp-center">
                <Hearts set={[[28, 74], [42, 116], [24, 58]]} />
                <div className="lp-stack lp-center lp-measure--narrow">
                  <h2 id="personalizacion">{d.home.perTitle}</h2>
                  <p className="lp-lead">
                    {d.home.perLeadA} <em>{d.home.perLeadB}</em>
                  </p>
                  <p>{d.home.perText}</p>
                  <Link className="lp-btn" href={path(lang, 'personaliza')}>
                    <Sheen />
                    {d.home.ctaPersonalize}
                  </Link>
                </div>
                <div style={{ width: '100%', maxWidth: 640 }}>
                  <ul className="lp-grid lp-grid--duo">
                    {personal.slice(0, 2).map((p) => (
                      <ProductCard key={p.id} p={p} lang={lang} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="lp-section" aria-labelledby="nosotras">
        <div className="lp-container lp-reveal" style={{ display: 'grid', gap: 'clamp(26px,4vw,64px)', alignItems: 'center', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))' }}>
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
            <Link className="lp-link" href={path(lang, 'quienes-somos')}>
              {d.home.aboutLink}
            </Link>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--seamless" aria-labelledby="filosofia" style={{ paddingBlock: 0 }}>
        <div className="lp-container">
          <div className="lp-band">
            <div className="lp-container lp-band__inner">
              <p className="lp-eyebrow">{d.home.bandEyebrow}</p>
              <h2 id="filosofia">{d.home.bandTitle}</h2>
              <p className="lp-lead">{d.home.bandLead}</p>
              <Hearts set={[[30, 84], [22, 60]]} />
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--tight" aria-labelledby="instagram">
        <div className="lp-container">
          <div className="lp-surface lp-surface--beige lp-social lp-reveal">
            <h2 id="instagram">{d.home.igTitle}</h2>
            <p className="lp-lead lp-measure--narrow">{d.home.igLead}</p>
            <a className="lp-btn" href={`https://www.instagram.com/${db.settings.instagram}/`} target="_blank" rel="noopener">
              <Sheen />
              {d.home.igCta} @{db.settings.instagram}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function Catalog({ lang }: { lang: Lang }) {
  const db = useDB();
  const d = t(lang);
  const products = listProducts();
  const used = new Set(products.map((p) => p.categoryId));
  const filters = [{ id: 'all', label: d.catalog.all }, ...db.categories.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, label: loc(c.name, lang) }))];
  return (
    <>
      <section className="lp-section lp-section--seamless">
        <div className="lp-container">
          <div className="lp-stack lp-measure">
            <p className="lp-eyebrow lp-eyebrow--accent">{d.catalog.eyebrow}</p>
            <h1>{d.catalog.title}</h1>
            <p className="lp-lead">{d.catalog.lead}</p>
          </div>
          <CatalogFilters filters={filters} label={d.catalog.filterLabel} countLabels={{ one: d.catalog.count(1), other: d.catalog.count(99).replace('99', '{n}') }} />
          <ul className="lp-grid" data-grid>
            {products.map((p, i) => (
              <ProductCard key={p.id} p={p} lang={lang} priority={i < 3} />
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

function requestLabels(lang: Lang, p: CatalogProduct) {
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

function currentCustomer() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const db = useDB();
  return db.users.find((u) => u.id === db.session.customerId) ?? null;
}

export function ProductPage({ lang, slug }: { lang: Lang; slug: string }) {
  useDB();
  const user = currentCustomer();
  const p = getProduct(slug);
  const d = t(lang);
  if (!p) return <NotFound lang={lang} />;
  const img = p.images[0];
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
            <figure className="lp-detail__figure" data-figure>
              {img ? <img src={img.src} alt={loc(img.alt, lang)} width={img.width} height={img.height} decoding="async" /> : null}
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
                    key={p.id}
                    productId={p.id}
                    mode={p.personalization.mode}
                    maxLength={p.personalization.mode === 'idea' ? p.personalization.maxLength : undefined}
                    lang={lang}
                    defaults={{ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' }}
                    labels={requestLabels(lang, p)}
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
                  key={p.id}
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

export function Personalize({ lang }: { lang: Lang }) {
  useDB();
  const user = currentCustomer();
  const d = t(lang);
  const personal = listProducts().filter(isPersonalizable);
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
                {p.images[0] ? <img src={p.images[0].src} alt={loc(p.images[0].alt, lang)} width={p.images[0].width} height={p.images[0].height} loading="lazy" /> : null}
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
                  labels={requestLabels(lang, p)}
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
      </div>
    </section>
  );
}

export function About({ lang }: { lang: Lang }) {
  const db = useDB();
  const d = t(lang);
  return (
    <>
      <section className="lp-section lp-section--seamless">
        <div className="lp-container">
          <p className="lp-eyebrow lp-eyebrow--accent" style={{ textAlign: 'center' }}>
            {d.about.eyebrow}
          </p>
          <h1 className="lp-names lp-reveal" style={{ marginBlock: 'clamp(18px,2.6vw,34px)' }}>
            <span>Laura</span>
            <Amp />
            <span>Paula</span>
          </h1>
          <div className="lp-prose lp-reveal" style={{ marginInline: 'auto' }}>
            {d.about.p.map((x, i) => (
              <p key={i}>{x}</p>
            ))}
          </div>
          <p className="lp-measure--narrow lp-reveal" style={{ margin: 'clamp(30px,4vw,50px) auto 0', textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'var(--h3)', lineHeight: 1.32, color: 'var(--label-2)' }}>
            {d.about.signoff}
          </p>
        </div>
      </section>
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-surface lp-surface--mist lp-stack--lg lp-reveal">
            <h2 className="lp-measure">{d.about.philTitle}</h2>
            <div className="lp-prose">
              {d.about.phil.map((x, i) => (
                <p key={i}>{x}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="lp-section lp-section--tight">
        <div className="lp-container lp-stack--lg">
          <ul className="lp-values">
            {d.about.values.map(([h, p]) => (
              <li key={h} className="lp-reveal">
                <h3>{h}</h3>
                <p>{p}</p>
              </li>
            ))}
          </ul>
          <Hearts set={[[26, 70], [34, 96]]} />
        </div>
      </section>
      <section className="lp-section lp-section--tight">
        <div className="lp-container">
          <div className="lp-surface lp-surface--beige lp-social lp-reveal">
            <h2>{d.home.igTitle}</h2>
            <p className="lp-lead lp-measure--narrow">{d.home.igLead}</p>
            <a className="lp-btn" href={`https://www.instagram.com/${db.settings.instagram}/`} target="_blank" rel="noopener">
              <Sheen />
              {d.home.igCta} @{db.settings.instagram}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function Legal({ lang, page }: { lang: Lang; page: string }) {
  const db = useDB();
  if (!LEGAL_PAGES.includes(page as LegalPage)) return <NotFound lang={lang} />;
  const doc = legalDoc(page as LegalPage, lang, db.settings.storeEmail);
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg">
        <h1 style={{ fontSize: 'var(--h2)' }}>{doc.title}</h1>
        <div className="lp-legal" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </section>
  );
}

export function NotFound({ lang }: { lang: Lang }) {
  const d = t(lang).notFound;
  return (
    <section className="lp-section lp-section--seamless">
      <div className="lp-container lp-stack--lg lp-center">
        <h1>{d.title}</h1>
        <p className="lp-lead lp-measure--narrow">{d.text}</p>
        <div className="lp-actions">
          <Link className="lp-btn" href={path(lang)}>
            <Sheen />
            {d.home}
          </Link>
          <Link className="lp-btn lp-btn--ghost" href={path(lang, 'productos')}>
            <Sheen />
            {d.products}
          </Link>
        </div>
      </div>
    </section>
  );
}
