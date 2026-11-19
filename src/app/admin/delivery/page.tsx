'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Area = { id: string; state: string; name: string; fee: number; is_active: boolean };

export default function AdminDelivery() {
  const [areas, setAreas] = useState<Area[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [state, setState] = useState('Edo');
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');

  async function load() {
    const { data } = await supabase().from('delivery_areas').select('*').order('state').order('name');
    setAreas((data ?? []) as Area[]);
  }
  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, changes: Partial<Area>) {
    setMsg(null);
    const { error } = await supabase().from('delivery_areas').update(changes).eq('id', id);
    if (error) setMsg(error.message);
    else setAreas((as) => (as ?? []).map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(fee);
    if (!name.trim() || Number.isNaN(n) || n < 0) {
      setMsg('Enter an area name and a fee of 0 or more.');
      return;
    }
    const { error } = await supabase().from('delivery_areas').insert({ state, name: name.trim(), fee: n });
    if (error) setMsg(error.message);
    else {
      setName('');
      setFee('');
      setMsg(null);
      load();
    }
  }

  return (
    <div>
      <h1 className="admin-title">Delivery fees</h1>
      <p className="muted">Customers pick their area at checkout and the fee below is added to the order. Turn an area off to stop delivering there.</p>
      {msg && <p className="error">{msg}</p>}
      {areas === null ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>State</th><th>Area</th><th>Fee (naira)</th><th>Delivering</th></tr></thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id}>
                  <td>{a.state}</td>
                  <td>{a.name}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      defaultValue={a.fee}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v >= 0 && v !== Number(a.fee)) patch(a.id, { fee: v });
                      }}
                      aria-label={`Fee for ${a.name}`}
                    />
                  </td>
                  <td>
                    <input type="checkbox" checked={a.is_active} onChange={(e) => patch(a.id, { is_active: e.target.checked })} aria-label={`${a.name} active`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form className="panel" style={{ marginTop: 24 }} onSubmit={add}>
        <h2>Add an area</h2>
        <div className="grid2">
          <label className="field">
            State
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option>Edo</option>
              <option>Delta</option>
            </select>
          </label>
          <label className="field">
            Area or town
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            Fee (naira)
            <input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} required />
          </label>
        </div>
        <button className="btn" type="submit">Add area</button>
      </form>
    </div>
  );
}
