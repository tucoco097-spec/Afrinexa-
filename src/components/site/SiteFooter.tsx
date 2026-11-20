import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { useSettings } from "@/lib/site";

const linkClass =
  "block min-h-10 rounded-lg py-2 text-muted-foreground transition duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function SiteFooter() {
  const settings = useSettings();
  return (
    <footer className="mt-16 border-t border-border/80 bg-card/45">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-2 md:gap-10 xl:grid-cols-5">
        <div className="md:col-span-2 xl:col-span-1">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full font-display text-2xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span
              className="grid size-9 place-items-center rounded-full bg-brand text-sm text-primary-foreground"
              aria-hidden="true"
            >
              A
            </span>
            {settings?.company_name ?? "Afrinexa"}
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {settings?.slogan ??
              "Votre partenaire logistique de la Chine vers l’Afrique et l’Europe."}
          </p>
          <p className="mt-4 text-sm font-medium text-accent">Chine → Afrique → Europe</p>
        </div>

        <nav aria-label="Liens de la plateforme" className="space-y-1 text-sm">
          <p className="mb-2 font-semibold text-foreground">Plateforme</p>
          <Link to="/" className={linkClass}>
            Accueil
          </Link>
          <Link to="/boutique" className={linkClass}>
            Catalogue
          </Link>
          <Link
            to="/panier"
            className="flex min-h-10 items-center gap-2 rounded-lg py-2 text-muted-foreground transition duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ShoppingBag className="size-4" aria-hidden="true" /> Panier & validation
          </Link>
          <Link to="/suivi" search={{ q: undefined }} className={linkClass}>
            Suivi de colis
          </Link>
          <Link to="/services" className={linkClass}>
            Services
          </Link>
          <Link to="/transport-aerien" className={linkClass}>
            Transport aérien
          </Link>
          <Link to="/transport-maritime" className={linkClass}>
            Transport maritime
          </Link>
        </nav>

        <nav aria-label="Espace client" className="space-y-1 text-sm">
          <p className="mb-2 font-semibold text-foreground">Espace client</p>
          <Link to="/auth" className={linkClass}>
            Connexion / inscription
          </Link>
          <Link to="/espace" className={linkClass}>
            Mes commandes
          </Link>
          <Link to="/messages" className={linkClass}>
            Messagerie
          </Link>
          <Link to="/contact" className={linkClass}>
            Contact
          </Link>
        </nav>

        <div className="space-y-1 text-sm text-muted-foreground xl:col-span-2">
          <p className="mb-2 font-semibold text-foreground">Nous contacter</p>
          {settings?.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex min-h-10 items-center gap-2 rounded-lg py-2 transition duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Phone className="size-4 shrink-0" aria-hidden="true" /> {settings.phone}
            </a>
          )}
          {settings?.email && (
            <a
              href={`mailto:${settings.email}`}
              className="flex min-h-10 items-center gap-2 rounded-lg py-2 transition duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Mail className="size-4 shrink-0" aria-hidden="true" /> {settings.email}
            </a>
          )}
          {settings?.address_china && (
            <p className="flex items-start gap-2 py-2 leading-relaxed">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium text-foreground">Chine :</span>{" "}
                {settings.address_china}
              </span>
            </p>
          )}
          {settings?.address_cameroon && (
            <p className="flex items-start gap-2 py-2 leading-relaxed">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium text-foreground">Afrique :</span>{" "}
                {settings.address_cameroon}
              </span>
            </p>
          )}
          {settings?.whatsapp && (
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-10 items-center gap-2 rounded-lg py-2 text-success transition duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <MessageCircle className="size-4 shrink-0" aria-hidden="true" /> WhatsApp direct
            </a>
          )}
        </div>
      </div>
      <p className="border-t border-border/80 px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings?.company_name ?? "Afrinexa"}. Tous droits réservés.
      </p>
    </footer>
  );
}
