"use client";

import { useForm, useWatch } from "react-hook-form";

type LoginValues = {
  email: string;
  password: string;
};

type RegisterValues = {
  email: string;
  password: string;
  password2: string;
};

function formatError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return "Something went wrong";
}

export function LoginForms({
  loginUser,
  registerUser,
}: {
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string) => Promise<void>;
}) {
  const loginForm = useForm<LoginValues>({
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    defaultValues: { email: "", password: "", password2: "" },
  });

  const regPassword = useWatch({ control: registerForm.control, name: "password" });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        onSubmit={loginForm.handleSubmit(async (values) => {
          loginForm.clearErrors("root");
          try {
            await loginUser(values.email, values.password);
            loginForm.reset({ email: values.email, password: "" });
          } catch (e) {
            loginForm.setError("root", { message: formatError(e) });
          }
        })}
        className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <h2 className="text-lg font-medium text-white">Sign in</h2>
        {loginForm.formState.errors.root?.message ? (
          <div className="text-sm font-semibold text-rose-200">
            {loginForm.formState.errors.root.message}
          </div>
        ) : null}
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            {...loginForm.register("email", { required: "Email is required." })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            {...loginForm.register("password", { required: "Password is required." })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
          />
        </label>
        <button
          type="submit"
          disabled={loginForm.formState.isSubmitting}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loginForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <form
        onSubmit={registerForm.handleSubmit(async (values) => {
          registerForm.clearErrors("root");
          try {
            await registerUser(values.email, values.password);
            registerForm.reset({ email: values.email, password: "", password2: "" });
          } catch (e) {
            registerForm.setError("root", { message: formatError(e) });
          }
        })}
        className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <h2 className="text-lg font-medium text-white">Create account</h2>
        {registerForm.formState.errors.root?.message ? (
          <div className="text-sm font-semibold text-rose-200">
            {registerForm.formState.errors.root.message}
          </div>
        ) : null}
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            {...registerForm.register("email", { required: "Email is required." })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            {...registerForm.register("password", {
              required: "Password is required.",
              minLength: { value: 8, message: "Password must be at least 8 characters." },
            })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Confirm password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            {...registerForm.register("password2", {
              required: "Please confirm your password.",
              validate: (v) => v === regPassword || "Passwords do not match.",
            })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
          />
        </label>
        {registerForm.formState.errors.password2?.message ? (
          <div className="text-sm font-semibold text-rose-200">
            {registerForm.formState.errors.password2.message}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={registerForm.formState.isSubmitting}
          className="w-full rounded-lg border border-zinc-700 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
        >
          {registerForm.formState.isSubmitting ? "Creating…" : "Register"}
        </button>
      </form>
    </div>
  );
}

