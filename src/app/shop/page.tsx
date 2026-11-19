import type { Metadata } from 'next';
import { publicClient } from '@/lib/supabase/public';
import { PRODUCT_SELECT, type ProductRow } from '@/components/ProductCard';
import ShopGrid, { type Cat } from '@/components/ShopGrid';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Shop' };

export default async function ShopPage() {
  const db = publicClient();
  const [prods, cats] = await Promise.all([
    db.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false }),
    db.from('categories').select('id,name').eq('is_active', true).order('sort_order'),
  ]);

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Our collection</p>
          <h1 className="page-title">Shop</h1>
        </div>
        <ShopGrid products={(prods.data ?? []) as ProductRow[]} categories={(cats.data ?? []) as Cat[]} />
      </div>
    </section>
  );
}
