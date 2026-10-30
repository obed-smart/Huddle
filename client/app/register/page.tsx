import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account — Huddle",
  description: "Create your Huddle account.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes about a minute to get started."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent-foreground hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" />
      <OrDivider />
      <RegisterForm />
    </AuthShell>
  );
}
