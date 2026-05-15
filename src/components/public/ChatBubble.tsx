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
            ? "rounded-br-[6px] bg-[#36e6d5] text-[#031311]"
            : "rounded-bl-[6px] border border-white/10 bg-white/[0.055] text-white/78"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
