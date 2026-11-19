import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Plane,
  Ship,
  Search,
  ShieldCheck,
  PackageCheck,
  FileText,
  Handshake,
  ArrowRight,
  BadgePercent,
  Globe2,
  MessageCircle,
} from "lucide-react";
import hero from "@/assets/hero-port.jpg";

import { Button } from "@/components/ui/button";
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
          "Achetez et faites expédier vos marchandises entre la Chine, l’Afrique et l’Europe avec sourcing, contrôle qualité, fret aérien, fret maritime et tracking.",
      },
      { property: "og:title", content: "Afrinexa — Chine → Afrique → Europe" },
      {
        property: "og:description",
        content: "Catalogue, sourcing, fret aérien et maritime, suivi de colis en ligne.",
      },
    ],
  }),
  component: Index,
});

const SUPPLIED_PRODUCT_ASSETS = [
  "IMG-20251127-WA0002.jpg",
  "IMG-20251127-WA0003.jpg",
  "IMG-20251127-WA0004.jpg",
  "IMG-20251127-WA0005.jpg",
  "IMG-20251127-WA0006.jpg",
  "IMG-20251127-WA0007.jpg",
  "IMG-20251127-WA0008.jpg",
  "IMG-20251127-WA0009.jpg",
  "IMG-20251127-WA0010.jpg",
  "IMG-20251127-WA0011.jpg",
  "IMG-20251127-WA0015.jpg",
  "IMG-20251127-WA0016.jpg",
  "IMG-20251127-WA0017.jpg",
  "IMG-20251127-WA0018.jpg",
  "IMG-20251127-WA0019.jpg",
  "IMG-20251127-WA0021.jpg",
  "IMG-20251127-WA0022.jpg",
  "IMG-20251127-WA0023.jpg",
  "IMG-20251127-WA0025.jpg",
  "IMG-20251127-WA0026.jpg",
  "IMG-20251127-WA0027.jpg",
  "IMG-20251127-WA0028.jpg",
  "IMG-20251127-WA0029.jpg",
  "IMG-20251127-WA0030.jpg",
];
const CARRIER_ASSETS = ["chrono.jpg", "dhl.jpg", "fedex.jpg", "relais.jpg"];

const STEPS = [
  {
    icon: Search,
    t: "Choix du produit",
    d: "Sélectionnez un produit publié ou décrivez votre besoin de sourcing.",
  },
  {
    icon: FileText,
    t: "Validation de commande",
    d: "Confirmez les références, les quantités et la destination souhaitée.",
  },
  {
    icon: Handshake,
    t: "Devis et transport",
    d: "Un agent confirme le prix, le transport, les frais et les délais avant paiement.",
  },
  {
    icon: ShieldCheck,
    t: "Contrôle qualité",
    d: "L’inspection et les photos sont partagées lorsque le service est prévu au devis.",
  },
  {
    icon: BadgePercent,
    t: "Paiement",
    d: "Le paiement intégral ou l’acompte suit les conditions confirmées pour le produit.",
  },
  {
    icon: Ship,
    t: "Expédition",
    d: "La marchandise part par fret aérien ou maritime selon l’option retenue.",
  },
  {
    icon: PackageCheck,
    t: "Suivi",
    d: "Consultez les événements confirmés avec votre référence d’expédition.",
  },
  {
    icon: Globe2,
    t: "Livraison",
    d: "Dédouanement et remise à destination selon le devis final.",
  },
];

