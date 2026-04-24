import Link from "next/link";
import { CalendarDays, Database, LayoutDashboard, MessageSquareText, Settings, Users } from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/conversations", label: "Conversas", icon: MessageSquareText },
  { href: "/admin/appointments", label: "Agenda", icon: CalendarDays },
  { href: "/admin/knowledge", label: "Base", icon: Database },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#18211f]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#d9ded6] bg-white p-5 md:block">
        <p className="text-sm font-semibold text-[#176b4d]">Juliana Pansardi</p>
        <h1 className="mt-1 text-xl font-semibold">Painel</h1>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#41504b] hover:bg-[#eef4ec] hover:text-[#14231e]"
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="border-b border-[#d9ded6] bg-white px-5 py-4 md:px-8">
          <p className="text-sm text-[#62716b]">Secretária Virtual administrativa</p>
        </header>
        <main className="px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
