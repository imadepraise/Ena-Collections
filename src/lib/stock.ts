type StockSource = {
  stock_quantity: number;
  product_variants?: { stock_quantity: number }[] | null;
};

// If a product has options (variants), their stock is what counts.
export function effectiveStock(p: StockSource) {
  const v = p.product_variants ?? [];
  return v.length > 0 ? v.reduce((sum, x) => sum + x.stock_quantity, 0) : p.stock_quantity;
}
