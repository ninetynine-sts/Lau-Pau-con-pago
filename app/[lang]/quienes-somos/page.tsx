import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Amp, Hearts, Sheen } from '@/components/brand';
import { isLang, type Lang } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { getSettings } from '@/lib/settings';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const L: Lang = isLang(lang) ? lang : 'es';
  return { title: t(L).nav.about, description: t(L).about.p[0] };
}

export default async function About({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const settings = await getSettings();
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
          <p
            className="lp-measure--narrow lp-reveal"
            style={{
              margin: 'clamp(30px,4vw,50px) auto 0',
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'var(--h3)',
              lineHeight: 1.32,
              color: 'var(--label-2)'
            }}
          >
            {d.about.signoff}
          </p>
        </div>
      </section>

      <section className="lp-section" aria-labelledby="filosofia">
        <div className="lp-container">
          <div className="lp-surface lp-surface--mist lp-stack--lg lp-reveal">
            <h2 id="filosofia" className="lp-measure">
              {d.about.philTitle}
            </h2>
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
