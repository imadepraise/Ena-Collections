'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { slugify } from '@/lib/slug';

type Cat = { id: string; name: string; slug: string; is_active: boolean; coming_soon: boolean; sort_order: number };

export default function AdminCategories() {
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSoon, setNewSoon] = useState(false);

  async function load() {
    const { data } = await supabase().from('categories').select('*').order('sort_order');
    setCats((data ?? []) as Cat[]);
  }
  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, changes: Partial<Cat>) {
    setMsg(null);
    const { error } = await supabase().from('categories').update(changes).eq('id', id);
    if (error) setMsg(error.message);
    else setCats((cs) => (cs ?? []).map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const order = (cats ?? []).reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
    const { error } = await supabase().from('categories').insert({
      name,
      slug: slugify(name) || `category-${order}`,
      is_active: !newSoon,
      coming_soon: newSoon,
      sort_order: order,
    });
    if (error) setMsg(error.message);
    else {
      setNewName('');
      setNewSoon(false);
      load();
    }
  }

  return (
    <div>
      <h1 className="admin-title">Categories</h1>
      <p className="muted">
        A category marked Coming soon shows a label in the shop and cannot be bought from yet.
        When you are ready, press Launch and its products go live.
      </p>
      {msg && <p className="error">{msg}</p>}
      {cats === null ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Shoppable</th><th>Coming soon label</th><th></th></tr></thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td>
                    <input
                      type="text"
                      className="wide"
                      defaultValue={c.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== c.name) patch(c.id, { name: v });
                      }}
                      aria-label={`Name of ${c.name}`}
                    />
                  </td>
                  <td>
                    <input type="checkbox" checked={c.is_active} onChange={(e) => patch(c.id, { is_active: e.target.checked })} aria-label={`${c.name} shoppable`} />
                  </td>
                  <td>
                    <input type="checkbox" checked={c.coming_soon} onChange={(e) => patch(c.id, { coming_soon: e.target.checked })} aria-label={`${c.name} coming soon`} />
                  </td>
                  <td>
                    {c.coming_soon && !c.is_active && (
                      <button type="button" className="btn btn-sm" onClick={() => patch(c.id, { is_active: true, coming_soon: false })}>
                        Launch
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form className="panel" style={{ marginTop: 24 }} onSubmit={add}>
        <h2>Add a category</h2>
        <label className="field">
          Name
          <input value={newName} onChange={(e) => setNewName(e.target.value)} required />
        </label>
        <label className="check">
          <input type="checkbox" checked={newSoon} onChange={(e) => setNewSoon(e.target.checked)} />
          Show as Coming soon (not shoppable yet)
        </label>
        <button className="btn" type="submit">Add category</button>
      </form>
    </div>
  );
}
