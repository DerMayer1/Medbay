"use client";

import Link from "next/link";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#070b0e] px-5 text-white">
      <section className="w-full max-w-lg border border-white/10 bg-[#0b1114] p-8">
        <h1 className="text-2xl font-semibold">The staff console is unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Medbay could not connect to the clinic data service. No changes were made.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-[#36e6d5] px-4 py-2.5 text-sm font-semibold text-[#031311]"
          >
            Try again
          </button>
          <Link href="/" className="border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80">
            Return to intake
          </Link>
        </div>
      </section>
    </main>
  );
}
