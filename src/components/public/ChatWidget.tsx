"use client";

import { SendHorizontal } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
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
          content: "The intake service is temporarily unavailable. Please try again or open the admin demo.",
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
    <section className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#f8fafc] text-[#101827]">
      <div className="border-b border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Patient intake assistant</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Northstar Clinic</h2>
          </div>
          <div className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800">
            Demo mode
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{PRIVACY_TEXT}</p>
      </div>

      <div className="h-[430px] overflow-y-auto bg-slate-50 p-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} content={message.content} />
          ))}
          {isLoading ? <p className="text-sm text-slate-500">Assistant is processing intake...</p> : null}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(reply)}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {reply}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type an intake message"
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="grid h-12 w-12 place-items-center rounded-md bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60"
            disabled={isLoading}
          >
            <SendHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}
