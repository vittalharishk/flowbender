"use client";

import { AlertOctagon, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ProductionAlert } from "@/lib/types";

const severityConfig: Record<ProductionAlert["severity"], { icon: typeof Info; border: string; bg: string; iconColor: string }> = {
  critical: {
    icon: AlertOctagon,
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    iconColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-400",
  },
  info: {
    icon: Info,
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-400",
  },
};

interface ProductionAlertsProps {
  alerts: (ProductionAlert & { href: string })[];
}

export function ProductionAlerts({ alerts }: ProductionAlertsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Production Alerts</h3>
        <span className="text-xs text-muted-foreground">
          {alerts.filter((a) => a.severity === "critical").length} critical
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border p-4 transition-all hover:shadow-md",
                config.border,
                config.bg
              )}
            >
              <div className="flex gap-3">
                <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.iconColor)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{alert.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-muted-foreground/70">{alert.project}</span>
                    {alert.actionLabel && (
                      <Link href={alert.href} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                        {alert.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && <p className="rounded-xl border p-6 text-sm text-muted-foreground">No blocked or high-priority production tasks.</p>}
      </div>
    </div>
  );
}
