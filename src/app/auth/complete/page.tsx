'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

// Google sends people back here after they approve the sign-in.
export default function AuthCompletePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const next = new URLSearchParams(window.location.search).get('next');
    const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    router.replace(safe ?? (profile?.role === 'admin' ? '/admin' : '/'));
  }, [loading, user, profile, router]);

  useEffect(() => {
    const t = setTimeout(() => setFailed(true), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="section">
      <div className="container narrow" style={{ textAlign: 'center' }}>
        {failed && !user ? (
          <>
            <h1 className="page-title">We could not sign you in</h1>
            <p className="muted">Please try again.</p>
            <Link href="/login" className="btn">Back to sign in</Link>
          </>
        ) : (
          <p className="muted">Signing you in...</p>
        )}
      </div>
    </section>
  );
}
