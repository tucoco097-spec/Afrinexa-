import { useSettings } from "@/lib/site";
import { convert, formatMoney, type Currency } from "@/lib/money";
import { useDisplayCurrency } from "./currency";

export function Price({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: Currency;
  className?: string;
}) {
  const settings = useSettings();
  const [display] = useDisplayCurrency();
  const ratesAvailable =
    Number.isFinite(settings?.rate_usd_xaf) &&
    Number(settings?.rate_usd_xaf) > 0 &&
    Number.isFinite(settings?.rate_eur_xaf) &&
    Number(settings?.rate_eur_xaf) > 0;
  const value = ratesAvailable
    ? convert(Number(amount), currency, display, {
        rate_usd_xaf: Number(settings!.rate_usd_xaf),
        rate_eur_xaf: Number(settings!.rate_eur_xaf),
      })
    : Number(amount);
  const shownCurrency = ratesAvailable ? display : currency;

  return (
    <span
      className={className}
      title={
        ratesAvailable
          ? undefined
          : "Taux de conversion non configurés ; devise d’origine affichée."
      }
    >
      {formatMoney(value, shownCurrency)}
    </span>
  );
}
