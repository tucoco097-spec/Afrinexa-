import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
  const s = useSettings();
  const { user } = useUser();
  const roles = useRoles(user?.id).data;
  const [open, setOpen] = useState(false);
  const count = (useCart(user?.id).data?.items ?? []).reduce((a, i) => a + i.quantity, 0);
  const cartBtn = (
    <Link
      to="/panier"
      className="relative grid size-9 place-items-center rounded-full hover:bg-secondary"
      aria-label="Panier"
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
          {count}
        </span>
      )}
    </Link>
  );
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-3 max-w-6xl px-3">
        <div className="mb-2 flex items-center justify-between gap-3 px-3 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">
            Livraison selon devis : Afrique, Europe et destinations internationales
          </span>
          <span className="sm:hidden">Chine → Afrique → Europe</span>
          <div className="flex items-center gap-2">
            {s?.whatsapp && (
              <a
                href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-success hover:underline"
              >
                <MessageCircle className="size-3.5" /> WhatsApp
              </a>
            )}
            <CurrencySwitch />
          </div>
        </div>
        <div className="glass flex h-14 items-center justify-between rounded-full px-4 shadow-card">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-full bg-brand text-sm text-primary-foreground">
              A
            </span>
            <span>{s?.company_name ?? "Afrinexa"}</span>
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground bg-secondary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {cartBtn}
            {user && (
              <Button asChild variant="glass" size="sm">
                <Link to="/messages" aria-label="Ouvrir la messagerie">
                  <MessageCircle /> Messagerie
                </Link>
              </Button>
            )}
            <Button asChild variant="glass" size="sm">
              <Link to="/suivi" search={{ q: undefined }}>
                <PackageSearch /> Suivi
              </Link>
            </Button>
            {user ? (
              <Button asChild variant="hero" size="sm">
                <Link to={isStaff(roles) ? "/admin" : "/espace"}>
                  {isStaff(roles) ? "Administration" : "Mon espace"}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="hero" size="sm">
                <Link to="/auth">Connexion</Link>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 md:hidden">
            {cartBtn}
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="grid size-9 place-items-center rounded-full hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            aria-label="Navigation mobile"
            className="glass mt-2 flex flex-col gap-1 rounded-3xl p-3 md:hidden"
            onClick={() => setOpen(false)}
          >
            <Link
              to="/suivi"
              search={{ q: undefined }}
              className="rounded-xl px-3 py-2.5 font-medium text-accent"
            >
              Suivre un colis
            </Link>
            {user && (
              <Link to="/messages" className="rounded-xl px-3 py-2.5">
                Messagerie
              </Link>
            )}
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-xl px-3 py-2.5">
                {n.label}
              </Link>
            ))}
            {user ? (
              <Link
                to={isStaff(roles) ? "/admin" : "/espace"}
                className="rounded-xl bg-brand px-3 py-2.5 text-center font-semibold text-primary-foreground"
              >
                {isStaff(roles) ? "Administration" : "Mon espace"}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="rounded-xl bg-brand px-3 py-2.5 text-center font-semibold text-primary-foreground"
              >
                Connexion
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
