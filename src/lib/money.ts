export type Currency = "XAF" | "USD" | "EUR";
export type Rates = { rate_usd_xaf: number; rate_eur_xaf: number };

/** Convert an amount between XAF, USD and EUR using admin-configured rates (expressed in XAF per unit). */
export function convert(amount: number, from: Currency, to: Currency, r: Rates): number {
  if (from === to) return amount;
  if (
    !Number.isFinite(r.rate_usd_xaf) ||
    r.rate_usd_xaf <= 0 ||
    !Number.isFinite(r.rate_eur_xaf) ||
    r.rate_eur_xaf <= 0
  ) {
    throw new RangeError("Les taux de conversion doivent être configurés et positifs.");
  }
  const perUnit = (c: Currency) =>
    c === "XAF" ? 1 : c === "USD" ? Number(r.rate_usd_xaf) : Number(r.rate_eur_xaf);
  return (amount * perUnit(from)) / perUnit(to);
}

export function formatMoney(amount: number, c: Currency): string {
  if (c === "XAF") return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
  return amount.toLocaleString("fr-FR", { style: "currency", currency: c });
}
