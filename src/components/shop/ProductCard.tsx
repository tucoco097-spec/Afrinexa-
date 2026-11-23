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
  tone = "default",
}: {
  p: ProductCardData;
  categoryName?: string | null;
  tone?: "default" | "light";
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
      toast.success("Ajouté au panier");
      navigate({ to: "/panier" });
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
    <article
      className={`flex h-full flex-col overflow-hidden rounded-3xl shadow-card transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-glow motion-reduce:transform-none motion-reduce:transition-none ${tone === "light" ? "border border-slate-200 bg-white text-slate-900 hover:border-amber-400/70" : "glass hover:border-accent/35"}`}
    >
      <div className="relative">
        <Link
          to="/boutique/$slug"
          params={{ slug: p.slug }}
          className="group/product block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`Voir le produit ${p.name}`}
        >
          <div className="aspect-square overflow-hidden">
            <ProductImage
              path={p.images[0]}
              alt={p.name}
              className="size-full transition-transform duration-500 ease-out group-hover/product:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            />
          </div>
        </Link>
        {user && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-3 top-3 z-10 h-10 w-10 rounded-full border-slate-200 bg-white/95 text-slate-800 shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-accent"
            onClick={toggleFavorite}
            aria-label={favorite.data ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={!!favorite.data}
          >
            <Heart className={favorite.data ? "size-4 fill-current text-gold" : "size-4"} />
          </Button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {shownCategory && (
          <p
            className={`mb-1 text-xs font-medium ${tone === "light" ? "text-slate-500" : "text-accent"}`}
          >
            {shownCategory}
          </p>
        )}
        <Link
          to="/boutique/$slug"
          params={{ slug: p.slug }}
          className={`line-clamp-2 min-h-10 text-sm font-semibold hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${tone === "light" ? "text-slate-900" : ""}`}
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
          className={`mt-2 block font-display font-bold ${tone === "light" ? "text-amber-700" : "text-gold"}`}
        />
        <div className="mt-auto grid grid-cols-1 gap-2 pt-4 xl:grid-cols-2">
          <Button
            asChild
            variant={tone === "light" ? "outline" : "glass"}
            size="sm"
            className="min-h-11 w-full min-w-0 whitespace-normal px-2 text-center leading-tight"
          >
            <Link to="/boutique/$slug" params={{ slug: p.slug }}>
              Voir le produit
            </Link>
          </Button>
          <Button
            variant="hero"
            size="sm"
            className="min-h-11 w-full min-w-0 px-2"
            onClick={add}
            disabled={busy || p.stock === 0}
            aria-label={`Ajouter ${p.name} au panier`}
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            <span>{busy ? "Ajout…" : "Ajouter"}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
