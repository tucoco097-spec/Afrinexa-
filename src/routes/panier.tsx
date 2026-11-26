import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2, MessageSquare, ShoppingBag, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/shop/ProductImage";
import { useCart } from "@/lib/shop";
import { useUser } from "@/lib/site";
import { formatMoney, type Currency } from "@/lib/money";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Mon panier — Afrinexa" },
      {
        name: "description",
        content: "Votre sélection de produits, transmise à un commercial pour devis.",
      },
      { property: "og:title", content: "Mon panier — Afrinexa" },
      { property: "og:description", content: "Votre sélection de produits." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user, ready } = useUser();
  const cart = useCart(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const items = cart.data?.items ?? [];

  async function submitCart() {
    const cartId = cart.data?.cartId;
    if (!cartId || !items.length || submitting) return;
    setSubmitting(true);
    try {
      const { data: conversationId, error } = await supabase.rpc("submit_cart", {
        _cart_id: cartId,
      });
      if (error) throw error;
      if (!conversationId)
        throw new Error("La discussion associée à votre commande est introuvable.");
      await Promise.all([
        cart.refresh(),
        qc.invalidateQueries({ queryKey: ["cart-card", cartId] }),
        qc.invalidateQueries({ queryKey: ["my-convs", user?.id] }),
      ]);
      toast.success("Votre panier validé a été transmis au super administrateur.");
      navigate({ to: "/messages", search: { conversation: conversationId } });
    } catch (error) {
      toast.error((error as Error).message || "Impossible de transmettre votre commande.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setQty(id: string, q: number) {
    const { error } =
      q <= 0
        ? await supabase.from("cart_items").delete().eq("id", id)
        : await supabase.from("cart_items").update({ quantity: q }).eq("id", id);
    if (error) toast.error(error.message);
    cart.refresh();
    qc.invalidateQueries({ queryKey: ["cart-card"] });
  }

  if (ready && !user)
    return (
      <div className="mx-auto max-w-md px-5 pt-36 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-4 font-semibold">Connectez-vous pour voir votre panier</p>
        <Button asChild variant="hero" className="mt-4">
          <Link to="/auth">Connexion</Link>
        </Button>
      </div>
    );

  const totals = items.reduce<Record<string, number>>((a, i) => {
    a[i.currency] = (a[i.currency] ?? 0) + Number(i.unit_price) * i.quantity;
    return a;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-5 pb-10 pt-28">
      <h1 className="text-3xl font-bold md:text-4xl">Mon panier</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Vérifiez vos articles puis validez pour transmettre le panier complet dans votre discussion
        avec le super administrateur.
      </p>
      <div className="mt-6 space-y-3">
        {cart.isLoading && <Skeleton className="h-28 rounded-3xl" />}
        {cart.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
          >
            <p className="text-sm text-destructive">
              Impossible de charger votre panier. Vos articles ne sont pas considérés comme
              supprimés.
            </p>
            <Button
              type="button"
              size="sm"
              variant="glass"
              onClick={() => void cart.refetch()}
              disabled={cart.isFetching}
            >
              {cart.isFetching ? "Nouvel essai…" : "Réessayer"}
            </Button>
          </div>
        )}
        {cart.data && items.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="font-semibold">Votre panier est vide</p>
            <Button asChild variant="hero" className="mt-4">
              <Link to="/boutique">Voir la boutique</Link>
            </Button>
          </div>
        )}
        {items.map((i) => (
          <div key={i.id} className="glass flex gap-4 rounded-3xl p-4">
            <ProductImage path={i.image} alt={i.name} className="size-20 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              {i.products?.slug ? (
                <Link
                  to="/boutique/$slug"
                  params={{ slug: i.products.slug }}
                  className="font-semibold hover:text-accent"
                >
                  {i.name}
                </Link>
              ) : (
                <p className="font-semibold">{i.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Réf. {i.reference}
                {i.supplier ? ` · ${i.supplier}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatMoney(Number(i.unit_price), i.currency)} / unité
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center rounded-full bg-secondary">
                  <button
                    type="button"
                    className="p-2"
                    onClick={() => setQty(i.id, i.quantity - 1)}
                    aria-label={`Diminuer la quantité de ${i.name}`}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm">{i.quantity}</span>
                  <button
                    type="button"
                    className="p-2"
                    onClick={() => setQty(i.id, i.quantity + 1)}
                    aria-label={`Augmenter la quantité de ${i.name}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="font-semibold text-gold">
                  {formatMoney(Number(i.unit_price) * i.quantity, i.currency)}
                </p>
                <button
                  type="button"
                  onClick={() => setQty(i.id, 0)}
                  aria-label={`Supprimer ${i.name} du panier`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="glass mt-6 rounded-3xl p-5">
          {Object.entries(totals).map(([c, v]) => (
            <p key={c} className="flex justify-between text-lg font-bold">
              <span>Total estimatif</span>
              <span className="text-gold">{formatMoney(v, c as Currency)}</span>
            </p>
          ))}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="hero"
              size="xl"
              className="flex-1"
              disabled={submitting || !cart.data?.cartId}
              onClick={() => void submitCart()}
            >
              {submitting ? <LoaderCircle className="animate-spin" /> : <MessageSquare />}
              {submitting ? "Envoi en cours…" : "Valider et envoyer ma commande"}
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link to="/boutique">Continuer mes achats</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
