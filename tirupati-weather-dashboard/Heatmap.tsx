import { WeatherRow } from "@/hooks/useWeather";
import { useMemo } from "react";

interface HeatmapProps {
  rows: WeatherRow[];
}

export const Heatmap = ({ rows }: HeatmapProps) => {
  const { dates, matrix, min, max } = useMemo(() => {
    // Take last 30 days
    const byDate = new Map<string, (number | null)[]>();
    rows.forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, Array(24).fill(null));
      const hour = parseInt(r.time.slice(0, 2), 10);
      byDate.get(r.date)![hour] = r.temperature;
    });
    const allDates = Array.from(byDate.keys()).sort().slice(-30);
    const matrix = allDates.map((d) => byDate.get(d)!);
    const flat = matrix.flat().filter((v): v is number => v !== null);
    return {
      dates: allDates,
      matrix,
      min: Math.min(...flat),
      max: Math.max(...flat),
    };
  }, [rows]);

  const colorFor = (v: number | null) => {
    if (v === null) return "hsl(var(--muted))";
    const t = (v - min) / (max - min || 1);
    // blue → green → orange → red
    const hue = 220 - t * 220;
    return `hsl(${hue}, 80%, 55%)`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex gap-[2px] pl-20 pb-1">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="w-4 text-center text-[9px] text-muted-foreground">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={dates[i]} className="flex items-center gap-[2px]">
            <div className="w-20 pr-2 text-right text-[10px] text-muted-foreground">
              {dates[i].slice(5)}
            </div>
            {row.map((v, h) => (
              <div
                key={h}
                title={v !== null ? `${dates[i]} ${h}:00 — ${v.toFixed(1)}°C` : "no data"}
                className="h-4 w-4 rounded-sm transition-transform hover:scale-150"
                style={{ background: colorFor(v) }}
              />
            ))}
          </div>
        ))}
        <div className="mt-3 flex items-center gap-2 pl-20 text-xs text-muted-foreground">
          <span>{min.toFixed(0)}°C</span>
          <div
            className="h-2 w-40 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, hsl(220,80%,55%), hsl(165,80%,55%), hsl(110,80%,55%), hsl(55,80%,55%), hsl(0,80%,55%))",
            }}
          />
          <span>{max.toFixed(0)}°C</span>
        </div>
      </div>
    </div>
  );
};