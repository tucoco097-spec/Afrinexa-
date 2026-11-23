import { createFileRoute } from "@tanstack/react-router";
import { PremiumResetPassword } from "@/components/auth/PremiumAuthExperience";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Create a new password — Afrinexa" },
      { name: "description", content: "Choose a new secure password for your AFRINEXA account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PremiumResetPassword,
});
