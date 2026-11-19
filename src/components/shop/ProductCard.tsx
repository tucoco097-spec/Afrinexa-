import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { addToCart, type Product } from "@/lib/shop";
import { useUser } from "@/lib/site";
import { ProductImage } from "./ProductImage";
import { Price } from "./Price";

type ProductCardData = Product & {
  categories?: { name: string } | null;
};

export function ProductCard({
  p,
  categoryName,
}: {
  p: ProductCardData;
  categoryName?: string | null;
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const favorite = useQuery({
    queryKey: ["favorite", user?.id, p.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user!.id)
        .eq("product_id", p.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
  const [busy, setBusy] = useState(false);
  const shownCategory = categoryName ?? p.categories?.name ?? null;

  async function add() {
    if (!user) {
      toast("Connectez-vous pour ajouter au panier");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      await addToCart(user.id, p.id, p.min_qty);
      await queryClient.invalidateQueries({ queryKey: ["cart", user.id] });
      toast.success("Ajouté au panier", {
        action: { label: "Voir", onClick: () => navigate({ to: "/panier" }) },
      });
    } catch (error) {
      toast.error((error as Error).message || "Impossible d’ajouter ce produit au panier.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!user) return;
    const { error } = favorite.data
      ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", p.id)
      : await supabase.from("favorites").insert({ user_id: user.id, product_id: p.id });
    if (error) {
      toast.error("Impossible de mettre à jour vos favoris.");
      return;
    }
    await favorite.refetch();
  }

  return (
    <article className="glass overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-glow">
      <Link
        to="/boutique/$slug"
        params={{ slug: p.slug }}
        className="group block"
        aria-label={`Voir le produit ${p.name}`}
      >
        <div className="aspect-square overflow-hidden">
          <ProductImage
            path={p.images[0]}
            alt={p.name}
            className="size-full transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-4">
        {shownCategory && <p className="mb-1 text-xs font-medium text-accent">{shownCategory}</p>}
        <Link
          to="/boutique/$slug"
          params={{ slug: p.slug }}
          className="line-clamp-2 min-h-10 text-sm font-semibold hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {p.name}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Réf. {p.reference} · min. {p.min_qty}
          {p.stock === null ? " · Stock sur demande" : ` · Stock : ${p.stock}`}
        </p>
        <Price
          amount={p.price}
          currency={p.currency}
          className="mt-2 block font-display font-bold text-gold"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="glass" size="sm" className="min-w-0 flex-1">
            <Link to="/boutique/$slug" params={{ slug: p.slug }}>
              Voir le produit
            </Link>
          </Button>
          <Button
            variant="hero"
            size="sm"
            className="min-w-0 flex-1"
            onClick={add}
            disabled={busy || p.stock === 0}
            aria-label={`Ajouter ${p.name} au panier`}
          >
            <ShoppingBag className="size-4" />
            {busy ? "Ajout…" : "Ajouter"}
          </Button>
          {user && (
            <Button
              variant="glass"
              size="icon"
              className="size-9 shrink-0"
              onClick={toggleFavorite}
              aria-label={favorite.data ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={!!favorite.data}
            >
              <Heart className={favorite.data ? "size-4 fill-current text-gold" : "size-4"} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
