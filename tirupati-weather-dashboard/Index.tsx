import { useMemo, useState } from "react";
import { useWeather, WeatherRow } from "@/hooks/useWeather";
import { KpiCard } from "@/components/weather/KpiCard";
import { WeatherMap } from "@/components/weather/WeatherMap";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

const RANGE_OPTIONS = [
  { v: "7", label: "Last 7 days" },
  { v: "30", label: "Last 30 days" },
  { v: "90", label: "Last 90 days" },
];

const CONDITION_OPTIONS = [
  { v: "all", label: "All conditions" },
  { v: "rain", label: "Rainy hours" },
  { v: "hot", label: "Hot (>30°C)" },
  { v: "cool", label: "Cool (<22°C)" },
  { v: "windy", label: "Windy (>15 km/h)" },
];

const Index = () => {
  const { data, loading, error, refresh } = useWeather();
  const [range, setRange] = useState("30");
  const [month, setMonth] = useState("all");
  const [condition, setCondition] = useState("all");

  const monthOptions = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.rows.map((r) => r.date.slice(0, 7)));
    return [{ v: "all", label: "All months" }, ...Array.from(set).sort().map((m) => ({ v: m, label: format(parseISO(m + "-01"), "MMM yyyy") }))];
  }, [data]);

  const filtered: WeatherRow[] = useMemo(() => {
    if (!data) return [];
    const days = parseInt(range, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return data.rows.filter((r) => {
      const t = new Date(r.datetime).getTime();
      if (t < cutoff) return false;
      if (month !== "all" && !r.date.startsWith(month)) return false;
      if (condition === "rain" && r.precipitation <= 0) return false;
      if (condition === "hot" && r.temperature <= 30) return false;
      if (condition === "cool" && r.temperature >= 22) return false;
      if (condition === "windy" && r.windSpeed <= 15) return false;
      return true;
    });
  }, [data, range, month, condition]);

  const kpis = useMemo(() => {
    if (!filtered.length) return null;
    const temps = filtered.map((r) => r.temperature);
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
    // trend: compare last 7d avg vs prior 7d
    const sorted = [...filtered].sort((a, b) => a.datetime.localeCompare(b.datetime));
    const split = Math.floor(sorted.length / 2);
    const firstHalf = avg(sorted.slice(0, split).map((r) => r.temperature));
    const secondHalf = avg(sorted.slice(split).map((r) => r.temperature));
    const diff = secondHalf - firstHalf;
    const trend: "up" | "down" | "flat" = diff > 0.5 ? "up" : diff < -0.5 ? "down" : "flat";
    // hottest / coolest day
    const byDay = new Map<string, number[]>();
    filtered.forEach((r) => {
      if (!byDay.has(r.date)) byDay.set(r.date, []);
      byDay.get(r.date)!.push(r.temperature);
    });
    let hottest = { date: "", t: -Infinity };
    let coolest = { date: "", t: Infinity };
    byDay.forEach((arr, d) => {
      const m = Math.max(...arr);
      const mn = Math.min(...arr);
      if (m > hottest.t) hottest = { date: d, t: m };
      if (mn < coolest.t) coolest = { date: d, t: mn };
    });
    return {
      avgTemp: avg(temps),
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      totalRain: sum(filtered.map((r) => r.precipitation)),
      avgHumidity: avg(filtered.map((r) => r.humidity)),
      maxWind: Math.max(...filtered.map((r) => r.windSpeed)),
      trend,
      hottest,
      coolest,
    };
  }, [filtered]);

  // Daily aggregation for line/area
  const daily = useMemo(() => {
    const map = new Map<string, { date: string; temps: number[]; rain: number; hum: number[]; wind: number[] }>();
    filtered.forEach((r) => {
      if (!map.has(r.date)) map.set(r.date, { date: r.date, temps: [], rain: 0, hum: [], wind: [] });
      const e = map.get(r.date)!;
      e.temps.push(r.temperature);
      e.rain += r.precipitation;
      e.hum.push(r.humidity);
      e.wind.push(r.windSpeed);
    });
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: e.date,
        label: format(parseISO(e.date), "MMM d"),
        avgTemp: +(e.temps.reduce((s, v) => s + v, 0) / e.temps.length).toFixed(1),
        maxTemp: +Math.max(...e.temps).toFixed(1),
        minTemp: +Math.min(...e.temps).toFixed(1),
        rain: +e.rain.toFixed(2),
        humidity: +(e.hum.reduce((s, v) => s + v, 0) / e.hum.length).toFixed(0),
        wind: +(e.wind.reduce((s, v) => s + v, 0) / e.wind.length).toFixed(1),
      }));
  }, [filtered]);

  const monthly = useMemo(() => {
    const map = new Map<string, number[]>();
    filtered.forEach((r) => {
      const m = r.date.slice(0, 7);
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(r.temperature);
    });
    return Array.from(map.entries())
      .sort()
      .map(([m, arr]) => ({
        month: format(parseISO(m + "-01"), "MMM yyyy"),
        avgTemp: +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1),
      }));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-bg">
      <header className="border-b bg-white/60 backdrop-blur-md">
        <div className="container flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              🌤️ Tirupati Weather Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Live dashboard · Open-Meteo API · Rolling 90-day window
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <Badge variant="secondary" className="gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-wind" />
                Updated {format(data.lastUpdated, "HH:mm:ss")}
              </Badge>
            )}
            <Button onClick={refresh} variant="outline" size="sm">
              ↻ Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Error: {error}
          </div>
        )}

        {/* Slicers */}
        <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4 shadow-card">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date range</label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Condition</label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-end text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} data points · {data?.latitude}°N, {data?.longitude}°E
          </div>
        </div>

        {loading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : kpis && data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Current Temperature"
                value={`${data.current?.temperature.toFixed(1) ?? "--"}°C`}
                icon="🌡️"
                gradient="sun"
                sublabel="Live reading"
                highlight
              />
              <KpiCard
                label="Average Temperature"
                value={`${kpis.avgTemp.toFixed(1)}°C`}
                icon="📊"
                gradient="sky"
                trend={kpis.trend}
              />
              <KpiCard label="Max Temperature" value={`${kpis.maxTemp.toFixed(1)}°C`} icon="🔥" gradient="sun" sublabel={kpis.hottest.date} />
              <KpiCard label="Min Temperature" value={`${kpis.minTemp.toFixed(1)}°C`} icon="❄️" gradient="sky" sublabel={kpis.coolest.date} />
              <KpiCard label="Total Rainfall" value={`${kpis.totalRain.toFixed(1)} mm`} icon="🌧️" gradient="rain" />
              <KpiCard label="Avg Humidity" value={`${kpis.avgHumidity.toFixed(0)}%`} icon="💧" gradient="rain" />
              <KpiCard label="Max Wind Speed" value={`${kpis.maxWind.toFixed(1)} km/h`} icon="🌬️" gradient="leaf" />
              <KpiCard label="Hottest / Coolest" value={`${kpis.hottest.t.toFixed(0)}° / ${kpis.coolest.t.toFixed(0)}°`} icon="🌞" gradient="leaf" sublabel="extremes in range" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="🌡️ Temperature Trend" subtitle="Daily min / avg / max">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} unit="°" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="maxTemp" name="Max" stroke="hsl(var(--hot))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="avgTemp" name="Avg" stroke="hsl(var(--temp))" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="minTemp" name="Min" stroke="hsl(var(--cold))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="🗺️ Tirupati Live Map" subtitle="Click marker for current conditions">
                <WeatherMap
                  lat={data.latitude}
                  lon={data.longitude}
                  city={data.city}
                  temperature={data.current?.temperature ?? null}
                  humidity={filtered.length ? filtered[filtered.length - 1].humidity : null}
                  windSpeed={filtered.length ? filtered[filtered.length - 1].windSpeed : null}
                  lastUpdated={data.lastUpdated}
                />
              </ChartCard>

              <ChartCard title="📊 Monthly Avg Temperature" subtitle="Month over month">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="°" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="avgTemp" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="🌡️ Temperature vs 💧 Humidity" subtitle="Combo correlation">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="°" />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="r" dataKey="humidity" name="Humidity" fill="hsl(var(--humidity))" opacity={0.5} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="l" type="monotone" dataKey="avgTemp" name="Temp" stroke="hsl(var(--temp))" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <footer className="pt-4 text-center text-xs text-muted-foreground">
              Auto-refresh every 30 min · Data © Open-Meteo · {data.city} ({data.latitude}, {data.longitude})
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="rounded-xl border bg-card p-5 shadow-card">
    <div className="mb-4">
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default Index;
