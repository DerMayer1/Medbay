import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const routeError = params?.error;

  return (
    <main className="public-dark relative min-h-screen overflow-hidden bg-[#050914] px-5 py-8 text-[#eef5ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_32%_8%,rgba(59,130,246,0.24),rgba(5,9,20,0)_28rem),radial-gradient(circle_at_80%_72%,rgba(96,165,250,0.12),rgba(5,9,20,0)_24rem)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(147,197,253,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.04)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="group">
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#60a5fa]">MedBay</p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-[#eef5ff] transition group-hover:text-[#bfdbfe]">
              Clinical operations
            </p>
          </Link>
          <Link
            href="/"
            className="rounded-[10px] border border-[#1d355f] bg-[#0a1224]/80 px-4 py-2 text-sm font-semibold text-[#7db7ff] transition hover:border-[#60a5fa] hover:bg-[#10264a]"
          >
            Public intake
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="medbay-label">Portfolio demo console</p>
            <h1 className="mt-5 max-w-[620px] text-[3.6rem] font-semibold leading-[0.98] tracking-[-0.075em] text-[#eef5ff] sm:text-[4.6rem]">
              Review the clinic workflow without setup.
            </h1>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-[#94a3b8]">
              Open a persistent demo workspace with intake cases, safety decisions, staff notes, appointment handoff, and
              audit events. It behaves like a real operations console while staying safe for portfolio review.
            </p>

            <div className="mt-8 grid max-w-[620px] gap-3 sm:grid-cols-3">
              {[
                ["Saved state", "Status and notes persist during the running demo."],
                ["Audit trail", "Every staff action records an operational event."],
                ["No credentials", "Supabase login remains available, but is not required."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[18px] border border-[#1d355f] bg-[#08101f]/78 p-4">
                  <p className="text-sm font-semibold text-[#eef5ff]">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#64748b]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <section className="relative ml-auto w-full max-w-[500px] overflow-hidden rounded-[28px] border border-[#1d355f] bg-[#08101f]/82 p-2 shadow-[0_50px_130px_-95px_rgba(96,165,250,0.95)] backdrop-blur-xl">
            <div className="absolute inset-x-10 -top-10 h-28 rounded-full bg-[#3b82f6]/18 blur-3xl" />
            <div className="relative rounded-[22px] border border-[#1d355f]/80 bg-[#060d1b]/82 p-6 sm:p-7">
              <div className="mb-7 border-b border-[#1d355f]/80 pb-5">
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#60a5fa]">
                  Access point
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#eef5ff]">
                  Start in demo mode.
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#94a3b8]">
                  Best path for reviewing the product narrative and saved workflow state.
                </p>
              </div>

              {routeError === "forbidden" ? (
                <p className="mb-5 rounded-[14px] border border-[#3b82f6]/45 bg-[#10264a]/70 p-3 text-sm leading-6 text-[#bfdbfe]">
                  This account signed in, but it is not linked to an admin profile in Supabase.
                </p>
              ) : null}

              <LoginForm />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
