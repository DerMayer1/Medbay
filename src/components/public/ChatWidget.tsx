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
  "Quero agendar uma consulta.",
  "Como funciona o acompanhamento?",
  "Quais são os valores?",
  "Atende online ou presencial?",
  "Quero falar com a equipe.",
];

export function ChatWidget() {
  const [conversationId, setConversationId] = useState<string>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá. Sou a assistente virtual do consultório da Juliana Pansardi. Posso ajudar com dúvidas administrativas e pré-agendamento.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("juliana_conversation_id");
    const id = stored || crypto.randomUUID();
    window.localStorage.setItem("juliana_conversation_id", id);
    setConversationId(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(message: string) {
    const text = message.trim();
    if (!text || isLoading) return;

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
        window.localStorage.setItem("juliana_conversation_id", data.conversationId);
        setConversationId(data.conversationId);
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "Não consegui responder agora. Vou encaminhar para a equipe.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Tive uma instabilidade agora. Vou encaminhar sua solicitação para a equipe.",
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

  return (
    <section className="w-full overflow-hidden rounded-lg border border-[#f0a15d]/20 bg-[#fff8ef] shadow-2xl shadow-black/35">
      <div className="border-b border-[#ead8c3] bg-[#fff8ef] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#b35d25]">Secretária Virtual</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#14231e]">Atendimento Juliana Pansardi</h2>
          </div>
          <div className="rounded-md border border-[#e7c7a5] bg-[#f7eadb] px-3 py-2 text-xs font-semibold text-[#8f461d]">
            Online
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#6c5d50]">{PRIVACY_TEXT}</p>
      </div>

      <div className="h-[430px] overflow-y-auto bg-[#f6efe6] p-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} content={message.content} />
          ))}
          {isLoading ? <p className="text-sm text-[#74675a]">Assistente está digitando...</p> : null}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="border-t border-[#ead8c3] bg-[#fff8ef] p-4">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => sendMessage(reply)}
              className="shrink-0 rounded-md border border-[#e5c6a5] bg-[#fffdf9] px-3 py-2 text-xs font-medium text-[#3b342d] hover:bg-[#f8eadc]"
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
            placeholder="Digite sua mensagem"
            className="min-w-0 flex-1 rounded-md border border-[#d7b895] bg-white px-4 py-3 text-sm text-[#1f2925] outline-none placeholder:text-[#8a7b6b] focus:border-[#d97934] focus:ring-2 focus:ring-[#d97934]/20"
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            className="grid h-12 w-12 place-items-center rounded-md bg-[#d97934] text-white hover:bg-[#b85f26] disabled:opacity-60"
            disabled={isLoading}
          >
            <SendHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}
