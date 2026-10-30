"use client";

import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn, formatINR } from "@/lib/utils";
import type { BudgetCategory, MonthlyBudgetData } from "@/lib/types";
import type { DashboardStats } from "@/lib/types";

function formatCurrency(value: number) {
  return formatINR(value);
}

function formatCurrencyFull(value: number) {
  return formatINR(value);
}

interface BudgetOverviewProps {
  stats: DashboardStats;
  categories: BudgetCategory[];
  monthlyData: MonthlyBudgetData[];
}

export function BudgetOverview({ stats, categories, monthlyData }: BudgetOverviewProps) {
  const remaining = stats.totalBudget - stats.totalSpent;
  const overallPct = stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0;

  const totalActual = monthlyData.reduce((s, m) => s + m.actual, 0);
  const totalPlanned = monthlyData.reduce((s, m) => s + m.planned, 0);
  const variance = totalPlanned - totalActual;
  const monthsWithActual = monthlyData.filter((m) => m.actual > 0).length;
  const burnRate = monthsWithActual > 0 ? Math.round(totalActual / monthsWithActual) : 0;

  const chartMax = Math.max(0, ...monthlyData.map((m) => Math.max(m.planned, m.actual)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Budget Overview</h3>
        <Link href="/dashboard/finance" className="text-sm text-primary hover:underline">Finance workspace</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Summary cards */}
        <div className="rounded-xl border bg-card p-5 space-y-5">
          {/* Total / Spent / Remaining */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrencyFull(stats.totalBudget)}</p>
            </div>

            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                  overallPct >= 90
                    ? "from-red-500 to-red-600"
                    : overallPct >= 70
                    ? "from-amber-500 to-orange-500"
                    : "from-emerald-500 to-teal-500"
                )}
                style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-sm font-semibold text-amber-400">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(remaining)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Paid Expenses</p>
                <p className="text-sm font-semibold">{formatCurrency(burnRate)}/mo</p>
              </div>
            </div>
          </div>

          {/* Variance */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Unpaid recorded expenses</span>
              <div className={cn("flex items-center gap-1 text-xs font-medium", variance > 0 ? "text-red-400" : "text-emerald-400")}>
                {variance > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatCurrency(variance)}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly spend chart */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Recorded Expenses by Month</p>
          <div className="flex items-end gap-1.5 h-[160px]">
            {monthlyData.map((m) => {
              const plannedH = chartMax > 0 ? (m.planned / chartMax) * 100 : 0;
              const actualH = chartMax > 0 ? (m.actual / chartMax) * 100 : 0;
              return (
                <div key={m.month} className="h-full min-w-0 flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 flex-1 w-full min-h-0">
                    {/* Planned */}
                    <div className="h-full flex-1 flex items-end justify-center">
                      <div
                        className="w-full max-w-[14px] rounded-t bg-muted-foreground/20 transition-all"
                        style={{ height: `${plannedH}%` }}
                      />
                    </div>
                    {/* Actual */}
                    <div className="h-full flex-1 flex items-end justify-center">
                      <div
                        className={cn(
                          "w-full max-w-[14px] rounded-t transition-all",
                          m.actual > 0
                            ? m.actual > m.planned
                              ? "bg-gradient-to-t from-red-500 to-red-400"
                              : "bg-gradient-to-t from-amber-500 to-amber-400"
                            : "bg-muted-foreground/10"
                        )}
                        style={{ height: `${actualH}%`, minHeight: m.actual > 0 ? "4px" : "0" }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.month.slice(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-5 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/20" /> Recorded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-amber-500 to-amber-400" /> Paid
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Recorded expense entries only; excludes payroll and historical budget spend.</p>
          {monthlyData.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Add expenses in Finance to populate this chart.</p>}
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">By Category</p>
          <div className="space-y-3">
            {categories.map((cat) => {
              const pct = cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 100) : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="text-muted-foreground ml-2">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && <p className="text-sm text-muted-foreground">No budget categories recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
