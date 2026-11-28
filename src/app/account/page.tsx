'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import AddressForm, { type Area } from '@/components/AddressForm';
import { naira } from '@/lib/format';
import { stateLabel } from '@/lib/states';
import { whatsappLink } from '@/lib/site';
import { ChevronIcon, GridIcon, HelpIcon, LogoutIcon, ReceiptIcon } from '@/components/Icons';

type Address = {
  id: string;
  recipient_name: string;
  phone: string;
  street: string;
  landmark: string | null;
  delivery_areas: { state: string; name: string; fee: number } | null;
};

export default function AccountPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [adding, setAdding] = useState(false);
  const [statuses, setStatuses] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = supabase();
    const [a, d] = await Promise.all([
      sb.from('addresses').select('id,recipient_name,phone,street,landmark,delivery_areas(state,name,fee)').eq('user_id', user.id).order('created_at'),
      sb.from('delivery_areas').select('id,state,name,fee').eq('is_active', true).order('state').order('name'),
    ]);
    const o = await sb.from('orders').select('status');
    setStatuses(((o.data ?? []) as { status: string }[]).map((x) => x.status));
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
        <div className="profile-head">
          <div className="profile-avatar">{(name || user.email || '?').charAt(0).toUpperCase()}</div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>{name || 'My account'}</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email}</p>
        </div>
        <div className="stats">
          <div><b>{statuses.length}</b><span>Orders</span></div>
          <div><b>{statuses.filter((s) => !['delivered', 'cancelled', 'expired'].includes(s)).length}</b><span>In progress</span></div>
          <div><b>{statuses.filter((s) => s === 'delivered').length}</b><span>Delivered</span></div>
        </div>
        <div className="menu-list">
          <Link href="/account/orders" className="menu-item"><ReceiptIcon size={20} /> My orders <span className="chev"><ChevronIcon /></span></Link>
          <a href="#addresses" className="menu-item"><GridIcon size={20} /> Saved addresses <span className="chev"><ChevronIcon /></span></a>
          <a href={whatsappLink('Hello ENA COLLECTION, I need help.')} target="_blank" rel="noopener noreferrer" className="menu-item"><HelpIcon size={20} /> Help and support <span className="chev"><ChevronIcon /></span></a>
          {profile?.role === 'admin' && (
            <Link href="/admin" className="menu-item"><GridIcon size={20} /> Owner dashboard <span className="chev"><ChevronIcon /></span></Link>
          )}
          <button type="button" className="menu-item" onClick={signOut}><LogoutIcon size={20} /> Sign out</button>
        </div>

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
          <h2 id="addresses" style={{ marginBottom: 12 }}>Delivery addresses</h2>
          {addresses.length === 0 && <p className="muted">No saved addresses yet.</p>}
          {addresses.map((a) => (
            <div key={a.id} className="radio-card" style={{ cursor: 'default' }}>
              <span style={{ flex: 1 }}>
                <strong>{a.recipient_name}</strong> - {a.phone}
                <br />
                {a.street}{a.landmark ? `, near ${a.landmark}` : ''}
                <br />
                {a.delivery_areas ? `${a.delivery_areas.name}, ${stateLabel(a.delivery_areas.state)} - delivery ${naira(a.delivery_areas.fee)}` : 'Area no longer served'}
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
