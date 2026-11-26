import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Plus, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate } from "@/lib/site";
import { statusesFor, type Mode } from "@/lib/statuses";

export const Route = createFileRoute("/_authenticated/admin/commandes")({ component: Orders });

const sel = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

function Orders() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);
  const [shipFor, setShipFor] = useState<{ id: string; order_number: string } | null>(null);
  const [shipmentMode, setShipmentMode] = useState<Mode>("air");
  const clients = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, profiles(full_name, email), shipments(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
  const orderClientIds = [...new Set((orders.data ?? []).map((order) => order.client_id))];
  const clientConversations = useQuery({
    queryKey: ["admin-order-conversations", orderClientIds],
    enabled: orderClientIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, client_id, archived_at")
        .in("client_id", orderClientIds)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });

  async function createOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const client_id = String(f.get("client"));
    if (!client_id) {
      toast.error("Choisissez un client");
      return;
    }
    const { error } = await supabase.from("orders").insert({
      client_id,
      agent_id: user.id,
      description: String(f.get("description")),
      total_amount: Number(f.get("total") || 0),
      currency: String(f.get("currency")),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Commande créée");
    setNewOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  async function createShipment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!shipFor) return;
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim() || null;
    const mode = String(f.get("mode")) as Mode;
    const origin = v("origin");
    const destination = v("destination");
    const status = String(f.get("status") ?? "");
    if (!origin || !destination) {
      toast.error("Renseignez le départ et la destination confirmés.");
      return;
    }
    if (!statusesFor(mode).includes(status)) {
      toast.error("Choisissez un statut confirmé pour ce mode de transport.");
      return;
    }
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        order_id: shipFor.id,
        client_id: user.id /* replaced server-side by the order's client */,
        mode,
        origin,
        destination,
        carrier: v("carrier"),
        awb: v("awb"),
        bl: v("bl"),
        booking: v("booking"),
        container: v("container"),
        eta: v("eta"),
        weight_kg: v("weight") ? Number(v("weight")) : null,
        volume_cbm: v("cbm") ? Number(v("cbm")) : null,
        packages: v("packages") ? Number(v("packages")) : null,
        status,
      })
      .select("id, tracking_code")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const { error: eventError } = await supabase.from("shipment_events").insert({
      shipment_id: data.id,
      status,
      public_note: "Expédition créée.",
    });
    if (eventError) {
      toast.error(
        "Expédition créée, mais son étape initiale n’a pas été enregistrée. Vérifiez la fiche avant de communiquer le suivi.",
      );
    } else {
      toast.success(`Code de suivi généré : ${data.tracking_code ?? "créé"}`);
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin-orders"] }),
      qc.invalidateQueries({ queryKey: ["admin-ships"] }),
      qc.invalidateQueries({ queryKey: ["admin-expeditions"] }),
      qc.invalidateQueries({ queryKey: ["admin-count"] }),
    ]);
    setShipFor(null);
    navigate({ to: "/admin/expeditions/$id", params: { id: data.id } });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gestion des commandes</h2>
        <Button variant="hero" onClick={() => setNewOpen(true)}>
          <Plus /> Créer une nouvelle commande
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {orders.isLoading && (
          <p className="text-sm text-muted-foreground">Chargement des commandes…</p>
        )}
        {orders.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
          >
            <p className="text-sm text-destructive">Impossible de charger les commandes.</p>
            <Button
              type="button"
              size="sm"
              variant="glass"
              onClick={() => void orders.refetch()}
              disabled={orders.isFetching}
            >
              {orders.isFetching ? "Nouvel essai…" : "Réessayer"}
            </Button>
          </div>
        )}
        {clientConversations.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
          >
            <p className="text-sm text-destructive">
              Impossible de vérifier les discussions des clients.
            </p>
            <Button
              type="button"
              size="sm"
              variant="glass"
              onClick={() => void clientConversations.refetch()}
              disabled={clientConversations.isFetching}
            >
              {clientConversations.isFetching ? "Nouvel essai…" : "Réessayer"}
            </Button>
          </div>
        )}
        {orders.isSuccess && orders.data.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune commande.</p>
        )}
        {orders.isSuccess &&
          orders.data.map((o) => (
            <div
              key={o.id}
              className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5"
            >
              <div>
                <p className="font-display font-bold">{o.order_number}</p>
                <p className="text-sm text-muted-foreground">
                  {o.profiles?.full_name || o.profiles?.email} · {fmtDate(o.created_at)}
                </p>
                {o.description && <p className="mt-1 text-sm">{o.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {Number(o.total_amount).toLocaleString("fr-FR")} {o.currency}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {o.shipments?.length ?? 0} expédition(s)
                </span>
                <Button
                  size="sm"
                  variant="glass"
                  disabled={
                    clientConversations.isLoading ||
                    !clientConversations.data?.some(
                      (conversation) =>
                        conversation.client_id === o.client_id && !conversation.archived_at,
                    )
                  }
                  onClick={() =>
                    navigate({ to: "/admin/conversations", search: { client: o.client_id } })
                  }
                  title="Ouvrir la discussion active du client"
                >
                  <MessageCircle /> Voir la discussion
                </Button>
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() => {
                    setShipmentMode("air");
                    setShipFor(o);
                  }}
                >
                  <Truck /> Créer une expédition
                </Button>
              </div>
            </div>
          ))}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle commande</DialogTitle>
          </DialogHeader>
          <form onSubmit={createOrder} className="space-y-4">
            <div>
              <Label>Client</Label>
              <select name="client" className={sel} required defaultValue="">
                <option value="" disabled>
                  Choisir un client…
                </option>
                {clients.data?.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card">
                    {c.full_name || "Sans nom"} — {c.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Le client doit d'abord avoir créé son compte.
              </p>
              {clients.isError && (
                <div
                  role="alert"
                  className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-destructive"
                >
                  <span>Les clients ne peuvent pas être chargés.</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="glass"
                    onClick={() => void clients.refetch()}
                    disabled={clients.isFetching}
                  >
                    {clients.isFetching ? "Nouvel essai…" : "Réessayer"}
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>Articles / description</Label>
              <Textarea name="description" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Montant total</Label>
                <Input name="total" type="number" step="0.01" />
              </div>
              <div>
                <Label>Devise</Label>
                <select name="currency" className={sel}>
                  <option value="XAF">FCFA</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shipFor} onOpenChange={(o) => !o && setShipFor(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expédition pour {shipFor?.order_number}</DialogTitle>
          </DialogHeader>
          <form onSubmit={createShipment} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Mode</Label>
              <select
                name="mode"
                className={sel}
                value={shipmentMode}
                onChange={(event) => setShipmentMode(event.target.value as Mode)}
                required
              >
                <option value="air">Aérien</option>
                <option value="sea">Maritime</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Statut initial confirmé</Label>
              <select key={shipmentMode} name="status" className={sel} defaultValue="" required>
                <option value="" disabled>
                  Choisir un statut observé…
                </option>
                {statusesFor(shipmentMode).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Sélectionnez uniquement une étape réellement confirmée.
              </p>
            </div>
            <div>
              <Label>Départ</Label>
              <Input name="origin" placeholder="Lieu de départ confirmé" required />
            </div>
            <div>
              <Label>Destination</Label>
              <Input name="destination" placeholder="Destination confirmée" required />
            </div>
            <div>
              <Label>Transporteur</Label>
              <Input name="carrier" />
            </div>
            <div>
              <Label>Arrivée estimée</Label>
              <Input name="eta" type="date" />
            </div>
            <div>
              <Label>AWB</Label>
              <Input name="awb" />
            </div>
            <div>
              <Label>BL</Label>
              <Input name="bl" />
            </div>
            <div>
              <Label>Booking</Label>
              <Input name="booking" />
            </div>
            <div>
              <Label>Conteneur</Label>
              <Input name="container" />
            </div>
            <div>
              <Label>Poids (kg)</Label>
              <Input name="weight" type="number" step="0.01" />
            </div>
            <div>
              <Label>Volume (CBM)</Label>
              <Input name="cbm" type="number" step="0.001" />
            </div>
            <div>
              <Label>Colis</Label>
              <Input name="packages" type="number" />
            </div>
            <Button type="submit" variant="hero" className="col-span-2 mt-2">
              Créer et générer le code
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
