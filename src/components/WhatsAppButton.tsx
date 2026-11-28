'use client';

import { usePathname } from 'next/navigation';
import { whatsappLink } from '@/lib/site';
import { isFocusPage } from '@/lib/chrome';
import { ChatIcon } from '@/components/Icons';

export default function WhatsAppButton() {
  const path = usePathname();
  return (
    <a
      href={whatsappLink('Hello ENA COLLECTION, I need some help.')}
      target="_blank"
      rel="noopener noreferrer"
      className={isFocusPage(path) ? 'wa-float wa-focus' : 'wa-float'}
      aria-label="Chat with us on WhatsApp"
    >
      <ChatIcon size={22} />
      <span>Chat on WhatsApp</span>
    </a>
  );
}
