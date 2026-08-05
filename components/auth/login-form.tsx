"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { getRoleHome } from "@/lib/roles";

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "FACULTY", label: "Faculty" },
  { value: "STUDENT", label: "Student" },
] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<(typeof roleOptions)[number]["value"]>("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const callbackUrl = searchParams.get("callbackUrl") ?? getRoleHome(role);

    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      role,
      rememberMe: String(form.get("rememberMe") === "on"),
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials, role, or inactive account.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose your role and enter your account credentials.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
        {roleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRole(option.value)}
            className={`h-10 rounded-md text-sm font-medium transition ${
              role === option.value
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder="name@college.edu"
        />
      </label>

      <label className="block text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder="Your password"
        />
      </label>

      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input name="rememberMe" type="checkbox" className="h-4 w-4" />
          Remember me
        </label>
        <Link href="/forgot-password" className="font-medium text-emerald-700">
          Forgot password?
        </Link>
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-500">
        New to CampusFlow?{" "}
        <Link href="/register" className="font-medium text-emerald-700">
          Create an account
        </Link>
      </p>
    </form>
  );
}
