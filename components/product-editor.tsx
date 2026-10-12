'use client';

/**
 * Editor de productes del tauler, pensat perquè la Laura i la Paula el facin servir soles:
 * quatre passos, una vista prèvia de com es veurà a la botiga i una llista del que falta.
 *
 *  1. Fotos — s'arrosseguen o es trien; es redueixen al navegador abans de pujar-les.
 *  2. Nom i preu — n'hi ha prou amb un idioma (l'altre fa servir el mateix text).
 *  3. Colors — es treuen tocant la foto (comptagotes) o amb el selector.
 *  4. Descripció.
 *  Opcions avançades (personalització, adreça web, ordre…) queden plegades.
 *
 * Envia el mateix formulari que esperava `saveProduct`, així el servidor ho valida tot igual.
 */
import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties, type DragEvent } from 'react';
import { ProductCard } from './product-card';
import { swatchBackground } from './color-dots';
import type { Localized, Personalization, ProductImage } from '@/lib/db/schema';
import type { CatalogProduct } from '@/lib/catalog';

export type EditorProduct = {
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
export type EditorVariant = { id: number; name: Localized | null; color: string | null; sku: string; stock: number | null; priceCents: number | null; active: boolean };

type Photo = { key: string; src: string; file?: File; existing?: string };
type Row = {
  key: string;
  id: number | null;
  es: string;
  ca: string;
  c1: string;
  c2: string | null;
  stock: string;
  sku: string;
  price: string;
  active: boolean;
};

const MAX_SIDE = 1800;
const eur = (c: number | null | undefined) => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));
const toCents = (v: string) => {
  const clean = v.replace(/\s|€/g, '').replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(clean) ? Math.round(Number(clean) * 100) : null;
};
const hex2 = (n: number) => n.toString(16).padStart(2, '0');

/** Redueix fotos grans (mòbil) a 1800 px en WebP: pugen més ràpid i no topen amb el límit de 6 MB. */
async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1_500_000 && /jpe?g|png|webp|avif/.test(file.type)) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/webp', 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file; // format que el navegador no sap llegir: el servidor dirà què passa
  }
}

let seq = 0;
const uid = (p: string) => `${p}${++seq}`;

