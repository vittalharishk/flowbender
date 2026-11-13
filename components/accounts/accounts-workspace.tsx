"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  TrendingUp, Wallet, PiggyBank, AlertCircle,
  FileText, Clock, CheckCircle2, ShoppingCart,
} from "lucide-react";
import { useAccountsDashboard } from "@/lib/accounts-store";
import { formatCurrency, formatCompactINR } from "@/lib/accounts-departments";
import type { ProjectFinancials, DepartmentFinancials, CategoryFinancials, PendingApproval } from "@/lib/accounts-store";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { BudgetManagement } from "./budget-management";
import { ExpensesRegister } from "./expenses-register";
import { PurchaseOrdersWorkspace } from "./purchase-orders-workspace";
import { VendorsWorkspace } from "./vendors-workspace";
import { InsuranceWorkspace } from "./insurance-workspace";

interface Props {
  projectId?: string;
}

// Semantic amount colours that keep contrast in both themes.
const amountTone = {
  committed: "text-amber-700 dark:text-amber-400",
  paid: "text-emerald-700 dark:text-emerald-400",
  deposits: "text-cyan-700 dark:text-cyan-400",
  outstanding: "text-orange-700 dark:text-orange-400",
  legacy: "text-muted-foreground",
} as const;

const signTone = (n: number) =>
  n >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400";

/** Amount cell: compact figure with the exact value exposed to assistive tech and on hover. */
function Amount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} title={formatCurrency(value)}>
      <span aria-hidden="true">{formatCompactINR(value)}</span>
      <span className="sr-only">{formatCurrency(value)}</span>
    </span>
  );
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards({ dashboard }: { dashboard: ReturnType<typeof useAccountsDashboard> }) {
  const { summary } = dashboard;
  const cards = [
    { label: "Approved Budget", value: summary.totalApprovedBudget, icon: Wallet },
    { label: "Total Committed", value: summary.totalCommitted, icon: FileText },
    { label: "Total Paid", value: summary.totalPaid, icon: CheckCircle2 },
    { label: "Deposits", value: summary.totalDeposits, icon: PiggyBank },
    { label: "Outstanding", value: summary.totalOutstanding, icon: Clock },
    { label: "Available Budget", value: summary.availableBudget, icon: TrendingUp },
    { label: "PO Commitment", value: summary.poCommitment, icon: ShoppingCart },
    { label: "Legacy Estimate", value: summary.legacySpentEstimate, icon: AlertCircle },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <StatCard
          key={c.label}
          compact
          label={c.label}
          icon={c.icon}
          value={formatCompactINR(c.value)}
          hint={formatCurrency(c.value)}
        />
      ))}
    </div>
  );
}

// ─── Project Budget Table ────────────────────────────────────────────────────

function ProjectBudgetTable({ data }: { data: ProjectFinancials[] }) {
  const columns: DataTableColumn<ProjectFinancials>[] = [
    { key: "project", header: "Project", cell: (p) => <span className="font-medium">{p.projectName}</span>, sortValue: (p) => p.projectName },
    { key: "approved", header: "Approved Budget", align: "right", cell: (p) => <Amount value={p.approvedBudget} />, sortValue: (p) => p.approvedBudget },
    { key: "committed", header: "Committed", align: "right", cell: (p) => <Amount value={p.committed} className={amountTone.committed} />, sortValue: (p) => p.committed },
    { key: "paid", header: "Paid", align: "right", cell: (p) => <Amount value={p.paid} className={amountTone.paid} />, sortValue: (p) => p.paid },
    { key: "deposits", header: "Deposits", align: "right", cell: (p) => <Amount value={p.deposits} className={amountTone.deposits} />, sortValue: (p) => p.deposits },
    { key: "outstanding", header: "Outstanding", align: "right", cell: (p) => <Amount value={p.outstanding} className={amountTone.outstanding} />, sortValue: (p) => p.outstanding },
    { key: "available", header: "Available", align: "right", cell: (p) => <Amount value={p.available} className={signTone(p.available)} />, sortValue: (p) => p.available },
    {
      key: "utilization",
      header: "Utilization",
      align: "right",
      sortValue: (p) => p.utilization,
      cell: (p) => (
        <StatusBadge
          status={p.utilization > 100 ? "over" : "ok"}
          tone={p.utilization > 100 ? "error" : "success"}
          label={`${p.utilization.toFixed(1)}%${p.utilization > 100 ? " over" : ""}`}
        />
      ),
    },
    { key: "legacy", header: "Legacy Est.", align: "right", cell: (p) => <Amount value={p.legacySpent} className={amountTone.legacy} />, sortValue: (p) => p.legacySpent },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-base font-semibold leading-none tracking-tight">Project Budgets</div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(p) => p.projectId}
          caption="Approved budget, committed, paid, deposits, outstanding and utilization by project"
          empty={<EmptyState title="No project budgets" description="Approved project budgets will appear here." className="py-6" />}
        />
      </CardContent>
    </Card>
  );
}

