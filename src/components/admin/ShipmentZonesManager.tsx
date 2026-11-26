import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCoordinatePair } from "@/lib/coordinates";
import { trackingDb, type ShipmentZoneRole, type ShipmentZoneType } from "@/lib/tracking-db";

const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";

export function ShipmentZonesManager() {
  const queryClient = useQueryClient();
  const [zoneType, setZoneType] = useState<ShipmentZoneType>("stop");
  const [saving, setSaving] = useState(false);
  const zones = useQuery({
    queryKey: ["shipment-zones"],
    queryFn: async () => {
      const { data, error } = await trackingDb
        .from("shipment_zones")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });

  async function addZone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const point = parseCoordinatePair(
      String(values.get("latitude") ?? ""),
      String(values.get("longitude") ?? ""),
    );
    const radius = Number(String(values.get("radius") ?? "").trim());

    if (!name) {
      toast.error("Donnez un nom à la zone.");
      return;
    }
    if (!point.ok) {
      toast.error(point.error);
      return;
    }
    if (point.value.latitude === null || point.value.longitude === null) {
      toast.error("Le centre de la zone doit avoir une latitude et une longitude confirmées.");
      return;
    }
    if (!Number.isSafeInteger(radius) || radius <= 0) {
      toast.error("Le rayon doit être un nombre entier de mètres supérieur à zéro.");
      return;
    }

    let escalationAfterMinutes: number | null = null;
    let escalateToRole: ShipmentZoneRole | null = null;
    if (zoneType === "escalation") {
      const threshold = Number(String(values.get("threshold") ?? "").trim());
      const role = String(values.get("role") ?? "");
      if (!Number.isSafeInteger(threshold) || threshold <= 0) {
        toast.error("Indiquez le délai d’escalade en minutes, supérieur à zéro.");
        return;
      }
      if (!["super_admin", "admin", "logistique", "support"].includes(role)) {
        toast.error("Choisissez le rôle responsable de l’escalade.");
        return;
      }
      escalationAfterMinutes = threshold;
      escalateToRole = role as ShipmentZoneRole;
    }

    setSaving(true);
    const { error } = await trackingDb.from("shipment_zones").insert({
      name,
      zone_type: zoneType,
      center_latitude: point.value.latitude,
      center_longitude: point.value.longitude,
      radius_m: radius,
      escalation_after_minutes: escalationAfterMinutes,
      escalate_to_role: escalateToRole,
    });
    setSaving(false);

    if (error) {
      toast.error(`La zone n’a pas été enregistrée : ${error.message}`);
      return;
    }
    toast.success("Zone enregistrée, laissée inactive.");
    form.reset();
    setZoneType("stop");
    await queryClient.invalidateQueries({ queryKey: ["shipment-zones"] });
  }

  return (
    <section
      className="glass space-y-5 rounded-3xl p-5 md:p-6"
      aria-labelledby="shipment-zones-title"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Configuration du suivi
        </p>
        <h3 id="shipment-zones-title" className="mt-2 text-xl font-bold">
          Zones d’arrêt et d’escalade
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Les centres et rayons sont saisis manuellement. Les zones restent inactives : aucun flux
          GPS, contrôle continu, déclenchement ni notification d’escalade n’est configuré.
        </p>
      </div>

      <form onSubmit={addZone} className="space-y-4 rounded-2xl border border-border/70 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="zone-name">Nom de la zone</Label>
            <Input id="zone-name" name="name" maxLength={120} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-type">Type de zone</Label>
            <select
              id="zone-type"
              name="zoneType"
              className={selectClass}
              value={zoneType}
              onChange={(event) => setZoneType(event.target.value as ShipmentZoneType)}
            >
              <option value="stop">Zone d’arrêt</option>
              <option value="escalation">Zone avec règle d’escalade à définir</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="zone-latitude">Latitude du centre</Label>
            <Input
              id="zone-latitude"
              name="latitude"
              type="number"
              min={-90}
              max={90}
              step="any"
              inputMode="decimal"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-longitude">Longitude du centre</Label>
            <Input
              id="zone-longitude"
              name="longitude"
              type="number"
              min={-180}
              max={180}
              step="any"
              inputMode="decimal"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-radius">Rayon (mètres)</Label>
            <Input
              id="zone-radius"
              name="radius"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              required
            />
          </div>
        </div>

        {zoneType === "escalation" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zone-threshold">Seuil à définir (minutes)</Label>
              <Input
                id="zone-threshold"
                name="threshold"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-role">Rôle responsable</Label>
              <select id="zone-role" name="role" className={selectClass} required defaultValue="">
                <option value="" disabled>
                  Choisir un rôle
                </option>
                <option value="super_admin">Super administrateur</option>
                <option value="admin">Administrateur</option>
                <option value="logistique">Logistique</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>
        )}

        <Button type="submit" variant="hero" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer la zone inactive"}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold">Zones enregistrées</h4>
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={() => void zones.refetch()}
            disabled={zones.isFetching}
          >
            {zones.isFetching ? "Actualisation…" : "Actualiser"}
          </Button>
        </div>
        {zones.isLoading && <p className="text-sm text-muted-foreground">Chargement des zones…</p>}
        {zones.isError && (
          <div role="alert" className="space-y-2 text-sm text-destructive">
            <p>Impossible de charger les zones. Vérifiez les droits du compte connecté.</p>
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => void zones.refetch()}
              disabled={zones.isFetching}
            >
              Réessayer
            </Button>
          </div>
        )}
        {zones.isSuccess && zones.data.length === 0 && (
          <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
            Aucune zone enregistrée.
          </p>
        )}
        {zones.isSuccess && zones.data.length > 0 && (
          <ul className="space-y-2">
            {zones.data.map((zone) => (
              <li key={zone.id} className="rounded-2xl bg-secondary/50 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{zone.name}</p>
                  <span className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    Inactive — alertes non actives
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {zone.zone_type === "stop" ? "Arrêt" : "Escalade configurée"} · centre{" "}
                  {zone.center_latitude}, {zone.center_longitude} · rayon {zone.radius_m} m
                </p>
                {zone.zone_type === "escalation" && (
                  <p className="mt-1 text-muted-foreground">
                    Seuil : {zone.escalation_after_minutes} min · rôle : {zone.escalate_to_role}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
