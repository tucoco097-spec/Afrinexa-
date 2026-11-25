import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Inbox,
  MessageCircle,
  Search,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatThread } from "@/components/shop/ChatThread";
import { fmtDateTime } from "@/lib/site";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/conversations")({
  validateSearch: (search: Record<string, unknown>): { client?: string } =>
    typeof search["client"] === "string" ? { client: search["client"] } : {},
  component: AdminConvs,
});

const DEPTS = ["commercial", "sourcing", "logistique", "douane", "finance", "support"];
type Filter = "all" | "unread" | "active" | "archived";
type Conversation = {
  id: string;
  client_id: string;
  cart_id: string | null;
  subject: string | null;
  department: string;
  assigned_to: string | null;
  archived_at: string | null;
  archived_by: string | null;
  last_message_at: string;
  profiles?: { full_name: string | null; email: string | null; phone: string | null } | null;
};
type LastMessage = {
  conversation_id: string;
  body: string | null;
  kind: string;
  sender_id: string | null;
  created_at: string;
  read_at: string | null;
};
type Order = {
  client_id: string;
  id: string;
  order_number: string;
  description: string | null;
  total_amount: number | null;
  currency: string;
  status: string;
  created_at: string;
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "A"
  );
}

function AdminConvs() {
  const { user } = Route.useRouteContext();
  const { client: requestedClient } = Route.useSearch();
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [mobileThread, setMobileThread] = useState(false);

  const convs = useQuery({
    queryKey: ["admin-convs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, profiles(full_name, email, phone)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });
  const clientIds = [...new Set((convs.data ?? []).map((conversation) => conversation.client_id))];
  const orderIndex = useQuery({
    queryKey: ["admin-inbox-order-index", clientIds],
    enabled: clientIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("client_id, order_number, created_at")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const orderNumbersByClient = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const order of orderIndex.data ?? []) {
      const numbers = map.get(order.client_id) ?? [];
      numbers.push(order.order_number);
      map.set(order.client_id, numbers);
    }
    return map;
  }, [orderIndex.data]);
  const ids = convs.data?.map((conversation) => conversation.id) ?? [];
  const inboxDetails = useQuery({
    queryKey: ["admin-inbox-details", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id, body, kind, sender_id, created_at, read_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const lastMessage = new Map<string, LastMessage>();
      const unread = new Map<string, number>();
      for (const message of (data ?? []) as LastMessage[]) {
        if (!lastMessage.has(message.conversation_id)) {
          lastMessage.set(message.conversation_id, message);
        }
        if (message.sender_id !== user.id && !message.read_at) {
          unread.set(message.conversation_id, (unread.get(message.conversation_id) ?? 0) + 1);
        }
      }
      return { lastMessage, unread };
    },
  });
  const selectedId =
    sel && convs.data?.some((item) => item.id === sel)
      ? sel
      : (convs.data?.find((item) => item.client_id === requestedClient && !item.archived_at)?.id ??
        convs.data?.find((item) => item.client_id === requestedClient)?.id ??
        convs.data?.[0]?.id);
  const selected = convs.data?.find((item) => item.id === selectedId);
  const orders = useQuery({
    queryKey: ["admin-client-orders", selected?.client_id],
    enabled: !!selected?.client_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "client_id, id, order_number, description, total_amount, currency, status, created_at",
        )
        .eq("client_id", selected!.client_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  useEffect(() => {
    if (requestedClient && convs.data?.some((item) => item.client_id === requestedClient)) {
      setMobileThread(true);
    }
  }, [convs.data, requestedClient]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-conversation-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        void qc.invalidateQueries({ queryKey: ["admin-convs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void qc.invalidateQueries({ queryKey: ["admin-convs"] });
        void qc.invalidateQueries({ queryKey: ["admin-inbox-details"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("fr-FR");
    return (convs.data ?? []).filter((conversation) => {
      const isArchived = Boolean(conversation.archived_at);
      const unreadCount = inboxDetails.data?.unread.get(conversation.id) ?? 0;
      if (filter === "archived" && !isArchived) return false;
      if (filter !== "archived" && isArchived) return false;
      if (filter === "unread" && unreadCount === 0) return false;
      if (
        filter === "active" &&
        Date.now() - new Date(conversation.last_message_at).getTime() > 30 * 24 * 60 * 60 * 1000
      )
        return false;
      const profile = conversation.profiles;
      const haystack = [
        profile?.full_name,
        profile?.email,
        profile?.phone,
        conversation.subject,
        ...(orderNumbersByClient.get(conversation.client_id) ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fr-FR");
      return !text || haystack.includes(text);
    });
  }, [convs.data, filter, inboxDetails.data, orderNumbersByClient, query]);

  async function toggleArchive(conversation: Conversation) {
    const isArchived = Boolean(conversation.archived_at);
    const { error } = await supabase
      .from("conversations")
      .update({
        archived_at: isArchived ? null : new Date().toISOString(),
        archived_by: isArchived ? null : user.id,
      })
      .eq("id", conversation.id);
    if (error) {
      toast.error("Archivage impossible. Vérifiez que la migration 0006 est appliquée.");
      return;
    }
    toast.success(isArchived ? "Conversation réouverte" : "Conversation archivée");
    await qc.invalidateQueries({ queryKey: ["admin-convs"] });
    if (conversation.id === selectedId && !isArchived) setMobileThread(false);
  }

  async function setDept(department: string) {
    if (!selected) return;
    const { error } = await supabase
      .from("conversations")
      .update({ department })
      .eq("id", selected.id);
    if (!error) await qc.invalidateQueries({ queryKey: ["admin-convs"] });
  }

  if (convs.isLoading) {
    return (
      <p className="p-6 text-sm text-muted-foreground">Chargement de la boîte de réception…</p>
    );
  }
  if (convs.isError) {
    return (
      <p role="alert" className="p-6 text-sm text-destructive">
        Impossible de charger les conversations. Vérifiez votre connexion puis réessayez.
      </p>
    );
  }

  const showInbox = !mobileThread;
  return (
    <div className="glass grid h-[min(78dvh,900px)] min-h-[520px] min-w-0 grid-cols-1 overflow-hidden rounded-3xl border border-border/70 shadow-card md:grid-cols-[minmax(250px,340px)_minmax(0,1fr)]">
      <aside
        className={`${showInbox ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-col border-r border-border/70`}
      >
        <div className="border-b border-border/70 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                Support client
              </p>
              <h2 className="mt-1 text-xl font-bold">Messages</h2>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              {convs.data?.length ?? 0}
            </span>
          </div>
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-background/75 px-3 focus-within:ring-2 focus-within:ring-accent">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un client ou n° de commande…"
              aria-label="Rechercher un client ou un numéro de commande"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
            aria-label="Filtres de conversation"
          >
            {(
              [
                ["all", "Toutes"],
                ["unread", "Non lues"],
                ["active", "Récentes"],
                ["archived", "Archivées"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition ${filter === id ? "bg-brand text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {label}
                {id === "unread" && (
                  <span className="ml-1">
                    {[...(inboxDetails.data?.unread.values() ?? [])].reduce(
                      (sum, value) => sum + value,
                      0,
                    ) || ""}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Inbox className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Aucune discussion ici</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Essayez un autre filtre ou une recherche.
              </p>
            </div>
          ) : (
            visible.map((conversation) => {
              const profile = conversation.profiles;
              const name = profile?.full_name || profile?.email || "Client";
              const latest = inboxDetails.data?.lastMessage.get(conversation.id);
              const unread = inboxDetails.data?.unread.get(conversation.id) ?? 0;
              const clientOrders = orderNumbersByClient.get(conversation.client_id) ?? [];
              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSel(conversation.id);
                    setMobileThread(true);
                  }}
                  className={`flex min-h-[82px] w-full min-w-0 items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-secondary/60 ${conversation.id === selectedId ? "bg-secondary/75" : ""}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/15 text-sm font-bold text-gold">
                    {initials(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {latest
                          ? fmtDateTime(latest.created_at)
                          : fmtDateTime(conversation.last_message_at)}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {latest?.kind === "cart"
                          ? "Récapitulatif de sélection"
                          : latest?.body || conversation.subject || "Nouvelle discussion"}
                      </span>
                      {unread > 0 && (
                        <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                          {unread}
                        </span>
                      )}
                    </span>
                    {clientOrders.length > 0 && (
                      <span className="mt-1 block truncate text-[10px] font-medium text-gold">
                        Commandes du client : {clientOrders.slice(0, 2).join(" · ")}
                        {clientOrders.length > 2 ? " · …" : ""}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
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
                aria-label="Retour aux conversations"
                onClick={() => setMobileThread(false)}
              >
                <ArrowLeft />
              </Button>
              <span className="hidden size-10 shrink-0 place-items-center rounded-full bg-brand/15 text-sm font-bold text-gold sm:grid">
                {initials(selected.profiles?.full_name || selected.profiles?.email || "Client")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {selected.profiles?.full_name || selected.profiles?.email || "Client"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {selected.profiles?.email}
                  {selected.profiles?.phone ? ` · ${selected.profiles.phone}` : ""}
                </p>
              </div>
              <select
                aria-label="Service assigné"
                value={selected.department}
                onChange={(event) => void setDept(event.target.value)}
                className="h-10 max-w-[130px] rounded-xl border border-input bg-background px-2 text-xs sm:max-w-none sm:px-3 sm:text-sm"
              >
                {DEPTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="glass"
                size="icon"
                className="size-10 shrink-0"
                aria-label={
                  selected.archived_at ? "Réouvrir la conversation" : "Archiver la conversation"
                }
                title={selected.archived_at ? "Réouvrir" : "Archiver"}
                onClick={() => void toggleArchive(selected)}
              >
                {selected.archived_at ? <ArchiveRestore /> : <Archive />}
              </Button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="min-h-0 min-w-0 flex-1">
                <ChatThread
                  conversationId={selected.id}
                  me={user.id}
                  clientName={selected.profiles?.full_name ?? selected.profiles?.email}
                />
              </div>
              <aside className="hidden w-64 shrink-0 overflow-y-auto border-l border-border/70 bg-background/25 p-4 lg:block">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <ShoppingBag className="size-4 text-gold" /> Commandes du client
                </h3>
                {orders.isLoading ? (
                  <p className="mt-4 text-xs text-muted-foreground">Chargement…</p>
                ) : orders.isError ? (
                  <p className="mt-4 text-xs text-destructive">Commandes indisponibles.</p>
                ) : orders.data?.length ? (
                  <div className="mt-3 space-y-2">
                    {orders.data.map((order) => (
                      <article
                        key={order.id}
                        className="rounded-2xl border border-border/70 bg-card p-3"
                      >
                        <p className="text-xs font-bold">{order.order_number}</p>
                        <p className="mt-1 break-words text-[11px] text-muted-foreground">
                          {order.description || "Commande Afrinexa"}
                        </p>
                        <p className="mt-2 text-xs font-semibold">
                          {formatMoney(
                            Number(order.total_amount ?? 0),
                            order.currency as "XAF" | "USD" | "EUR",
                          )}
                        </p>
                        <div className="mt-1 flex justify-between gap-2 text-[10px] text-muted-foreground">
                          <span className="truncate">{order.status}</span>
                          <span>{fmtDateTime(order.created_at)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">Aucune commande enregistrée.</p>
                )}
                {selected.cart_id && (
                  <div className="mt-4 rounded-2xl bg-gold/10 p-3 text-xs text-muted-foreground">
                    Cette discussion est liée à une sélection panier. Son récapitulatif figure dans
                    l’historique des messages.
                  </div>
                )}
              </aside>
              <details className="max-h-[32dvh] shrink-0 overflow-y-auto border-t border-border/70 bg-background/45 px-4 lg:hidden">
                <summary className="cursor-pointer py-3 text-sm font-semibold">
                  Commandes du client ({orders.data?.length ?? 0})
                </summary>
                {orders.isLoading ? (
                  <p className="pb-3 text-xs text-muted-foreground">Chargement…</p>
                ) : orders.isError ? (
                  <p className="pb-3 text-xs text-destructive">Commandes indisponibles.</p>
                ) : orders.data?.length ? (
                  <div className="space-y-2 pb-3">
                    {orders.data.map((order) => (
                      <article
                        key={order.id}
                        className="rounded-xl border border-border/70 bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold">{order.order_number}</span>
                          <span className="text-xs font-semibold">
                            {formatMoney(
                              Number(order.total_amount ?? 0),
                              order.currency as "XAF" | "USD" | "EUR",
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {order.description || "Commande Afrinexa"} · {order.status}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="pb-3 text-xs text-muted-foreground">Aucune commande enregistrée.</p>
                )}
              </details>
            </div>
          </>
        ) : (
          <div className="m-auto max-w-sm px-6 text-center">
            <MessageCircle className="mx-auto size-10 text-gold" />
            <p className="mt-4 font-semibold">Choisissez une discussion</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sélectionnez un client dans la liste pour consulter son historique et lui répondre.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
