"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  FileText, DollarSign, Clock, CheckCircle2, AlertCircle, ExternalLink,
  CreditCard, Receipt, Building2, Wallet,
} from "lucide-react";
import {
  useConsolidatedExpenses, useAccountsDashboard,
  type ConsolidatedExpenseItem, type ExpensePaymentDetail,
} from "@/lib/accounts-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import {
  formatCurrency, formatCompactINR, ACCOUNTS_DEPARTMENTS, getDepartmentDisplay,
} from "@/lib/accounts-departments";

interface Props {
  projectId?: string;
}

const PAGE_SIZE = 25;

const SOURCE_MODULES = [
  { value: "cast", label: "Cast Talent" },
  { value: "crew", label: "Crew Remuneration" },
  { value: "rental", label: "Rentals" },
  { value: "expense", label: "Production Expenses" },
  { value: "location", label: "Locations" },
  { value: "hotel", label: "Hotels" },
  { value: "travel", label: "Travel" },
  { value: "office", label: "Office & Maintenance" },
  { value: "maintenance", label: "Maintenance" },
  { value: "caravan", label: "Caravans" },
  { value: "props", label: "Props & Art" },
  { value: "set", label: "Production Sets" },
  { value: "stunt", label: "Stunt Equipment" },
];

const PAYMENT_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "linked", label: "Linked (Option B)" },
];

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-300",
  partial: "bg-amber-500/20 text-amber-300",
  pending: "bg-slate-500/20 text-slate-300",
  cancelled: "bg-red-500/20 text-red-300",
  rejected: "bg-red-500/20 text-red-300",
  linked: "bg-blue-500/20 text-blue-300",
  overdue: "bg-orange-500/20 text-orange-300",
};

type SortField = "date" | "amount" | "paid" | "outstanding" | "title";

