import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, MessageSquare, Package, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isStaff } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id);
    const roles = (data ?? []).map((row) => row.role as string);
    if (!isStaff(roles)) throw redirect({ to: "/espace" });
    return { roles };
  },
  head: () => ({
    meta: [
      { title: "Administration — Afrinexa" },
      { name: "description", content: "Back-office Afrinexa." },
      { property: "og:title", content: "Administration — Afrinexa" },
      { property: "og:description", content: "Back-office Afrinexa." },
      { name: "robots", content: "noindex, nofollow" },
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

function AdminNavigation({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      aria-label="Navigation administration"
      className={
        compact ? "flex gap-2 overflow-x-auto pb-2 lg:hidden" : "hidden space-y-1 lg:block"
      }
    >
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          activeOptions={{ exact: tab.exact }}
          className={
            compact
              ? "glass flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm text-muted-foreground"
              : "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground/75 transition duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }
          activeProps={{
            className: compact
              ? "bg-brand text-primary-foreground"
              : "bg-sidebar-primary text-sidebar-primary-foreground shadow-card",
          }}
        >
          <tab.icon className="size-4 shrink-0" aria-hidden="true" />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function AdminLayout() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-24 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Afrinexa · Back-office
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Administration</h1>
        </div>
        <Link
          to="/"
          className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          Voir le site
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="glass sticky top-24 hidden rounded-3xl bg-sidebar p-4 text-sidebar-foreground shadow-card lg:block">
          <div className="mb-4 flex items-center gap-3 border-b border-sidebar-border pb-4">
            <span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary font-display font-bold text-sidebar-primary-foreground">
              A
            </span>
            <div>
              <p className="font-display text-sm font-bold">Afrinexa</p>
              <p className="text-xs text-sidebar-foreground/65">Console de gestion</p>
            </div>
          </div>
          <AdminNavigation />
        </aside>

        <main className="min-w-0">
          <AdminNavigation compact />
          <div className="mt-2 lg:mt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
