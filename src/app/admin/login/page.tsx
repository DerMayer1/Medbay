import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef4ec] px-5">
      <section className="w-full max-w-md rounded-lg border border-[#d9ded6] bg-white p-6 shadow-xl shadow-[#173d2e]/10">
        <p className="text-sm font-semibold text-[#176b4d]">Medbay</p>
        <h1 className="mt-2 text-2xl font-semibold">Admin access</h1>
        <p className="mt-2 text-sm leading-6 text-[#66746f]">
          Sign in with a Supabase Auth admin account.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
