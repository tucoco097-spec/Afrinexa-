import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  const navigate = useNavigate();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")),
      password = String(f.get("password"));
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error("Email ou mot de passe incorrect");
        return;
      }
      navigate({ to: "/espace" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: String(f.get("name")), phone: String(f.get("phone")) },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
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
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "up" && (
                <>
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" name="name" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" name="phone" className="mt-1.5" />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
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
