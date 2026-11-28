import type { Metadata } from 'next';
import { publicClient } from '@/lib/supabase/public';
import { PRODUCT_SELECT, type ProductRow } from '@/components/ProductCard';
import ShopGrid, { type Cat } from '@/components/ShopGrid';

export const metadata: Metadata = { title: 'Shop' };

type Props = { searchParams: Promise<{ category?: string; q?: string }> };

export default async function ShopPage({ searchParams }: Props) {
  const { category, q } = await searchParams;
  const db = publicClient();
  const [prods, cats] = await Promise.all([
    db.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false }),
    db.from('categories').select('id,name,slug').eq('is_active', true).order('sort_order'),
  ]);
  const categories = (cats.data ?? []) as Cat[];
  const initial = categories.find((c) => c.slug === category)?.id ?? 'all';

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Our collection</p>
          <h1 className="page-title">Shop</h1>
        </div>
        <ShopGrid key={`${initial}-${q ?? ''}`} initialCategory={initial} initialQuery={q ?? ''} products={(prods.data ?? []) as ProductRow[]} categories={categories} />
      </div>
    </section>
  );
}
