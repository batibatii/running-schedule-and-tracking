"use client";

import { type KeyboardEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  }

  return (
    <div className="bg-surface before:bg-line-strong relative flex items-center gap-3 pt-4 before:absolute before:-inset-x-4.5 before:top-0 before:h-px">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        disabled={isLoading}
        className="bg-background placeholder:text- border-line-strong s h-auto flex-1 rounded-full border px-5 py-3.5 text-sm outline-none placeholder:text-base"
      />
      <Button
        onClick={onSubmit}
        disabled={!value.trim() || isLoading}
        aria-label="Send message"
        className="bg-coral-deep hover:bg-coral-deep/90 size-12 shrink-0 rounded-full border-0 p-0 text-white shadow-none disabled:pointer-events-auto disabled:opacity-100"
      >
        <ArrowRight className="size-4.5" />
      </Button>
    </div>
  );
}
