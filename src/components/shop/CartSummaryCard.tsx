import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductImage } from "./ProductImage";
import { formatMoney, type Currency } from "@/lib/money";
import { fmtDateTime } from "@/lib/site";
import type { CartItem } from "@/lib/shop";

/** Live summary of a cart, read from structured cart rows (not from message text). */
export function CartSummaryCard({
  cartId,
  clientName,
}: {
  cartId: string;
  clientName?: string | null | undefined;
}) {
  const q = useQuery({
    queryKey: ["cart-card", cartId],
    queryFn: async () => {
      const [{ data: cart }, { data: items }] = await Promise.all([
        supabase
          .from("carts")
          .select("status, created_at, updated_at")
          .eq("id", cartId)
          .maybeSingle(),
        supabase.from("cart_items").select("*").eq("cart_id", cartId).order("created_at"),
      ]);
      return { cart, items: (items ?? []) as CartItem[] };
    },
  });
  const items = q.data?.items ?? [];
  const totals = items.reduce<Record<string, number>>((a, i) => {
    a[i.currency] = (a[i.currency] ?? 0) + Number(i.unit_price) * i.quantity;
    return a;
  }, {});
  const statusLabel: Record<string, string> = {
    submitted: "Commande validée",
    quoted: "Devis préparé",
    confirmed: "Confirmée",
    closed: "Clôturée",
  };
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-gold/30 bg-card">
      <div className="flex min-w-0 items-center gap-2 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold">
        <ShoppingBag className="size-4" /> Sélection panier
        {q.data?.cart && q.data.cart.status !== "open"
          ? ` · ${statusLabel[q.data.cart.status] ?? q.data.cart.status}`
          : ""}
      </div>
      <div className="space-y-3 p-4">
        {clientName && <p className="text-xs text-muted-foreground">Client : {clientName}</p>}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Panier vide.</p>}
        {items.map((i) => (
          <div key={i.id} className="flex min-w-0 gap-3">
            <ProductImage path={i.image} alt={i.name} className="size-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{i.name}</p>
              <p className="text-xs text-muted-foreground">
                Réf. {i.reference} · {i.quantity} × {formatMoney(Number(i.unit_price), i.currency)}
              </p>
            </div>
            <p className="min-w-0 shrink text-right text-sm font-semibold">
              {formatMoney(Number(i.unit_price) * i.quantity, i.currency)}
            </p>
          </div>
        ))}
        {items.length > 0 && (
          <div className="border-t pt-3 text-sm">
            {Object.entries(totals).map(([c, v]) => (
              <p
                key={c}
                className="flex min-w-0 flex-wrap justify-between gap-x-3 gap-y-1 font-bold"
              >
                <span>Total estimatif</span>
                <span className="min-w-0 break-words text-right text-gold">
                  {formatMoney(v, c as Currency)}
                </span>
              </p>
            ))}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Mis à jour le {fmtDateTime(q.data?.cart?.updated_at)} · hors transport et frais
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
