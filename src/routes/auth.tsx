import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Afrinexa" },
      { name: "description", content: "Connectez-vous ou créez votre compte client Afrinexa." },
      { property: "og:title", content: "Connexion — Afrinexa" },
      { property: "og:description", content: "Accédez à votre espace client." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const googleOAuthEnabled = import.meta.env["VITE_GOOGLE_OAUTH_ENABLED"] === "true";
  const navigate = useNavigate();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setLoading(true);

    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Email ou mot de passe incorrect.");
          return;
        }
        await navigate({ to: "/espace" });
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/espace`,
          data: {
            full_name: String(form.get("name") ?? "").trim(),
            phone: String(form.get("phone") ?? "").trim(),
          },
        },
      });
      if (error) {
        const message = /already registered|already exists/i.test(error.message)
          ? "Un compte utilise déjà cette adresse email. Essayez de vous connecter."
          : "L’inscription est indisponible pour le moment. Réessayez plus tard.";
        toast.error(message);
        return;
      }
      setSent(true);
    } catch {
      toast.error("Le service de connexion est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    if (!googleOAuthEnabled) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/espace` },
      });
      if (error) {
        const isDisabled = /provider.*(not enabled|unsupported)|unsupported provider/i.test(
          error.message,
        );
        toast.error(
          isDisabled
            ? "La connexion Google n’est pas encore activée sur Supabase. Utilisez l’email en attendant."
            : "La connexion Google est indisponible pour le moment.",
        );
      }
    } catch {
      toast.error("La connexion Google est indisponible pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-5 pt-24">
      <div className="glass w-full rounded-3xl p-7 shadow-card">
        {sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Vérifiez vos emails</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cliquez sur le lien reçu pour activer votre compte.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">
              {mode === "in" ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Retrouvez vos commandes et vos expéditions dans votre espace client.
            </p>

            <Button
              type="button"
              variant="glass"
              size="xl"
              className="mt-6 w-full"
              onClick={continueWithGoogle}
              disabled={loading || !googleOAuthEnabled}
            >
              <span aria-hidden="true" className="font-bold text-accent">
                G
              </span>
              {googleOAuthEnabled ? "Continuer avec Google" : "Google non configuré"}
            </Button>
            {!googleOAuthEnabled && (
              <p role="status" className="mt-2 text-center text-xs text-muted-foreground">
                La connexion Google sera disponible après activation du fournisseur Supabase. Vous
                pouvez continuer avec votre email.
              </p>
            )}

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>ou avec votre email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "up" && (
                <>
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" name="name" autoComplete="name" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className="mt-1.5"
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
                {loading ? "…" : mode === "in" ? "Se connecter" : "Créer mon compte"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "in"
                ? "Pas encore de compte ? Inscrivez-vous"
                : "Déjà un compte ? Connectez-vous"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
