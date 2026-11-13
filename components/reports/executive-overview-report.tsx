"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/lib/project-store";
import { useProjectBudgets, useDepartmentBudgets } from "@/lib/accounts-store";
import { useDistributionRevenue } from "@/lib/distribution-store";
import { useScenesByProject } from "@/lib/scene-store";
import { IndianRupee, TrendingUp, TrendingDown, Film, CheckCircle, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "pre-production": "bg-blue-500/15 text-blue-500",
  production: "bg-amber-500/15 text-amber-500",
  "post-production": "bg-purple-500/15 text-purple-500",
  completed: "bg-green-500/15 text-green-500",
};

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#ec4899", "#06b6d4"];

function formatCurrency(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function ExecutiveOverviewReport() {
  const projects = useProjects();
  const budgets = useProjectBudgets();
  const deptBudgets = useDepartmentBudgets();
  const revenue = useDistributionRevenue();

  const portfolio = useMemo(() => {
    const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
    const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);
    const totalRevenue = revenue.reduce((s, r) => s + (r.amount || 0), 0);
    return { totalBudget, totalSpent, totalRevenue, netPosition: totalRevenue - totalSpent };
  }, [projects, revenue]);

  const projectCards = useMemo(() => {
    return projects.map((p) => {
      const budgetUsed = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
      const rev = revenue.filter((r) => r.projectId === p.id).reduce((s, r) => s + (r.amount || 0), 0);
      return { ...p, budgetUsed, revenue: rev };
    });
  }, [projects, revenue]);

  const budgetVsActual = useMemo(() => {
    return projects.map((p) => ({
      name: p.title.length > 15 ? p.title.slice(0, 15) + "…" : p.title,
      budget: p.budget,
      spent: p.spent,
    }));
  }, [projects]);

  const revenueBySource = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of revenue) {
      const key = r.revenueType || "other";
      map[key] = (map[key] || 0) + (r.amount || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [revenue]);

  return (
    <div className="space-y-6">
      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Budget" value={formatCurrency(portfolio.totalBudget)} icon={IndianRupee} />
        <KpiCard label="Total Spent" value={formatCurrency(portfolio.totalSpent)} icon={TrendingDown} variant="warning" />
        <KpiCard label="Total Revenue" value={formatCurrency(portfolio.totalRevenue)} icon={TrendingUp} variant="success" />
        <KpiCard
          label="Net Position"
          value={formatCurrency(Math.abs(portfolio.netPosition))}
          icon={portfolio.netPosition >= 0 ? TrendingUp : TrendingDown}
          variant={portfolio.netPosition >= 0 ? "success" : "danger"}
          prefix={portfolio.netPosition >= 0 ? "+" : "-"}
        />
      </div>

      {/* Project Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectCards.map((p) => (
          <Card key={p.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <Badge className={STATUS_COLORS[p.status] || "bg-muted text-muted-foreground"} variant="secondary">
                  {p.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Budget utilization</span>
                <span>{p.budgetUsed}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${p.budgetUsed > 90 ? "bg-red-500" : p.budgetUsed > 70 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(p.budgetUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Spent: {formatCurrency(p.spent)}</span>
                <span className="text-muted-foreground">Revenue: {formatCurrency(p.revenue)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><div className="text-sm font-semibold">Budget vs Actual Spend</div></CardHeader>
          <CardContent>
            {budgetVsActual.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetVsActual} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" fill="#f59e0b" name="Spent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No budget data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="text-sm font-semibold">Revenue by Source</div></CardHeader>
          <CardContent>
            {revenueBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={revenueBySource} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenueBySource.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No revenue data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, variant, prefix }: {
  label: string; value: string; icon: typeof IndianRupee;
  variant?: "success" | "warning" | "danger"; prefix?: string;
}) {
  const colors = {
    success: "text-green-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  };
  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-4 h-4 ${variant ? colors[variant] : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-xl font-bold ${variant ? colors[variant] : ""}`}>{prefix}{value}</p>
      </CardContent>
    </Card>
  );
}
