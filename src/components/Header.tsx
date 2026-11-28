'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { supabase } from '@/lib/supabase/client';
import { CartIcon, CloseIcon, MenuIcon } from '@/components/Icons';

type Clothing = { is_active: boolean; coming_soon: boolean } | null;

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const { count } = useCart();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [clothing, setClothing] = useState<Clothing | undefined>(undefined);
  const close = () => setOpen(false);
  const on = (href: string) => (path === href || (href !== '/' && path.startsWith(href)) ? 'active' : '');

  useEffect(() => {
    supabase()
      .from('categories')
      .select('is_active,coming_soon')
      .eq('slug', 'clothing')
      .maybeSingle()
      .then(({ data }) => setClothing((data as Clothing) ?? null));
  }, []);

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="wordmark" onClick={close}>
          ENA <span>COLLECTION</span>
        </Link>

        <nav className={open ? 'nav open' : 'nav'} aria-label="Main">
          <Link href="/" className={on('/')} onClick={close}>Home</Link>
          <Link href="/shop" className={on('/shop')} onClick={close}>Shop</Link>
          {clothing?.is_active && (
            <Link href="/shop?category=clothing" onClick={close}>Clothing</Link>
          )}
          {clothing && !clothing.is_active && clothing.coming_soon && (
            <span className="nav-soon">
              Clothing <small>Coming soon</small>
            </span>
          )}
          {!loading && user && <Link href="/account/orders" className={on('/account/orders')} onClick={close}>My orders</Link>}
          {!loading && user && <Link href="/account" className={path === '/account' ? 'active' : ''} onClick={close}>Account</Link>}
          {!loading && user && profile?.role === 'admin' && <Link href="/admin" onClick={close}>Dashboard</Link>}
          {!loading && !user && <Link href="/login" className="nav-cta" onClick={close}>Sign in</Link>}
          {!loading && user && (
            <button type="button" className="nav-btn" onClick={() => { close(); signOut(); }}>
              Sign out
            </button>
          )}
        </nav>

        <div className="header-actions">
          {!loading && user && profile?.role !== 'admin' && (
            <Link href="/cart" className="icon-btn" aria-label={`Cart, ${count} items`} onClick={close}>
              <CartIcon />
              {count > 0 && <span key={count} className="cart-count">{count}</span>}
            </Link>
          )}
          <button type="button" className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
