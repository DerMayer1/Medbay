"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChatWidget } from "@/components/public/ChatWidget";

const ease = [0.16, 1, 0.3, 1] as const;

const navItems = [
  ["Products", "#products"],
  ["Workflow", "#workflow"],
  ["Console", "#console"],
  ["Safety", "#safety"],
];

const productCards = [
  ["White-label intake", "A patient-facing intake path that feels simple while the backend keeps the case structured."],
  ["From message to handoff", "Conversation, policy decision, appointment request, and review state are connected."],
  ["Safety before response", "Clinical requests and urgent language route before the assistant can improvise."],
  ["Portfolio demo mode", "Demo data loads immediately so the product can be reviewed without service latency."],
];

export default function Home() {
  return (
    <main className="public-dark min-h-screen overflow-x-clip bg-[#fafafa] text-[#262626]">
      <Hero />
      <ProductSection />
      <WorkflowSection />
      <LiveIntakeSection />
      <TrustSection />
      <ConsoleSection />
      <SafetySection />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100dvh] bg-[linear-gradient(180deg,#dcebff_0%,#f7fbff_41%,#fafafa_66%)]">
      <Header />
      <HeroAtmosphere />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-14 pt-5 sm:px-8">
        <HeroChatShowcase />

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.82, ease, delay: 0.12 }}
          className="mx-auto mt-12 max-w-[780px] text-center"
        >
          <span className="inline-flex rounded-full bg-[#f8eadb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b28f73]">
            Private beta
          </span>
          <h1 className="mt-5 text-balance text-[4rem] font-normal leading-[1.02] tracking-[-0.07em] text-[#262626] sm:text-[5rem] lg:text-[5.5rem]">
            The Platform for Clinical Intake
          </h1>
          <p className="mx-auto mt-5 max-w-[700px] text-xl leading-8 text-[#737373]">
            MedBay gives clinics a digital front door for patient intake, AI extraction, safety routing, appointment
            handoff, and operational review.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/admin/login" className="group inline-flex h-10 items-center gap-3 rounded-[9px] bg-[#3b82f6] px-4 text-sm font-bold text-white ring-1 ring-[#60a5fa] transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2563eb] active:scale-[0.98]">
              Open demo
              <span className="grid h-6 w-6 place-items-center rounded-md bg-white/16 transition group-hover:translate-x-0.5">›</span>
            </Link>
            <a href="#products" className="inline-flex h-10 items-center rounded-[9px] px-4 text-sm font-medium text-[#262626] transition hover:bg-white">
              Explore platform
            </a>
          </div>
        </motion.div>
        <HeroProofRail />
      </div>
    </section>
  );
}

