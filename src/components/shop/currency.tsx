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
    <div className="glass inline-flex rounded-full p-1 text-xs">
      {(["XAF", "USD", "EUR"] as Currency[]).map((x) => (
        <button
          key={x}
          onClick={() => set(x)}
          className={`rounded-full px-3 py-1.5 ${c === x ? "bg-brand text-primary-foreground" : "text-muted-foreground"}`}
        >
          {x === "XAF" ? "FCFA" : x}
        </button>
      ))}
    </div>
  );
}
