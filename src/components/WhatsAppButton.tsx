import { whatsappLink } from '@/lib/site';

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink('Hello ENA COLLECTION, I need some help.')}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-float"
      aria-label="Chat with us on WhatsApp"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9.2 8.8c.2 2.2 2.8 4.8 5 5l1.2-1.2-1.8-1-.8.6c-.8-.4-1.6-1.2-2-2l.6-.8-1-1.8-1.2 1.2z"
          fill="currentColor"
        />
      </svg>
      <span>Chat on WhatsApp</span>
    </a>
  );
}
