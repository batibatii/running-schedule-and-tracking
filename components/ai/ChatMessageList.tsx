"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageListProps {
  children: ReactNode;
  messageCount: number;
}

const SCROLL_THRESHOLD = 40;

export function ChatMessageList({
  children,
  messageCount,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  function scrollToBottom() {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsAtBottom(distanceFromBottom < SCROLL_THRESHOLD);
  }

  // Auto-scroll on new messages (only if user hasn't scrolled up)
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messageCount, isAtBottom]);

  return (
    <div className="relative flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full flex-col gap-3 overflow-y-auto pr-1"
      >
        {children}
      </div>

      {!isAtBottom && (
        <Button
          variant="outline"
          size="icon-xs"
          onClick={scrollToBottom}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 shadow-sm"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="size-3" />
        </Button>
      )}
    </div>
  );
}
