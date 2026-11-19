'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { effectiveStock } from '@/lib/stock';
import { naira } from '@/lib/format';
import { PAID_STATUSES, fmtDate } from '@/lib/orders';
import StatusPill from '@/components/StatusPill';

type P = {
  id: string;
  name: string;
  is_active: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  product_variants: { stock_quantity: number }[] | null;
};
type O = { id: string; reference: string; status: string; total: number; created_at: string; recipient_name: string };
type Sold = { product_name: string; quantity: number; line_total: number };

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function AdminOverview() {
  const [products, setProducts] = useState<P[] | null>(null);
  const [orders, setOrders] = useState<O[] | null>(null);
  const [sold, setSold] = useState<Sold[]>([]);
  const [customers, setCustomers] = useState<number | null>(null);

  useEffect(() => {
    const sb = supabase();
    sb.rpc('run_expiry').then(() => {});
    sb.from('products')
      .select('id,name,is_active,stock_quantity,low_stock_threshold,product_variants(stock_quantity)')
      .then(({ data }) => setProducts((data ?? []) as P[]));
    sb.from('orders')
      .select('id,reference,status,total,created_at,recipient_name')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => setOrders((data ?? []) as O[]));
    sb.from('order_items')
      .select('product_name,quantity,line_total,orders!inner(status)')
      .in('orders.status', PAID_STATUSES)
      .limit(2000)
      .then(({ data }) => setSold((data ?? []) as unknown as Sold[]));
    sb.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')
      .then(({ count }) => setCustomers(count ?? 0));
  }, []);

  const plist = products ?? [];
  const olist = orders ?? [];
  const low = plist.filter((p) => p.is_active && effectiveStock(p) <= p.low_stock_threshold);
  const paid = olist.filter((o) => PAID_STATUSES.includes(o.status));
  const sales = paid.reduce((s, o) => s + Number(o.total), 0);
  const count = (...st: string[]) => olist.filter((o) => st.includes(o.status)).length;

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const perDay = days.map((d) =>
    paid.filter((o) => dayKey(new Date(o.created_at)) === dayKey(d)).reduce((s, o) => s + Number(o.total), 0)
  );
  const maxDay = Math.max(1, ...perDay);

  const byProduct = new Map<string, { qty: number; revenue: number }>();
  sold.forEach((s) => {
    const cur = byProduct.get(s.product_name) ?? { qty: 0, revenue: 0 };
    byProduct.set(s.product_name, { qty: cur.qty + s.quantity, revenue: cur.revenue + Number(s.line_total) });
  });
  const best = Array.from(byProduct.entries()).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

  const dash = (v: number | string | null) => (v === null ? '-' : v);

  return (
    <div>
      <h1 className="admin-title">Overview</h1>
      <div className="cards">
        <div className="stat"><b>{orders ? olist.length : '-'}</b>Total orders</div>
        <div className="stat"><b>{orders ? naira(sales) : '-'}</b>Sales (confirmed payments)</div>
        <div className="stat"><b>{orders ? count('payment_under_review') : '-'}</b>Receipts to review</div>
        <div className="stat"><b>{orders ? count('awaiting_payment', 'payment_rejected') : '-'}</b>Awaiting payment</div>
        <div className="stat"><b>{orders ? count('payment_confirmed', 'processing', 'ready_for_dispatch', 'rider_assigned') : '-'}</b>To prepare or dispatch</div>
        <div className="stat"><b>{orders ? count('out_for_delivery') : '-'}</b>Out for delivery</div>
        <div className="stat"><b>{orders ? count('delivered') : '-'}</b>Delivered</div>
        <div className="stat"><b>{dash(customers)}</b>Customers</div>
        <div className="stat"><b>{products ? plist.filter((p) => p.is_active).length : '-'}</b>Products live</div>
        <div className="stat"><b>{products ? low.length : '-'}</b>Low or out of stock</div>
      </div>

      <div className="panel">
        <h2>Sales in the last 14 days</h2>
        <div className="bars" role="img" aria-label="Daily sales for the last 14 days">
          {perDay.map((v, i) => (
            <div key={i} className="bar" style={{ height: `${(v / maxDay) * 100}%` }} title={`${days[i].toLocaleDateString('en-NG')}: ${naira(v)}`} />
          ))}
        </div>
        <div className="bar-labels">
          {days.map((d, i) => (
            <span key={i}>{d.getDate()}</span>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Best sellers</h2>
        {best.length === 0 ? (
          <p className="muted">Best sellers appear here after your first confirmed orders.</p>
        ) : (
          best.map(([name, v]) => (
            <p key={name} style={{ margin: '0 0 6px' }}>
              <strong>{name}</strong> - {v.qty} sold ({naira(v.revenue)})
            </p>
          ))
        )}
      </div>

      <div className="panel">
        <h2>Recent orders</h2>
        {orders && olist.length === 0 && <p className="muted">No orders yet.</p>}
        {olist.slice(0, 6).map((o) => (
          <p key={o.id} style={{ margin: '0 0 8px' }}>
            <Link href={`/admin/orders/${o.id}`} className="link-gold">{o.reference}</Link> - {o.recipient_name} - {naira(o.total)}{' '}
            <StatusPill status={o.status} /> <span className="muted">{fmtDate(o.created_at)}</span>
          </p>
        ))}
      </div>

      <div className="panel">
        <h2>Low stock</h2>
        {products && low.length === 0 && <p className="muted">Nothing is running low.</p>}
        {low.map((p) => (
          <p key={p.id} style={{ margin: '0 0 6px' }}>
            <Link href={`/admin/products/${p.id}`} className="link-gold">{p.name}</Link>{' '}
            <span className="pill warn">{effectiveStock(p)} left</span>
          </p>
        ))}
      </div>
    </div>
  );
}
