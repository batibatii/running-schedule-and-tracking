"use client";

// Wrapper component

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
