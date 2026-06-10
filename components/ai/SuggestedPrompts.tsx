"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays } from "lucide-react";
import { RunIcon } from "@/components/icons/SportIcon";

const SUGGESTED_PROMPTS: {
  icon: ReactNode;
  label: string;
  message: string;
}[] = [
  {
    icon: <CalendarDays className="size-3.5" />,
    label: "Generate this week's training plan",
    message: "Generate this week's training plan",
  },
  {
    icon: <RunIcon size={14} />,
    label: "12K easy run on Tuesday",
    message: "Add a 12K easy run on Tuesday",
  },
  {
    icon: <RunIcon size={14} />,
    label: "20K long run workout",
    message: "Create a 20K long run workout",
  },
];

interface SuggestedPromptsProps {
  onSelect: (message: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-1 flex-col content-start items-start gap-4 pt-25 pb-3">
      {SUGGESTED_PROMPTS.map((prompt, index) => (
        <motion.button
          key={prompt.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.2 }}
          onClick={() => onSelect(prompt.message)}
          className="bg-background border-line hover:border-line-strong group flex items-center gap-2 rounded-full border px-3.5 py-2 text-left transition-colors"
        >
          <span className="text-ink-faint shrink-0">{prompt.icon}</span>
          <span className="text-ink text-[13px] whitespace-nowrap">
            {prompt.label}
          </span>
          <ArrowRight className="text-ink-faint group-hover:text-ink-soft size-3.5 shrink-0 transition-colors" />
        </motion.button>
      ))}
    </div>
  );
}
