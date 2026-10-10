import Link from 'next/link';
import { getCategories } from '@/lib/shop';
import { ProductForm } from '@/components/admin-product-form';
import { Flash } from '@/components/admin-ui';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Nou producte' };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ e?: string; msg?: string }> }) {
  // Cada pàgina comprova l'accés per si mateixa: la comprovació del layout sola no n'hi ha prou.
  await requireAdmin();
  const { e, msg } = await searchParams;
  const categories = await getCategories();
  return (
    <>
      <div className="ad-head">
        <div>
          <p className="ad-muted">
            <Link className="lp-link" href="/admin/productes">← Productes</Link>
          </p>
          <h1>Nou producte</h1>
        </div>
      </div>
      <Flash e={e} msg={msg} />
      <ProductForm product={null} variants={[]} categories={categories} />
    </>
  );
}
