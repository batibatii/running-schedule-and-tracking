import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    emailVerified?: Date | null;
  }
  interface Session {
    user: {
      id: string;
      emailVerified?: Date | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    name?: string;
    emailVerified?: Date | null;
    stravaAccessToken?: string;
    stravaRefreshToken?: string;
    stravaExpiresAt?: number;
  }
}
