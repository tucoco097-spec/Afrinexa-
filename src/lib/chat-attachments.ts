export const CHAT_ATTACHMENT_BUCKET = "conversation-attachments";
export const MAX_CHAT_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export const CHAT_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
] as const;

export const CHAT_ATTACHMENT_ACCEPT = CHAT_ATTACHMENT_MIME_TYPES.join(",");

const MIME_EXTENSIONS: Record<(typeof CHAT_ATTACHMENT_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIME_SET = new Set<string>(CHAT_ATTACHMENT_MIME_TYPES);

export type ChatAttachmentMetadata = {
  storage_path: string;
  file_name: string;
  mime_type: string;
  size: number;
  is_voice: boolean;
};

export function normalizeChatMimeType(rawType: string): ChatAttachmentMetadata["mime_type"] | null {
  const type = rawType.split(";")[0]?.trim().toLowerCase() ?? "";
  return MIME_SET.has(type) ? type : null;
}

export function getChatAttachmentExtension(mimeType: string): string | null {
  const normalized = normalizeChatMimeType(mimeType);
  return normalized ? MIME_EXTENSIONS[normalized as keyof typeof MIME_EXTENSIONS] : null;
}

export function hasChatControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

export function sanitizeChatFileName(name: string): string {
  const safeName = Array.from(name)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, 255);
  return safeName || "Pièce jointe";
}

export function buildChatAttachmentPath(
  conversationId: string,
  userId: string,
  fileId: string,
  mimeType: string,
): string {
  const extension = getChatAttachmentExtension(mimeType);
  if (
    !UUID_PATTERN.test(conversationId) ||
    !UUID_PATTERN.test(userId) ||
    !UUID_PATTERN.test(fileId)
  ) {
    throw new Error("Identifiant de conversation ou de fichier invalide.");
  }
  if (!extension) throw new Error("Type de fichier non autorisé.");
  return `${conversationId}/${userId}/${fileId}.${extension}`;
}

export function parseChatAttachment(payload: unknown): ChatAttachmentMetadata | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const raw = (payload as { attachment?: unknown }).attachment;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const value = raw as {
    storage_path?: unknown;
    file_name?: unknown;
    mime_type?: unknown;
    size?: unknown;
    is_voice?: unknown;
  };
  if (
    typeof value.storage_path !== "string" ||
    typeof value.file_name !== "string" ||
    typeof value.mime_type !== "string" ||
    typeof value.size !== "number" ||
    typeof value.is_voice !== "boolean"
  ) {
    return null;
  }

  const segments = value.storage_path.split("/");
  const mimeType = normalizeChatMimeType(value.mime_type);
  const safeFileKey =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{2,5}$/i;
  if (
    segments.length !== 3 ||
    !UUID_PATTERN.test(segments[0] ?? "") ||
    !UUID_PATTERN.test(segments[1] ?? "") ||
    !safeFileKey.test(segments[2] ?? "") ||
    !mimeType ||
    !value.file_name.trim() ||
    value.file_name.length > 255 ||
    hasChatControlCharacters(value.file_name) ||
    !Number.isInteger(value.size) ||
    value.size <= 0 ||
    value.size > MAX_CHAT_ATTACHMENT_BYTES
  ) {
    return null;
  }

  return {
    storage_path: value.storage_path,
    file_name: value.file_name,
    mime_type: mimeType,
    size: value.size,
    is_voice: value.is_voice,
  };
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
