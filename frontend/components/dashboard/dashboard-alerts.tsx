"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { BudgetAlert } from "@/lib/accounts-store";
import type { InsurancePolicy } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneStyles = {
  critical: "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400",
} as const;

interface DashboardAlertsProps {
  budgetAlerts: BudgetAlert[];
  expiringPolicies: InsurancePolicy[];
}

export function DashboardAlerts({ budgetAlerts, expiringPolicies }: DashboardAlertsProps) {
  const items = [
    ...budgetAlerts.slice(0, 4).map((alert) => ({
      id: alert.id,
      tone: alert.type,
      title: alert.projectName,
      message: alert.message,
      href: `/dashboard/projects/${alert.projectId}/accounts`,
    })),
    ...expiringPolicies.slice(0, 2).map((policy) => ({
      id: `policy-${policy.id}`,
      tone: "warning" as const,
      title: `${policy.policyType.replace(/-/g, " ")} policy expiring`,
      message: `${policy.policyNumber} expires on ${policy.endDate}`,
      href: "/dashboard/accounts",
    })),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
          <ShieldAlert className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Alerts
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            No budget or policy alerts.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const Icon = item.tone === "info" ? Info : AlertTriangle;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-start gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                      toneStyles[item.tone]
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-medium capitalize text-foreground">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{item.message}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
