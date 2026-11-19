import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Check, CheckCheck, Reply, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CartSummaryCard } from "./CartSummaryCard";
import { fmtDateTime } from "@/lib/site";

type Msg = {
  id: string;
  sender_id: string | null;
  kind: string;
  body: string | null;
  payload: { cart_id?: string } | null;
  reply_to: string | null;
  read_at: string | null;
  created_at: string;
};

export function ChatThread({
  conversationId,
  me,
  clientName,
}: {
  conversationId: string;
  me: string;
  clientName?: string | null | undefined;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [reply, setReply] = useState<Msg | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const msgs = useQuery({
    queryKey: ["msgs", conversationId],
    queryFn: async () =>
      ((
        await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at")
      ).data ?? []) as Msg[],
  });

  useEffect(() => {
    const ch = supabase
      .channel(`msgs-${conversationId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["msgs", conversationId] });
          qc.invalidateQueries({ queryKey: ["cart-card"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, qc]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
    const unread = (msgs.data ?? [])
      .filter((m) => m.sender_id && m.sender_id !== me && !m.read_at)
      .map((m) => m.id);
    if (unread.length)
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread)
        .then(() => {});
  }, [msgs.data, me]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const r = reply;
    setReply(null);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: me,
      kind: "text",
      body,
      reply_to: r?.id ?? null,
    });
    if (error) {
      setText(body);
      setReply(r);
      toast.error("Le message n’a pas pu être envoyé. Réessayez.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["msgs", conversationId] });
  }

  const byId = new Map((msgs.data ?? []).map((m) => [m.id, m]));
  let lastDay = "";
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.isLoading && (
          <p className="text-center text-sm text-muted-foreground">Chargement des messages…</p>
        )}
        {msgs.isError && (
          <p role="alert" className="text-center text-sm text-destructive">
            Impossible de charger cette conversation. Réessayez plus tard.
          </p>
        )}
        {msgs.data?.map((m) => {
          const day = new Date(m.created_at).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = m.sender_id === me;
          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-3 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
                  {day}
                </p>
              )}
              {m.kind === "system" ? (
                <p className="text-center text-xs text-muted-foreground">{m.body}</p>
              ) : m.kind === "cart" && m.payload?.cart_id ? (
                <div className={`flex ${mine ? "justify-end" : ""}`}>
                  <CartSummaryCard cartId={m.payload.cart_id} clientName={clientName} />
                </div>
              ) : (
                <div className={`group flex ${mine ? "justify-end" : ""}`}>
                  <div
                    className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm ${mine ? "bg-brand text-primary-foreground" : "bg-secondary"}`}
                  >
                    {m.reply_to && byId.get(m.reply_to) && (
                      <p className="mb-1 border-l-2 border-current/50 pl-2 text-xs opacity-70 line-clamp-2">
                        {byId.get(m.reply_to)!.body}
                      </p>
                    )}
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                      {fmtDateTime(m.created_at)}
                      {mine &&
                        (m.read_at ? (
                          <CheckCheck className="size-3" />
                        ) : (
                          <Check className="size-3" />
                        ))}
                    </p>
                  </div>
                  <button
                    onClick={() => setReply(m)}
                    className="self-center px-2 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Répondre"
                  >
                    <Reply className="size-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {reply && (
        <div className="flex items-center justify-between border-t bg-secondary/50 px-4 py-2 text-xs">
          <span className="line-clamp-1">Réponse à : {reply.body}</span>
          <button onClick={() => setReply(null)} aria-label="Annuler">
            <X className="size-4" />
          </button>
        </div>
      )}
      <form onSubmit={send} className="flex items-end gap-2 border-t p-3">
        <textarea
          aria-label="Votre message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
          rows={1}
          placeholder="Votre message…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl bg-secondary px-4 py-3 text-sm outline-none"
        />
        <Button
          type="submit"
          variant="hero"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Envoyer"
        >
          <Send />
        </Button>
      </form>
    </div>
  );
}
