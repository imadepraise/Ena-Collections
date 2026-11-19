'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import StatusPill from '@/components/StatusPill';
import { naira } from '@/lib/format';
import { fmtDate } from '@/lib/orders';

type Row = {
  id: string;
  reference: string;
  status: string;
  total: number;
  created_at: string;
  recipient_name: string;
  state: string;
  area_name: string;
};

const FILTERS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'review', label: 'To review', statuses: ['payment_under_review'] },
  { key: 'unpaid', label: 'Awaiting payment', statuses: ['awaiting_payment', 'payment_rejected'] },
  { key: 'prepare', label: 'To prepare or dispatch', statuses: ['payment_confirmed', 'processing', 'ready_for_dispatch', 'rider_assigned'] },
  { key: 'out', label: 'Out for delivery', statuses: ['out_for_delivery'] },
  { key: 'done', label: 'Delivered', statuses: ['delivered'] },
  { key: 'closed', label: 'Cancelled or expired', statuses: ['cancelled', 'expired'] },
];

export default function AdminOrders() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    const sb = supabase();
    sb.rpc('run_expiry')
      .then(() => {})
      .then(() =>
        sb
          .from('orders')
          .select('id,reference,status,total,created_at,recipient_name,state,area_name')
          .order('created_at', { ascending: false })
          .limit(500)
          .then(({ data }) => setRows((data ?? []) as Row[]))
      );
  }, []);

  const wanted = FILTERS.find((f) => f.key === filter)?.statuses;
  const term = q.trim().toLowerCase();
  const shown = (rows ?? []).filter(
    (r) =>
      (!wanted || wanted.includes(r.status)) &&
      (!term || r.reference.toLowerCase().includes(term) || r.recipient_name.toLowerCase().includes(term))
  );

  return (
    <div>
      <h1 className="admin-title">Orders</h1>
      <div className="tabs-row">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={filter === f.key ? 'chip on' : 'chip'} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <label className="field" style={{ maxWidth: 360 }}>
        Search by order number or name
        <input value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {rows === null ? (
        <p className="muted">Loading...</p>
      ) : shown.length === 0 ? (
        <p className="muted">No orders here.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Area</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="link-gold">{o.reference}</Link></td>
                  <td>{o.recipient_name}</td>
                  <td>{o.area_name}, {o.state}</td>
                  <td>{naira(o.total)}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td>{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
