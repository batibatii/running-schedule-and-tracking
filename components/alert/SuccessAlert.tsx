import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessAlertProps {
  message?: string;
  className?: string;
}

export function SuccessAlert({ message, className }: SuccessAlertProps) {
  if (!message) return null;

  return (
    <Alert className={`bg-white pl-2 border-green-200 ${className}`}>
      <AlertDescription className="text-green-800 text-sm">
        {message}
      </AlertDescription>
    </Alert>
  );
}
