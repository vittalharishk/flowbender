"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/60 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1.5 font-medium", trend.positive ? "text-emerald-400" : "text-red-400")}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-600/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-amber-500" />
        </div>
      </div>
    </div>
  );
}