// ─── Department Budget Table ─────────────────────────────────────────────────

function DepartmentBudgetTable({ data }: { data: DepartmentFinancials[] }) {
  const columns: DataTableColumn<DepartmentFinancials>[] = [
    { key: "dept", header: "Department", cell: (d) => <span className="font-medium">{d.display}</span>, sortValue: (d) => d.display },
    { key: "allocated", header: "Allocated", align: "right", cell: (d) => <Amount value={d.allocated} />, sortValue: (d) => d.allocated },
    { key: "committed", header: "Committed", align: "right", cell: (d) => <Amount value={d.committed} className={amountTone.committed} />, sortValue: (d) => d.committed },
    { key: "paid", header: "Paid", align: "right", cell: (d) => <Amount value={d.paid} className={amountTone.paid} />, sortValue: (d) => d.paid },
    { key: "outstanding", header: "Outstanding", align: "right", cell: (d) => <Amount value={d.outstanding} className={amountTone.outstanding} />, sortValue: (d) => d.outstanding },
    { key: "available", header: "Available", align: "right", cell: (d) => <Amount value={d.available} className={signTone(d.available)} />, sortValue: (d) => d.available },
    {
      key: "variance",
      header: "Variance",
      align: "right",
      sortValue: (d) => d.variance,
      cell: (d) => (
        <span className={signTone(d.variance)} title={formatCurrency(d.variance)}>
          <span aria-hidden="true">{d.variance >= 0 ? "+" : ""}{formatCompactINR(d.variance)}</span>
          <span className="sr-only">{d.variance >= 0 ? "under budget by " : "over budget by "}{formatCurrency(Math.abs(d.variance))}</span>
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-base font-semibold leading-none tracking-tight">Department Budget Breakdown</div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(d) => d.departmentKey}
          pageSize={25}
          caption="Allocated, committed, paid, outstanding, available and variance by department"
          empty={<EmptyState title="No department allocations" description="Department budget allocations will appear here." className="py-6" />}
        />
      </CardContent>
    </Card>
  );
}

// ─── Expense Breakdown ───────────────────────────────────────────────────────

function ExpenseBreakdown({ data }: { data: CategoryFinancials[] }) {
  const columns: DataTableColumn<CategoryFinancials>[] = [
    { key: "category", header: "Category", cell: (c) => <span className="font-medium">{c.category}</span>, sortValue: (c) => c.category },
    { key: "committed", header: "Committed", align: "right", cell: (c) => <Amount value={c.committed} className={amountTone.committed} />, sortValue: (c) => c.committed },
    { key: "paid", header: "Paid", align: "right", cell: (c) => <Amount value={c.paid} className={amountTone.paid} />, sortValue: (c) => c.paid },
    { key: "deposits", header: "Deposits", align: "right", cell: (c) => <Amount value={c.deposits} className={amountTone.deposits} />, sortValue: (c) => c.deposits },
    { key: "outstanding", header: "Outstanding", align: "right", cell: (c) => <Amount value={c.outstanding} className={amountTone.outstanding} />, sortValue: (c) => c.outstanding },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-base font-semibold leading-none tracking-tight">Expense Breakdown by Source</div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(c) => c.sourceType}
          pageSize={25}
          caption="Committed, paid, deposits and outstanding by expense source category"
          empty={<EmptyState title="No expense records" description="Expenses will appear here once recorded." className="py-6" />}
        />
      </CardContent>
    </Card>
  );
}

// ─── Pending Approvals ───────────────────────────────────────────────────────

function PendingApprovalsPanel({ data }: { data: PendingApproval[] }) {
  const columns: DataTableColumn<PendingApproval>[] = [
    { key: "type", header: "Type", cell: (a) => a.type, sortValue: (a) => a.type },
    { key: "requestor", header: "Requestor", cell: (a) => a.requestor, sortValue: (a) => a.requestor },
    { key: "amount", header: "Amount", align: "right", cell: (a) => <Amount value={a.amount} />, sortValue: (a) => a.amount },
    { key: "level", header: "Pending At", cell: (a) => <StatusBadge status="pending" label={a.level} /> },
    { key: "submitted", header: "Submitted", cell: (a) => <span className="text-muted-foreground">{a.submittedDate.split("T")[0]}</span>, sortValue: (a) => a.submittedDate },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-base font-semibold leading-none tracking-tight">
          Pending Approvals{data.length > 0 ? ` (${data.length})` : ""}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No pending approvals"
            description="Nothing is waiting on an approver right now."
            className="py-6"
          />
        ) : (
          <DataTable
            columns={columns}
            rows={data}
            rowKey={(a) => a.id}
            pageSize={10}
            caption="Items awaiting financial approval"
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Currency Summary ────────────────────────────────────────────────────────

function CurrencySummary({ dashboard }: { dashboard: ReturnType<typeof useAccountsDashboard> }) {
  const { currencySummary } = dashboard;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-base font-semibold leading-none tracking-tight">Currency Summary</div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Base Currency</dt>
            <dd className="font-medium">{currencySummary.baseCurrency}</dd>
          </div>
          {Object.entries(currencySummary.totals).map(([cur, amount]) => (
            <div key={cur} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{cur} Total (Paid + Deposits)</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(amount, cur as "INR")}</dd>
            </div>
          ))}
          {currencySummary.unconverted > 0 && (
            <div className="flex justify-between gap-3 text-amber-700 dark:text-amber-400">
              <dt>Unconverted/Unknown</dt>
              <dd className="tabular-nums">{currencySummary.unconverted} records</dd>
            </div>
          )}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          All existing financial records are in INR. Multi-currency support is available for new records.
        </p>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {!projectId && <ProjectBudgetTable data={dashboard.byProject} />}
          <DepartmentBudgetTable data={dashboard.byDepartment} />
          <ExpenseBreakdown data={dashboard.byCategory} />
        </div>
        <div className="space-y-4">
          <PendingApprovalsPanel data={dashboard.pendingApprovals} />
          <CurrencySummary dashboard={dashboard} />
          <Card>
            <CardHeader className="pb-3">
              <div className="text-base font-semibold leading-none tracking-tight">Financial Definitions</div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-xs text-muted-foreground">
                <div><dt className="inline font-medium text-foreground">Approved Budget: </dt><dd className="inline">Currently authorized project budget amount.</dd></div>
                <div><dt className="inline font-medium text-foreground">Committed: </dt><dd className="inline">Approved agreements, contracts and purchase orders.</dd></div>
                <div><dt className="inline font-medium text-foreground">Paid: </dt><dd className="inline">Actual payments made (excluding deposits).</dd></div>
                <div><dt className="inline font-medium text-foreground">Deposits: </dt><dd className="inline">Security deposits and advance deposits (tracked separately).</dd></div>
                <div><dt className="inline font-medium text-foreground">Outstanding: </dt><dd className="inline">Committed &minus; Paid &minus; Deposits.</dd></div>
                <div><dt className="inline font-medium text-foreground">Available: </dt><dd className="inline">Approved Budget &minus; Committed.</dd></div>
                <div><dt className="inline font-medium text-foreground">PO Commitment: </dt><dd className="inline">Total value of approved, partially-fulfilled and fulfilled purchase orders (tracked separately to prevent double-counting).</dd></div>
                <div><dt className="inline font-medium text-foreground">Legacy Estimate: </dt><dd className="inline">Historical high-level estimate (project.spent), preserved separately.</dd></div>
              </dl>
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

// ─── Reports Tab ─────────────────────────────────────────────────────────────

function ReportsTab({ projectId }: Props) {
  const dashboard = useAccountsDashboard(projectId);
  const { summary } = dashboard;

  const figures = [
    { label: "Total Approved Budget", value: summary.totalApprovedBudget, tone: "" },
    { label: "Total Committed", value: summary.totalCommitted, tone: amountTone.committed },
    { label: "Total Paid", value: summary.totalPaid, tone: amountTone.paid },
    { label: "Total Outstanding", value: summary.totalOutstanding, tone: amountTone.outstanding },
    { label: "Total Deposits", value: summary.totalDeposits, tone: amountTone.deposits },
    { label: "Available Budget", value: summary.availableBudget, tone: signTone(summary.availableBudget) },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="text-base font-semibold leading-none tracking-tight">Financial Summary Report</div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {figures.map((f) => (
              <div key={f.label}>
                <dt className="text-sm text-muted-foreground">{f.label}</dt>
                <dd className={`text-lg font-bold tabular-nums ${f.tone}`}>{formatCurrency(f.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Figures are read from the shared Accounts dashboard selector, so they reconcile with every other Accounts view.
          </p>
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
        <TabsList className="h-auto flex-wrap">
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
