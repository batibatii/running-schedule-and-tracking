"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "grindtrack:accordion-state";

function readPersistedState(storageKey: string, defaultOpen: boolean): boolean {
  if (typeof window === "undefined") return defaultOpen;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOpen;
    const state = JSON.parse(raw) as Record<string, boolean>;
    return state[storageKey] ?? defaultOpen;
  } catch {
    return defaultOpen;
  }
}

function persistState(storageKey: string, isOpen: boolean) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    state[storageKey] = isOpen;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

interface AccordionPanelProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  storageKey: string;
  children: ReactNode;
}

export function AccordionPanel({
  title,
  icon,
  defaultOpen = false,
  storageKey,
  children,
}: AccordionPanelProps) {
  const [isOpen, setIsOpen] = useState(() =>
    readPersistedState(storageKey, defaultOpen),
  );

  function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    persistState(storageKey, next);
  }

  return (
    <div className="border-border/50 bg-surface rounded-xl border">
      <Button
        variant="ghost"
        size="lg"
        onClick={toggle}
        className={cn(
          "text-foreground/80 hover:text-foreground flex w-full items-center justify-start gap-2 rounded-xl px-4 py-3 text-sm font-medium",
          !isOpen && "rounded-b-xl",
        )}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 text-left">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronDown className="text-foreground/40 size-4" />
        </motion.span>
      </Button>

      {/* Content stays mounted for DndContext ref stability */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.22, 0.9, 0.32, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div className="px-4 pb-4">{children}</div>
      </motion.div>
    </div>
  );
}
