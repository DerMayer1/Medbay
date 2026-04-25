import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarCheck,
  ClipboardList,
  Database,
  GitBranch,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ChatWidget } from "@/components/public/ChatWidget";
import { Particles } from "@/components/public/Particles";

const modules = [
  {
    icon: ClipboardList,
    title: "Patient intake",
    description: "Collect structured intake data, source, urgency, specialty, payment type, and availability.",
  },
  {
    icon: GitBranch,
    title: "Lead qualification",
    description: "Move patients from new intake to qualified, scheduled, waiting human review, or resolved.",
  },
  {
    icon: CalendarCheck,
    title: "Scheduling workflows",
    description: "Use a mock calendar in demo mode or Google Calendar when credentials are configured.",
  },
  {
    icon: ShieldCheck,
    title: "Safety guardrails",
    description: "Block diagnosis, prescriptions, clinical advice, diet plans, supplements, and exam interpretation.",
  },
];

const operations = [
  ["01", "AI intake", "Capture the first patient request in a structured conversation."],
  ["02", "Human handoff", "Escalate clinical, urgent, or ambiguous requests to staff."],
  ["03", "Admin console", "Review leads, conversations, appointments, knowledge, and safety rules."],
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070b] text-white selection:bg-cyan-400 selection:text-[#051015]">
      <Particles />
      <section className="relative border-b border-cyan-400/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(249,115,22,0.14),transparent_28%),linear-gradient(135deg,#05070b_0%,#08111f_52%,#120b08_100%)]" />
        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-6 md:grid-cols-[0.95fr_1.05fr] md:px-8 lg:px-12">
          <header className="col-span-full flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Medbay</p>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/55">Northstar Clinic Demo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="hidden rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 backdrop-blur-md transition hover:bg-white/10 sm:inline-flex"
              >
                Admin dashboard
              </Link>
              <a
                href="#demo"
                className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#061017] transition hover:bg-cyan-200"
              >
                Open demo
              </a>
            </div>
          </header>

          <div className="flex flex-col justify-center py-10">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              <Bot className="h-4 w-4" />
              AI Clinic Operations Platform
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Patient intake, scheduling, and handoff workflows in one operations console.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Medbay is a production-oriented demo platform for modern clinics: AI-assisted intake, lead qualification,
              knowledge-base answers, scheduling support, safety guardrails, and staff escalation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan-300 to-sky-300 px-5 py-3 text-sm font-semibold text-[#061017] shadow-[0_0_40px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5"
              >
                Try patient intake
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/admin"
                className="rounded-md border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.1]"
              >
                View operations dashboard
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              {operations.map(([number, title, description]) => (
                <div key={number} className="border-l border-cyan-300/25 bg-white/[0.035] p-4">
                  <p className="text-xl font-semibold text-cyan-200">{number}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="demo" className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-cyan-300/30 via-white/5 to-orange-500/20 blur-lg" />
              <div className="relative rounded-2xl border border-white/10 bg-[#071019]/86 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <ChatWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 bg-[#070a10]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-12">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Platform modules</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-white sm:text-4xl">
                Built as a real clinic operations product, not a chatbot landing page.
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
              <Database className="h-4 w-4 text-cyan-200" />
              Supabase-ready, demo-mode capable
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-white/10 bg-[#0b111b] p-5 transition hover:border-cyan-300/30 hover:bg-[#0d1624]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#05070b]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-[0.8fr_1.2fr] md:px-8 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Recruiter-ready demo</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Northstar Clinic runs entirely in demo mode.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Recruiters can explore intake, lead management, appointment records, knowledge-base CRUD, and safety rules
              without real API keys. Real OpenAI, Resend, Supabase, and Google Calendar integrations activate when
              environment variables are configured.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Demo data", "Seed leads, conversations, and appointments render without credentials."],
              ["Mock providers", "Email and calendar actions log simulated events when keys are absent."],
              ["Safety layer", "Deterministic guardrails override unsafe model output."],
              ["Admin workflows", "Staff can review summaries, status, handoff, and appointment operations."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <Users className="h-5 w-5 text-orange-300" />
                <h3 className="mt-4 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
