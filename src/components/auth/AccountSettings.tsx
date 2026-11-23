import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { KeyRound, LoaderCircle, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getPasswordStrength } from "@/lib/password-strength";

type ProfileFields =
  | {
      full_name: string | null;
      phone: string | null;
      country: string | null;
      city: string | null;
      address: string | null;
    }
  | null
  | undefined;

type AccountSettingsProps = {
  user: User;
  profile: ProfileFields;
};

export function AccountSettings({ user, profile }: AccountSettingsProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState<string | undefined>();
  const [phone, setPhone] = useState<string | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [address, setAddress] = useState<string | undefined>();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const passwordStrength = getPasswordStrength(newPassword);
  const metadata = user.user_metadata as Record<string, unknown>;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      full_name: String(form.get("full_name") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim() || null,
      country: String(form.get("country") ?? "").trim() || null,
      city: String(form.get("city") ?? "").trim() || null,
      address: String(form.get("address") ?? "").trim() || null,
    };
    if (!values.full_name) {
      toast.error("Veuillez saisir votre nom complet.");
      return;
    }

    setSavingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (error || !data) {
        toast.error("Votre profil n’a pas pu être enregistré. Réessayez.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["me", user.id] });
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Votre profil n’a pas pu être enregistré. Réessayez.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error(
        "Choisissez un mot de passe d’au moins 8 caractères, avec majuscules, minuscules et chiffre.",
      );
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error("Le mot de passe n’a pas pu être modifié. Réessayez.");
        return;
      }
      setNewPassword("");
      setConfirmation("");
      toast.success("Mot de passe modifié.");
    } catch {
      toast.error("Le mot de passe n’a pas pu être modifié. Réessayez.");
    } finally {
      setSavingPassword(false);
    }
  }

  const displayName =
    profile?.full_name ?? (typeof metadata["full_name"] === "string" ? metadata["full_name"] : "");
  const displayPhone =
    profile?.phone ?? (typeof metadata["phone"] === "string" ? metadata["phone"] : "");
  const displayCountry =
    profile?.country ?? (typeof metadata["country"] === "string" ? metadata["country"] : "");

  return (
    <section className="mt-8" aria-labelledby="account-settings-title">
      <div className="mb-4 flex items-center gap-2">
        <UserRound className="size-5 text-gold" aria-hidden="true" />
        <h2 id="account-settings-title" className="text-xl font-bold">
          Mon profil et ma sécurité
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="glass rounded-3xl p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold">Informations personnelles</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ces informations complètent votre profil Afrinexa.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="profile-name">Nom complet</Label>
              <Input
                id="profile-name"
                name="full_name"
                autoComplete="name"
                required
                value={fullName ?? displayName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                value={user.email ?? ""}
                disabled
                readOnly
                className="mt-1.5 opacity-70"
              />
            </div>
            <div>
              <Label htmlFor="profile-phone">Téléphone</Label>
              <Input
                id="profile-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone ?? displayPhone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="profile-country">Pays</Label>
              <Input
                id="profile-country"
                name="country"
                autoComplete="country-name"
                value={country ?? displayCountry}
                onChange={(event) => setCountry(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="profile-city">Ville</Label>
              <Input
                id="profile-city"
                name="city"
                autoComplete="address-level2"
                value={city ?? profile?.city ?? ""}
                onChange={(event) => setCity(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="profile-address">Adresse</Label>
              <Input
                id="profile-address"
                name="address"
                autoComplete="street-address"
                value={address ?? profile?.address ?? ""}
                onChange={(event) => setAddress(event.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-gold-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            {savingProfile && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Enregistrer le profil
          </button>
        </form>

        <form onSubmit={changePassword} className="glass rounded-3xl p-5 md:p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-gold" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold">Changer le mot de passe</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre nouveau mot de passe est géré de façon sécurisée par Supabase Auth.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="account-new-password">Nouveau mot de passe</Label>
              <Input
                id="account-new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-1.5"
              />
              <div
                className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground"
                aria-live="polite"
              >
                <span>Robustesse : {newPassword ? passwordStrength.label : "—"}</span>
                <span>8 caractères minimum</span>
              </div>
            </div>
            <div>
              <Label htmlFor="account-confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="account-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-gold/50 px-5 text-sm font-semibold text-foreground transition hover:bg-gold/10 disabled:opacity-60"
          >
            {savingPassword && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Mettre à jour le mot de passe
          </button>
        </form>
      </div>
    </section>
  );
}
