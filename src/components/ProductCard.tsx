import Link from 'next/link';
import { mediaUrl } from '@/lib/supabase/public';
import { naira } from '@/lib/format';
import QuickAdd from '@/components/QuickAdd';

export const PRODUCT_SELECT =
  'id,category_id,name,slug,price,sale_price,stock_quantity,is_featured,created_at,product_media(storage_path,type,sort_order),product_variants(stock_quantity)';

export type ProductRow = {
  id: string;
  category_id?: string;
  name: string;
  slug: string;
  price: number | string;
  sale_price: number | string | null;
  stock_quantity: number;
  is_featured: boolean;
  created_at?: string;
  product_media: { storage_path: string; type: 'image' | 'video'; sort_order: number }[] | null;
  product_variants: { stock_quantity: number }[] | null;
};

export function isSoldOut(p: ProductRow) {
  const variants = p.product_variants ?? [];
  if (variants.length > 0) return variants.every((v) => v.stock_quantity <= 0);
  return p.stock_quantity <= 0;
}

export default function ProductCard({ p, index = 0 }: { p: ProductRow; index?: number }) {
  const image = [...(p.product_media ?? [])]
    .filter((m) => m.type === 'image')
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  const onSale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
  const percentOff = onSale ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100) : 0;
  const soldOut = isSoldOut(p);
  const hasVariants = (p.product_variants ?? []).length > 0;

  return (
    <div className="product-card" data-tone={index % 3} style={{ animationDelay: `${-(index % 6) * 0.9}s` }}>
      <Link href={`/shop/${p.slug}`} className="product-link">
        <div className="product-thumb">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(image.storage_path)} alt={p.name} loading="lazy" />
          ) : (
            <span className="muted">No photo yet</span>
          )}
          {soldOut ? (
            <span className="badge">Sold out</span>
          ) : onSale ? (
            <span className="badge badge-sale">{percentOff}% off</span>
          ) : null}
        </div>
        <div className="product-info">
          <p className="product-name">{p.name}</p>
          <p className="price">
            {onSale ? (
              <>
                <strong>{naira(p.sale_price as number)}</strong>
                <s className="muted">{naira(p.price)}</s>
              </>
            ) : (
              <strong>{naira(p.price)}</strong>
            )}
          </p>
        </div>
      </Link>
      <div className="product-actions">
        <QuickAdd productId={p.id} slug={p.slug} hasVariants={hasVariants} stock={soldOut ? 0 : p.stock_quantity} />
      </div>
    </div>
  );
}
