"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TextField, PasswordField } from "@/features/auth/fields";
import { login, ApiError } from "@/lib/api/auth";
import { requiredError } from "@/lib/validation";

type Errors = { identifier?: string; password?: string };

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const identifierError = () => requiredError(identifier, "Email or username");
  const passwordRequired = () => (password ? undefined : "Password is required.");
  const clear = (key: keyof Errors) => setErrors((p) => ({ ...p, [key]: undefined }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const next = { identifier: identifierError(), password: passwordRequired() };
    setErrors(next);
    if (next.identifier || next.password) return;

    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <TextField
        id="identifier"
        label="Email or username"
        autoComplete="username"
        placeholder="you@example.com"
        value={identifier}
        error={errors.identifier}
        onChange={(e) => {
          setIdentifier(e.target.value);
          if (errors.identifier) clear("identifier");
        }}
        onBlur={() => setErrors((p) => ({ ...p, identifier: identifierError() }))}
      />

      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        error={errors.password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) clear("password");
        }}
        onBlur={() => setErrors((p) => ({ ...p, password: passwordRequired() }))}
      />

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
