import { WeeklySchedule } from "@/components/schedule/WeeklySchedule";

export default function Schedule() {
  return (
    <main className="container mx-auto py-22">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Training Schedule</h1>
        <p className="text-muted-foreground mt-2">
          Plan your weekly running workouts
        </p>
      </div>
      <WeeklySchedule />
    </main>
  );
}
