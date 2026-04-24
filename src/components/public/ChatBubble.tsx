import type { MessageRole } from "@/types/lead";

export function ChatBubble({ role, content }: { role: MessageRole; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
          isUser ? "bg-[#173d32] text-[#fff8ef]" : "border border-[#ead8c3] bg-[#fffdf9] text-[#2f3834]"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
