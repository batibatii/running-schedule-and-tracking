"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { WeekContext } from "@/types/ai";
import type { PillFieldType } from "@/types/playground";

interface UseAIChatOptions {
  weekContext: WeekContext;
  onWorkoutCreated: () => void;
  onPlanApplied: () => void;
  addPill: (
    fieldType: PillFieldType,
    value: string | number,
    label: string,
  ) => boolean;
}

// Module-level ref containers — avoids React Compiler "refs during render" errors
let latestWeekContext: WeekContext | null = null;

const transport = new DefaultChatTransport({
  api: "/api/ai/chat",
  body: () => ({ weekContext: latestWeekContext }),
});

export function useAIChat({
  weekContext,
  onWorkoutCreated,
  onPlanApplied,
  addPill,
}: UseAIChatOptions) {
  // Sync latest weekContext to module-level variable via effect (not during render)
  useEffect(() => {
    latestWeekContext = weekContext;
  });

  // Track which tool results we've already processed to avoid duplicate side effects
  const processedToolCalls = useRef(new Set<string>());

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
    onFinish: ({ message }) => {
      processToolResults(message);
    },
  });

  function processToolResults(message: UIMessage) {
    for (const part of message.parts) {
      if (!part.type.startsWith("tool-")) continue;

      // Cast to access toolCallId, state, and output on tool invocation parts
      const toolPart = part as unknown as {
        toolCallId: string;
        state: string;
        output?: Record<string, unknown>;
      };
      if (toolPart.state !== "output-available") continue;
      if (processedToolCalls.current.has(toolPart.toolCallId)) continue;
      processedToolCalls.current.add(toolPart.toolCallId);

      // Tool name is encoded in the part type: "tool-createWorkout" → "createWorkout"
      const toolName = part.type.slice(5);

      if (toolName === "createWorkout") {
        onWorkoutCreated();
      }

      if (toolName === "createPill" && toolPart.output?.pill) {
        const pill = toolPart.output.pill as {
          fieldType: PillFieldType;
          value: string | number;
          label: string;
        };
        addPill(pill.fieldType, pill.value, pill.label);
      }

      if (toolName === "applyPlanToSchedule") {
        onPlanApplied();
      }
    }
  }

  function handleApplyPlan() {
    sendMessage({ text: "Apply the training plan to my schedule" });
  }

  return {
    messages,
    status,
    sendMessage,
    setMessages,
    error,
    handleApplyPlan,
  };
}
