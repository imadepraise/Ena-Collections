import Link from 'next/link';
import { publicClient } from '@/lib/supabase/public';
import ProductCard, { PRODUCT_SELECT, type ProductRow } from '@/components/ProductCard';
import { BankIcon, ChatIcon, LockIcon, ShieldIcon, TruckIcon } from '@/components/Icons';
import { SITE, whatsappLink } from '@/lib/site';

export const revalidate = 30;

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  coming_soon: boolean;
};

const STEPS = [
  { n: '1', title: 'Choose', text: 'Browse the collection and add your favourites to your cart.' },
  { n: '2', title: 'Pay by transfer', text: 'Place your order and send the payment to our bank account.' },
  { n: '3', title: 'Upload your receipt', text: 'Add a photo of your receipt. We confirm it quickly.' },
  { n: '4', title: 'Receive it privately', text: 'Your order is packed discreetly and delivered to you.' },
];

export default async function Home() {
  const db = publicClient();
  const [catRes, prodRes] = await Promise.all([
    db.from('categories').select('id,name,slug,is_active,coming_soon').order('sort_order'),
    db.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false }).limit(8),
  ]);
  const categories = (catRes.data ?? []) as Category[];
  const products = (prodRes.data ?? []) as ProductRow[];

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <p className="eyebrow">Luxury · Comfort · Discretion</p>
            <h1>{SITE.tagline}</h1>
            <p className="lead">
              Premium pleasure products, chosen with care and delivered privately to your door in Edo and Delta.
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="btn btn-lg">Shop the collection</Link>
              <a href={whatsappLink('Hello ENA COLLECTION, I need some help.')} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">
                Talk to us
              </a>
            </div>
            <ul className="hero-points">
              <li>Discreet packaging</li>
              <li>Private checkout</li>
              <li>Easy bank transfer</li>
            </ul>
          </div>
          <div className="hero-art">
            <div className="hero-ring">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="ENA COLLECTION" />
            </div>
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="container trust-grid">
          <div className="trust-item"><ShieldIcon /><div><strong>Discreet packaging</strong><span>Plain and private</span></div></div>
          <div className="trust-item"><LockIcon /><div><strong>Private checkout</strong><span>Your details stay yours</span></div></div>
          <div className="trust-item"><BankIcon /><div><strong>Pay by transfer</strong><span>Simple and secure</span></div></div>
          <div className="trust-item"><TruckIcon /><div><strong>Delivery</strong><span>Edo and Delta states</span></div></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Explore</p>
            <h2 className="section-title">Shop by category</h2>
          </div>
          <div className="cat-grid">
            {categories.map((c) =>
              c.is_active ? (
                <Link key={c.id} href="/shop" className="cat-card">
                  <span className="cat-tag">Available now</span>
                  <h3>{c.name}</h3>
                  <span className="cat-link">Shop now &rarr;</span>
                </Link>
              ) : c.coming_soon ? (
                <div key={c.id} className="cat-card cat-soon">
                  <span className="cat-tag">Coming soon</span>
                  <h3>{c.name}</h3>
                  <span className="muted">Something new is on its way.</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head row">
            <div>
              <p className="eyebrow">Just in</p>
              <h2 className="section-title">New arrivals</h2>
            </div>
            {products.length > 0 && <Link href="/shop" className="link-gold">View all &rarr;</Link>}
          </div>
          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>New products are being added. Please check back soon.</p></div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow">Simple and safe</p>
            <h2 className="section-title">How it works</h2>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <span className="step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="promise">
            <div>
              <h2>Your privacy comes first</h2>
              <p>
                We keep your orders private and pack every parcel discreetly. Have a question before you buy? Message us
                on WhatsApp and we will gladly help.
              </p>
            </div>
            <a href={whatsappLink('Hello ENA COLLECTION, I have a question.')} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-lg">
              <ChatIcon size={20} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
