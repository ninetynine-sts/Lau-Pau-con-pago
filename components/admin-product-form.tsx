import { saveProduct, deleteProduct } from '@/app/actions/admin';
import { eurInput } from '@/lib/admin-labels';
import type { Localized, Personalization, ProductImage } from '@/lib/db/schema';

type Product = {
  id: number;
  slug: string;
  ref: string;
  categoryId: string | null;
  name: Localized;
  shortDescription: Localized;
  description: Localized;
  badge: Localized | null;
  priceCents: number;
  images: ProductImage[];
  personalization: Personalization;
  active: boolean;
  featured: boolean;
  sort: number;
};
type Variant = { id: number; name: Localized | null; sku: string; stock: number | null; priceCents: number | null; active: boolean };

function Bi({ name, label, value, area = false, max }: { name: string; label: string; value?: Localized | null; area?: boolean; max?: number }) {
  const Tag = area ? 'textarea' : 'input';
  return (
    <div className="ad-row ad-row--2">
      {(['es', 'ca'] as const).map((l) => (
        <div className="lp-field" key={l}>
          <label htmlFor={`${name}_${l}`}>
            {label}
            <span className="ad-lang">{l.toUpperCase()}</span>
          </label>
          <Tag className={area ? 'lp-textarea' : 'lp-input'} id={`${name}_${l}`} name={`${name}_${l}`} defaultValue={value?.[l] ?? ''} maxLength={max} />
        </div>
      ))}
    </div>
  );
}

