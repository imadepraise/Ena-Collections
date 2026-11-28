'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { naira } from '@/lib/format';

type V = { id: string; label: string; price_override: number | null; stock_quantity: number };

export default function AddToCart({
  productId,
  variants,
  baseStock,
  basePrice,
}: {
  productId: string;
  variants: V[];
  baseStock: number;
  basePrice: number;
}) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { refresh } = useCart();
  const firstInStock = variants.find((v) => v.stock_quantity > 0)?.id ?? variants[0]?.id ?? '';
  const [variantId, setVariantId] = useState(firstInStock);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const hasVariants = variants.length > 0;
  const chosen = hasVariants ? variants.find((v) => v.id === variantId) : undefined;
  const stock = hasVariants ? chosen?.stock_quantity ?? 0 : baseStock;
  const unit = chosen && chosen.price_override != null ? Number(chosen.price_override) : basePrice;

  async function add() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    setMsg(null);
    const sb = supabase();
    const vid = hasVariants ? variantId : null;
    const base = sb.from('cart_items').select('id,quantity').eq('user_id', user.id).eq('product_id', productId);
    const { data: existing } = await (vid ? base.eq('variant_id', vid) : base.is('variant_id', null)).maybeSingle();
    const newQty = (existing?.quantity ?? 0) + qty;
    if (newQty > stock) {
      setMsg({ ok: false, text: `Only ${stock} available.` });
      setBusy(false);
      return;
    }
    const res = existing
      ? await sb.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
      : await sb.from('cart_items').insert({ user_id: user.id, product_id: productId, variant_id: vid, quantity: qty });
    setBusy(false);
    if (res.error) {
      setMsg({ ok: false, text: res.error.message });
      return;
    }
    await refresh();
    setMsg({ ok: true, text: 'Added to your cart.' });
  }

  if (profile?.role === 'admin') {
    return (
      <p className="notice">
        You are signed in as the shop owner, so ordering is turned off. Use a customer account to place a test order.
      </p>
    );
  }

  return (
    <div className="buy">
      {hasVariants && (
        <label className="field">
          Choose an option
          <select value={variantId} onChange={(e) => { setVariantId(e.target.value); setQty(1); }}>
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock_quantity <= 0}>
                {v.label}
                {v.price_override != null ? ` (${naira(v.price_override)})` : ` (${naira(basePrice)})`}
                {v.stock_quantity <= 0 ? ' - sold out' : ''}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="buy-row">
        <div className="qty">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less">-</button>
          <strong aria-live="polite">{qty}</strong>
          <button type="button" onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1))} aria-label="More">+</button>
        </div>
        <p className="buy-price">{naira(unit * qty)}</p>
      </div>
      {msg && (
        <p className={msg.ok ? 'notice' : 'error'}>
          {msg.text} {msg.ok && <Link href="/cart" className="link-gold">View cart</Link>}
        </p>
      )}
      <div className="sticky-cta">
        <button type="button" className="btn btn-block" onClick={add} disabled={busy || loading || stock <= 0}>
          {stock <= 0 ? 'Sold out' : busy ? 'Adding...' : user ? `Add to cart · ${naira(unit * qty)}` : 'Sign in to add to cart'}
        </button>
      </div>
    </div>
  );
}
