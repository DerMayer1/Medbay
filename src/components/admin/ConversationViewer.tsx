import { ChatBubble } from "@/components/public/ChatBubble";
import type { ChatMessage } from "@/types/lead";

export function ConversationViewer({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="rounded-lg border border-[#d9ded6] bg-white p-5">
      <h2 className="text-lg font-semibold">Histórico completo</h2>
      <div className="mt-5 space-y-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} content={message.content} />
        ))}
        {messages.length === 0 ? <p className="text-sm text-[#66746f]">Sem mensagens registradas.</p> : null}
      </div>
    </div>
  );
}
