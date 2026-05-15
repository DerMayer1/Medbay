"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChatWidget } from "@/components/public/ChatWidget";

const ease = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.72, ease } },
};

const navItems = [
  ["Platform", "#platform"],
  ["Workflow", "#workflow"],
  ["Signal", "#signal"],
  ["Safety", "#safety"],
];

const metrics = [
  ["47.2", "manual touches removed"],
  ["08", "workflow states"],
  ["1.8s", "response target"],
];

const operatingRows = [
  { name: "Elena Araujo", reason: "lab interpretation boundary", status: "human review", risk: "urgent", score: 82 },
  { name: "Marco Rivas", reason: "availability and payment captured", status: "ready to schedule", risk: "clear", score: 96 },
  { name: "Priya Nair", reason: "provider preference missing", status: "collecting", risk: "open", score: 54 },
];

const modules = [
  {
    code: "01",
    title: "Intake that converts",
    description:
      "The patient sees one calm conversation. The clinic receives structured fields, urgency, intent, payment context, and availability.",
  },
  {
    code: "02",
    title: "Policy before response",
    description:
      "Emergency language, diagnosis requests, medication questions, and lab interpretation are routed before the assistant can improvise.",
  },
  {
    code: "03",
    title: "Operational memory",
    description:
      "Every message, status transition, handoff, appointment request, and policy decision remains available to staff.",
  },
  {
    code: "04",
    title: "Scheduling handoff",
    description:
      "Qualified cases move into appointment requests tied to calendar availability and human review.",
  },
];

const workflow = [
  ["Message", "A patient request enters a persistent conversation, not a disposable chat transcript."],
  ["Extract", "Intake data is normalized into a case with a measurable completion state."],
  ["Guard", "Clinical boundaries are evaluated before routing and assistant response."],
  ["Act", "Staff can review, schedule, close, or escalate from the console."],
];

