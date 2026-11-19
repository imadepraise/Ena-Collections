export const SITE = {
  name: 'ENA COLLECTION',
  tagline: 'Your Satisfaction is Our No 1 Priority',
  whatsapp: '2348052036507',
  whatsappDisplay: '+234 805 203 6507',
  email: 'imadeprecious670@gmail.com',
};

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
