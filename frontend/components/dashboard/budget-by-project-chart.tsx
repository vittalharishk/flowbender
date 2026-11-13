"use client";

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import type { ProjectFinancials } from "@/lib/accounts-store";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";
import { formatINR } from "@/lib/utils";

export function BudgetByProjectChart({ data }: { data: ProjectFinancials[] }) {
  const rows = data
    .filter((p) => p.approvedBudget > 0 || p.committed > 0 || p.paid > 0)
    .slice(0, 6)
    .map((p) => ({
      name: p.projectName.length > 16 ? `${p.projectName.slice(0, 15)}…` : p.projectName,
      Approved: p.approvedBudget,
      Committed: p.committed,
      Paid: p.paid,
    }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-lg font-semibold leading-none tracking-tight">Budget vs Committed vs Paid</div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="No budget data" description="Approved budgets will appear here once created." className="py-8" />
        ) : (
          <ChartContainer label="Approved budget, committed and paid amounts by project" height={300}>
            <BarChart data={rows} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v: number) => formatINR(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={70} />
              <Tooltip
                formatter={(v: number) => formatINR(v)}
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--popover-foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Approved" fill={seriesColors[1]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Committed" fill={seriesColors[0]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Paid" fill={seriesColors[2]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
