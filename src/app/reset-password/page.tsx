'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Please use a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else setDone(true);
  }

  return (
    <section className="section">
      <div className="container">
        <div className="auth-card">
          <h1 className="page-title">Choose a new password</h1>
          {done ? (
            <p className="notice">
              Your password has been changed. <Link href="/login" className="link-gold">Sign in</Link>
            </p>
          ) : (
            <form onSubmit={submit}>
              {error && <p className="error">{error}</p>}
              <label className="field">
                New password
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              </label>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Please wait...' : 'Save new password'}
              </button>
              <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
                Open this page from the link in your reset email.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
