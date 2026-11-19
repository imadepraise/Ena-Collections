'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { CartIcon, CloseIcon, MenuIcon } from '@/components/Icons';

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const { count } = useCart();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const on = (href: string) => (path === href || (href !== '/' && path.startsWith(href)) ? 'active' : '');

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="wordmark" onClick={close}>
          ENA <span>COLLECTION</span>
        </Link>

        <nav className={open ? 'nav open' : 'nav'} aria-label="Main">
          <Link href="/" className={on('/')} onClick={close}>Home</Link>
          <Link href="/shop" className={on('/shop')} onClick={close}>Shop</Link>
          <span className="nav-soon">
            Clothing <small>Coming soon</small>
          </span>
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
              {count > 0 && <span className="cart-count">{count}</span>}
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
