import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import {
  Home,
  Menu,
  MessageCircle,
  PackageSearch,
  Search,
  ShoppingBag,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useCart } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { useSettings, useUser, useRoles, isStaff } from "@/lib/site";
import { CurrencySwitch } from "@/components/shop/currency";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/boutique", label: "Boutique" },
  { to: "/services", label: "Services" },
  { to: "/transport-aerien", label: "Aérien" },
  { to: "/transport-maritime", label: "Maritime" },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const settings = useSettings();
  const { user } = useUser();
  const roles = useRoles(user?.id).data;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const count = (useCart(user?.id).data?.items ?? []).reduce(
    (total, item) => total + item.quantity,
    0,
  );

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(false);
    void navigate({
      to: "/boutique",
      search: { q: search.trim() || undefined, cat: undefined, sort: undefined, page: undefined },
    });
  }

  const cartLink = (
    <Link
      to="/panier"
      className="relative grid size-10 shrink-0 place-items-center rounded-full text-white transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:size-11"
      aria-label={count > 0 ? `Panier, ${count} article(s)` : "Panier"}
      title="Panier"
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 grid min-h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#102a44]"
        >
          {count}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#102a44] text-white shadow-[0_5px_22px_-14px_rgba(3,14,26,.7)]">
      <div className="hidden border-b border-white/10 bg-[#081c31] sm:block">
        <div className="mx-auto flex min-h-7 max-w-7xl items-center justify-between gap-4 px-5 text-[10px] text-white/75 sm:px-8">
          <p>
            <span className="font-bold text-amber-300">Afrinexa</span> · Sourcing et logistique
            Chine → Afrique → Europe
          </p>
          <div className="flex items-center gap-4">
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-7 items-center gap-1.5 transition hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <MessageCircle className="size-3" aria-hidden="true" /> WhatsApp
              </a>
            )}
            {user && isStaff(roles) && (
              <Link
                to="/admin"
                className="min-h-7 inline-flex items-center text-amber-300 hover:text-amber-200"
              >
                Administration
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center gap-2 px-3 sm:px-5 lg:gap-4">
        <Link
          to="/"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <span className="grid h-9 min-w-16 place-items-center rounded-md bg-amber-400 px-2 font-display text-sm font-extrabold italic tracking-tight text-[#122b45] sm:h-10 sm:min-w-[78px] sm:text-base">
            AFRINEXA
          </span>
          <span className="hidden text-[9px] font-medium leading-tight text-white/65 sm:block">
            Sourcing &amp;
            <br />
            logistique
          </span>
        </Link>

        <form onSubmit={submitSearch} className="mx-auto hidden min-w-0 max-w-md flex-1 xl:flex">
          <div className="flex h-10 w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-amber-300">
            <label className="sr-only" htmlFor="header-catalogue-search">
              Rechercher dans le catalogue
            </label>
            <input
              id="header-catalogue-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher dans le catalogue…"
              className="min-w-0 flex-1 bg-transparent px-3 text-xs text-slate-900 outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="grid w-11 shrink-0 place-items-center bg-amber-400 text-[#102a44] transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#102a44]"
              aria-label="Rechercher"
            >
              <Search className="size-4" aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <CurrencySwitch />
          {cartLink}
          {user && (
            <Button
              asChild
              variant="glass"
              size="sm"
              className="min-h-10 border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
            >
              <Link to="/messages" aria-label="Ouvrir la messagerie">
                <MessageCircle aria-hidden="true" />{" "}
                <span className="hidden 2xl:inline">Messagerie</span>
              </Link>
            </Button>
          )}
          <Link
            to="/suivi"
            search={{ q: undefined }}
            className="grid size-10 place-items-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            aria-label="Suivi de colis"
            title="Suivi de colis"
          >
            <PackageSearch className="size-5" aria-hidden="true" />
          </Link>
          <Button
            asChild
            variant="hero"
            size="sm"
            className="min-h-10 rounded-md bg-amber-400 text-[#102a44] shadow-none hover:bg-amber-300 hover:text-[#102a44]"
          >
            <Link to={user ? (isStaff(roles) ? "/admin" : "/espace") : "/auth"}>
              {user ? (isStaff(roles) ? "Administration" : "Mon espace") : "Connexion"}
            </Link>
          </Button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 xl:hidden">
          {cartLink}
          <Link
            to="/suivi"
            search={{ q: undefined }}
            className="grid size-10 place-items-center rounded-full text-amber-200 transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            aria-label="Suivi de colis"
            title="Suivi de colis"
          >
            <PackageSearch className="size-5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="grid size-10 place-items-center rounded-full transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav aria-label="Navigation principale" className="hidden border-t border-white/10 xl:block">
        <div className="mx-auto flex min-h-10 max-w-7xl items-center gap-1 px-5 sm:px-8">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded px-3 py-2 text-xs font-medium text-white/75 transition duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              activeProps={{
                className: "rounded bg-white/10 px-3 py-2 text-xs font-semibold text-amber-200",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="mobile-navigation"
            aria-label="Navigation mobile"
            initial={reducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            {...(!reducedMotion ? { exit: { opacity: 0, y: -8 } } : {})}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full flex max-h-[calc(100dvh-7rem)] flex-col gap-1 overflow-y-auto border-t border-white/10 bg-[#102a44] p-4 shadow-xl xl:hidden"
          >
            <form
              onSubmit={submitSearch}
              className="mb-2 flex h-11 overflow-hidden rounded-md bg-white"
            >
              <label className="sr-only" htmlFor="mobile-catalogue-search">
                Rechercher dans le catalogue
              </label>
              <input
                id="mobile-catalogue-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un produit…"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none"
              />
              <button
                type="submit"
                aria-label="Rechercher"
                className="grid w-12 place-items-center bg-amber-400 text-[#102a44]"
              >
                <Search className="size-4" aria-hidden="true" />
              </button>
            </form>
            <Link
              to="/suivi"
              search={{ q: undefined }}
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-lg px-3 py-2.5 font-semibold text-amber-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Suivre un colis
            </Link>
            {user && (
              <Link
                to="/messages"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-lg px-3 py-2.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Messagerie
              </Link>
            )}
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-lg px-3 py-2.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {item.label}
              </Link>
            ))}
            <div
              className="border-t border-white/10 pt-3"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="mb-2 px-1 text-xs text-white/65">Devise d’affichage</p>
              <CurrencySwitch />
            </div>
            <Link
              to={user ? (isStaff(roles) ? "/admin" : "/espace") : "/auth"}
              onClick={() => setOpen(false)}
              className="mt-2 grid min-h-11 place-items-center rounded-md bg-amber-400 px-3 py-2.5 text-center font-semibold text-[#102a44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {user
                ? isStaff(roles)
                  ? "Administration"
                  : "Mon espace"
                : "Connexion / inscription"}
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function MobileQuickNav() {
  const { user } = useUser();
  const roles = useRoles(user?.id).data;
  const count = (useCart(user?.id).data?.items ?? []).reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const items = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/boutique", label: "Boutique", icon: Store },
    { to: "/panier", label: count ? `Panier (${count})` : "Panier", icon: ShoppingBag },
    {
      to: user ? (isStaff(roles) ? "/admin" : "/espace") : "/auth",
      label: user ? "Mon espace" : "Compte",
      icon: UserRound,
    },
  ] as const;
  return (
    <nav
      aria-label="Navigation rapide"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 text-slate-600 shadow-[0_-8px_24px_-18px_rgba(10,25,40,.55)] backdrop-blur-lg md:hidden"
    >
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          activeProps={{
            className:
              "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-bold text-amber-700",
          }}
        >
          <item.icon className="size-4" aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
