import { useEffect, useState } from "react";
import type { Currency } from "@/lib/money";

const KEY = "afx-currency";
const listeners = new Set<(c: Currency) => void>();

export function useDisplayCurrency(): [Currency, (c: Currency) => void] {
  const [c, setC] = useState<Currency>("XAF");
  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Currency | null;
    if (saved) setC(saved);
    listeners.add(setC);
    return () => {
      listeners.delete(setC);
    };
  }, []);
  return [
    c,
    (n) => {
      localStorage.setItem(KEY, n);
      listeners.forEach((l) => l(n));
    },
  ];
}

export function CurrencySwitch() {
  const [c, set] = useDisplayCurrency();
  return (
    <div
      className="glass inline-flex min-h-11 items-center rounded-full p-1 text-xs"
      role="group"
      aria-label="Choisir la devise d’affichage"
    >
      {(["XAF", "USD", "EUR"] as Currency[]).map((currency) => (
        <button
          key={currency}
          type="button"
          onClick={() => set(currency)}
          aria-pressed={c === currency}
          aria-label={`Afficher les prix en ${currency === "XAF" ? "franc CFA (FCFA)" : currency}`}
          className={`min-h-9 rounded-full px-3 py-1.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${c === currency ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {currency === "XAF" ? "FCFA" : currency}
        </button>
      ))}
    </div>
  );
}
