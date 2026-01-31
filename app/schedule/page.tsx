"use client";

import { WeeklySchedule } from "@/components/schedule/WeeklySchedule";
import PillNav from "@/components/PillNav";
import { logoutAction } from "@/app/actions/auth";

export default function Schedule() {
  return (
    <>
      {" "}
      <div className="w-full flex justify-end">
        {" "}
        <PillNav
          logo="/running-man-icon.svg"
          logoAlt="Running Schedule Logo"
          items={[
            { label: "Schedule", href: "/schedule" },
            { label: "Metrics", href: "/workouts" },
            { label: "Profile", href: "/settings" },
            { label: "Logout", href: "#", onClick: () => logoutAction() },
          ]}
          activeHref="/schedule"
          baseColor="#f97316"
          pillColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#000000"
          initialLoadAnimation
        />
      </div>
      <main className="container mx-auto py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Training Schedule</h1>
          <p className="text-muted-foreground mt-2">
            Plan your weekly running workouts
          </p>
        </div>
        <WeeklySchedule />
      </main>
    </>
  );
}
