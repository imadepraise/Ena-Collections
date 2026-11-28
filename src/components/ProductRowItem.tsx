import Link from 'next/link';
import { mediaUrl } from '@/lib/supabase/public';
import { naira } from '@/lib/format';
import { ChevronIcon } from '@/components/Icons';
import type { ProductRow } from '@/components/ProductCard';

// Compact list row, used for "Popular picks".
export default function ProductRowItem({ p }: { p: ProductRow }) {
  const image = [...(p.product_media ?? [])]
    .filter((m) => m.type === 'image')
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  const price = p.sale_price != null && Number(p.sale_price) < Number(p.price) ? p.sale_price : p.price;

  return (
    <Link href={`/shop/${p.slug}`} className="row-item">
      <div className="row-thumb">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(image.storage_path)} alt="" loading="lazy" />
        ) : null}
      </div>
      <div className="row-text">
        <p className="row-name">{p.name}</p>
        <p className="row-price">{naira(price as number)}</p>
      </div>
      <span className="chev"><ChevronIcon size={18} /></span>
    </Link>
  );
}
