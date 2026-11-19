import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChatThread } from "@/components/shop/ChatThread";
import { fmtDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messagerie — Afrinexa" },
      { name: "description", content: "Discutez avec nos commerciaux." },
      { property: "og:title", content: "Messagerie — Afrinexa" },
      { property: "og:description", content: "Messagerie client" },
    ],
  }),
  component: Messages,
});

const DEPT: Record<string, string> = {
  commercial: "Commercial",
  sourcing: "Sourcing",
  logistique: "Logistique",
  douane: "Douane",
  finance: "Finance",
  support: "Support",
};

function Messages() {
  const { user } = Route.useRouteContext();
  const convs = useQuery({
    queryKey: ["my-convs", user.id],
    queryFn: async () =>
      (
        await supabase
          .from("conversations")
          .select("*")
          .eq("client_id", user.id)
          .order("last_message_at", { ascending: false })
      ).data ?? [],
  });
  const conversationIds = convs.data?.map((x) => x.id) ?? [];
  const unread = useQuery({
    queryKey: ["my-unread-messages", user.id, conversationIds],
    enabled: conversationIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_id", user.id)
        .is("read_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });
  const [sel, setSel] = useState<string | null>(null);
  const current = sel ?? convs.data?.[0]?.id ?? null;
  const c = convs.data?.find((x) => x.id === current);
  const unreadByConversation = new Map<string, number>();
  for (const message of unread.data ?? []) {
    unreadByConversation.set(
      message.conversation_id,
      (unreadByConversation.get(message.conversation_id) ?? 0) + 1,
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-6 pt-24">
      <h1 className="sr-only">Messagerie client</h1>
      {!!convs.data?.length && (
        <div className="mb-3 md:hidden">
          <label htmlFor="mobile-conversation" className="mb-1 block text-sm font-medium">
            Conversation
          </label>
          <select
            id="mobile-conversation"
            value={current ?? ""}
            onChange={(event) => setSel(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            {convs.data?.map((x) => {
              const count = unreadByConversation.get(x.id) ?? 0;
              return (
                <option key={x.id} value={x.id}>
                  {x.subject ?? "Conversation"} · {DEPT[x.department] ?? x.department}
                  {count > 0 ? ` · ${count} non lu${count > 1 ? "s" : ""}` : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}
      {convs.data?.length === 0 ? (
        <div className="glass mt-6 rounded-3xl p-10 text-center">
          <MessageSquare className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Aucune conversation</p>
          <p className="text-sm text-muted-foreground">
            Ajoutez un article au panier pour transmettre votre sélection et démarrer un échange
            avec l’équipe.
          </p>
          <Button asChild variant="hero" className="mt-4">
            <Link to="/boutique">Voir la boutique</Link>
          </Button>
        </div>
      ) : (
        <div className="glass mt-2 grid h-[calc(100vh-8rem)] overflow-hidden rounded-3xl md:grid-cols-[260px_1fr]">
          <aside className="hidden overflow-y-auto border-r md:block">
            {convs.data?.map((x) => (
              <button
                key={x.id}
                onClick={() => setSel(x.id)}
                className={`block w-full border-b p-4 text-left text-sm ${x.id === current ? "bg-secondary" : ""}`}
              >
                <p className="font-semibold">{x.subject ?? "Conversation"}</p>
                <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {DEPT[x.department] ?? x.department} · {fmtDate(x.last_message_at)}
                  </span>
                  {(unreadByConversation.get(x.id) ?? 0) > 0 && (
                    <span
                      className="rounded-full bg-brand px-2 py-0.5 text-primary-foreground"
                      aria-label={`${unreadByConversation.get(x.id)} messages non lus`}
                    >
                      {unreadByConversation.get(x.id)}
                    </span>
                  )}
                </p>
              </button>
            ))}
          </aside>
          <section className="flex min-h-0 flex-col">
            {c && (
              <>
                <header className="flex items-center gap-3 border-b p-4">
                  <span className="grid size-10 place-items-center rounded-full bg-brand font-bold text-primary-foreground">
                    A
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">Équipe {DEPT[c.department]}</p>
                    <p className="text-xs text-muted-foreground">{c.subject}</p>
                  </div>
                  {c.cart_id && (
                    <Button asChild size="sm" variant="glass">
                      <Link to="/panier">Panier</Link>
                    </Button>
                  )}
                </header>
                <div className="min-h-0 flex-1">
                  <ChatThread conversationId={c.id} me={user.id} />
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
