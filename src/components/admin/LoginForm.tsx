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
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-md border border-[#c7d0c8] px-3 py-2 outline-none focus:border-[#176b4d]"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          required
          className="mt-2 w-full rounded-md border border-[#c7d0c8] px-3 py-2 outline-none focus:border-[#176b4d]"
        />
      </label>
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-[#176b4d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        Sign in
      </button>
    </form>
  );
}
