"use client";

import { useState, useEffect, type ReactNode } from "react";
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
  title: ReactNode;
  label?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  storageKey: string;
  children: ReactNode;
}

export function AccordionPanel({
  title,
  label,
  icon,
  defaultOpen = false,
  storageKey,
  children,
}: AccordionPanelProps) {
  // Start with defaultOpen (same on server + client) to avoid hydration mismatch,
  // then sync from localStorage after mount.
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(readPersistedState(storageKey, defaultOpen));
  }, [storageKey, defaultOpen]);

  function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    persistState(storageKey, next);
  }

  return (
    <section
      className="bg-surface flex flex-col overflow-hidden rounded-[24px]"
      style={{ boxShadow: "inset 0 0 0 1px var(--color-line)" }}
    >
      {/* Header */}
      <Button
        variant="ghost"
        onClick={toggle}
        className={cn(
          "flex h-auto w-full items-center justify-between gap-3 rounded-none px-4.5 py-4 hover:bg-transparent",
          isOpen && "border-b-line-strong border-b",
        )}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="bg-primary/10 text-primary inline-flex size-7.5 shrink-0 items-center justify-center rounded-full">
              {icon}
            </span>
          )}
          <div className="text-left leading-[1.1]">
            {label && (
              <div className="text-ink-faint mb-0.5 text-[11px] tracking-widest uppercase">
                {label}
              </div>
            )}
            <div className="font-display text-foreground text-2xl">{title}</div>
          </div>
        </div>
        <span className="border-line-strong bg-surface text-ink-soft inline-flex size-7.5 shrink-0 items-center justify-center rounded-full border">
          <motion.span
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="inline-flex"
          >
            <ChevronDown className="size-4" />
          </motion.span>
        </span>
      </Button>

      {/* Content stays mounted for DndContext ref stability */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.22, 0.9, 0.32, 1] }}
        className="overflow-hidden"
      >
        <div className="px-4.5 pb-4.5">{children}</div>
      </motion.div>
    </section>
  );
}
