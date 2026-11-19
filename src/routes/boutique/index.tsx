import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, PackageOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shop/ProductCard";
import { CurrencySwitch } from "@/components/shop/currency";
import { categoriesQuery, type Product } from "@/lib/shop";
import { useSettings, fmtDate } from "@/lib/site";

type Sort = "new" | "price_asc" | "price_desc" | "popular";
type S = {
  q?: string | undefined;
  cat?: string | undefined;
  sort?: Sort | undefined;
  page?: number | undefined;
};
const PER = 12;

export const Route = createFileRoute("/boutique/")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
    sort: ["new", "price_asc", "price_desc", "popular"].includes(s["sort"] as string)
      ? (s["sort"] as Sort)
      : undefined,
    page: Number(s["page"]) > 1 ? Number(s["page"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Boutique — Afrinexa" },
      {
        name: "description",
        content: "Catalogue de produits importés de Chine, prix en FCFA, USD et EUR.",
      },
      { property: "og:title", content: "Boutique — Afrinexa" },
      {
        property: "og:description",
        content: "Produits sourcés en Chine, expédiés vers l’Afrique et l’Europe.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/boutique/" });
  const settings = useSettings();
  const [q, setQ] = useState(s.q ?? "");
  useEffect(() => {
    const t = setTimeout(() => {
      if ((s.q ?? "") !== q)
        navigate({ search: (p) => ({ ...p, q: q || undefined, page: undefined }) });
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = useQuery(categoriesQuery);
  const page = s.page ?? 1;
  const prods = useQuery({
    queryKey: ["products", s],
    queryFn: async () => {
      let r = supabase.from("products").select("*", { count: "exact" }).eq("published", true);
      if (s.q)
        r = r.or(
          `name.ilike.%${s.q.replace(/[%,()]/g, "")}%,reference.ilike.%${s.q.replace(/[%,()]/g, "")}%`,
        );
      if (s.cat) {
        const ids = (cats.data ?? [])
          .filter((c) => c.id === s.cat || c.parent_id === s.cat)
          .map((c) => c.id);
        r = r.in("category_id", ids.length ? ids : [s.cat]);
      }
      const sort = s.sort ?? "new";
      r =
        sort === "price_asc"
          ? r.order("price")
          : sort === "price_desc"
            ? r.order("price", { ascending: false })
            : sort === "popular"
              ? r.order("popularity", { ascending: false })
              : r.order("created_at", { ascending: false });
      const { data, count, error } = await r.range((page - 1) * PER, page * PER - 1);
      if (error) throw error;
      return { items: (data ?? []) as Product[], count: count ?? 0 };
    },
  });
  const pages = Math.max(1, Math.ceil((prods.data?.count ?? 0) / PER));
  const top = (cats.data ?? []).filter((c) => !c.parent_id);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Boutique</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Catalogue</h1>
        </div>
        <div className="text-right">
          <CurrencySwitch />
          {settings && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {settings.rate_usd_xaf &&
              settings.rate_usd_xaf > 0 &&
              settings.rate_eur_xaf &&
              settings.rate_eur_xaf > 0 ? (
                <>
                  1 USD = {settings.rate_usd_xaf} FCFA · 1 EUR = {settings.rate_eur_xaf} FCFA · taux
                  du {fmtDate(settings.rates_updated_at)}
                </>
              ) : (
                "Taux de conversion indisponibles ; prix affichés dans la devise d’origine."
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <div className="glass flex flex-1 items-center gap-2 rounded-full px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit ou une référence…"
            aria-label="Rechercher un produit ou une référence"
            className="h-11 flex-1 bg-transparent outline-none"
          />
        </div>
        <select
          value={s.sort ?? "new"}
          aria-label="Trier les produits"
          onChange={(e) =>
            navigate({ search: (p) => ({ ...p, sort: e.target.value as Sort, page: undefined }) })
          }
          className="glass h-11 rounded-full px-4 text-sm"
        >
          <option value="new" className="bg-card">
            Nouveautés
          </option>
          <option value="popular" className="bg-card">
            Popularité
          </option>
          <option value="price_asc" className="bg-card">
            Prix croissant
          </option>
          <option value="price_desc" className="bg-card">
            Prix décroissant
          </option>
        </select>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => navigate({ search: (p) => ({ ...p, cat: undefined, page: undefined }) })}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${!s.cat ? "bg-brand text-primary-foreground" : "glass text-muted-foreground"}`}
          aria-pressed={!s.cat}
        >
          Tout
        </button>
        {top.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ search: (p) => ({ ...p, cat: c.id, page: undefined }) })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${s.cat === c.id ? "bg-brand text-primary-foreground" : "glass text-muted-foreground"}`}
            aria-pressed={s.cat === c.id}
          >
            {c.name}
          </button>
        ))}
      </div>
      {s.cat && (cats.data ?? []).some((c) => c.parent_id === s.cat) && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {(cats.data ?? [])
            .filter((c) => c.parent_id === s.cat)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => navigate({ search: (p) => ({ ...p, cat: c.id }) })}
                className="glass shrink-0 rounded-full px-3 py-1 text-xs text-muted-foreground"
              >
                {c.name}
              </button>
            ))}
        </div>
      )}
      {cats.isError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Les catégories n’ont pas pu être chargées. Le catalogue reste consultable sans ce filtre.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {prods.isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
          ))}
        {prods.data?.items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {prods.isError && (
        <p role="alert" className="glass mt-6 rounded-3xl p-6 text-center text-sm text-destructive">
          Le catalogue est momentanément indisponible. Réessayez plus tard ou contactez notre
          équipe.
        </p>
      )}
      {prods.data && !prods.isError && prods.data.items.length === 0 && (
        <div className="glass mt-6 rounded-3xl p-10 text-center">
          <PackageOpen className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Aucun produit pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Essayez une autre recherche ou revenez bientôt.
          </p>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="glass"
            disabled={page <= 1}
            onClick={() => navigate({ search: (p) => ({ ...p, page: page - 1 }) })}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {pages}
          </span>
          <Button
            variant="glass"
            disabled={page >= pages}
            onClick={() => navigate({ search: (p) => ({ ...p, page: page + 1 }) })}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
