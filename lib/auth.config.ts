import { randomUUID } from "crypto";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { SESSION_MAX_AGE_7DAYS_SECONDS } from "@/lib/constants/timing";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email));

        if (!user || !user.password) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    {
      id: "strava",
      name: "Strava",
      type: "oauth",
      authorization: {
        url: "https://www.strava.com/oauth/authorize",
        params: { scope: "read,activity:read_all", response_type: "code" },
      },
      token: "https://www.strava.com/api/v3/oauth/token",
      userinfo: "https://www.strava.com/api/v3/athlete",
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      // Strava requires credentials in POST body, not Basic Auth header
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      profile(profile) {
        return {
          id: randomUUID(), // Must be a valid UUID for our users table
          name: `${profile.firstname} ${profile.lastname}`,
          email: null, // Strava does not provide email
          image: profile.profile,
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_7DAYS_SECONDS,
  },
  pages: {
    signIn: "/",
    error: "/", // Redirect OAuth errors (e.g. user cancelled) to login page
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
      }

      // Re-fetch emailVerified on session update (email/password users only)
      if (trigger === "update" && token.email) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email as string));
        if (dbUser) {
          token.emailVerified = dbUser.emailVerified;
        }
      }

      // Copy Strava tokens into JWT on initial OAuth sign-in
      if (account?.provider === "strava") {
        token.stravaAccessToken = account.access_token;
        token.stravaRefreshToken = account.refresh_token;
        token.stravaExpiresAt = account.expires_at;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified as Date | null;

        // Derive stravaConnected from DB (not stale JWT claims)
        const [stravaAccount] = await db
          .select({ provider: accounts.provider })
          .from(accounts)
          .where(
            and(
              eq(accounts.provider, "strava"),
              eq(accounts.userId, token.id as string),
            ),
          );
        session.user.stravaConnected = !!stravaAccount;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
