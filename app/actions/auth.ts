"use server";

import { getUserByEmail, createUser } from "@/lib/dal/users";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/email";
import { ResendVerificationSchema } from "@/types/authValidation";
import bcrypt from "bcrypt";

interface AuthResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function signUpAction(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        message: "User already exists",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await createUser({ email, hashedPassword });

    const token = await createVerificationToken(email);

    const emailResult = await sendVerificationEmail({ email, token });

    if (!emailResult.success) {
      console.error("Failed to send verification email:", email);
      // User is created but email failed - they can use resend endpoint
    }

    return {
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: "Failed to create account",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.session-token");
  cookieStore.delete("next-auth.csrf-token");
  cookieStore.delete("__Host-next-auth.csrf-token");

  redirect("/");
}

export async function resendVerificationAction(
  email: string,
): Promise<AuthResult> {
  try {
    const validationResult = ResendVerificationSchema.safeParse({ email });

    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.error.issues[0].message,
      };
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return {
        success: false,
        message: "No account found with this email",
      };
    }

    if (user.emailVerified !== null) {
      return {
        success: false,
        message: "Email is already verified",
      };
    }

    const token = await createVerificationToken(email);
    const emailResult = await sendVerificationEmail({ email, token });

    if (!emailResult.success) {
      return {
        success: false,
        message: "Failed to send email. Please try again",
      };
    }

    return {
      success: true,
      message: "Verification email sent! Check your inbox",
    };
  } catch (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      message: "An error occurred while sending verification email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
