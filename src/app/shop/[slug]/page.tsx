import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { publicClient } from '@/lib/supabase/public';
import { naira } from '@/lib/format';
import { whatsappLink } from '@/lib/site';
import AddToCart from '@/components/AddToCart';
import ProductGallery from '@/components/ProductGallery';

export const revalidate = 30;

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const { data } = await publicClient()
    .from('products')
    .select(
      'id,name,slug,description,price,sale_price,stock_quantity,low_stock_threshold,product_media(storage_path,type,sort_order),product_variants(id,label,price_override,stock_quantity)'
    )
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return { title: p?.name ?? 'Product' };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const media = [...(p.product_media ?? [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );
  const variants = (p.product_variants ?? []) as {
    id: string;
    label: string;
    price_override: number | null;
    stock_quantity: number;
  }[];
  const onSale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
  const basePrice = Number(onSale ? p.sale_price : p.price);
  const available = variants.length > 0 ? variants.some((v) => v.stock_quantity > 0) : p.stock_quantity > 0;
  const lowStock = variants.length === 0 && p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;

  return (
    <section className="section">
      <div className="container">
        <p className="crumbs"><Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / {p.name}</p>
      </div>
      <div className="container product-page">
        <ProductGallery media={media} name={p.name} />
        <div>
          <h1 className="page-title">{p.name}</h1>
          <p className="price price-lg">
            {onSale ? (
              <>
                <strong>{naira(p.sale_price)}</strong>
                <s className="muted">{naira(p.price)}</s>
              </>
            ) : (
              <strong>{naira(p.price)}</strong>
            )}
          </p>
          <p className={available ? 'stock-ok' : 'stock-out'}>
            {!available ? 'Sold out' : lowStock ? `Only ${p.stock_quantity} left` : 'In stock'}
          </p>
          {p.description && <p className="prose">{p.description}</p>}
          <AddToCart productId={p.id} variants={variants} baseStock={p.stock_quantity} basePrice={basePrice} />
          <ul className="perks">
            <li>Discreet packaging</li>
            <li>Pay by bank transfer, then upload your receipt</li>
            <li>Delivery in Edo and Delta</li>
          </ul>
          <a
            className="btn btn-outline"
            href={whatsappLink(`Hello ENA COLLECTION, I have a question about: ${p.name}`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask about this product on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
