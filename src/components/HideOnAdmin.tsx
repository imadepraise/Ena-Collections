'use client';

import { usePathname } from 'next/navigation';

// The shop header, footer, age gate and WhatsApp button are not shown inside /admin.
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith('/admin')) return null;
  return <>{children}</>;
}