const normalizeCategory = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function Index() {
  const products = useQuery({
    queryKey: ["home-featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("published", true)
        .order("popularity", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as (Product & { categories: { name: string } | null })[];
    },
  });
  const categories = useQuery(categoriesQuery);
  const settings = useSettings();
  const { user } = useUser();
  const featuredCategories = [
    { label: "Électronique & accessoires", terms: ["electronique", "accessoire"] },
    { label: "Téléphones & informatique", terms: ["telephone", "smartphone", "informatique"] },
    { label: "Véhicules & motos", terms: ["vehicule", "moto", "auto"] },
    { label: "Maison & électroménager", terms: ["maison", "electromenager"] },
    { label: "Vêtements & chaussures", terms: ["vetement", "mode", "chaussure"] },
    { label: "Autres produits", terms: ["autre", "divers"] },
  ];
  const categoryRows = categories.data ?? [];

  return (
    <>
      <section className="relative flex min-h-[92vh] items-end overflow-hidden pb-16 pt-32">
        <img
          src={hero}
          alt="Port de conteneurs la nuit avec un avion cargo"
          width={1600}
          height={1008}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="bg-hero-fade absolute inset-0" />
        <div className="relative mx-auto w-full max-w-6xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Chine → Afrique → Europe
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] md:text-7xl">
              Importez de Chine vers l’Afrique et l’Europe,{" "}
              <span className="text-gradient">sans surprise.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Sourcing, contrôle qualité, fret aérien et maritime. Suivez chaque étape de vos
              marchandises, de l'usine jusqu'à votre porte.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-8 max-w-2xl"
          >
            <TrackForm />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/boutique">Découvrir le catalogue</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/services">Demander un sourcing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="text-3xl font-bold md:text-5xl">
            Deux voies, <span className="text-gold">un seul suivi.</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <Link
              to="/transport-aerien"
              className="group glass relative block h-full overflow-hidden rounded-3xl p-8 transition hover:-translate-y-1 hover:shadow-glow"
            >
              <Plane className="size-10 text-accent" />
              <h3 className="mt-6 text-2xl font-bold">Fret aérien</h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Pour les envois urgents et les petites quantités. AWB, poids taxable et suivi vol
                par vol.
              </p>
              <ArrowRight className="mt-6 transition group-hover:translate-x-2" />
            </Link>
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-2">
            <Link
              to="/services"
              className="group relative block h-full overflow-hidden rounded-3xl bg-brand p-8 text-primary-foreground transition hover:-translate-y-1"
            >
              <Handshake className="size-10" />
              <h3 className="mt-6 text-2xl font-bold">Sourcing en Chine</h3>
              <p className="mt-2 opacity-90">Recherche et négociation avec les fournisseurs.</p>
            </Link>
          </Reveal>
          <Reveal delay={0.15} className="md:col-span-2">
            <div className="glass h-full rounded-3xl p-8">
              <ShieldCheck className="size-10 text-gold" />
              <h3 className="mt-6 text-xl font-bold">Contrôle qualité</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Inspection à l'entrepôt avant chaque départ.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.2} className="md:col-span-4">
            <Link
              to="/transport-maritime"
              className="group glass relative block h-full overflow-hidden rounded-3xl p-8 transition hover:-translate-y-1 hover:shadow-glow"
            >
              <Ship className="size-10 text-accent" />
              <h3 className="mt-6 text-2xl font-bold">Fret maritime</h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Groupage LCL ou conteneur complet FCL. BL, booking et numéro de conteneur.
              </p>
              <ArrowRight className="mt-6 transition group-hover:translate-x-2" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <h2 className="text-3xl font-bold md:text-5xl">Comment ça marche</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="glass h-full rounded-3xl p-6">
                <span className="font-display text-sm text-gold">0{i + 1}</span>
                <s.icon className="mt-4 size-8 text-accent" />
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                Sélection catalogue
              </p>
              <h2 className="mt-2 text-3xl font-bold md:text-5xl">
                Des produits, un accompagnement de bout en bout.
              </h2>
            </div>
            <Button asChild variant="glass">
              <Link to="/boutique">
                Voir toute la boutique <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="glass aspect-[3/4] animate-pulse rounded-3xl"
                role="status"
                aria-label="Chargement des produits populaires"
              />
            ))}
          {products.data?.map((product) => (
            <ProductCard key={product.id} p={product} />
          ))}
        </div>
        {products.isError && (
          <p
            role="alert"
            className="mt-5 rounded-2xl border border-border p-4 text-sm text-muted-foreground"
          >
            Le catalogue populaire est momentanément indisponible. Consultez la boutique ou
            réessayez plus tard.
          </p>
        )}
        {products.data?.length === 0 && (
          <p className="mt-5 rounded-2xl border border-border p-4 text-sm text-muted-foreground">
            Aucun produit publié pour le moment. Notre équipe mettra cette sélection à jour dès que
            le catalogue sera prêt.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                Commerce B2B & B2C
              </p>
              <h2 className="mt-2 text-3xl font-bold md:text-5xl">Trouvez, commandez, importez.</h2>
            </div>
            <Button asChild variant="glass">
              <Link to="/boutique">
                Explorer les catégories <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCategories.map((feature, i) => {
            const category = categoryRows.find((row) =>
              feature.terms.some((term) => normalizeCategory(row.name).includes(term)),
            );
            return (
              <Link
                key={feature.label}
                to="/boutique"
                search={{ q: undefined, cat: category?.id, sort: undefined, page: undefined }}
                className="group glass rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-glow"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-brand text-primary-foreground">
                  0{i + 1}
                </span>
                <h3 className="mt-5 font-bold">{feature.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {category
                    ? `Parcourez les produits de la catégorie ${category.name}.`
                    : "Parcourez le catalogue ou demandez un sourcing selon votre besoin."}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  Voir les produits{" "}
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <Reveal>
            <div className="glass h-full rounded-3xl p-6">
              <Globe2 className="size-8 text-accent" />
              <h3 className="mt-5 text-xl font-bold">Destinations flexibles</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Chine, Afrique et Europe : nous adaptons le routage aérien ou maritime à votre
                destination et votre budget.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass h-full rounded-3xl p-6">
              <BadgePercent className="size-8 text-gold" />
              <h3 className="mt-5 text-xl font-bold">Paiement selon devis</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Un acompte est un paiement partiel prévu pour le produit. Il déclenche l’expédition
                uniquement lorsque c’est indiqué ; le solde suit les conditions du produit ou du
                devis. Sans acompte défini, le paiement intégral peut être demandé. Transport,
                douane et livraison sont confirmés dans le devis final.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="glass h-full rounded-3xl p-6">
              <MessageCircle className="size-8 text-accent" />
              <h3 className="mt-5 text-xl font-bold">Un agent à vos côtés</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Échangez avec notre équipe via la messagerie de votre espace client pour valider
                produit, transport et livraison.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                Galerie catalogue
              </p>
              <h2 className="text-3xl font-bold md:text-5xl">Des visuels produits et transport.</h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Les images fournies sont conservées. Les noms, prix et stocks apparaissent dans le
              catalogue à partir des fiches produit publiées et validées.
            </p>
          </div>
        </Reveal>
        <div className="mt-8 grid grid-cols-3 gap-2 md:grid-cols-6">
          {SUPPLIED_PRODUCT_ASSETS.map((name, i) => (
            <Reveal key={name} delay={(i % 6) * 0.03}>
              <img
                src={`/chipment/${name}`}
                alt={`Photo de produit fournie pour le catalogue Afrinexa ${i + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-2xl border border-border bg-card object-contain p-1 transition duration-500 hover:scale-[1.02]"
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card/60 p-4">
          <span className="text-sm font-semibold">Références de transport :</span>
          {CARRIER_ASSETS.map((name) => (
            <img
              key={name}
              src={`/chipment/${name}`}
              alt={`Transport ${name.replace(".jpg", "")}`}
              loading="lazy"
              className="h-12 w-20 rounded-lg bg-white object-contain p-2"
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <Reveal>
          <div className="glass rounded-3xl p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Avis clients
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Des retours vérifiés, pas inventés.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Les avis seront affichés ici après validation par l’équipe. Aucun témoignage n’est
              publié sans source vérifiable.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand p-10 text-center text-primary-foreground md:p-16">
            <h2 className="text-3xl font-bold md:text-5xl">Prêt à importer ?</h2>
            <p className="mx-auto mt-4 max-w-xl opacity-90">
              Demandez un devis, échangez avec un agent et retrouvez vos commandes et expéditions
              dans votre espace client.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="gold" size="xl">
                <Link to="/auth">Créer mon compte</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/services">Demander un devis</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to={user ? "/messages" : "/auth"}>
                  <MessageCircle /> {user ? "Messagerie" : "Connexion à la messagerie"}
                </Link>
              </Button>
              {settings?.whatsapp && (
                <Button asChild variant="glass" size="xl">
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              )}
              <Button asChild variant="glass" size="xl">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
