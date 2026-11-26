import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductImage } from "@/components/shop/ProductImage";
import { categoriesQuery, slugify, type Product } from "@/lib/shop";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/admin/produits")({
  component: AdminProducts,
});
const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

type FilterKey = "all" | "published" | "hidden";

function AdminProducts() {
  const queryClient = useQueryClient();
  const categories = useQuery(categoriesQuery);
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
  const [edit, setEdit] = useState<Partial<Product> | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState<FilterKey>("all");

  function open(product: Partial<Product>) {
    setEdit(product);
    setImages(product.images ?? []);
  }

  async function upload(files: FileList | null) {
    if (!files?.length || uploading) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error } = await supabase.storage.from("products").upload(path, file);
        if (error) toast.error("L’image n’a pas pu être téléversée.");
        else setImages((current) => [...current, path]);
      }
    } catch {
      toast.error("L’image n’a pas pu être téléversée.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) {
      toast.info("Attendez la fin du téléversement des photos avant d’enregistrer.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const numberOrNull = (key: string) => (value(key) ? Number(value(key)) : null);
    const product = {
      name: value("name"),
      reference: value("reference"),
      slug: `${slugify(value("name"))}-${slugify(value("reference"))}`,
      description: value("description") || null,
      price: Number(value("price") || 0),
      currency: value("currency") as Product["currency"],
      min_qty: Number(value("min_qty") || 1),
      stock: numberOrNull("stock"),
      weight_kg: numberOrNull("weight"),
      dimensions: value("dimensions") || null,
      origin: value("origin") || null,
      supplier: value("supplier") || null,
      lead_time: value("lead_time") || null,
      category_id: value("category") || null,
      video_url: value("video") || null,
      published: form.get("published") === "on",
      images,
    };
    const result = edit?.id
      ? await supabase.from("products").update(product).eq("id", edit.id)
      : await supabase.from("products").insert(product);
    if (result.error) {
      toast.error("Le produit n’a pas pu être enregistré.");
      return;
    }
    toast.success("Produit enregistré.");
    setEdit(null);
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function removeProduct(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Impossible de supprimer ce produit. Il peut être lié à un panier.");
      return;
    }
    toast.success("Produit supprimé.");
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    const { error } = await supabase
      .from("categories")
      .insert({ name: newCategory.trim(), slug: slugify(newCategory) });
    if (error) {
      toast.error("La catégorie n’a pas pu être ajoutée.");
      return;
    }
    setNewCategory("");
    toast.success("Catégorie ajoutée.");
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (products.data ?? []).filter((product) => {
      const matchesQuery =
        !query ||
        [product.name, product.reference, product.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      const matchesPublication =
        publicationFilter === "all" ||
        (publicationFilter === "published" ? product.published : !product.published);
      return matchesQuery && matchesCategory && matchesPublication;
    });
  }, [categoryFilter, products.data, publicationFilter, search]);
  const outOfStock = (products.data ?? []).filter((product) => product.stock === 0);
  const formValues = edit ?? {};

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Catalogue</p>
          <h2 className="mt-2 text-2xl font-bold">Produits</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les articles, les catégories et leur visibilité.
          </p>
        </div>
        <Button
          variant="hero"
          onClick={() => open({ currency: "XAF", min_qty: 1, published: true, origin: "Chine" })}
        >
          <Plus aria-hidden="true" /> Nouveau produit
        </Button>
      </div>

      <section
        className="glass mt-5 rounded-3xl p-4 md:p-5"
        aria-label="Recherche et filtres de produits"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un produit ou une référence…"
              aria-label="Rechercher un produit"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filtrer par visibilité">
            {(
              [
                ["all", "Tous"],
                ["published", "Publiés"],
                ["hidden", "Masqués"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant="glass"
                aria-pressed={publicationFilter === key}
                className={publicationFilter === key ? "border-accent/50 text-accent" : ""}
                onClick={() => setPublicationFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer par catégorie">
          <Button
            type="button"
            size="sm"
            variant="glass"
            aria-pressed={categoryFilter === "all"}
            className={categoryFilter === "all" ? "border-accent/50 text-accent" : ""}
            onClick={() => setCategoryFilter("all")}
          >
            Toutes les catégories
          </Button>
          {categories.data?.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant="glass"
              aria-pressed={categoryFilter === category.id}
              className={categoryFilter === category.id ? "border-accent/50 text-accent" : ""}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <form
          className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void addCategory();
          }}
        >
          <Input
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="Nouvelle catégorie"
            aria-label="Nom de la nouvelle catégorie"
            className="h-9 w-full max-w-xs"
          />
          <Button type="submit" size="sm" variant="glass" disabled={!newCategory.trim()}>
            Ajouter une catégorie
          </Button>
        </form>
        {categories.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Les catégories ne peuvent pas être chargées. Le filtre reste limité aux données
            disponibles.
          </p>
        )}
      </section>

      {products.isSuccess && outOfStock.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gold/35 bg-gold/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <p className="font-semibold">Réapprovisionnement à examiner</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {outOfStock.length} produit{outOfStock.length > 1 ? "s" : ""} avec un stock déclaré à
              zéro :{" "}
              {outOfStock
                .slice(0, 3)
                .map((product) => product.name)
                .join(", ")}
              {outOfStock.length > 3 ? "…" : ""}.
            </p>
          </div>
        </div>
      )}

      {products.isLoading && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="glass h-24 animate-pulse rounded-3xl" />
          <div className="glass h-24 animate-pulse rounded-3xl" />
        </div>
      )}
      {products.isError && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm"
        >
          <p className="font-semibold">Les produits ne peuvent pas être chargés.</p>
          <p className="mt-1 text-muted-foreground">
            Vérifiez la connexion et la configuration Supabase. L’inventaire n’est pas présenté
            comme vide.
          </p>
        </div>
      )}
      {products.isSuccess && filteredProducts.length === 0 && (
        <p className="mt-4 rounded-2xl border border-border p-5 text-sm text-muted-foreground">
          {products.data.length === 0
            ? "Aucun produit n’est enregistré dans les données disponibles."
            : "Aucun produit ne correspond aux filtres sélectionnés."}
        </p>
      )}
      {products.isSuccess && filteredProducts.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="glass flex items-center gap-3 rounded-3xl p-3 shadow-card"
            >
              <ProductImage
                path={product.images[0]}
                alt={product.name}
                className="size-20 shrink-0 rounded-2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{product.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {product.reference} · {formatMoney(Number(product.price), product.currency)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-2.5 py-1">
                    {product.stock === null
                      ? "Stock non renseigné"
                      : product.stock === 0
                        ? "0 en stock"
                        : `${product.stock} en stock`}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-1">
                    {product.published ? "Publié" : "Masqué"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => open(product)}
                  aria-label={`Modifier ${product.name}`}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => void removeProduct(product.id)}
                  aria-label={`Supprimer ${product.name}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(openDialog) => !openDialog && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formValues.id ? "Modifier" : "Nouveau"} produit</DialogTitle>
          </DialogHeader>
          <form key={formValues.id ?? "new"} onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="product-name">Nom</Label>
              <Input id="product-name" name="name" required defaultValue={formValues.name} />
            </div>
            <div>
              <Label htmlFor="product-reference">Référence</Label>
              <Input
                id="product-reference"
                name="reference"
                required
                defaultValue={formValues.reference}
              />
            </div>
            <div>
              <Label htmlFor="product-category">Catégorie</Label>
              <select
                id="product-category"
                name="category"
                className={selectClass}
                defaultValue={formValues.category_id ?? ""}
              >
                <option value="" className="bg-card">
                  —
                </option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id} className="bg-card">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="product-price">Prix</Label>
              <Input
                id="product-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={formValues.price}
              />
            </div>
            <div>
              <Label htmlFor="product-currency">Devise</Label>
              <select
                id="product-currency"
                name="currency"
                className={selectClass}
                defaultValue={formValues.currency ?? "XAF"}
              >
                <option value="XAF" className="bg-card">
                  FCFA
                </option>
                <option value="USD" className="bg-card">
                  USD
                </option>
                <option value="EUR" className="bg-card">
                  EUR
                </option>
              </select>
            </div>
            <div>
              <Label htmlFor="product-min-qty">Qté minimale</Label>
              <Input
                id="product-min-qty"
                name="min_qty"
                type="number"
                min="1"
                defaultValue={formValues.min_qty ?? 1}
              />
            </div>
            <div>
              <Label htmlFor="product-stock">Stock déclaré</Label>
              <Input
                id="product-stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={formValues.stock ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="product-weight">Poids (kg)</Label>
              <Input
                id="product-weight"
                name="weight"
                type="number"
                min="0"
                step="0.001"
                defaultValue={formValues.weight_kg ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="product-dimensions">Dimensions</Label>
              <Input
                id="product-dimensions"
                name="dimensions"
                defaultValue={formValues.dimensions ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="product-origin">Origine</Label>
              <Input id="product-origin" name="origin" defaultValue={formValues.origin ?? ""} />
            </div>
            <div>
              <Label htmlFor="product-supplier">Fournisseur</Label>
              <Input
                id="product-supplier"
                name="supplier"
                defaultValue={formValues.supplier ?? ""}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="product-lead-time">Délai estimatif confirmé</Label>
              <Input
                id="product-lead-time"
                name="lead_time"
                defaultValue={formValues.lead_time ?? ""}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                name="description"
                defaultValue={formValues.description ?? ""}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="product-video">Lien vidéo (facultatif)</Label>
              <Input id="product-video" name="video" defaultValue={formValues.video_url ?? ""} />
            </div>
            <div className="col-span-2">
              <Label>Photos</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {images.map((image) => (
                  <button
                    type="button"
                    key={image}
                    onClick={() => setImages((current) => current.filter((item) => item !== image))}
                    title="Retirer"
                    aria-label="Retirer cette photo"
                  >
                    <ProductImage path={image} alt="" className="size-16 rounded-xl" />
                  </button>
                ))}
              </div>
              <Input
                id="product-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => void upload(event.currentTarget.files)}
                disabled={uploading}
                className="mt-2"
              />
              {uploading && (
                <p role="status" className="mt-2 text-xs text-muted-foreground">
                  Téléversement des photos…
                </p>
              )}
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="published"
                defaultChecked={formValues.published ?? true}
              />
              Visible dans la boutique
            </label>
            <Button type="submit" variant="hero" className="col-span-2" disabled={uploading}>
              {uploading ? "Téléversement…" : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
