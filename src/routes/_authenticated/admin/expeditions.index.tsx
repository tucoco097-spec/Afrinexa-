import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, RefreshCw, Search, Truck } from "lucide-react";
import { ShipmentZonesManager } from "@/components/admin/ShipmentZonesManager";
import { ShipmentCard, type ShipmentRow } from "@/components/site/ShipmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/expeditions/")({
  component: AdminExpeditions,
});

const PAGE_SIZE = 50;

type ModeFilter = "all" | "air" | "sea";

function AdminExpeditions() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ModeFilter>("all");
  const shipments = useInfiniteQuery({
    queryKey: ["admin-expeditions"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from("shipments")
        .select(
          "id, tracking_code, shipment_number, mode, origin, destination, status, eta, orders(order_number)",
        )
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as ShipmentRow[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
    retry: false,
  });

  const rows = useMemo(() => shipments.data?.pages.flat() ?? [], [shipments.data]);
  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("fr-FR");
    return rows.filter((shipment) => {
      if (mode !== "all" && shipment.mode !== mode) return false;
      const haystack = [
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
        .toLocaleLowerCase("fr-FR");
      return !text || haystack.includes(text);
    });
  }, [mode, query, rows]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Suivi opérationnel
          </p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold">
            <Truck className="size-6 text-accent" aria-hidden="true" /> Expéditions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recherchez un colis puis ouvrez sa fiche pour gérer ses étapes confirmées.
          </p>
        </div>
        <Button
          type="button"
          variant="glass"
          onClick={() => void shipments.refetch()}
          disabled={shipments.isFetching}
        >
          <RefreshCw aria-hidden="true" /> Actualiser
        </Button>
      </header>

      <aside
        className="flex gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm"
        role="note"
      >
        <MapPin className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
        <p className="text-muted-foreground">
          Vous pouvez maintenant saisir des coordonnées manuellement sur la fiche d’une expédition.
          Seules les positions confirmées seront montrées sur la carte publique. Aucun GPS
          automatique ni déclenchement d’alerte n’est configuré.
        </p>
      </aside>

      <ShipmentZonesManager />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Code, commande, lieu ou statut…"
            aria-label="Rechercher une expédition"
            className="pl-9"
          />
        </label>
        <select
          aria-label="Filtrer par mode de transport"
          value={mode}
          onChange={(event) => setMode(event.target.value as ModeFilter)}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm sm:w-48"
        >
          <option value="all">Tous les modes</option>
          <option value="air">Aérien</option>
          <option value="sea">Maritime</option>
        </select>
      </div>

      {shipments.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
        >
          <p className="text-sm text-destructive">
            Impossible de charger les expéditions. Une erreur n’est pas présentée comme une liste
            vide.
          </p>
          <Button
            type="button"
            variant="glass"
            onClick={() => void (rows.length ? shipments.fetchNextPage() : shipments.refetch())}
            disabled={shipments.isFetching}
          >
            {shipments.isFetching ? "Nouvel essai…" : "Réessayer"}
          </Button>
        </div>
      )}

      {shipments.isLoading && rows.length === 0 && (
        <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
          Chargement des expéditions…
        </p>
      )}

      {shipments.isSuccess && filtered.length === 0 && (
        <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
          {rows.length === 0
            ? "Aucune expédition enregistrée dans les données disponibles."
            : shipments.hasNextPage
              ? `Aucune correspondance parmi les ${rows.length} expéditions déjà chargées. Chargez-en davantage pour rechercher dans les plus anciennes.`
              : "Aucune expédition ne correspond à cette recherche ou à ce filtre."}
        </p>
      )}

      {filtered.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} résultat{filtered.length === 1 ? "" : "s"} affiché
            {filtered.length === 1 ? "" : "s"} parmi {rows.length} chargé
            {rows.length === 1 ? "" : "s"}.
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((shipment) => (
              <ShipmentCard key={shipment.id} s={shipment} adminLink />
            ))}
          </div>
        </>
      )}

      {shipments.hasNextPage && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="glass"
            onClick={() => void shipments.fetchNextPage()}
            disabled={shipments.isFetchingNextPage}
          >
            {shipments.isFetchingNextPage ? "Chargement…" : "Charger plus d’expéditions"}
          </Button>
        </div>
      )}
    </div>
  );
}
