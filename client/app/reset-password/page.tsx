import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — Huddle",
  description: "Reset your Huddle password with a code sent to your email.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="We’ll email you a code, then you can set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-accent-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
