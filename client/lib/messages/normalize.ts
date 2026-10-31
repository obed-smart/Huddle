import {
  MESSAGE_TYPES,
  type Attachment,
  type Message,
  type MessageSender,
  type MessageType,
  type NormalizeContext,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = Record<string, any>;

/** Server vocabularies vary; anything unlisted is looked at, not guessed. */
const TYPE_ALIASES: Record<string, MessageType> = {
  text: MESSAGE_TYPES.TEXT,
  message: MESSAGE_TYPES.TEXT,
  image: MESSAGE_TYPES.IMAGE,
  photo: MESSAGE_TYPES.IMAGE,
  video: MESSAGE_TYPES.VIDEO,
  file: MESSAGE_TYPES.FILE,
  document: MESSAGE_TYPES.FILE,
  audio: MESSAGE_TYPES.AUDIO,
  voice: MESSAGE_TYPES.AUDIO,
  voice_note: MESSAGE_TYPES.AUDIO,
  system: MESSAGE_TYPES.SYSTEM,
  system_event: MESSAGE_TYPES.SYSTEM,
  call: MESSAGE_TYPES.CALL,
};

/** The first value that is actually there ("" and 0 are not answers). */
function firstOf<T>(...values: T[]): T | null {
  return values.find((v) => v !== undefined && v !== null && v !== "") ?? null;
}

function attachmentType(raw: Raw): MessageType {
  const mime = String(raw?.mimeType || raw?.mime || raw?.type || raw?.contentType || "");
  if (mime.startsWith("image/")) return MESSAGE_TYPES.IMAGE;
  if (mime.startsWith("video/")) return MESSAGE_TYPES.VIDEO;
  if (mime.startsWith("audio/")) return MESSAGE_TYPES.AUDIO;
  const named = TYPE_ALIASES[String(raw?.kind || raw?.type || "").toLowerCase()];
  return named && named !== MESSAGE_TYPES.TEXT ? named : MESSAGE_TYPES.FILE;
}

function normalizeAttachment(raw: Raw): Attachment | null {
  if (!raw) return null;
  const url = firstOf(raw.url, raw.localUrl, raw.previewUrl, raw.src);
  return {
    id: firstOf(raw.id, raw.key, url) || crypto.randomUUID(),
    type: attachmentType(raw),
    name: firstOf(raw.name, raw.filename, raw.fileName, raw.title) || "attachment",
    size: Number(firstOf(raw.size, raw.bytes, raw.fileSize) || 0),
    mimeType: firstOf(raw.mimeType, raw.mime, raw.contentType, raw.type) || "",
    url,
    remoteUrl: firstOf(raw.remoteUrl, raw.downloadUrl, raw.key) || null,
    durationSeconds: Number(firstOf(raw.durationSeconds, raw.duration) || 0),
    localOnly: Boolean(raw.localOnly),
  };
}

/** Attachments, always as an array, whatever shape the payload used. */
function normalizeAttachments(raw: Raw): Attachment[] {
  const candidates: Raw[] = [];
  if (Array.isArray(raw.attachments)) candidates.push(...raw.attachments);
  else if (raw.attachments) candidates.push(raw.attachments);
  if (raw.attachment) candidates.push(raw.attachment);
  if (Array.isArray(raw.media)) candidates.push(...raw.media);
  else if (raw.media) candidates.push(raw.media);
  return candidates.map(normalizeAttachment).filter((a): a is Attachment => Boolean(a));
}

function normalizeSender(raw: Raw): MessageSender {
  const nested = raw.sender || raw.user || raw.author || {};
  return {
    id: firstOf(raw.senderId, nested.id, raw.userId, raw.authorId),
    username: firstOf(raw.senderUsername, nested.username, raw.username),
    displayName: firstOf(
      raw.senderDisplayName,
      nested.displayName,
      nested.display_name,
      nested.fullName,
      nested.name,
      raw.senderName,
    ),
    avatar: firstOf(raw.senderAvatar, nested.avatar, nested.avatarUrl, nested.image),
  };
}

/** The conversation a payload belongs to, read from any of its field names. */
export function conversationIdOf(raw: Raw | null | undefined): string | null {
  if (!raw) return null;
  return firstOf(
    raw.conversationId,
    raw.conversation_id,
    raw.conversation?.id,
    raw.chatId,
    raw.roomId,
    raw.room,
  );
}

/** SYSTEM/CALL are stated; media is believed only when media backs it. */
function resolveType(raw: Raw, attachments: Attachment[]): MessageType {
  const declared = TYPE_ALIASES[String(raw.type || raw.messageType || "").toLowerCase()];
  if (declared === MESSAGE_TYPES.SYSTEM || raw.system) return MESSAGE_TYPES.SYSTEM;
  if (declared === MESSAGE_TYPES.CALL || raw.call) return MESSAGE_TYPES.CALL;
  if (attachments.length > 0) return attachments[0].type;
  return MESSAGE_TYPES.TEXT;
}

function describeSystemEvent(raw: Raw): string {
  const kind = String(raw.eventType || raw.type || "").toLowerCase();
  const map: Record<string, string> = {
    conversation_updated: "Conversation settings were updated",
    member_added: "Someone was added to the conversation",
    member_removed: "Someone left the conversation",
    call_started: "A call was started",
    call_ended: "The call ended",
  };
  return map[kind] || String(raw.body || raw.content || kind || "Conversation updated").replace(/_/g, " ");
}

/** Any message-shaped thing becomes the one internal shape. */
export function normalizeMessage(input: unknown, context: NormalizeContext = {}): Message | null {
  const raw = input as Raw | null | undefined;
  if (!raw) return null;

  // The timeline wraps every row as { type, data: {...} }.
  const outerType = raw.type;
  const body: Raw = raw.data && typeof raw.data === "object" ? raw.data : raw;

  const attachments = normalizeAttachments(body);
  const isSystem =
    TYPE_ALIASES[String(outerType || "").toLowerCase()] === MESSAGE_TYPES.SYSTEM ||
    Boolean(body.system);
  const type = isSystem ? MESSAGE_TYPES.SYSTEM : resolveType(body, attachments);
  const deleted = Boolean(body.deletedAt || body.deleted);

  return {
    id: firstOf(body.id, body._id, body.messageId),
    tempId: firstOf(body.tempId, raw.tempId),
    conversationId: conversationIdOf(body) || context.conversationId || null,
    type,
    content: deleted ? "" : String(firstOf(body.content, body.body, body.text) || ""),
    attachments,
    sender: normalizeSender(body),
    createdAt: firstOf(body.createdAt, body.created_at, body.sentAt, body.timestamp),
    updatedAt: firstOf(body.updatedAt, body.editedAt, body.updated_at),
    system: isSystem ? describeSystemEvent(body) : null,
    call: body.call || (type === MESSAGE_TYPES.CALL ? body : null),
    metadata: body.metadata || body.meta || null,
    deleted,
    edited: Boolean(body.editedAt || body.edited),
    pending: Boolean(context.pending),
    failed: false,
    failureMessage: null,
    localOnly: Boolean(context.localOnly),
    mine: context.mine ?? null,
    source: context.source || "server",
  };
}
