"use client";

import { type KeyboardEvent } from "react";
import { Send } from "lucide-react";
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
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask your running coach..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        size="icon"
        onClick={onSubmit}
        disabled={!value.trim() || isLoading}
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
