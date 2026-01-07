"use client";

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

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginAndSignUpType>({
    resolver: zodResolver(LoginAndSignUpSchema),
  });

  const onSubmit = async (data: LoginAndSignUpType) => {
    console.log("Form submitted:", data);
    // TODO: Add your authentication logic here later
  };

  const handleSignUp = () => {
    console.log("Sign up clicked");
    // TODO: Add navigation to sign up page later
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Track Your Running!
        </h2>
        <p className="text-muted-foreground">Enter your credentials to login</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
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

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register("password")}
          />
          {errors.email && <ErrorAlert message={errors.email.message} />}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button type="submit" className="w-full " disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSignUp}
          >
            Sign Up
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <div className="border flex-1"></div>
          <span className="text-sm text-muted-foreground">OR</span>
          <div className="border flex-1"></div>
        </div>

        {/* Social Login Section */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            // TODO: Add Strava OAuth login logic here
            console.log("Strava login clicked");
          }}
        >
          <StravaIcon className="w-5 h-5" />
          Continue with Strava
        </Button>
      </form>
    </div>
  );
}
