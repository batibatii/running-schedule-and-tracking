"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Schedule", href: "/schedule" },
  { label: "Metrics", href: "/workouts" },
  { label: "Profile", href: "/settings" },
];

function RunIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="14" cy="5" r="2" />
      <path d="M9 22l2-6 4-3-3-3-3 3-3-1" />
      <path d="M16 13l3 3-2 5" />
    </svg>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex items-center justify-between">
      {/* Left — Logo */}
      <Link href="/schedule" className="flex items-center gap-2.5">
        <div className="bg-foreground text-peach flex h-9 w-9 items-center justify-center rounded-full">
          <RunIcon size={18} />
        </div>
        <span className="font-display text-[22px] leading-none">Pacely</span>
      </Link>

      {/* Center — Pill nav */}
      <nav className="border-line bg-surface flex items-center gap-1 rounded-full border p-1">
        {NAV_ITEMS.map((navItem) => {
          const isActive = pathname === navItem.href;
          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-bg-soft"
              }`}
            >
              {navItem.label}
            </Link>
          );
        })}
      </nav>

      {/* Right — Avatar + logout */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="border-line bg-surface text-ink-soft hover:bg-bg-soft rounded-full px-3.5 py-2 text-sm font-semibold hover:shadow-lg active:translate-y-0.5 active:shadow-[inset_0_0_0_3px_white]"
        >
          Sign out
        </Button>
        <div className="bg-peach flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold">
          {initials}
        </div>
      </div>
    </div>
  );
}
