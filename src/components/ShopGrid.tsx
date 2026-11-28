'use client';

import { useMemo, useState } from 'react';
import ProductCard, { type ProductRow } from '@/components/ProductCard';
import Reveal from '@/components/Reveal';

export type Cat = { id: string; name: string; slug?: string };

const price = (p: ProductRow) => Number(p.sale_price ?? p.price);

export default function ShopGrid({
  products,
  categories,
  initialCategory = 'all',
  initialQuery = '',
}: {
  products: ProductRow[];
  categories: Cat[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState(initialCategory);
  const [sort, setSort] = useState('new');

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = products.filter(
      (p) => (cat === 'all' || p.category_id === cat) && (!term || p.name.toLowerCase().includes(term))
    );
    if (sort === 'low') list.sort((a, b) => price(a) - price(b));
    else if (sort === 'high') list.sort((a, b) => price(b) - price(a));
    return list;
  }, [products, q, cat, sort]);

  return (
    <>
      <div className="shop-tools">
        <label className="field search">
          <span className="sr-only">Search products</span>
          <input type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="field sort">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Newest first</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>

      {categories.length > 1 && (
        <div className="chips">
          <button type="button" className={cat === 'all' ? 'chip on' : 'chip'} onClick={() => setCat('all')}>All</button>
          {categories.map((c) => (
            <button key={c.id} type="button" className={cat === c.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {shown.length > 0 ? (
        <>
          <p className="muted result-count">{shown.length} {shown.length === 1 ? 'product' : 'products'}</p>
          <div className="product-grid">
            {shown.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <ProductCard p={p} index={i} />
              </Reveal>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>{products.length === 0 ? 'New products are being added. Please check back soon.' : 'No products match your search.'}</p>
        </div>
      )}
    </>
  );
}
