'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { SearchIcon } from '@/components/Icons';

// Greeting and search bar at the top of the home page.
export default function HomeTop() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const first = (profile?.full_name ?? '').trim().split(' ')[0];
  const initial = (first || user?.email || '?').charAt(0).toUpperCase();

  function search(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
  }

  return (
    <div className="home-top">
      <div className="home-greet">
        <div>
          <p className="greet-sub">{user ? 'Welcome back' : 'Welcome to'}</p>
          <p className="greet-name">{user && first ? first : 'ENA COLLECTION'}</p>
        </div>
        <Link href={user ? '/account' : '/login'} className="avatar" aria-label={user ? 'My account' : 'Sign in'}>
          {user ? initial : '?'}
        </Link>
      </div>
      <form className="search-bar" onSubmit={search} role="search">
        <SearchIcon />
        <input type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <button type="submit" className="filter-btn" aria-label="Search">
          <SearchIcon size={20} />
        </button>
      </form>
    </div>
  );
}
