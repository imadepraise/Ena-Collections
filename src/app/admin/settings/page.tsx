'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const FIELDS: { key: string; label: string; visibility: 'public' | 'authenticated' | 'admin'; help?: string; type?: string }[] = [
  { key: 'bank_name', label: 'Bank name', visibility: 'authenticated', help: 'Shown to signed-in customers at checkout.' },
  { key: 'bank_account_number', label: 'Account number', visibility: 'authenticated' },
  { key: 'bank_account_name', label: 'Account name', visibility: 'authenticated' },
  { key: 'order_hold_hours', label: 'Hours to wait for payment', visibility: 'public', help: 'Unpaid orders are cancelled and the stock released after this many hours.', type: 'number' },
  { key: 'order_email', label: 'Email for order notices', visibility: 'admin' },
];

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase()
      .from('site_settings')
      .select('key,value')
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data ?? []).forEach((r: { key: string; value: string }) => (map[r.key] = r.value));
        setValues(map);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    const hours = Number(values.order_hold_hours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      setMsg({ ok: false, text: 'Hours to wait for payment must be a whole number from 1 to 168.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const rows = FIELDS.map((f) => ({ key: f.key, value: (values[f.key] ?? '').trim(), visibility: f.visibility }));
    const { error } = await supabase().from('site_settings').upsert(rows);
    setBusy(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved.' });
  }

  return (
    <div>
      <h1 className="admin-title">Settings</h1>
      {values === null ? (
        <p className="muted">Loading...</p>
      ) : (
        <form className="panel" onSubmit={save}>
          <h2>Payment and orders</h2>
          {FIELDS.map((f) => (
            <label key={f.key} className="field">
              {f.label}
              <input
                type={f.type ?? 'text'}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
              {f.help && <span className="muted">{f.help}</span>}
            </label>
          ))}
          {msg && <p className={msg.ok ? 'notice' : 'error'}>{msg.text}</p>}
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save settings'}</button>
        </form>
      )}
    </div>
  );
}
