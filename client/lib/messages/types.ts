/** The one message shape every source (history, socket, optimistic) becomes. */

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
  /** What a bubble renders from (may be a local object URL). */
  url: string | null;
  /** Where the bytes live once uploaded. */
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
  /** Ours until the server names it. Drives echo reconciliation. */
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
  /** Delivery state: the client's business, never the server's. */
  pending: boolean;
  failed: boolean;
  failureMessage: string | null;
  localOnly: boolean;
  mine: boolean | null;
  source: string;
};

export type NormalizeContext = {
  conversationId?: string | null;
  source?: string;
  pending?: boolean;
  localOnly?: boolean;
  mine?: boolean | null;
};
