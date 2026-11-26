import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PackageOpen, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const reduceMotion = useReducedMotion();
  const [q, setQ] = useState(s.q ?? "");

  useEffect(() => {
    setQ(s.q ?? "");
  }, [s.q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((s.q ?? "") !== q)
        navigate({ search: (p) => ({ ...p, q: q || undefined, page: undefined }) });
    }, 300);
    return () => clearTimeout(t);
  }, [navigate, q, s.q]);

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
  const selectedCategory = (cats.data ?? []).find((c) => c.id === s.cat);

  return (
    <div className="catalogue-light">
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 lg:px-8">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-card via-card to-primary/10 p-6 shadow-card md:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-32 size-72 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute -bottom-20 right-[28%] size-44 rounded-full border border-accent/10" />
            <div className="absolute -bottom-28 right-[30%] size-56 rounded-full border border-accent/5" />
          </div>
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                <Sparkles className="size-3.5" aria-hidden="true" /> Boutique Afrinexa
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Des références pour <span className="text-gradient">faire avancer</span> votre
                activité.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Parcourez le catalogue, explorez les catégories et comparez les prix dans la devise
                de votre choix.
              </p>
            </div>

            <div className="glass relative w-full rounded-2xl p-4 lg:max-w-[340px]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Affichage des prix
                </p>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-accent">
                  FCFA · USD · EUR
                </span>
              </div>
              <CurrencySwitch />
              {settings && (
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  {settings.rate_usd_xaf &&
                  settings.rate_usd_xaf > 0 &&
                  settings.rate_eur_xaf &&
                  settings.rate_eur_xaf > 0 ? (
                    <>
                      1 USD = {settings.rate_usd_xaf} FCFA · 1 EUR = {settings.rate_eur_xaf} FCFA ·
                      taux du {fmtDate(settings.rates_updated_at)}
                    </>
                  ) : (
                    "Taux de conversion indisponibles ; prix affichés dans la devise d’origine."
                  )}
                </p>
              )}
            </div>
          </div>
        </section>

        <section aria-label="Rechercher et filtrer le catalogue" className="mt-7">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="glass flex min-h-[52px] flex-1 items-center gap-3 rounded-2xl px-4 transition duration-200 focus-within:border-accent/40 focus-within:shadow-glow motion-reduce:transition-none">
              <Search className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit ou une référence…"
                aria-label="Rechercher un produit ou une référence"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/75"
              />
            </label>
            <label className="sr-only" htmlFor="catalog-sort">
              Trier les produits
            </label>
            <select
              id="catalog-sort"
              value={s.sort ?? "new"}
              aria-label="Trier les produits"
              onChange={(e) =>
                navigate({
                  search: (p) => ({ ...p, sort: e.target.value as Sort, page: undefined }),
                })
              }
              className="glass h-[52px] w-full rounded-2xl px-4 text-sm transition duration-200 hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-56 motion-reduce:transition-none"
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

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Explorer les catégories
            </p>
            <div
              role="group"
              aria-label="Filtrer par catégorie"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
            >
              <motion.button
                type="button"
                {...(!reduceMotion ? { whileHover: { y: -2 }, whileTap: { scale: 0.97 } } : {})}
                transition={
                  reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }
                }
                onClick={() =>
                  navigate({ search: (p) => ({ ...p, cat: undefined, page: undefined }) })
                }
                className={`relative isolate shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none ${!s.cat ? (reduceMotion ? "bg-brand text-primary-foreground" : "text-primary-foreground") : "glass text-muted-foreground hover:text-foreground"}`}
                aria-pressed={!s.cat}
              >
                {!s.cat && !reduceMotion && (
                  <motion.span
                    layoutId="catalogue-active-category"
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">Tout</span>
              </motion.button>
              {top.map((c) => {
                const active = s.cat === c.id || selectedCategory?.parent_id === c.id;
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    {...(!reduceMotion ? { whileHover: { y: -2 }, whileTap: { scale: 0.97 } } : {})}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 28 }
                    }
                    onClick={() =>
                      navigate({ search: (p) => ({ ...p, cat: c.id, page: undefined }) })
                    }
                    className={`relative isolate shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none ${active ? (reduceMotion ? "bg-brand text-primary-foreground" : "text-primary-foreground") : "glass text-muted-foreground hover:text-foreground"}`}
                    aria-pressed={active}
                  >
                    {active && !reduceMotion && (
                      <motion.span
                        layoutId="catalogue-active-category"
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 rounded-full bg-brand"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{c.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {s.cat && (cats.data ?? []).some((c) => c.parent_id === s.cat) && (
            <div
              role="group"
              aria-label="Sous-catégories"
              className="mt-2 flex gap-2 overflow-x-auto pb-2"
            >
              {(cats.data ?? [])
                .filter((c) => c.parent_id === s.cat)
                .map((c) => {
                  const active = s.cat === c.id;
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      {...(!reduceMotion
                        ? { whileHover: { y: -1 }, whileTap: { scale: 0.97 } }
                        : {})}
                      onClick={() =>
                        navigate({ search: (p) => ({ ...p, cat: c.id, page: undefined }) })
                      }
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none ${active ? "bg-accent/15 text-accent" : "glass text-muted-foreground hover:text-foreground"}`}
                      aria-pressed={active}
                    >
                      {c.name}
                    </motion.button>
                  );
                })}
            </div>
          )}
          {cats.isError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              Les catégories n’ont pas pu être chargées. Le catalogue reste consultable sans ce
              filtre.
            </p>
          )}
        </section>

        <section aria-labelledby="catalogue-products-title" className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="catalogue-products-title" className="text-2xl font-bold md:text-3xl">
                Produits du catalogue
              </h2>
              <p aria-live="polite" className="mt-1 text-sm text-muted-foreground">
                {prods.isLoading
                  ? "Chargement des références…"
                  : prods.isError
                    ? ""
                    : `${prods.data?.count ?? 0} référence${(prods.data?.count ?? 0) === 1 ? "" : "s"}`}
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
              Page {page} / {pages}
            </span>
          </div>

          {prods.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {prods.data?.items.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    {...(!reduceMotion ? { exit: { opacity: 0, y: -8, scale: 0.98 } } : {})}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            layout: { type: "spring", stiffness: 360, damping: 32 },
                            opacity: { duration: 0.28 },
                            y: {
                              duration: 0.42,
                              ease: [0.22, 1, 0.36, 1],
                              delay: Math.min(i * 0.035, 0.28),
                            },
                            scale: {
                              duration: 0.42,
                              ease: [0.22, 1, 0.36, 1],
                              delay: Math.min(i * 0.035, 0.28),
                            },
                          }
                    }
                    className="h-full"
                  >
                    <ProductCard p={p} tone="light" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {prods.isError && (
            <p
              role="alert"
              className="glass mt-6 rounded-3xl p-6 text-center text-sm text-destructive"
            >
              Le catalogue est momentanément indisponible. Réessayez plus tard ou contactez notre
              équipe.
            </p>
          )}
          {prods.data && !prods.isError && prods.data.items.length === 0 && (
            <div className="glass mt-6 rounded-3xl p-10 text-center">
              <PackageOpen className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
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
        </section>
      </div>
    </div>
  );
}
