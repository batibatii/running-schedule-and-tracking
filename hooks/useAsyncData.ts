import { useState, useCallback } from "react";
import { extractErrorMessage } from "@/lib/utils/error";

interface UseAsyncDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | undefined;
  success: boolean;
  execute: (asyncFn: () => Promise<T>) => Promise<void>;
  reset: () => void;
  setError: (error: string | undefined) => void;
  setSuccess: (success: boolean) => void;
  setLoading: (success: boolean) => void;
}

export function useAsyncData<T = void>(): UseAsyncDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<boolean>(false);

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setLoading(true);
    setError(undefined);
    setSuccess(false);

    try {
      const result = await asyncFn();
      setData(result);
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setSuccess(false);
    setError(undefined);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    success,
    execute,
    reset,
    setError,
    setSuccess,
    setLoading,
  };
}
