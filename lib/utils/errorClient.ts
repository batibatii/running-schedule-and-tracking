import { toast } from "sonner";

export async function withToastError<T>(
  fn: () => Promise<T>,
  errorMessage: string,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[withToastError] ${errorMessage}:`, error);
    toast.error(errorMessage);
    return undefined;
  }
}
