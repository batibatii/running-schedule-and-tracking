import { X } from "lucide-react";

interface ErrorAlertProps {
  message?: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`bg-destructive/10 flex items-center gap-2 rounded-lg px-3 py-2.5 ${className ?? ""}`}
    >
      <X className="text-destructive size-3.5 shrink-0" strokeWidth={3} />
      <p className="text-ink-soft text-[13px] leading-snug">{message}</p>
    </div>
  );
}
