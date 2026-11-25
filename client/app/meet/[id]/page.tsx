import type { Metadata } from "next";

import { MeetView } from "@/features/meet/meet-view";

export const metadata: Metadata = {
  title: "Meeting",
};

type Props = { params: Promise<{ id: string }> };

export default async function MeetPage({ params }: Props) {
  const { id } = await params;
  return <MeetView meetId={id} />;
}
