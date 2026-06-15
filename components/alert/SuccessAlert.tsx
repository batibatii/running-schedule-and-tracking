import { Check } from "lucide-react";

interface SuccessAlertProps {
  message?: string;
  className?: string;
}

export function SuccessAlert({ message, className }: SuccessAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`bg-mint/15 flex items-center gap-2 rounded-lg px-3 py-2.5 ${className ?? ""}`}
    >
      <Check className="text-mint-deep size-3.5 shrink-0" strokeWidth={3} />
      <p className="text-ink-soft text-[13px] leading-snug">{message}</p>
    </div>
  );
}
