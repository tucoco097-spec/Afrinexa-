import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Afrinexa" },
      {
        name: "description",
        content:
          "Afrinexa accompagne les importateurs africains dans leurs achats et expéditions depuis la Chine.",
      },
      { property: "og:title", content: "À propos — Afrinexa" },
      {
        property: "og:description",
        content:
          "Afrinexa accompagne les importateurs africains dans leurs achats et expéditions depuis la Chine.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero
        eyebrow="À propos"
        title={
          <>
            Le pont entre <span className="text-gold">la Chine et l'Afrique</span>
          </>
        }
        text="Nous aidons commerçants, entreprises et particuliers à acheter en Chine en toute sécurité, avec un suivi clair de chaque marchandise."
      />
      <div className="mx-auto grid max-w-5xl gap-4 px-5 md:grid-cols-3">
        {[
          ["Transparence", "Devis détaillés, frais séparés, aucun coût caché."],
          ["Suivi", "Un code unique par expédition, consultable à tout moment."],
          ["Proximité", "Une équipe qui vous répond, en français."],
        ].map(([t, d], i) => (
          <Reveal key={t} delay={i * 0.08}>
            <div className="glass h-full rounded-3xl p-7">
              <h3 className="text-xl font-bold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}
