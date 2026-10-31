import { MessageCircle, Phone, Video, type LucideIcon } from "lucide-react";

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  /** Sections still to be built show as "Soon" for now. */
  enabled: boolean;
};

/* Requests (pings and group invites) are not here. They live in the
   notification bell at the top, since they are the only notifications Huddle
   raises. */
export const navItems: NavItem[] = [
  { key: "chats", label: "Chats", icon: MessageCircle, href: "/dashboard", enabled: true },
  { key: "calls", label: "Calls", icon: Phone, enabled: false },
  { key: "meet", label: "Meet", icon: Video, enabled: false },
];
