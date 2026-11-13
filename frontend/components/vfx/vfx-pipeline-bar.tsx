"use client";

import type { VfxShotStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { vfxStatusLabels, vfxStatusOrder } from "./vfx-status";

const segmentClasses: Record<VfxShotStatus, string> = {
  briefed: "bg-slate-400 dark:bg-slate-500",
  "in-progress": "bg-amber-500",
  "client-review": "bg-blue-500",
  final: "bg-emerald-500",
};

interface VfxPipelineBarProps {
  counts: Record<VfxShotStatus, number>;
  total: number;
  className?: string;
}

export function VfxPipelineBar({ counts, total, className }: VfxPipelineBarProps) {
  const completion = total > 0 ? Math.round((counts.final / total) * 100) : 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Shot pipeline</h3>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{completion}%</span> finalled
        </span>
      </div>

      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Shot pipeline: ${vfxStatusOrder
          .map((s) => `${counts[s]} ${vfxStatusLabels[s]}`)
          .join(", ")} of ${total} total shots`}
      >
        {total > 0 &&
          vfxStatusOrder.map((status) =>
            counts[status] > 0 ? (
              <div
                key={status}
                className={segmentClasses[status]}
                style={{ width: `${(counts[status] / total) * 100}%` }}
              />
            ) : null
          )}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {vfxStatusOrder.map((status) => (
          <li key={status} className="flex items-center gap-1.5 text-xs">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", segmentClasses[status])} aria-hidden="true" />
            <span className="text-muted-foreground">{vfxStatusLabels[status]}</span>
            <span className="font-semibold tabular-nums">{counts[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
