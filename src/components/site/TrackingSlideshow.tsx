import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TrackingMode = "air" | "sea" | "all";

type GalleryImage = { filename: string; alt: string };

const AIR_IMAGES: GalleryImage[] = [
  {
    filename: "air-fret-illustration-01.jpg",
    alt: "Illustration de fret aérien avec avion cargo et palettes préparées à l’aéroport.",
  },
  {
    filename: "air-fret-illustration-02.jpg",
    alt: "Illustration de palettes de fret aérien acheminées vers un avion cargo.",
  },
  {
    filename: "air-fret-illustration-03.jpg",
    alt: "Illustration d’un avion cargo en vol et de palettes de fret près d’un aéroport.",
  },
];

const SEA_IMAGES: GalleryImage[] = [
  {
    filename: "IMG-20251127-WA0002.jpg",
    alt: "Colis et palettes arrimés sur un bateau près d’un navire de fret.",
  },
  {
    filename: "IMG-20251127-WA0003.jpg",
    alt: "Navire porte-conteneurs et remorqueur dans une zone portuaire.",
  },
  {
    filename: "IMG-20251127-WA0004.jpg",
    alt: "Port avec navire, conteneurs, grues et contrôle de marchandises.",
  },
  {
    filename: "IMG-20251127-WA0010.jpg",
    alt: "Illustration d’un navire chargé de conteneurs en mer.",
  },
  {
    filename: "IMG-20251127-WA0015.jpg",
    alt: "Vue aérienne d’un navire porte-conteneurs sur la mer.",
  },
  {
    filename: "IMG-20251127-WA0016.jpg",
    alt: "Grue portuaire déplaçant un conteneur au-dessus d’un navire.",
  },
  {
    filename: "IMG-20251127-WA0017.jpg",
    alt: "Conteneurs empilés dans une cour portuaire sous un portique de manutention.",
  },
  {
    filename: "IMG-20251127-WA0018.jpg",
    alt: "Navire chargé de conteneurs vu de face sur l’eau.",
  },
  {
    filename: "IMG-20251127-WA0025.jpg",
    alt: "Marchandises manutentionnées à l’intérieur d’un conteneur maritime ouvert.",
  },
];

const CARRIER_IMAGES = ["chrono.jpg", "dhl.jpg", "fedex.jpg", "relais.jpg"];
const SLIDE_SIZE = 2;

const GALLERY_COPY: Record<TrackingMode, { eyebrow: string; title: string; text: string }> = {
  air: {
    eyebrow: "Fret aérien · visuels illustratifs",
    title: "Le fret aérien, en images.",
    text: "Illustrations génériques du transport aérien de marchandises; elles ne représentent pas une expédition ou une opération Afrinexa précise.",
  },
  sea: {
    eyebrow: "Fret maritime · visuels fournis",
    title: "Les ports et le fret maritime.",
    text: "Une sélection de visuels fournis montrant des navires, des conteneurs et des scènes portuaires.",
  },
  all: {
    eyebrow: "Galerie Afrinexa",
    title: "Des visuels pour accompagner votre suivi.",
    text: "Illustrations génériques du fret aérien et visuels fournis sur le transport maritime. Ils servent de repères visuels et ne décrivent pas le statut d’une expédition.",
  },
};

function chunkImages(images: GalleryImage[]) {
  return Array.from({ length: Math.ceil(images.length / SLIDE_SIZE) }, (_, index) =>
    images.slice(index * SLIDE_SIZE, (index + 1) * SLIDE_SIZE),
  );
}

export function TrackingSlideshow({ mode = "all" }: { mode?: TrackingMode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const images =
    mode === "air" ? AIR_IMAGES : mode === "sea" ? SEA_IMAGES : [...AIR_IMAGES, ...SEA_IMAGES];
  const slides = chunkImages(images);
  const copy = GALLERY_COPY[mode];
  const autoplay = !reducedMotion && !pausedByUser && !hovered && !focused;
  const currentImages = slides[activeIndex] ?? [];

  useEffect(() => {
    setActiveIndex(0);
  }, [mode]);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoplay, slides.length]);

  function moveSlide(direction: number) {
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <section
      aria-labelledby={`tracking-gallery-title-${mode}`}
      aria-label={
        mode === "all"
          ? "Galerie de transport"
          : `Galerie de fret ${mode === "air" ? "aérien" : "maritime"}`
      }
      aria-roledescription="carrousel"
      className="mt-8"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) setFocused(false);
      }}
    >
      <div className="glass overflow-hidden rounded-[2rem] p-5 sm:p-7 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              {copy.eyebrow}
            </p>
            <h2
              id={`tracking-gallery-title-${mode}`}
              className="mt-2 text-2xl font-bold sm:text-3xl"
            >
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.text}</p>
          </div>
          <div className="flex items-center gap-2">
            {!reducedMotion && slides.length > 1 && (
              <Button
                type="button"
                variant="glass"
                size="icon"
                className="size-11"
                onClick={() => setPausedByUser((value) => !value)}
                aria-label={
                  pausedByUser ? "Reprendre le diaporama" : "Mettre le diaporama en pause"
                }
                title={pausedByUser ? "Reprendre le diaporama" : "Mettre le diaporama en pause"}
              >
                {pausedByUser ? <Play className="size-4" /> : <Pause className="size-4" />}
              </Button>
            )}
            {slides.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="glass"
                  size="icon"
                  className="size-11"
                  onClick={() => moveSlide(-1)}
                  aria-label="Afficher les images précédentes"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  size="icon"
                  className="size-11"
                  onClick={() => moveSlide(1)}
                  aria-label="Afficher les images suivantes"
                >
                  <ArrowRight className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          className="mt-6"
          aria-live={autoplay ? "off" : "polite"}
          aria-atomic="true"
          aria-label={`Diapositive ${activeIndex + 1} sur ${slides.length}`}
        >
          <motion.div
            key={`${mode}-${activeIndex}`}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
            }
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {currentImages.map((image) => (
              <figure
                key={image.filename}
                className="overflow-hidden rounded-2xl border border-border bg-secondary/60"
              >
                <img
                  src={`/chipment/${image.filename}`}
                  alt={image.alt}
                  loading="lazy"
                  className="aspect-video w-full object-contain"
                />
              </figure>
            ))}
          </motion.div>
        </div>

        {slides.length > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Série {activeIndex + 1} sur {slides.length}
            </p>
            <div className="flex flex-wrap gap-1.5" aria-label="Choisir une diapositive">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Afficher la série d’images ${index + 1}`}
                  aria-current={activeIndex === index ? "true" : undefined}
                  className={`grid size-11 place-items-center rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeIndex === index ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span
                    className={`h-2.5 rounded-full transition-all duration-200 ${activeIndex === index ? "w-7 bg-accent" : "w-2.5 bg-muted-foreground/50"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "all" && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Logos de transport fournis
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {CARRIER_IMAGES.map((filename) => (
                <img
                  key={filename}
                  src={`/chipment/${filename}`}
                  alt={`Logo fourni : ${filename.replace(".jpg", "")}`}
                  loading="lazy"
                  className="h-11 w-20 rounded-lg bg-white object-contain p-2"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
