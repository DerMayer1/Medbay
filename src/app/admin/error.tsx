"use client";

import Link from "next/link";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fafafa] px-5 text-[#262626]">
      <section className="w-full max-w-lg rounded-[24px] border border-[#e5e5e5] bg-[#ffffff] p-8">
        <h1 className="text-2xl font-semibold">The staff console is unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-[#737373]">
          Medbay could not connect to the clinic data service. No changes were made.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-[#ffffff]"
          >
            Try again
          </button>
          <Link href="/" className="border border-[#e5e5e5] px-4 py-2.5 text-sm font-semibold text-[#1d4ed8]">
            Return to intake
          </Link>
        </div>
      </section>
    </main>
  );
}
