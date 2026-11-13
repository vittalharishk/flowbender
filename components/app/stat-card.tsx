import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  compact?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, hint, trend, compact, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card", compact ? "p-3" : "p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums">{value}</p>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
          {trend && (
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {trend.positive ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
            <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
