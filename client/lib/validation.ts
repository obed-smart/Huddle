/** Tiny, dependency-free validators for the auth forms. */

export function requiredError(value: string, label: string) {
  return value.trim() ? undefined : `${label} is required.`;
}

export function emailError(value: string) {
  if (!value.trim()) return "Email is required.";
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return ok ? undefined : "Enter a valid email address.";
}

export function passwordError(value: string, min = 8) {
  if (!value) return "Password is required.";
  return value.length >= min
    ? undefined
    : `Password must be at least ${min} characters.`;
}
