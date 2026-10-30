import {
  MessageCircle,
  Phone,
  Video,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  /** Sections still to be built show as "Soon" for now. */
  enabled: boolean;
};

export const navItems: NavItem[] = [
  { key: "chats", label: "Chats", icon: MessageCircle, href: "/dashboard", enabled: true },
  { key: "calls", label: "Calls", icon: Phone, enabled: false },
  { key: "meet", label: "Meet", icon: Video, enabled: false },
  { key: "requests", label: "Requests", icon: UserPlus, enabled: false },
];
