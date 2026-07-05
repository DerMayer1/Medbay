"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
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
    <div className="space-y-5">
      <button
        type="button"
        disabled={isLoading}
        onClick={handlePortfolioAccess}
        className="group flex w-full items-center justify-between rounded-[14px] bg-[#3b82f6] px-4 py-3.5 text-left text-sm font-bold text-white ring-1 ring-[#60a5fa] transition hover:bg-[#2563eb] active:scale-[0.98] disabled:opacity-60"
      >
        <span>
          <span className="block">Open portfolio demo</span>
          <span className="mt-1 block text-xs font-medium text-[#dbeafe]">Persistent demo data, no setup required</span>
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/15 transition group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1d355f]" />
        <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#64748b]">Supabase admin</span>
        <div className="h-px flex-1 bg-[#1d355f]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-[#dceafe]">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-[12px] border border-[#1d355f] bg-[#050914] px-4 py-3 text-[#eef5ff] outline-none transition placeholder:text-[#64748b] focus:border-[#60a5fa] focus:ring-4 focus:ring-[#1d4ed8]/20"
          />
        </label>
        <label className="block text-sm font-medium text-[#dceafe]">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-2 w-full rounded-[12px] border border-[#1d355f] bg-[#050914] px-4 py-3 text-[#eef5ff] outline-none transition placeholder:text-[#64748b] focus:border-[#60a5fa] focus:ring-4 focus:ring-[#1d4ed8]/20"
          />
        </label>

        {error ? <p className="rounded-[12px] border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#1d355f] bg-[#0a1224] px-4 py-3 text-sm font-semibold text-[#bfdbfe] transition hover:border-[#60a5fa] hover:bg-[#10264a] active:scale-[0.98] disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          {isLoading ? "Signing in..." : "Sign in with Supabase"}
        </button>
      </form>

      <p className="text-xs leading-5 text-[#64748b]">
        The demo path is built for review. Supabase Auth remains available for deployments that provide real credentials.
      </p>
    </div>
  );
}
