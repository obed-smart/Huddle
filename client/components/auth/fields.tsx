import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
} & React.ComponentProps<"input">;

function describe(id: string, error?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="text-xs text-destructive">
      {error}
    </p>
  );
}

/** Labeled text input with inline error. */
export function TextField({ id, label, error, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...describe(id, error)} {...props} />
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Labeled password input (show/hide) with inline error. */
export function PasswordField({ id, label, error, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <PasswordInput id={id} {...describe(id, error)} {...props} />
      <FieldError id={id} error={error} />
    </div>
  );
}