export function ProductForm({ product, variants, categories }: { product: Product | null; variants: Variant[]; categories: { id: string; name: Localized }[] }) {
  const p = product;
  const pz = p?.personalization ?? { mode: 'none' as const };
  const rows: (Variant | { id: string; name: null; sku: string; stock: null; priceCents: null; active: boolean })[] = [
    ...variants,
    { id: 'new1', name: null, sku: '', stock: null, priceCents: null, active: true },
    { id: 'new2', name: null, sku: '', stock: null, priceCents: null, active: true }
  ];
  return (
    <>
      <form className="ad-grid" action={saveProduct}>
        {p ? <input type="hidden" name="id" value={p.id} /> : null}
        <div className="ad-grid ad-grid--2">
          <div className="ad-grid" style={{ alignContent: 'start' }}>
            <section className="ad-card ad-form">
              <h2>Fitxa</h2>
              <Bi name="name" label="Nom" value={p?.name} max={160} />
              <Bi name="short" label="Frase curta (targeta)" value={p?.shortDescription} max={200} />
              <Bi name="description" label="Descripció" value={p?.description} area max={3000} />
              <Bi name="badge" label="Etiqueta (opcional)" value={p?.badge} max={40} />
            </section>

            <section className="ad-card ad-form">
              <h2>Models i estoc</h2>
              <p className="ad-muted">
                Cada fila és un model que la clienta pot triar (color, talla…). Deixa l’estoc buit si no vols controlar-lo. Si el producte no té models, deixa una sola fila sense nom.
                Les files buides de baix serveixen per afegir-ne.
              </p>
              <div className="ad-variants">
                {rows.map((v) => {
                  const k = String(v.id);
                  return (
                    <div className="ad-variant" key={k}>
                      <input type="hidden" name={`v_${k}_present`} value="1" />
                      <div className="lp-field">
                        <label htmlFor={`v_${k}_name_es`}>
                          Model<span className="ad-lang">ES</span>
                        </label>
                        <input className="lp-input" id={`v_${k}_name_es`} name={`v_${k}_name_es`} defaultValue={v.name?.es ?? ''} placeholder={k.startsWith('new') ? 'Nou model' : 'Sense nom'} />
                      </div>
                      <div className="lp-field">
                        <label htmlFor={`v_${k}_name_ca`}>
                          Model<span className="ad-lang">CA</span>
                        </label>
                        <input className="lp-input" id={`v_${k}_name_ca`} name={`v_${k}_name_ca`} defaultValue={v.name?.ca ?? ''} />
                      </div>
                      <div className="lp-field">
                        <label htmlFor={`v_${k}_stock`}>Estoc</label>
                        <input className="lp-input" id={`v_${k}_stock`} name={`v_${k}_stock`} type="number" min={0} defaultValue={v.stock ?? ''} placeholder="∞" />
                      </div>
                      <div className="lp-field">
                        <label htmlFor={`v_${k}_price`}>Preu propi (€)</label>
                        <input className="lp-input" id={`v_${k}_price`} name={`v_${k}_price`} inputMode="decimal" defaultValue={eurInput(v.priceCents)} placeholder="El del producte" />
                      </div>
                      <div style={{ display: 'grid', gap: 6, paddingBottom: 6 }}>
                        <input type="hidden" name={`v_${k}_sku`} value={v.sku} />
                        <label className="lp-check" style={{ fontSize: 13 }}>
                          <input type="checkbox" name={`v_${k}_active`} defaultChecked={v.active} /> Actiu
                        </label>
                        {!k.startsWith('new') ? (
                          <label className="lp-check ad-danger" style={{ fontSize: 13 }}>
                            <input type="checkbox" name={`v_${k}_delete`} /> Elimina
                          </label>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="ad-card ad-form">
              <h2>Personalització</h2>
              <p className="ad-muted">Els productes personalitzables no van a la cistella: la clienta envia una sol·licitud i tu li envies el preu final i l’enllaç de pagament.</p>
              <div className="lp-field">
                <label htmlFor="pmode">Tipus</label>
                <select className="lp-select" id="pmode" name="pmode" defaultValue={pz.mode}>
                  <option value="none">No es personalitza (compra directa)</option>
                  <option value="letter">Una lletra</option>
                  <option value="idea">Idea lliure (text)</option>
                </select>
              </div>
              <Bi name="plabel" label="Pregunta" value={pz.mode !== 'none' ? pz.label : null} max={200} />
              <Bi name="phelp" label="Ajuda" value={pz.mode !== 'none' ? pz.help : null} max={400} />
              <div className="lp-field" style={{ maxWidth: 220 }}>
                <label htmlFor="pmax">Màxim de caràcters (idea)</label>
                <input className="lp-input" id="pmax" name="pmax" type="number" min={20} max={1000} defaultValue={pz.mode === 'idea' ? pz.maxLength : 300} />
              </div>
            </section>
          </div>

          <div className="ad-grid" style={{ alignContent: 'start' }}>
            <section className="ad-card ad-form">
              <h2>Venda</h2>
              <div className="ad-row ad-row--2">
                <div className="lp-field">
                  <label htmlFor="price">Preu (€, IVA/IGI inclòs)</label>
                  <input className="lp-input" id="price" name="price" inputMode="decimal" defaultValue={eurInput(p?.priceCents)} required placeholder="9,99" />
                </div>
                <div className="lp-field">
                  <label htmlFor="ref">Referència</label>
                  <input className="lp-input" id="ref" name="ref" defaultValue={p?.ref ?? ''} />
                </div>
              </div>
              <div className="lp-field">
                <label htmlFor="categoryId">Categoria</label>
                <select className="lp-select" id="categoryId" name="categoryId" defaultValue={p?.categoryId ?? ''}>
                  <option value="">Sense categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.ca}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ad-row ad-row--2">
                <div className="lp-field">
                  <label htmlFor="slug">Adreça web</label>
                  <input className="lp-input" id="slug" name="slug" defaultValue={p?.slug ?? ''} placeholder="Automàtica" />
                </div>
                <div className="lp-field">
                  <label htmlFor="sort">Ordre</label>
                  <input className="lp-input" id="sort" name="sort" type="number" defaultValue={p?.sort ?? 0} />
                </div>
              </div>
              <label className="lp-check">
                <input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Visible a la botiga
              </label>
              <label className="lp-check">
                <input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} /> Destacat a la portada
              </label>
            </section>

            <section className="ad-card ad-form">
              <h2>Fotos</h2>
              {p?.images.length ? (
                <div className="ad-images">
                  {p.images.map((im, i) => (
                    <div className="ad-image" key={im.src}>
                      <img src={im.src} alt="" />
                      <label className="lp-check" style={{ fontSize: 12 }}>
                        <input type="checkbox" name="keepImage" value={im.src} defaultChecked /> Conserva
                      </label>
                      <label className="lp-check" style={{ fontSize: 12 }}>
                        <input type="radio" name="firstImage" value={im.src} defaultChecked={i === 0} /> Principal
                      </label>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="lp-field">
                <label htmlFor="images">Afegeix fotos</label>
                <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple />
                <span className="lp-field__help">JPG, PNG, WebP o AVIF · màxim 6 MB cadascuna. Millor quadrades i amb fons clar.</span>
              </div>
            </section>

            <div className="ad-actions">
              <button className="lp-btn lp-btn--lg" type="submit">
                Desa el producte
              </button>
              {p ? (
                <a className="lp-link" href={`/es/productos/${p.slug}`} target="_blank" rel="noopener">
                  Veure a la botiga ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </form>

      {p ? (
        <form className="ad-card ad-form" action={deleteProduct} style={{ maxWidth: 560 }}>
          <h2>Eliminar el producte</h2>
          <p className="ad-muted">Si només el vols amagar, desmarca «Visible a la botiga». Eliminar-lo no esborra les comandes antigues.</p>
          <input type="hidden" name="id" value={p.id} />
          <div>
            <button className="lp-btn ad-btn-danger" type="submit">
              Elimina’l definitivament
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
