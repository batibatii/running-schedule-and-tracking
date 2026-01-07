"use server";

import { getUserByEmail, createUser } from "@/lib/dal/users";
import { hashPassword } from "@/lib/password";

interface AuthResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function signUpAction(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const isUserExist = await getUserByEmail(email);
    if (isUserExist) {
      return {
        success: false,
        message: "User already exists",
      };
    }
    const hashedPassword = await hashPassword(password);

    await createUser({ email, password: hashedPassword });

    return {
      success: true,
      message: "Account created successfully!",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create account",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
