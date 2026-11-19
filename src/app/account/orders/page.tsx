'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import StatusPill from '@/components/StatusPill';
import { naira } from '@/lib/format';
import { fmtDate } from '@/lib/orders';

type Row = { id: string; reference: string; status: string; total: number; created_at: string };

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase()
      .from('orders')
      .select('id,reference,status,total,created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, [user]);

  if (loading) return <p className="container section muted">Loading...</p>;
  if (!user) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="page-title">My orders</h1>
          <Link href="/login?next=/account/orders" className="btn">Sign in</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container narrow">
        <h1 className="page-title">My orders</h1>
        {rows === null ? (
          <p className="muted">Loading...</p>
        ) : rows.length === 0 ? (
          <>
            <p className="muted">You have not placed an order yet.</p>
            <Link href="/shop" className="btn">Go to the shop</Link>
          </>
        ) : (
          rows.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="card-box" style={{ display: 'block' }}>
              <div className="summary-row">
                <strong>{o.reference}</strong>
                <StatusPill status={o.status} />
              </div>
              <div className="summary-row muted">
                <span>{fmtDate(o.created_at)}</span>
                <span>{naira(o.total)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
