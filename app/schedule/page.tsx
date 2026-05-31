"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { WeeklySchedule } from "@/components/schedule/WeeklySchedule";
import { TopBar } from "@/components/schedule/TopBar";

function StravaToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("strava") === "connected") {
      toast.success("Strava connected successfully!");
      window.history.replaceState({}, "", "/schedule");
    }
  }, [searchParams]);

  return null;
}

export default function Schedule() {
  return (
    <div className="mx-auto max-w-4/6 px-8 py-8">
      <Suspense>
        <StravaToastHandler />
      </Suspense>
      <TopBar />
      <WeeklySchedule />
    </div>
  );
}
