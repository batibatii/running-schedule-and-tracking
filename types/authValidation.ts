import { z } from "zod";

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const emailValidation = z
  .string()
  .min(1, "Email is required")
  .regex(emailRegex, "Please enter a valid email address");

const passwordValidation = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long");

export const LoginAndSignUpSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordValidation,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

export type LoginAndSignUpType = z.infer<typeof LoginAndSignUpSchema>;
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
