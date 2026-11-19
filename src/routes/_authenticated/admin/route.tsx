import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, Settings, Package, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isStaff } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id);
    const roles = (data ?? []).map((r) => r.role as string);
    if (!isStaff(roles)) throw redirect({ to: "/espace" });
    return { roles };
  },
  head: () => ({
    meta: [
      { title: "Administration — Afrinexa" },
      { name: "description", content: "Back-office" },
      { property: "og:title", content: "Administration — Afrinexa" },
      { property: "og:description", content: "Back-office" },
    ],
  }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/commandes", label: "Commandes", icon: ClipboardList, exact: false },
  { to: "/admin/produits", label: "Produits", icon: Package, exact: false },
  { to: "/admin/conversations", label: "Messagerie", icon: MessageSquare, exact: false },
  { to: "/admin/parametres", label: "Paramètres", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-28">
      <nav className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact }}
            className="glass flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground"
            activeProps={{ className: "bg-brand text-primary-foreground" }}
          >
            <t.icon className="size-4" />
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
