"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Receipt,
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Briefcase,
  Layers,
  Search,
  Filter,
} from "lucide-react";
import { useProject, useSelectedProjectId, useProjects } from "@/lib/project-store";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import { useCastByProject } from "@/lib/cast-store";
import { useCrewByProject } from "@/lib/crew-store";
import type { ExpenseItem, BudgetLineItem, PayrollEntry } from "@/lib/types";
import { ProjectSelector } from "@/components/app/project-selector";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinanceWorkspaceProps {
  projectId?: string;
}

export function FinanceWorkspace({ projectId }: FinanceWorkspaceProps) {
  const centralSelectedId = useSelectedProjectId();
  const activeProjectId = projectId || centralSelectedId || "p1";

  const project = useProject(activeProjectId);
  const projects = useProjects();

  const allExpenses = useAppDataSlice("expenseItems");
  const allBudgets = useAppDataSlice("budgetLineItems");
  const allPayroll = useAppDataSlice("payrollEntries");
  const allRights = useAppDataSlice("rightsDeals");

  const expenses = useMemo(
    () => allExpenses.filter((item) => item.projectId === activeProjectId),
    [allExpenses, activeProjectId]
  );

  const budgets = useMemo(
    () => allBudgets.filter((item) => item.projectId === activeProjectId),
    [allBudgets, activeProjectId]
  );

  const payroll = useMemo(
    () => allPayroll.filter((item) => item.projectId === activeProjectId),
    [allPayroll, activeProjectId]
  );

  const rights = useMemo(
    () => allRights.filter((deal) => deal.projectId === activeProjectId),
    [allRights, activeProjectId]
  );

  const cast = useCastByProject(activeProjectId);
  const crew = useCrewByProject(activeProjectId);

  const [category, setCategory] = useState("Production");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  if (!project) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <ProjectSelector currentProjectId={activeProjectId} />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Project not found.</p>
        </Card>
      </div>
    );
  }

  // --- Financial Calculations ---
  const totalBudget = project.budget;
  const totalSpent = project.spent;
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const totalCommitted = budgets.reduce((sum, item) => sum + (item.committed || 0), 0);
  const paidExpenses = expenses.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  const unpaidExpenses = expenses.filter((item) => item.status !== "paid").reduce((sum, item) => sum + item.amount, 0);

  const castPayable = cast.reduce((sum, item) => sum + Math.max(0, item.totalFee - item.paidAmount), 0);
  const crewPayable = crew.reduce((sum, item) => sum + Math.max(0, item.dayRate * item.daysWorked - item.totalPaid), 0);
  const totalPayables = unpaidExpenses + castPayable + crewPayable;

  const forecast = Math.max(totalSpent, totalCommitted);
  const variance = totalBudget - forecast;

  const receivables = rights.reduce((sum, deal) => sum + Math.max(0, deal.minimumGuarantee - deal.advanceReceived), 0);
  const advanceReceived = rights.reduce((sum, deal) => sum + deal.advanceReceived, 0);

  const visibleExpenses = expenses.filter((item) => {
    const matchesSearch = `${item.description} ${item.category} ${item.status} ${item.date}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set([
      "Above the Line & Direction",
      "Sets & Art Direction",
      "Camera, Lenses & Grip Units",
      "Locations, Transport & Catering",
      "Music, Songs & Live Sound",
      "Post-Production & VFX",
      "Contingency & Production Legal",
      ...budgets.map((b) => b.category),
      category,
    ])
  );

  const resetForm = () => {
    setEditingId(null);
    setAmount("");
    setDescription("");
    setCategory("Production");
    setDate(new Date().toLocaleDateString("en-CA"));
    setError("");
    setMessage("");
  };

  const saveExpense = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Enter a description, valid date, and amount greater than zero.");
      return;
    }

    const previous = expenses.find((item) => item.id === editingId);
    if (editingId && !previous) {
      setError("This expense record was removed. Start a new record.");
      return;
    }

    const record: ExpenseItem = {
      ...previous,
      id: editingId ?? `exp-${activeProjectId}-${Date.now()}`,
      projectId: activeProjectId,
      category,
      amount: Math.round(value * 100) / 100,
      description: description.trim(),
      date,
      status: previous?.status ?? "draft",
    };

    updateAppDataSlice("expenseItems", (current) =>
      editingId
        ? current.map((item) => (item.id === editingId && item.projectId === activeProjectId ? record : item))
        : [record, ...current]
    );

    resetForm();
    setMessage(`Expense for ${project.title} saved successfully.`);
  };

  const exportReport = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            project: { id: project.id, title: project.title, budget: project.budget, spent: project.spent, type: project.type },
            financialSummary: {
              approvedBudget: totalBudget,
              committed: totalCommitted,
              actualSpent: totalSpent,
              forecast,
              variance,
              paidExpenses,
              totalPayables,
              advanceReceived,
              receivables,
            },
            budgetLineItems: budgets,
            expenseItems: expenses,
            payrollEntries: payroll,
            rightsDeals: rights,
            generatedAt: new Date().toISOString(),
            generatedBy: "flowbender Studios Executive Finance",
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `flowbender-finance-${activeProjectId}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Cost report for ${project.title} exported.`);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* 1. Global Project Selector Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur">
        <ProjectSelector currentProjectId={activeProjectId} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Cost Report
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setActiveTab("expenses");
              document.getElementById("expense-description")?.focus();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance · {project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time ledger, line-item budget tracking, cast/crew payroll liabilities, and cash flow forecast.
          </p>
        </div>
      </div>

      {message && <p role="status" className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">{message}</p>}

      {/* 2. Primary Financial KPI Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Budget</p>
          <p className="mt-1 text-base sm:text-lg font-bold tracking-tight text-foreground">{formatINR(totalBudget)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Committed</p>
          <p className="mt-1 text-base sm:text-lg font-bold tracking-tight text-blue-500">{formatINR(totalCommitted)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Actual</p>
          <p className="mt-1 text-base sm:text-lg font-bold tracking-tight text-amber-500">{formatINR(totalSpent)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Forecast</p>
          <p className="mt-1 text-base sm:text-lg font-bold tracking-tight text-foreground">{formatINR(forecast)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Variance</p>
          <p className={`mt-1 text-base sm:text-lg font-bold tracking-tight ${variance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatINR(variance)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Paid</p>
          <p className="mt-1 text-base sm:text-lg font-bold tracking-tight text-emerald-600">{formatINR(paidExpenses)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Payables</p>
          <p className="mt-1 text-base sm:text-lg font-bold tracking-tight text-red-400">{formatINR(totalPayables)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/40">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Receivables</p>
          <p className="mt-1 text-base sm:text-lg font-bold tracking-tight text-cyan-500">{formatINR(receivables)}</p>
        </div>
      </div>

      {/* 3. Tabbed Navigation for Detailed Accounting */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Budget & Allocations</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="payroll">Payroll & Talent ({payroll.length + cast.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Orders ({budgets.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & BUDGET ALLOCATIONS */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Budget Burn & Health</span>
                  <Badge variant={budgetPct > 90 ? "destructive" : "outline"} className="text-xs">
                    {budgetPct}% Allocated
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-muted-foreground">Spent vs Approved Budget</span>
                    <span>{formatINR(totalSpent)} / {formatINR(totalBudget)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        budgetPct >= 95 ? "bg-red-500" : budgetPct >= 75 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, budgetPct))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border p-4 bg-muted/20">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Cast Committed</p>
                    <p className="mt-1 font-semibold text-sm">{formatINR(cast.reduce((s, c) => s + c.totalFee, 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Crew Committed</p>
                    <p className="mt-1 font-semibold text-sm">{formatINR(crew.reduce((s, c) => s + c.dayRate * c.totalDays, 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Cast Payable</p>
                    <p className="mt-1 font-semibold text-sm text-red-500">{formatINR(castPayable)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Crew Payable</p>
                    <p className="mt-1 font-semibold text-sm text-red-500">{formatINR(crewPayable)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department Line Allocations</h4>
                  {budgets.map((item) => {
                    const linePct = item.allocated > 0 ? Math.round((item.spent / item.allocated) * 100) : 0;
                    return (
                      <div key={item.id} className="rounded-lg border p-3 bg-card space-y-1.5">
                        <div className="flex flex-wrap justify-between text-sm font-medium">
                          <span>{item.category}</span>
                          <span>{formatINR(item.spent)} / {formatINR(item.allocated)} ({linePct}%)</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, linePct)}%` }} />
                        </div>
                        {item.notes && <p className="text-xs text-muted-foreground line-clamp-1">{item.notes}</p>}
                      </div>
                    );
                  })}
                  {!budgets.length && <p className="text-sm text-muted-foreground">No budget line items recorded.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Quick Add Expense Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span>{editingId ? "Edit Expense" : "Record Expense"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveExpense} className="space-y-4">
                  <label className="block space-y-1.5 text-sm">
                    <span>Category</span>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:ring-primary"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span>Description</span>
                    <Input
                      id="expense-description"
                      required
                      placeholder="e.g. Tank Bund police permit"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span>Amount (INR)</span>
                    <Input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span>Date</span>
                    <Input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>

                  {error && <p role="alert" className="text-xs text-red-500 font-medium">{error}</p>}

                  <Button className="w-full" type="submit">
                    <Receipt className="mr-2 h-4 w-4" />
                    {editingId ? "Update Record" : "Save Draft Expense"}
                  </Button>
                  {editingId && (
                    <Button className="w-full" variant="outline" type="button" onClick={resetForm}>
                      Cancel Editing
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: EXPENSES & REGISTER */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Expense Ledger · {project.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {visibleExpenses.length} transactions for {project.title}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-xs"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {visibleExpenses.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.category} · {item.date} {item.vendorId ? `· Vendor ${item.vendorId}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm tracking-tight">{formatINR(item.amount)}</span>
                    <select
                      className="rounded-md border bg-background p-1.5 text-xs font-medium"
                      value={item.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as ExpenseItem["status"];
                        updateAppDataSlice("expenseItems", (current) =>
                          current.map((record) =>
                            record.id === item.id && record.projectId === activeProjectId
                              ? { ...record, status: nextStatus }
                              : record
                          )
                        );
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(item.id);
                        setCategory(item.category);
                        setAmount(String(item.amount));
                        setDescription(item.description);
                        setDate(item.date);
                        setActiveTab("overview");
                        document.getElementById("expense-description")?.focus();
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (window.confirm(`Delete expense "${item.description}"?`)) {
                          updateAppDataSlice("expenseItems", (current) =>
                            current.filter((record) => !(record.id === item.id && record.projectId === activeProjectId))
                          );
                          if (editingId === item.id) resetForm();
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {!visibleExpenses.length && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No expense records match this filter for {project.title}.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PAYROLL & TALENT */}
        <TabsContent value="payroll" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Cast Compensation & Contracts</span>
                  <Badge variant="outline">{cast.length} Actors</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {cast.map((c) => (
                  <div key={c.id} className="p-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.character} · {c.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatINR(c.totalFee)}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid {formatINR(c.paidAmount)} · <span className="text-red-400 font-medium">Due {formatINR(Math.max(0, c.totalFee - c.paidAmount))}</span>
                      </p>
                    </div>
                  </div>
                ))}
                {!cast.length && <p className="p-6 text-sm text-muted-foreground">No cast members assigned.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Crew Payroll & Day Rates</span>
                  <Badge variant="outline">{crew.length} Crew</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {crew.map((cr) => (
                  <div key={cr.id} className="p-4 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm">{cr.name}</p>
                      <p className="text-xs text-muted-foreground">{cr.role} · {cr.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatINR(cr.dayRate * cr.totalDays)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatINR(cr.dayRate)}/day ({cr.daysWorked}/{cr.totalDays} days)
                      </p>
                    </div>
                  </div>
                ))}
                {!crew.length && <p className="p-6 text-sm text-muted-foreground">No crew members assigned.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payroll Ledger Records</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {payroll.map((pay) => (
                <div key={pay.id} className="p-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm">{pay.payeeName}</p>
                    <p className="text-xs text-muted-foreground">{pay.department} · {pay.period} · Due {pay.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm">{formatINR(pay.grossAmount)}</span>
                    <Badge variant={pay.status === "paid" ? "outline" : "secondary"} className="capitalize">
                      {pay.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {!payroll.length && <p className="p-6 text-sm text-muted-foreground">No itemized payroll records for {project.title}.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: VENDOR ORDERS & BILLS */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Purchase Orders & Equipment Leases</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {budgets.map((b) => (
                <div key={b.id} className="p-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground">{b.notes || "Standard production commitment"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold">{formatINR(b.committed)}</p>
                      <p className="text-xs text-muted-foreground">Spent: {formatINR(b.spent)}</p>
                    </div>
                    <Badge variant="outline" className="border-primary/20 text-primary">
                      PO Active
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
