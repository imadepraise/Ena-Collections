'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';

// "Add to cart" button for product cards (home page and shop).
export default function QuickAdd({
  productId,
  slug,
  hasVariants,
  stock,
}: {
  productId: string;
  slug: string;
  hasVariants: boolean;
  stock: number;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { refresh } = useCart();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  if (profile?.role === 'admin') return null;
  if (hasVariants) {
    return (
      <Link href={`/shop/${slug}`} className="btn btn-outline btn-sm btn-block">
        Choose options
      </Link>
    );
  }
  if (stock <= 0) {
    return (
      <button type="button" className="btn btn-outline btn-sm btn-block" disabled>
        Sold out
      </button>
    );
  }

  async function add() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setState('busy');
    setMsg(null);
    const sb = supabase();
    const { data: existing } = await sb
      .from('cart_items')
      .select('id,quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .is('variant_id', null)
      .maybeSingle();
    const newQty = (existing?.quantity ?? 0) + 1;
    if (newQty > stock) {
      setMsg(`Only ${stock} available`);
      setState('idle');
      return;
    }
    const res = existing
      ? await sb.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
      : await sb.from('cart_items').insert({ user_id: user.id, product_id: productId, variant_id: null, quantity: 1 });
    if (res.error) {
      setMsg(res.error.message);
      setState('idle');
      return;
    }
    await refresh();
    setState('done');
    timer.current = setTimeout(() => setState('idle'), 1800);
  }

  return (
    <>
      <button
        type="button"
        className={state === 'done' ? 'btn btn-sm btn-block added' : 'btn btn-sm btn-block'}
        onClick={add}
        disabled={state === 'busy'}
      >
        {state === 'busy' ? 'Adding...' : state === 'done' ? 'Added to cart' : 'Add to cart'}
      </button>
      {msg && <p className="quick-msg">{msg}</p>}
    </>
  );
}
