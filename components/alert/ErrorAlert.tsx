import { Alert, AlertTitle } from "@/components/ui/alert";

interface ErrorAlertProps {
  message?: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className={`${className}`}>
      <AlertTitle className="text-destructive/85 pl-2 pt-1 border-none ">
        {message}
      </AlertTitle>
    </Alert>
  );
}
