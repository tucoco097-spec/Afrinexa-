import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatThread } from "@/components/shop/ChatThread";
import { fmtDateTime } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/conversations")({
  component: AdminConvs,
});
const DEPTS = ["commercial", "sourcing", "logistique", "douane", "finance", "support"];

function AdminConvs() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const convs = useQuery({
    queryKey: ["admin-convs"],
    queryFn: async () =>
      (
        await supabase
          .from("conversations")
          .select("*, profiles(full_name, email, phone)")
          .order("last_message_at", { ascending: false })
      ).data ?? [],
  });
  const [sel, setSel] = useState<string | null>(null);
  const c = convs.data?.find((x) => x.id === (sel ?? convs.data?.[0]?.id));

  async function setDept(d: string) {
    if (!c) return;
    await supabase.from("conversations").update({ department: d }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["admin-convs"] });
  }

  if (convs.data?.length === 0)
    return <p className="text-sm text-muted-foreground">Aucune conversation pour le moment.</p>;
  return (
    <div className="glass grid h-[calc(100vh-12rem)] overflow-hidden rounded-3xl md:grid-cols-[280px_1fr]">
      <aside className="overflow-y-auto border-r max-md:max-h-40">
        {convs.data?.map((x) => (
          <button
            key={x.id}
            onClick={() => setSel(x.id)}
            className={`block w-full border-b p-4 text-left text-sm ${x.id === c?.id ? "bg-secondary" : ""}`}
          >
            <p className="font-semibold">{x.profiles?.full_name || x.profiles?.email}</p>
            <p className="text-xs text-muted-foreground">
              {x.subject} · {x.department} · {fmtDateTime(x.last_message_at)}
            </p>
          </button>
        ))}
      </aside>
      {c && (
        <section className="flex min-h-0 flex-col">
          <header className="flex flex-wrap items-center gap-3 border-b p-4">
            <div className="flex-1">
              <p className="font-semibold">{c.profiles?.full_name || c.profiles?.email}</p>
              <p className="text-xs text-muted-foreground">
                {c.profiles?.email}
                {c.profiles?.phone ? ` · ${c.profiles.phone}` : ""}
              </p>
            </div>
            <select
              value={c.department}
              onChange={(e) => setDept(e.target.value)}
              className="h-9 rounded-full border border-input bg-transparent px-3 text-sm"
            >
              {DEPTS.map((d) => (
                <option key={d} value={d} className="bg-card">
                  {d}
                </option>
              ))}
            </select>
          </header>
          <div className="min-h-0 flex-1">
            <ChatThread
              conversationId={c.id}
              me={user.id}
              clientName={c.profiles?.full_name ?? c.profiles?.email}
            />
          </div>
        </section>
      )}
    </div>
  );
}
