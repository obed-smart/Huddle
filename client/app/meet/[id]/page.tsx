import type { Metadata } from "next";

import { MeetView } from "@/features/meet/meet-view";

export const metadata: Metadata = {
  title: "Meeting",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conversationId?: string }>;
};

export default async function MeetPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { conversationId } = await searchParams;
  return <MeetView meetId={id} conversationId={conversationId} />;
}
