'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setDone(true);
  }

  return (
    <section className="section">
      <div className="container">
        <div className="auth-card">
          <h1 className="page-title">Reset password</h1>
          {done ? (
            <p className="notice">If that email has an account, a reset link is on its way. Please check your inbox.</p>
          ) : (
            <form onSubmit={submit}>
              {error && <p className="error">{error}</p>}
              <label className="field">
                Your email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Please wait...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
