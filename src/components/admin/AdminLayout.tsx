import Link from "next/link";
import {
  BookOpenText,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const nav: Array<{ href: string; label: string; description: string; icon: LucideIcon }> = [
  { href: "/admin", label: "Overview", description: "Daily operating state", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Intake cases", description: "Review and route requests", icon: ClipboardList },
  { href: "/admin/conversations", label: "Conversations", description: "Patient message history", icon: MessageSquareText },
  { href: "/admin/appointments", label: "Appointments", description: "Scheduling handoff", icon: CalendarDays },
  { href: "/admin/knowledge", label: "Knowledge base", description: "Clinic operating context", icon: BookOpenText },
  { href: "/admin/settings", label: "Safety rules", description: "Policy and provider posture", icon: ShieldCheck },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-dark min-h-screen overflow-x-clip bg-[#050914] text-[#eef5ff]">
      <aside className="fixed inset-y-0 left-0 hidden w-[264px] border-r border-[#1d355f]/70 bg-[#050914]/95 px-5 py-6 shadow-[28px_0_90px_-78px_rgba(59,130,246,0.95)] backdrop-blur-xl md:flex md:flex-col">
        <div className="border-b border-[#1d355f]/70 pb-6">
          <Link href="/" className="group block">
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#60a5fa]">MedBay</p>
            <h1 className="mt-2 max-w-[11rem] text-[1.45rem] font-semibold leading-[1.05] tracking-[-0.055em] text-[#eef5ff] transition group-hover:text-[#bfdbfe]">
              Clinical operations
            </h1>
          </Link>
          <div className="mt-5 flex items-center justify-between gap-3 text-xs">
            <span className="text-[#94a3b8]">Northstar Clinic</span>
            <span className="rounded-md border border-[#1d355f] bg-[#08101f] px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#7db7ff]">
              Demo
            </span>
          </div>
        </div>

        <nav className="mt-7 space-y-1" aria-label="Admin navigation">
          <p className="px-2 pb-2 font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#64748b]">
            Console
          </p>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group grid grid-cols-[1.25rem_1fr] gap-3 rounded-[12px] px-2.5 py-3 text-sm transition duration-300 hover:bg-[#0b1629]"
            >
              <item.icon className="mt-0.5 h-4 w-4 text-[#60a5fa] transition group-hover:text-[#bfdbfe]" strokeWidth={1.8} />
              <span>
                <span className="block font-semibold tracking-[-0.01em] text-[#dceafe] transition group-hover:text-[#ffffff]">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#64748b] transition group-hover:text-[#94a3b8]">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#1d355f]/70 pt-5">
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#64748b]">Review mode</p>
          <p className="mt-2 text-sm leading-6 text-[#94a3b8]">
            Fictional clinic data. Built to demonstrate intake, safety routing, and staff review.
          </p>
        </div>
      </aside>

      <div className="md:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-[#1d355f]/70 bg-[#050914]/82 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
                Northstar Clinic
              </p>
              <p className="mt-1 hidden text-sm text-[#94a3b8] sm:block">
                Intake review, policy decisions, scheduling handoff, and operational audit.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-[10px] border border-[#1d355f] bg-[#0a1224] px-4 py-2 text-sm font-semibold text-[#7db7ff] transition hover:border-[#60a5fa] hover:bg-[#10264a] active:scale-[0.98]"
            >
              Public intake
            </Link>
          </div>
        </header>

        <main className="relative px-5 py-6 md:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),rgba(5,9,20,0)_62%)]" />
          <div className="relative mx-auto max-w-[1360px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
