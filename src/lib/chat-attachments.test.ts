import { describe, expect, it } from "vitest";
import {
  buildChatAttachmentPath,
  MAX_CHAT_ATTACHMENT_BYTES,
  normalizeChatMimeType,
  parseChatAttachment,
} from "./chat-attachments";

const conversationId = "3b241101-e2bb-4255-8caf-4136c566a962";
const userId = "550e8400-e29b-41d4-a716-446655440000";
const fileId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("chat attachments", () => {
  it("normalizes recorder MIME parameters and rejects types outside the allowlist", () => {
    expect(normalizeChatMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(normalizeChatMimeType("image/jpeg")).toBe("image/jpeg");
    expect(normalizeChatMimeType("image/svg+xml")).toBeNull();
  });

  it("builds object paths scoped to one conversation and sender", () => {
    expect(buildChatAttachmentPath(conversationId, userId, fileId, "application/pdf")).toBe(
      `${conversationId}/${userId}/${fileId}.pdf`,
    );
    expect(() => buildChatAttachmentPath("../", userId, fileId, "application/pdf")).toThrow();
  });

  it("parses only safe attachment metadata and enforces the approved size ceiling", () => {
    const payload = {
      attachment: {
        storage_path: `${conversationId}/${userId}/${fileId}.webm`,
        file_name: "note-vocale.webm",
        mime_type: "audio/webm;codecs=opus",
        size: 1024,
        is_voice: true,
      },
    };
    expect(parseChatAttachment(payload)).toMatchObject({
      storage_path: payload.attachment.storage_path,
      mime_type: "audio/webm",
      is_voice: true,
    });
    expect(
      parseChatAttachment({
        attachment: { ...payload.attachment, storage_path: `${conversationId}/../../private.pdf` },
      }),
    ).toBeNull();
    expect(
      parseChatAttachment({
        attachment: { ...payload.attachment, size: MAX_CHAT_ATTACHMENT_BYTES + 1 },
      }),
    ).toBeNull();
  });
});
