"use client";

import { WeeklySchedule } from "@/components/schedule/WeeklySchedule";
import { TopBar } from "@/components/schedule/TopBar";

export default function Schedule() {
  return (
    <div className="mx-auto max-w-4/6 px-8 py-8">
      <TopBar />
      <WeeklySchedule />
    </div>
  );
}
