'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { isFocusPage } from '@/lib/chrome';
import { BagIcon, CartIcon, GridIcon, HomeIcon, ReceiptIcon, UserIcon } from '@/components/Icons';

type Item = { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean; badge?: number };

// App-style tab bar shown on phones.
export default function BottomNav() {
  const path = usePathname();
  const { user, profile, loading } = useAuth();
  const { count } = useCart();
  if (isFocusPage(path) || loading) return null;

  const admin = profile?.role === 'admin';
  const items: Item[] = [
    { href: '/', label: 'Home', icon: <HomeIcon />, match: (p) => p === '/' },
    { href: '/shop', label: 'Shop', icon: <BagIcon />, match: (p) => p.startsWith('/shop') },
  ];
  if (admin) {
    items.push({ href: '/admin', label: 'Dashboard', icon: <GridIcon />, match: (p) => p.startsWith('/admin') });
  } else {
    items.push({
      href: user ? '/cart' : '/login?next=/cart',
      label: 'Cart',
      icon: <CartIcon size={24} />,
      match: (p) => p === '/cart',
      badge: user ? count : 0,
    });
  }
  if (user) {
    items.push({ href: '/account/orders', label: 'Orders', icon: <ReceiptIcon />, match: (p) => p.startsWith('/account/orders') });
    items.push({ href: '/account', label: 'Account', icon: <UserIcon />, match: (p) => p === '/account' });
  } else {
    items.push({ href: '/login', label: 'Sign in', icon: <UserIcon />, match: (p) => p === '/login' });
  }

  return (
    <nav className="bottom-nav" aria-label="App">
      {items.map((it) => (
        <Link key={it.label} href={it.href} className={it.match(path) ? 'bn-item on' : 'bn-item'}>
          {it.icon}
          <span>{it.label}</span>
          {!!it.badge && it.badge > 0 && <span key={it.badge} className="bn-badge">{it.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}
