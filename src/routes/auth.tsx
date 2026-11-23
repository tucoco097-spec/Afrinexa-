import { createFileRoute } from "@tanstack/react-router";
import { PremiumLoginExperience } from "@/components/auth/PremiumAuthExperience";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Afrinexa" },
      { name: "description", content: "Securely access your AFRINEXA client account." },
      { property: "og:title", content: "AFRINEXA — Secure client access" },
      { property: "og:description", content: "Sign in to your AFRINEXA account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PremiumLoginExperience,
});
