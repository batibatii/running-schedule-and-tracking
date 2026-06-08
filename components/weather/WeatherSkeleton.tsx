export function WeatherSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="wx-shimmer h-10.5 w-10.5 rounded-full" />
        <div className="wx-shimmer h-8.5 w-24 rounded-sm" />
        <div className="wx-shimmer ml-auto h-7 w-13.5 rounded-sm" />
      </div>

      <div className="wx-shimmer h-4 w-[70%] rounded-full" />

      <div className="grid grid-cols-7 gap-2 border-t border-line pt-3.5">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="wx-shimmer h-27.5 rounded-md" />
        ))}
      </div>
    </div>
  );
}
