import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LogOut, MessageSquare, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShipmentCard, type ShipmentRow } from "@/components/site/ShipmentCard";
import { ProductImage } from "@/components/shop/ProductImage";
import { formatMoney, type Currency } from "@/lib/money";
import { fmtDate } from "@/lib/site";
import { AccountSettings } from "@/components/auth/AccountSettings";

export const Route = createFileRoute("/_authenticated/espace")({
  head: () => ({
    meta: [
      { title: "Mon espace — Afrinexa" },
      { name: "description", content: "Vos commandes et expéditions." },
      { property: "og:title", content: "Mon espace — Afrinexa" },
      { property: "og:description", content: "Espace client" },
    ],
  }),
  component: Espace,
});

function Espace() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profile = useQuery({
    queryKey: ["me", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const orders = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const ships = useQuery({
    queryKey: ["my-ships", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, orders(order_number)")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ShipmentRow[];
    },
  });
  const favorites = useQuery({
    queryKey: ["my-favorites", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id, products(id, name, slug, images, price, currency)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function out() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour</p>
          <h1 className="text-3xl font-bold md:text-4xl">
            {profile.data?.full_name || user.email}
          </h1>
        </div>
        <Button variant="glass" onClick={out}>
          <LogOut /> Déconnexion
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button asChild variant="hero">
          <Link to="/panier">
            <ShoppingBag /> Mon panier
          </Link>
        </Button>
        <Button asChild variant="glass">
          <Link to="/messages">
            <MessageSquare /> Ma messagerie
          </Link>
        </Button>
      </div>

      {profile.isError && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
        >
          <p className="text-sm text-destructive">Impossible de charger votre profil.</p>
          <Button
            type="button"
            size="sm"
            variant="glass"
            onClick={() => void profile.refetch()}
            disabled={profile.isFetching}
          >
            {profile.isFetching ? "Nouvel essai…" : "Réessayer"}
          </Button>
        </div>
      )}

      <AccountSettings user={user} profile={profile.data} />

      <h2 className="mt-10 text-xl font-bold">Mes expéditions</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ships.isLoading && [1, 2, 3].map((k) => <Skeleton key={k} className="h-48 rounded-3xl" />)}
        {ships.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 md:col-span-2 lg:col-span-3"
          >
            <p className="text-sm text-destructive">Impossible de charger vos expéditions.</p>
            <Button
              type="button"
              size="sm"
              variant="glass"
              onClick={() => void ships.refetch()}
              disabled={ships.isFetching}
            >
              {ships.isFetching ? "Nouvel essai…" : "Réessayer"}
            </Button>
          </div>
        )}
        {ships.isSuccess && ships.data.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune expédition pour le moment.</p>
        )}
        {ships.data?.map((s) => (
          <ShipmentCard key={s.id} s={s} />
        ))}
      </div>

      <h2 className="mt-12 flex items-center gap-2 text-xl font-bold">
        <Heart className="size-5 text-gold" /> Mes favoris
      </h2>
      {favorites.isLoading && <Skeleton className="mt-4 h-24 rounded-3xl" />}
      {favorites.isError && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
        >
          <p className="text-sm text-destructive">Impossible de charger vos favoris.</p>
          <Button
            type="button"
            size="sm"
            variant="glass"
            onClick={() => void favorites.refetch()}
            disabled={favorites.isFetching}
          >
            {favorites.isFetching ? "Nouvel essai…" : "Réessayer"}
          </Button>
        </div>
      )}
      {favorites.isSuccess && favorites.data.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">Aucun favori pour le moment.</p>
      )}
      {!!favorites.data?.length && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.data.map(
            (favorite) =>
              favorite.products && (
                <Link
                  key={favorite.product_id}
                  to="/boutique/$slug"
                  params={{ slug: favorite.products.slug }}
                  className="glass flex items-center gap-3 rounded-3xl p-3 hover:border-accent"
                >
                  <ProductImage
                    path={favorite.products.images[0]}
                    alt={favorite.products.name}
                    className="size-16 shrink-0 rounded-2xl"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{favorite.products.name}</span>
                    <span className="block text-sm text-gold">
                      {formatMoney(
                        Number(favorite.products.price),
                        favorite.products.currency as Currency,
                      )}
                    </span>
                  </span>
                </Link>
              ),
          )}
        </div>
      )}

      <h2 className="mt-12 text-xl font-bold">Mes commandes</h2>
      <div className="glass mt-4 overflow-x-auto rounded-3xl">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-4">Numéro</th>
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.isLoading && (
              <tr>
                <td colSpan={5} className="p-4 text-muted-foreground">
                  Chargement de vos commandes…
                </td>
              </tr>
            )}
            {orders.isError && (
              <tr>
                <td colSpan={5}>
                  <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <p className="text-sm text-destructive">Impossible de charger vos commandes.</p>
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
                </td>
              </tr>
            )}
            {orders.isSuccess && orders.data.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-muted-foreground">
                  Aucune commande.
                </td>
              </tr>
            )}
            {orders.data?.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-4 font-semibold">{o.order_number}</td>
                <td className="p-4">{fmtDate(o.created_at)}</td>
                <td className="p-4">{o.description}</td>
                <td className="p-4">
                  {Number(o.total_amount).toLocaleString("fr-FR")} {o.currency}
                </td>
                <td className="p-4">{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
