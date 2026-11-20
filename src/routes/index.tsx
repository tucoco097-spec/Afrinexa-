import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BadgePercent,
  FileText,
  Globe2,
  Handshake,
  MessageCircle,
  PackageCheck,
  Plane,
  Search,
  ShieldCheck,
  Ship,
} from "lucide-react";
import hero from "@/assets/hero-port.jpg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackForm } from "@/components/site/TrackForm";
import { Reveal } from "@/components/site/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, type Product } from "@/lib/shop";
import { useSettings, useUser } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Afrinexa — Commerce et logistique Chine → Afrique → Europe" },
      {
        name: "description",
        content:
          "Découvrez les marchandises publiées dans le catalogue Afrinexa, demandez un sourcing et suivez vos expéditions entre la Chine, l’Afrique et l’Europe.",
      },
      { property: "og:title", content: "Afrinexa — Chine → Afrique → Europe" },
      {
        property: "og:description",
        content: "Catalogue de marchandises, sourcing, fret et suivi de colis.",
      },
    ],
  }),
  component: Index,
});

const SERVICES = [
  {
    to: "/transport-aerien",
    icon: Plane,
    title: "Fret aérien",
    text: "Pour les envois urgents et les petites quantités. Les références AWB et les étapes confirmées sont consultables dans le suivi.",
  },
  {
    to: "/transport-maritime",
    icon: Ship,
    title: "Fret maritime",
    text: "Groupage LCL ou conteneur complet FCL, selon l’option retenue dans le devis.",
  },
  {
    to: "/services",
    icon: Handshake,
    title: "Sourcing en Chine",
    text: "Décrivez votre besoin à l’équipe pour rechercher et négocier auprès de fournisseurs.",
  },
  {
    to: "/services",
    icon: ShieldCheck,
    title: "Contrôle qualité",
    text: "L’inspection et les photos sont partagées lorsque le service est prévu au devis.",
  },
] as const;

const STEPS = [
  {
    icon: Search,
    title: "Choix du produit",
    text: "Sélectionnez un produit publié ou décrivez votre besoin de sourcing.",
  },
  {
    icon: FileText,
    title: "Validation de commande",
    text: "Confirmez les références, les quantités et la destination souhaitée.",
  },
  {
    icon: Handshake,
    title: "Devis et transport",
    text: "Un agent confirme le prix, le transport, les frais et les délais avant paiement.",
  },
  {
    icon: ShieldCheck,
    title: "Contrôle qualité",
    text: "L’inspection et les photos sont partagées lorsque le service est prévu au devis.",
  },
  {
    icon: BadgePercent,
    title: "Paiement",
    text: "Le paiement intégral ou l’acompte suit les conditions confirmées pour le produit.",
  },
  {
    icon: Ship,
    title: "Expédition",
    text: "La marchandise part par fret aérien ou maritime selon l’option retenue.",
  },
  {
    icon: PackageCheck,
    title: "Suivi",
    text: "Consultez les événements confirmés avec votre référence d’expédition.",
  },
  {
    icon: Globe2,
    title: "Livraison",
    text: "Dédouanement et remise à destination selon le devis final.",
  },
];

