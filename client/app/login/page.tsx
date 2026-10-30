import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/auth-shell";
import { GoogleButton } from "@/features/auth/google-button";
import { OrDivider } from "@/features/auth/or-divider";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — Huddle",
  description: "Sign in to your Huddle account.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New to Huddle?{" "}
          <Link
            href="/register"
            className="font-medium text-accent-foreground hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton label="Continue with Google" />
      <OrDivider />
      <LoginForm />
    </AuthShell>
  );
}
