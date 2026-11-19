import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/shop/ProductImage";
import { ProductCard } from "@/components/shop/ProductCard";
import { Price } from "@/components/shop/Price";
import { CurrencySwitch } from "@/components/shop/currency";
import { addToCart, type Product } from "@/lib/shop";
import { useUser } from "@/lib/site";

type ProductWithCategory = Product & { categories: { name: string } | null };

async function fetchProduct(slug: string): Promise<ProductWithCategory> {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data as ProductWithCategory;
}

export const Route = createFileRoute("/boutique/$slug")({
  loader: ({ params }) => fetchProduct(params.slug),
  head: ({ loaderData }) => {
    const product = loaderData as ProductWithCategory | undefined;
    const title = product ? `${product.name} | Afrinexa` : "Produit | Afrinexa";
    const description =
      product?.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
      (product
        ? `${product.name} — quantité minimale ${product.min_qty}, origine ${product.origin ?? "à confirmer"}. Prix hors transport, devis final sur demande.`
        : "Fiche produit Afrinexa : sourcing, informations et logistique Chine → Afrique → Europe.");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const initialProduct = Route.useLoaderData();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const productQuery = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
    initialData: initialProduct,
    staleTime: 60_000,
  });
  const similar = useQuery({
    queryKey: ["similar", initialProduct.id],
    enabled: !!initialProduct.category_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .eq("category_id", initialProduct.category_id!)
        .neq("id", initialProduct.id)
        .limit(4);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
  const favorite = useQuery({
    queryKey: ["favorite", user?.id, initialProduct.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user!.id)
        .eq("product_id", initialProduct.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  if (productQuery.isError) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-32 text-center">
        <p role="alert">Cette fiche produit n’a pas pu être chargée.</p>
        <Link to="/boutique" className="mt-3 inline-block text-accent underline">
          Retour à la boutique
        </Link>
      </div>
    );
  }
  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-28">
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const product = productQuery.data;
  const minQuantity = Math.max(1, product.min_qty);
  const currentQuantity = quantity ?? minQuantity;

  async function add() {
    if (!user) {
      toast("Connectez-vous pour ajouter au panier");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      await addToCart(user.id, product.id, currentQuantity);
      await queryClient.invalidateQueries({ queryKey: ["cart", user.id] });
      toast.success("Ajouté au panier", {
        action: { label: "Voir le panier", onClick: () => navigate({ to: "/panier" }) },
      });
    } catch (error) {
      toast.error((error as Error).message || "Impossible d’ajouter le produit au panier.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    const { error } = favorite.data
      ? await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id)
      : await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
    if (error) {
      toast.error("Impossible de mettre à jour vos favoris.");
      return;
    }
    await favorite.refetch();
  }

  const specs: [string, string | number | null][] = [
    ["Référence", product.reference],
    ["Catégorie", product.categories?.name ?? null],
    ["Quantité minimale", product.min_qty],
    ["Stock", product.stock],
    ["Poids", product.weight_kg ? `${product.weight_kg} kg` : null],
    ["Dimensions", product.dimensions],
    ["Origine", product.origin],
    ["Fournisseur", product.supplier],
    ["Délai estimatif", product.lead_time],
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-28">
      <Link to="/boutique" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Boutique
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <ProductImage
            path={product.images[imageIndex]}
            alt={product.name}
            className="aspect-square w-full rounded-3xl"
          />
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Afficher l’image ${index + 1} de ${product.name}`}
                  aria-pressed={imageIndex === index}
                  className={`shrink-0 overflow-hidden rounded-2xl border-2 ${imageIndex === index ? "border-accent" : "border-transparent"}`}
                >
                  <ProductImage path={image} alt="" className="size-16" />
                </button>
              ))}
            </div>
          )}
          {product.video_url && (
            <video
              src={product.video_url}
              controls
              preload="metadata"
              className="mt-3 w-full rounded-3xl"
              aria-label={`Vidéo du produit ${product.name}`}
            />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Price
              amount={product.price}
              currency={product.currency}
              className="font-display text-3xl font-bold text-gold"
            />
            <CurrencySwitch />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Prix unitaire indicatif, hors transport et frais. Le devis final est confirmé par un
            commercial.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="glass flex items-center rounded-full">
              <button
                type="button"
                className="p-3"
                onClick={() => setQuantity(Math.max(minQuantity, currentQuantity - 1))}
                aria-label="Diminuer la quantité"
              >
                <Minus className="size-4" />
              </button>
              <label className="sr-only" htmlFor="product-quantity">
                Quantité à commander
              </label>
              <input
                id="product-quantity"
                type="number"
                value={currentQuantity}
                min={minQuantity}
                max={product.stock ?? undefined}
                onChange={(event) => {
                  const requested = Math.max(
                    minQuantity,
                    Number(event.target.value) || minQuantity,
                  );
                  setQuantity(
                    product.stock === null ? requested : Math.min(requested, product.stock),
                  );
                }}
                className="w-14 bg-transparent text-center outline-none"
              />
              <button
                type="button"
                className="p-3"
                onClick={() =>
                  setQuantity(
                    product.stock === null
                      ? currentQuantity + 1
                      : Math.min(product.stock, currentQuantity + 1),
                  )
                }
                aria-label="Augmenter la quantité"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              variant="hero"
              size="xl"
              className="flex-1"
              disabled={busy || product.stock === 0}
              onClick={add}
            >
              <ShoppingBag /> {busy ? "Ajout…" : "Ajouter au panier"}
            </Button>
            <Button
              variant="glass"
              size="icon"
              className="size-12"
              onClick={toggleFavorite}
              aria-label={favorite.data ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={!!favorite.data}
            >
              <Heart className={favorite.data ? "fill-current text-gold" : ""} />
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Acompte selon les conditions du produit ou du devis. Si aucun acompte n’est défini, le
            paiement intégral peut être demandé.
          </p>
          {product.description && (
            <p className="mt-6 whitespace-pre-line text-muted-foreground">{product.description}</p>
          )}
          <dl className="glass mt-6 grid grid-cols-2 gap-4 rounded-3xl p-5 text-sm">
            {specs
              .filter(([, value]) => value !== null && value !== "")
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
          </dl>
          <Button asChild variant="glass" className="mt-5 w-full">
            <Link to={user ? "/messages" : "/auth"}>
              {user ? "Contacter un agent" : "Connectez-vous pour contacter un agent"}
            </Link>
          </Button>
        </div>
      </div>
      {!!similar.data?.length && (
        <>
          <h2 className="mt-14 text-xl font-bold">Produits similaires</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.data.map((item) => (
              <ProductCard key={item.id} p={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
