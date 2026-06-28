export function formatCurrency(amount: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}