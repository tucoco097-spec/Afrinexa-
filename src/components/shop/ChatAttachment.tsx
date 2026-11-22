import { useQuery } from "@tanstack/react-query";
import { File, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  CHAT_ATTACHMENT_BUCKET,
  formatAttachmentSize,
  type ChatAttachmentMetadata,
} from "@/lib/chat-attachments";

const SIGNED_URL_TTL_SECONDS = 10 * 60;
const SIGNED_URL_REFRESH_MS = 8 * 60 * 1000;

export function ChatAttachment({
  attachment,
  conversationId,
  senderId,
  viewerId,
}: {
  attachment: ChatAttachmentMetadata;
  conversationId: string;
  senderId: string | null;
  viewerId: string;
}) {
  const belongsToConversation = attachment.storage_path.startsWith(`${conversationId}/`);
  const belongsToSender =
    !!senderId && attachment.storage_path.startsWith(`${conversationId}/${senderId}/`);
  const url = useQuery({
    queryKey: ["chat-attachment-url", viewerId, attachment.storage_path],
    enabled: belongsToConversation && belongsToSender,
    staleTime: SIGNED_URL_REFRESH_MS,
    refetchInterval: SIGNED_URL_REFRESH_MS,
    refetchIntervalInBackground: false,
    gcTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(CHAT_ATTACHMENT_BUCKET)
        .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  if (!belongsToConversation || !belongsToSender) {
    return <p className="text-xs text-muted-foreground">Pièce jointe indisponible.</p>;
  }
  if (url.isLoading) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
        Chargement de la pièce jointe…
      </p>
    );
  }
  if (!url.data) return <p className="text-xs text-muted-foreground">Pièce jointe indisponible.</p>;

  const isImage = attachment.mime_type.startsWith("image/");
  const isAudio = attachment.mime_type.startsWith("audio/");
  return (
    <div className="mt-1 min-w-0 max-w-full space-y-2">
      {isImage && (
        <a
          href={url.data}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ouvrir ${attachment.file_name}`}
        >
          <img
            src={url.data}
            alt={attachment.file_name}
            loading="lazy"
            className="max-h-56 max-w-full rounded-xl object-contain"
          />
        </a>
      )}
      {isAudio && (
        <audio
          controls
          preload="metadata"
          src={url.data}
          className="block h-10 max-w-full"
          aria-label={
            attachment.is_voice ? "Écouter la note vocale" : `Écouter ${attachment.file_name}`
          }
        />
      )}
      <a
        href={url.data}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 max-w-full items-center gap-2 rounded-xl bg-background/60 px-3 py-2 text-xs underline underline-offset-2"
      >
        <File className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          {attachment.is_voice ? "Note vocale" : attachment.file_name}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {formatAttachmentSize(attachment.size)}
        </span>
      </a>
    </div>
  );
}
