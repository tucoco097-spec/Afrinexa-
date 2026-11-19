import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
const sel = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

function AdminProducts() {
  const qc = useQueryClient();
  const cats = useQuery(categoriesQuery);
  const prods = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () =>
      ((await supabase.from("products").select("*").order("created_at", { ascending: false }))
        .data ?? []) as Product[],
  });
  const [edit, setEdit] = useState<Partial<Product> | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");

  function open(p: Partial<Product>) {
    setEdit(p);
    setImages(p.images ?? []);
  }

  async function upload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const path = `${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("products").upload(path, f);
      if (error) toast.error(error.message);
      else setImages((x) => [...x, path]);
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const n = (k: string) => (v(k) ? Number(v(k)) : null);
    const row = {
      name: v("name"),
      reference: v("reference"),
      slug: slugify(v("name")) + "-" + slugify(v("reference")),
      description: v("description") || null,
      price: Number(v("price") || 0),
      currency: v("currency") as Product["currency"],
      min_qty: Number(v("min_qty") || 1),
      stock: n("stock"),
      weight_kg: n("weight"),
      dimensions: v("dimensions") || null,
      origin: v("origin") || null,
      supplier: v("supplier") || null,
      lead_time: v("lead_time") || null,
      category_id: v("category") || null,
      video_url: v("video") || null,
      published: f.get("published") === "on",
      images,
    };
    const { error } = edit?.id
      ? await supabase.from("products").update(row).eq("id", edit.id)
      : await supabase.from("products").insert(row);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produit enregistré");
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function del(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Impossible : produit présent dans un panier. Dépubliez-le plutôt.");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function addCat() {
    if (!newCat.trim()) return;
    const { error } = await supabase
      .from("categories")
      .insert({ name: newCat.trim(), slug: slugify(newCat) });
    if (error) toast.error(error.message);
    else {
      setNewCat("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    }
  }

  const e = edit ?? {};
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Produits</h2>
        <Button
          variant="hero"
          onClick={() => open({ currency: "XAF", min_qty: 1, published: true, origin: "Chine" })}
        >
          <Plus /> Nouveau produit
        </Button>
      </div>
      <div className="glass mt-4 flex flex-wrap items-center gap-2 rounded-3xl p-4">
        <span className="text-sm text-muted-foreground">Catégories :</span>
        {cats.data?.map((c) => (
          <span key={c.id} className="rounded-full bg-secondary px-3 py-1 text-xs">
            {c.name}
          </span>
        ))}
        <Input
          value={newCat}
          onChange={(x) => setNewCat(x.target.value)}
          placeholder="Nouvelle catégorie"
          className="h-8 w-44"
        />
        <Button size="sm" variant="glass" onClick={addCat}>
          Ajouter
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {prods.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun produit.</p>
        )}
        {prods.data?.map((p) => (
          <div key={p.id} className="glass flex items-center gap-3 rounded-3xl p-3">
            <ProductImage
              path={p.images[0]}
              alt={p.name}
              className="size-16 shrink-0 rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.reference} · {formatMoney(Number(p.price), p.currency)}{" "}
                {p.published ? "" : "· masqué"}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => open(p)} aria-label="Modifier">
              <Pencil />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => del(p.id)} aria-label="Supprimer">
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{e.id ? "Modifier" : "Nouveau"} produit</DialogTitle>
          </DialogHeader>
          <form key={e.id ?? "new"} onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nom</Label>
              <Input name="name" required defaultValue={e.name} />
            </div>
            <div>
              <Label>Référence</Label>
              <Input name="reference" required defaultValue={e.reference} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <select name="category" className={sel} defaultValue={e.category_id ?? ""}>
                <option value="" className="bg-card">
                  —
                </option>
                {cats.data?.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Prix</Label>
              <Input name="price" type="number" step="0.01" required defaultValue={e.price} />
            </div>
            <div>
              <Label>Devise</Label>
              <select name="currency" className={sel} defaultValue={e.currency}>
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
              <Label>Qté minimale</Label>
              <Input name="min_qty" type="number" min={1} defaultValue={e.min_qty} />
            </div>
            <div>
              <Label>Stock</Label>
              <Input name="stock" type="number" defaultValue={e.stock ?? ""} />
            </div>
            <div>
              <Label>Poids (kg)</Label>
              <Input name="weight" type="number" step="0.001" defaultValue={e.weight_kg ?? ""} />
            </div>
            <div>
              <Label>Dimensions</Label>
              <Input name="dimensions" defaultValue={e.dimensions ?? ""} />
            </div>
            <div>
              <Label>Origine</Label>
              <Input name="origin" defaultValue={e.origin ?? ""} />
            </div>
            <div>
              <Label>Fournisseur</Label>
              <Input name="supplier" defaultValue={e.supplier ?? ""} />
            </div>
            <div className="col-span-2">
              <Label>Délai estimatif</Label>
              <Input
                name="lead_time"
                placeholder="ex. 15 à 25 jours"
                defaultValue={e.lead_time ?? ""}
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea name="description" defaultValue={e.description ?? ""} />
            </div>
            <div className="col-span-2">
              <Label>Lien vidéo (facultatif)</Label>
              <Input name="video" defaultValue={e.video_url ?? ""} />
            </div>
            <div className="col-span-2">
              <Label>Photos</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {images.map((im) => (
                  <button
                    type="button"
                    key={im}
                    onClick={() => setImages((x) => x.filter((y) => y !== im))}
                    title="Retirer"
                  >
                    <ProductImage path={im} alt="" className="size-16 rounded-xl" />
                  </button>
                ))}
              </div>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(x) => upload(x.target.files)}
                className="mt-2"
              />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={e.published} /> Visible dans
              la boutique
            </label>
            <Button type="submit" variant="hero" className="col-span-2">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
