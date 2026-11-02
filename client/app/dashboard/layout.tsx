import { getMe, getConversations } from "@/lib/server/data";
import { DashboardGate } from "@/features/dashboard/dashboard-gate";

// The dashboard is per-user and reads the session cookie, so it renders per
// request rather than being prerendered.
export const dynamic = "force-dynamic";

/** Resolves the session and the conversation list on the server, then hands
    both to the client gate for the first paint. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, conversations] = await Promise.all([getMe(), getConversations()]);

  return (
    <DashboardGate user={user} conversations={conversations ?? []}>
      {children}
    </DashboardGate>
  );
}
