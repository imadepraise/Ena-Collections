'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { mediaUrl } from '@/lib/supabase/public';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { naira } from '@/lib/format';
import { CART_SELECT, availableStock, isBuyable, unitPrice, type CartItem } from '@/lib/orders';

export default function CartPage() {
  const { user, profile, loading } = useAuth();
  const { refresh } = useCart();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase().from('cart_items').select(CART_SELECT).eq('user_id', user.id).order('created_at');
    setItems((data ?? []) as unknown as CartItem[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function setQty(item: CartItem, qty: number) {
    if (qty < 1) return;
    setMsg(null);
    const { error } = await supabase().from('cart_items').update({ quantity: qty }).eq('id', item.id);
    if (error) setMsg(error.message);
    await load();
    await refresh();
  }

  async function remove(item: CartItem) {
    await supabase().from('cart_items').delete().eq('id', item.id);
    await load();
    await refresh();
  }

  if (loading) return <p className="container section muted">Loading...</p>;
  if (!user) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="page-title">Your cart</h1>
          <p className="muted">Please sign in to see your cart. Your cart is saved to your account.</p>
          <Link href="/login?next=/cart" className="btn">Sign in</Link>
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

  const list = items ?? [];
  const subtotal = list.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);
  const allBuyable = list.length > 0 && list.every(isBuyable);

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Your cart</h1>
        {items === null ? (
          <p className="muted">Loading...</p>
        ) : list.length === 0 ? (
          <>
            <p className="muted">Your cart is empty.</p>
            <Link href="/shop" className="btn">Continue shopping</Link>
          </>
        ) : (
          <div className="two-col">
            <div className="cart-list">
              {msg && <p className="error">{msg}</p>}
              {list.map((item) => {
                const p = item.products;
                const image = p
                  ? [...(p.product_media ?? [])].filter((m) => m.type === 'image').sort((a, b) => a.sort_order - b.sort_order)[0]
                  : undefined;
                const max = availableStock(item);
                return (
                  <div key={item.id} className="cart-row">
                    <div className="cart-thumb">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(image.storage_path)} alt="" />
                      ) : (
                        <span className="muted">No photo</span>
                      )}
                    </div>
                    <div>
                      {p ? <Link href={`/shop/${p.slug}`}><strong>{p.name}</strong></Link> : <strong>No longer available</strong>}
                      {item.product_variants && <p className="muted" style={{ margin: 0 }}>{item.product_variants.label}</p>}
                      {p && <p style={{ margin: 0 }}>{naira(unitPrice(item))}</p>}
                      {!isBuyable(item) && (
                        <p className="error" style={{ marginTop: 6 }}>
                          {!p || !p.is_active ? 'This item is no longer available. Please remove it.' : `Only ${max} left. Please reduce the quantity.`}
                        </p>
                      )}
                    </div>
                    <div className="cart-end">
                      <div className="qty">
                        <button type="button" onClick={() => setQty(item, item.quantity - 1)} aria-label="Less">-</button>
                        <strong>{item.quantity}</strong>
                        <button type="button" onClick={() => setQty(item, item.quantity + 1)} aria-label="More" disabled={item.quantity >= max}>+</button>
                      </div>
                      <p style={{ margin: '8px 0 0' }}>{naira(unitPrice(item) * item.quantity)}</p>
                      <button type="button" className="nav-btn link-gold" onClick={() => remove(item)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card-box">
              <h2 style={{ marginBottom: 12 }}>Summary</h2>
              <div className="summary-row"><span>Subtotal</span><strong>{naira(subtotal)}</strong></div>
              <p className="muted" style={{ fontSize: 14 }}>The delivery fee is added at checkout, based on your area.</p>
              <div className="sticky-cta">
                {allBuyable ? (
                  <Link href="/checkout" className="btn btn-block">Checkout · {naira(subtotal)}</Link>
                ) : (
                  <button className="btn btn-block" disabled>Checkout</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
