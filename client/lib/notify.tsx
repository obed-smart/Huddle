import { toast } from "sonner";

import { MessageToast } from "@/components/notifications/message-toast";

export type NewMessageNotice = {
  name: string;
  text: string;
  avatarUrl?: string | null;
  /** Open the conversation when the toast is tapped. */
  onOpen?: () => void;
};

/**
 * Show a "new message" toast. Call this from client code when a message
 * arrives over the socket for a conversation the user isn't currently viewing.
 */
export function notifyNewMessage(notice: NewMessageNotice) {
  return toast.custom(
    (id) => (
      <MessageToast
        id={id}
        name={notice.name}
        text={notice.text}
        avatarUrl={notice.avatarUrl}
        onOpen={notice.onOpen}
      />
    ),
    { duration: 5000 },
  );
}

/** Generic toast re-export, for success/error messages elsewhere in the app. */
export { toast };
