"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { StravaIcon } from "@/components/StravaIcon";
import { disconnectStravaAction } from "@/app/actions/strava";
import { withToastError } from "@/lib/utils/errorClient";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Schedule", href: "/schedule" },
  { label: "Metrics", href: "/workouts" },
  { label: "Profile", href: "/settings" },
];

export function TopBar() {
  const pathname = usePathname();
  const { data: session, update } = useSession();

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
      {/* Left — Wordmark */}
      <Link
        href="/schedule"
        className="font-display text-[28px] leading-none tracking-[-0.01em] italic"
      >
        Grind<span className="text-coral-deep">&amp;</span>Track
      </Link>

      {/* Center — Pill nav */}
      <nav className="border-line bg-surface flex items-center gap-0.5 rounded-full border p-1">
        {NAV_ITEMS.map((navItem) => {
          const isActive = pathname === navItem.href;
          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              className={`rounded-full px-4 py-2 transition-colors ${
                isActive
                  ? "font-display text-coral-deep text-[16px] italic"
                  : "text-ink-soft hover:bg-bg-soft text-[13px] font-medium"
              }`}
            >
              {navItem.label}
            </Link>
          );
        })}
      </nav>

      {/* Right — Strava + logout + avatar */}
      <div className="flex items-center gap-2.5">
        {session?.user?.stravaConnected ? (
          <Button
            variant="outline"
            onClick={async () => {
              const result = await withToastError(async () => {
                const res = await disconnectStravaAction();
                if (!res.success) throw new Error(res.message);
                return true as const;
              }, "Failed to disconnect Strava");
              if (result) {
                toast.success("Strava disconnected");
                update();
              }
            }}
            title="Disconnect from Strava"
            className="border-line bg-bg-soft text-ink-soft hover:bg-bg-soft gap-1.75 rounded-full px-3.5 py-2.5 text-xs font-semibold"
          >
            <span className="bg-mint-deep h-1.5 w-1.5 rounded-full" />
            <StravaIcon className="h-3 w-3 text-[#FC4C02]" />
            Disconnect
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/api/strava/connect";
            }}
            title="Connect to Strava"
            className="border-line bg-bg-soft text-ink-soft hover:bg-bg-soft gap-1.75 rounded-full px-3.5 py-2.5 text-xs font-semibold"
          >
            <StravaIcon className="h-3 w-3 text-[#FC4C02]" />
            Connect to Strava
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="border-line bg-bg-soft text-ink-soft hover:bg-bg-soft rounded-full px-3.5 py-2.5 text-xs font-semibold"
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
