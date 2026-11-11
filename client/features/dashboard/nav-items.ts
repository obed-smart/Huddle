import { MessageCircle, Phone, Video, type LucideIcon } from "lucide-react";

import type { Section } from "@/stores/section";

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** The sidebar section this item switches to. Items without one are not
      built yet and show as "coming soon". */
  section?: Section;
  enabled: boolean;
};

/* Requests (pings and group invites) are not here. They live in the
   notification bell at the top, since they are the only notifications Huddle
   raises. */
export const navItems: NavItem[] = [
  { key: "chats", label: "Chats", icon: MessageCircle, section: "chats", enabled: true },
  { key: "calls", label: "Calls", icon: Phone, section: "calls", enabled: true },
  { key: "meet", label: "Meet", icon: Video, enabled: false },
];
