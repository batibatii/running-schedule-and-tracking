"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  children: ReactNode;
}

export function ChatMessage({ role, children }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <span className="bg-primary/10 text-primary mt-1 flex size-6 shrink-0 items-center justify-center rounded-full">
          <Sparkles className="size-3.5" />
        </span>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser ? "bg-bg-soft text-foreground" : "text-foreground/90",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
