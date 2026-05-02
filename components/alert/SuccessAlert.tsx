import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessAlertProps {
  message?: string;
  className?: string;
}

export function SuccessAlert({ message, className }: SuccessAlertProps) {
  if (!message) return null;

  return (
    <Alert className={`border-green-200 bg-white pl-2 ${className}`}>
      <AlertDescription className="text-sm text-green-800">
        {message}
      </AlertDescription>
    </Alert>
  );
}
