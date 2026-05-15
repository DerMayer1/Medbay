import { ChatBubble } from "@/components/public/ChatBubble";
import type { ChatMessage } from "@/types/lead";

export function ConversationViewer({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
      <h2 className="text-lg font-semibold text-white">Conversation history</h2>
      <div className="mt-5 space-y-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} content={message.content} />
        ))}
        {messages.length === 0 ? <p className="text-sm text-slate-500">No messages recorded.</p> : null}
      </div>
    </div>
  );
}
