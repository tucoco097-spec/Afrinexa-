import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { useSettings } from "@/lib/site";

export function SiteFooter() {
  const s = useSettings();
  return (
    <footer className="mt-24 border-t bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-bold">{s?.company_name ?? "Afrinexa"}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {s?.slogan ?? "Votre partenaire logistique de la Chine vers l’Afrique et l’Europe."}
          </p>
          <p className="mt-4 text-sm font-medium text-accent">Chine → Afrique → Europe</p>
        </div>
        <nav aria-label="Liens de la plateforme" className="space-y-2 text-sm">
          <p className="font-semibold">Plateforme</p>
          <Link to="/boutique" className="block text-muted-foreground hover:text-foreground">
            Catalogue produits
          </Link>
          <Link
            to="/panier"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ShoppingBag className="size-4" />
            Panier & validation
          </Link>
          <Link
            to="/suivi"
            search={{ q: undefined }}
            className="block text-muted-foreground hover:text-foreground"
          >
            Suivi de colis
          </Link>
          <Link to="/services" className="block text-muted-foreground hover:text-foreground">
            Services
          </Link>
          <Link
            to="/transport-aerien"
            className="block text-muted-foreground hover:text-foreground"
          >
            Transport aérien
          </Link>
          <Link
            to="/transport-maritime"
            className="block text-muted-foreground hover:text-foreground"
          >
            Transport maritime
          </Link>
        </nav>
        <nav aria-label="Espace client" className="space-y-2 text-sm">
          <p className="font-semibold">Espace client</p>
          <Link to="/auth" className="block text-muted-foreground hover:text-foreground">
            Connexion / inscription
          </Link>
          <Link to="/espace" className="block text-muted-foreground hover:text-foreground">
            Mes commandes
          </Link>
          <Link to="/messages" className="block text-muted-foreground hover:text-foreground">
            Messagerie
          </Link>
          <Link to="/contact" className="block text-muted-foreground hover:text-foreground">
            Contact
          </Link>
        </nav>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Nous contacter</p>
          {s?.phone && (
            <a href={`tel:${s.phone}`} className="flex gap-2 hover:text-foreground">
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              {s.phone}
            </a>
          )}
          {s?.email && (
            <a href={`mailto:${s.email}`} className="flex gap-2 hover:text-foreground">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              {s.email}
            </a>
          )}
          {s?.address_china && (
            <p className="flex gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium text-foreground">Chine :</span> {s.address_china}
              </span>
            </p>
          )}
          {s?.address_cameroon && (
            <p className="flex gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium text-foreground">Afrique :</span> {s.address_cameroon}
              </span>
            </p>
          )}
          {s?.whatsapp && (
            <a
              href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-success hover:underline"
            >
              <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
              WhatsApp direct
            </a>
          )}
        </div>
      </div>
      <p className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {s?.company_name ?? "Afrinexa"}. Tous droits réservés.
      </p>
    </footer>
  );
}
