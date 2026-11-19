type P = { size?: number };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const CartIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M3 4h2l2.2 11h10.6L20 7H6.2" /><circle cx="9" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></svg>
);
export const MenuIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ShieldIcon = ({ size = 26 }: P) => (
  <svg {...base(size)}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const LockIcon = ({ size = 26 }: P) => (
  <svg {...base(size)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
);
export const BankIcon = ({ size = 26 }: P) => (
  <svg {...base(size)}><path d="M3 9l9-5 9 5" /><path d="M5 10v7M10 10v7M14 10v7M19 10v7M3 20h18" /></svg>
);
export const TruckIcon = ({ size = 26 }: P) => (
  <svg {...base(size)}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>
);
export const ChatIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20z" /></svg>
);
export const GoogleIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 01-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
    <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6-4.5H2.4v2.8A11 11 0 0012 23z" />
    <path fill="#FBBC05" d="M6 14.1a6.6 6.6 0 010-4.2V7.1H2.4a11 11 0 000 9.8L6 14.1z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 002.4 7.1L6 9.9c.8-2.6 3.2-4.5 6-4.5z" />
  </svg>
);
