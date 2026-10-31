import { MESSAGE_TYPES, type Message, type MessageType } from "./types";

/* Emoji rather than words: a sidebar row has little room, and a picture says
   "image" faster than the word does. */
const ICONS: Partial<Record<MessageType, string>> = {
  [MESSAGE_TYPES.IMAGE]: "📷",
  [MESSAGE_TYPES.VIDEO]: "🎥",
  [MESSAGE_TYPES.FILE]: "📄",
  [MESSAGE_TYPES.AUDIO]: "🎵",
};

/** The one-line summary a conversation row shows, built from the message. */
export function previewOf(message: Message | null): string {
  if (!message) return "";
  if (message.deleted) return "Message deleted";
  if (message.type === MESSAGE_TYPES.SYSTEM) return message.system || "";
  if (message.type === MESSAGE_TYPES.CALL) return "📞 Call";

  const [first] = message.attachments;
  if (first) {
    const icon = ICONS[first.type] || "📄";
    const extra = message.attachments.length > 1 ? ` +${message.attachments.length - 1}` : "";
    if (message.content) return `${icon} ${message.content}`;
    const label =
      first.type === MESSAGE_TYPES.FILE
        ? first.name
        : first.type.charAt(0).toUpperCase() + first.type.slice(1);
    return `${icon} ${label}${extra}`;
  }

  return message.content || "";
}
