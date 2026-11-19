export const STAGES: [string, string][] = [
  ['awaiting_payment', 'Order placed'],
  ['payment_under_review', 'Payment under review'],
  ['payment_confirmed', 'Payment confirmed'],
  ['processing', 'Processing'],
  ['ready_for_dispatch', 'Ready for dispatch'],
  ['out_for_delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
];

export const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Awaiting payment',
  payment_under_review: 'Payment under review',
  payment_confirmed: 'Payment confirmed',
  processing: 'Processing',
  ready_for_dispatch: 'Ready for dispatch',
  rider_assigned: 'Rider assigned',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  payment_rejected: 'Payment rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export const PAID_STATUSES = [
  'payment_confirmed',
  'processing',
  'ready_for_dispatch',
  'rider_assigned',
  'out_for_delivery',
  'delivered',
];

export function statusTone(status: string) {
  if (status === 'delivered') return 'ok';
  if (['awaiting_payment', 'payment_under_review', 'payment_rejected'].includes(status)) return 'warn';
  if (['cancelled', 'expired'].includes(status)) return 'off';
  return '';
}

// Turns 0805... or +234805... into the format WhatsApp links need.
export function waPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

export type CartProduct = {
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  product_media: { storage_path: string; type: string; sort_order: number }[] | null;
};
export type CartVariant = { label: string; price_override: number | null; stock_quantity: number };
export type CartItem = {
  id: string;
  quantity: number;
  product_id: string;
  variant_id: string | null;
  products: CartProduct | null;
  product_variants: CartVariant | null;
};

export const CART_SELECT =
  'id,quantity,product_id,variant_id,products(name,slug,price,sale_price,stock_quantity,is_active,product_media(storage_path,type,sort_order)),product_variants(label,price_override,stock_quantity)';

// Same rule the database uses when it places the order.
export function unitPrice(item: CartItem) {
  const p = item.products;
  if (!p) return 0;
  const base = Number(p.sale_price ?? p.price);
  const v = item.product_variants;
  return v && v.price_override != null ? Number(v.price_override) : base;
}
export function availableStock(item: CartItem) {
  if (!item.products) return 0;
  return item.product_variants ? item.product_variants.stock_quantity : item.products.stock_quantity;
}
export function isBuyable(item: CartItem) {
  return !!item.products && item.products.is_active && item.quantity <= availableStock(item);
}
