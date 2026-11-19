'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import StatusPill from '@/components/StatusPill';
import { naira } from '@/lib/format';
import { fmtDate, waPhone } from '@/lib/orders';

type Payment = {
  id: string;
  method: string;
  amount: number;
  receipt_path: string | null;
  status: string;
  reject_reason: string | null;
  created_at: string;
};
type OrderFull = {
  id: string;
  reference: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  recipient_name: string;
  recipient_phone: string;
  state: string;
  area_name: string;
  street: string;
  landmark: string | null;
  note: string | null;
  created_at: string;
  order_items: { id: string; product_name: string; variant_label: string | null; quantity: number; line_total: number }[];
  order_events: { id: string; status: string; note: string | null; created_at: string }[];
  payments: Payment[];
};

const NEXT: Record<string, { to: string; label: string }> = {
  payment_confirmed: { to: 'processing', label: 'Start processing' },
  processing: { to: 'ready_for_dispatch', label: 'Mark ready for dispatch' },
  ready_for_dispatch: { to: 'out_for_delivery', label: 'Mark out for delivery' },
  rider_assigned: { to: 'out_for_delivery', label: 'Mark out for delivery' },
  out_for_delivery: { to: 'delivered', label: 'Mark delivered' },
};
const CAN_CANCEL = ['awaiting_payment', 'payment_under_review', 'payment_rejected', 'payment_confirmed', 'processing', 'ready_for_dispatch', 'rider_assigned', 'out_for_delivery'];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [missing, setMissing] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const sb = supabase();
    const { data } = await sb.from('orders').select('*, order_items(*), order_events(*), payments(*)').eq('id', id).maybeSingle();
    if (!data) {
      setMissing(true);
      return;
    }
    const full = data as unknown as OrderFull;
    setOrder(full);
    const map: Record<string, string> = {};
    for (const p of full.payments) {
      if (p.receipt_path) {
        const { data: signed } = await sb.storage.from('receipts').createSignedUrl(p.receipt_path, 600);
        if (signed?.signedUrl) map[p.id] = signed.signedUrl;
      }
    }
    setUrls(map);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setBusy(true);
    setMsg(null);
    const { error } = await fn();
    setBusy(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: ok });
    if (!error) setNote('');
    await load();
  }

  if (missing) return <p>Order not found. <Link href="/admin/orders" className="link-gold">Back to orders</Link></p>;
  if (!order) return <p className="muted">Loading...</p>;

  const sb = supabase();
  const next = NEXT[order.status];
  const payments = [...order.payments].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const events = [...order.order_events].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div>
      <p><Link href="/admin/orders" className="link-gold">&larr; All orders</Link></p>
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <h1 className="admin-title" style={{ margin: 0 }}>{order.reference}</h1>
        <StatusPill status={order.status} />
      </div>
      <p className="muted">Placed {fmtDate(order.created_at)}</p>
      {msg && <p className={msg.ok ? 'notice' : 'error'}>{msg.text}</p>}

      <div className="panel">
        <h2>Payment</h2>
        <p>Order total to match: <strong>{naira(order.total)}</strong>. Check the amount and the reference against your bank alert before confirming.</p>
        {payments.length === 0 && <p className="muted">No receipt uploaded yet.</p>}
        {payments.map((p) => (
          <div key={p.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 14 }}>
            <p style={{ margin: '0 0 8px' }}>
              {fmtDate(p.created_at)} - <span className={p.status === 'confirmed' ? 'pill ok' : p.status === 'rejected' ? 'pill off' : 'pill warn'}>{p.status}</span>
              {p.reject_reason ? ` (${p.reject_reason})` : ''}
            </p>
            {p.receipt_path && urls[p.id] ? (
              p.receipt_path.endsWith('.pdf') ? (
                <a href={urls[p.id]} target="_blank" rel="noopener noreferrer" className="link-gold">Open receipt (PDF)</a>
              ) : (
                <a href={urls[p.id]} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls[p.id]} alt="Payment receipt" className="receipt-img" />
                </a>
              )
            ) : (
              <p className="muted">Receipt loading...</p>
            )}
            {p.status === 'pending' && order.status === 'payment_under_review' && (
              <div className="actions">
                <button type="button" className="btn" disabled={busy} onClick={() => run(() => sb.rpc('review_payment', { p_payment_id: p.id, p_approve: true, p_reason: null }), 'Payment confirmed.')}>
                  Confirm payment
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => {
                    const reason = window.prompt('Why is the receipt not accepted? The customer will see this.');
                    if (reason === null) return;
                    run(() => sb.rpc('review_payment', { p_payment_id: p.id, p_approve: false, p_reason: reason.trim() || null }), 'Receipt rejected. The customer can upload again.');
                  }}
                >
                  Reject receipt
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {next && (
        <div className="panel">
          <h2>Delivery</h2>
          <label className="field">
            Message for the customer (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: Your rider is Sam, 0801 234 5678" />
            <span className="muted">The customer sees this in the order history.</span>
          </label>
          <button type="button" className="btn" disabled={busy} onClick={() => run(() => sb.rpc('set_order_status', { p_order_id: order.id, p_status: next.to, p_note: note.trim() || null }), 'Status updated.')}>
            {next.label}
          </button>
        </div>
      )}

      <div className="panel">
        <h2>Customer and delivery details</h2>
        <dl className="kv">
          <dt>Name</dt><dd>{order.recipient_name}</dd>
          <dt>Phone</dt><dd>{order.recipient_phone}</dd>
          <dt>Address</dt><dd>{order.street}{order.landmark ? `, near ${order.landmark}` : ''}, {order.area_name}, {order.state} State</dd>
          {order.note && (<><dt>Note</dt><dd>{order.note}</dd></>)}
        </dl>
        <p style={{ marginTop: 14 }}>
          <a
            className="btn btn-outline btn-sm"
            href={`https://wa.me/${waPhone(order.recipient_phone)}?text=${encodeURIComponent(`Hello ${order.recipient_name}, this is ENA COLLECTION about your order ${order.reference}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message customer on WhatsApp
          </a>
        </p>
      </div>

      <div className="panel">
        <h2>Items</h2>
        {order.order_items.map((i) => (
          <p key={i.id} style={{ margin: '0 0 6px' }}>
            {i.product_name}{i.variant_label ? ` (${i.variant_label})` : ''} x {i.quantity} - {naira(i.line_total)}
          </p>
        ))}
        <p style={{ margin: '10px 0 0' }}>Delivery: {naira(order.delivery_fee)}</p>
        <p style={{ margin: 0 }}><strong>Total: {naira(order.total)}</strong></p>
      </div>

      <div className="panel">
        <h2>History</h2>
        {events.map((e) => (
          <p key={e.id} style={{ margin: '0 0 6px' }}>
            <span className="muted">{fmtDate(e.created_at)}</span> - {e.note || e.status.replace(/_/g, ' ')}
          </p>
        ))}
      </div>

      {CAN_CANCEL.includes(order.status) && (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={busy}
          onClick={() => {
            const reason = window.prompt('Reason for cancelling this order (optional):');
            if (reason === null) return;
            run(() => sb.rpc('cancel_order', { p_order_id: order.id, p_reason: reason.trim() || null }), 'Order cancelled and stock returned.');
          }}
        >
          Cancel this order
        </button>
      )}
    </div>
  );
}
