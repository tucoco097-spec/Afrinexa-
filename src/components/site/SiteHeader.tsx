import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, PackageSearch, ShoppingBag, MessageCircle } from "lucide-react";
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

  const cartLink = (
    <Link
      to="/panier"
      className="relative grid size-11 shrink-0 place-items-center rounded-full transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={count > 0 ? `Panier, ${count} article(s)` : "Panier"}
      title="Panier"
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 grid min-h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground"
        >
          {count}
        </span>
      )}
    </Link>
  );

  const trackingLink = (
    <Button asChild variant="glass" size="sm" className="min-h-11">
      <Link to="/suivi" search={{ q: undefined }} aria-label="Suivi de colis">
        <PackageSearch aria-hidden="true" /> Suivi
      </Link>
    </Button>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 shadow-card backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-3 sm:px-5">
        <Link
          to="/"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full pr-2 font-display text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span
            className="grid size-9 place-items-center rounded-full bg-brand text-sm text-primary-foreground"
            aria-hidden="true"
          >
            A
          </span>
          <span>{settings?.company_name ?? "Afrinexa"}</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-2.5 py-2 text-sm text-muted-foreground transition duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <CurrencySwitch />
          {cartLink}
          {user && (
            <Button asChild variant="glass" size="sm" className="min-h-11">
              <Link to="/messages" aria-label="Ouvrir la messagerie">
                <MessageCircle aria-hidden="true" /> Messagerie
              </Link>
            </Button>
          )}
          {trackingLink}
          {user ? (
            <Button asChild variant="hero" size="sm" className="min-h-11">
              <Link to={isStaff(roles) ? "/admin" : "/espace"}>
                {isStaff(roles) ? "Administration" : "Mon espace"}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="hero" size="sm" className="min-h-11">
              <Link to="/auth">Connexion</Link>
            </Button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 xl:hidden">
          {cartLink}
          <Link
            to="/suivi"
            search={{ q: undefined }}
            className="grid size-11 place-items-center rounded-full text-accent transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            className="grid size-11 place-items-center rounded-full transition duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Navigation mobile"
          className="mx-auto flex max-h-[calc(100dvh-7rem)] max-w-7xl flex-col gap-1 overflow-y-auto border-t border-border/70 bg-background/95 p-4 shadow-card backdrop-blur-xl xl:hidden"
          onClick={() => setOpen(false)}
        >
          <Link
            to="/suivi"
            search={{ q: undefined }}
            className="min-h-11 rounded-xl px-3 py-2.5 font-semibold text-accent transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Suivre un colis
          </Link>
          {user && (
            <Link
              to="/messages"
              className="min-h-11 rounded-xl px-3 py-2.5 transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Messagerie
            </Link>
          )}
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="min-h-11 rounded-xl px-3 py-2.5 transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
            </Link>
          ))}
          <div
            className="border-t border-border/70 pt-3"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 px-1 text-xs text-muted-foreground">Devise d’affichage</p>
            <CurrencySwitch />
          </div>
          {user ? (
            <Link
              to={isStaff(roles) ? "/admin" : "/espace"}
              className="mt-2 grid min-h-11 place-items-center rounded-xl bg-brand px-3 py-2.5 text-center font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isStaff(roles) ? "Administration" : "Mon espace"}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="mt-2 grid min-h-11 place-items-center rounded-xl bg-brand px-3 py-2.5 text-center font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Connexion / inscription
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
