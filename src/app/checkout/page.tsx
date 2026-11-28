'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import AddressForm, { type Area } from '@/components/AddressForm';
import { naira } from '@/lib/format';
import { stateLabel } from '@/lib/states';
import { CART_SELECT, isBuyable, unitPrice, type CartItem } from '@/lib/orders';

type Address = {
  id: string;
  recipient_name: string;
  phone: string;
  street: string;
  landmark: string | null;
  delivery_areas: { state: string; name: string; fee: number; is_active: boolean } | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { refresh } = useCart();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selected, setSelected] = useState('');
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = supabase();
    const [c, a, d] = await Promise.all([
      sb.from('cart_items').select(CART_SELECT).eq('user_id', user.id),
      sb.from('addresses').select('id,recipient_name,phone,street,landmark,delivery_areas(state,name,fee,is_active)').eq('user_id', user.id).order('created_at'),
      sb.from('delivery_areas').select('id,state,name,fee').eq('is_active', true).order('state').order('name'),
    ]);
    setItems((c.data ?? []) as unknown as CartItem[]);
    const addrs = (a.data ?? []) as unknown as Address[];
    setAddresses(addrs);
    setAreas((d.data ?? []) as Area[]);
    setSelected((s) => s || addrs.find((x) => x.delivery_areas?.is_active)?.id || '');
    if (addrs.length === 0) setAdding(true);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="container section muted">Loading...</p>;
  if (!user) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="page-title">Checkout</h1>
          <Link href="/login?next=/checkout" className="btn">Sign in to continue</Link>
        </div>
      </section>
    );
  }
  if (profile?.role === 'admin') {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="page-title">Owner account</h1>
          <p className="muted">Owner accounts cannot place orders. Use a customer account to test the shop.</p>
          <Link href="/admin" className="btn">Go to the dashboard</Link>
        </div>
      </section>
    );
  }

  if (items === null) return <p className="container section muted">Loading...</p>;
  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="page-title">Checkout</h1>
          <p className="muted">Your cart is empty.</p>
          <Link href="/shop" className="btn">Go to the shop</Link>
        </div>
      </section>
    );
  }

  const subtotal = items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const chosen = addresses.find((a) => a.id === selected);
  const fee = chosen?.delivery_areas?.is_active ? Number(chosen.delivery_areas.fee) : 0;
  const allBuyable = items.every(isBuyable);

  async function place() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const { data, error } = await supabase().rpc('place_order', { p_address_id: selected, p_note: note.trim() || null });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    await refresh();
    router.push(`/account/orders/${data}?placed=1`);
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Checkout</h1>
        <div className="two-col">
          <div>
            <h2 style={{ marginBottom: 14 }}>Delivery address</h2>
            {addresses.map((a) => {
              const ok = a.delivery_areas?.is_active;
              return (
                <label key={a.id} className={selected === a.id ? 'radio-card on' : 'radio-card'}>
                  <input type="radio" name="addr" checked={selected === a.id} onChange={() => setSelected(a.id)} disabled={!ok} />
                  <span>
                    <strong>{a.recipient_name}</strong> - {a.phone}
                    <br />
                    {a.street}{a.landmark ? `, near ${a.landmark}` : ''}
                    <br />
                    {ok ? `${a.delivery_areas?.name}, ${stateLabel(a.delivery_areas!.state)} - delivery ${naira(a.delivery_areas!.fee)}` : 'We no longer deliver to this area'}
                  </span>
                </label>
              );
            })}
            {adding ? (
              <AddressForm
                areas={areas}
                onSaved={async (id) => {
                  setSelected(id);
                  setAdding(false);
                  await load();
                  setSelected(id);
                }}
                onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
              />
            ) : (
              <button type="button" className="btn btn-outline" onClick={() => setAdding(true)}>Add a new address</button>
            )}
            <h2 style={{ margin: '24px 0 12px' }}>Payment method</h2>
            <label className="radio-card on">
              <input type="radio" checked readOnly />
              <span>
                <strong>Bank transfer</strong>
                <br />
                <span className="muted">Place your order, pay to our bank account, then upload your receipt.</span>
              </span>
            </label>
            <label className="field" style={{ marginTop: 20 }}>
              Note for your order (optional)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
          <div className="card-box">
            <h2 style={{ marginBottom: 12 }}>Order summary</h2>
            {items.map((i) => (
              <div key={i.id} className="summary-row">
                <span>{i.products?.name ?? 'Item'}{i.product_variants ? ` (${i.product_variants.label})` : ''} x {i.quantity}</span>
                <span>{naira(unitPrice(i) * i.quantity)}</span>
              </div>
            ))}
            <div className="summary-row"><span>Subtotal</span><span>{naira(subtotal)}</span></div>
            <div className="summary-row"><span>Delivery</span><span>{chosen ? naira(fee) : 'Choose an address'}</span></div>
            <div className="summary-row summary-total"><span>Total</span><span>{naira(subtotal + fee)}</span></div>
            <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
              After you place the order you will see our bank details. Pay by transfer, then upload your receipt.
            </p>
            {error && <p className="error">{error}</p>}
            {!allBuyable && <p className="error">Some items are not available. Please review your cart.</p>}
            <div className="sticky-cta">
              <button className="btn btn-block" type="button" onClick={place} disabled={busy || !selected || !allBuyable}>
                {busy ? 'Placing order...' : `Place order · ${naira(subtotal + fee)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
