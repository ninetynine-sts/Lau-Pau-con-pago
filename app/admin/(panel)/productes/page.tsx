import Link from 'next/link';
import { asc, inArray } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { loc } from '@/lib/i18n';
import { eur } from '@/lib/admin-labels';
import { adjustStock } from '@/app/actions/admin';
import { Flash } from '@/components/admin-ui';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Productes' };

export default async function Products({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  // Cada pàgina comprova l'accés per si mateixa: la comprovació del layout sola no n'hi ha prou.
  await requireAdmin();
  const { ok } = await searchParams;
  const products = await db.select().from(schema.products).orderBy(asc(schema.products.sort), asc(schema.products.id));
  const variants = products.length
    ? await db.select().from(schema.variants).where(inArray(schema.variants.productId, products.map((p) => p.id))).orderBy(asc(schema.variants.sort), asc(schema.variants.id))
    : [];
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Productes</h1>
          <p>{products.length} productes · ajusta l’estoc aquí mateix o obre’n un per editar-lo.</p>
        </div>
        <Link className="lp-btn" href="/admin/productes/nou">
          + Nou producte
        </Link>
      </div>
      <Flash ok={ok} />
      <section className="ad-card">
        <div className="ad-scroll">
          <table className="ad-table">
            <thead>
              <tr>
                <th />
                <th>Producte</th>
                <th>Tipus</th>
                <th>Estoc per model</th>
                <th className="num">Preu</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={p.active ? undefined : { opacity: 0.55 }}>
                  <td style={{ width: 52 }}>{p.images[0] ? <img className="ad-thumb" src={p.images[0].src} alt="" /> : null}</td>
                  <td>
                    <Link href={`/admin/productes/${p.id}`}>{loc(p.name, 'ca')}</Link>
                    <div className="ad-muted">
                      {p.ref}
                      {!p.active ? ' · amagat' : ''}
                      {p.featured ? ' · destacat' : ''}
                    </div>
                  </td>
                  <td>{p.personalization.mode === 'none' ? 'Compra directa' : 'Per sol·licitud'}</td>
                  <td>
                    {p.personalization.mode === 'none' ? (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {variants
                          .filter((v) => v.productId === p.id)
                          .map((v) => (
                            <form key={v.id} action={adjustStock} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input type="hidden" name="variantId" value={v.id} />
                              <span style={{ minWidth: 90, fontSize: 13 }}>{v.name ? loc(v.name, 'ca') : 'Únic'}</span>
                              <input
                                className="lp-input"
                                name="stock"
                                type="number"
                                min={0}
                                defaultValue={v.stock ?? ''}
                                placeholder="∞"
                                aria-label="Estoc"
                                style={{ width: 84, padding: '7px 10px', fontSize: 14 }}
                              />
                              <button className="lp-textbtn" type="submit">
                                Desa
                              </button>
                            </form>
                          ))}
                      </div>
                    ) : (
                      <span className="ad-muted">Es fabrica per encàrrec</span>
                    )}
                  </td>
                  <td className="num">{eur(p.priceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
