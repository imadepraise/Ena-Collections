import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

const PAGES: Record<string, { title: string; paragraphs: string[] }> = {
  refund: {
    title: 'Refund policy',
    paragraphs: [
      'No refund or return. Because of the personal nature of our products, all sales are final once an order is paid for.',
      'Please check your order carefully before you pay. If you have any question before buying, message us on WhatsApp and we will gladly help.',
    ],
  },
  delivery: {
    title: 'Delivery',
    paragraphs: [
      'We deliver to every state in Nigeria, including Abuja. The delivery fee depends on your state and area and is shown at checkout before you pay. Delivery time depends on your location, and we will confirm it with you once your payment is confirmed.',
      'Orders are paid by bank transfer. After you place an order, you upload your payment receipt, and we confirm it before your order is prepared and sent out for delivery.',
      'Every order is packed discreetly.',
    ],
  },
  privacy: {
    title: 'Privacy policy',
    paragraphs: [
      'We collect only what we need to complete your order: your name, phone number, delivery address, order details and payment receipt.',
      'Your information is used only to process payment and delivery. We do not sell or share it. Your order history is private to your account.',
      `Questions about your information? Contact us at ${SITE.email}.`,
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: PAGES[slug]?.title ?? 'Information' };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <section className="section">
      <div className="container narrow">
        <h1 className="page-title">{page.title}</h1>
        {page.paragraphs.map((text) => (
          <p key={text} className="prose">
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
