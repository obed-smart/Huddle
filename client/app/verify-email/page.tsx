import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/auth-shell";
import { VerifyEmailView } from "@/features/auth/verify-email-view";

export const metadata: Metadata = {
  title: "Verify email — Huddle",
  description: "Confirm your Huddle email address.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Email verification"
      subtitle="Finishing up your account."
      footer={
        <>
          Need help?{" "}
          <Link href="/login" className="font-medium text-accent-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <VerifyEmailView token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
