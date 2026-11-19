import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import './ena.css';
import AuthProvider from '@/components/AuthProvider';
import CartProvider from '@/components/CartProvider';
import HideOnAdmin from '@/components/HideOnAdmin';
import AgeGate from '@/components/AgeGate';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-cormorant',
});
const body = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'ENA COLLECTION', template: '%s | ENA COLLECTION' },
  description: 'Your Satisfaction is Our No 1 Priority',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AuthProvider>
          <CartProvider>
            <HideOnAdmin>
              <AgeGate />
              <Header />
            </HideOnAdmin>
            <main>{children}</main>
            <HideOnAdmin>
              <Footer />
              <WhatsAppButton />
            </HideOnAdmin>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
