'use client';

import './admin.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/delivery', label: 'Delivery fees' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [toReview, setToReview] = useState(0);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/admin');
  }, [loading, user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    async function count() {
      const { count } = await supabase()
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'payment_under_review');
      setToReview(count ?? 0);
    }
    count();
    const t = setInterval(count, 60000);
    return () => clearInterval(t);
  }, [isAdmin, path]);

  if (loading || !user) {
    return <div className="admin-center">Loading...</div>;
  }
  if (!isAdmin) {
    return (
      <div className="admin-center">
        <h1 className="admin-title">Owner access only</h1>
        <p className="muted">This area is for the shop owner.</p>
        <Link href="/" className="btn">Back to the shop</Link>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">ENA COLLECTION</div>
        {LINKS.map((l) => {
          const on = l.href === '/admin' ? path === '/admin' : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={on ? 'on' : ''}>
              {l.label}
              {l.href === '/admin/orders' && toReview > 0 && <span className="badge-count">{toReview}</span>}
            </Link>
          );
        })}
        <div className="spacer" />
        <Link href="/">&larr; Back to the shop</Link>
        <button type="button" onClick={async () => { await signOut(); router.push('/login'); }}>
          Sign out
        </button>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
