import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  gradient?: "sky" | "sun" | "rain" | "leaf";
  trend?: "up" | "down" | "flat";
  sublabel?: string;
  highlight?: boolean;
}

const gradientMap = {
  sky: "bg-gradient-sky",
  sun: "bg-gradient-sun",
  rain: "bg-gradient-rain",
  leaf: "bg-gradient-leaf",
};

export const KpiCard = ({ label, value, icon, gradient = "sky", trend, sublabel, highlight }: KpiCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-5 shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-glow",
        gradientMap[gradient],
        "text-primary-foreground"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide opacity-90">{label}</p>
          <p className="text-3xl font-bold leading-tight">{value}</p>
          {sublabel && <p className="text-xs opacity-80">{sublabel}</p>}
        </div>
        <div className="text-3xl drop-shadow-sm">{icon}</div>
      </div>
      {trend && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
          {trend === "up" ? "▲ Rising" : trend === "down" ? "▼ Falling" : "▬ Stable"}
        </div>
      )}
      {highlight && (
        <div className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-white" />
      )}
    </div>
  );
};