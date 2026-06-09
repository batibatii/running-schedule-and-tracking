"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const SUGGESTED_PROMPTS = [
  {
    label: "Generate training plan",
    message: "Generate this week's training plan",
  },
  {
    label: "12K easy run Tuesday",
    message: "Add a 12K easy run on Tuesday",
  },
  {
    label: "20K Long Run",
    message: "Create 20K long run pill",
  },
];

interface SuggestedPromptsProps {
  onSelect: (message: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <p className="text-muted-foreground text-xs">Try asking:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <motion.div
            key={prompt.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.2 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(prompt.message)}
              className="text-xs"
            >
              {prompt.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