function Index() {
  const reducedMotion = useReducedMotion();
  const products = useQuery({
    queryKey: ["home-featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("published", true)
        .order("popularity", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as (Product & { categories: { name: string } | null })[];
    },
  });
  const categories = useQuery(categoriesQuery);
  const settings = useSettings();
  const { user } = useUser();
  const topCategories = (categories.data ?? [])
    .filter((category) => !category.parent_id)
    .slice(0, 8);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-background">
        <img
          src={hero}
          alt="Port de conteneurs et transport de marchandises"
          width={1600}
          height={1008}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/25" />
        <div className="relative mx-auto grid min-h-[620px] w-full min-w-0 max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
            }
            className="w-full min-w-0 max-w-2xl"
          >
            <p className="glass inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Chine → Afrique → Europe
            </p>
            <h1 className="mt-6 break-words text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
              Trouvez vos marchandises.{" "}
              <span className="text-gradient">Suivez-les jusqu’à destination.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Parcourez les produits publiés par l’équipe Afrinexa, demandez un sourcing et
              choisissez votre mode de transport selon le devis confirmé.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <a href="#catalogue">Découvrir le catalogue</a>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/services">Demander un sourcing</Link>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" aria-hidden="true" /> Fiches publiées
                par l’équipe
              </span>
              <span className="inline-flex items-center gap-2">
                <PackageCheck className="size-4 text-accent" aria-hidden="true" /> Suivi selon les
                événements enregistrés
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }
            }
            className="glass w-full min-w-0 rounded-[2rem] p-5 shadow-card sm:p-7"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Suivi de colis
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Où est votre marchandise ?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Saisissez votre code, numéro de commande, AWB, BL ou numéro de conteneur.
            </p>
            <div className="mt-6">
              <TrackForm />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/suivi" search={{ q: undefined }}>
                  Ouvrir le suivi <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/boutique">Voir le catalogue</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Les informations affichées dépendent des événements confirmés dans le suivi.
            </p>
          </motion.div>
        </div>
      </section>

      <section
        id="catalogue"
        aria-labelledby="catalogue-title"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20"
      >
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                Catalogue Afrinexa
              </p>
              <h2 id="catalogue-title" className="mt-2 text-3xl font-bold sm:text-4xl md:text-5xl">
                Des marchandises publiées par notre équipe.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Cette sélection est chargée depuis les fiches publiées dans le panneau
                d’administration. Les noms, images, prix et devises proviennent du catalogue.
              </p>
            </div>
            <Button asChild variant="glass" size="lg">
              <Link to="/boutique">
                Voir tout le catalogue <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>

        {topCategories.length > 0 && (
          <div
            className="mt-7 flex gap-2 overflow-x-auto pb-2"
            aria-label="Catégories du catalogue"
          >
            {topCategories.map((category) => (
              <Link
                key={category.id}
                to="/boutique"
                search={{ q: undefined, cat: category.id, sort: undefined, page: undefined }}
                className="glass min-h-11 shrink-0 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition duration-200 hover:-translate-y-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transform-none"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
        {categories.isError && (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Les catégories ne sont pas disponibles pour le moment. Le catalogue complet reste
            consultable.
          </p>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.isLoading &&
            Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-[3/4] rounded-3xl"
                role="status"
                aria-label="Chargement du catalogue"
              />
            ))}
          {products.data?.map((product) => (
            <ProductCard key={product.id} p={product} />
          ))}
        </div>
        {products.isError && (
          <p
            role="alert"
            className="glass mt-6 rounded-3xl p-5 text-center text-sm text-muted-foreground"
          >
            Le catalogue est momentanément indisponible. Réessayez plus tard ou consultez la
            boutique.
          </p>
        )}
        {products.data?.length === 0 && (
          <div className="glass mt-6 rounded-3xl p-8 text-center sm:p-10">
            <PackageCheck className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 font-semibold">Aucun produit publié pour le moment.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les marchandises apparaîtront ici lorsqu’elles seront publiées dans le panneau
              d’administration.
            </p>
          </div>
        )}
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-14"
        aria-labelledby="services-title"
      >
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Commerce et logistique
            </p>
            <h2 id="services-title" className="mt-2 text-3xl font-bold sm:text-4xl md:text-5xl">
              Un accompagnement adapté à votre projet.
            </h2>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SERVICES.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.05}>
              <Link
                to={service.to}
                className="glass group flex h-full min-h-56 flex-col rounded-3xl p-6 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transform-none"
              >
                <service.icon className="size-8 text-accent" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-bold">{service.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.text}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  En savoir plus{" "}
                  <ArrowRight
                    className="size-4 transition duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-16"
        aria-labelledby="steps-title"
      >
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            De la demande à la livraison
          </p>
          <h2 id="steps-title" className="mt-2 text-3xl font-bold sm:text-4xl md:text-5xl">
            Les étapes de votre commande
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={(index % 4) * 0.05}>
              <article className="glass h-full rounded-3xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card motion-reduce:transform-none">
                <span className="font-display text-sm font-semibold text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <step.icon className="mt-4 size-7 text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-12"
        aria-label="Informations pratiques"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Reveal>
            <article className="glass h-full rounded-3xl p-6">
              <Globe2 className="size-8 text-accent" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold">Destinations selon le devis</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Les options de transport et de destination sont confirmées avec l’équipe avant
                validation.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.05}>
            <article className="glass h-full rounded-3xl p-6">
              <BadgePercent className="size-8 text-gold" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold">Prix et paiement clarifiés</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Le prix, le transport, les frais et les conditions de paiement sont confirmés dans
                le devis.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.1}>
            <article className="glass h-full rounded-3xl p-6">
              <MessageCircle className="size-8 text-accent" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold">Une équipe à vos côtés</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Échangez avec l’équipe via la messagerie de votre espace client ou la page Contact.
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand p-7 text-center text-primary-foreground sm:p-10 md:p-14">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
              Un produit ou un besoin à sourcer ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed opacity-90 md:text-base">
              Parcourez le catalogue, demandez un devis et retrouvez vos commandes et expéditions
              dans votre espace client.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/boutique">Explorer le catalogue</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/services">Demander un devis</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to={user ? "/messages" : "/auth"}>
                  <MessageCircle aria-hidden="true" /> {user ? "Messagerie" : "Connexion"}
                </Link>
              </Button>
              {settings?.whatsapp && (
                <Button asChild variant="glass" size="lg">
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              )}
              <Button asChild variant="glass" size="lg">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
