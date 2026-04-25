import type { MessageRole } from "@/types/lead";

export function ChatBubble({ role, content }: { role: MessageRole; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
          isUser ? "bg-cyan-700 text-white" : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
