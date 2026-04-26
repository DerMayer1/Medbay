import Link from "next/link";

const nav = [
  { href: "/admin", label: "Overview", glyph: "OV" },
  { href: "/admin/leads", label: "Intake Cases", glyph: "IC" },
  { href: "/admin/conversations", label: "Conversations", glyph: "CN" },
  { href: "/admin/appointments", label: "Appointments", glyph: "AP" },
  { href: "/admin/knowledge", label: "Knowledge Base", glyph: "KB" },
  { href: "/admin/settings", label: "Safety / Settings", glyph: "SF" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b0e] text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-[#0a1013] p-5 md:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/10 bg-white/[0.06]">
            <span className="h-3.5 w-3.5 rounded-[5px] bg-[#27d1bf]" />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-[-0.03em]">Medbay</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              Clinic console
            </span>
          </span>
        </Link>

        <div className="mt-8 rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9ff4ea]">Workspace</p>
          <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em]">Northstar operations</h1>
          <p className="mt-2 text-xs leading-5 text-white/50">Review intake, scheduling, handoff, and safety state.</p>
        </div>

        <nav className="mt-6 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium text-white/56 transition hover:bg-white/[0.06] hover:text-white"
            >
              <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/10 bg-white/[0.04] font-mono text-[10px] text-white/44 transition group-hover:border-[#27d1bf]/40 group-hover:text-[#9ff4ea]">
                {item.glyph}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b0e]/86 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/44">
              Clinical operations platform
            </p>
            <Link
              href="/"
              className="hidden rounded-[12px] border border-white/10 px-4 py-2 text-sm font-semibold text-[#9ff4ea] transition hover:bg-white/[0.06] sm:block"
            >
              Public intake
            </Link>
          </div>
        </header>
        <main className="px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
