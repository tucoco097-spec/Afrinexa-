import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Reveal } from "@/components/site/Reveal";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Afrinexa" },
      {
        name: "description",
        content:
          "Contactez Afrinexa pour un devis de sourcing ou de transport Chine → Afrique → Europe.",
      },
      { property: "og:title", content: "Contact — Afrinexa" },
      {
        property: "og:description",
        content:
          "Contactez Afrinexa pour un devis de sourcing ou de transport Chine → Afrique → Europe.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const s = useSettings();
  const rows = [
    { i: Phone, l: "Téléphone", v: s?.phone, href: s?.phone ? `tel:${s.phone}` : undefined },
    {
      i: MessageCircle,
      l: "WhatsApp",
      v: s?.whatsapp,
      href: s?.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, "")}` : undefined,
    },
    { i: Mail, l: "Email", v: s?.email, href: s?.email ? `mailto:${s.email}` : undefined },
    { i: MapPin, l: "Bureau Chine", v: s?.address_china },
    { i: MapPin, l: "Bureau Cameroun", v: s?.address_cameroon },
  ].filter((r) => r.v);
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Parlons de <span className="text-gradient">votre projet</span>
          </>
        }
        text="Une question, un devis, un produit à trouver ? Notre équipe vous répond."
      />
      <div className="mx-auto grid max-w-4xl gap-4 px-5 sm:grid-cols-2">
        {rows.length === 0 && (
          <p className="glass rounded-3xl p-8 text-center text-muted-foreground sm:col-span-2">
            Les coordonnées seront bientôt disponibles.
          </p>
        )}
        {rows.map((r, k) => (
          <Reveal key={r.l} delay={k * 0.05}>
            <a
              href={r.href}
              target={r.href?.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="glass flex h-full items-start gap-4 rounded-3xl p-6 transition hover:shadow-glow"
            >
              <r.i className="size-6 shrink-0 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">{r.l}</p>
                <p className="mt-1 font-semibold">{r.v}</p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </>
  );
}
