'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { mediaUrl } from '@/lib/supabase/public';
import { slugify } from '@/lib/slug';

type Cat = { id: string; name: string };
type Variant = { id?: string; label: string; price_override: string; stock_quantity: string };
type Media = { id: string; type: 'image' | 'video'; storage_path: string; sort_order: number };

const MAX_VIDEO_MB = 50;
const VIDEO_TYPES = ['video/mp4', 'video/webm'];

// Shrinks big phone photos so the free storage lasts much longer.
async function compressImage(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    return blob && blob.size < file.size ? new File([blob], 'photo.webp', { type: 'image/webp' }) : file;
  } catch {
    return file;
  }
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!productId);
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [threshold, setThreshold] = useState('5');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [removedVariants, setRemovedVariants] = useState<string[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setJustAdded(new URLSearchParams(window.location.search).get('added') === '1');
    const sb = supabase();
    sb.from('categories').select('id,name').order('sort_order').then(({ data }) => {
      const list = (data ?? []) as Cat[];
      setCats(list);
      if (!productId && list.length > 0) setCategoryId((c) => c || list[0].id);
    });
    if (!productId) return;
    (async () => {
      const [p, v, m] = await Promise.all([
        sb.from('products').select('*').eq('id', productId).maybeSingle(),
        sb.from('product_variants').select('id,label,price_override,stock_quantity').eq('product_id', productId).order('label'),
        sb.from('product_media').select('id,type,storage_path,sort_order').eq('product_id', productId).order('sort_order'),
      ]);
      if (p.data) {
        setName(p.data.name);
        setCategoryId(p.data.category_id);
        setPrice(String(p.data.price));
        setSalePrice(p.data.sale_price == null ? '' : String(p.data.sale_price));
        setStock(String(p.data.stock_quantity));
        setThreshold(String(p.data.low_stock_threshold));
        setTags((p.data.tags ?? []).join(', '));
        setDescription(p.data.description ?? '');
        setIsActive(p.data.is_active);
        setIsFeatured(p.data.is_featured);
      } else {
        setMsg({ ok: false, text: 'Product not found.' });
      }
      setVariants(
        ((v.data ?? []) as { id: string; label: string; price_override: number | null; stock_quantity: number }[]).map((x) => ({
          id: x.id,
          label: x.label,
          price_override: x.price_override == null ? '' : String(x.price_override),
          stock_quantity: String(x.stock_quantity),
        }))
      );
      setMedia((m.data ?? []) as Media[]);
      setLoading(false);
    })();
  }, [productId]);

  async function saveVariants(pid: string) {
    const sb = supabase();
    for (const id of removedVariants) await sb.from('product_variants').delete().eq('id', id);
    for (const v of variants) {
      if (!v.label.trim()) continue;
      const row = {
        label: v.label.trim(),
        price_override: v.price_override === '' ? null : Number(v.price_override),
        stock_quantity: Math.max(0, parseInt(v.stock_quantity || '0', 10) || 0),
      };
      if (v.id) await sb.from('product_variants').update(row).eq('id', v.id);
      else await sb.from('product_variants').insert({ ...row, product_id: pid });
    }
    setRemovedVariants([]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const priceNum = Number(price);
    const saleNum = salePrice === '' ? null : Number(salePrice);
    if (!name.trim() || !categoryId) return setMsg({ ok: false, text: 'Please enter a name and choose a category.' });
    if (price === '' || Number.isNaN(priceNum) || priceNum < 0) return setMsg({ ok: false, text: 'Please enter a valid price.' });
    if (saleNum !== null && (Number.isNaN(saleNum) || saleNum < 0 || saleNum >= priceNum))
      return setMsg({ ok: false, text: 'The discounted price must be lower than the normal price.' });

    const payload = {
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || null,
      price: priceNum,
      sale_price: saleNum,
      stock_quantity: Math.max(0, parseInt(stock || '0', 10) || 0),
      low_stock_threshold: Math.max(0, parseInt(threshold || '0', 10) || 0),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      is_active: isActive,
      is_featured: isFeatured,
    };

    setBusy(true);
    const sb = supabase();
    if (!productId) {
      const slug = slugify(name) || 'product';
      let res = await sb.from('products').insert({ ...payload, slug }).select('id').single();
      if (res.error?.code === '23505') {
        res = await sb.from('products').insert({ ...payload, slug: `${slug}-${Math.random().toString(36).slice(2, 6)}` }).select('id').single();
      }
      if (res.error || !res.data) {
        setBusy(false);
        return setMsg({ ok: false, text: res.error?.message ?? 'Could not save the product.' });
      }
      await saveVariants(res.data.id);
      router.push(`/admin/products/${res.data.id}?added=1`);
      return;
    }

    const { error } = await sb.from('products').update(payload).eq('id', productId);
    if (error) {
      setBusy(false);
      return setMsg({ ok: false, text: error.message });
    }
    await saveVariants(productId);
    const { data } = await sb.from('product_variants').select('id,label,price_override,stock_quantity').eq('product_id', productId).order('label');
    setVariants(
      ((data ?? []) as { id: string; label: string; price_override: number | null; stock_quantity: number }[]).map((x) => ({
        id: x.id,
        label: x.label,
        price_override: x.price_override == null ? '' : String(x.price_override),
        stock_quantity: String(x.stock_quantity),
      }))
    );
    setBusy(false);
    setMsg({ ok: true, text: 'Saved.' });
  }

  async function onFiles(files: FileList | null) {
    if (!files || !productId) return;
    setUploading(true);
    setMsg(null);
    const sb = supabase();
    let order = media.length ? Math.max(...media.map((m) => m.sort_order)) + 1 : 0;
    const problems: string[] = [];

    for (const original of Array.from(files)) {
      const isVideo = original.type.startsWith('video/');
      const isImage = original.type.startsWith('image/');
      if (!isVideo && !isImage) {
        problems.push(`${original.name}: only photos and videos are allowed.`);
        continue;
      }
      if (isVideo && !VIDEO_TYPES.includes(original.type)) {
        problems.push(`${original.name}: please use an MP4 or WebM video.`);
        continue;
      }
      if (isVideo && original.size > MAX_VIDEO_MB * 1024 * 1024) {
        problems.push(`${original.name} is over ${MAX_VIDEO_MB} MB. Please shorten or compress it.`);
        continue;
      }
      const file = isImage ? await compressImage(original) : original;
      const ext = file.type === 'image/webp' ? 'webp' : (original.name.split('.').pop() || 'bin').toLowerCase();
      const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await sb.storage.from('product-media').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
      if (up.error) {
        problems.push(`${original.name}: ${up.error.message}`);
        continue;
      }
      const ins = await sb
        .from('product_media')
        .insert({ product_id: productId, type: isVideo ? 'video' : 'image', storage_path: path, sort_order: order++ })
        .select('id,type,storage_path,sort_order')
        .single();
      if (ins.error || !ins.data) {
        await sb.storage.from('product-media').remove([path]);
        problems.push(`${original.name}: ${ins.error?.message ?? 'could not save'}`);
        continue;
      }
      setMedia((m) => [...m, ins.data as Media]);
    }
    setUploading(false);
    if (problems.length) setMsg({ ok: false, text: problems.join(' ') });
  }

  async function removeMedia(m: Media) {
    if (!confirm('Remove this file?')) return;
    const sb = supabase();
    await sb.storage.from('product-media').remove([m.storage_path]);
    const { error } = await sb.from('product_media').delete().eq('id', m.id);
    if (error) return setMsg({ ok: false, text: error.message });
    setMedia((list) => list.filter((x) => x.id !== m.id));
  }

  async function move(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= media.length) return;
    const a = media[index];
    const b = media[other];
    const sb = supabase();
    await Promise.all([
      sb.from('product_media').update({ sort_order: b.sort_order }).eq('id', a.id),
      sb.from('product_media').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    const next = [...media];
    next[index] = { ...b, sort_order: a.sort_order };
    next[other] = { ...a, sort_order: b.sort_order };
    setMedia(next);
  }

  async function deleteProduct() {
    if (!productId) return;
    if (!confirm('Delete this product permanently? This cannot be undone. To keep it but hide it from the shop, untick "Show in the shop" instead.')) return;
    const sb = supabase();
    const paths = media.map((m) => m.storage_path);
    if (paths.length) await sb.storage.from('product-media').remove(paths);
    const { error } = await sb.from('products').delete().eq('id', productId);
    if (error) return setMsg({ ok: false, text: error.message });
    router.push('/admin/products');
  }

  function setVariant(i: number, changes: Partial<Variant>) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...changes } : v)));
  }

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <div>
      <h1 className="admin-title">{productId ? 'Edit product' : 'Add product'}</h1>
      {justAdded && <p className="notice">Product saved. Now add photos and videos below.</p>}

      <form onSubmit={save}>
        <div className="panel">
          <h2>Details</h2>
          <label className="field">
            Product name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="field">
            Category
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="field">
            Tags (separate with commas)
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
        </div>

        <div className="panel">
          <h2>Price and stock</h2>
          <div className="grid2">
            <label className="field">
              Price (naira)
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
            </label>
            <label className="field">
              Discounted price (optional)
              <input type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            </label>
            <label className="field">
              Stock available
              <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
            </label>
            <label className="field">
              Warn me when stock is at or below
              <input type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Show in the shop
          </label>
          <label className="check">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured product
          </label>
        </div>

        <div className="panel">
          <h2>Options (size, colour...)</h2>
          <p className="muted">Optional. If you add options, each option has its own stock and the stock above is ignored.</p>
          {variants.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="variant-row">
              <label className="field">
                Option name
                <input value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} />
              </label>
              <label className="field">
                Price (optional)
                <input type="number" min={0} value={v.price_override} onChange={(e) => setVariant(i, { price_override: e.target.value })} />
              </label>
              <label className="field">
                Stock
                <input type="number" min={0} value={v.stock_quantity} onChange={(e) => setVariant(i, { stock_quantity: e.target.value })} />
              </label>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  if (v.id) setRemovedVariants((r) => [...r, v.id as string]);
                  setVariants((vs) => vs.filter((_, idx) => idx !== i));
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setVariants((vs) => [...vs, { label: '', price_override: '', stock_quantity: '0' }])}>
            Add an option
          </button>
        </div>

        {msg && <p className={msg.ok ? 'notice' : 'error'}>{msg.text}</p>}
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save product'}</button>
          {productId && (
            <button type="button" className="btn btn-danger" onClick={deleteProduct}>Delete product</button>
          )}
        </div>
      </form>

      {productId && (
        <div className="panel" style={{ marginTop: 24 }}>
          <h2>Photos and videos</h2>
          <p className="muted">
            The first item is the main photo. Photos are shrunk automatically. Videos must be MP4 or WebM and under {MAX_VIDEO_MB} MB.
            Free storage is limited, so keep videos short.
          </p>
          <label className="field">
            Add files
            <input type="file" accept="image/*,video/mp4,video/webm" multiple disabled={uploading} onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
          </label>
          {uploading && <p className="notice">Uploading... please wait.</p>}
          <div className="media-grid">
            {media.map((m, i) => (
              <div key={m.id} className="media-item">
                {m.type === 'video' ? (
                  <video src={mediaUrl(m.storage_path)} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(m.storage_path)} alt="" />
                )}
                <div className="media-btns">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">&larr;</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === media.length - 1} aria-label="Move later">&rarr;</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => removeMedia(m)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          {media.length === 0 && !uploading && <p className="muted">No files yet.</p>}
        </div>
      )}
    </div>
  );
}
