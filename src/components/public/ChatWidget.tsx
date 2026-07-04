"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/public/ChatBubble";
import { PRIVACY_TEXT } from "@/lib/constants";
import { motion } from "framer-motion";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickActions = [
  {
    label: "Start intake",
    description: "Collect patient details",
    prompt: "Start a new patient intake.",
  },
  {
    label: "Clinic question",
    description: "Services and policies",
    prompt: "What services does Northstar Clinic offer?",
  },
  {
    label: "Schedule visit",
    description: "Prepare appointment handoff",
    prompt: "I need to schedule an appointment.",
  },
  {
    label: "Human review",
    description: "Route to staff",
    prompt: "I want a human to review this.",
  },
];

const caseSignals = ["Intent", "Safety", "Scheduling", "Staff review"];

export function ChatWidget() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to Northstar Clinic intake. I can collect patient details, answer administrative questions, support scheduling, and route unsafe or clinical requests to staff.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingDemoFallback, setUsingDemoFallback] = useState(false);
  const conversationIdRef = useRef<string>("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("medbay_conversation_id");
    const id = stored || crypto.randomUUID();
    window.localStorage.setItem("medbay_conversation_id", id);
    conversationIdRef.current = id;
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(message: string) {
    const text = message.trim();
    if (!text || isLoading) return;
    const conversationId = getConversationId();

    setInput("");
    setIsLoading(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          history: messages
            .filter((item) => item.role === "user")
            .slice(-11)
            .map((item) => item.content),
          metadata: { source: "landing_page", page: "/" },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Chat request failed");
      }

      setUsingDemoFallback(data.persistenceAvailable === false);
      if (data.conversationId) {
        window.localStorage.setItem("medbay_conversation_id", data.conversationId);
        conversationIdRef.current = data.conversationId;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "I could not process that message. I can route this to the clinic team.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "The intake service is temporarily unavailable. Please try again or contact the clinic operations team.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function getConversationId() {
    if (conversationIdRef.current) return conversationIdRef.current;
    const stored = window.localStorage.getItem("medbay_conversation_id");
    const id = stored || crypto.randomUUID();
    window.localStorage.setItem("medbay_conversation_id", id);
    conversationIdRef.current = id;
    return id;
  }

  const hasStarted = messages.some((message) => message.role === "user");
  const currentCaseStatus = isLoading ? "Processing" : hasStarted ? "Collecting details" : "Not started";
  const nextStep = hasStarted ? "Continue the intake" : "Choose a request";
  const safetyStatus = usingDemoFallback ? "Demo fallback" : "Active";

  return (
    <section className="flex h-[670px] min-h-0 w-full flex-col overflow-hidden rounded-[26px] border border-[#1e3a5f] bg-[#07101f] text-[#eef5ff] shadow-[0_34px_90px_rgba(59,130,246,0.22),inset_0_1px_0_rgba(147,197,253,0.12)]">
      <div className="border-b border-[#1e3a5f] bg-[#081426] p-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="medbay-label">Patient front door</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Northstar Clinic intake</h2>
          </div>
          <div className="hidden rounded-2xl border border-[#1e3a5f] bg-[#09172b] px-4 py-3 text-right sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Case state</p>
            <p className="mt-1 text-sm font-semibold text-[#eef5ff]">{currentCaseStatus}</p>
          </div>
        </div>
        <p className="mt-2 max-w-[620px] text-xs leading-5 text-[#94a3b8]">{PRIVACY_TEXT}</p>
        {usingDemoFallback ? (
          <p className="mt-3 border-l-2 border-[#3b82f6]/70 pl-3 text-xs leading-5 text-[#2563eb]">
            Demo fallback is active. The intake flow continues locally while the portfolio admin uses seeded review data.
          </p>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 bg-[#07101f] p-3 md:grid-cols-[minmax(0,1fr)_226px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#1e3a5f] bg-[#08111f]">
          <div className="flex items-center justify-between border-b border-[#1e3a5f] bg-[#0a1628] px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Conversation</p>
              <p className="mt-1 text-xs text-[#94a3b8]">{nextStep}</p>
            </div>
            <span className="rounded-full bg-[#1e3a5f] px-3 py-1 text-[10px] font-bold text-[#7db7ff]">
              {hasStarted ? "active" : "ready"}
            </span>
          </div>
          <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto bg-[#08111f] p-4 scroll-smooth">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatBubble key={message.id} role={message.role} content={message.content} />
              ))}
              {isLoading ? (
                <div className="max-w-[78%] rounded-[18px] border border-[#1e3a5f] bg-[#09172b] p-4">
                  <div className="h-2 w-32 animate-pulse rounded-full bg-[#60a5fa]/50" />
                  <div className="mt-3 h-2 w-48 animate-pulse rounded-full bg-[#e5e5e5] animation-delay-150" />
                </div>
              ) : null}
              <div ref={scrollRef} />
            </div>
          </div>
        </div>

        <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#1e3a5f] bg-[#08111f] p-3 md:flex">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3b82f6]">Intake console</p>

          <div className="mt-3 space-y-2">
            {[
              ["Current case", currentCaseStatus],
              ["Safety", safetyStatus],
              ["Saves to admin", "Portfolio demo"],
            ].map(([label, value], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.35 }}
                className="rounded-2xl border border-[#1e3a5f] bg-[#09172b] p-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">{label}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#eef5ff]">{value}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {caseSignals.map((signal, index) => {
              const active = hasStarted || index === 1;
              return (
                <motion.div
                  key={signal}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                  className={`rounded-2xl border p-2 ${
                    active ? "border-[#3b82f6] bg-[#102449]" : "border-[#1e3a5f] bg-[#09172b]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#3b82f6]" : "bg-[#d4d4d4]"}`} />
                    <span className="text-[10px] font-semibold text-[#eef5ff]">{signal}</span>
                  </div>
                  <p className={`mt-1 text-[10px] ${active ? "text-[#7db7ff]" : "text-[#94a3b8]"}`}>
                    {active ? "ready" : "queued"}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </aside>
      </div>

      <div className="border-t border-[#1e3a5f] bg-[#081426] p-3">
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => sendMessage(action.prompt)}
              className="shrink-0 rounded-[14px] border border-[#1e3a5f] bg-[#09172b] px-3.5 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-[#60a5fa] hover:bg-[#102449] active:scale-[0.98]"
            >
              <span className="block text-xs font-semibold text-[#eef5ff]">{action.label}</span>
              <span className="mt-1 block text-[11px] text-[#94a3b8]">{action.description}</span>
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <label className="sr-only" htmlFor="patient-message">
            Patient message
          </label>
          <input
            id="patient-message"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your response..."
            className="min-w-0 flex-1 rounded-[16px] border border-[#1e3a5f] bg-[#07101f] px-5 py-3 text-sm text-[#eef5ff] outline-none transition placeholder:text-[#64748b] focus:border-[#60a5fa] focus:bg-[#09172b] focus:ring-4 focus:ring-[#1e3a5f]"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="min-w-24 rounded-[16px] bg-[#3b82f6] px-5 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#2563eb] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