function statusLabel(s: string) {
  return s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

// ─── Summary Cards ──────────────────────────────────────────────────────────

function ExpenseSummaryCards({ items }: { items: ConsolidatedExpenseItem[] }) {
  const activeItems = items.filter((i) => !["cancelled", "rejected"].includes(i.paymentStatus));
  const totalCommitted = activeItems.reduce((s, i) => s + i.inrAmount, 0);
  const totalPaid = activeItems.reduce((s, i) => s + i.paidAmount, 0);
  const totalDeposits = activeItems.reduce((s, i) => s + i.depositAmount, 0);
  const totalOutstanding = activeItems.reduce((s, i) => s + i.outstandingAmount, 0);
  const paidCount = items.filter((i) => i.paymentStatus === "paid").length;
  const pendingCount = items.filter((i) => i.paymentStatus === "pending").length;

  const cards = [
    { label: "Total Committed", value: totalCommitted, icon: FileText, color: "text-amber-400" },
    { label: "Total Paid", value: totalPaid, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Deposits", value: totalDeposits, icon: Wallet, color: "text-cyan-400" },
    { label: "Outstanding", value: totalOutstanding, icon: Clock, color: "text-orange-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

// ─── Detail Drawer ──────────────────────────────────────────────────────────

function ExpenseDetailDrawer({ item, onClose }: { item: ConsolidatedExpenseItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-background border-l border-border overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-base font-semibold">{item.title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Source Info */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source Module</span>
                <Badge variant="outline" className="text-xs">{item.sourceModule}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source ID</span>
                <span className="font-mono text-xs">{item.sourceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project</span>
                <span>{item.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department</span>
                <span>{item.departmentDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{item.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor/Payee</span>
                <span>{item.vendorPayee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{item.transactionDate?.split("T")[0] || "—"}</span>
              </div>
              {item.description && (
                <div className="pt-1 border-t border-border/30">
                  <span className="text-muted-foreground text-xs">Description: </span>
                  <span className="text-xs">{item.description}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount Breakdown */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm">Amount Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Amount</span>
                <span className="font-medium">{formatCurrency(item.originalAmount)}</span>
              </div>
              {item.originalAmount !== item.inrAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">INR Equivalent</span>
                  <span className="font-medium">{formatCurrency(item.inrAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-400">
                <span>Paid</span>
                <span className="font-medium">{formatCurrency(item.paidAmount)}</span>
              </div>
              {item.depositAmount > 0 && (
                <div className="flex justify-between text-cyan-400">
                  <span>Deposits</span>
                  <span className="font-medium">{formatCurrency(item.depositAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-orange-400">
                <span>Outstanding</span>
                <span className="font-medium">{formatCurrency(item.outstandingAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/30">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge className={`text-xs ${PAYMENT_STATUS_COLORS[item.paymentStatus] || "bg-slate-500/20 text-slate-300"}`}>
                  {statusLabel(item.paymentStatus)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval Status</span>
                <Badge variant="outline" className="text-xs">{statusLabel(item.approvalStatus)}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {item.payments.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Payment History ({item.payments.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {item.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/20">
                      <div>
                        <p className="font-medium">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{p.date?.split("T")[0] || "—"}</p>
                        {p.reference && <p className="text-xs text-muted-foreground">Ref: {p.reference}</p>}
                      </div>
                      <div className="text-right">
                        {p.isDeposit && <Badge variant="outline" className="text-xs text-cyan-400">Deposit</Badge>}
                        {p.recordedBy && <p className="text-xs text-muted-foreground">{p.recordedBy}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {item.payments.length === 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center text-muted-foreground text-sm">
                No payment records for this expense.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filters ────────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  project: string;
  department: string;
  sourceModule: string;
  paymentStatus: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = {
  search: "", project: "all", department: "all", sourceModule: "all",
  paymentStatus: "all", category: "all", dateFrom: "", dateTo: "",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function ExpensesRegister({ projectId }: Props) {
  const allExpenses = useConsolidatedExpenses(projectId);
  const projects = useAppDataSlice("projects");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConsolidatedExpenseItem | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allExpenses.forEach((e) => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [allExpenses]);

  const filtered = useMemo(() => {
    let items = allExpenses;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.vendorPayee.toLowerCase().includes(q) ||
        i.sourceId.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }
    if (filters.project !== "all") {
      if (filters.project === "__company__") items = items.filter((i) => !i.projectId);
      else items = items.filter((i) => i.projectId === filters.project);
    }
    if (filters.department !== "all") items = items.filter((i) => i.department === filters.department);
    if (filters.sourceModule !== "all") items = items.filter((i) => i.sourceType === filters.sourceModule);
    if (filters.paymentStatus !== "all") items = items.filter((i) => i.paymentStatus === filters.paymentStatus);
    if (filters.category !== "all") items = items.filter((i) => i.category === filters.category);
    if (filters.dateFrom) items = items.filter((i) => i.transactionDate >= filters.dateFrom);
    if (filters.dateTo) items = items.filter((i) => i.transactionDate <= filters.dateTo + "T23:59:59");

    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date": cmp = a.transactionDate.localeCompare(b.transactionDate); break;
        case "amount": cmp = a.inrAmount - b.inrAmount; break;
        case "paid": cmp = a.paidAmount - b.paidAmount; break;
        case "outstanding": cmp = a.outstandingAmount - b.outstandingAmount; break;
        case "title": cmp = a.title.localeCompare(b.title); break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return sorted;
  }, [allExpenses, filters, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasActiveFilters = Object.entries(filters).some(([k, v]) => v !== EMPTY_FILTERS[k as keyof Filters]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
    setPage(0);
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <ExpenseSummaryCards items={allExpenses} />

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {/* Search */}
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Project filter (hidden in project-scoped view) */}
            {!projectId && (
              <Select value={filters.project} onValueChange={(v) => updateFilter("project", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Projects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="__company__">Company</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Department */}
            <Select value={filters.department} onValueChange={(v) => updateFilter("department", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {ACCOUNTS_DEPARTMENTS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.display}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Source Module */}
            <Select value={filters.sourceModule} onValueChange={(v) => updateFilter("sourceModule", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {SOURCE_MODULES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status */}
            <Select value={filters.paymentStatus} onValueChange={(v) => updateFilter("paymentStatus", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Input
              type="date"
              placeholder="From"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              type="date"
              placeholder="To"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className="h-9 text-sm"
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => { setFilters(EMPTY_FILTERS); setPage(0); }}
              >
                <X className="w-3 h-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{filtered.length} expense(s) {hasActiveFilters ? "(filtered)" : ""} from {allExpenses.length} total</span>
            <span>
              Total filtered: {formatCompactINR(filtered.filter(i => !["cancelled", "rejected"].includes(i.paymentStatus)).reduce((s, i) => s + i.inrAmount, 0))} committed
              {" / "}{formatCompactINR(filtered.filter(i => !["cancelled", "rejected"].includes(i.paymentStatus)).reduce((s, i) => s + i.paidAmount, 0))} paid
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {hasActiveFilters ? "No expenses match the current filters." : "No expense records found."}
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort("title")}>
                      <span className="flex items-center gap-1">Title / Description <SortIcon field="title" /></span>
                    </th>
                    {!projectId && (
                      <th className="text-left p-3 text-muted-foreground font-medium">Project</th>
                    )}
                    <th className="text-left p-3 text-muted-foreground font-medium">Department</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Source</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Vendor/Payee</th>
                    <th className="text-right p-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                      <span className="flex items-center justify-end gap-1">Amount <SortIcon field="amount" /></span>
                    </th>
                    <th className="text-right p-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort("paid")}>
                      <span className="flex items-center justify-end gap-1">Paid <SortIcon field="paid" /></span>
                    </th>
                    <th className="text-right p-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort("outstanding")}>
                      <span className="flex items-center justify-end gap-1">Outstanding <SortIcon field="outstanding" /></span>
                    </th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => toggleSort("date")}>
                      <span className="flex items-center gap-1">Date <SortIcon field="date" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/30 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="p-3">
                        <p className="font-medium text-sm truncate max-w-[200px]">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.category}</p>
                      </td>
                      {!projectId && (
                        <td className="p-3 text-sm">{item.projectName}</td>
                      )}
                      <td className="p-3 text-xs">{item.departmentDisplay}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-normal">{item.sourceModule}</Badge>
                      </td>
                      <td className="p-3 text-sm truncate max-w-[120px]">{item.vendorPayee}</td>
                      <td className="p-3 text-right text-amber-400">{formatCompactINR(item.inrAmount)}</td>
                      <td className="p-3 text-right text-emerald-400">{formatCompactINR(item.paidAmount)}</td>
                      <td className="p-3 text-right text-orange-400">
                        {item.outstandingAmount > 0 ? formatCompactINR(item.outstandingAmount) : "—"}
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[10px] ${PAYMENT_STATUS_COLORS[item.paymentStatus] || "bg-slate-500/20 text-slate-300"}`}>
                          {statusLabel(item.paymentStatus)}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{item.transactionDate?.split("T")[0] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between p-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs px-2">{page + 1} / {totalPages}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Architecture Reference */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            All financial data is derived from source department modules. No duplicate records are created.
            Payments, deposits, and commitments are tracked in their respective source modules and consolidated here for reporting.
            Production sets with linked expenses follow Option B (set actualCost excluded to prevent double-counting).
          </p>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      {selectedItem && (
        <ExpenseDetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
