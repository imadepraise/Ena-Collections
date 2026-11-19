'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import StatusPill from '@/components/StatusPill';
import { naira } from '@/lib/format';
import { STAGES, fmtDate } from '@/lib/orders';
import { compressImage } from '@/lib/image';

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
  expires_at: string | null;
  created_at: string;
  order_items: { id: string; product_name: string; variant_label: string | null; unit_price: number; quantity: number; line_total: number }[];
  order_events: { id: string; status: string; note: string | null; created_at: string }[];
  payments: { id: string; status: string; reject_reason: string | null; created_at: string }[];
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [missing, setMissing] = useState(false);
  const [bank, setBank] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = supabase();
    const [o, s] = await Promise.all([
      sb
        .from('orders')
        .select('*, order_items(*), order_events(*), payments(id,status,reject_reason,created_at)')
        .eq('id', id)
        .maybeSingle(),
      sb.from('site_settings').select('key,value'),
    ]);
    if (!o.data) {
      setMissing(true);
      return;
    }
    setOrder(o.data as unknown as OrderFull);
    const map: Record<string, string> = {};
    (s.data ?? []).forEach((r: { key: string; value: string }) => {
      map[r.key] = r.value;
    });
    setBank(map);
  }, [user, id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function uploadReceipt(file: File) {
    if (!user || !order) return;
    setBusy(true);
    setMsg(null);
    const f = file.type.startsWith('image/') ? await compressImage(file) : file;
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setMsg({ ok: false, text: 'Please upload a photo or screenshot of your receipt (or a PDF).' });
      setBusy(false);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setMsg({ ok: false, text: 'That file is too big. Please upload one under 5 MB.' });
      setBusy(false);
      return;
    }
    const ext = f.type === 'image/webp' ? 'webp' : f.type === 'application/pdf' ? 'pdf' : (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${order.id}-${Date.now()}.${ext}`;
    const sb = supabase();
    const up = await sb.storage.from('receipts').upload(path, f, { contentType: f.type });
    if (up.error) {
      setMsg({ ok: false, text: up.error.message });
      setBusy(false);
      return;
    }
    const { error } = await sb.rpc('submit_receipt', { p_order_id: order.id, p_path: path });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: 'Receipt received. We will confirm your payment shortly.' });
    await load();
  }

  async function cancel() {
    if (!order || !confirm('Cancel this order?')) return;
    const { error } = await supabase().rpc('cancel_order', { p_order_id: order.id, p_reason: 'Cancelled by customer' });
    if (error) setMsg({ ok: false, text: error.message });
    await load();
  }

  if (loading) return <p className="container section muted">Loading...</p>;
  if (!user) {
    return (
      <section className="section">
        <div className="container narrow">
          <Link href={`/login?next=/account/orders/${id}`} className="btn">Sign in to see this order</Link>
        </div>
      </section>
    );
  }
  if (missing) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="page-title">Order not found</h1>
          <Link href="/account/orders" className="btn">My orders</Link>
        </div>
      </section>
    );
  }
  if (!order) return <p className="container section muted">Loading...</p>;

  const idx = STAGES.findIndex(([k]) => k === order.status);
  const needsPayment = order.status === 'awaiting_payment' || order.status === 'payment_rejected';
  const lastRejected = [...order.payments].filter((p) => p.status === 'rejected').sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const events = [...order.order_events].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <section className="section">
      <div className="container narrow">
        <p><Link href="/account/orders" className="link-gold">&larr; My orders</Link></p>
        <div className="summary-row">
          <h1 className="page-title" style={{ marginBottom: 8 }}>{order.reference}</h1>
          <StatusPill status={order.status} />
        </div>
        <p className="muted">Placed {fmtDate(order.created_at)}</p>

        {needsPayment && (
          <div className="card-box">
            <h2 style={{ marginBottom: 10 }}>Pay for this order</h2>
            {order.status === 'payment_rejected' && (
              <p className="error">
                We could not confirm your last receipt{lastRejected?.reject_reason ? `: ${lastRejected.reject_reason}` : '.'} Please upload a clear receipt again.
              </p>
            )}
            <p>Transfer exactly <strong>{naira(order.total)}</strong> to:</p>
            <div className="bank-box">
              Bank: <strong>{bank.bank_name || '-'}</strong>
              <br />
              Account number: <strong>{bank.bank_account_number || '-'}</strong>{' '}
              {bank.bank_account_number && (
                <button
                  type="button"
                  className="nav-btn link-gold"
                  onClick={() => {
                    navigator.clipboard?.writeText(bank.bank_account_number);
                    setCopied(true);
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
              <br />
              Account name: <strong>{bank.bank_account_name || '-'}</strong>
              <br />
              Reference (put this in the transfer narration): <strong>{order.reference}</strong>
            </div>
            {order.expires_at && (
              <p className="muted" style={{ fontSize: 14 }}>
                Please pay and upload your receipt before {fmtDate(order.expires_at)}. After that the order is cancelled and the items are released.
              </p>
            )}
            <label className="field">
              Upload your payment receipt (photo, screenshot or PDF)
              <input type="file" accept="image/*,application/pdf" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReceipt(f); e.target.value = ''; }} />
            </label>
            {busy && <p className="notice">Uploading...</p>}
            {msg && <p className={msg.ok ? 'notice' : 'error'}>{msg.text}</p>}
            <button type="button" className="nav-btn link-gold" onClick={cancel}>Cancel this order</button>
          </div>
        )}

        {order.status === 'payment_under_review' && (
          <p className="notice">We received your receipt and we are confirming your payment. This page updates by itself.</p>
        )}
        {['cancelled', 'expired'].includes(order.status) && (
          <p className="error">This order is {order.status === 'expired' ? 'expired because it was not paid in time' : 'cancelled'}.</p>
        )}

        {idx >= 0 && (
          <div className="card-box">
            <h2 style={{ marginBottom: 12 }}>Progress</h2>
            <ul className="stages">
              {STAGES.map(([key, label], i) => (
                <li key={key} className={i < idx ? 'done' : i === idx ? 'now' : ''}>{label}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-box">
          <h2 style={{ marginBottom: 12 }}>Items</h2>
          {order.order_items.map((i) => (
            <div key={i.id} className="summary-row">
              <span>{i.product_name}{i.variant_label ? ` (${i.variant_label})` : ''} x {i.quantity}</span>
              <span>{naira(i.line_total)}</span>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span>{naira(order.subtotal)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{naira(order.delivery_fee)}</span></div>
          <div className="summary-row summary-total"><span>Total</span><span>{naira(order.total)}</span></div>
        </div>

        <div className="card-box">
          <h2 style={{ marginBottom: 12 }}>Delivery details</h2>
          <p style={{ margin: 0 }}>
            {order.recipient_name} - {order.recipient_phone}
            <br />
            {order.street}{order.landmark ? `, near ${order.landmark}` : ''}
            <br />
            {order.area_name}, {order.state} State
          </p>
          {order.note && <p className="muted">Note: {order.note}</p>}
        </div>

        <div className="card-box">
          <h2 style={{ marginBottom: 12 }}>History</h2>
          {events.map((e) => (
            <p key={e.id} style={{ margin: '0 0 6px' }}>
              <span className="muted">{fmtDate(e.created_at)}</span> - {e.note || e.status.replace(/_/g, ' ')}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
