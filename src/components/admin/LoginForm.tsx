"use client";

import { FormEvent, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabaseClient";

export function LoginForm() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const supabase = getBrowserSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    window.location.href = new URLSearchParams(window.location.search).get("next") || "/admin";
  }

  async function handlePortfolioAccess() {
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/admin/portfolio-login", { method: "POST" });
    if (!response.ok) {
      setError("Portfolio access is not enabled for this deployment.");
      setIsLoading(false);
      return;
    }

    window.location.href = new URLSearchParams(window.location.search).get("next") || "/admin";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block text-sm font-medium text-[#262626]">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-[14px] border border-[#e5e5e5] bg-[#ffffff] px-4 py-3 text-[#262626] outline-none transition placeholder:text-[#a3a3a3] focus:border-[#60a5fa] focus:ring-4 focus:ring-[#dbeafe]"
        />
      </label>
      <label className="block text-sm font-medium text-[#262626]">
        Password
        <input
          name="password"
          type="password"
          required
          className="mt-2 w-full rounded-[14px] border border-[#e5e5e5] bg-[#ffffff] px-4 py-3 text-[#262626] outline-none transition placeholder:text-[#a3a3a3] focus:border-[#60a5fa] focus:ring-4 focus:ring-[#dbeafe]"
        />
      </label>
      {error ? <p className="rounded-[14px] border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-[14px] bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#2563eb] active:scale-[0.98] disabled:opacity-60"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <button
        type="button"
        disabled={isLoading}
        onClick={handlePortfolioAccess}
        className="w-full rounded-[14px] border border-[#e5e5e5] bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#eff6ff] active:scale-[0.98] disabled:opacity-60"
      >
        Open portfolio demo
      </button>
      <p className="text-center text-xs leading-5 text-[#737373]">
        Demo access uses fictional clinic data and keeps Supabase Auth available for real deployments.
      </p>
    </form>
  );
}
