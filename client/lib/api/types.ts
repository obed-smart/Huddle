/** Shapes the backend returns (mirrors the server README). */

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  isEmailVerified?: boolean;
};

export type Conversation = {
  id: string;
  type: "direct" | "group";
  name: string;
  avatar?: string | null;
  otherUserId?: string | null;
  membersCount?: number | null;
  updatedAt?: string | null;
};
