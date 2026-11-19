'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import AddressForm, { type Area } from '@/components/AddressForm';
import { naira } from '@/lib/format';

type Address = {
  id: string;
  recipient_name: string;
  phone: string;
  street: string;
  landmark: string | null;
  delivery_areas: { state: string; name: string; fee: number } | null;
};

export default function AccountPage() {
  const { user, profile, loading } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = supabase();
    const [a, d] = await Promise.all([
      sb.from('addresses').select('id,recipient_name,phone,street,landmark,delivery_areas(state,name,fee)').eq('user_id', user.id).order('created_at'),
      sb.from('delivery_areas').select('id,state,name,fee').eq('is_active', true).order('state').order('name'),
    ]);
    setAddresses((a.data ?? []) as unknown as Address[]);
    setAreas((d.data ?? []) as Area[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setMsg(null);
    const { error } = await supabase().from('profiles').update({ full_name: name.trim(), phone: phone.trim() }).eq('id', user.id);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved.' });
  }

  async function removeAddress(id: string) {
    if (!confirm('Delete this address?')) return;
    await supabase().from('addresses').delete().eq('id', id);
    load();
  }

  if (loading) return <p className="container section muted">Loading...</p>;
  if (!user) {
    return (
      <section className="section">
        <div className="container narrow">
          <h1 className="page-title">My account</h1>
          <Link href="/login?next=/account" className="btn">Sign in</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container narrow">
        <h1 className="page-title">My account</h1>
        <p><Link href="/account/orders" className="btn">My orders</Link></p>

        <form className="card-box" onSubmit={saveProfile}>
          <h2 style={{ marginBottom: 12 }}>My details</h2>
          <p className="muted" style={{ marginTop: 0 }}>{user.email}</p>
          <label className="field">
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            Phone number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required />
          </label>
          {msg && <p className={msg.ok ? 'notice' : 'error'}>{msg.text}</p>}
          <button className="btn" type="submit">Save details</button>
        </form>

        <div className="card-box">
          <h2 style={{ marginBottom: 12 }}>Delivery addresses</h2>
          {addresses.length === 0 && <p className="muted">No saved addresses yet.</p>}
          {addresses.map((a) => (
            <div key={a.id} className="radio-card" style={{ cursor: 'default' }}>
              <span style={{ flex: 1 }}>
                <strong>{a.recipient_name}</strong> - {a.phone}
                <br />
                {a.street}{a.landmark ? `, near ${a.landmark}` : ''}
                <br />
                {a.delivery_areas ? `${a.delivery_areas.name}, ${a.delivery_areas.state} State - delivery ${naira(a.delivery_areas.fee)}` : 'Area no longer served'}
              </span>
              <button type="button" className="nav-btn link-gold" onClick={() => removeAddress(a.id)}>Delete</button>
            </div>
          ))}
          {adding ? (
            <AddressForm areas={areas} onSaved={() => { setAdding(false); load(); }} onCancel={() => setAdding(false)} />
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => setAdding(true)}>Add an address</button>
          )}
        </div>
      </div>
    </section>
  );
}
