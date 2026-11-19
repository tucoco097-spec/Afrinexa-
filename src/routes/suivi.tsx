import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Plane, Ship, MapPin, CalendarClock, PackageX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrackForm } from "@/components/site/TrackForm";
import { ShipmentMap } from "@/components/site/ShipmentMap";
import type { Coordinates } from "@/components/site/ShipmentMap";
import { Skeleton } from "@/components/ui/skeleton";
import { progressFor, modeLabel, type Mode } from "@/lib/statuses";
import { fmtDate, fmtDateTime } from "@/lib/site";

type Tracked = {
  tracking_code: string;
  mode: Mode;
  origin: string;
  destination: string;
  status: string;
  eta: string | null;
  carrier: string | null;
  packages: number | null;
  created_at: string;
  origin_coordinates?: unknown;
  destination_coordinates?: unknown;
  origin_latitude?: number | string | null;
  origin_longitude?: number | string | null;
  destination_latitude?: number | string | null;
  destination_longitude?: number | string | null;
  last_position?: unknown;
  events: {
    status: string;
    location: string | null;
    note: string | null;
    source: string;
    occurred_at: string;
    coordinates?: unknown;
    latitude?: number | string | null;
    longitude?: number | string | null;
  }[];
};

function parseCoordinates(
  value: unknown,
  latitude?: unknown,
  longitude?: unknown,
): Coordinates | null {
  let lat = latitude;
  let lon = longitude;
  if (Array.isArray(value)) {
    [lat, lon] = value;
  } else if (value && typeof value === "object") {
    const point = value as Record<string, unknown>;
    lat = point["latitude"] ?? point["lat"] ?? lat;
    lon = point["longitude"] ?? point["lng"] ?? point["lon"] ?? lon;
  }
  if (lat === undefined || lon === undefined || lat === null || lon === null) return null;
  const numericLat = Number(lat);
  const numericLon = Number(lon);
  if (
    !Number.isFinite(numericLat) ||
    !Number.isFinite(numericLon) ||
    numericLat < -90 ||
    numericLat > 90 ||
    numericLon < -180 ||
    numericLon > 180
  ) {
    return null;
  }
  return [numericLat, numericLon];
}

function locationFrom(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const location = (value as Record<string, unknown>)["location"];
  return typeof location === "string" ? location : null;
}

export const Route = createFileRoute("/suivi")({
  validateSearch: (s: Record<string, unknown>): { q: string | undefined } => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Suivi de colis — Afrinexa" },
      {
        name: "description",
        content:
          "Suivez votre marchandise avec votre code de suivi, numéro de commande, AWB, BL, booking ou conteneur.",
      },
      { property: "og:title", content: "Suivi de colis — Afrinexa" },
      {
        property: "og:description",
        content: "Suivez vos expéditions aériennes et maritimes Chine → Afrique → Europe.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { q } = Route.useSearch();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["track", q],
    enabled: !!q,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("track_shipment", { _q: q! });
      if (error) throw error;
      return data as unknown as Tracked | null;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 pb-10 pt-32">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Suivi en ligne</p>
      <h1 className="mt-3 text-4xl font-bold md:text-5xl">Où est ma marchandise ?</h1>
      <div className="mt-8">
        <TrackForm key={q} initial={q ?? ""} />
      </div>

      {q && isLoading && (
        <div className="mt-10 space-y-4">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      )}

      {q && isError && (
        <div
          role="alert"
          className="glass mt-10 rounded-3xl border border-destructive/30 p-8 text-center"
        >
          <p className="font-semibold">Le service de suivi est momentanément indisponible.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre expédition n’a pas été marquée comme introuvable. Réessayez plus tard ou{" "}
            <Link to="/contact" className="text-accent underline">
              contactez-nous
            </Link>
            .
          </p>
        </div>
      )}

      {q && !isLoading && !isError && !data && (
        <div className="glass mt-10 rounded-3xl p-10 text-center">
          <PackageX className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">Aucune expédition trouvée pour « {q} »</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Vérifiez le code ou{" "}
            <Link to="/contact" className="text-accent underline">
              contactez-nous
            </Link>
            .
          </p>
        </div>
      )}

      {data && <Result t={data} />}
    </div>
  );
}

function Result({ t }: { t: Tracked }) {
  const pct = progressFor(t.mode, t.status);
  const Icon = t.mode === "air" ? Plane : Ship;
  const originCoordinates = parseCoordinates(
    t.origin_coordinates,
    t.origin_latitude,
    t.origin_longitude,
  );
  const destinationCoordinates = parseCoordinates(
    t.destination_coordinates,
    t.destination_latitude,
    t.destination_longitude,
  );
  const lastEventWithCoordinates = t.events.find(
    (event) => parseCoordinates(event.coordinates, event.latitude, event.longitude) !== null,
  );
  const lastPositionCoordinates =
    parseCoordinates(t.last_position) ??
    (lastEventWithCoordinates
      ? parseCoordinates(
          lastEventWithCoordinates.coordinates,
          lastEventWithCoordinates.latitude,
          lastEventWithCoordinates.longitude,
        )
      : null);
  const lastPosition = lastPositionCoordinates
    ? {
        location: locationFrom(t.last_position) ?? lastEventWithCoordinates?.location ?? null,
        coordinates: lastPositionCoordinates,
      }
    : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 space-y-5"
    >
      <div className="glass rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Code de suivi</p>
            <p className="font-display text-2xl font-bold tracking-wide">{t.tracking_code}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
            <Icon className="size-4 text-accent" />
            {modeLabel(t.mode)}
          </span>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Statut actuel</p>
        <p className="text-xl font-semibold text-gold">{t.status}</p>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label="Progression de l’expédition"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <motion.div
            className="h-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <Info icon={MapPin} label="Départ" value={t.origin} />
          <Info icon={MapPin} label="Destination" value={t.destination} />
          <Info
            icon={CalendarClock}
            label="Arrivée estimée"
            value={t.eta ? fmtDate(t.eta) : "À confirmer"}
          />
        </div>
      </div>

      <ShipmentMap
        origin={t.origin}
        destination={t.destination}
        lastLocation={t.events[0]?.location ?? null}
        originCoordinates={originCoordinates}
        destinationCoordinates={destinationCoordinates}
        lastPosition={lastPosition}
        mode={t.mode}
      />

      <div className="glass rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-bold">Historique</h2>
        {t.events.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun événement enregistré pour le moment.
          </p>
        ) : (
          <ol className="relative mt-6 space-y-6 border-l border-border pl-6">
            {t.events.map((e, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative"
              >
                <span
                  className={`absolute -left-[31px] top-1 size-3 rounded-full ${i === 0 ? "bg-accent shadow-glow" : "bg-muted-foreground"}`}
                />
                <p className="font-semibold">{e.status}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDateTime(e.occurred_at)}
                  {e.location ? ` · ${e.location}` : ""} ·{" "}
                  {e.source === "api" ? "Automatique" : "Saisie manuelle"}
                </p>
                {e.note && <p className="mt-1 text-sm text-muted-foreground">{e.note}</p>}
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </motion.div>
  );
}

function Info({ icon: I, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <I className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
