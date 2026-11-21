import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Package, Search, Truck, Users } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShipmentCard, type ShipmentRow } from "@/components/site/ShipmentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

type CountTable = "orders" | "shipments";

function count(table: CountTable) {
  return async () => {
    const { count: total, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return total ?? 0;
  };
}

function Dashboard() {
  const [query, setQuery] = useState("");
  const clients = useQuery({
    queryKey: ["admin-count", "clients"],
    queryFn: async () => {
      const { count: total, error } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "client");
      if (error) throw error;
      return total ?? 0;
    },
  });
  const orders = useQuery({ queryKey: ["admin-count", "orders"], queryFn: count("orders") });
  const shipments = useQuery({
    queryKey: ["admin-count", "shipments"],
    queryFn: count("shipments"),
  });
  const inTransit = useQuery({
    queryKey: ["admin-count", "shipments-in-transit"],
    queryFn: async () => {
      const { count: total, error } = await supabase
        .from("shipments")
        .select("id", { count: "exact", head: true })
        .neq("status", "Livré");
      if (error) throw error;
      return total ?? 0;
    },
  });
  const recent = useQuery({
    queryKey: ["admin-ships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select(
          "id, tracking_code, shipment_number, mode, origin, destination, status, eta, orders(order_number)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ShipmentRow[];
    },
  });

  const metricError = clients.isError || orders.isError || shipments.isError || inTransit.isError;
  const filtered = (recent.data ?? []).filter((shipment) =>
    [
      shipment.tracking_code,
      shipment.shipment_number,
      shipment.orders?.order_number,
      shipment.origin,
      shipment.destination,
      shipment.status,
      shipment.mode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const stats = [
    { label: "Clients", value: clients.data, query: clients, icon: Users },
    { label: "Commandes", value: orders.data, query: orders, icon: ClipboardList },
    { label: "Expéditions", value: shipments.data, query: shipments, icon: Package },
    { label: "En cours", value: inTransit.data, query: inTransit, icon: Truck },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Vue d’ensemble
          </p>
          <h2 className="mt-2 text-2xl font-bold">Activité</h2>
        </div>
        <Button asChild variant="hero">
          <Link to="/admin/produits">
            <Package aria-hidden="true" /> Gérer les produits
          </Link>
        </Button>
      </div>

      {metricError && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          <p className="font-semibold">Certaines métriques sont indisponibles.</p>
          <p className="mt-1 text-muted-foreground">
            Vérifiez la connexion et la configuration Supabase. Les erreurs ne sont pas affichées
            comme des zéros.
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, query: result, icon: Icon }) => (
          <div key={label} className="glass rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-secondary text-accent">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-bold">
              {result.isError ? "—" : result.isLoading ? "…" : value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8" aria-labelledby="recent-shipments-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Suivi opérationnel
            </p>
            <h2 id="recent-shipments-title" className="mt-2 text-xl font-bold">
              Expéditions récentes
            </h2>
          </div>
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un code ou une destination…"
              aria-label="Rechercher une expédition"
              className="pl-9"
            />
          </div>
        </div>

        {recent.isLoading && (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-48 rounded-3xl" />
            ))}
          </div>
        )}
        {recent.isError && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm"
          >
            Les expéditions ne peuvent pas être chargées. Aucune liste vide n’est présentée comme un
            résultat réel.
          </div>
        )}
        {recent.isSuccess && filtered.length === 0 && (
          <p className="mt-4 rounded-2xl border border-border p-5 text-sm text-muted-foreground">
            {recent.data.length === 0
              ? "Aucune expédition enregistrée dans les données disponibles."
              : "Aucune expédition ne correspond à cette recherche."}
          </p>
        )}
        {recent.isSuccess && filtered.length > 0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((shipment) => (
              <ShipmentCard key={shipment.id} s={shipment} adminLink />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
