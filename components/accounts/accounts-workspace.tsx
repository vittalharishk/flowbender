"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp, Wallet, PiggyBank, AlertCircle,
  FileText, BarChart3, Clock, CheckCircle2,
  ArrowUpRight, ArrowDownRight, ShoppingCart,
} from "lucide-react";
import { useAccountsDashboard } from "@/lib/accounts-store";
import { formatCurrency, formatCompactINR } from "@/lib/accounts-departments";
import type { ProjectFinancials, DepartmentFinancials, CategoryFinancials, PendingApproval } from "@/lib/accounts-store";
import { BudgetManagement } from "./budget-management";
import { ExpensesRegister } from "./expenses-register";
import { PurchaseOrdersWorkspace } from "./purchase-orders-workspace";
import { VendorsWorkspace } from "./vendors-workspace";
import { InsuranceWorkspace } from "./insurance-workspace";

interface Props {
  projectId?: string;
}

function statusLabel(s: string) {
  return s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards({ dashboard }: { dashboard: ReturnType<typeof useAccountsDashboard> }) {
  const { summary } = dashboard;
  const cards = [
    { label: "Approved Budget", value: summary.totalApprovedBudget, icon: Wallet, color: "text-blue-400" },
    { label: "Total Committed", value: summary.totalCommitted, icon: FileText, color: "text-amber-400" },
    { label: "Total Paid", value: summary.totalPaid, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Deposits", value: summary.totalDeposits, icon: PiggyBank, color: "text-cyan-400" },
    { label: "Outstanding", value: summary.totalOutstanding, icon: Clock, color: "text-orange-400" },
    { label: "Available Budget", value: summary.availableBudget, icon: TrendingUp, color: summary.availableBudget >= 0 ? "text-emerald-400" : "text-red-400" },
    { label: "PO Commitment", value: summary.poCommitment, icon: ShoppingCart, color: "text-violet-400" },
    { label: "Legacy Estimate", value: summary.legacySpentEstimate, icon: AlertCircle, color: "text-slate-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-lg font-bold">{formatCompactINR(c.value)}</p>
            <p className="text-[10px] text-muted-foreground">{formatCurrency(c.value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Project Budget Table ────────────────────────────────────────────────────

function ProjectBudgetTable({ data }: { data: ProjectFinancials[] }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Project Budgets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Project</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Approved Budget</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Committed</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Paid</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Deposits</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Outstanding</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Available</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Utilization</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Legacy Est.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.projectId} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.projectName}</td>
                  <td className="p-3 text-right">{formatCompactINR(p.approvedBudget)}</td>
                  <td className="p-3 text-right text-amber-400">{formatCompactINR(p.committed)}</td>
                  <td className="p-3 text-right text-emerald-400">{formatCompactINR(p.paid)}</td>
                  <td className="p-3 text-right text-cyan-400">{formatCompactINR(p.deposits)}</td>
                  <td className="p-3 text-right text-orange-400">{formatCompactINR(p.outstanding)}</td>
                  <td className={`p-3 text-right ${p.available >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCompactINR(p.available)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {p.utilization > 100 ? (
                        <ArrowUpRight className="w-3 h-3 text-red-400" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className={p.utilization > 100 ? "text-red-400" : "text-emerald-400"}>
                        {p.utilization.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right text-slate-400">{formatCompactINR(p.legacySpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Department Budget Table ─────────────────────────────────────────────────

function DepartmentBudgetTable({ data }: { data: DepartmentFinancials[] }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Department Budget Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Department</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Allocated</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Committed</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Paid</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Outstanding</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Available</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Variance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.departmentKey} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="p-3 font-medium">{d.display}</td>
                  <td className="p-3 text-right">{formatCompactINR(d.allocated)}</td>
                  <td className="p-3 text-right text-amber-400">{formatCompactINR(d.committed)}</td>
                  <td className="p-3 text-right text-emerald-400">{formatCompactINR(d.paid)}</td>
                  <td className="p-3 text-right text-orange-400">{formatCompactINR(d.outstanding)}</td>
                  <td className={`p-3 text-right ${d.available >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCompactINR(d.available)}</td>
                  <td className={`p-3 text-right ${d.variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {d.variance >= 0 ? "+" : ""}{formatCompactINR(d.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Expense Breakdown ───────────────────────────────────────────────────────

function ExpenseBreakdown({ data }: { data: CategoryFinancials[] }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Expense Breakdown by Source</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Category</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Committed</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Paid</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Deposits</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.sourceType} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.category}</td>
                  <td className="p-3 text-right text-amber-400">{formatCompactINR(c.committed)}</td>
                  <td className="p-3 text-right text-emerald-400">{formatCompactINR(c.paid)}</td>
                  <td className="p-3 text-right text-cyan-400">{formatCompactINR(c.deposits)}</td>
                  <td className="p-3 text-right text-orange-400">{formatCompactINR(c.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pending Approvals ───────────────────────────────────────────────────────

function PendingApprovalsPanel({ data }: { data: PendingApproval[] }) {
  if (data.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pending approvals at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pending Approvals ({data.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Requestor</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Amount</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Pending At</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="p-3">{a.type}</td>
                  <td className="p-3">{a.requestor}</td>
                  <td className="p-3 text-right">{formatCompactINR(a.amount)}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{a.level}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{a.submittedDate.split("T")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Currency Summary ────────────────────────────────────────────────────────

function CurrencySummary({ dashboard }: { dashboard: ReturnType<typeof useAccountsDashboard> }) {
  const { currencySummary } = dashboard;
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Currency Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Currency</span>
            <span className="font-medium">{currencySummary.baseCurrency}</span>
          </div>
          {Object.entries(currencySummary.totals).map(([cur, amount]) => (
            <div key={cur} className="flex justify-between">
              <span className="text-muted-foreground">{cur} Total (Paid + Deposits)</span>
              <span className="font-medium">{formatCurrency(amount, cur as "INR")}</span>
            </div>
          ))}
          {currencySummary.unconverted > 0 && (
            <div className="flex justify-between text-amber-400">
              <span>Unconverted/Unknown</span>
              <span>{currencySummary.unconverted} records</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            All existing financial records are in INR. Multi-currency support is available for new records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ projectId }: Props) {
  const dashboard = useAccountsDashboard(projectId);

  return (
    <div className="space-y-4">
      <SummaryCards dashboard={dashboard} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {!projectId && <ProjectBudgetTable data={dashboard.byProject} />}
          <DepartmentBudgetTable data={dashboard.byDepartment} />
          <ExpenseBreakdown data={dashboard.byCategory} />
        </div>
        <div className="space-y-4">
          <PendingApprovalsPanel data={dashboard.pendingApprovals} />
          <CurrencySummary dashboard={dashboard} />
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Financial Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><span className="text-foreground font-medium">Approved Budget:</span> Currently authorized project budget amount.</p>
                <p><span className="text-foreground font-medium">Committed:</span> Approved agreements, contracts and purchase orders.</p>
                <p><span className="text-foreground font-medium">Paid:</span> Actual payments made (excluding deposits).</p>
                <p><span className="text-foreground font-medium">Deposits:</span> Security deposits and advance deposits (tracked separately).</p>
                <p><span className="text-foreground font-medium">Outstanding:</span> Committed − Paid − Deposits.</p>
                <p><span className="text-foreground font-medium">Available:</span> Approved Budget − Committed.</p>
                <p><span className="text-foreground font-medium">PO Commitment:</span> Total value of approved, partially-fulfilled and fulfilled purchase orders (tracked separately to prevent double-counting).</p>
                <p><span className="text-foreground font-medium">Legacy Estimate:</span> Historical high-level estimate (project.spent), preserved separately.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Tab (A4 Consolidated Register) ────────────────────────────────

function ExpensesTab({ projectId }: Props) {
  return <ExpensesRegister projectId={projectId} />;
}

// ─── Reports Tab (Basic) ─────────────────────────────────────────────────────

function ReportsTab({ projectId }: Props) {
  const dashboard = useAccountsDashboard(projectId);
  const { summary } = dashboard;

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Financial Summary Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Total Approved Budget</p>
                <p className="text-lg font-bold">{formatCurrency(summary.totalApprovedBudget)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Committed</p>
                <p className="text-lg font-bold text-amber-400">{formatCurrency(summary.totalCommitted)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-bold text-orange-400">{formatCurrency(summary.totalOutstanding)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Deposits</p>
                <p className="text-lg font-bold text-cyan-400">{formatCurrency(summary.totalDeposits)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available Budget</p>
                <p className={`text-lg font-bold ${summary.availableBudget >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(summary.availableBudget)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Full reports (budget utilization, cash flow, vendor summary, department analysis) coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Workspace ──────────────────────────────────────────────────────────

export function AccountsWorkspace({ projectId }: Props) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetManagement projectId={projectId} />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrdersWorkspace projectId={projectId} />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorsWorkspace projectId={projectId} />
        </TabsContent>

        <TabsContent value="insurance">
          <InsuranceWorkspace projectId={projectId} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
