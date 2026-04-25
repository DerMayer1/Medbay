import Link from "next/link";
import { CalendarDays, Database, LayoutDashboard, MessageSquareText, Settings, ShieldCheck, Users } from "lucide-react";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Intake Cases", icon: Users },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquareText },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: Database },
  { href: "/admin/settings", label: "Safety / Settings", icon: ShieldCheck },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-slate-950 p-5 md:block">
        <p className="text-sm font-semibold text-cyan-200">Medbay</p>
        <h1 className="mt-1 text-xl font-semibold">Clinic Ops Console</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">Northstar Clinic demo workspace</p>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="border-b border-white/10 bg-slate-950/95 px-5 py-4 md:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">AI operations platform for modern clinics</p>
            <Link href="/" className="hidden text-sm font-semibold text-cyan-200 sm:block">
              Public demo
            </Link>
          </div>
        </header>
        <main className="px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