function HeroProofRail() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.78, ease, delay: 0.24 }}
      className="mx-auto mt-12 grid max-w-[1120px] overflow-hidden rounded-[28px] border border-[#e5e5e5] bg-white/72 p-3 shadow-[0_32px_100px_-86px_rgba(37,99,235,0.8)] backdrop-blur-xl md:grid-cols-[0.42fr_0.58fr]"
    >
      <div className="rounded-[22px] bg-[#fafafa] p-6 ring-1 ring-[#ededed]">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">What happens next</p>
        <h2 className="mt-4 max-w-[360px] text-[1.65rem] font-medium leading-[1.12] tracking-[-0.055em] text-[#262626]">
          One patient message becomes a staff-ready case.
        </h2>
        <p className="mt-4 max-w-[420px] text-sm leading-7 text-[#737373]">
          The first interaction is not the product endpoint. MedBay parses the request, checks policy boundaries, and
          prepares the clinic team to act.
        </p>
        <a href="#products" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#262626]">
          See the lifecycle <span className="text-xl text-[#3b82f6]">›</span>
        </a>
      </div>

      <div className="relative min-h-[260px] overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_50%_0%,#eef6ff_0%,#fbfbfb_58%,#ffffff_100%)] p-5 ring-1 ring-[#ededed]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 650 260" aria-hidden="true">
          <motion.path
            d="M90 134 C185 78 262 80 330 132 C410 192 492 180 566 118"
            fill="none"
            stroke="#bfdbfe"
            strokeWidth="12"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease, delay: 0.4 }}
          />
          <motion.path
            d="M90 134 C185 78 262 80 330 132 C410 192 492 180 566 118"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray="8 10"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease, delay: 0.5 }}
          />
        </svg>

        <motion.div
          className="absolute left-[11%] top-[45%] z-10 h-7 w-7 rounded-full bg-[#3b82f6] ring-4 ring-white shadow-[0_18px_38px_-22px_rgba(37,99,235,0.95)]"
          animate={{ x: [0, 220, 408, 494], y: [0, -44, 10, -30], scale: [1, 1.12, 1.08, 1] }}
          transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-20 grid h-full gap-3 md:grid-cols-3 md:items-center">
          {[
            ["Message", "I need an appointment and have a lab question."],
            ["Triage", "Intent: scheduling · Policy: human review"],
            ["Handoff", "Case ready with reason and next action."],
          ].map(([title, text], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease, delay: 0.45 + index * 0.1 }}
              className={`rounded-[20px] border border-[#e5e5e5] bg-white/90 p-4 shadow-[0_20px_60px_-52px_rgba(15,23,42,0.6)] ${index === 1 ? "md:mt-16" : index === 2 ? "md:mb-10" : "md:mb-8"}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">{title}</p>
              <p className="mt-3 text-xs leading-5 text-[#525252]">{text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 mx-auto flex h-[66px] max-w-[1048px] items-center justify-between px-4 pt-2">
      <Link href="/" className="flex items-center">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#93c5fd] text-[11px] font-black text-white">
          ME
        </span>
        <span className="-ml-2 grid h-8 w-8 place-items-center rounded-full bg-[#2563eb] text-[11px] font-black text-white">
          DB
        </span>
      </Link>

      <nav className="hidden h-12 items-center gap-1 rounded-2xl bg-white px-3 text-xs font-medium text-[#262626] ring-1 ring-[#e5e5e5] md:flex">
        {navItems.map(([label, href]) => (
          <a key={href} href={href} className="rounded-xl px-4 py-2 transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#f5f5f5]">
            {label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/admin/login" className="hidden h-9 items-center rounded-[9px] bg-white px-4 text-xs font-semibold text-[#262626] ring-1 ring-[#e5e5e5] sm:inline-flex">
          Sign In
        </Link>
        <a href="#workflow" className="group inline-flex h-9 items-center gap-2 rounded-[9px] bg-[#3b82f6] px-3.5 text-xs font-bold text-white ring-1 ring-[#60a5fa]">
          Get started
          <span className="grid h-5 w-5 place-items-center rounded-md bg-white/15">›</span>
        </a>
      </div>
    </header>
  );
}

function HeroAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
      <motion.div
        className="absolute left-[-8%] top-24 h-36 w-[34rem] rounded-full bg-white/40 blur-md"
        animate={{ x: [0, 26, 0], opacity: [0.58, 0.72, 0.58] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[6%] top-16 h-28 w-[28rem] rounded-full bg-white/50 blur-lg"
        animate={{ x: [0, -32, 0], opacity: [0.5, 0.78, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(250,250,250,0),#fafafa_82%)]" />
    </div>
  );
}

function HeroChatShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease }}
      className="relative mx-auto mt-4 max-w-[1160px]"
    >
      <motion.div
        aria-hidden="true"
        className="absolute -left-6 top-16 hidden w-[280px] rounded-[28px] border border-white/80 bg-white/82 p-4 shadow-[0_28px_90px_-72px_rgba(37,99,235,0.78)] backdrop-blur-xl lg:block"
        animate={{ y: [0, -12, 0], rotate: [-1.5, -0.2, -1.5] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Live routing</p>
        <div className="mt-4 space-y-3">
          {[
            ["Clinical request", "Human review"],
            ["Scheduling", "Appointment queue"],
            ["Admin question", "Knowledge answer"],
          ].map(([label, value], index) => (
            <motion.div
              key={label}
              className="rounded-2xl border border-[#e5e5e5] bg-white p-3"
              animate={{ x: [0, index === 1 ? 8 : -6, 0] }}
              transition={{ duration: 5 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#262626]">{label}</span>
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              </div>
              <p className="mt-2 text-[11px] text-[#737373]">{value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute -right-8 top-24 hidden w-[300px] rounded-[30px] border border-white/80 bg-[#f8fbff]/86 p-4 shadow-[0_30px_100px_-72px_rgba(37,99,235,0.86)] backdrop-blur-xl lg:block"
        animate={{ y: [0, 14, 0], rotate: [1.4, 0.2, 1.4] }}
        transition={{ duration: 8.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Case signal</p>
          <span className="rounded-full bg-[#dbeafe] px-2 py-1 text-[10px] font-semibold text-[#2563eb]">safe</span>
        </div>
        <div className="mt-5 h-28 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white p-4">
          <motion.div
            className="h-full rounded-xl bg-[linear-gradient(180deg,#dbeafe,#eff6ff)]"
            animate={{ clipPath: ["inset(68% 0 0 0 round 12px)", "inset(24% 0 0 0 round 12px)", "inset(54% 0 0 0 round 12px)"] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-[#737373]">
          <span className="rounded-xl bg-white px-2 py-2 ring-1 ring-[#e5e5e5]">intake</span>
          <span className="rounded-xl bg-white px-2 py-2 ring-1 ring-[#e5e5e5]">triage</span>
          <span className="rounded-xl bg-white px-2 py-2 ring-1 ring-[#e5e5e5]">handoff</span>
        </div>
      </motion.div>

      <div id="intake-demo" className="relative mx-auto scroll-mt-24 max-w-[760px] rounded-[38px] border border-white/80 bg-white/50 p-2 shadow-[0_52px_120px_-86px_rgba(37,99,235,0.9)] backdrop-blur-xl">
        <div className="absolute inset-x-16 -top-6 h-12 rounded-full bg-white/50 blur-2xl" />
        <div className="relative overflow-hidden rounded-[31px] border border-[#e5e5e5] bg-[#ffffff] p-2">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.14),rgba(255,255,255,0)_68%)]" />
          <div className="relative">
            <ChatWidget />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProductSection() {
  return (
    <section id="products" className="relative bg-[#fafafa] pt-16 pb-16 lg:pt-20 lg:pb-20">
      <div className="mx-auto grid max-w-[1460px] gap-16 px-5 sm:px-8 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.72, ease }}>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-2.5 w-5 rounded-sm bg-[#3b82f6]" />
            <span className="text-sm text-[#262626]">Redefining intake operations</span>
          </div>
          <h2 className="max-w-[440px] text-[3.5rem] font-medium leading-[1.08] tracking-[-0.065em] text-[#262626]">
            Clinical intake meets operations.
          </h2>
          <p className="mt-7 max-w-[520px] text-base leading-8 text-[#737373]">
            The patient sees one simple path. The clinic receives structured fields, safety decisions, scheduling state,
            and review context.
          </p>
          <a href="#workflow" className="group mt-7 inline-flex h-12 items-center gap-3 rounded-[10px] bg-[#3b82f6] px-4 text-sm font-bold text-white">
            Contact flow
            <span className="grid h-7 w-7 place-items-center rounded-md bg-white/15 transition group-hover:translate-x-0.5">›</span>
          </a>
        </motion.div>
        <CaseLifecycleMock />
      </div>
      <div className="mx-auto mt-20 grid max-w-[1168px] gap-5 px-5 sm:px-8 md:grid-cols-2">
        {productCards.map(([title, text], index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.62, ease, delay: index * 0.04 }}
            className="border-t border-[#e5e5e5] py-8"
          >
            <h3 className="text-base font-medium text-[#262626]">{title}</h3>
            <p className="mt-3 max-w-[520px] text-sm leading-7 text-[#737373]">{text}</p>
          </motion.article>
        ))}
      </div>
      <SystemExplanationBand />
    </section>
  );
}

function SystemExplanationBand() {
  const dataLayers = [
    ["message_received", "user message saved with audit context"],
    ["policy_evaluated", "decision, severity, and risk flags recorded"],
    ["intake_extracted", "fields, triage, and case status persisted"],
    ["handoff_requested", "staff notification sent when policy requires it"],
  ];

  const editorTabs = [
    {
      label: "TypeScript",
      file: "handle-patient-message.ts",
      language: "ts",
      badge: "application",
      code: [
        "export async function handlePatientMessage(rawInput, dependencies) {",
        "  const input = handlePatientMessageSchema.parse(rawInput);",
        "  const conversationId = input.conversationId || crypto.randomUUID();",
        "",
        "  await dependencies.conversationRepository.saveMessage({",
        "    conversationId,",
        "    role: \"user\",",
        "    content: input.message,",
        "  });",
        "",
        "  const policy = evaluateIntakePolicy({",
        "    message: input.message,",
        "    extractedFields: mergedFields,",
        "    wantsScheduling: wantsScheduling(input.message),",
        "  });",
        "",
        "  const nextStatus = decideNextIntakeStatus({ policy, completeness });",
        "  const updatedCase = await dependencies.caseRepository.save({",
        "    ...intakeCase,",
        "    status,",
        "    fields: mergedFields,",
        "    handoffRequired: policy.handoffRequired,",
        "  });",
        "}",
      ],
    },
    {
      label: "HTTP",
      file: "api/chat/route.ts",
      language: "http",
      badge: "route",
      code: [
        "POST /api/chat",
        "Content-Type: application/json",
        "",
        "{",
        "  \"conversationId\": \"uuid\",",
        "  \"message\": \"I need to schedule and ask about labs\",",
        "  \"metadata\": {",
        "    \"source\": \"landing_page\",",
        "    \"page\": \"/\"",
        "  }",
        "}",
        "",
        "-> handlePatientMessage(payload, createIntakeUseCaseDependencies())",
      ],
    },
    {
      label: "Policy",
      file: "policy-engine.ts",
      language: "ts",
      badge: "domain",
      code: [
        "export function evaluateIntakePolicy(input) {",
        "  if (containsEmergencyLanguage(input.message)) {",
        "    return {",
        "      decision: \"block\",",
        "      severity: \"critical\",",
        "      handoffRequired: true,",
        "      reason: \"emergency_language\",",
        "    };",
        "  }",
        "",
        "  if (containsClinicalQuestion(input.message)) {",
        "    return {",
        "      decision: \"escalate\",",
        "      severity: \"medium\",",
        "      handoffRequired: true,",
        "      reason: \"clinical_question\",",
        "    };",
        "  }",
        "}",
      ],
    },
    {
      label: "JSON",
      file: "chat-response.json",
      language: "json",
      badge: "contract",
      code: [
        "{",
        "  \"reply\": \"I can route this to the clinic team.\",",
        "  \"conversationId\": \"uuid\",",
        "  \"intakeCaseId\": \"uuid\",",
        "  \"caseStatus\": \"needs_human_review\",",
        "  \"policy\": {",
        "    \"decision\": \"escalate\",",
        "    \"severity\": \"medium\",",
        "    \"handoffRequired\": true",
        "  },",
        "  \"persistenceAvailable\": true",
        "}",
      ],
    },
  ];
  const [activeEditor, setActiveEditor] = useState(0);
  const currentEditor = editorTabs[activeEditor];

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.78, ease }}
      className="relative mx-auto mt-20 max-w-[1230px] px-5 sm:px-8"
    >
      <div className="pointer-events-none absolute inset-x-[-10%] top-[-140px] h-[520px] rounded-full bg-[radial-gradient(circle_at_50%_25%,rgba(59,130,246,0.28),rgba(147,197,253,0.12)_40%,rgba(255,255,255,0)_72%)] blur-2xl" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[6%] top-48 h-72 w-72 rounded-full bg-[#3b82f6]/16 blur-3xl"
        animate={{ scale: [1, 1.18, 1], x: [0, -24, 0], opacity: [0.45, 0.86, 0.45] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative grid gap-10 lg:grid-cols-[0.48fr_0.52fr] lg:items-start">
        <div>
          <h2 className="max-w-[520px] text-[3.1rem] font-medium leading-[0.96] tracking-[-0.075em] text-[#262626] sm:text-[4.65rem]">
            Headless intake flexibility
          </h2>
          <p className="mt-7 max-w-[460px] text-base leading-8 text-[#737373]">
            MedBay separates the patient experience from the operational engine behind it. One request can become an
            intake case, policy decision, scheduling handoff, and staff review record without adding another loose chat
            transcript.
          </p>
          <a href="#workflow" className="group mt-10 inline-flex items-center gap-3 text-sm font-bold text-[#262626]">
            See the operating layer
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#3b82f6] text-white transition group-hover:translate-x-0.5">
              ›
            </span>
          </a>
        </div>

        <div className="grid gap-8 pt-2 sm:grid-cols-3">
          {[
            ["Front door", "Patient-facing intake stays simple and branded."],
            ["Policy core", "Clinical risk routes before the assistant responds."],
            ["Staff console", "Every handoff lands with context and next action."],
          ].map(([title, text], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08, ease }}
              className="border-t border-[#d6e6ff] pt-5"
            >
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-[#262626]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#737373]">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative mt-20 grid gap-8 lg:grid-cols-[0.48fr_0.52fr]">
        <div className="relative min-h-[520px] overflow-hidden rounded-[34px] border border-[#dbeafe] bg-[linear-gradient(180deg,#ffffff,#eff6ff_58%,#dbeafe)] shadow-[0_42px_130px_-82px_rgba(37,99,235,0.95)]">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.2),rgba(255,255,255,0)_68%)]" />
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[-90px] left-[-120px] h-[280px] w-[760px] rounded-[50%] bg-[#3b82f6]/18 blur-3xl"
            animate={{ x: [0, 38, 0], opacity: [0.45, 0.78, 0.45] }}
            transition={{ duration: 7.4, repeat: Infinity, ease: "easeInOut" }}
          />

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 520" aria-hidden="true">
            <motion.path
              d="M70 344 C168 252 226 438 316 308 C380 216 444 260 510 178"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeDasharray="7 10"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.82 }}
              viewport={{ once: true }}
              transition={{ duration: 1.35, ease }}
            />
          </svg>

          <div className="absolute inset-x-10 top-10 z-10 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3b82f6]">Audit event stack</p>
            <span className="rounded-full bg-white/72 px-3 py-1 text-[10px] font-bold text-[#2563eb] ring-1 ring-[#bfdbfe]">
              real flow
            </span>
          </div>

          <div className="absolute bottom-14 left-[-18px] right-[-74px] h-[360px] [perspective:900px]">
            {dataLayers.map(([label, text], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 60, rotateX: 58, rotateZ: -8 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 58, rotateZ: -8 }}
                viewport={{ once: true }}
                animate={{ y: [0, index % 2 === 0 ? -10 : 10, 0] }}
                transition={{
                  opacity: { duration: 0.5, delay: index * 0.08 },
                  y: { duration: 6.5 + index * 0.45, repeat: Infinity, ease: "easeInOut" },
                  rotateX: { duration: 0.5 },
                  rotateZ: { duration: 0.5 },
                }}
                whileHover={{ y: -18, rotateX: 50, scale: 1.02 }}
                className="absolute h-[176px] cursor-default rounded-[22px] border border-[#3b82f6]/72 bg-[linear-gradient(180deg,rgba(147,197,253,0.72),rgba(37,99,235,0.48))] p-5 text-white shadow-[0_28px_80px_-48px_rgba(37,99,235,0.95)] backdrop-blur-md"
                style={{
                  left: `${index * 68}px`,
                  top: `${126 - index * 38}px`,
                  width: `${320 + index * 22}px`,
                  zIndex: index + 1,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/78">{label}</p>
                <p className="mt-5 max-w-[260px] text-sm font-medium leading-6 text-white">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[34px] border border-[#e5e5e5] bg-[#fbfbfb] shadow-[0_42px_130px_-90px_rgba(37,99,235,0.78)]">
          <div className="flex h-14 items-center justify-between border-b border-[#e5e5e5] bg-white px-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#93c5fd]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#737373]">
              <span>{currentEditor.file}</span>
              <span className="rounded-lg bg-[#eff6ff] px-2 py-1 text-[#2563eb]">{currentEditor.badge}</span>
            </div>
          </div>

          <div className="flex h-12 items-center gap-2 overflow-x-auto border-b border-[#e5e5e5] bg-[#fafafa] px-4">
            {editorTabs.map((tab, index) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveEditor(index)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  activeEditor === index
                    ? "bg-[#3b82f6] text-white shadow-[0_10px_24px_-18px_rgba(37,99,235,0.8)]"
                    : "text-[#737373] hover:bg-[#eff6ff] hover:text-[#262626]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative h-[calc(100%-6.5rem)] overflow-hidden px-6 py-5 font-mono text-[12px] leading-6">
            <motion.div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(59,130,246,0.14),rgba(59,130,246,0))]"
              animate={{ y: [-80, 430, -80] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              key={currentEditor.file}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="relative"
            >
              <div className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">
                <span>{currentEditor.language}</span>
                <span>{currentEditor.code.length} lines</span>
              </div>
              <div className="space-y-0.5">
                {currentEditor.code.map((line, index) => {
                  const trimmed = line.trim();
                  const keyword = trimmed.split(/\s+/)[0] || "";
                  const isSyntax =
                    ["await", "const", "if", "return", "export", "POST", "{", "}", "->"].includes(keyword) ||
                    trimmed.startsWith("\"");
                  return (
                    <motion.div
                      key={`${currentEditor.file}-${index}-${line}`}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.018 }}
                      whileHover={{ x: 6 }}
                      className="group -mx-3 flex min-h-6 gap-4 rounded-lg px-3 transition-colors hover:bg-[#eff6ff]"
                    >
                      <span className="w-6 select-none text-right text-[#a3a3a3]">{index + 1}</span>
                      <pre className="min-w-0 flex-1 overflow-visible whitespace-pre-wrap break-words text-[#262626]">
                        {line ? (
                          <>
                            <span className={isSyntax ? "text-[#ef4444] transition-colors group-hover:text-[#2563eb]" : ""}>
                              {line.slice(0, line.indexOf(keyword) + keyword.length)}
                            </span>
                            {line.slice(line.indexOf(keyword) + keyword.length)}
                          </>
                        ) : (
                          " "
                        )}
                      </pre>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,rgba(251,251,251,0),#fbfbfb)]" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function CaseLifecycleMock() {
  const stages = [
    ["01", "Patient message", "Request enters the intake"],
    ["02", "Extract fields", "Intent and risk become structured"],
    ["03", "Route safely", "Clinical language is held for staff"],
    ["04", "Staff acts", "Scheduling and review are ready"],
  ];
  const extractedFields = [
    ["intent", "appointment"],
    ["topic", "lab question"],
    ["policy", "human review"],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease }}
      className="relative min-h-[590px] overflow-hidden rounded-[34px] border border-[#e5e5e5] bg-white p-3 shadow-[0_34px_90px_-72px_rgba(37,99,235,0.8)]"
    >
      <div className="relative overflow-hidden rounded-[26px] border border-[#ededed] bg-[#fcfcfc] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg text-[#262626]">Intake case lifecycle</p>
            <p className="text-xs text-[#a3a3a3]">Northstar Clinic · live routing preview</p>
          </div>
          <span className="shrink-0 rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb]">
            case #MB-2407
          </span>
        </div>

        <div className="mt-5 grid gap-4 rounded-[20px] border border-[#e5e5e5] bg-white px-4 py-4 md:grid-cols-[0.56fr_0.44fr] md:items-center">
          <p className="max-w-[520px] text-sm leading-7 text-[#525252]">
            This preview follows a single patient request as MedBay turns free text into a structured case. The assistant
            can support administrative intake, but clinical interpretation is held for staff before any response is sent.
          </p>
          <div className="grid gap-2 text-xs text-[#737373] sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-2xl bg-[#fafafa] px-3 py-2 ring-1 ring-[#ededed]">Capture the patient’s intent</div>
            <div className="rounded-2xl bg-[#fafafa] px-3 py-2 ring-1 ring-[#ededed]">Apply safety routing</div>
            <div className="rounded-2xl bg-[#fafafa] px-3 py-2 ring-1 ring-[#ededed]">Prepare the staff handoff</div>
          </div>
        </div>

        <div className="mt-5 grid gap-2 rounded-[18px] border border-[#e5e5e5] bg-white p-2 md:grid-cols-4">
          {stages.map(([number, title, text], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease, delay: index * 0.08 }}
              className="rounded-[14px] bg-[#fafafa] px-3 py-3 ring-1 ring-[#ededed]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">{number}</p>
              <p className="mt-2 text-sm font-medium text-[#262626]">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#737373]">{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-5 min-h-[430px] overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-[radial-gradient(circle_at_50%_15%,#eef6ff_0%,#fbfbfb_42%,#f7f7f7_100%)] p-5">
          <motion.div
            aria-hidden="true"
            className="absolute left-[13%] top-[42%] z-[5] h-8 w-8 rounded-full bg-[#3b82f6] shadow-[0_18px_40px_-24px_rgba(37,99,235,0.95)] ring-4 ring-white"
            animate={{ x: [0, 240, 482, 610], y: [0, -12, 16, -4], scale: [1, 1.08, 1.08, 1] }}
            transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
          />

          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 840 430" aria-hidden="true">
            <motion.path
              d="M150 205 C255 145 330 145 416 205 C505 268 585 270 700 202"
              fill="none"
              stroke="#93c5fd"
              strokeWidth="3"
              strokeDasharray="8 10"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease }}
            />
            <motion.path
              d="M150 235 C255 285 340 286 418 236 C510 180 585 168 700 226"
              fill="none"
              stroke="#dbeafe"
              strokeWidth="10"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease, delay: 0.18 }}
            />
          </svg>

          <div className="relative z-10 grid h-full gap-5 lg:grid-cols-[0.32fr_0.32fr_0.36fr]">
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="self-start rounded-[24px] border border-[#e5e5e5] bg-white p-4 shadow-[0_24px_80px_-68px_rgba(15,23,42,0.7)]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Patient message</p>
              <div className="mt-4 rounded-2xl border border-[#ededed] bg-[#fafafa] p-4 text-sm leading-6 text-[#262626]">
                I need to schedule an appointment and ask about recent lab results.
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-[#737373]">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                Received from landing intake
              </div>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.16 }}
              className="self-center rounded-[24px] border border-[#bfdbfe] bg-white p-4 shadow-[0_24px_80px_-68px_rgba(37,99,235,0.76)]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Extracted context</p>
              <div className="mt-4 space-y-2">
                {extractedFields.map(([label, value], index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, ease, delay: 0.32 + index * 0.1 }}
                    className="flex items-center justify-between rounded-2xl border border-[#ededed] bg-[#fafafa] px-3 py-2 text-xs"
                  >
                    <span className="text-[#737373]">{label}</span>
                    <span className="font-semibold text-[#262626]">{value}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#eff6ff] px-3 py-3 text-xs leading-5 text-[#2563eb] ring-1 ring-[#bfdbfe]">
                Safety rule matched: clinical interpretation should route to staff.
              </div>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.28 }}
              className="self-end rounded-[26px] border border-[#e5e5e5] bg-white p-4 shadow-[0_28px_86px_-70px_rgba(15,23,42,0.75)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Staff handoff</p>
                  <h3 className="mt-2 text-xl font-medium tracking-[-0.04em] text-[#262626]">Ready for review</h3>
                </div>
                <motion.span
                  className="rounded-full bg-[#dbeafe] px-3 py-1 text-[10px] font-bold text-[#2563eb]"
                  animate={{ opacity: [0.68, 1, 0.68] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  queued
                </motion.span>
              </div>
              <div className="mt-5 space-y-2 text-xs text-[#737373]">
                <div className="rounded-2xl border border-[#ededed] bg-[#fafafa] p-3">Next: offer virtual scheduling slots</div>
                <div className="rounded-2xl border border-[#ededed] bg-[#fafafa] p-3">Reason: lab interpretation request</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[#3b82f6] px-4 py-3 text-center text-xs font-bold text-white">
                  Open case
                </div>
                <div className="rounded-2xl border border-[#e5e5e5] bg-white px-4 py-3 text-center text-xs font-semibold text-[#525252]">
                  Book slot
                </div>
              </div>
            </motion.article>
          </div>

          <div className="absolute inset-x-5 bottom-5 rounded-[18px] border border-[#e5e5e5] bg-white/88 p-2 backdrop-blur">
            <div className="grid grid-cols-4 gap-2">
              {["message", "extract", "safety", "handoff"].map((step, index) => (
                <div key={step} className="rounded-xl bg-[#fafafa] px-3 py-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e5efff]">
                    <motion.div
                      className="h-full rounded-full bg-[#3b82f6]"
                      animate={{ width: index === 0 ? ["35%", "100%", "100%"] : index === 1 ? ["0%", "100%", "100%"] : index === 2 ? ["0%", "70%", "100%"] : ["0%", "45%", "100%"] }}
                      transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function WorkflowSection() {
  const workflowSteps = [
    ["01", "Raw message", "Patient asks in natural language, with scheduling and lab context mixed together."],
    ["02", "Case record", "MedBay turns the transcript into stable fields that the clinic can inspect."],
    ["03", "Policy route", "Clinical interpretation is held before the assistant answers beyond its scope."],
    ["04", "Staff handoff", "The admin console opens with reason, next action, and original message attached."],
  ];

  return (
    <section id="workflow" className="relative overflow-hidden bg-[#fafafa] py-20">
      <div className="pointer-events-none absolute inset-x-0 top-10 h-[420px] bg-[radial-gradient(circle_at_42%_30%,rgba(59,130,246,0.18),rgba(255,255,255,0)_68%)]" />
      <div className="relative mx-auto grid max-w-[1460px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.58fr_0.42fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -42 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.78, ease }}
          className="overflow-hidden rounded-[34px] border border-[#dbeafe] bg-white p-3 shadow-[0_38px_120px_-88px_rgba(37,99,235,0.9)]"
        >
          <div className="relative h-[610px] overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_50%_12%,#eef6ff_0%,#fbfbfb_42%,#f7f7f7_100%)]">
            <IntakeFlowScene />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.72, ease }}
          className="pt-2 lg:pl-4"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="h-2.5 w-5 rounded-sm bg-[#3b82f6]" />
            <span className="text-sm text-[#262626]">Before and after intake conversion</span>
          </div>
          <h2 className="max-w-[760px] text-[2rem] font-normal leading-[1.18] tracking-[-0.055em] text-[#262626] sm:text-[2.75rem] lg:text-[3.15rem]">
            Patient intakes without the operational guesswork
          </h2>
          <p className="mt-6 max-w-[620px] text-sm leading-7 text-[#737373]">
            Instead of a hidden chat transcript, the page shows what changes: loose patient language becomes
            a structured, reviewable case for operations.
          </p>

          <div className="mt-8 space-y-3">
            {workflowSteps.map(([number, title, text], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08, ease }}
                whileHover={{ x: 8 }}
                className="group grid grid-cols-[48px_1fr] gap-4 rounded-[22px] border border-[#e5e5e5] bg-white px-4 py-4 transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eff6ff] text-[11px] font-bold text-[#2563eb] group-hover:bg-[#3b82f6] group-hover:text-white">
                  {number}
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.02em] text-[#262626]">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#737373]">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <a href="#console" className="mt-8 inline-flex items-center gap-3 text-sm font-bold text-[#262626]">
            See the staff console <span className="text-xl">›</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function LiveIntakeSection() {
  const capabilities = [
    ["Patient intake", "Guided chat, quick actions, safety routing, and persisted message history."],
    ["Admin operations", "Case queue, lead review, appointment handoff, and knowledge base management."],
    ["Production path", "Server-side secrets, managed Postgres, API routes, and adapter boundaries."],
  ];

  return (
    <section className="relative overflow-hidden border-y border-[#e5e5e5] bg-white py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_28%_18%,rgba(59,130,246,0.16),rgba(255,255,255,0)_62%)]" />
      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.52fr_0.48fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.72, ease }}
          className="overflow-hidden rounded-[34px] border border-[#dbeafe] bg-white p-4 shadow-[0_34px_100px_-74px_rgba(37,99,235,0.72)]"
        >
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.975 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-140px" }}
            transition={{ duration: 0.62, delay: 0.08, ease }}
            className="relative overflow-hidden rounded-[26px] border border-[#ededed] bg-[#fcfcfc]"
          >
            <div className="flex items-center justify-between border-b border-[#ededed] bg-white/88 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#93c5fd]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
              </div>
              <span className="font-mono text-xs text-[#737373]">medbay-production-map</span>
              <span className="rounded-md bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">ready</span>
            </div>

            <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
              <motion.div
                initial={{ opacity: 0, x: -22 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-140px" }}
                transition={{ duration: 0.52, delay: 0.24, ease }}
                className="border-b border-[#ededed] p-5 md:border-b-0 md:border-r"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">What is built</p>
                <div className="mt-5 space-y-3">
                  {capabilities.map(([title, text], index) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.34, delay: index * 0.08 }}
                      className="relative overflow-hidden rounded-[18px] border border-[#e5e5e5] bg-white p-4"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-1 bg-[#3b82f6]"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#262626]">{title}</p>
                        <span className="font-mono text-[10px] text-[#3b82f6]">0{index + 1}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#737373]">{text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 22 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-140px" }}
                transition={{ duration: 0.52, delay: 0.34, ease }}
                className="p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Production execution</p>
                <div className="mt-5 rounded-[22px] border border-[#e5e5e5] bg-white p-4">
                  <div className="grid gap-2 font-mono text-[11px] leading-6 text-[#525252]">
                    {[
                      ["env", "OPENAI_API_KEY server only"],
                      ["db", "Supabase Postgres for cases and admin data"],
                      ["api", "Next.js routes isolate browser from secrets"],
                      ["demo", "fallback keeps portfolio review instant"],
                    ].map(([key, value]) => (
                      <span
                        key={key}
                      >
                        <span className="text-[#2563eb]">{key}</span> {value}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">Runtime shape</p>
                  <p className="mt-3 text-sm leading-6 text-[#525252]">
                    The browser talks to MedBay API routes. The server evaluates policy, writes cases, and connects
                    clinic adapters without exposing production credentials.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["auth", "intake cases", "appointments", "knowledge", "handoff"].map((label) => (
                    <motion.span
                      key={label}
                      className="rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-[11px] text-[#525252]"
                      whileHover={{ y: -3, borderColor: "#bfdbfe", color: "#2563eb" }}
                    >
                      {label}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Project overview</p>
          <h2 className="mt-5 max-w-[560px] text-[3.25rem] font-medium leading-[1.05] tracking-[-0.065em]">
            What MedBay does, and how it would run in production.
          </h2>
          <p className="mt-6 max-w-[520px] text-base leading-8 text-[#737373]">
            The portfolio version keeps the demo fast, but the project is structured like a real clinic product:
            patient intake, operational review, scheduling handoff, knowledge management, and server-side integrations.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Demo-first loading", "Server-side API boundary", "Admin review console", "Production adapters"].map((label) => (
              <div key={label} className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 text-sm font-semibold text-[#262626]">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function IntakeFlowScene() {
  const extractedFields = [
    ["intent", "appointment request"],
    ["topic", "recent lab work"],
    ["risk", "clinical interpretation"],
    ["status", "needs staff review"],
  ];
  const tokenFlights = [
    { label: "intent", value: "appointment", top: 215, delay: 0 },
    { label: "topic", value: "lab work", top: 292, delay: 0.55 },
    { label: "policy", value: "human review", top: 369, delay: 1.1 },
  ];
  const auditEvents = [
    ["01", "message_received"],
    ["02", "fields_extracted"],
    ["03", "policy_hold"],
    ["04", "handoff_ready"],
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0))]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#bfdbfe]/70 blur-3xl" />
      <div className="absolute right-0 top-32 h-80 w-64 rounded-full bg-[#60a5fa]/20 blur-3xl" />

      <div className="absolute left-7 top-7 rounded-2xl border border-[#bfdbfe] bg-white/88 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2563eb] shadow-[0_18px_60px_-48px_rgba(37,99,235,0.82)]">
        Before / after
      </div>

      <div className="absolute inset-x-7 bottom-16 top-24 grid grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] gap-3">
        <motion.div
          initial={{ opacity: 0, x: -26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease }}
          className="relative overflow-hidden rounded-[30px] border border-[#e5e5e5] bg-white/90 p-4 shadow-[0_32px_90px_-72px_rgba(15,23,42,0.55)] backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">Before</p>
              <h3 className="mt-2 text-lg font-medium text-[#262626]">Raw patient chat</h3>
            </div>
            <span className="rounded-full bg-[#f5f5f5] px-3 py-1 text-[10px] font-semibold text-[#737373]">raw</span>
          </div>

          <div className="mt-4 space-y-2 text-[13px] leading-5">
            <div className="max-w-[92%] rounded-[22px] rounded-tl-md border border-[#ededed] bg-[#fafafa] px-4 py-2.5 text-[#262626]">
              I need to schedule an appointment and ask about my recent lab work.
            </div>
            <div className="ml-auto max-w-[76%] rounded-[22px] rounded-tr-md bg-[#eef6ff] px-4 py-2.5 text-[#1d4ed8]">
              I can help with scheduling. What would you like to review?
            </div>
            <div className="max-w-[88%] rounded-[22px] rounded-tl-md border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-[#9a3412]">
              Can you explain whether the result is normal?
            </div>
          </div>

          <div className="mt-3 rounded-[20px] border border-[#ededed] bg-white/88 p-2.5">
            <div className="flex items-center gap-2">
              <p className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">signals</p>
              <div className="flex min-w-0 flex-wrap gap-1.5">
              {["schedule", "lab work", "explain result"].map((label, index) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.34, delay: 0.16 + index * 0.08 }}
                  className="rounded-full border border-[#e5e5e5] bg-[#fafafa] px-2.5 py-1 text-[10px] text-[#525252]"
                >
                  {label}
                </motion.span>
              ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-y-8 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(191,219,254,0),rgba(59,130,246,0.55),rgba(191,219,254,0))]" />
          <motion.div
            aria-hidden="true"
            className="absolute h-44 w-44 rounded-full bg-[#3b82f6]/18 blur-2xl"
            animate={{ scale: [0.82, 1.18, 0.82], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative grid h-[150px] w-[92px] place-items-center rounded-[30px] border border-[#bfdbfe] bg-white/78 shadow-[0_32px_90px_-56px_rgba(37,99,235,0.9)] backdrop-blur-xl [transform-style:preserve-3d]"
            animate={{ rotateY: [0, -12, 0, 12, 0], y: [0, -8, 0] }}
            transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-3 rounded-[24px] border border-[#dbeafe] bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(255,255,255,0.72))]" />
            <motion.div
              className="absolute left-4 right-4 top-8 h-1 rounded-full bg-[#3b82f6]"
              animate={{ y: [0, 70, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2563eb]">MedBay</p>
              <p className="mt-2 text-[11px] font-semibold text-[#262626]">intake engine</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1, ease }}
          className="relative overflow-hidden rounded-[30px] border border-[#bfdbfe] bg-white/94 p-4 shadow-[0_34px_100px_-70px_rgba(37,99,235,0.82)] backdrop-blur"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2563eb]">After</p>
              <h3 className="mt-2 text-lg font-medium text-[#262626]">Structured intake case</h3>
            </div>
            <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-[10px] font-semibold text-[#2563eb]">
              review ready
            </span>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] p-3">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
              <span className="font-mono text-xs text-[#737373]">case_2048</span>
              <span className="text-[11px] font-semibold text-[#16a34a]">saved</span>
            </div>
            <div className="mt-3 space-y-2">
              {extractedFields.map(([label, value], index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  animate={{ backgroundColor: ["#ffffff", "#eff6ff", "#ffffff"] }}
                  transition={{
                    duration: 0.36,
                    delay: 0.28 + index * 0.16,
                    backgroundColor: { duration: 2.6, delay: index * 0.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="flex items-center justify-between rounded-2xl border border-[#ededed] bg-white px-3 py-2 text-xs"
                >
                  <span className="text-[#737373]">{label}</span>
                  <span className="max-w-[145px] truncate text-right font-semibold text-[#262626]">{value}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-2 rounded-[22px] border border-[#bfdbfe] bg-[#eff6ff] p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563eb]">Policy hold</span>
              <motion.span
                className="h-2 w-2 rounded-full bg-[#3b82f6]"
                animate={{ scale: [1, 1.8, 1], opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-[#525252]">
              Assistant pauses and sends the case to staff with context attached.
            </p>
          </div>
        </motion.div>
      </div>

      {tokenFlights.map(({ label, value, top, delay }) => (
        <motion.div
          key={label}
          className="absolute left-[34%] z-30 rounded-full border border-[#bfdbfe] bg-white px-3 py-2 text-[10px] font-semibold text-[#2563eb] shadow-[0_18px_48px_-34px_rgba(37,99,235,0.95)]"
          style={{ top }}
          animate={{
            x: [0, 88, 176, 268],
            y: [0, -8, 6, 0],
            opacity: [0, 1, 1, 0],
            scale: [0.92, 1, 1, 0.92],
          }}
          transition={{ duration: 4.8, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[#93c5fd]">{label}</span> {value}
        </motion.div>
      ))}

      <div className="absolute bottom-7 left-1/2 hidden w-[82%] -translate-x-1/2 grid-cols-4 gap-2 md:grid">
        {auditEvents.map(([number, event], index) => (
          <motion.div
            key={event}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.36, delay: 0.5 + index * 0.08 }}
            className="rounded-2xl border border-[#dbeafe] bg-white/82 px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#2563eb] backdrop-blur"
          >
            <span className="mr-2 text-[#93c5fd]">{number}</span>
            {event}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TrustSection() {
  const policyDecisions = [
    ["Allowed", "Scheduling, clinic information, intake collection, and knowledge-base answers.", "allow"],
    ["Clarify", "Missing contact details, vague intent, or low-confidence extraction.", "ask_clarifying_question"],
    ["Escalate", "Lab interpretation, medication questions, diagnosis language, or staff requests.", "needs_human_review"],
    ["Block", "Emergency red flags, unsafe medical advice, or urgent high-risk language.", "block"],
  ];

  return (
    <section className="relative overflow-hidden bg-white py-28">
      <div className="pointer-events-none absolute inset-x-0 top-12 h-[420px] bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.13),rgba(255,255,255,0)_66%)]" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.46fr_0.54fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.58, ease }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Safety boundary</p>
            <h2 className="mt-5 max-w-[560px] text-[3.35rem] font-medium leading-[1.04] tracking-[-0.065em] text-[#262626]">
              Administrative intake is automated. Clinical judgment is not.
            </h2>
            <p className="mt-6 max-w-[520px] text-base leading-8 text-[#737373]">
              Medbay assists with intake, scheduling, knowledge-base answers, and handoff. Deterministic policy
              decisions decide when to answer, clarify, escalate, or block before the assistant can continue.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.68, delay: 0.1, ease }}
            className="overflow-hidden rounded-[34px] border border-[#dbeafe] bg-white p-3 shadow-[0_34px_100px_-78px_rgba(37,99,235,0.72)]"
          >
            <div className="rounded-[26px] border border-[#ededed] bg-[#fcfcfc]">
              <div className="flex items-center justify-between border-b border-[#ededed] bg-white px-5 py-4">
                <span className="font-mono text-xs text-[#737373]">policy-engine.ts</span>
                <span className="rounded-md bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                  deterministic
                </span>
              </div>

              <div className="grid divide-y divide-[#ededed] md:grid-cols-2 md:divide-x md:divide-y-0">
                {policyDecisions.map(([title, text, result]) => (
                  <article
                    key={title}
                    className="min-h-[210px] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-medium tracking-[-0.05em] text-[#262626]">{title}</h3>
                      <span className="rounded-full bg-[#eff6ff] px-3 py-1 font-mono text-[10px] text-[#2563eb]">
                        {result}
                      </span>
                    </div>
                    <p className="mt-8 max-w-[260px] text-sm leading-7 text-[#737373]">{text}</p>
                  </article>
                ))}
              </div>

              <div className="border-t border-[#ededed] bg-white px-5 py-4">
                <p className="font-mono text-[11px] leading-6 text-[#737373]">
                  policy engine runs before and after the AI response / assistant output is validated before persistence
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ConsoleSection() {
  const featureGroups = [
    ["Patient intake", "Chat flow, quick prompts, safety routing, and persisted conversation state."],
    ["Clinic operations", "Admin queue, case review, appointment handoff, lead tracking, and knowledge updates."],
    ["Demo mode", "Portfolio data loads immediately so the product can be reviewed without external latency."],
  ];

  return (
    <section id="console" className="relative overflow-hidden bg-[#fafafa] py-28 lg:py-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_70%_22%,rgba(59,130,246,0.18),rgba(250,250,250,0)_64%)]" />
      <div className="mx-auto max-w-[1460px] px-5 sm:px-8">
        <div className="relative grid gap-16 lg:grid-cols-[0.43fr_0.57fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Project execution</p>
            <h2 className="mt-5 max-w-[650px] text-[3.25rem] font-medium leading-[1.04] tracking-[-0.065em] text-[#262626]">
              A working clinic intake product, packaged for portfolio review.
            </h2>
            <p className="mt-6 max-w-[520px] text-base leading-8 text-[#737373]">
              MedBay is not only a visual concept. The project includes patient intake, admin review, knowledge
              management, appointment flow, and a demo path that avoids service delays during evaluation.
            </p>

            <div className="mt-10 space-y-5">
              {featureGroups.map(([title, text], index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.42, delay: index * 0.08, ease }}
                  className="grid grid-cols-[44px_1fr] gap-4"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#eff6ff] text-[11px] font-bold text-[#2563eb]">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#262626]">{title}</p>
                    <p className="mt-1 max-w-[520px] text-sm leading-6 text-[#737373]">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <ProductionBlueprint />
        </div>
      </div>
    </section>
  );
}

function ProductionBlueprint() {
  const modules = [
    ["Frontend", "Next.js App Router", "public site + admin"],
    ["Intake API", "/api/chat", "policy-aware responses"],
    ["Case store", "Supabase / Postgres", "cases, leads, messages"],
    ["Clinic tools", "Admin dashboard", "review, schedule, handoff"],
  ];
  const productionSteps = [
    ["01", "Configure server secrets", "OpenAI, Supabase, Resend, calendar credentials"],
    ["02", "Connect managed storage", "Postgres tables for cases, knowledge, leads, and appointments"],
    ["03", "Deploy web runtime", "Next.js server routes handle intake, admin, and API boundaries"],
    ["04", "Keep demo fallback", "Portfolio mode stays fast when production services are unavailable"],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.78, ease }}
      className="relative overflow-hidden rounded-[34px] border border-[#dbeafe] bg-white p-4 shadow-[0_38px_120px_-86px_rgba(37,99,235,0.9)]"
    >
      <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#bfdbfe]/70 blur-3xl" />
      <div className="relative overflow-hidden rounded-[26px] border border-[#ededed] bg-[#fcfcfc]">
        <div className="flex items-center justify-between border-b border-[#ededed] bg-white/86 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#93c5fd]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
          </div>
          <span className="font-mono text-xs text-[#737373]">production-blueprint.ts</span>
          <span className="rounded-md bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">deployable</span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-[#ededed] p-5 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Functional surface</p>
            <div className="mt-5 space-y-3">
              {modules.map(([title, stack, detail], index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.34, delay: index * 0.07 }}
                  whileHover={{ x: 6 }}
                  className="rounded-[18px] border border-[#e5e5e5] bg-white p-4 transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-[#262626]">{title}</p>
                    <span className="rounded-full bg-[#f5f5f5] px-2.5 py-1 font-mono text-[10px] text-[#737373]">
                      {stack}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#737373]">{detail}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Production runbook</p>
            <div className="mt-5 space-y-3">
              {productionSteps.map(([number, title, text], index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.34, delay: 0.1 + index * 0.08 }}
                  className="grid grid-cols-[34px_1fr] gap-3 rounded-[18px] bg-white p-3 ring-1 ring-[#ededed]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#eff6ff] font-mono text-[10px] font-bold text-[#2563eb]">
                    {number}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#262626]">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#737373]">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563eb]">Runtime boundary</p>
                <motion.span
                  className="h-2 w-2 rounded-full bg-[#3b82f6]"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <p className="mt-3 font-mono text-[11px] leading-6 text-[#1d4ed8]">
                browser -&gt; Next.js API -&gt; policy engine -&gt; database / clinic adapters
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#ededed] bg-white px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {["server-side secrets", "portfolio fallback", "admin auth", "audit trail", "knowledge base"].map((label) => (
              <motion.div
                key={label}
                whileHover={{ y: -2 }}
                className="rounded-full border border-[#e5e5e5] bg-[#fafafa] px-3 py-1.5 text-[11px] font-medium text-[#525252]"
              >
                {label}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SafetySection() {
  return (
    <section id="safety" className="bg-[#f5f9ff] py-28">
      <div className="mx-auto max-w-[1168px] px-5 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.72, ease }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Safety boundary</p>
          <h2 className="mx-auto mt-5 max-w-[920px] text-[3.5rem] font-medium leading-[1.05] tracking-[-0.065em]">
            Administrative AI for intake, routing, scheduling, and review. Not diagnosis.
          </h2>
          <div className="mt-9 flex justify-center gap-3">
            <a href="#intake-demo" className="rounded-[10px] bg-[#3b82f6] px-5 py-3 text-sm font-bold text-white ring-1 ring-[#60a5fa]">
              Try intake
            </a>
            <Link href="/admin/login" className="rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-[#262626] ring-1 ring-[#e5e5e5]">
              Open admin
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
