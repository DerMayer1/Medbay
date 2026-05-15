import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const routeError = params?.error;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#05090b] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(54,230,213,0.18),transparent_34%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:auto,88px_88px,88px_88px]" />
      <section className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b1518]/95 p-6 shadow-[0_34px_100px_-55px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-[#36e6d5]/25 bg-[#36e6d5]/10">
            <span className="h-3.5 w-3.5 rounded-[5px] bg-[#36e6d5]" />
          </span>
          <div>
            <p className="text-lg font-semibold">Medbay</p>
            <p className="font-mono text-[10px] uppercase text-white/45">Admin access</p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold leading-tight">Sign in to operations.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Use a Supabase Auth admin account connected to this project.</p>
        {routeError === "forbidden" ? (
          <p className="mt-5 rounded-[14px] border border-[#f2b466]/25 bg-[#f2b466]/10 p-3 text-sm leading-6 text-[#ffd19a]">
            This account signed in, but it is not linked to an admin profile in Supabase.
          </p>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}
