import { Workout } from "@/types/workout";
import { formatDuration } from "@/lib/utils/date";

interface StatsStripProps {
  workouts: Workout[];
}

export function StatsStrip({ workouts }: StatsStripProps) {
  const totalPlanned = workouts.length;
  const totalCompleted = workouts.filter((workout) => workout.completed).length;
  const totalDistance = workouts.reduce(
    (sum, workout) => sum + (workout.distance ?? 0),
    0,
  );
  const totalDuration = workouts.reduce(
    (sum, workout) => sum + (workout.duration ?? 0),
    0,
  );

  const stats = [
    {
      label: "Planned",
      value: String(totalPlanned),
      subtitle: totalPlanned === 1 ? "workout" : "workouts",
    },
    {
      label: "Distance",
      value: String(Math.round(totalDistance)),
      subtitle: "km this week",
    },
    {
      label: "Duration",
      value: formatDuration(totalDuration),
      subtitle: "time",
    },
    {
      label: "Completed",
      value: `${totalCompleted}/${totalPlanned}`,
      subtitle:
        totalCompleted >= totalPlanned && totalPlanned > 0
          ? "done"
          : "on track",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-line bg-surface rounded-[18px] border px-4 py-3.5"
        >
          <div className="text-ink-faint text-[11px] tracking-[0.08em] uppercase">
            {stat.label}
          </div>
          <div className="mt-0.5 font-mono text-2xl font-medium">
            {stat.value}
          </div>
          <div className="text-ink-soft mt-px text-[11px]">{stat.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
