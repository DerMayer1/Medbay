"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav: Array<{ href: string; label: string; short: string; description: string; icon: LucideIcon }> = [
  { href: "/admin", label: "Overview", short: "Overview", description: "Daily operating state", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Visit preparation", short: "Cases", description: "Review briefs and sources", icon: ClipboardList },
  { href: "/admin/conversations", label: "Conversations", short: "Messages", description: "Patient message history", icon: MessageSquareText },
  { href: "/admin/appointments", label: "Appointments", short: "Schedule", description: "Scheduling handoff", icon: CalendarDays },
  { href: "/admin/knowledge", label: "Knowledge base", short: "Knowledge", description: "Clinic operating context", icon: BookOpenText },
  { href: "/admin/settings", label: "Safety rules", short: "Safety", description: "Policy and provider posture", icon: ShieldCheck },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-7 space-y-1" aria-label="Admin navigation">
      <p className="px-2 pb-2 font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#64748b]">Console</p>
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative grid grid-cols-[1.25rem_1fr] gap-3 rounded-[12px] px-2.5 py-3 text-sm transition duration-300",
              active ? "bg-[#0e1e3a] ring-1 ring-[#1e3a8a]" : "hover:bg-[#0b1629]",
            )}
          >
            {active ? <span className="absolute inset-y-3 -left-5 w-[3px] rounded-r-full bg-[#60a5fa]" aria-hidden="true" /> : null}
            <item.icon
              className={cn("mt-0.5 h-4 w-4 transition", active ? "text-[#bfdbfe]" : "text-[#60a5fa] group-hover:text-[#bfdbfe]")}
              strokeWidth={1.8}
            />
            <span>
              <span className={cn("block font-semibold tracking-[-0.01em] transition", active ? "text-white" : "text-[#dceafe] group-hover:text-white")}>
                {item.label}
              </span>
              <span className={cn("mt-0.5 block text-xs leading-5 transition", active ? "text-[#94a3b8]" : "text-[#64748b] group-hover:text-[#94a3b8]")}>
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
    >
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-[#3b82f6] bg-[#10264a] text-white"
                : "border-[#1d355f] bg-[#08101f] text-[#94a3b8] hover:text-[#dceafe]",
            )}
          >
            <item.icon className="h-3.5 w-3.5" strokeWidth={1.9} />
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
