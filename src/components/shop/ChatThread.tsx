import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCheck,
  FilePlus2,
  LoaderCircle,
  Mic,
  Reply,
  Smile,
  Send,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CartSummaryCard } from "./CartSummaryCard";
import { ChatAttachment } from "./ChatAttachment";
import { fmtDateTime } from "@/lib/site";
import {
  buildChatAttachmentPath,
  CHAT_ATTACHMENT_ACCEPT,
  CHAT_ATTACHMENT_BUCKET,
  getChatAttachmentExtension,
  MAX_CHAT_ATTACHMENT_BYTES,
  normalizeChatMimeType,
  parseChatAttachment,
  sanitizeChatFileName,
} from "@/lib/chat-attachments";

type Msg = {
  id: string;
  sender_id: string | null;
  kind: string;
  body: string | null;
  payload: { cart_id?: string; attachment?: unknown } | null;
  reply_to: string | null;
  read_at: string | null;
  created_at: string;
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

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
  const draftKey = `afrinexa-chat-draft:${me}:${conversationId}`;
  const [text, setText] = useState(() => {
    try {
      return typeof window === "undefined" ? "" : (localStorage.getItem(draftKey) ?? "");
    } catch {
      return "";
    }
  });
  const [showEmojis, setShowEmojis] = useState(false);
  const [reply, setReply] = useState<Msg | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [microphonePending, setMicrophonePending] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recordingStream = useRef<MediaStream | null>(null);
  const recordingChunks = useRef<Blob[]>([]);
  const recordingStartedAt = useRef(0);
  const recordingTooLarge = useRef(false);
  const cancelRecordingUpload = useRef(false);
  const microphonePendingRef = useRef(false);
  const voiceRequestGeneration = useRef(0);

  useEffect(() => {
    try {
      if (text) localStorage.setItem(draftKey, text);
      else localStorage.removeItem(draftKey);
    } catch {
      // Draft persistence is best-effort when browser storage is unavailable.
    }
  }, [draftKey, text]);

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

  useEffect(() => {
    if (!recording) {
      setRecordingElapsed(0);
      return;
    }
    const timer = window.setInterval(() => {
      setRecordingElapsed(Math.floor((Date.now() - recordingStartedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      voiceRequestGeneration.current += 1;
      microphonePendingRef.current = false;
      cancelRecordingUpload.current = true;
      const activeRecorder = recorder.current;
      if (activeRecorder && activeRecorder.state !== "inactive") {
        activeRecorder.ondataavailable = null;
        activeRecorder.onerror = null;
        activeRecorder.onstop = null;
        activeRecorder.stop();
      }
      recorder.current = null;
      recordingStream.current?.getTracks().forEach((track) => track.stop());
      recordingStream.current = null;
      recordingChunks.current = [];
      setRecording(false);
      setMicrophonePending(false);
    };
  }, [conversationId, me]);

  async function uploadAttachment(file: File, isVoice: boolean) {
    const mimeType = normalizeChatMimeType(file.type);
    if (!mimeType) {
      toast.error("Ce type de fichier n’est pas autorisé.");
      return;
    }
    if (!file.size || file.size > MAX_CHAT_ATTACHMENT_BYTES) {
      toast.error("Le fichier doit peser au maximum 20 Mo.");
      return;
    }

    setUploading(true);
    let uploadedPath: string | null = null;
    try {
      const objectPath = buildChatAttachmentPath(conversationId, me, crypto.randomUUID(), mimeType);
      const { error: uploadError } = await supabase.storage
        .from(CHAT_ATTACHMENT_BUCKET)
        .upload(objectPath, file, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = objectPath;

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: me,
        kind: "text",
        body: null,
        payload: {
          attachment: {
            storage_path: objectPath,
            file_name: sanitizeChatFileName(file.name),
            mime_type: mimeType,
            size: file.size,
            is_voice: isVoice,
          },
        },
        reply_to: reply?.id ?? null,
      });
      if (messageError) throw messageError;

      setReply(null);
      await qc.invalidateQueries({ queryKey: ["msgs", conversationId] });
      toast.success(isVoice ? "Note vocale envoyée." : "Pièce jointe envoyée.");
    } catch {
      toast.error(
        uploadedPath
          ? "Le fichier a été stocké de façon privée, mais le message n’a pas été créé. Réessayez plus tard."
          : "L’envoi a échoué. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function startVoiceRecording() {
    if (microphonePendingRef.current || recording || uploading) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("L’enregistrement vocal n’est pas pris en charge par ce navigateur.");
      return;
    }

    const requestId = voiceRequestGeneration.current + 1;
    voiceRequestGeneration.current = requestId;
    microphonePendingRef.current = true;
    cancelRecordingUpload.current = false;
    setMicrophonePending(true);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (requestId !== voiceRequestGeneration.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      recordingStream.current = stream;
      recordingChunks.current = [];
      recordingTooLarge.current = false;

      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const activeRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorder.current = activeRecorder;

      activeRecorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunks.current.push(event.data);
        const totalSize = recordingChunks.current.reduce((total, chunk) => total + chunk.size, 0);
        if (totalSize > MAX_CHAT_ATTACHMENT_BYTES && activeRecorder.state === "recording") {
          recordingTooLarge.current = true;
          activeRecorder.stop();
        }
      };
      activeRecorder.onerror = () => {
        cancelRecordingUpload.current = true;
        recordingStream.current?.getTracks().forEach((track) => track.stop());
        recordingStream.current = null;
        setRecording(false);
        toast.error("L’enregistrement vocal a été interrompu.");
      };
      activeRecorder.onstop = () => {
        recordingStream.current?.getTracks().forEach((track) => track.stop());
        recordingStream.current = null;
        recorder.current = null;
        setRecording(false);
        if (cancelRecordingUpload.current || requestId !== voiceRequestGeneration.current) return;

        const rawMimeType = activeRecorder.mimeType || recordingChunks.current[0]?.type || "";
        const voiceMimeType = normalizeChatMimeType(rawMimeType);
        if (!voiceMimeType || !voiceMimeType.startsWith("audio/")) {
          toast.error("Le format audio produit par ce navigateur n’est pas pris en charge.");
          return;
        }
        const blob = new Blob(recordingChunks.current, { type: voiceMimeType });
        if (recordingTooLarge.current || blob.size > MAX_CHAT_ATTACHMENT_BYTES) {
          toast.error("La note vocale dépasse la limite de 20 Mo et n’a pas été envoyée.");
          return;
        }
        if (!blob.size) {
          toast.error("Aucun son n’a été enregistré.");
          return;
        }
        const extension = getChatAttachmentExtension(voiceMimeType);
        if (!extension) {
          toast.error("Le format de la note vocale n’est pas pris en charge.");
          return;
        }
        const voiceFile = new File([blob], `note-vocale-${Date.now()}.${extension}`, {
          type: voiceMimeType,
        });
        void uploadAttachment(voiceFile, true);
      };

      activeRecorder.start(1000);
      recordingStartedAt.current = Date.now();
      setRecording(true);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      if (requestId === voiceRequestGeneration.current) {
        recordingStream.current = null;
        recorder.current = null;
        setRecording(false);
        toast.error("Accès au microphone refusé ou indisponible.");
      }
    } finally {
      if (requestId === voiceRequestGeneration.current) {
        microphonePendingRef.current = false;
        setMicrophonePending(false);
      }
    }
  }

  function stopVoiceRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || uploading || recording) return;
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
    <div className="flex h-full min-w-0 flex-col">
      <div className="min-w-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto p-4">
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
          const attachment = parseChatAttachment(m.payload);
          const hasAttachmentPayload = !!m.payload?.attachment;
          const belongsToMessage =
            !!attachment &&
            !!m.sender_id &&
            attachment.storage_path.startsWith(`${conversationId}/${m.sender_id}/`);
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
                <div className={`flex min-w-0 max-w-full ${mine ? "justify-end" : ""}`}>
                  <CartSummaryCard cartId={m.payload.cart_id} clientName={clientName} />
                </div>
              ) : (
                <div className={`group flex min-w-0 max-w-full ${mine ? "justify-end" : ""}`}>
                  <div
                    className={`min-w-0 max-w-[80%] break-words rounded-3xl px-4 py-2.5 text-sm ${mine ? "bg-brand text-primary-foreground" : "bg-secondary"}`}
                  >
                    {m.reply_to && byId.get(m.reply_to) && (
                      <p className="mb-1 line-clamp-2 border-l-2 border-current/50 pl-2 text-xs opacity-70">
                        {byId.get(m.reply_to)!.body ?? "Pièce jointe"}
                      </p>
                    )}
                    {belongsToMessage ? (
                      <ChatAttachment
                        attachment={attachment}
                        conversationId={conversationId}
                        senderId={m.sender_id}
                        viewerId={me}
                      />
                    ) : hasAttachmentPayload ? (
                      <p className="text-xs text-muted-foreground">Pièce jointe indisponible.</p>
                    ) : (
                      <p className="whitespace-pre-line break-words">{m.body}</p>
                    )}
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
                    className="self-center px-2 text-muted-foreground opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent group-hover:opacity-100 focus-visible:opacity-100"
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
        <div className="flex min-w-0 items-center justify-between gap-2 border-t bg-secondary/50 px-4 py-2 text-xs">
          <span className="min-w-0 line-clamp-1 break-words">
            Réponse à : {reply.body ?? "Pièce jointe"}
          </span>
          <button onClick={() => setReply(null)} aria-label="Annuler">
            <X className="size-4" />
          </button>
        </div>
      )}
      <form onSubmit={send} className="flex min-w-0 items-end gap-2 border-t p-3">
        <input
          ref={fileInput}
          type="file"
          accept={CHAT_ATTACHMENT_ACCEPT}
          className="sr-only"
          aria-label="Choisir une pièce jointe"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void uploadAttachment(file, false);
            event.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant="glass"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Joindre un fichier"
          title="Joindre un fichier"
          disabled={uploading || recording}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? <LoaderCircle className="animate-spin" /> : <FilePlus2 />}
        </Button>
        <div className="relative shrink-0">
          <Button
            type="button"
            variant="glass"
            size="icon"
            className="size-11"
            aria-label="Choisir un émoji"
            aria-expanded={showEmojis}
            onClick={() => setShowEmojis((visible) => !visible)}
          >
            <Smile />
          </Button>
          {showEmojis && (
            <div
              className="absolute bottom-12 left-0 z-20 flex gap-1 rounded-2xl border border-border bg-card p-2 shadow-xl"
              aria-label="Émojis"
            >
              {["🙂", "😊", "👍", "🙏", "✅", "📦", "🚚", "❤️"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="grid size-9 place-items-center rounded-xl text-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label={`Ajouter ${emoji}`}
                  onClick={() => {
                    setText((current) => `${current}${emoji}`);
                    setShowEmojis(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <textarea
          aria-label="Votre message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e);
            }
          }}
          rows={1}
          placeholder="Votre message…"
          disabled={uploading || recording}
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-3xl bg-secondary px-4 py-3 text-sm outline-none"
        />
        {recording && (
          <span
            className="shrink-0 text-xs font-medium tabular-nums text-destructive"
            aria-live="polite"
          >
            {formatDuration(recordingElapsed)}
          </span>
        )}
        <Button
          type="button"
          variant={recording ? "destructive" : "glass"}
          size="icon"
          className="size-11 shrink-0"
          aria-label={
            recording
              ? "Arrêter et envoyer la note vocale"
              : microphonePending
                ? "Autorisation du microphone en attente"
                : "Enregistrer une note vocale"
          }
          title={recording ? "Arrêter l’enregistrement" : "Enregistrer une note vocale"}
          disabled={uploading || microphonePending}
          onClick={recording ? stopVoiceRecording : () => void startVoiceRecording()}
        >
          {recording ? (
            <Square />
          ) : microphonePending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Mic />
          )}
        </Button>
        <Button
          type="submit"
          variant="hero"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Envoyer"
          disabled={uploading || recording || !text.trim()}
        >
          <Send />
        </Button>
      </form>
    </div>
  );
}
