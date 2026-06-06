import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Field, Input } from "../../components/ui/field";
import { useAuth } from "./auth-context";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

const mfaSchema = z.object({
  token: z.string().min(4, "Enter the verification code")
});

type LoginValues = z.infer<typeof loginSchema>;
type MfaValues = z.infer<typeof mfaSchema>;

export function LoginPage() {
  const { login, verifyMfa, pendingAuth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const mfaForm = useForm<MfaValues>({ resolver: zodResolver(mfaSchema) });

  const isMfa = pendingAuth?.type === "MFA";

  async function submitLogin(values: LoginValues) {
    setSubmitting(true);
    await login(values.email, values.password);
    setSubmitting(false);
  }

  async function submitMfa(values: MfaValues) {
    setSubmitting(true);
    await verifyMfa(values.token);
    setSubmitting(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <ShieldCheck size={34} />
        <h1>HRM Sign In</h1>
        <p>Access employee operations, leave, and attendance for your organization.</p>

        {isMfa ? (
          <form className="form-grid" onSubmit={mfaForm.handleSubmit(submitMfa)}>
            <Field label="Verification code" error={mfaForm.formState.errors.token?.message}>
              <Input autoFocus inputMode="numeric" {...mfaForm.register("token")} />
            </Field>
            <Button disabled={submitting} type="submit">
              Verify
            </Button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={loginForm.handleSubmit(submitLogin)}>
            <Field label="Email" error={loginForm.formState.errors.email?.message}>
              <Input autoComplete="email" type="email" {...loginForm.register("email")} />
            </Field>
            <Field label="Password" error={loginForm.formState.errors.password?.message}>
              <Input autoComplete="current-password" type="password" {...loginForm.register("password")} />
            </Field>
            <Button disabled={submitting} type="submit">
              Sign in
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
