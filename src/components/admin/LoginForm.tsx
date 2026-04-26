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

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block text-sm font-medium text-white/78">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-[14px] border border-white/10 bg-[#05090b] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#36e6d5]/55 focus:ring-4 focus:ring-[#36e6d5]/10"
        />
      </label>
      <label className="block text-sm font-medium text-white/78">
        Password
        <input
          name="password"
          type="password"
          required
          className="mt-2 w-full rounded-[14px] border border-white/10 bg-[#05090b] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#36e6d5]/55 focus:ring-4 focus:ring-[#36e6d5]/10"
        />
      </label>
      {error ? <p className="rounded-[14px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-[14px] bg-[#36e6d5] px-4 py-3 text-sm font-semibold text-[#031311] transition hover:bg-white active:scale-[0.98] disabled:opacity-60"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
