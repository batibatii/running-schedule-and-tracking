export interface ActionResult<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

export function extractErrorMessage(
  error: unknown,
  fallback: string = "An unexpected error occurred",
): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export async function safeAction<T = void>(
  fn: () => Promise<T>,
  errorMessage: string,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, message: "Success", data };
  } catch (error) {
    console.error(`[safeAction] ${errorMessage}:`, error);
    return { success: false, message: errorMessage };
  }
}
