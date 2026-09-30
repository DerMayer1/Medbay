import { humanize, toneFor, type StatusTone } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-[#334155] bg-[#0f172a] text-[#cbd5e1]",
  info: "border-[#1e40af] bg-[#0b1a3a] text-[#93c5fd]",
  success: "border-[#166534] bg-[#052e1a] text-[#86efac]",
  warning: "border-[#854d0e] bg-[#2a1a05] text-[#fcd34d]",
  danger: "border-[#991b1b] bg-[#2a0a0a] text-[#fca5a5]",
};

const dotClasses: Record<StatusTone, string> = {
  neutral: "bg-[#94a3b8]",
  info: "bg-[#60a5fa]",
  success: "bg-[#4ade80]",
  warning: "bg-[#fbbf24]",
  danger: "bg-[#f87171]",
};

export function StatusBadge({
  value,
  tone,
  label,
  className,
}: {
  value: unknown;
  tone?: StatusTone;
  label?: string;
  className?: string;
}) {
  const resolvedTone = tone ?? toneFor(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[resolvedTone],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[resolvedTone])} aria-hidden="true" />
      {label ?? humanize(value)}
    </span>
  );
}
