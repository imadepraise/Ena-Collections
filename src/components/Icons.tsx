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

export const HomeIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></svg>
);
export const BagIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
);
export const ReceiptIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6" /></svg>
);
export const UserIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 20c1-4 4-6 8-6s7 2 8 6" /></svg>
);
export const GridIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
);
export const SearchIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
);
export const BackIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M15 5l-7 7 7 7" /></svg>
);
export const CheckIcon = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const ChevronIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M9 5l7 7-7 7" /></svg>
);
export const EyeIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></svg>
);
export const HelpIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5M12 17h.01" /></svg>
);
export const LogoutIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4M18 12H9" /></svg>
);
