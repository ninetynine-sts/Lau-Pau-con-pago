import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Amp, Hearts, Sheen } from '@/components/brand';
import { ProductCard } from '@/components/product-card';
import { isLang, path } from '@/lib/routes';
import { loc, t } from '@/lib/i18n';
import { isPersonalizable, listProducts } from '@/lib/shop';
import { getSettings } from '@/lib/settings';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const [products, settings] = await Promise.all([listProducts(), getSettings()]);
  const personal = products.filter(isPersonalizable);
  const hero = products.find((p) => p.featured) ?? products[0];
  const heroImg = hero?.images[0];
  // Selección editorial: la destacada primero y en grande.
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
              <img
                src={heroImg.src}
                alt={loc(heroImg.alt, lang)}
                width={heroImg.width}
                height={heroImg.height}
                fetchPriority="high"
                decoding="async"
              />
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
        <div
          className="lp-container lp-reveal"
          style={{
            display: 'grid',
            gap: 'clamp(26px,4vw,64px)',
            alignItems: 'center',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))'
          }}
        >
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
            <a className="lp-btn" href={`https://www.instagram.com/${settings.instagram}/`} rel="noopener">
              <Sheen />
              {d.home.igCta} @{settings.instagram}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
