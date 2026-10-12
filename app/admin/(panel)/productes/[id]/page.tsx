import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { getCategories } from '@/lib/shop';
import { loc } from '@/lib/i18n';
import { ProductEditor } from '@/components/product-editor';
import { deleteProduct, saveProduct } from '@/app/actions/admin';
import { Flash } from '@/components/admin-ui';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Producte' };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; e?: string; msg?: string }> }) {
  // Cada pàgina comprova l'accés per si mateixa: la comprovació del layout sola no n'hi ha prou.
  await requireAdmin();
  const { id } = await params;
  const { ok, e, msg } = await searchParams;
  const [p] = await db.select().from(schema.products).where(eq(schema.products.id, Number(id))).limit(1);
  if (!p) notFound();
  const [variants, categories] = await Promise.all([
    db.select().from(schema.variants).where(eq(schema.variants.productId, p.id)).orderBy(asc(schema.variants.sort), asc(schema.variants.id)),
    getCategories()
  ]);
  return (
    <>
      <div className="ad-head">
        <div>
          <p className="ad-muted">
            <Link className="lp-link" href="/admin/productes">← Productes</Link>
          </p>
          <h1>{loc(p.name, 'ca')}</h1>
        </div>
      </div>
      <Flash ok={ok} e={e} msg={msg} />
      <ProductEditor
        key={p.updatedAt?.toString()}
        product={{ ...p, badge: p.badge ?? null }}
        variants={variants.map((v) => ({ id: v.id, name: v.name ?? null, color: v.color ?? null, sku: v.sku, stock: v.stock, priceCents: v.priceCents, active: v.active }))}
        categories={categories}
        onSave={saveProduct}
        viewHref={`/es/productos/${p.slug}`}
      />
      <form className="ad-card ad-form" action={deleteProduct} style={{ maxWidth: 560 }}>
        <h2>Eliminar el producte</h2>
        <p className="ad-muted">Si només el vols amagar, fes servir «Desa i amaga’l de la botiga». Eliminar-lo no esborra les comandes antigues.</p>
        <input type="hidden" name="id" value={p.id} />
        <div>
          <button className="lp-btn ad-btn-danger" type="submit">
            Elimina’l definitivament
          </button>
        </div>
      </form>
    </>
  );
}
