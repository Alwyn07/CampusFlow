"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getRoleHome } from "@/lib/roles";

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "FACULTY", label: "Faculty" },
  { value: "STUDENT", label: "Student" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<(typeof roleOptions)[number]["value"]>("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      role,
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const fieldErrors = data?.issues?.fieldErrors;
      const firstValidationError = fieldErrors
        ? Object.values(fieldErrors).flat().find(Boolean)
        : null;

      setError(
        String(firstValidationError ?? data?.error ?? "Registration failed."),
      );
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      role,
      rememberMe: "true",
      redirect: false,
      callbackUrl: getRoleHome(role),
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push(result?.url ?? getRoleHome(role));
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Create account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Register a role-based CampusFlow account.
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
        Full name
        <input
          name="name"
          required
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder="Your name"
        />
      </label>

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
          minLength={8}
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder="At least 8 characters"
        />
      </label>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-emerald-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