export function ProductEditor({
  product,
  variants,
  categories,
  onSave,
  viewHref
}: {
  product: EditorProduct | null;
  variants: EditorVariant[];
  categories: { id: string; name: Localized }[];
  onSave: (form: FormData) => Promise<void>;
  viewHref?: string;
}) {
  const p = product;
  const pz = p?.personalization ?? ({ mode: 'none' } as Personalization);

  /* ------------------------------------------------------------- estat --- */
  const [photos, setPhotos] = useState<Photo[]>(() => (p?.images ?? []).map((im) => ({ key: uid('e'), src: im.src, existing: im.src })));
  const [nameCa, setNameCa] = useState(p?.name.ca ?? '');
  const [nameEs, setNameEs] = useState(p?.name.es ?? '');
  const [price, setPrice] = useState(eur(p?.priceCents));
  const [categoryId, setCategoryId] = useState(p?.categoryId ?? '');
  const [shortCa, setShortCa] = useState(p?.shortDescription.ca ?? '');
  const [shortEs, setShortEs] = useState(p?.shortDescription.es ?? '');
  const [descCa, setDescCa] = useState(p?.description.ca ?? '');
  const [descEs, setDescEs] = useState(p?.description.es ?? '');
  const colored = variants.some((v) => v.name || v.color);
  const [withColors, setWithColors] = useState(p ? colored : true);
  const [rows, setRows] = useState<Row[]>(() =>
    variants
      .filter((v) => v.name || v.color)
      .map((v) => {
        const [a, b] = (v.color ?? '').split(',');
        return {
          key: String(v.id),
          id: v.id,
          es: v.name?.es ?? '',
          ca: v.name?.ca ?? '',
          c1: /^#[0-9a-f]{6}$/i.test(a ?? '') ? a : '#c8b8a6',
          c2: /^#[0-9a-f]{6}$/i.test(b ?? '') ? b : null,
          stock: v.stock == null ? '' : String(v.stock),
          sku: v.sku,
          price: eur(v.priceCents),
          active: v.active
        };
      })
  );
  const plain = variants.find((v) => !v.name && !v.color);
  const [plainStock, setPlainStock] = useState(plain?.stock == null ? '' : String(plain.stock));
  const [removed, setRemoved] = useState<number[]>([]);
  const [picking, setPicking] = useState<{ row: string; which: 1 | 2 } | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [busy, startSave] = useTransition();
  const [notice, setNotice] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const advancedRef = useRef<HTMLFormElement>(null);

  // Allibera les vistes prèvies de fotos noves en sortir.
  useEffect(() => () => photos.forEach((ph) => ph.file && URL.revokeObjectURL(ph.src)), []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------- fotos --- */
  const addFiles = async (list: FileList | File[]) => {
    const files = [...list].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)).slice(0, 8);
    if (!files.length) return;
    setNotice('Preparant les fotos…');
    const ready = await Promise.all(files.map(shrink));
    setPhotos((cur) => [...cur, ...ready.map((f) => ({ key: uid('n'), src: URL.createObjectURL(f), file: f }))].slice(0, 12));
    setNotice('');
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void addFiles(e.dataTransfer.files);
  };
  const removePhoto = (key: string) => {
    setPhotos((cur) => cur.filter((ph) => ph.key !== key));
    setActivePhoto(0);
  };
  const makeMain = (key: string) => setPhotos((cur) => [...cur.filter((ph) => ph.key === key), ...cur.filter((ph) => ph.key !== key)]);

  /* ------------------------------------------------- comptagotes de foto --- */
  const sampleCanvas = useRef<{ src: string; ctx: CanvasRenderingContext2D; w: number; h: number } | null>(null);
  const sampleAt = async (img: HTMLImageElement, clientX: number, clientY: number): Promise<string | null> => {
    const r = img.getBoundingClientRect();
    // La foto es mostra amb «contain»: cal descomptar les franges buides.
    const ratio = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    const x = (clientX - r.left - (r.width - dw) / 2) / ratio;
    const y = (clientY - r.top - (r.height - dh) / 2) / ratio;
    if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) return null;
    try {
      if (sampleCanvas.current?.src !== img.src) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        sampleCanvas.current = { src: img.src, ctx, w: c.width, h: c.height };
      }
      const { ctx, w, h } = sampleCanvas.current!;
      // Mitjana d'un quadrat petit: el brillantor o la textura no despisten el color.
      const R = Math.max(3, Math.round(Math.min(w, h) / 160));
      const x0 = Math.max(0, Math.round(x) - R);
      const y0 = Math.max(0, Math.round(y) - R);
      const data = ctx.getImageData(x0, y0, Math.min(w - x0, R * 2 + 1), Math.min(h - y0, R * 2 + 1)).data;
      let rs = 0;
      let gs = 0;
      let bs = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        rs += data[i];
        gs += data[i + 1];
        bs += data[i + 2];
        n += 1;
      }
      return `#${hex2(Math.round(rs / n))}${hex2(Math.round(gs / n))}${hex2(Math.round(bs / n))}`;
    } catch {
      // Foto d'un altre servidor sense permís de lectura: es prova el comptagotes del navegador.
      const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
      if (ED) {
        try {
          return (await new ED().open()).sRGBHex;
        } catch {
          return null;
        }
      }
      setNotice('No es pot llegir el color d’aquesta foto. Fes servir el selector de color.');
      return null;
    }
  };
  const onPhotoClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!picking) return;
    const color = await sampleAt(e.currentTarget, e.clientX, e.clientY);
    if (!color) return;
    setRows((cur) => cur.map((r) => (r.key === picking.row ? (picking.which === 1 ? { ...r, c1: color } : { ...r, c2: color }) : r)));
    setPicking(null);
  };

  /* ------------------------------------------------------------ colors --- */
  const addRow = () => {
    const key = uid('new');
    setRows((cur) => [...cur, { key, id: null, es: '', ca: '', c1: '#c8b8a6', c2: null, stock: '', sku: '', price: '', active: true }]);
    if (photos.length) setPicking({ row: key, which: 1 });
  };
  const patch = (key: string, d: Partial<Row>) => setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...d } : r)));
  const dropRow = (r: Row) => {
    setRows((cur) => cur.filter((x) => x.key !== r.key));
    if (r.id) setRemoved((cur) => [...cur, r.id!]);
    if (picking?.row === r.key) setPicking(null);
  };

  /* --------------------------------------------------- què falta i prèvia --- */
  const priceCents = toCents(price);
  const missing = [
    !photos.length && 'Una foto com a mínim',
    !nameCa.trim() && !nameEs.trim() && 'El nom',
    (priceCents === null || priceCents <= 0) && 'Un preu vàlid (per exemple, 12,50)',
    withColors && !rows.length && 'Algun color (o marca «Sense colors»)',
    withColors && rows.some((r) => !r.ca.trim() && !r.es.trim()) && 'El nom de cada color'
  ].filter(Boolean) as string[];
  const oneLang = Boolean((nameCa.trim() && !nameEs.trim()) || (!nameCa.trim() && nameEs.trim()));

  const preview: CatalogProduct = useMemo(
    () => ({
      id: p?.id ?? 0,
      slug: p?.slug ?? 'nou',
      ref: '',
      categoryId: categoryId || null,
      categoryName: categories.find((c) => c.id === categoryId)?.name ?? null,
      name: { ca: nameCa || nameEs || 'Nom del producte', es: nameEs || nameCa || 'Nom del producte' },
      shortDescription: { ca: shortCa || shortEs, es: shortEs || shortCa },
      description: { ca: '', es: '' },
      badge: null,
      priceCents: priceCents ?? 0,
      images: photos[0] ? [{ src: photos[0].src, alt: { ca: '', es: '' } }] : [],
      personalization: { mode: 'none' },
      details: [],
      featured: false,
      variants: withColors
        ? rows.map((r, i) => ({ id: i + 1, name: { ca: r.ca, es: r.es }, color: r.c2 ? `${r.c1},${r.c2}` : r.c1, stock: null, priceCents: 0 }))
        : [{ id: 1, name: null, color: null, stock: null, priceCents: 0 }]
    }),
    [p, categoryId, categories, nameCa, nameEs, shortCa, shortEs, priceCents, photos, withColors, rows]
  );

  /* ------------------------------------------------------------ desar --- */
  const submit = (publish: boolean) => {
    if (missing.length) {
      setNotice(`Abans de desar falta: ${missing.join(' · ').toLowerCase()}.`);
      return;
    }
    const adv = new FormData(advancedRef.current ?? undefined);
    const fd = new FormData();
    if (p) fd.set('id', String(p.id));
    fd.set('name_ca', nameCa.trim());
    fd.set('name_es', nameEs.trim());
    fd.set('short_ca', shortCa.trim());
    fd.set('short_es', shortEs.trim());
    fd.set('description_ca', descCa.trim());
    fd.set('description_es', descEs.trim());
    fd.set('price', price);
    fd.set('categoryId', categoryId);
    if (publish) fd.set('active', 'on');
    for (const k of ['badge_ca', 'badge_es', 'ref', 'slug', 'sort', 'pmode', 'plabel_ca', 'plabel_es', 'phelp_ca', 'phelp_es', 'pmax']) {
      fd.set(k, String(adv.get(k) ?? ''));
    }
    if (adv.get('featured') === 'on') fd.set('featured', 'on');
    // Fotos: les que ja hi eren, per adreça; les noves, per ordre de pujada.
    const order: string[] = [];
    let n = 0;
    for (const ph of photos) {
      if (ph.existing) {
        fd.append('keepImage', ph.existing);
        order.push(`e:${ph.existing}`);
      } else if (ph.file) {
        fd.append('images', ph.file);
        order.push(`n:${n++}`);
      }
    }
    fd.set('photoOrder', JSON.stringify(order));
    // Colors (variants).
    const toRemove = new Set(removed);
    if (withColors) {
      for (const r of rows) {
        const k = r.key;
        fd.set(`v_${k}_present`, '1');
        fd.set(`v_${k}_name_ca`, r.ca.trim());
        fd.set(`v_${k}_name_es`, r.es.trim());
        fd.set(`v_${k}_stock`, r.stock);
        fd.set(`v_${k}_price`, r.price);
        fd.set(`v_${k}_sku`, r.sku);
        if (r.active) fd.set(`v_${k}_active`, 'on');
        fd.set(`v_${k}_hascolor`, 'on');
        fd.set(`v_${k}_c1`, r.c1);
        if (r.c2) {
          fd.set(`v_${k}_two`, 'on');
          fd.set(`v_${k}_c2`, r.c2);
        }
      }
      if (plain) toRemove.add(plain.id);
    } else {
      for (const r of rows) if (r.id) toRemove.add(r.id);
      const k = plain ? String(plain.id) : 'new0';
      fd.set(`v_${k}_present`, '1');
      fd.set(`v_${k}_stock`, plainStock);
      fd.set(`v_${k}_sku`, plain?.sku ?? '');
      fd.set(`v_${k}_active`, 'on');
      // Producte nou sense estoc: fila buida, el servidor en crea una de base.
    }
    for (const id of toRemove) {
      fd.set(`v_${id}_present`, '1');
      fd.set(`v_${id}_delete`, 'on');
    }
    setNotice('');
    startSave(() => onSave(fd));
  };

  /* ------------------------------------------------------------- vista --- */
  const mainPhoto = photos[Math.min(activePhoto, photos.length - 1)];
  return (
    <div className="pe">
      <div className="pe__steps">
        {/* 1 · Fotos */}
        <section className="ad-card pe__step">
          <h2>
            <span className="pe__num">1</span> Fotos
          </h2>
          <div
            className="pe__drop"
            data-over={dragOver || undefined}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {photos.length ? (
              <ul className="pe__photos">
                {photos.map((ph, i) => (
                  <li key={ph.key} className="pe__photo" data-main={i === 0 || undefined}>
                    <img src={ph.src} alt="" />
                    {i === 0 ? <span className="pe__tag">Principal</span> : null}
                    <div className="pe__photo-actions">
                      {i !== 0 ? (
                        <button type="button" className="pe__mini" onClick={() => makeMain(ph.key)}>
                          Fes-la principal
                        </button>
                      ) : null}
                      <button type="button" className="pe__mini pe__mini--danger" onClick={() => removePhoto(ph.key)} aria-label="Treu la foto">
                        Treu
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <button type="button" className="pe__add" onClick={() => fileRef.current?.click()}>
              <strong>{photos.length ? '+ Afegeix més fotos' : 'Tria les fotos o arrossega-les aquí'}</strong>
              <span>Des del mòbil també: es fan petites soles abans de pujar-les.</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
          <p className="ad-muted">La primera és la que surt al catàleg. Millor quadrades i amb fons clar.</p>
        </section>

        {/* 2 · Nom i preu */}
        <section className="ad-card pe__step">
          <h2>
            <span className="pe__num">2</span> Nom i preu
          </h2>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="pe-name-ca">
                Nom<span className="ad-lang">CA</span>
              </label>
              <input className="lp-input" id="pe-name-ca" value={nameCa} onChange={(e) => setNameCa(e.target.value)} maxLength={160} placeholder="p. ex. Mitjons glitter" />
            </div>
            <div className="lp-field">
              <label htmlFor="pe-name-es">
                Nom<span className="ad-lang">ES</span>
              </label>
              <input className="lp-input" id="pe-name-es" value={nameEs} onChange={(e) => setNameEs(e.target.value)} maxLength={160} placeholder="p. ex. Calcetines glitter" />
            </div>
          </div>
          {oneLang ? <p className="pe__hint">Només hi ha un idioma: a l’altra versió de la web sortirà el mateix text. El pots traduir quan vulguis.</p> : null}
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="pe-price">Preu (€, impostos inclosos)</label>
              <input className="lp-input" id="pe-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12,50" />
            </div>
            <div className="lp-field">
              <span className="pe__label">Categoria</span>
              <div className="pe__chips" role="radiogroup" aria-label="Categoria">
                {categories.map((c) => (
                  <button key={c.id} type="button" role="radio" aria-checked={categoryId === c.id} className="pe__chip" onClick={() => setCategoryId(categoryId === c.id ? '' : c.id)}>
                    {c.name.ca}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3 · Colors */}
        <section className="ad-card pe__step">
          <h2>
            <span className="pe__num">3</span> Colors
          </h2>
          <div className="pe__chips" role="radiogroup" aria-label="Té colors">
            <button type="button" role="radio" aria-checked={withColors} className="pe__chip" onClick={() => setWithColors(true)}>
              Té colors per triar
            </button>
            <button type="button" role="radio" aria-checked={!withColors} className="pe__chip" onClick={() => setWithColors(false)}>
              Sense colors
            </button>
          </div>

          {withColors ? (
            <>
              <p className="ad-muted">
                Afegeix només els colors que surten a les fotos. Per agafar-ne un, prem <b>«Agafa’l de la foto»</b> i toca el producte a la foto.
              </p>
              {mainPhoto ? (
                <div className="pe__picker" data-picking={picking ? true : undefined}>
                  <img src={mainPhoto.src} alt="" onClick={onPhotoClick} draggable={false} />
                  {photos.length > 1 ? (
                    <div className="pe__thumbs">
                      {photos.map((ph, i) => (
                        <button key={ph.key} type="button" aria-pressed={i === activePhoto} onClick={() => setActivePhoto(i)}>
                          <img src={ph.src} alt={`Foto ${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {picking ? (
                    <p className="pe__picking" role="status">
                      Toca el producte a la foto per agafar el color ·{' '}
                      <button type="button" className="lp-textbtn" onClick={() => setPicking(null)}>
                        cancel·la
                      </button>
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="pe__hint">Puja primer una foto per poder agafar-ne els colors.</p>
              )}

              <ul className="pe__rows">
                {rows.map((r) => (
                  <li key={r.key} className="pe__row" data-picking={picking?.row === r.key || undefined}>
                    <span className="pe__swatch" style={{ '--sw': swatchBackground(r.c2 ? `${r.c1},${r.c2}` : r.c1) } as CSSProperties} aria-hidden="true" />
                    <div className="pe__row-main">
                      <div className="ad-row ad-row--2">
                        <input className="lp-input" aria-label="Nom del color en català" placeholder="Nom en català (p. ex. Granat)" value={r.ca} onChange={(e) => patch(r.key, { ca: e.target.value })} maxLength={80} />
                        <input className="lp-input" aria-label="Nom del color en castellà" placeholder="En castellà (p. ex. Granate)" value={r.es} onChange={(e) => patch(r.key, { es: e.target.value })} maxLength={80} />
                      </div>
                      <div className="pe__row-tools">
                        <button type="button" className="pe__mini" onClick={() => setPicking({ row: r.key, which: 1 })} disabled={!photos.length}>
                          Agafa’l de la foto
                        </button>
                        <label className="pe__colorinput">
                          <input type="color" value={r.c1} onChange={(e) => patch(r.key, { c1: e.target.value })} aria-label="Color" />
                          Ajusta
                        </label>
                        <label className="lp-check" style={{ fontSize: 13 }}>
                          <input type="checkbox" checked={Boolean(r.c2)} onChange={(e) => patch(r.key, { c2: e.target.checked ? '#ffffff' : null })} /> Estampat (dos colors)
                        </label>
                        {r.c2 ? (
                          <>
                            <button type="button" className="pe__mini" onClick={() => setPicking({ row: r.key, which: 2 })} disabled={!photos.length}>
                              Segon color de la foto
                            </button>
                            <label className="pe__colorinput">
                              <input type="color" value={r.c2} onChange={(e) => patch(r.key, { c2: e.target.value })} aria-label="Segon color" />
                              Ajusta
                            </label>
                          </>
                        ) : null}
                        <label className="pe__stock">
                          Estoc
                          <input className="lp-input" type="number" min={0} value={r.stock} placeholder="∞" onChange={(e) => patch(r.key, { stock: e.target.value })} />
                        </label>
                        <button type="button" className="pe__mini pe__mini--danger" onClick={() => dropRow(r)}>
                          Treu el color
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={addRow}>
                + Afegeix un color
              </button>
            </>
          ) : (
            <label className="pe__stock" style={{ maxWidth: 220 }}>
              Estoc (buit = sense control)
              <input className="lp-input" type="number" min={0} value={plainStock} placeholder="∞" onChange={(e) => setPlainStock(e.target.value)} />
            </label>
          )}
        </section>

        {/* 4 · Descripció */}
        <section className="ad-card pe__step">
          <h2>
            <span className="pe__num">4</span> Descripció
          </h2>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="pe-short-ca">
                Frase curta (surt a la targeta)<span className="ad-lang">CA</span>
              </label>
              <input className="lp-input" id="pe-short-ca" value={shortCa} onChange={(e) => setShortCa(e.target.value)} maxLength={200} />
            </div>
            <div className="lp-field">
              <label htmlFor="pe-short-es">
                Frase curta<span className="ad-lang">ES</span>
              </label>
              <input className="lp-input" id="pe-short-es" value={shortEs} onChange={(e) => setShortEs(e.target.value)} maxLength={200} />
            </div>
          </div>
          <div className="ad-row ad-row--2">
            <div className="lp-field">
              <label htmlFor="pe-desc-ca">
                Descripció (fitxa del producte)<span className="ad-lang">CA</span>
              </label>
              <textarea className="lp-textarea" id="pe-desc-ca" value={descCa} onChange={(e) => setDescCa(e.target.value)} maxLength={3000} />
            </div>
            <div className="lp-field">
              <label htmlFor="pe-desc-es">
                Descripció<span className="ad-lang">ES</span>
              </label>
              <textarea className="lp-textarea" id="pe-desc-es" value={descEs} onChange={(e) => setDescEs(e.target.value)} maxLength={3000} />
            </div>
          </div>
        </section>

        {/* Opcions avançades */}
        <details className="ad-card pe__step pe__advanced">
          <summary>Opcions avançades (personalització, etiqueta, adreça web…)</summary>
          <form ref={advancedRef} className="ad-grid" onSubmit={(e) => e.preventDefault()}>
            <div className="lp-field">
              <label htmlFor="pmode">Personalització</label>
              <select className="lp-select" id="pmode" name="pmode" defaultValue={pz.mode}>
                <option value="none">No es personalitza (compra directa)</option>
                <option value="letter">Una lletra (la clienta envia una sol·licitud)</option>
                <option value="idea">Idea lliure (la clienta envia una sol·licitud)</option>
              </select>
              <span className="lp-field__help">Els personalitzables no van a la cistella: reps la sol·licitud i envies el preu final i l’enllaç de pagament.</span>
            </div>
            <div className="ad-row ad-row--2">
              <div className="lp-field">
                <label htmlFor="plabel_ca">
                  Pregunta a la clienta<span className="ad-lang">CA</span>
                </label>
                <input className="lp-input" id="plabel_ca" name="plabel_ca" defaultValue={pz.mode !== 'none' ? pz.label.ca : ''} placeholder="Quina lletra vols?" maxLength={200} />
              </div>
              <div className="lp-field">
                <label htmlFor="plabel_es">
                  Pregunta<span className="ad-lang">ES</span>
                </label>
                <input className="lp-input" id="plabel_es" name="plabel_es" defaultValue={pz.mode !== 'none' ? pz.label.es : ''} placeholder="¿Qué letra quieres?" maxLength={200} />
              </div>
            </div>
            <div className="ad-row ad-row--2">
              <div className="lp-field">
                <label htmlFor="phelp_ca">
                  Ajuda<span className="ad-lang">CA</span>
                </label>
                <input className="lp-input" id="phelp_ca" name="phelp_ca" defaultValue={pz.mode !== 'none' ? pz.help.ca : ''} maxLength={400} />
              </div>
              <div className="lp-field">
                <label htmlFor="phelp_es">
                  Ajuda<span className="ad-lang">ES</span>
                </label>
                <input className="lp-input" id="phelp_es" name="phelp_es" defaultValue={pz.mode !== 'none' ? pz.help.es : ''} maxLength={400} />
              </div>
            </div>
            <div className="lp-field" style={{ maxWidth: 240 }}>
              <label htmlFor="pmax">Màxim de caràcters (idea lliure)</label>
              <input className="lp-input" id="pmax" name="pmax" type="number" min={20} max={1000} defaultValue={pz.mode === 'idea' ? pz.maxLength : 300} />
            </div>
            <div className="ad-row ad-row--2">
              <div className="lp-field">
                <label htmlFor="badge_ca">
                  Etiqueta a la targeta (opcional)<span className="ad-lang">CA</span>
                </label>
                <input className="lp-input" id="badge_ca" name="badge_ca" defaultValue={p?.badge?.ca ?? ''} placeholder="Novetat" maxLength={40} />
              </div>
              <div className="lp-field">
                <label htmlFor="badge_es">
                  Etiqueta<span className="ad-lang">ES</span>
                </label>
                <input className="lp-input" id="badge_es" name="badge_es" defaultValue={p?.badge?.es ?? ''} placeholder="Novedad" maxLength={40} />
              </div>
            </div>
            <div className="ad-row ad-row--2">
              <div className="lp-field">
                <label htmlFor="ref">Referència interna</label>
                <input className="lp-input" id="ref" name="ref" defaultValue={p?.ref ?? ''} maxLength={40} />
              </div>
              <div className="lp-field">
                <label htmlFor="sort">Ordre al catàleg (1 = primer)</label>
                <input className="lp-input" id="sort" name="sort" type="number" defaultValue={p?.sort ?? 0} />
              </div>
            </div>
            <div className="lp-field">
              <label htmlFor="slug">Adreça web</label>
              <input className="lp-input" id="slug" name="slug" defaultValue={p?.slug ?? ''} placeholder="Es crea sola a partir del nom" maxLength={100} />
            </div>
            <label className="lp-check">
              <input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} /> Destacat a la portada
            </label>
          </form>
        </details>
      </div>

      {/* Vista prèvia i desar */}
      <aside className="pe__side">
        <div className="pe__sticky">
          <p className="pe__label">Així es veurà a la botiga</p>
          <ul className="lp-grid pe__preview">
            <ProductCard p={preview} lang="ca" />
          </ul>
          {missing.length ? (
            <div className="pe__missing">
              <b>Falta:</b>
              <ul>
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="pe__ready">✓ Tot a punt</p>
          )}
          {notice ? (
            <p className="pe__notice" role="status">
              {notice}
            </p>
          ) : null}
          <div className="pe__buttons">
            <button type="button" className="lp-btn lp-btn--lg" onClick={() => submit(true)} disabled={busy}>
              {busy ? 'Desant…' : p?.active === false ? 'Desa i publica' : p ? 'Desa els canvis' : 'Publica el producte'}
            </button>
            <button type="button" className="lp-btn lp-btn--ghost" onClick={() => submit(false)} disabled={busy}>
              {p?.active === false ? 'Desa (segueix amagat)' : p ? 'Desa i amaga’l de la botiga' : 'Desa’l sense publicar'}
            </button>
            {viewHref ? (
              <a className="lp-link" href={viewHref} target="_blank" rel="noopener">
                Veure’l a la botiga ↗
              </a>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
