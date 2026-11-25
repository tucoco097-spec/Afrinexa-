import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChatThread } from "@/components/shop/ChatThread";
import { fmtDate, fmtDateTime } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (search: Record<string, unknown>): { conversation?: string } =>
    typeof search["conversation"] === "string" ? { conversation: search["conversation"] } : {},
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

type Conversation = {
  id: string;
  subject: string | null;
  department: string;
  cart_id: string | null;
  last_message_at: string;
};

function Messages() {
  const { user } = Route.useRouteContext();
  const { conversation: requestedConversation } = Route.useSearch();
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [mobileThread, setMobileThread] = useState(false);
  const [search, setSearch] = useState("");
  const convs = useQuery({
    queryKey: ["my-convs", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("client_id", user.id)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });
  const conversationIds = convs.data?.map((conversation) => conversation.id) ?? [];
  useEffect(() => {
    if (
      requestedConversation &&
      convs.data?.some((conversation) => conversation.id === requestedConversation)
    ) {
      setSel(requestedConversation);
      setMobileThread(true);
    }
  }, [requestedConversation, convs.data]);
  const unread = useQuery({
    queryKey: ["my-unread-messages", user.id, conversationIds],
    enabled: conversationIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id, body, sender_id, read_at, created_at, kind")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  useEffect(() => {
    const channel = supabase
      .channel(`client-inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `client_id=eq.${user.id}` },
        () => {
          void qc.invalidateQueries({ queryKey: ["my-convs", user.id] });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void qc.invalidateQueries({ queryKey: ["my-convs", user.id] });
        void qc.invalidateQueries({ queryKey: ["my-unread-messages", user.id] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, user.id]);

  const current =
    sel && convs.data?.some((conversation) => conversation.id === sel)
      ? sel
      : requestedConversation &&
          convs.data?.some((conversation) => conversation.id === requestedConversation)
        ? requestedConversation
        : (convs.data?.[0]?.id ?? null);
  const selected = convs.data?.find((conversation) => conversation.id === current);
  const latestMessage = new Map<string, NonNullable<typeof unread.data>[number]>();
  for (const message of unread.data ?? []) {
    if (!latestMessage.has(message.conversation_id)) {
      latestMessage.set(message.conversation_id, message);
    }
  }
  const unreadByConversation = new Map<string, number>();
  for (const message of unread.data ?? []) {
    if (message.sender_id && message.sender_id !== user.id && !message.read_at) {
      unreadByConversation.set(
        message.conversation_id,
        (unreadByConversation.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }
  const visible = (convs.data ?? []).filter((conversation) => {
    const haystack =
      `${conversation.subject ?? ""} ${DEPT[conversation.department] ?? conversation.department}`.toLocaleLowerCase(
        "fr-FR",
      );
    return haystack.includes(search.trim().toLocaleLowerCase("fr-FR"));
  });
  const showInbox = !mobileThread;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 pb-6 pt-20 sm:px-5 sm:pt-24">
      <h1 className="sr-only">Messagerie client</h1>
      <div className="glass grid h-[calc(100dvh-6.5rem)] min-h-[500px] min-w-0 grid-cols-1 overflow-hidden rounded-3xl border border-border/70 shadow-card sm:h-[calc(100dvh-8rem)] md:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
        <aside
          className={`${showInbox ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-col border-r border-border/70`}
        >
          <div className="border-b border-border/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              Afrinexa · assistance
            </p>
            <h2 className="mt-1 text-xl font-bold">Mes discussions</h2>
            <label className="mt-4 flex h-11 items-center gap-2 rounded-2xl border border-border bg-background/75 px-3 focus-within:ring-2 focus-within:ring-accent">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher…"
                aria-label="Rechercher une discussion"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          </div>
          {convs.isLoading ? (
            <p className="p-5 text-sm text-muted-foreground">Chargement des conversations…</p>
          ) : convs.isError ? (
            <p role="alert" className="p-5 text-sm text-destructive">
              Impossible de charger vos conversations. Réessayez plus tard.
            </p>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {visible.map((conversation) => {
                const latest = latestMessage.get(conversation.id);
                const count = unreadByConversation.get(conversation.id) ?? 0;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setSel(conversation.id);
                      setMobileThread(true);
                    }}
                    className={`flex min-h-[82px] w-full min-w-0 items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-secondary/60 ${conversation.id === current ? "bg-secondary/75" : ""}`}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/15 text-gold">
                      <MessageSquare className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">
                          {conversation.subject ?? "Conversation"}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {latest
                            ? fmtDate(latest.created_at)
                            : fmtDate(conversation.last_message_at)}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {latest?.kind === "cart"
                            ? "Récapitulatif du panier"
                            : latest?.body ||
                              `${DEPT[conversation.department] ?? conversation.department} · Écrivez-nous`}
                        </span>
                        {count > 0 && (
                          <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {count}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
              {convs.data?.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <MessageSquare className="mx-auto size-9 text-muted-foreground" />
                  <p className="mt-3 font-semibold">Aucune conversation</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ajoutez un article au panier pour transmettre votre sélection et démarrer un
                    échange avec l’équipe.
                  </p>
                  <Button asChild variant="hero" className="mt-4">
                    <Link to="/boutique">Voir la boutique</Link>
                  </Button>
                </div>
              )}
              {convs.data?.length !== 0 && visible.length === 0 && (
                <p className="p-5 text-center text-sm text-muted-foreground">
                  Aucun résultat pour cette recherche.
                </p>
              )}
            </div>
          )}
        </aside>
        <section className={`${showInbox ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-col`}>
          {selected ? (
            <>
              <header className="flex min-w-0 items-center gap-3 border-b border-border/70 bg-background/45 px-3 py-3 sm:px-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 md:hidden"
                  aria-label="Retour aux discussions"
                  onClick={() => setMobileThread(false)}
                >
                  <ArrowLeft />
                </Button>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-bold text-primary-foreground">
                  A
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    Équipe {DEPT[selected.department] ?? selected.department}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selected.subject ?? "Votre espace privé avec l’équipe Afrinexa"}
                  </p>
                </div>
                {selected.cart_id && (
                  <Button asChild size="sm" variant="glass" className="shrink-0">
                    <Link to="/panier">Panier</Link>
                  </Button>
                )}
              </header>
              <div className="min-h-0 min-w-0 flex-1">
                <ChatThread conversationId={selected.id} me={user.id} />
              </div>
            </>
          ) : (
            <div className="m-auto max-w-sm px-6 text-center">
              <MessageSquare className="mx-auto size-10 text-gold" />
              <p className="mt-4 font-semibold">Choisissez une discussion</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vos échanges avec Afrinexa apparaîtront ici.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
