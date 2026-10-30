import { cn } from "@/lib/utils";
import type { ProductionStatus } from "@/lib/types";

const statusStyles: Record<ProductionStatus, string> = {
  development: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "pre-production": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  production: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "post-production": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  completed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "on-hold": "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const statusLabels: Record<ProductionStatus, string> = {
  development: "Development",
  "pre-production": "Pre-Production",
  production: "In Production",
  "post-production": "Post-Production",
  completed: "Completed",
  "on-hold": "On Hold",
};

interface ProductionBadgeProps {
  status: ProductionStatus;
  className?: string;
}

export function ProductionBadge({ status, className }: ProductionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
