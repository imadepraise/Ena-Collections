'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { EyeIcon } from '@/components/Icons';

function safeNextParam() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const sb = supabase();

    if (mode === 'signin') {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const { data: prof } = await sb.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      router.push(safeNextParam() ?? (prof?.role === 'admin' ? '/admin' : '/'));
      return;
    }

    if (password.length < 8) {
      setError('Please use a password of at least 8 characters.');
      setBusy(false);
      return;
    }
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    if (data.session) {
      router.push(safeNextParam() ?? '/');
    } else {
      setInfo('Account created. Please check your email and click the confirmation link, then sign in.');
      setMode('signin');
      setBusy(false);
    }
  }

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="ENA COLLECTION" className="auth-logo" />
        <h1 className="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted auth-sub">
          {mode === 'signin' ? 'Sign in to continue your shopping.' : 'It takes a minute. Your details stay private.'}
        </p>

        {info && <p className="notice">{info}</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label className="field">
                Full name
                <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </label>
              <label className="field">
                Phone number
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" />
              </label>
            </>
          )}
          <label className="field">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </label>
          <label className="field">
            Password
            <span className="pw-wrap">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                <EyeIcon />
              </button>
            </span>
          </label>
          {mode === 'signin' && (
            <p style={{ textAlign: 'right', margin: '-6px 0 16px' }}>
              <Link href="/forgot-password" className="link-gold" style={{ fontSize: 14 }}>
                Forgot password?
              </Link>
            </p>
          )}
          <button className="btn btn-block btn-lg" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch muted">
          {mode === 'signin' ? 'New to ENA COLLECTION? ' : 'Already have an account? '}
          <button type="button" className="link-btn" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}>
            {mode === 'signin' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </section>
  );
}
