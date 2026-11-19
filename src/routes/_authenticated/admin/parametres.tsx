import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsQuery } from "@/lib/site";
import type { FormEvent } from "react";

export const Route = createFileRoute("/_authenticated/admin/parametres")({ component: Settings });

const FIELDS = [
  ["company_name", "Nom de l'entreprise"],
  ["slogan", "Slogan"],
  ["phone", "Téléphone"],
  ["whatsapp", "WhatsApp"],
  ["email", "Email"],
  ["address_china", "Adresse en Chine"],
  ["address_cameroon", "Adresse au Cameroun"],
  ["tracking_prefix", "Préfixe des codes de suivi (ex. AFX)"],
  ["rate_usd_xaf", "Taux : 1 USD en FCFA"],
  ["rate_eur_xaf", "Taux : 1 EUR en FCFA"],
] as const;

function Settings() {
  const qc = useQueryClient();
  const s = useQuery(settingsQuery);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rawUsd = String(f.get("rate_usd_xaf") ?? "").trim();
    const rawEur = String(f.get("rate_eur_xaf") ?? "").trim();
    const rateUsd = Number(rawUsd);
    const rateEur = Number(rawEur);
    if (!rawUsd || !Number.isFinite(rateUsd) || rateUsd <= 0) {
      toast.error("Saisissez un taux USD/FCFA positif.");
      return;
    }
    if (!rawEur || !Number.isFinite(rateEur) || rateEur <= 0) {
      toast.error("Saisissez un taux EUR/FCFA positif.");
      return;
    }
    const patch: Record<string, string | null> = {};
    FIELDS.forEach(([k]) => {
      if (k !== "rate_usd_xaf" && k !== "rate_eur_xaf") {
        patch[k] = String(f.get(k) ?? "").trim() || null;
      }
    });
    if (!patch["company_name"]) patch["company_name"] = "Afrinexa";
    patch["tracking_prefix"] =
      (patch["tracking_prefix"] ?? "AFX")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6) || "AFX";
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("site_settings")
      .update({
        ...patch,
        rate_usd_xaf: rateUsd,
        rate_eur_xaf: rateEur,
        rates_updated_at: now,
        updated_at: now,
      } as never)
      .eq("id", 1);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paramètres enregistrés");
    await qc.invalidateQueries({ queryKey: ["site_settings"] });
  }
  if (s.isLoading) return <p role="status">Chargement des paramètres…</p>;
  if (s.isError)
    return (
      <p role="alert">
        Impossible de charger les paramètres. Vérifiez les droits d’administration.
      </p>
    );
  if (!s.data) return null;
  return (
    <form onSubmit={save} className="glass max-w-2xl space-y-4 rounded-3xl p-6">
      <h2 className="text-xl font-bold">Informations du site</h2>
      <p className="text-sm text-muted-foreground">
        Les taux sont gérés dans ces paramètres. Aucun taux n’est appliqué tant qu’une valeur
        positive valide n’est pas enregistrée.
      </p>
      {FIELDS.map(([k, l]) => (
        <div key={k}>
          <Label htmlFor={k}>{l}</Label>
          <Input
            id={k}
            name={k}
            type={k === "rate_usd_xaf" || k === "rate_eur_xaf" ? "number" : "text"}
            min={k === "rate_usd_xaf" || k === "rate_eur_xaf" ? "0.000001" : undefined}
            step={k === "rate_usd_xaf" || k === "rate_eur_xaf" ? "any" : undefined}
            required={k === "rate_usd_xaf" || k === "rate_eur_xaf"}
            defaultValue={String((s.data as unknown as Record<string, unknown>)[k] ?? "")}
            className="mt-1.5"
          />
        </div>
      ))}
      <Button type="submit" variant="hero">
        Enregistrer
      </Button>
    </form>
  );
}
