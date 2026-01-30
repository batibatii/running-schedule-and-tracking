import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVerificationEmailParams {
  email: string;
  token: string;
}

export async function sendVerificationEmail({
  email,
  token,
}: SendVerificationEmailParams) {
  const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email address</h2>
          <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
          <a
            href="${verificationUrl}"
            style="display: inline-block; padding: 12px 24px; background-color: #eb570b; color: white; text-decoration: none; border-radius: 22px; margin: 20px 0;"
          >
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
}
