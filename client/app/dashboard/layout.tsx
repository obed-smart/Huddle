"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/stores/session";
import { LogoMark } from "@/features/marketing/logo";

/** Guards the dashboard: loads the session, bounces anonymous visitors to login. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const status = useSession((s) => s.status);
  const load = useSession((s) => s.load);

  useEffect(() => {
    if (status === "idle") load();
  }, [status, load]);

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") {
    return (
      <div className="flex h-dvh items-center justify-center">
        <LogoMark className="size-10 animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
