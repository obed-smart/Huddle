/**
 * SHARED CONTRACTS — the single source of truth for every backend-derived type
 * the client uses. Nothing else in the client should hand-declare these shapes;
 * it all imports from `@/lib/contracts`.
 *
 * These are the client's current best-effort shapes. To align them with the
 * server, replace a block below with the type imported from your generated
 * Drizzle/Zod types, e.g.
 *
 *     import type { InferSelectModel } from "drizzle-orm";
 *     import type { users } from "@your/db/schema";
 *     export type AuthUser = Pick<InferSelectModel<typeof users>, ...>;
 *
 * See README.md in this folder for each type's backend source and the exact
 * fields the UI relies on. Changing a shape here updates the whole client.
 */

/* ============================================================
   USER
   Source: users table (public columns).
   ============================================================ */
export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  isEmailVerified?: boolean;
};

/** A user as returned by GET /user/search (public columns, no email). */
export type SearchedUser = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

/* ============================================================
   CONVERSATION
   Source: GET /conversation (list projection).
   ============================================================ */
export type Conversation = {
  id: string;
  type: "direct" | "group";
  name: string;
  avatar?: string | null;
  otherUserId?: string | null;
  membersCount?: number | null;
  updatedAt?: string | null;
};

/* ============================================================
   MESSAGE
   Source: the message timeline + socket payloads, normalized to one shape.
   `message_type` enum on the server.
   ============================================================ */
export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  FILE: "file",
  AUDIO: "audio",
  SYSTEM: "system",
  CALL: "call",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export type Attachment = {
  id: string;
  type: MessageType;
  name: string;
  size: number;
  mimeType: string;
  url: string | null;
  remoteUrl: string | null;
  durationSeconds: number;
  localOnly: boolean;
};

export type MessageSender = {
  id: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
};

export type Reaction = { emoji: string; count: number; mine?: boolean };

export type Message = {
  id: string | null;
  tempId: string | null;
  conversationId: string | null;
  type: MessageType;
  content: string;
  attachments: Attachment[];
  sender: MessageSender;
  createdAt: string | null;
  updatedAt: string | null;
  system: string | null;
  call: unknown;
  metadata: Record<string, unknown> | null;
  deleted: boolean;
  edited: boolean;
  pending: boolean;
  failed: boolean;
  failureMessage: string | null;
  localOnly: boolean;
  mine: boolean | null;
  source: string;
};

/* ============================================================
   MEDIA
   Source: media policy enum + presign response (POST /media/presigned).
   ============================================================ */
export type MediaKind = "voice" | "image" | "video" | "file";

export type PresignInput = { kind: MediaKind; mime: string; size: number };
export type Presign = {
  uploadUrl: string | null;
  objectKey: string | null;
  expiresIn: number | null;
};

/* ============================================================
   GROUPS & REQUESTS
   Source: conversation group details/participants + group_request rows.
   `conversation_role` enum on the server.
   ============================================================ */
export type GroupRole = "super_admin" | "admin" | "member";

export type GroupMember = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: GroupRole;
};

/** GET /conversation/:id (needs the participants + myRole fields added). */
export type GroupDetails = {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  visibility?: "private" | "public";
  membersCount: number;
  inviteCode?: string | null;
  myRole: GroupRole;
  participants: GroupMember[];
};

/** A pending request to join a group (GET /conversation/:id/requests). */
export type JoinRequest = {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
};

/** A pending group invite for the current user (GET /user/me/pending-invites). */
export type GroupInvite = {
  id: string;
  conversationId: string;
  conversationName: string | null;
  conversationAvatar: string | null;
  fromUser: string | null;
  createdAt?: string | null;
};

/** A direct ping received over the socket (`ping:new`). */
export type PingRequest = {
  conversationId: string;
  requester: { id: string; username: string; avatarUrl?: string | null };
};
