import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BadgePercent,
  FileText,
  Globe2,
  Handshake,
  MessageCircle,
  PackageCheck,
  Pause,
  Plane,
  Play,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import hero from "@/assets/hero-port.jpg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
          "Découvrez les marchandises du catalogue Afrinexa, demandez un sourcing et organisez vos expéditions entre la Chine, l’Afrique et l’Europe.",
      },
      { property: "og:title", content: "Afrinexa — Chine → Afrique → Europe" },
      {
        property: "og:description",
        content:
          "Catalogue de marchandises, sourcing et fret entre la Chine, l’Afrique et l’Europe.",
      },
    ],
  }),
  component: Index,
});

const HERO_SLIDES = [
  {
    eyebrow: "Commerce & sourcing",
    title: "Trouvez vos marchandises.",
    emphasis: "Du catalogue au devis.",
    text: "Parcourez les produits publiés par l’équipe Afrinexa ou décrivez votre besoin de sourcing.",
  },
  {
    eyebrow: "Transport international",
    title: "Un acheminement adapté.",
    emphasis: "Aérien ou maritime.",
    text: "Choisissez votre mode de transport selon les options et conditions confirmées dans le devis.",
  },
  {
    eyebrow: "Suivi de vos expéditions",
    title: "Gardez le fil de votre commande.",
    emphasis: "Étape après étape.",
    text: "Retrouvez les événements confirmés de votre expédition dans l’espace de suivi Afrinexa.",
  },
] as const;

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
  const [slideIndex, setSlideIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
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
  const activeSlide = HERO_SLIDES[slideIndex]!;

  useEffect(() => {
    if (reducedMotion || autoplayPaused) return;
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, reducedMotion]);

  return (
    <div className="storefront-light overflow-hidden">
      <section className="relative isolate overflow-hidden bg-[#0b2035] text-white">
        <img
          src={hero}
          alt="Port de conteneurs et avion de fret"
          width={1600}
          height={1008}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a2d]/90 via-[#0a2137]/76 to-[#0a2137]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a2d]/55 via-transparent to-[#071a2d]/20" />
        <div className="relative mx-auto flex min-h-[460px] w-full max-w-7xl items-center px-5 py-16 sm:px-8 md:min-h-[500px] md:py-20">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slideIndex}
                initial={reducedMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                {...(!reducedMotion ? { exit: { opacity: 0, x: -12 } } : {})}
                transition={
                  reducedMotion ? { duration: 0 } : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-300/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.17em] text-amber-200">
                  <Sparkles className="size-3.5" aria-hidden="true" /> {activeSlide.eyebrow}
                </p>
                <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                  {activeSlide.title} <span className="text-amber-300">{activeSlide.emphasis}</span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-6 text-white/85 sm:text-base md:text-lg">
                  {activeSlide.text}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                variant="hero"
                size="lg"
                className="bg-amber-400 text-[#142a40] hover:bg-amber-300"
              >
                <a href="#catalogue">
                  Découvrir le catalogue <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                className="border-white/35 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/services">Discuter avec un agent</Link>
              </Button>
            </div>
            <div
              className="mt-8 flex items-center gap-2"
              role="group"
              aria-label="Diapositives de présentation"
            >
              {HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.eyebrow}
                  type="button"
                  onClick={() => setSlideIndex(index)}
                  aria-label={`Afficher la présentation ${index + 1} : ${slide.eyebrow}`}
                  aria-pressed={slideIndex === index}
                  className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2035] motion-reduce:transition-none ${slideIndex === index ? "w-8 bg-amber-400" : "w-2.5 bg-white/55 hover:bg-white/85"}`}
                />
              ))}
              <span className="ml-2 text-xs text-white/70">
                {slideIndex + 1} / {HERO_SLIDES.length}
              </span>
              {!reducedMotion && (
                <button
                  type="button"
                  onClick={() => setAutoplayPaused((paused) => !paused)}
                  aria-label={
                    autoplayPaused
                      ? "Reprendre le défilement automatique"
                      : "Mettre le défilement automatique en pause"
                  }
                  aria-pressed={autoplayPaused}
                  className="ml-1 inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2035] motion-reduce:transition-none"
                >
                  {autoplayPaused ? (
                    <Play className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Pause className="size-3.5" aria-hidden="true" />
                  )}
                  <span>{autoplayPaused ? "Reprendre" : "Pause"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="categories-title"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16"
      >
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Sélection par univers
            </p>
            <h2 id="categories-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Nos catégories vedettes
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Explorez les catégories disponibles dans le catalogue Afrinexa.
            </p>
          </div>
        </Reveal>
        {topCategories.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {topCategories.map((category, index) => (
              <Reveal key={category.id} delay={(index % 4) * 0.045}>
                <Link
                  to="/boutique"
                  search={{ q: undefined, cat: category.id, sort: undefined, page: undefined }}
                  className="group flex min-h-28 h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-5 text-center shadow-[0_5px_18px_-14px_rgba(20,41,64,.4)] transition duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-amber-50 text-amber-600 transition duration-200 group-hover:bg-amber-100 motion-reduce:transition-none">
                    <Tag className="size-4" aria-hidden="true" />
                  </span>
                  <span className="mt-3 text-sm font-bold text-slate-900">{category.name}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">
                    Explorer{" "}
                    <ArrowRight
                      className="size-3 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
        {categories.isError && (
          <p role="status" className="mt-4 text-center text-sm text-muted-foreground">
            Les catégories ne sont pas disponibles pour le moment. Le catalogue complet reste
            consultable.
          </p>
        )}
      </section>

      <section className="bg-[#0d2a45] py-11 text-white md:py-14" aria-labelledby="services-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                  Commerce et logistique
                </p>
                <h2 id="services-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">
                  Un accompagnement adapté à votre projet.
                </h2>
              </div>
              <Link
                to="/services"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Tous nos services <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map((service, index) => (
              <Reveal key={service.title} delay={index * 0.04}>
                <Link
                  to={service.to}
                  className="group flex h-full min-h-48 flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition duration-200 hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <service.icon className="size-7 text-amber-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold">{service.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                    {service.text}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-200">
                    En savoir plus{" "}
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-10"
        aria-label="Informations sur les paiements"
      >
        <Reveal>
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-sky-50 p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <BadgePercent className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">
                Modalités de paiement précisées avant expédition
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Un acompte éventuel ou le paiement intégral dépend des conditions indiquées sur le
                produit ou confirmées dans le devis. Vérifiez les modalités avant de valider votre
                commande.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section
        id="catalogue"
        aria-labelledby="catalogue-title"
        className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-14"
      >
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Catalogue Afrinexa
              </p>
              <h2 id="catalogue-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Sélection de produits populaires
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Les références publiées dans le catalogue, leurs images et leurs prix actuels.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            >
              <Link to="/boutique">
                Voir tout le catalogue <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>

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
          {products.data?.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-32px" }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.42,
                      delay: Math.min(index * 0.045, 0.25),
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
              className="h-full"
            >
              <ProductCard p={product} tone="light" />
            </motion.div>
          ))}
        </div>
        {products.isError && (
          <p
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800"
          >
            Le catalogue est momentanément indisponible. Réessayez plus tard ou consultez la
            boutique.
          </p>
        )}
        {products.data?.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card sm:p-10">
            <PackageCheck className="mx-auto size-9 text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-900">
              Aucun produit publié pour le moment.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Les marchandises apparaîtront ici lorsqu’elles seront publiées dans le panneau
              d’administration.
            </p>
          </div>
        )}
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-14"
        aria-labelledby="steps-title"
      >
        <Reveal>
          <div className="rounded-[2rem] border border-slate-200 bg-[#f0f3f8] p-5 sm:p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div>
                <p className="inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">
                  Comment ça marche ?
                </p>
                <h2
                  id="steps-title"
                  className="mt-4 max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl"
                >
                  Achetez en Chine et organisez votre livraison avec Afrinexa.
                </h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {STEPS.map((step, index) => (
                    <div
                      key={step.title}
                      className="flex gap-3 rounded-xl border border-white/80 bg-white/75 p-3.5"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#102d49] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
                <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <MessageCircle className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900">
                  Des questions ? Contactez notre équipe.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  L’équipe Afrinexa peut vous renseigner sur le sourcing, les options de fret et les
                  conditions de votre devis.
                </p>
                <div className="mt-5 grid gap-2">
                  {settings?.whatsapp && (
                    <Button
                      asChild
                      className="min-h-12 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <a
                        href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle aria-hidden="true" /> Conseiller commercial WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-12 border-slate-300 text-slate-900 hover:bg-slate-50"
                  >
                    <Link to="/contact">Contacter l’équipe</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-8 sm:px-8 md:py-10"
        aria-label="Informations pratiques"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Reveal>
            <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <Globe2 className="size-7 text-sky-700" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Destinations selon le devis</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Les options de transport et de destination sont confirmées avec l’équipe avant
                validation.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.05}>
            <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <BadgePercent className="size-7 text-amber-600" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Prix et paiement clarifiés</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Le prix, le transport, les frais et les conditions de paiement sont confirmés dans
                le devis.
              </p>
            </article>
          </Reveal>
          <Reveal delay={0.1}>
            <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <MessageCircle className="size-7 text-sky-700" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Une équipe à vos côtés</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Échangez avec l’équipe via la messagerie de votre espace client ou la page Contact.
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-9 sm:px-8 md:py-14"
        aria-labelledby="reviews-title"
      >
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                Votre expérience compte
              </p>
              <h2 id="reviews-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Vos retours d’expérience
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Aucun avis client public n’est encore affiché sur Afrinexa.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            >
              <Link to="/contact">Contacter l’équipe</Link>
            </Button>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-600 shadow-card">
            Si vous avez déjà commandé avec Afrinexa, contactez l’équipe pour partager votre
            expérience.
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-5 sm:px-8 md:pb-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#f2a900] to-[#efbd42] p-7 text-center text-[#102a44] shadow-card sm:p-10 md:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-white/30"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-5 -top-16 size-48 rounded-full border border-white/25"
            />
            <h2 className="relative text-3xl font-extrabold sm:text-4xl md:text-5xl">
              Un produit ou un besoin à sourcer ?
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#102a44]/80 md:text-base">
              Parcourez le catalogue, demandez un devis et retrouvez vos commandes et expéditions
              dans votre espace client.
            </p>
            <div className="relative mt-7 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#102a44]/20 bg-white text-[#102a44] hover:bg-white/90"
              >
                <Link to="/boutique">Explorer le catalogue</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#102a44]/30 bg-transparent text-[#102a44] hover:bg-white/15"
              >
                <Link to="/services">Demander un devis</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#102a44]/30 bg-transparent text-[#102a44] hover:bg-white/15"
              >
                <Link to={user ? "/messages" : "/auth"}>
                  <MessageCircle aria-hidden="true" /> {user ? "Messagerie" : "Connexion"}
                </Link>
              </Button>
              {settings?.whatsapp && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-[#102a44]/30 bg-transparent text-[#102a44] hover:bg-white/15"
                >
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#102a44]/30 bg-transparent text-[#102a44] hover:bg-white/15"
              >
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
