'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NIGERIAN_STATES } from '@/lib/states';

type Area = { id: string; state: string; name: string; fee: number; is_active: boolean };

export default function AdminDelivery() {
  const [areas, setAreas] = useState<Area[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [state, setState] = useState('Edo');
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [bulk, setBulk] = useState('');

  async function load() {
    const { data } = await supabase().from('delivery_areas').select('*').order('state').order('name');
    setAreas((data ?? []) as Area[]);
    setDrafts({});
  }
  useEffect(() => {
    load();
  }, []);

  async function saveFee(a: Area) {
    const raw = drafts[a.id];
    const n = Number(raw);
    if (raw === undefined || raw === '' || Number.isNaN(n) || n < 0) {
      setMsg('Enter a fee of 0 or more.');
      return;
    }
    const { error } = await supabase().from('delivery_areas').update({ fee: n }).eq('id', a.id);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg(null);
    setAreas((list) => (list ?? []).map((x) => (x.id === a.id ? { ...x, fee: n } : x)));
    setDrafts((d) => {
      const copy = { ...d };
      delete copy[a.id];
      return copy;
    });
    setSaved(a.id);
    setTimeout(() => setSaved((s) => (s === a.id ? null : s)), 2000);
  }

  async function setActive(a: Area, on: boolean) {
    setMsg(null);
    const { error } = await supabase().from('delivery_areas').update({ is_active: on }).eq('id', a.id);
    if (error) setMsg(error.message);
    else setAreas((list) => (list ?? []).map((x) => (x.id === a.id ? { ...x, is_active: on } : x)));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(fee);
    if (!name.trim() || fee === '' || Number.isNaN(n) || n < 0) {
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

  async function bulkFee() {
    const n = Number(bulk);
    if (bulk === '' || Number.isNaN(n) || n < 0) {
      setMsg('Enter a fee of 0 or more.');
      return;
    }
    if (!confirm(`Set the delivery fee to ${n} naira for every state except Edo and Delta?`)) return;
    const { error } = await supabase().from('delivery_areas').update({ fee: n }).not('state', 'in', '(Edo,Delta)');
    if (error) setMsg(error.message);
    else {
      setMsg(null);
      load();
    }
  }

  async function bulkActive(on: boolean) {
    const text = on ? 'Turn on delivery to every state except Edo and Delta?' : 'Stop delivering to every state except Edo and Delta?';
    if (!confirm(text)) return;
    const { error } = await supabase().from('delivery_areas').update({ is_active: on }).not('state', 'in', '(Edo,Delta)');
    if (error) setMsg(error.message);
    else {
      setMsg(null);
      load();
    }
  }

  const term = q.trim().toLowerCase();
  const shown = (areas ?? []).filter(
    (a) => !term || a.state.toLowerCase().includes(term) || a.name.toLowerCase().includes(term)
  );

  return (
    <div>
      <h1 className="admin-title">Delivery fees</h1>
      <p className="muted">
        Customers choose their state (and town where there is a choice) at checkout, and the fee below is added to
        their order. To change a fee, type the new amount and press Save. Turn a place off to stop delivering there.
      </p>
      {msg && <p className="error">{msg}</p>}

      <label className="field" style={{ maxWidth: 360 }}>
        Find a state or town
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="For example: Lagos" />
      </label>

      {areas === null ? (
        <p className="muted">Loading...</p>
      ) : shown.length === 0 ? (
        <p className="muted">Nothing matches your search.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>State</th><th>Area</th><th>Fee (naira)</th><th>Delivering</th></tr>
            </thead>
            <tbody>
              {shown.map((a) => {
                const draft = drafts[a.id];
                const changed = draft !== undefined && draft !== String(a.fee);
                return (
                  <tr key={a.id}>
                    <td>{a.state}</td>
                    <td>{a.name}</td>
                    <td>
                      <div className="actions" style={{ marginTop: 0, flexWrap: 'nowrap' }}>
                        <input
                          type="number"
                          min={0}
                          value={draft ?? String(a.fee)}
                          onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveFee(a);
                          }}
                          aria-label={`Fee for ${a.name}, ${a.state}`}
                        />
                        <button type="button" className="btn btn-sm" disabled={!changed} onClick={() => saveFee(a)}>
                          Save
                        </button>
                        {saved === a.id && <span className="pill ok">Saved</span>}
                      </div>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={a.is_active}
                        onChange={(e) => setActive(a, e.target.checked)}
                        aria-label={`${a.name}, ${a.state}, delivering`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel" style={{ marginTop: 24 }}>
        <h2>All other states at once</h2>
        <p className="muted">Quick tools for every state except Edo and Delta, which keep their own town fees.</p>
        <div className="actions">
          <label className="field" style={{ margin: 0 }}>
            Fee for all other states (naira)
            <input type="number" min={0} value={bulk} onChange={(e) => setBulk(e.target.value)} />
          </label>
          <button type="button" className="btn btn-sm" onClick={bulkFee}>Apply fee</button>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => bulkActive(true)}>Deliver to all other states</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => bulkActive(false)}>Stop delivering to other states</button>
        </div>
      </div>

      <form className="panel" onSubmit={add}>
        <h2>Add an area</h2>
        <div className="grid2">
          <label className="field">
            State
            <select value={state} onChange={(e) => setState(e.target.value)}>
              {NIGERIAN_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
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
