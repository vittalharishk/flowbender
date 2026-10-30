"use client";

import {
  FileText,
  CheckCircle2,
  DollarSign,
  CalendarDays,
  UserPlus,
  Eye,
} from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useState } from "react";
import type { ActivityItem } from "@/lib/types";

const activityConfig: Record<ActivityItem["type"], { icon: typeof FileText; color: string }> = {
  "call-sheet": { icon: FileText, color: "text-blue-400 bg-blue-500/10" },
  "scene-completed": { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
  expense: { icon: DollarSign, color: "text-amber-400 bg-amber-500/10" },
  schedule: { icon: CalendarDays, color: "text-cyan-400 bg-cyan-500/10" },
  cast: { icon: UserPlus, color: "text-rose-400 bg-rose-500/10" },
  review: { icon: Eye, color: "text-violet-400 bg-violet-500/10" },
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Records</h3>
        {activities.length > 6 && <button onClick={() => setExpanded(!expanded)} className="text-sm text-primary hover:underline">{expanded ? "Show less" : "View all"}</button>}
      </div>
      <div className="rounded-xl border bg-card divide-y">
        {(expanded ? activities : activities.slice(0, 6)).map((item) => {
          const config = activityConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  config.color
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatRelativeDate(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground/70">
                  <span>{item.project}</span>
                  <span>&middot;</span>
                  <span>{item.user}</span>
                </div>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && <p className="p-6 text-sm text-muted-foreground">No script or expense records yet.</p>}
      </div>
    </div>
  );
}
