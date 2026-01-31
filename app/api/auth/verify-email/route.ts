import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verification-token";
import { markEmailAsVerified } from "@/lib/dal/users";

/**
 * GET /api/auth/verify-email?token=xxx
 * Verifies user's email address using the token from the email link
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token)
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );

    const verifiedEmail = await verifyToken(token);

    if (verifiedEmail === null)
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );

    const updatedUser = await markEmailAsVerified(verifiedEmail);

    if (!updatedUser)
      return NextResponse.json({ error: "User not found!" }, { status: 404 });

    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("verified", "true");
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during email verification" },
      { status: 500 },
    );
  }
}
