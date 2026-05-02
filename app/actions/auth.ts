"use server";

import { getUserByEmail, createUser } from "@/lib/dal/users";
import {
  createVerificationToken,
  getVerificationTokenByEmail,
} from "@/lib/dal/verificationToken";
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

    const existingToken = await getVerificationTokenByEmail(email);

    if (existingToken) {
      const tokenAge = Date.now() - existingToken.createdAt.getTime();
      const ONE_MINUTE = 60 * 1000;

      if (tokenAge < ONE_MINUTE) {
        return {
          success: false,
          message: "Please wait a minute before requesting another email",
        };
      }
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
