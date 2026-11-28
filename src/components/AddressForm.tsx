'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { naira } from '@/lib/format';

export type Area = { id: string; state: string; name: string; fee: number };

export default function AddressForm({
  areas,
  onSaved,
  onCancel,
}: {
  areas: Area[];
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const { user, profile } = useAuth();
  const [recipient, setRecipient] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [state, setState] = useState('');
  const [areaId, setAreaId] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const states = Array.from(new Set(areas.map((a) => a.state))).sort((a, b) => a.localeCompare(b));
  const chosenState = state || (states.includes('Edo') ? 'Edo' : states[0] || '');
  const stateAreas = areas.filter((a) => a.state === chosenState);
  const chosenArea = stateAreas.find((a) => a.id === areaId)?.id ?? stateAreas[0]?.id ?? '';
  const fee = stateAreas.find((a) => a.id === chosenArea)?.fee;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!chosenArea) {
      setError('No delivery areas are available yet.');
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error } = await supabase()
      .from('addresses')
      .insert({
        user_id: user.id,
        recipient_name: recipient.trim(),
        phone: phone.trim(),
        area_id: chosenArea,
        street: street.trim(),
        landmark: landmark.trim() || null,
      })
      .select('id')
      .single();
    setBusy(false);
    if (error || !data) {
      setError(error?.message ?? 'Could not save the address.');
      return;
    }
    onSaved(data.id);
  }

  return (
    <form onSubmit={save} className="card-box">
      <h3 style={{ marginBottom: 12 }}>New delivery address</h3>
      {error && <p className="error">{error}</p>}
      <label className="field">
        Receiver name
        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
      </label>
      <label className="field">
        Receiver phone number
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" />
      </label>
      <label className="field">
        State
        <select value={chosenState} onChange={(e) => { setState(e.target.value); setAreaId(''); }}>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      {stateAreas.length > 1 && (
        <label className="field">
          Area or town
          <select value={chosenArea} onChange={(e) => setAreaId(e.target.value)}>
            {stateAreas.map((a) => (
              <option key={a.id} value={a.id}>{a.name} - {naira(a.fee)}</option>
            ))}
          </select>
        </label>
      )}
      {fee !== undefined && (
        <p className="notice">Delivery fee to {chosenState}: <strong>{naira(fee)}</strong></p>
      )}
      <label className="field">
        Street and house number
        <input value={street} onChange={(e) => setStreet(e.target.value)} required />
      </label>
      <label className="field">
        Nearest landmark or town (optional)
        <input value={landmark} onChange={(e) => setLandmark(e.target.value)} />
      </label>
      <div className="actions">
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save address'}</button>
        {onCancel && (
          <button className="btn btn-outline" type="button" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
