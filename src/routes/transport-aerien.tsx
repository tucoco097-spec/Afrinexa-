import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Reveal } from "@/components/site/Reveal";
import { TrackForm } from "@/components/site/TrackForm";
import { TrackingSlideshow } from "@/components/site/TrackingSlideshow";
import { AIR_STATUSES } from "@/lib/statuses";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/transport-aerien")({
  head: () => ({
    meta: [
      { title: "Transport aérien — Afrinexa" },
      {
        name: "description",
        content:
          "Fret aérien Chine → Afrique → Europe : consolidation, AWB, poids taxable et suivi à chaque étape.",
      },
      { property: "og:title", content: "Transport aérien — Afrinexa" },
      {
        property: "og:description",
        content:
          "Fret aérien Chine → Afrique → Europe : consolidation, AWB, poids taxable et suivi à chaque étape.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero
        eyebrow="Transport aérien"
        title={
          <>
            Le plus <span className="text-gradient">rapide</span>
          </>
        }
        text="Idéal pour les envois urgents, les échantillons et les marchandises de valeur."
      />
      <div className="mx-auto max-w-4xl px-5 pb-10">
        <Reveal>
          <section className="glass rounded-3xl p-6 md:p-8" aria-labelledby="air-tracking-title">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Suivi aérien
            </p>
            <h2 id="air-tracking-title" className="mt-2 text-2xl font-bold">
              Suivez votre envoi aérien
            </h2>
            <p className="mb-5 mt-2 text-sm text-muted-foreground">
              Saisissez le code de suivi, la commande ou le numéro AWB.
            </p>
            <TrackForm />
          </section>
        </Reveal>

        <TrackingSlideshow mode="air" />

        <Reveal>
          <section className="glass mt-8 rounded-3xl p-6 md:p-10" aria-labelledby="air-steps-title">
            <h2 id="air-steps-title" className="text-2xl font-bold">
              Les étapes de votre envoi
            </h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {AIR_STATUSES.map((status, index) => (
                <li
                  key={status}
                  className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3 text-sm"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  {status}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/contact">Demander un devis</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/suivi" search={{ q: undefined }}>
                  Suivi global
                </Link>
              </Button>
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
