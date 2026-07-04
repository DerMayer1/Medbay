"use client";

import type { MessageRole } from "@/types/lead";
import { motion } from "framer-motion";

export function ChatBubble({ role, content }: { role: MessageRole; content: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 20 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-[20px] px-5 py-3.5 text-sm leading-7 ${
          isUser
            ? "rounded-br-[6px] bg-[#3b82f6] text-[#ffffff]"
            : "rounded-bl-[6px] border border-[#1e3a5f] bg-[#111827] text-[#eef5ff]"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
