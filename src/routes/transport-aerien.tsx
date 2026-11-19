import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Reveal } from "@/components/site/Reveal";
import { AIR_STATUSES } from "@/lib/statuses";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

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
      <div className="mx-auto max-w-4xl px-5">
        <Reveal>
          <div className="glass rounded-3xl p-6 md:p-10">
            <h2 className="text-2xl font-bold">Les étapes de votre envoi</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {AIR_STATUSES.map((s, i) => (
                <li
                  key={s}
                  className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3 text-sm"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/contact">Demander un devis</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/suivi" search={{ q: undefined }}>
                  Suivre un colis
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
