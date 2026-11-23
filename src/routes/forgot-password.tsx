import { createFileRoute } from "@tanstack/react-router";
import { PremiumForgotPassword } from "@/components/auth/PremiumAuthExperience";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Afrinexa" },
      {
        name: "description",
        content: "Request a secure password reset link for your AFRINEXA account.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PremiumForgotPassword,
});
