import Link from 'next/link';
import { SITE, whatsappLink } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">ENA COLLECTION</p>
          <p className="footer-text">{SITE.tagline}</p>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm">
            Chat with us on WhatsApp
          </a>
        </div>
        <div>
          <p className="footer-title">Shop</p>
          <p><Link href="/shop">All products</Link></p>
          <p><Link href="/account/orders">My orders</Link></p>
          <p><Link href="/cart">My cart</Link></p>
        </div>
        <div>
          <p className="footer-title">Information</p>
          <p><Link href="/policies/delivery">Delivery</Link></p>
          <p><Link href="/policies/refund">Refund policy</Link></p>
          <p><Link href="/policies/privacy">Privacy policy</Link></p>
        </div>
        <div>
          <p className="footer-title">Contact</p>
          <p><a href={whatsappLink()} target="_blank" rel="noopener noreferrer">{SITE.whatsappDisplay}</a></p>
          <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        </div>
      </div>
      <div className="container footer-bottom">
        &copy; {new Date().getFullYear()} ENA COLLECTION. All rights reserved.
      </div>
    </footer>
  );
}
