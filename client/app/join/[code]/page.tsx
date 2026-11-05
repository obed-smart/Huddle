import { JoinView } from "@/features/invite/join-view";

/** `/join/<code>` — the landing for a group invite link. */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JoinView code={code} />;
}
