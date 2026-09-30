import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarClock, ChevronRight, FileSearch, UserCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { IntakeCaseStatus } from "@/features/intake/domain/types";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";
import { withDemoFallback } from "@/lib/demoData";
import { listDemoAppointments, listDemoConversations, listDemoLeads } from "@/lib/demoStore";
import { humanize } from "@/lib/format";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { listAppointments, listConversations, listLeads } from "@/lib/repository";

export const dynamic = "force-dynamic";

const pipeline: Array<{ status: IntakeCaseStatus; color: string }> = [
  { status: "collecting_information", color: "bg-[#64748b]" },
  { status: "needs_human_review", color: "bg-[#fbbf24]" },
  { status: "ready_for_scheduling", color: "bg-[#4ade80]" },
  { status: "appointment_requested", color: "bg-[#60a5fa]" },
  { status: "scheduled", color: "bg-[#a78bfa]" },
];

export default async function AdminDashboard() {
  const isDemo = await isPortfolioAdminSession();
  const demoLeads = listDemoLeads();
  const demoConversations = listDemoConversations();
  const demoAppointments = listDemoAppointments();
  const [leads, conversations, appointments] = isDemo
    ? [demoLeads, demoConversations, demoAppointments]
    : await Promise.all([
        withDemoFallback(listLeads(), demoLeads),
        withDemoFallback(listConversations(), demoConversations),
        withDemoFallback(listAppointments(), demoAppointments),
      ]);
  const intakeCases = leads.map((lead) => ({ ...lead, caseStatus: legacyStatusToIntakeStatus(lead.status) }));
  const waiting = intakeCases.filter((item) => item.caseStatus === "needs_human_review").length;
  const readyForScheduling = intakeCases.filter((item) => item.caseStatus === "ready_for_scheduling").length;
  const scheduled = intakeCases.filter((item) => item.caseStatus === "scheduled").length + appointments.length;
  const briefsAwaitingReview = leads.filter((item) => item.brief_review_status === "needs_review").length;
  const attentionCases = intakeCases.filter(
    (item) => item.caseStatus === "needs_human_review" || item.brief_review_status === "needs_review",
  );

  const cards = [
    { label: "Briefs awaiting review", value: briefsAwaitingReview, icon: FileSearch, href: "/admin/leads", accent: "text-[#fbbf24]" },
    { label: "Needs human review", value: waiting, icon: UserCheck, href: "/admin/leads", accent: "text-[#fbbf24]" },
    { label: "Ready for scheduling", value: readyForScheduling, icon: CalendarClock, href: "/admin/appointments", accent: "text-[#4ade80]" },
    { label: "Appointments in flight", value: scheduled, icon: CalendarClock, href: "/admin/appointments", accent: "text-[#60a5fa]" },
  ];

  const pipelineCounts = pipeline.map((stage) => ({
    ...stage,
    count: intakeCases.filter((item) => item.caseStatus === stage.status).length,
  }));
  const pipelineTotal = Math.max(
    pipelineCounts.reduce((sum, stage) => sum + stage.count, 0),
    1,
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="medbay-label">Demo operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#eef5ff]">Operations overview</h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            {intakeCases.length} active {intakeCases.length === 1 ? "case" : "cases"} · {attentionCases.length} waiting on a
            person
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb] active:scale-[0.98]"
        >
          Review visit briefs
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-2xl border border-[#1d355f]/80 bg-[#070e1c] p-4 transition hover:border-[#3b82f6]/70 hover:bg-[#0b1629] sm:p-5"
          >
            <div className="flex items-center justify-between">
              <card.icon className={`h-4 w-4 ${card.accent}`} strokeWidth={1.9} />
              <ChevronRight className="h-4 w-4 text-[#334155] transition group-hover:translate-x-0.5 group-hover:text-[#60a5fa]" />
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#eef5ff] tabular-nums">{card.value}</p>
            <p className="mt-1 text-xs text-[#94a3b8] sm:text-sm">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[#1d355f]/80 bg-[#070e1c] p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#eef5ff]">
              <AlertTriangle className="h-4 w-4 text-[#fbbf24]" />
              Needs attention
            </h2>
            <Link href="/admin/leads" className="text-sm font-semibold text-[#7db7ff] hover:text-white">
              All cases
            </Link>
          </div>
          {attentionCases.length === 0 ? (
            <p className="mt-6 text-sm text-[#94a3b8]">Nothing is waiting on a reviewer right now.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#1d355f]/60">
              {attentionCases.map((item) => (
                <li key={String(item.id)}>
                  <Link
                    href={`/admin/leads/${String(item.id)}`}
                    className="group -mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-[#0b1629]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#eef5ff]">{String(item.name || "Unnamed patient")}</p>
                      <p className="mt-0.5 truncate text-sm text-[#94a3b8]">
                        {String(item.reason_for_visit || item.goal || "No reason recorded")}
                      </p>
                    </div>
                    {item.caseStatus === "needs_human_review" ? (
                      <StatusBadge value={item.caseStatus} className="hidden sm:inline-flex" />
                    ) : (
                      <StatusBadge value="needs_review" label="Brief needs review" className="hidden sm:inline-flex" />
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#334155] transition group-hover:text-[#60a5fa]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#1d355f]/80 bg-[#070e1c] p-5">
          <h2 className="text-base font-semibold text-[#eef5ff]">Case pipeline</h2>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[#0f172a]">
            {pipelineCounts
              .filter((stage) => stage.count > 0)
              .map((stage) => (
                <div
                  key={stage.status}
                  className={stage.color}
                  style={{ width: `${(stage.count / pipelineTotal) * 100}%` }}
                  title={`${humanize(stage.status)}: ${stage.count}`}
                />
              ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {pipelineCounts.map((stage) => (
              <li key={stage.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#cbd5e1]">
                  <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                  {humanize(stage.status)}
                </span>
                <span className="font-semibold tabular-nums text-[#eef5ff]">{stage.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#1d355f]/80 bg-[#070e1c] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#eef5ff]">Recent activity</h2>
          <Link href="/admin/conversations" className="text-sm font-semibold text-[#7db7ff] hover:text-white">
            View conversations
          </Link>
        </div>
        <ol className="mt-4 space-y-0">
          {conversations.slice(0, 8).map((conversation, index, list) => {
            const status = legacyStatusToIntakeStatus(String(conversation.status || "opened"));
            return (
              <li key={String(conversation.id)} className="relative flex gap-4 pb-5 last:pb-0">
                {index < list.length - 1 ? (
                  <span className="absolute left-[5px] top-4 h-full w-px bg-[#1d355f]" aria-hidden="true" />
                ) : null}
                <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-[#3b82f6] bg-[#050914]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-6 text-[#eef5ff]">
                    {String(conversation.summary || "Conversation captured")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge value={status} />
                    <span className="text-xs text-[#64748b]">
                      Intent: {humanize(conversation.last_intent || "patient_intake").toLowerCase()}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </AdminLayout>
  );
}
