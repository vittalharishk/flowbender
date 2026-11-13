"use client";

import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export const seriesColors = Array.from({ length: 8 }, (_, i) => `hsl(var(--series-${i + 1}))`);

interface ChartContainerProps {
  label: string;
  height?: number;
  className?: string;
  children: React.ReactElement;
}

export function ChartContainer({ label, height = 280, className, children }: ChartContainerProps) {
  return (
    <div role="img" aria-label={label} className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
