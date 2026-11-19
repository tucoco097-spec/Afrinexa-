import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Reveal } from "@/components/site/Reveal";
import { Search, ShieldCheck, Plane, Ship, FileCheck, Truck } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Nos services — Afrinexa" },
      {
        name: "description",
        content:
          "Sourcing en Chine, contrôle qualité, fret aérien et maritime, dédouanement et livraison en Afrique et en Europe.",
      },
      { property: "og:title", content: "Nos services — Afrinexa" },
      {
        property: "og:description",
        content:
          "Sourcing en Chine, contrôle qualité, fret aérien et maritime, dédouanement et livraison en Afrique et en Europe.",
      },
    ],
  }),
  component: Page,
});

const ITEMS = [
  {
    i: Search,
    t: "Sourcing fournisseurs",
    d: "Recherche, comparaison et négociation auprès d'usines et grossistes chinois.",
  },
  {
    i: ShieldCheck,
    t: "Contrôle qualité",
    d: "Vérification des marchandises à réception, photos et rapport avant expédition.",
  },
  { i: Plane, t: "Fret aérien", d: "Envois rapides, consolidation des colis et suivi par AWB." },
  {
    i: Ship,
    t: "Fret maritime",
    d: "Groupage LCL ou conteneur complet FCL, suivi par BL et conteneur.",
  },
  {
    i: FileCheck,
    t: "Dédouanement",
    d: "Préparation des documents et accompagnement aux formalités douanières.",
  },
  { i: Truck, t: "Livraison locale", d: "Retrait en agence ou livraison à votre adresse." },
];

function Page() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title={
          <>
            De l'usine <span className="text-gradient">à votre porte</span>
          </>
        }
        text="Une seule équipe pour acheter, vérifier, expédier et livrer vos marchandises."
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((x, k) => (
          <Reveal key={x.t} delay={k * 0.05}>
            <div className="glass h-full rounded-3xl p-7 transition hover:-translate-y-1 hover:shadow-glow">
              <x.i className="size-9 text-accent" />
              <h3 className="mt-5 text-xl font-bold">{x.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}
