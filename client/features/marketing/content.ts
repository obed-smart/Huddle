import {
  MessageCircle,
  Phone,
  Users,
  ShieldCheck,
  Zap,
  Paperclip,
  type LucideIcon,
} from "lucide-react";

/** Where the two auth actions point. */
export const routes = {
  login: "/login",
  register: "/register",
} as const;

/** In-page anchors in the top bar. */
export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#showcase" },
] as const;

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** The core three, kept human and not hyped. */
export const features: Feature[] = [
  {
    icon: MessageCircle,
    title: "Real time messages",
    description:
      "Send a message and it lands at once. Photos, voice notes, and files ride along in the same thread.",
  },
  {
    icon: Phone,
    title: "Voice and video calls",
    description:
      "Ring someone directly, or turn a chat into a call. Answer, decline, or hang up the way you expect.",
  },
  {
    icon: Users,
    title: "Groups and meetings",
    description:
      "Start a group, invite your people, and talk it through together, one room for the whole team.",
  },
];

/** Small reassurances under the hero, honest ones, not invented numbers. */
export const assurances: { icon: LucideIcon; label: string }[] = [
  { icon: Zap, label: "Real time by default" },
  { icon: ShieldCheck, label: "Private by design" },
  { icon: Paperclip, label: "Files and voice notes" },
];
