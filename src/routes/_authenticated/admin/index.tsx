import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShipmentCard, type ShipmentRow } from "@/components/site/ShipmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

function count(table: "profiles" | "orders" | "shipments") {
  return async () =>
    (await supabase.from(table).select("*", { count: "exact", head: true })).count ?? 0;
}

function Dashboard() {
  const clients = useQuery({ queryKey: ["c-clients"], queryFn: count("profiles") });
  const orders = useQuery({ queryKey: ["c-orders"], queryFn: count("orders") });
  const ships = useQuery({
    queryKey: ["admin-ships"],
    queryFn: async () =>
      ((
        await supabase
          .from("shipments")
          .select("*, orders(order_number)")
          .order("created_at", { ascending: false })
          .limit(200)
      ).data ?? []) as ShipmentRow[],
  });
  const [q, setQ] = useState("");
  const list = (ships.data ?? []).filter(
    (s) => !q || JSON.stringify(s).toLowerCase().includes(q.toLowerCase()),
  );
  const inTransit = (ships.data ?? []).filter((s) => s.status !== "Livré").length;
  const stats = [
    ["Clients", clients.data],
    ["Commandes", orders.data],
    ["Expéditions", ships.data?.length],
    ["En cours", inTransit],
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l as string} className="glass rounded-3xl p-5">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-2 font-display text-3xl font-bold">{v ?? "…"}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Expéditions</h2>
        <Input
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ships.isLoading && [1, 2, 3].map((k) => <Skeleton key={k} className="h-48 rounded-3xl" />)}
        {ships.data && list.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune expédition. Créez d'abord une commande, puis une expédition depuis l'onglet
            Commandes.
          </p>
        )}
        {list.map((s) => (
          <ShipmentCard key={s.id} s={s} adminLink />
        ))}
      </div>
    </>
  );
}
