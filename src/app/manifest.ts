import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ENA COLLECTION',
    short_name: 'ENA',
    description: 'Your Satisfaction is Our No 1 Priority',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fff7ec',
    theme_color: '#b3202a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
