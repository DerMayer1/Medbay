import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const routeError = params?.error;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fafafa] px-5 text-[#262626]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(223,238,228,0.95),transparent_34%),linear-gradient(rgba(16,35,31,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(16,35,31,0.035)_1px,transparent_1px)] bg-[size:auto,88px_88px,88px_88px]" />
      <section className="relative w-full max-w-md rounded-[28px] border border-[#e5e5e5] bg-[#ffffff]/95 p-6 shadow-[0_34px_100px_-72px_rgba(61,50,32,0.65)] backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#3b82f6] text-xs font-semibold text-[#ffffff]">
            MB
          </span>
          <div>
            <p className="text-lg font-semibold">MedBay</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">Admin access</p>
          </div>
        </div>
        <h1 className="text-3xl font-semibold leading-tight">Sign in to operations.</h1>
        <p className="mt-3 text-sm leading-6 text-[#737373]">
          Open the portfolio demo instantly, or use a Supabase Auth admin account for a real deployment.
        </p>
        {routeError === "forbidden" ? (
          <p className="mt-5 rounded-[14px] border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            This account signed in, but it is not linked to an admin profile in Supabase.
          </p>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}
