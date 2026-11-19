import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: ReactNode;
  text: string;
}) {
  return (
    <section className="relative overflow-hidden pb-12 pt-32">
      <div className="grid-bg absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground md:text-lg">{text}</p>
        </Reveal>
      </div>
    </section>
  );
}