const signalRows = [
  ["Risk boundary", "clinical_question", "review"],
  ["Scheduling path", "availability_present", "ready"],
  ["Data quality", "contact_verified", "complete"],
  ["Audit event", "policy_evaluated", "stored"],
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05090b] text-white">
      <AmbientField />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05090b]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-[#36e6d5]/25 bg-[#36e6d5]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <motion.span
                className="h-3.5 w-3.5 rounded-[5px] bg-[#36e6d5]"
                animate={{ scale: [1, 1.24, 1], opacity: [1, 0.72, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            <span>
              <span className="block text-lg font-semibold">Medbay</span>
              <span className="block font-mono text-[10px] uppercase text-white/45">
                Clinical operations
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/58 lg:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-white">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden rounded-[12px] border border-white/12 px-4 py-2.5 text-sm font-semibold text-white/72 transition hover:border-[#36e6d5]/45 hover:bg-[#36e6d5]/8 hover:text-white sm:inline-flex"
            >
              Staff console
            </Link>
            <a
              href="#intake"
              className="rounded-[12px] bg-[#36e6d5] px-4 py-2.5 text-sm font-semibold text-[#031311] transition hover:bg-white active:scale-[0.98]"
            >
              Start intake
            </a>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="mx-auto grid min-h-[calc(100dvh-4.25rem)] max-w-[1500px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:px-8 xl:gap-12">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-[660px]">
            <motion.div
              variants={item}
              className="mb-6 inline-flex items-center gap-3 rounded-[999px] border border-[#36e6d5]/24 bg-[#36e6d5]/10 px-3 py-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-[#36e6d5] shadow-[0_0_18px_rgba(54,230,213,0.72)]" />
              <span className="font-mono text-[11px] uppercase text-[#a8fff6]">
                Telehealth intake engine
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="max-w-[650px] text-balance text-5xl font-semibold leading-[1.02] text-white sm:text-6xl xl:text-7xl"
            >
              The clinical front door for high-volume care teams.
            </motion.h1>

            <motion.p variants={item} className="mt-6 max-w-[600px] text-base leading-8 text-white/62 sm:text-lg">
              Medbay turns patient messages into structured intake cases, guardrail decisions, scheduling handoffs, and
              staff-ready operational records.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#intake"
                className="inline-flex items-center justify-center rounded-[14px] bg-white px-5 py-3.5 text-sm font-semibold text-[#05090b] transition hover:bg-[#d8fffb] active:scale-[0.98]"
              >
                Run patient intake
              </a>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.045] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-[#36e6d5]/45 hover:bg-[#36e6d5]/10 active:scale-[0.98]"
              >
                Open operations console
              </Link>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-9 grid max-w-[600px] grid-cols-3 overflow-hidden rounded-[24px] border border-white/10 bg-[#0a1114]/90"
            >
              {metrics.map(([value, label]) => (
                <div key={value} className="border-r border-white/10 p-4 last:border-r-0 sm:p-5">
                  <p className="font-mono text-2xl text-white">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-white/50">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.1 }}
            className="min-w-0 [perspective:1200px]"
          >
            <div className="relative rounded-[34px] border border-white/12 bg-white/[0.055] p-2 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.86)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute -inset-px rounded-[34px] bg-[conic-gradient(from_120deg_at_48%_42%,transparent_0deg,rgba(54,230,213,0.36)_68deg,transparent_130deg,transparent_360deg)] opacity-50" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#081013]/96">
                <WorkspaceHeader />

                <div className="grid min-h-[620px] lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                  <aside className="hidden border-r border-white/10 p-4 lg:block">
                    <QueuePanel />
                  </aside>

                  <div id="intake" className="min-w-0 p-4 lg:p-5">
                    <ChatWidget />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="platform" className="relative border-t border-white/10 bg-[#071012] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-32">
          <SectionIntro
            eyebrow="Platform"
            title="Every module behaves like infrastructure, not marketing UI."
            description="A single dark cockpit for intake, routing, policy decisions, scheduling state, and staff review."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module, index) => (
              <motion.article
                key={module.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.58, ease, delay: index * 0.05 }}
                className="group relative min-h-[260px] overflow-hidden rounded-[26px] border border-white/10 bg-[#0b1518] p-6 transition hover:-translate-y-1 hover:border-[#36e6d5]/40"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(54,230,213,0.82),transparent)] opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-6">
                  <span className="font-mono text-xs uppercase text-[#36e6d5]">{module.code}</span>
                  <motion.span
                    className="h-10 w-10 rounded-[14px] border border-white/12 bg-white/[0.035]"
                    whileHover={{ rotate: 18, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  />
                </div>
                <h3 className="mt-12 max-w-[14ch] text-3xl font-semibold leading-[1.02]">{module.title}</h3>
                <p className="mt-5 text-sm leading-7 text-white/55">{module.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative border-t border-white/10 bg-[#05090b] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-14 px-4 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-32">
          <div>
            <SectionIntro
              eyebrow="Workflow"
              title="A routing system that reveals what happened and what should happen next."
              description="The UI is intentionally operational: status, source, reason, handoff, and audit context stay visible."
            />
            <NeuralIntakeMap />
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {workflow.map(([title, description], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.62, ease, delay: index * 0.06 }}
                className="grid gap-5 py-7 sm:grid-cols-[110px_1fr]"
              >
                <p className="font-mono text-xs uppercase text-[#36e6d5]">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <div>
                  <h3 className="text-2xl font-semibold">{title}</h3>
                  <p className="mt-2 max-w-[680px] text-sm leading-7 text-white/54">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="signal" className="relative border-t border-white/10 bg-[#071012] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-32">
          <div className="rounded-[34px] border border-white/10 bg-[#0b1518] p-6 sm:p-8 lg:p-10">
            <p className="font-mono text-xs uppercase text-[#36e6d5]">Operational surface</p>
            <h2 className="mt-6 max-w-[780px] text-4xl font-semibold leading-[1.04] sm:text-5xl lg:text-6xl">
              The patient gets a calm path. The clinic gets signal-rich control.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Front door", "A focused intake surface patients can complete without learning clinical software."],
                ["Command center", "A staff workspace for queue review, conversation context, appointments, and policy state."],
                ["Audit trail", "A traceable record of handoffs, status changes, appointment requests, and decisions."],
              ].map(([title, description]) => (
                <div key={title} className="border-t border-white/10 pt-5">
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/54">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[34px] border border-[#36e6d5]/18 bg-[#061d1c] p-6 sm:p-8 lg:p-10">
            <p className="font-mono text-xs uppercase text-[#a8fff6]">Live signal stream</p>
            <div className="mt-8 space-y-3">
              {signalRows.map(([label, event, state], index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease, delay: index * 0.06 }}
                  className="grid grid-cols-[1fr_auto] gap-4 rounded-[18px] border border-white/10 bg-white/[0.035] p-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{label}</h3>
                    <p className="mt-1 font-mono text-[11px] text-white/45">{event}</p>
                  </div>
                  <span className="self-start rounded-[999px] border border-[#36e6d5]/20 bg-[#36e6d5]/10 px-2.5 py-1 font-mono text-[10px] uppercase text-[#a8fff6]">
                    {state}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="border-t border-white/10 bg-[#05090b] text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 rounded-[34px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
            <div>
              <p className="font-mono text-xs uppercase text-[#36e6d5]">Safety boundary</p>
              <h2 className="mt-5 max-w-[880px] text-4xl font-semibold leading-[1.04] sm:text-5xl">
                Administrative AI for intake, routing, scheduling, and review. Not diagnosis.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="#intake"
                className="inline-flex justify-center rounded-[14px] bg-[#36e6d5] px-5 py-3.5 text-sm font-semibold text-[#031311] transition hover:bg-white active:scale-[0.98]"
              >
                Start intake
              </a>
              <Link
                href="/admin"
                className="inline-flex justify-center rounded-[14px] border border-white/15 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] active:scale-[0.98]"
              >
                Staff console
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AmbientField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#05090b]" />
      <div className="absolute inset-0 bg-[url('/medbay-bg.png')] bg-cover bg-center opacity-[0.11] mix-blend-screen" />
      <motion.div
        className="absolute left-[54%] top-[-18%] h-[44rem] w-[44rem] rounded-full bg-[#36e6d5]/12 blur-3xl"
        animate={{ x: [0, -42, 26, 0], y: [0, 34, -18, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:92px_92px] opacity-[0.12]" />
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_72%_18%,rgba(54,230,213,0.20),transparent_34%),linear-gradient(180deg,rgba(5,9,11,0.18),#05090b_92%)]" />
    </div>
  );
}

function WorkspaceHeader() {
  return (
    <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <motion.span
          className="h-2.5 w-2.5 rounded-full bg-[#36e6d5]"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <span className="font-mono text-[11px] uppercase text-white/42">live intake workspace</span>
    </div>
  );
}

function QueuePanel() {
  return (
    <div className="h-full">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase text-[#a8fff6]">Operations</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">Triage queue</h2>
        </div>
        <motion.div
          className="rounded-[12px] border border-[#36e6d5]/20 bg-[#36e6d5]/10 px-3 py-2 font-mono text-xs text-[#a8fff6]"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          12 open
        </motion.div>
      </div>

      <div className="mt-6 space-y-3">
        {operatingRows.map((row, index) => (
          <motion.div
            key={row.name}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.24 + index * 0.08 }}
            className="rounded-[20px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#36e6d5]/30 hover:bg-white/[0.065]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{row.name}</p>
                <p className="mt-1 text-xs leading-5 text-white/42">{row.reason}</p>
              </div>
              <StatusPill value={row.risk} />
            </div>
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-white/42">{row.status}</span>
                <span className="font-mono text-[10px] text-[#a8fff6]">{row.score}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="block h-full rounded-full bg-[#36e6d5]"
                  initial={{ width: 0 }}
                  animate={{ width: `${row.score}%` }}
                  transition={{ duration: 1.2, ease, delay: 0.4 + index * 0.12 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function NeuralIntakeMap() {
  return (
    <div className="mt-10 overflow-hidden rounded-[30px] border border-white/10 bg-[#0b1518] p-5">
      <svg viewBox="0 0 560 240" className="h-auto w-full" role="img" aria-label="Animated intake routing map">
        <defs>
          <linearGradient id="routeGlow" x1="0" x2="1">
            <stop offset="0%" stopColor="#36e6d5" stopOpacity="0.1" />
            <stop offset="48%" stopColor="#36e6d5" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#36e6d5" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[
          "M48 122 C138 20 214 36 282 116 C342 188 420 204 512 90",
          "M48 122 C146 162 205 202 302 154 C378 116 430 124 512 154",
          "M48 122 C150 102 206 70 290 82 C386 96 436 42 512 54",
        ].map((d, index) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="url(#routeGlow)"
            strokeWidth="1.4"
            strokeDasharray="10 14"
            animate={{ strokeDashoffset: [0, -48] }}
            transition={{ duration: 3.2 + index * 0.7, repeat: Infinity, ease: "linear" }}
          />
        ))}
        {[
          [48, 122, "MSG"],
          [282, 116, "CASE"],
          [512, 90, "REVIEW"],
          [512, 154, "SLOT"],
          [512, 54, "AUDIT"],
        ].map(([x, y, label], index) => (
          <g key={String(label)}>
            <motion.circle
              cx={Number(x)}
              cy={Number(y)}
              r="18"
              fill="#36e6d5"
              fillOpacity="0.08"
              stroke="#36e6d5"
              strokeOpacity="0.38"
              animate={{ scale: [1, 1.15, 1], opacity: [0.85, 0.5, 0.85] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.18 }}
            />
            <text
              x={Number(x)}
              y={Number(y) + 4}
              textAnchor="middle"
              className="fill-[#a8fff6] font-mono text-[10px] uppercase"
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-[780px]">
      <p className="font-mono text-xs uppercase text-[#36e6d5]">{eyebrow}</p>
      <h2 className="mt-5 text-4xl font-semibold leading-[1.04] text-white sm:text-5xl">{title}</h2>
      <p className="mt-5 max-w-[640px] text-base leading-8 text-white/58">{description}</p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const className =
    value === "urgent"
      ? "border-[#f2b466]/30 bg-[#f2b466]/10 text-[#ffd19a]"
      : value === "clear"
        ? "border-[#36e6d5]/30 bg-[#36e6d5]/10 text-[#a8fff6]"
        : "border-white/15 bg-white/[0.06] text-white/50";

  return (
    <span className={`rounded-[999px] border px-2.5 py-1 font-mono text-[10px] uppercase ${className}`}>
      {value}
    </span>
  );
}
