"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChatBubble } from "@/components/public/ChatBubble";
import { PRIVACY_TEXT } from "@/lib/constants";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickReplies = [
  "Start a new patient intake.",
  "What services does Northstar Clinic offer?",
  "I need to schedule an appointment.",
  "I want a human to review this.",
  "Can you interpret my lab results?",
];

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
  const conversationIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("medbay_conversation_id");
    const id = stored || crypto.randomUUID();
    window.localStorage.setItem("medbay_conversation_id", id);
    conversationIdRef.current = id;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
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
          metadata: { source: "landing_page", page: "/" },
        }),
      });

      const data = await response.json();
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

  return (
    <section className="flex h-[620px] min-h-0 w-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#071012] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="relative border-b border-white/10 bg-[#0c171a] p-5">
        <motion.div
          className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(54,230,213,0.88),transparent)]"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase text-[#36e6d5]">
              Intake assistant
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Northstar Clinic</h2>
          </div>
          <div className="rounded-[999px] border border-[#36e6d5]/25 bg-[#36e6d5]/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase text-[#a8fff6]">
            Online
          </div>
        </div>
        <p className="mt-3 max-w-[620px] text-xs leading-6 text-white/52">{PRIVACY_TEXT}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 scroll-smooth">
        <div className="space-y-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} content={message.content} />
          ))}
          {isLoading ? (
            <div className="max-w-[78%] rounded-[18px] border border-white/10 bg-white/[0.045] p-4">
              <div className="h-2 w-32 animate-pulse rounded-full bg-[#36e6d5]/35" />
              <div className="mt-3 h-2 w-48 animate-pulse rounded-full bg-white/10 animation-delay-150" />
            </div>
          ) : null}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0c171a] p-4">
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(reply)}
              className="shrink-0 rounded-[999px] border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/62 transition hover:border-[#36e6d5]/35 hover:bg-[#36e6d5]/10 hover:text-[#a8fff6] active:scale-[0.98]"
            >
              {reply}
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
            className="min-w-0 flex-1 rounded-[16px] border border-white/10 bg-[#05090b] px-5 py-3.5 text-sm text-white outline-none transition placeholder:text-white/34 focus:border-[#36e6d5]/55 focus:bg-[#071012] focus:ring-4 focus:ring-[#36e6d5]/10"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="min-w-24 rounded-[16px] bg-[#36e6d5] px-5 py-3.5 text-sm font-semibold text-[#031311] transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
