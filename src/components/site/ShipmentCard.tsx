import { Link } from "@tanstack/react-router";
import { Plane, Ship, Copy } from "lucide-react";
import { toast } from "sonner";
import { progressFor, modeLabel, type Mode } from "@/lib/statuses";
import { fmtDate } from "@/lib/site";

export type ShipmentRow = {
  id: string;
  tracking_code: string | null;
  shipment_number: string;
  mode: string;
  origin: string;
  destination: string;
  status: string;
  eta: string | null;
  orders?: { order_number: string } | null;
};

export function ShipmentCard({ s, adminLink }: { s: ShipmentRow; adminLink?: boolean }) {
  const Icon = s.mode === "air" ? Plane : Ship;
  const pct = progressFor(s.mode as Mode, s.status);
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            onClick={() => {
              navigator.clipboard.writeText(s.tracking_code ?? "");
              toast.success("Code copié");
            }}
            className="flex items-center gap-2 font-display text-lg font-bold"
          >
            {s.tracking_code} <Copy className="size-3.5 text-muted-foreground" />
          </button>
          <p className="text-xs text-muted-foreground">
            {s.shipment_number}
            {s.orders ? ` · ${s.orders.order_number}` : ""}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs">
          <Icon className="size-3.5 text-accent" />
          {modeLabel(s.mode)}
        </span>
      </div>
      <p className="mt-4 text-sm">
        <span className="text-muted-foreground">{s.origin}</span> → {s.destination}
      </p>
      <p className="mt-1 text-sm font-semibold text-gold">{s.status}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Arrivée estimée : {fmtDate(s.eta)}</span>
        {adminLink ? (
          <Link
            to="/admin/expeditions/$id"
            params={{ id: s.id }}
            className="font-semibold text-accent"
          >
            Gérer →
          </Link>
        ) : (
          <Link
            to="/suivi"
            search={{ q: s.tracking_code ?? "" }}
            className="font-semibold text-accent"
          >
            Suivre ma marchandise →
          </Link>
        )}
      </div>
    </div>
  );
}
