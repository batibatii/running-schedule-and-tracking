"use client";

import { useState, useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LoginAndSignUpType,
  LoginAndSignUpSchema,
} from "@/types/authValidation";
import { ErrorAlert } from "./alert/ErrorAlert";
import { SuccessAlert } from "./alert/SuccessAlert";
import { signIn } from "next-auth/react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useRouter, useSearchParams } from "next/navigation";
import { signUpAction, resendVerificationAction } from "@/app/actions/auth";

type Mode = "login" | "signup";
interface MinimalFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const MinimalField = forwardRef<HTMLInputElement, MinimalFieldProps>(
  function MinimalField({ label, error, ...props }, ref) {
    return (
      <div>
        <div className="border-line-strong flex items-baseline gap-4 border-b py-3.5">
          <Label className="text-ink-faint min-w-20 gap-0 pb-0 pl-0 font-mono text-[10px] tracking-[0.18em] uppercase">
            {label}
          </Label>
          <Input
            ref={ref}
            className="font-display text-foreground placeholder:text-ink-faint/50 h-auto w-auto min-w-0 flex-1 rounded-none border-none bg-transparent px-0 py-0 text-[16px] shadow-none ring-0 outline-none focus-visible:border-none focus-visible:ring-0 focus-visible:ring-transparent"
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
      </div>
    );
  },
);

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginAndSignUpType>({
    resolver: zodResolver(LoginAndSignUpSchema),
  });

  const { loading, error, success, execute, setError, setSuccess } =
    useAsyncData();

  const [needVerification, setNeedVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const {
    loading: resendLoading,
    error: resendError,
    success: resendSuccess,
    execute: executeResend,
  } = useAsyncData();

  useEffect(() => {
    const urlError = searchParams.get("error");
    const verified = searchParams.get("verified");

    if (urlError === "verification_expired") {
      setError("Your verification link has expired. Please request a new one.");
      window.history.replaceState({}, "", "/");
    } else if (urlError) {
      window.history.replaceState({}, "", "/");
    }

    if (verified === "true") {
      setSuccess(false);
      setError(undefined);
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, setError, setSuccess]);

  const onSubmit = async (data: LoginAndSignUpType) => {
    setNeedVerification(false);
    setUnverifiedEmail("");

    if (mode === "login") {
      await execute(async () => {
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        if (result?.error) {
          if (result.error === "EMAIL_NOT_VERIFIED") {
            setNeedVerification(true);
            setUnverifiedEmail(data.email);
            throw new Error("Please verify your email before logging in");
          }
          throw new Error(result.error);
        }

        setTimeout(() => {
          router.push("/schedule");
        }, 1500);
      });
    } else {
      await execute(async () => {
        const result = await signUpAction(data.email, data.password);
        if (!result.success) {
          throw new Error(result.message);
        }
        setNeedVerification(true);
        setUnverifiedEmail(data.email);
      });
    }
  };

  const handleResendVerification = async () => {
    await executeResend(async () => {
      const result = await resendVerificationAction(unverifiedEmail);
      if (!result.success) {
        throw new Error(result.message);
      }
    });
  };

  const handleBackToLogin = () => {
    setNeedVerification(false);
    setUnverifiedEmail("");
    setError(undefined);
    setSuccess(false);
    setMode("login");
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(undefined);
    setSuccess(false);
  };

  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* ── Top bar: wordmark ── */}
      <div className="flex items-center px-12 py-8">
        <span className="font-display text-[24px] leading-none tracking-[-0.01em]">
          Grind
          <span className="font-display text-coral-deep italic">&amp;</span>
          Track
        </span>
      </div>

      {/* ── Centered form ── */}
      <div className="flex flex-1 items-center justify-center px-12">
        <div className="flex w-full max-w-115 flex-col gap-6">
          {needVerification ? (
            /* ── Verification state ── */
            <>
              <div className="text-center">
                <div className="text-ink-faint mb-4.5 font-mono text-[10px] tracking-[0.22em] uppercase">
                  — Verify email —
                </div>
                <h1 className="font-display m-0 text-[64px] leading-[0.95] font-normal tracking-[-0.02em]">
                  Check your <em className="text-coral-deep">inbox</em>.
                </h1>
                <p className="text-ink-soft mx-auto mt-3.5 max-w-85 text-[14px] leading-[1.55]">
                  We sent a verification link to{" "}
                  <span className="text-foreground font-medium">
                    {unverifiedEmail}
                  </span>
                </p>
              </div>

              {resendSuccess && (
                <SuccessAlert message="Verification email sent! Check your inbox." />
              )}
              {resendError && <ErrorAlert message={resendError} />}

              <Button
                type="button"
                variant="ghost"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="border-b-foreground text-foreground flex h-auto items-center justify-between rounded-none border-0 border-b-2 bg-transparent px-6 py-3.5 text-[12px] font-medium tracking-[0.22em] uppercase shadow-none hover:bg-transparent disabled:opacity-50"
              >
                <span>
                  {resendLoading ? "Sending..." : "Resend verification"}
                </span>
                <span>→</span>
              </Button>

              <p className="text-ink-soft mt-1 text-center text-[12px]">
                Wrong email?{" "}
                <button
                  onClick={handleBackToLogin}
                  className="border-foreground text-foreground cursor-pointer border-b bg-transparent p-0 font-medium"
                >
                  Start over
                </button>
              </p>
            </>
          ) : (
            /* ── Login / Signup form ── */
            <>
              <div className="text-center">
                <div className="text-ink-faint mb-4.5 font-mono text-[10px] tracking-[0.22em] uppercase">
                  {mode === "login" ? "— Sign in —" : "— Create account —"}
                </div>
                <h1 className="font-display m-0 text-[64px] leading-[0.95] font-normal tracking-[-0.02em]">
                  {mode === "login" ? (
                    <>
                      Welcome <em className="text-coral-deep">back</em>.
                    </>
                  ) : (
                    <>
                      Begin <em className="text-coral-deep">your week</em>.
                    </>
                  )}
                </h1>
                <p className="text-ink-soft mx-auto mt-3.5 max-w-85 text-[14px] leading-[1.55]">
                  {mode === "login"
                    ? "Pick up where last Sunday left off."
                    : "A quiet place to plan your week of running."}
                </p>
              </div>

              {error && <ErrorAlert message={error} />}
              {success && (
                <SuccessAlert
                  message="Login successful! Redirecting..."
                  className="bg-white pl-2"
                />
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                <div className="flex flex-col">
                  <MinimalField
                    label="Email"
                    placeholder="email@example.com"
                    type="email"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <MinimalField
                    label="Password"
                    placeholder="••••••••••"
                    type="password"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>

                <Button
                  type="submit"
                  variant="ghost"
                  disabled={isSubmitting || loading}
                  className="border-b-foreground text-foreground mt-6 flex h-auto items-center justify-between rounded-none border-0 border-b-2 bg-transparent px-6 py-3.5 text-[12px] font-medium tracking-[0.22em] uppercase shadow-none hover:bg-transparent disabled:opacity-50"
                >
                  <span>
                    {isSubmitting || loading
                      ? mode === "login"
                        ? "Signing in..."
                        : "Creating account..."
                      : mode === "login"
                        ? "Continue"
                        : "Create account"}
                  </span>
                  <span>→</span>
                </Button>
              </form>

              <p className="text-ink-soft mt-1 text-center text-[12px]">
                {mode === "login"
                  ? "New to Grind&Track? "
                  : "Already have an account? "}
                <button
                  onClick={toggleMode}
                  className="border-foreground text-foreground cursor-pointer border-b bg-transparent p-0 font-medium"
                >
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom rule + epigraph ── */}
      <div className="border-line flex items-center border-t px-12 py-5">
        <span className="font-display text-ink-soft text-[16px] italic">
          &ldquo;The miles are kind to those who keep showing up.&rdquo;
        </span>
      </div>
    </div>
  );
}
