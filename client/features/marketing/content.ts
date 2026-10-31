import {
  MessageCircle,
  Phone,
  Video,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Where the two auth actions point. These pages come in the next section. */
export const routes = {
  login: "/login",
  register: "/register",
} as const;

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** The short "what's inside" list on the landing page. Kept human, not hyped. */
export const features: Feature[] = [
  {
    icon: MessageCircle,
    title: "Real-time messages",
    description:
      "Send a message and it lands instantly. Photos, voice notes, and files come along too.",
  },
  {
    icon: Phone,
    title: "Voice & video calls",
    description:
      "Ring someone directly, or turn a chat into a call. Answer, decline, or hang up the way you'd expect.",
  },
  {
    icon: Video,
    title: "Group meetings",
    description:
      "Start a room, share the link, and talk things through together with your whole team.",
  },
  {
    icon: Users,
    title: "Groups & invites",
    description:
      "Make a group, invite people, and handle join requests. Direct chats begin with a quick ping.",
  },
];
