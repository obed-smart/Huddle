"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TextField, PasswordField } from "@/features/auth/fields";
import { register, ApiError } from "@/lib/api/auth";
import { requiredError, emailError, passwordError } from "@/lib/validation";

type Fields = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};
type Errors = Partial<Record<keyof Fields, string>>;

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<Fields>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function errorFor(key: keyof Fields, v: Fields): string | undefined {
    if (key === "firstName") return requiredError(v.firstName, "First name");
    if (key === "lastName") return requiredError(v.lastName, "Last name");
    if (key === "username") return requiredError(v.username, "Username");
    if (key === "email") return emailError(v.email);
    return passwordError(v.password);
  }

  function set(key: keyof Fields, value: string) {
    setValues((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  const blur = (key: keyof Fields) =>
    setErrors((p) => ({ ...p, [key]: errorFor(key, values) }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const next: Errors = {
      firstName: errorFor("firstName", values),
      lastName: errorFor("lastName", values),
      username: errorFor("username", values),
      email: errorFor("email", values),
      password: errorFor("password", values),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        username: values.username.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      });
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

      <div className="grid grid-cols-2 gap-3">
        <TextField
          id="firstName"
          label="First name"
          autoComplete="given-name"
          placeholder="Ada"
          value={values.firstName}
          error={errors.firstName}
          onChange={(e) => set("firstName", e.target.value)}
          onBlur={() => blur("firstName")}
        />
        <TextField
          id="lastName"
          label="Last name"
          autoComplete="family-name"
          placeholder="Lovelace"
          value={values.lastName}
          error={errors.lastName}
          onChange={(e) => set("lastName", e.target.value)}
          onBlur={() => blur("lastName")}
        />
      </div>
      <TextField
        id="username"
        label="Username"
        autoComplete="username"
        placeholder="ada"
        value={values.username}
        error={errors.username}
        onChange={(e) => set("username", e.target.value)}
        onBlur={() => blur("username")}
      />
      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={values.email}
        error={errors.email}
        onChange={(e) => set("email", e.target.value)}
        onBlur={() => blur("email")}
      />
      <PasswordField
        id="new-password"
        label="Password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={values.password}
        error={errors.password}
        onChange={(e) => set("password", e.target.value)}
        onBlur={() => blur("password")}
      />

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
