"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StravaIcon } from "@/components/StravaIcon";
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

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const error = searchParams.get("error");
    const verified = searchParams.get("verified");

    if (error === "verification_expired") {
      setError("Your verification link has expired. Please request a new one.");
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
  };

  const handleSignUp = async () => {
    const formData = handleSubmit(async (data: LoginAndSignUpType) => {
      await execute(async () => {
        const result = await signUpAction(data.email, data.password);

        if (!result.success) {
          throw new Error(result.message);
        }
        setNeedVerification(true);
        setUnverifiedEmail(data.email);
      });
    });
    formData();
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
  };

  return (
    <div className="bg-card w-full max-w-md space-y-6 rounded-lg border p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Track Your Running!
        </h2>
        <p className="text-muted-foreground">
          {needVerification
            ? "Verify your email to continue"
            : "Enter your credentials to login"}
        </p>
      </div>

      {error && !needVerification && <ErrorAlert message={error} />}

      {success && !needVerification && (
        <SuccessAlert
          message="Login successful! Redirecting..."
          className="bg-white pl-2"
        />
      )}

      {needVerification ? (
        <div className="space-y-4">
          <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-orange-900">
                📧 Email Verification Required
              </h3>
              <p className="text-sm text-orange-800">
                We&apos;ve sent a verification email to:
              </p>
              <p className="rounded border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-900">
                {unverifiedEmail}
              </p>
              <p className="mt-2 text-sm text-orange-800">
                Please check your inbox and click the verification link to
                activate your account.
              </p>
            </div>

            {resendSuccess && (
              <SuccessAlert message="Verification email sent! Check your inbox." />
            )}

            {resendError && <ErrorAlert message={resendError} />}

            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleBackToLogin}
                className="w-full"
              >
                ← Back to Login
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email && <ErrorAlert message={errors.email.message} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password && (
              <ErrorAlert message={errors.password.message} />
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? "Logging in..." : "Login"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignUp}
              disabled={loading}
            >
              Sign Up
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border"></div>
            <span className="text-muted-foreground text-sm">OR</span>
            <div className="flex-1 border"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("strava", { callbackUrl: "/schedule" })}
          >
            <StravaIcon className="h-5 w-5" />
            Continue with Strava
          </Button>
        </form>
      )}
    </div>
  );
}
