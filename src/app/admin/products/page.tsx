'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { effectiveStock } from '@/lib/stock';
import { naira } from '@/lib/format';

type Row = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  categories: { name: string } | null;
  product_variants: { stock_quantity: number }[] | null;
};

export default function AdminProducts() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    supabase()
      .from('products')
      .select('id,name,price,sale_price,stock_quantity,is_active,categories(name),product_variants(stock_quantity)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, []);

  return (
    <div>
      <h1 className="admin-title">Products</h1>
      <p><Link href="/admin/products/new" className="btn">Add a product</Link></p>
      {rows === null ? (
        <p className="muted">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="muted">No products yet. Add your first one.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.categories?.name ?? '-'}</td>
                  <td>{p.sale_price != null ? <>{naira(p.sale_price)} <s className="muted">{naira(p.price)}</s></> : naira(p.price)}</td>
                  <td>{effectiveStock(p)}</td>
                  <td><span className={p.is_active ? 'pill' : 'pill off'}>{p.is_active ? 'Live' : 'Hidden'}</span></td>
                  <td><Link href={`/admin/products/${p.id}`} className="link-gold">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
