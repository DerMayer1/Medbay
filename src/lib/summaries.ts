import type { ChatMessage } from "@/types/lead";

export function summarizeMessages(messages: ChatMessage[]) {
  const recent = messages.slice(-8).map((message) => `${message.role}: ${message.content}`);
  return recent.join("\n").slice(0, 1600);
}
