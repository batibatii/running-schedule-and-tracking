import { db } from "@/lib/db";
import { verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function generateVerificationToken(): string {
  const hexString = crypto.randomBytes(32).toString("hex");
  return hexString;
}

export async function createVerificationToken(email: string) {
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));
  const token = generateVerificationToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .insert(verificationTokens)
    .values({ identifier: email, token, expires });
  return token;
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const [verificationToken] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token));

    if (!verificationToken) {
      return null;
    }

    if (verificationToken.expires.getTime() < Date.now()) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
      return null;
    }

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));
    return verificationToken.identifier;
  } catch (error) {
    console.error("Failed to verify token:", error);
    throw error;
  }
}
