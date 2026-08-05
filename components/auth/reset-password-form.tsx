"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error ?? "Unable to reset password.");
      return;
    }

    setMessage(data?.message ?? "Password updated.");
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Reset password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose a new password for your CampusFlow account.
        </p>
      </div>

      {!token ? (
        <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">
          Missing reset token. Please request a new reset link.
        </p>
      ) : null}

      <label className="block text-sm font-medium">
        New password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          disabled={!token}
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
          placeholder="At least 8 characters"
        />
      </label>

      <label className="block text-sm font-medium">
        Confirm password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          disabled={!token}
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
          placeholder="Repeat password"
        />
      </label>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={loading || !token}
        className="h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Updating password..." : "Update password"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Back to{" "}
        <Link href="/login" className="font-medium text-emerald-700">
          sign in
        </Link>
      </p>
    </form>
  );
}
