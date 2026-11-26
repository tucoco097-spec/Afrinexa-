import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseCoordinatePair } from "@/lib/coordinates";
import {
  trackingDb,
  type ShipmentCoordinates,
  type ShipmentEventCoordinates,
} from "@/lib/tracking-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { statusesFor, INCIDENT_STATUSES, modeLabel, progressFor, type Mode } from "@/lib/statuses";
import { fmtDateTime, fmtDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/expeditions/$id")({
  component: ShipmentAdmin,
});

const sel = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

function ShipmentAdmin() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const s = useQuery({
    queryKey: ["ship", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, orders(order_number), profiles(full_name, email, phone)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    retry: false,
  });
  const ev = useQuery({
    queryKey: ["ship-ev", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipment_events")
        .select("*")
        .eq("shipment_id", id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });

  const [savingCoordinates, setSavingCoordinates] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  async function saveCoordinates(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const origin = parseCoordinatePair(
      String(f.get("origin_latitude") ?? ""),
      String(f.get("origin_longitude") ?? ""),
    );
    const destination = parseCoordinatePair(
      String(f.get("destination_latitude") ?? ""),
      String(f.get("destination_longitude") ?? ""),
    );
    if (!origin.ok) {
      toast.error(`Départ : ${origin.error}`);
      return;
    }
    if (!destination.ok) {
      toast.error(`Destination : ${destination.error}`);
      return;
    }

    setSavingCoordinates(true);
    const { error } = await trackingDb
      .from("shipments")
      .update({
        origin_latitude: origin.value.latitude,
        origin_longitude: origin.value.longitude,
        destination_latitude: destination.value.latitude,
        destination_longitude: destination.value.longitude,
      })
      .eq("id", id);
    setSavingCoordinates(false);

    if (error) {
      toast.error(`Les coordonnées n’ont pas été enregistrées : ${error.message}`);
      return;
    }
    toast.success("Coordonnées enregistrées et confirmées par Supabase");
    await Promise.all([s.refetch(), qc.invalidateQueries({ queryKey: ["admin-expeditions"] })]);
  }

  async function addEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const when = String(f.get("when"));
    const coordinates = parseCoordinatePair(
      String(f.get("latitude") ?? ""),
      String(f.get("longitude") ?? ""),
    );
    if (!coordinates.ok) {
      toast.error(coordinates.error);
      return;
    }

    setSavingEvent(true);
    const { error } = await trackingDb.from("shipment_events").insert({
      shipment_id: id,
      status: String(f.get("status")),
      location: String(f.get("location")) || null,
      public_note: String(f.get("public")) || null,
      internal_note: String(f.get("internal")) || null,
      occurred_at: when ? new Date(when).toISOString() : new Date().toISOString(),
      latitude: coordinates.value.latitude,
      longitude: coordinates.value.longitude,
    });
    setSavingEvent(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Événement ajouté");
    form.reset();
    qc.invalidateQueries({ queryKey: ["ship", id] });
    qc.invalidateQueries({ queryKey: ["ship-ev", id] });
  }

  async function delEvent(eid: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    const { error } = await supabase.from("shipment_events").delete().eq("id", eid);
    if (error) {
      toast.error("Impossible de supprimer cet événement.");
      return;
    }
    toast.success("Événement supprimé");
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["ship", id] }),
      qc.invalidateQueries({ queryKey: ["ship-ev", id] }),
    ]);
  }

  if (s.isLoading) return <p className="text-muted-foreground">Chargement de l’expédition…</p>;
  if (s.isError || !s.data) {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-5"
      >
        <p className="text-sm text-destructive">Impossible de charger cette expédition.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="glass"
            onClick={() => void s.refetch()}
            disabled={s.isFetching}
          >
            {s.isFetching ? "Nouvel essai…" : "Réessayer"}
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link to="/admin/expeditions">Retour aux expéditions</Link>
          </Button>
        </div>
      </div>
    );
  }
  const d = s.data;
  const shipmentCoordinates = d as typeof d & ShipmentCoordinates;
  const mode = d.mode as Mode;

  async function copyTrackingCode() {
    if (!d.tracking_code) return;
    try {
      await navigator.clipboard.writeText(d.tracking_code);
      toast.success("Code copié");
    } catch {
      toast.error("Impossible de copier le code de suivi sur cet appareil.");
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {d.shipment_number} · {d.orders?.order_number} · {modeLabel(d.mode)}
            </p>
            <button
              type="button"
              onClick={() => void copyTrackingCode()}
              disabled={!d.tracking_code}
              aria-label={
                d.tracking_code
                  ? `Copier le code de suivi ${d.tracking_code}`
                  : "Aucun code de suivi disponible"
              }
              className="mt-1 flex items-center gap-2 font-display text-3xl font-bold"
            >
              {d.tracking_code}
              <Copy className="size-4 text-muted-foreground" />
            </button>
            <p className="mt-1 text-sm">
              Client : {d.profiles?.full_name || d.profiles?.email}{" "}
              {d.profiles?.phone ? `· ${d.profiles.phone}` : ""}
            </p>
          </div>
          <Button asChild variant="glass" size="sm">
            <Link to="/suivi" search={{ q: d.tracking_code ?? "" }}>
              Voir la page publique
            </Link>
          </Button>
        </div>
        <p className="mt-5 font-semibold text-gold">{d.status}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-brand" style={{ width: `${progressFor(mode, d.status)}%` }} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {[
            ["Départ", d.origin],
            ["Destination", d.destination],
            ["Transporteur", d.carrier],
            ["Arrivée estimée", fmtDate(d.eta)],
            ["AWB", d.awb],
            ["BL", d.bl],
            ["Booking", d.booking],
            ["Conteneur", d.container],
            ["Poids", d.weight_kg ? `${d.weight_kg} kg` : null],
            ["Volume", d.volume_cbm ? `${d.volume_cbm} CBM` : null],
            ["Colis", d.packages],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      <form onSubmit={saveCoordinates} className="glass space-y-4 rounded-3xl p-6">
        <div>
          <h3 className="text-lg font-bold">Coordonnées confirmées</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Saisie manuelle uniquement. Les coordonnées renseignées seront visibles publiquement
            avec le code de suivi; ne saisissez que des positions autorisées et vérifiées.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="font-semibold">Départ — {d.origin}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="origin-latitude">Latitude</Label>
                <Input
                  id="origin-latitude"
                  name="origin_latitude"
                  type="number"
                  min={-90}
                  max={90}
                  step="any"
                  inputMode="decimal"
                  defaultValue={shipmentCoordinates.origin_latitude ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="origin-longitude">Longitude</Label>
                <Input
                  id="origin-longitude"
                  name="origin_longitude"
                  type="number"
                  min={-180}
                  max={180}
                  step="any"
                  inputMode="decimal"
                  defaultValue={shipmentCoordinates.origin_longitude ?? ""}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {shipmentCoordinates.origin_coordinates_confirmed_at
                ? `Confirmées le ${fmtDateTime(shipmentCoordinates.origin_coordinates_confirmed_at)}`
                : "Aucune coordonnée confirmée."}
            </p>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="font-semibold">Destination — {d.destination}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="destination-latitude">Latitude</Label>
                <Input
                  id="destination-latitude"
                  name="destination_latitude"
                  type="number"
                  min={-90}
                  max={90}
                  step="any"
                  inputMode="decimal"
                  defaultValue={shipmentCoordinates.destination_latitude ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="destination-longitude">Longitude</Label>
                <Input
                  id="destination-longitude"
                  name="destination_longitude"
                  type="number"
                  min={-180}
                  max={180}
                  step="any"
                  inputMode="decimal"
                  defaultValue={shipmentCoordinates.destination_longitude ?? ""}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {shipmentCoordinates.destination_coordinates_confirmed_at
                ? `Confirmées le ${fmtDateTime(shipmentCoordinates.destination_coordinates_confirmed_at)}`
                : "Aucune coordonnée confirmée."}
            </p>
          </fieldset>
        </div>
        <Button type="submit" variant="hero" disabled={savingCoordinates}>
          {savingCoordinates ? "Enregistrement…" : "Enregistrer les coordonnées"}
        </Button>
      </form>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={addEvent} className="glass space-y-3 rounded-3xl p-6">
          <h3 className="text-lg font-bold">Ajouter un événement</h3>
          <div>
            <Label>Statut</Label>
            <select name="status" className={sel} defaultValue={d.status}>
              {statusesFor(mode).map((x) => (
                <option key={x} className="bg-card">
                  {x}
                </option>
              ))}
              {INCIDENT_STATUSES.map((x) => (
                <option key={x} className="bg-card">
                  {x}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lieu</Label>
              <Input name="location" />
              <p className="mt-1 text-xs text-muted-foreground">
                Lieu textuel confirmé; ce champ ne fournit pas de coordonnées GPS.
              </p>
            </div>
            <div>
              <Label>Date et heure</Label>
              <Input name="when" type="datetime-local" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event-latitude">Latitude confirmée (facultatif)</Label>
              <Input
                id="event-latitude"
                name="latitude"
                type="number"
                min={-90}
                max={90}
                step="any"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor="event-longitude">Longitude confirmée (facultatif)</Label>
              <Input
                id="event-longitude"
                name="longitude"
                type="number"
                min={-180}
                max={180}
                step="any"
                inputMode="decimal"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Laissez les deux champs vides si aucune coordonnée fiable n’est disponible.
          </p>
          <div>
            <Label>Commentaire visible par le client</Label>
            <Textarea name="public" />
          </div>
          <div>
            <Label>Commentaire interne</Label>
            <Textarea name="internal" />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={savingEvent}>
            {savingEvent ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>

        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-bold">Historique</h3>
          <ol className="mt-4 space-y-4">
            {ev.isLoading && (
              <li className="text-sm text-muted-foreground">Chargement de l’historique…</li>
            )}
            {ev.isError && (
              <li role="alert" className="space-y-2 text-sm text-destructive">
                <p>Historique indisponible; il n’est pas présenté comme vide.</p>
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => void ev.refetch()}
                  disabled={ev.isFetching}
                >
                  {ev.isFetching ? "Nouvel essai…" : "Réessayer"}
                </Button>
              </li>
            )}
            {ev.isSuccess && ev.data.length === 0 && (
              <li className="text-sm text-muted-foreground">Aucun événement enregistré.</li>
            )}
            {ev.isSuccess &&
              ev.data.map((row) => {
                const e = row as typeof row & ShipmentEventCoordinates;
                return (
                  <li key={e.id} className="rounded-2xl bg-secondary/60 p-4 text-sm">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold">{e.status}</p>
                      <button onClick={() => delEvent(e.id)} className="text-xs text-destructive">
                        Supprimer
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtDateTime(e.occurred_at)}
                      {e.location ? ` · ${e.location}` : ""} · {e.source}
                    </p>
                    {e.latitude !== null && e.longitude !== null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Coordonnées confirmées : {e.latitude}, {e.longitude}
                        {e.coordinates_confirmed_at
                          ? ` · ${fmtDateTime(e.coordinates_confirmed_at)}`
                          : ""}
                      </p>
                    )}
                    {e.public_note && <p className="mt-1">{e.public_note}</p>}
                    {e.internal_note && (
                      <p className="mt-1 text-xs text-gold">Interne : {e.internal_note}</p>
                    )}
                  </li>
                );
              })}
          </ol>
        </div>
      </div>
    </div>
  );
}
