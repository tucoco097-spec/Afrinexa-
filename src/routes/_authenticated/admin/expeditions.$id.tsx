import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    queryFn: async () =>
      (
        await supabase
          .from("shipments")
          .select("*, orders(order_number), profiles(full_name, email, phone)")
          .eq("id", id)
          .single()
      ).data,
  });
  const ev = useQuery({
    queryKey: ["ship-ev", id],
    queryFn: async () =>
      (
        await supabase
          .from("shipment_events")
          .select("*")
          .eq("shipment_id", id)
          .order("occurred_at", { ascending: false })
      ).data ?? [],
  });

  async function addEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const when = String(f.get("when"));
    const { error } = await supabase.from("shipment_events").insert({
      shipment_id: id,
      status: String(f.get("status")),
      location: String(f.get("location")) || null,
      public_note: String(f.get("public")) || null,
      internal_note: String(f.get("internal")) || null,
      occurred_at: when ? new Date(when).toISOString() : new Date().toISOString(),
    });
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
    await supabase.from("shipment_events").delete().eq("id", eid);
    qc.invalidateQueries({ queryKey: ["ship-ev", id] });
  }

  if (!s.data) return <p className="text-muted-foreground">Chargement…</p>;
  const d = s.data;
  const mode = d.mode as Mode;
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
              onClick={() => {
                navigator.clipboard.writeText(d.tracking_code ?? "");
                toast.success("Code copié");
              }}
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
            </div>
            <div>
              <Label>Date et heure</Label>
              <Input name="when" type="datetime-local" />
            </div>
          </div>
          <div>
            <Label>Commentaire visible par le client</Label>
            <Textarea name="public" />
          </div>
          <div>
            <Label>Commentaire interne</Label>
            <Textarea name="internal" />
          </div>
          <Button type="submit" variant="hero" className="w-full">
            Enregistrer
          </Button>
        </form>

        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-bold">Historique</h3>
          <ol className="mt-4 space-y-4">
            {ev.data?.map((e) => (
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
                {e.public_note && <p className="mt-1">{e.public_note}</p>}
                {e.internal_note && (
                  <p className="mt-1 text-xs text-gold">Interne : {e.internal_note}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
