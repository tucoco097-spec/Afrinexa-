import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRODUCT_IMAGES = [
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
const CARRIER_IMAGES = ["chrono.jpg", "dhl.jpg", "fedex.jpg", "relais.jpg"];
const SLIDE_SIZE = 3;
const SLIDES = Array.from({ length: Math.ceil(PRODUCT_IMAGES.length / SLIDE_SIZE) }, (_, index) =>
  PRODUCT_IMAGES.slice(index * SLIDE_SIZE, (index + 1) * SLIDE_SIZE),
);

export function TrackingSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const autoplay = !reducedMotion && !pausedByUser && !hovered && !focused;
  const images = SLIDES[activeIndex] ?? [];

  useEffect(() => {
    if (!autoplay || SLIDES.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoplay]);

  function moveSlide(direction: number) {
    setActiveIndex((current) => (current + direction + SLIDES.length) % SLIDES.length);
  }

  return (
    <section
      aria-labelledby="tracking-gallery-title"
      aria-label="Galerie d’images"
      aria-roledescription="carrousel"
      className="mt-14"
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
              Galerie Afrinexa
            </p>
            <h2 id="tracking-gallery-title" className="mt-2 text-2xl font-bold sm:text-3xl">
              Des visuels pour accompagner votre suivi.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ces images fournies illustrent les marchandises et les repères de transport. Consultez
              le catalogue pour les fiches, disponibilités et prix confirmés.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!reducedMotion && (
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
          </div>
        </div>

        <div
          className="mt-6"
          aria-live={autoplay ? "off" : "polite"}
          aria-atomic="true"
          aria-label={`Diapositive ${activeIndex + 1} sur ${SLIDES.length}`}
        >
          <motion.div
            key={activeIndex}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
            }
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {images.map((filename, imageIndex) => (
              <img
                key={filename}
                src={`/chipment/${filename}`}
                alt={`Image fournie pour illustrer les marchandises, visuel ${activeIndex * SLIDE_SIZE + imageIndex + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-2xl border border-border bg-secondary object-contain p-2 sm:p-3"
              />
            ))}
          </motion.div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Série {activeIndex + 1} sur {SLIDES.length}
          </p>
          <div className="flex flex-wrap gap-1.5" aria-label="Choisir une diapositive">
            {SLIDES.map((_, index) => (
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

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Visuels de référence transport
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {CARRIER_IMAGES.map((filename) => (
              <img
                key={filename}
                src={`/chipment/${filename}`}
                alt={`Visuel fourni : ${filename.replace(".jpg", "")}`}
                loading="lazy"
                className="h-11 w-20 rounded-lg bg-white object-contain p-2"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
