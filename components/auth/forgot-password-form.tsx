"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") ?? "") }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error ?? "Unable to create reset request.");
      return;
    }

    setMessage(data?.message ?? "Password reset request created.");
    setResetUrl(data?.resetUrl ?? "");
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Forgot password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email to create a secure reset link.
        </p>
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

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {resetUrl ? (
        <Link href={resetUrl} className="block break-all text-sm font-medium text-emerald-700">
          Open local reset link
        </Link>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating link..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-emerald-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
