"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { ChatInput } from "@/components/ai/ChatInput";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { ChatMessageList } from "@/components/ai/ChatMessageList";
import { MarkdownContent } from "@/components/ai/MarkdownContent";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { WorkoutPreviewCard } from "@/components/ai/WorkoutPreviewCard";
import { TrainingPlanCard } from "@/components/ai/TrainingPlanCard";
import type { TrainingPlan } from "@/lib/ai/schemas/trainingPlan";
import type {
  Sport,
  WorkoutType,
  HeartRateZone,
  DayOfWeek,
} from "@/types/workout";

interface AIChatPanelProps {
  messages: UIMessage[];
  status: ChatStatus;
  sendMessage: (options: { text: string }) => void;
  onApplyPlan: (plan: TrainingPlan) => void;
  onUndo: (toolCallId: string) => Promise<boolean>;
  activeWorkoutIds: Set<string>;
  error?: Error | undefined;
}

type PlanState = "idle" | "applying" | "applied";

export function AIChatPanel({
  messages,
  status,
  sendMessage,
  onApplyPlan,
  onUndo,
  activeWorkoutIds,
  error,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [planStates, setPlanStates] = useState<Record<string, PlanState>>({});

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  function handleSuggestedPrompt(message: string) {
    if (isLoading) return;
    sendMessage({ text: message });
  }

  function handleApplyPlan(toolCallId: string, plan: TrainingPlan) {
    setPlanStates((prev) => ({ ...prev, [toolCallId]: "applying" }));
    onApplyPlan(plan);
    // The parent will call sendMessage to trigger applyPlanToSchedule tool,
    // and we mark as applied when the message stream completes.
    // For now, optimistically mark as applied after a short delay.
    setPlanStates((prev) => ({ ...prev, [toolCallId]: "applied" }));
  }

  return (
    <div className="grid h-107.5 grid-rows-[1fr_auto]">
      <div className="flex min-h-0 flex-col pr-4">
        {error && (
          <div className="text-destructive bg-destructive/10 mb-2 rounded-lg p-3 text-xs">
            {error.message}
          </div>
        )}
        {hasMessages ? (
          <ChatMessageList messageCount={messages.length}>
            {messages.map((message) => (
              <MessageRenderer
                key={message.id}
                message={message}
                planStates={planStates}
                onApplyPlan={handleApplyPlan}
                onUndo={onUndo}
                activeWorkoutIds={activeWorkoutIds}
              />
            ))}
          </ChatMessageList>
        ) : (
          <SuggestedPrompts onSelect={handleSuggestedPrompt} />
        )}
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message renderer — iterates over UIMessage.parts
// ---------------------------------------------------------------------------

interface MessageRendererProps {
  message: UIMessage;
  planStates: Record<string, PlanState>;
  onApplyPlan: (toolCallId: string, plan: TrainingPlan) => void;
  onUndo: (toolCallId: string) => Promise<boolean>;
  activeWorkoutIds: Set<string>;
}

function getToolName(partType: string): string | null {
  return partType.startsWith("tool-") ? partType.slice(5) : null;
}

function MessageRenderer({
  message,
  planStates,
  onApplyPlan,
  onUndo,
  activeWorkoutIds,
}: MessageRendererProps) {
  const textParts = message.parts.filter((part) => part.type === "text");
  const toolParts = message.parts.filter((part) =>
    part.type.startsWith("tool-"),
  );

  return (
    <>
      {textParts.length > 0 && (
        <ChatMessage role={message.role as "user" | "assistant"}>
          {message.role === "assistant" ? (
            <MarkdownContent>
              {textParts
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("\n\n")}
            </MarkdownContent>
          ) : (
            textParts.map((part, index) => (
              <span key={index}>{part.type === "text" ? part.text : null}</span>
            ))
          )}
        </ChatMessage>
      )}

      {/* Render tool invocations inline */}
      {toolParts.map((part) => {
        const toolPart = part as unknown as {
          toolCallId: string;
          state: string;
          output?: Record<string, unknown>;
        };
        if (toolPart.state !== "output-available") return null;

        const toolName = getToolName(part.type);
        const { toolCallId, output } = toolPart;

        if (toolName === "createWorkout" && output?.workout) {
          const workout = output.workout as {
            id: string;
            sport: Sport;
            workoutType: WorkoutType;
            heartRateZone: HeartRateZone;
            distance: number;
            duration?: number;
            pace?: string;
            dayOfWeek: DayOfWeek;
            title?: string;
          };
          return (
            <WorkoutPreviewCard
              key={toolCallId}
              sport={workout.sport}
              workoutType={workout.workoutType}
              heartRateZone={workout.heartRateZone}
              distance={workout.distance}
              duration={workout.duration}
              pace={workout.pace}
              dayOfWeek={workout.dayOfWeek}
              title={workout.title}
              onUndo={() => onUndo(toolCallId)}
              gone={!activeWorkoutIds.has(workout.id)}
            />
          );
        }

        if (toolName === "generateTrainingPlan" && output?.plan) {
          const plan = output.plan as TrainingPlan;
          const planState = planStates[toolCallId] ?? "idle";
          return (
            <TrainingPlanCard
              key={toolCallId}
              plan={plan}
              onApply={() => onApplyPlan(toolCallId, plan)}
              onDismiss={() => {}}
              isApplying={planState === "applying"}
              isApplied={planState === "applied"}
            />
          );
        }

        return null;
      })}
    </>
  );
}
