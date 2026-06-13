"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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
import { asResolvedToolPart } from "@/types/ai";
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
  onApplyPlan: (plan: TrainingPlan, generateToolCallId: string) => void;
  onUndo: (toolCallId: string) => Promise<boolean>;
  activeWorkoutIds: Set<string>;
  appliedPlanIds: Set<string>;
  error?: Error | undefined;
}

type PlanState = "idle" | "applying" | "applied" | "undone";

export function AIChatPanel({
  messages,
  status,
  sendMessage,
  onApplyPlan,
  onUndo,
  activeWorkoutIds,
  appliedPlanIds,
  error,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [planStates, setPlanStates] = useState<Record<string, PlanState>>({});

  function getPlanState(toolCallId: string): PlanState {
    if (planStates[toolCallId] === "undone") return "undone";
    if (appliedPlanIds.has(toolCallId)) return "applied";
    return planStates[toolCallId] ?? "idle";
  }

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
    onApplyPlan(plan, toolCallId);
  }

  async function handleUndoPlan(toolCallId: string) {
    const success = await onUndo(toolCallId);
    if (success) {
      setPlanStates((prev) => ({ ...prev, [toolCallId]: "undone" }));
    }
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
                getPlanState={getPlanState}
                onApplyPlan={handleApplyPlan}
                onUndoPlan={handleUndoPlan}
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
// Training plan loading skeleton
// ---------------------------------------------------------------------------

function TrainingPlanSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-line-strong bg-background rounded-[18px] border border-dashed p-3.5 pb-3"
      style={{ maxWidth: "96%" }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-primary inline-flex animate-pulse">
          <Sparkles className="size-3.5" />
        </span>
        <span className="font-display text-[17px]">Generating plan</span>
        <span className="text-ink-faint ml-auto text-[10px] tracking-[0.08em] uppercase">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            thinking...
          </motion.span>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="bg-bg-soft h-3 w-8 animate-pulse rounded" />
            <div className="bg-bg-soft size-5 animate-pulse rounded-full" />
            <div
              className="bg-bg-soft h-3 animate-pulse rounded"
              style={{ width: `${50 + ((i * 17) % 30)}%` }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Message renderer — iterates over UIMessage.parts
// ---------------------------------------------------------------------------

interface MessageRendererProps {
  message: UIMessage;
  getPlanState: (toolCallId: string) => PlanState;
  onApplyPlan: (toolCallId: string, plan: TrainingPlan) => void;
  onUndoPlan: (toolCallId: string) => void;
  onUndo: (toolCallId: string) => Promise<boolean>;
  activeWorkoutIds: Set<string>;
}

function getToolName(partType: string): string | null {
  return partType.startsWith("tool-") ? partType.slice(5) : null;
}

function MessageRenderer({
  message,
  getPlanState,
  onApplyPlan,
  onUndoPlan,
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
        const toolPart = asResolvedToolPart(part);
        if (!toolPart) return null;

        const toolName = getToolName(part.type);

        if (
          toolName === "generateTrainingPlan" &&
          toolPart.state !== "output-available" &&
          toolPart.state !== "output-error"
        ) {
          return <TrainingPlanSkeleton key={toolPart.toolCallId} />;
        }

        if (toolPart.state !== "output-available") return null;

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
          const planState = getPlanState(toolCallId);
          return (
            <TrainingPlanCard
              key={toolCallId}
              plan={plan}
              onApply={(editedPlan) => onApplyPlan(toolCallId, editedPlan)}
              onUndoPlan={() => onUndoPlan(toolCallId)}
              isApplying={planState === "applying"}
              isApplied={planState === "applied"}
              isUndone={planState === "undone"}
            />
          );
        }

        return null;
      })}
    </>
  );
}
