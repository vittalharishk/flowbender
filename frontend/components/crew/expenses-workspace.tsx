"use client";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useProductionExpenses, addExpense, updateExpense, approveExpense, rejectExpense,
  useExpensePayments, recordExpensePayment,
  useOfficeRentals, addOfficeRental, updateOfficeRental,
  useOfficeRentPayments, recordRentPayment,
  useMaintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord,
  calcExpenseDashboard, formatINR
} from "@/lib/expense-store";
import {
  ALL_EXPENSE_CATEGORIES, PRODUCTION_OFFICE_CATEGORIES, PRODUCTION_EXPENSE_CATEGORIES,
  MAINTENANCE_CATEGORIES, EXPENSE_STATUS_FLOW, MAINTENANCE_STATUS_FLOW
} from "@/lib/expense-categories";
import { useAppDataSlice } from "@/lib/app-data-store";
import type {
  ProductionExpense, ExpensePayment, OfficeRental, OfficeRentPayment,
  MaintenanceRecord, ExpensePaymentStatus, MaintenanceStatus, MaintenancePriority,
  ExpensePaymentMethod
} from "@/lib/types";

interface Props { projectId?: string; }

const expenseStatusColor: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  "pending-approval": "bg-amber-500/20 text-amber-300",
  approved: "bg-blue-500/20 text-blue-300",
  "partially-paid": "bg-orange-500/20 text-orange-300",
  paid: "bg-emerald-500/20 text-emerald-300",
  rejected: "bg-red-500/20 text-red-300",
  cancelled: "bg-gray-500/20 text-gray-400",
};

const priorityColor: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-300",
  high: "bg-orange-500/20 text-orange-300",
  medium: "bg-amber-500/20 text-amber-300",
  low: "bg-slate-500/20 text-slate-300",
};

const maintenanceStatusColor: Record<string, string> = {
  reported: "bg-slate-500/20 text-slate-300",
  assigned: "bg-blue-500/20 text-blue-300",
  "in-progress": "bg-amber-500/20 text-amber-400",
  completed: "bg-emerald-500/20 text-emerald-300",
  "on-hold": "bg-orange-500/20 text-orange-300",
  cancelled: "bg-gray-500/20 text-gray-400",
};

function catLabel(key: string) {
  return ALL_EXPENSE_CATEGORIES.find(c => c.key === key)?.label ?? key;
}

function statusLabel(s: string) {
  return s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ projectId }: Props) {
  const expenses = useProductionExpenses(projectId);
  const rentals = useOfficeRentals(projectId);
  const maintenance = useMaintenanceRecords(projectId);
  const projects = useAppDataSlice("projects");
  const summary = calcExpenseDashboard(expenses, rentals, maintenance);

  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.title])), [projects]);

  const byProject = useMemo(() => {
    const map: Record<string, { title: string; total: number; paid: number; outstanding: number }> = {};
    expenses.filter(e => !["cancelled","rejected"].includes(e.paymentStatus)).forEach(e => {
      if (!map[e.projectId]) map[e.projectId] = { title: projectMap[e.projectId] ?? e.projectId, total: 0, paid: 0, outstanding: 0 };
      map[e.projectId].total += e.finalAmount;
      map[e.projectId].paid += e.totalPaid;
      map[e.projectId].outstanding += Math.max(0, e.finalAmount - e.totalPaid);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses, projectMap]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(e => !["cancelled","rejected"].includes(e.paymentStatus)).forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.finalAmount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [expenses]);

  const maxCat = byCategory[0]?.[1] ?? 1;

  const totalRentPaid = useOfficeRentPayments().reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Expenses", value: summary.totalExpenses + " records", sub: formatINR(summary.totalAmount) },
          { label: "Approved / Paid", value: summary.approved + " expenses", sub: formatINR(summary.totalPaid) + " paid" },
          { label: "Pending Approval", value: summary.pendingApproval + " expenses", sub: formatINR(summary.totalOutstanding) + " outstanding" },
          { label: "Office Rent / Mo", value: formatINR(summary.totalOfficeRent), sub: formatINR(totalRentPaid) + " total paid" },
        ].map(card => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
            <div className="text-lg font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="font-semibold mb-3">Project-wise Expenses</div>
          <table className="w-full text-sm">
            <thead><tr className="text-muted-foreground text-xs border-b border-border">
              <th className="text-left pb-2">Project</th>
              <th className="text-right pb-2">Total</th>
              <th className="text-right pb-2">Paid</th>
              <th className="text-right pb-2">Outstanding</th>
            </tr></thead>
            <tbody>
              {byProject.map(row => (
                <tr key={row.title} className="border-b border-border/50">
                  <td className="py-2 pr-2 truncate max-w-[140px]">{row.title}</td>
                  <td className="py-2 text-right">{formatINR(row.total)}</td>
                  <td className="py-2 text-right text-emerald-400">{formatINR(row.paid)}</td>
                  <td className="py-2 text-right text-amber-400">{formatINR(row.outstanding)}</td>
                </tr>
              ))}
              {byProject.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No expense data</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="font-semibold mb-3">Category-wise Expenses (Top 8)</div>
          <div className="space-y-3">
            {byCategory.map(([key, amount]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{catLabel(key)}</span>
                  <span className="font-medium">{formatINR(amount)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${(amount / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
            {byCategory.length === 0 && <div className="text-center text-muted-foreground py-4">No data</div>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="font-semibold mb-3">Maintenance Summary</div>
        <div className="flex flex-wrap gap-4 text-sm">
          {(["reported","assigned","in-progress","on-hold","completed","cancelled"] as MaintenanceStatus[]).map(s => {
            const count = maintenance.filter(m => m.status === s).length;
            return <div key={s} className="flex items-center gap-2"><Badge className={maintenanceStatusColor[s]}>{statusLabel(s)}</Badge><span>{count}</span></div>;
          })}
          <div className="ml-auto font-medium">Total actual cost: {formatINR(maintenance.reduce((sum, m) => sum + m.actualCost, 0))}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Expense Register Tab ─────────────────────────────────────────────────────
function ExpenseRegisterTab({ projectId }: Props) {
  const expenses = useProductionExpenses(projectId);
  const allPayments = useExpensePayments();
  const projects = useAppDataSlice("projects");

  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<ProductionExpense | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showPayment, setShowPayment] = useState<ProductionExpense | null>(null);
  const [showReject, setShowReject] = useState<ProductionExpense | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<ExpensePaymentMethod>("bank-transfer");
  const [payRef, setPayRef] = useState("");
  const [payErr, setPayErr] = useState("");

  const filtered = useMemo(() => expenses.filter(e => {
    if (filterProject !== "all" && e.projectId !== filterProject) return false;
    if (filterSection !== "all" && e.section !== filterSection) return false;
    if (filterStatus !== "all" && e.paymentStatus !== filterStatus) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.vendorPayee?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [expenses, filterProject, filterSection, filterStatus, search]);

  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.title])), [projects]);

  function handlePay() {
    if (!showPayment) return;
    const amt = parseFloat(payAmount);
    const result = recordExpensePayment(showPayment, { projectId: showPayment.projectId, amount: amt, paymentDate: new Date().toISOString().slice(0,10), paymentMethod: payMethod, referenceNumber: payRef, recordedBy: "Production Manager" });
    if (!result.ok) { setPayErr(result.error ?? "Error"); return; }
    setShowPayment(null); setPayAmount(""); setPayRef(""); setPayErr("");
    if (selected?.id === showPayment.id) setSelected(null);
  }

  // ── New Expense form state ──
  const [nf, setNf] = useState({ projectId: projectId ?? "p1", section: "production" as "production"|"production-office", category: "catering-food", department: "", title: "", vendorPayee: "", expenseDate: new Date().toISOString().slice(0,10), quantity: "1", unitCost: "", taxAmount: "0", discount: "0", notes: "" });
  function computeAmounts() {
    const qty = parseFloat(nf.quantity) || 0;
    const uc = parseFloat(nf.unitCost) || 0;
    const tax = parseFloat(nf.taxAmount) || 0;
    const disc = parseFloat(nf.discount) || 0;
    const sub = qty * uc;
    return { subtotal: sub, finalAmount: sub + tax - disc };
  }
  function handleAddExpense() {
    const { subtotal, finalAmount } = computeAmounts();
    addExpense({ projectId: nf.projectId, section: nf.section, category: nf.category as ProductionExpense["category"], department: nf.department, title: nf.title, vendorPayee: nf.vendorPayee || undefined, expenseDate: nf.expenseDate, quantity: parseFloat(nf.quantity)||1, unitCost: parseFloat(nf.unitCost)||0, subtotal, taxAmount: parseFloat(nf.taxAmount)||0, discount: parseFloat(nf.discount)||0, finalAmount, totalPaid: 0, paymentStatus: "draft", createdBy: "Production Manager", notes: nf.notes });
    setShowNew(false);
  }

  const expPayments = selected ? allPayments.filter(p => p.expenseId === selected.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Search title or vendor…" value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
        {!projectId && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Projects" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Projects</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Sections" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Sections</SelectItem><SelectItem value="production-office">Production Office</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem>{["draft","pending-approval","approved","partially-paid","paid","rejected","cancelled"].map(s => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={() => setShowNew(true)}>+ New Expense</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground text-xs border-b border-border">
            {["ID","Project","Category","Title","Vendor/Payee","Date","Final Amt","Paid","Outstanding","Status","Actions"].map(h => <th key={h} className="text-left py-2 pr-3 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(e)}>
                <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                <td className="py-2 pr-3 truncate max-w-[100px]">{projectMap[e.projectId] ?? e.projectId}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{catLabel(e.category)}</td>
                <td className="py-2 pr-3 truncate max-w-[140px]">{e.title}</td>
                <td className="py-2 pr-3 truncate max-w-[120px] text-muted-foreground">{e.vendorPayee ?? "—"}</td>
                <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{e.expenseDate}</td>
                <td className="py-2 pr-3 whitespace-nowrap text-right">{formatINR(e.finalAmount)}</td>
                <td className="py-2 pr-3 whitespace-nowrap text-right text-emerald-400">{formatINR(e.totalPaid)}</td>
                <td className="py-2 pr-3 whitespace-nowrap text-right text-amber-400">{formatINR(Math.max(0, e.finalAmount - e.totalPaid))}</td>
                <td className="py-2 pr-3"><Badge className={expenseStatusColor[e.paymentStatus]}>{statusLabel(e.paymentStatus)}</Badge></td>
                <td className="py-2 pr-3" onClick={ev => ev.stopPropagation()}>
                  <div className="flex gap-1">
                    {e.paymentStatus === "draft" && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateExpense(e.id, { paymentStatus: "pending-approval" })}>Submit</Button>}
                    {e.paymentStatus === "pending-approval" && <>
                      <Button size="sm" variant="outline" className="h-6 text-xs text-emerald-400 border-emerald-400/40" onClick={() => approveExpense(e.id, "Production Manager")}>Approve</Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs text-red-400 border-red-400/40" onClick={() => { setShowReject(e); setRejectReason(""); }}>Reject</Button>
                    </>}
                    {["approved","partially-paid"].includes(e.paymentStatus) && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => { setShowPayment(e); setPayAmount(""); setPayErr(""); }}>Pay</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={11} className="py-6 text-center text-muted-foreground">No expenses found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detail Dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["ID", selected.id], ["Project", projectMap[selected.projectId]], ["Section", selected.section],
                ["Category", catLabel(selected.category)], ["Department", selected.department],
                ["Vendor/Payee", selected.vendorPayee ?? "—"], ["Date", selected.expenseDate],
                ["Quantity", selected.quantity], ["Unit Cost", formatINR(selected.unitCost)],
                ["Subtotal", formatINR(selected.subtotal)], ["Tax", formatINR(selected.taxAmount)],
                ["Discount", formatINR(selected.discount)], ["Final Amount", formatINR(selected.finalAmount)],
                ["Paid", formatINR(selected.totalPaid)], ["Outstanding", formatINR(Math.max(0, selected.finalAmount - selected.totalPaid))],
                ["Status", statusLabel(selected.paymentStatus)],
                ["Invoice #", selected.invoiceNumber ?? "—"], ["Notes", selected.notes ?? "—"],
              ].map(([k, v]) => (
                <div key={String(k)}><span className="text-muted-foreground">{k}: </span><span>{String(v)}</span></div>
              ))}
            </div>
            <div className="mt-4">
              <div className="font-semibold text-sm mb-2">Payment History</div>
              {expPayments.length === 0 ? <div className="text-muted-foreground text-sm">No payments recorded</div> : (
                <table className="w-full text-sm"><thead><tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left pb-1">Date</th><th className="text-right pb-1">Amount</th><th className="text-left pb-1 pl-3">Method</th><th className="text-left pb-1 pl-3">Reference</th>
                </tr></thead><tbody>
                  {expPayments.map(p => <tr key={p.id} className="border-b border-border/40">
                    <td className="py-1">{p.paymentDate}</td><td className="py-1 text-right">{formatINR(p.amount)}</td><td className="py-1 pl-3">{p.paymentMethod}</td><td className="py-1 pl-3 text-muted-foreground">{p.referenceNumber ?? "—"}</td>
                  </tr>)}
                </tbody></table>
              )}
            </div>
            <DialogFooter className="gap-2">
              {selected.paymentStatus === "pending-approval" && <>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { approveExpense(selected.id, "Production Manager"); setSelected(null); }}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => { setShowReject(selected); setSelected(null); }}>Reject</Button>
              </>}
              {["approved","partially-paid"].includes(selected.paymentStatus) && (
                <Button size="sm" onClick={() => { setShowPayment(selected); setSelected(null); setPayAmount(""); setPayErr(""); }}>Record Payment</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      {showPayment && (
        <Dialog open onOpenChange={() => setShowPayment(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div>Outstanding: <strong>{formatINR(Math.max(0, showPayment.finalAmount - showPayment.totalPaid))}</strong></div>
              <Input type="number" placeholder="Amount (₹)" value={payAmount} onChange={e => { setPayAmount(e.target.value); setPayErr(""); }} />
              <Select value={payMethod} onValueChange={v => setPayMethod(v as ExpensePaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["cash","bank-transfer","cheque","upi","card","other"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Reference number (optional)" value={payRef} onChange={e => setPayRef(e.target.value)} />
              {payErr && <div className="text-red-400 text-xs">{payErr}</div>}
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setShowPayment(null)}>Cancel</Button>
              <Button size="sm" onClick={handlePay}>Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {showReject && (
        <Dialog open onOpenChange={() => setShowReject(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Reject Expense</DialogTitle></DialogHeader>
            <Input placeholder="Reason for rejection" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setShowReject(null)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={() => { rejectExpense(showReject.id, "Production Manager", rejectReason); setShowReject(null); }}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New Expense Dialog */}
      {showNew && (
        <Dialog open onOpenChange={() => setShowNew(false)}>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {!projectId && (
                <div className="col-span-2">
                  <label className="text-muted-foreground text-xs">Project</label>
                  <Select value={nf.projectId} onValueChange={v => setNf(x => ({...x, projectId: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-muted-foreground text-xs">Section</label>
                <Select value={nf.section} onValueChange={v => setNf(x => ({...x, section: v as "production"|"production-office"}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="production">Production</SelectItem><SelectItem value="production-office">Production Office</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-muted-foreground text-xs">Category</label>
                <Select value={nf.category} onValueChange={v => setNf(x => ({...x, category: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__office" disabled>─ Production Office ─</SelectItem>
                    {PRODUCTION_OFFICE_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                    <SelectItem value="__prod" disabled>─ Production ─</SelectItem>
                    {PRODUCTION_EXPENSE_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Title</label><Input value={nf.title} onChange={e => setNf(x => ({...x, title: e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Department</label><Input value={nf.department} onChange={e => setNf(x => ({...x, department: e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Vendor/Payee</label><Input value={nf.vendorPayee} onChange={e => setNf(x => ({...x, vendorPayee: e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Date</label><Input type="date" value={nf.expenseDate} onChange={e => setNf(x => ({...x, expenseDate: e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Quantity</label><Input type="number" value={nf.quantity} onChange={e => setNf(x => ({...x, quantity: e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Unit Cost (₹)</label><Input type="number" value={nf.unitCost} onChange={e => setNf(x => ({...x, unitCost: e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Tax (₹)</label><Input type="number" value={nf.taxAmount} onChange={e => setNf(x => ({...x, taxAmount: e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Discount (₹)</label><Input type="number" value={nf.discount} onChange={e => setNf(x => ({...x, discount: e.target.value}))} /></div>
              <div className="col-span-2 text-sm font-medium">
                Final Amount: {formatINR(computeAmounts().finalAmount)}
              </div>
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Notes</label><Input value={nf.notes} onChange={e => setNf(x => ({...x, notes: e.target.value}))} /></div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddExpense} disabled={!nf.title || !nf.unitCost}>Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Office Rent Tab ─────────────────────────────────────────────────────────
function OfficeRentTab({ projectId }: Props) {
  const rentals = useOfficeRentals(projectId);
  const allPayments = useOfficeRentPayments();
  const [selected, setSelected] = useState<OfficeRental | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showPay, setShowPay] = useState<OfficeRental | null>(null);
  const [payMonth, setPayMonth] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<ExpensePaymentMethod>("bank-transfer");
  const [payRef, setPayRef] = useState("");

  const rentPayments = selected ? allPayments.filter(p => p.officeRentalId === selected.id) : [];
  const totalPaidForSelected = rentPayments.reduce((s, p) => s + p.amount, 0);

  const [nf, setNf] = useState({ propertyName: "", address: "", landlordPayee: "", landlordPhone: "", monthlyRent: "", securityDeposit: "", leaseStartDate: "", leaseEndDate: "", paymentDueDay: "5", agreementNotes: "" });
  function handleAddRental() {
    addOfficeRental({ propertyName: nf.propertyName, address: nf.address, landlordPayee: nf.landlordPayee, landlordPhone: nf.landlordPhone || undefined, monthlyRent: parseFloat(nf.monthlyRent)||0, securityDeposit: parseFloat(nf.securityDeposit)||0, depositPaid: false, leaseStartDate: nf.leaseStartDate, leaseEndDate: nf.leaseEndDate, paymentDueDay: parseInt(nf.paymentDueDay)||5, agreementNotes: nf.agreementNotes || undefined, status: "active" });
    setShowNew(false);
  }
  function handlePayRent() {
    if (!showPay) return;
    recordRentPayment({ officeRentalId: showPay.id, projectId: showPay.projectId, month: payMonth, amount: parseFloat(payAmount)||0, paymentDate: new Date().toISOString().slice(0,10), paymentMethod: payMethod, referenceNumber: payRef || undefined, recordedBy: "Production Manager" });
    setShowPay(null); setPayMonth(""); setPayAmount(""); setPayRef("");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => setShowNew(true)}>+ Add Office Rental</Button></div>
      <table className="w-full text-sm">
        <thead><tr className="text-muted-foreground text-xs border-b border-border">
          {["Property","Project","Monthly Rent","Deposit","Lease Start","Lease End","Status","Actions"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
        </tr></thead>
        <tbody>
          {rentals.map(r => (
            <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(r)}>
              <td className="py-2 pr-3">{r.propertyName}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r.projectId ?? "Shared"}</td>
              <td className="py-2 pr-3">{formatINR(r.monthlyRent)}</td>
              <td className="py-2 pr-3 text-muted-foreground">{formatINR(r.securityDeposit)}</td>
              <td className="py-2 pr-3">{r.leaseStartDate}</td>
              <td className="py-2 pr-3">{r.leaseEndDate}</td>
              <td className="py-2 pr-3"><Badge className={r.status==="active"?"bg-emerald-500/20 text-emerald-300":r.status==="expired"?"bg-slate-500/20 text-slate-400":"bg-red-500/20 text-red-300"}>{r.status}</Badge></td>
              <td className="py-2 pr-3" onClick={ev => ev.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => { setShowPay(r); setPayMonth(""); setPayAmount(String(r.monthlyRent)); }}>Pay Rent</Button>
              </td>
            </tr>
          ))}
          {rentals.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No office rentals</td></tr>}
        </tbody>
      </table>

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{selected.propertyName}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Address", selected.address], ["Landlord", selected.landlordPayee], ["Phone", selected.landlordPhone ?? "—"], ["Monthly Rent", formatINR(selected.monthlyRent)], ["Security Deposit", formatINR(selected.securityDeposit)], ["Deposit Paid", selected.depositPaid ? "Yes" : "No"], ["Lease Start", selected.leaseStartDate], ["Lease End", selected.leaseEndDate], ["Payment Due Day", selected.paymentDueDay], ["Status", selected.status], ["Notes", selected.agreementNotes ?? "—"]].map(([k,v]) => (
                <div key={String(k)}><span className="text-muted-foreground">{k}: </span><span>{String(v)}</span></div>
              ))}
              <div className="col-span-2 font-medium">Total Rent Paid: {formatINR(totalPaidForSelected)}</div>
            </div>
            <div className="mt-3">
              <div className="font-semibold text-sm mb-2">Payment History</div>
              {rentPayments.length === 0 ? <div className="text-muted-foreground text-sm">No payments</div> : (
                <table className="w-full text-sm"><thead><tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left pb-1">Month</th><th className="text-right pb-1">Amount</th><th className="text-left pb-1 pl-3">Date</th><th className="text-left pb-1 pl-3">Ref</th>
                </tr></thead><tbody>
                  {rentPayments.sort((a,b)=>a.month.localeCompare(b.month)).map(p => <tr key={p.id} className="border-b border-border/40"><td className="py-1">{p.month}</td><td className="py-1 text-right">{formatINR(p.amount)}</td><td className="py-1 pl-3">{p.paymentDate}</td><td className="py-1 pl-3 text-muted-foreground">{p.referenceNumber ?? "—"}</td></tr>)}
                </tbody></table>
              )}
            </div>
            <DialogFooter>
              <Button size="sm" onClick={() => { setShowPay(selected); setSelected(null); setPayMonth(""); setPayAmount(String(selected.monthlyRent)); }}>Pay Rent</Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showPay && (
        <Dialog open onOpenChange={() => setShowPay(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Record Rent Payment</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div>Monthly rent: <strong>{formatINR(showPay.monthlyRent)}</strong></div>
              <Input type="month" placeholder="Month (YYYY-MM)" value={payMonth} onChange={e => setPayMonth(e.target.value)} />
              <Input type="number" placeholder="Amount (₹)" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              <Select value={payMethod} onValueChange={v => setPayMethod(v as ExpensePaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["cash","bank-transfer","cheque","upi","card","other"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Reference number (optional)" value={payRef} onChange={e => setPayRef(e.target.value)} />
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setShowPay(null)}>Cancel</Button>
              <Button size="sm" onClick={handlePayRent} disabled={!payMonth || !payAmount}>Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showNew && (
        <Dialog open onOpenChange={() => setShowNew(false)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Office Rental</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Property Name</label><Input value={nf.propertyName} onChange={e => setNf(x=>({...x,propertyName:e.target.value}))} /></div>
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Address</label><Input value={nf.address} onChange={e => setNf(x=>({...x,address:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Landlord/Payee</label><Input value={nf.landlordPayee} onChange={e => setNf(x=>({...x,landlordPayee:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Phone</label><Input value={nf.landlordPhone} onChange={e => setNf(x=>({...x,landlordPhone:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Monthly Rent (₹)</label><Input type="number" value={nf.monthlyRent} onChange={e => setNf(x=>({...x,monthlyRent:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Security Deposit (₹)</label><Input type="number" value={nf.securityDeposit} onChange={e => setNf(x=>({...x,securityDeposit:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Lease Start</label><Input type="date" value={nf.leaseStartDate} onChange={e => setNf(x=>({...x,leaseStartDate:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Lease End</label><Input type="date" value={nf.leaseEndDate} onChange={e => setNf(x=>({...x,leaseEndDate:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Payment Due Day</label><Input type="number" min={1} max={28} value={nf.paymentDueDay} onChange={e => setNf(x=>({...x,paymentDueDay:e.target.value}))} /></div>
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Notes</label><Input value={nf.agreementNotes} onChange={e => setNf(x=>({...x,agreementNotes:e.target.value}))} /></div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddRental} disabled={!nf.propertyName || !nf.landlordPayee}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Maintenance Tab ──────────────────────────────────────────────────────────
function MaintenanceTab({ projectId }: Props) {
  const records = useMaintenanceRecords(projectId);
  const [selected, setSelected] = useState<MaintenanceRecord | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const filtered = records.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    return true;
  });

  const [nf, setNf] = useState({ category: "electrical", title: "", description: "", reportedDate: new Date().toISOString().slice(0,10), assignedTo: "", priority: "medium" as MaintenancePriority, expectedCompletion: "", estimatedCost: "", notes: "" });

  function handleAdd() {
    addMaintenanceRecord({ category: nf.category as MaintenanceRecord["category"], title: nf.title, description: nf.description || undefined, reportedDate: nf.reportedDate, assignedTo: nf.assignedTo || undefined, priority: nf.priority, expectedCompletion: nf.expectedCompletion || undefined, estimatedCost: parseFloat(nf.estimatedCost)||0, actualCost: 0, status: "reported", notes: nf.notes || undefined });
    setShowNew(false);
  }

  const nextStatuses = selected ? (MAINTENANCE_STATUS_FLOW[selected.status] ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem>{Object.keys(MAINTENANCE_STATUS_FLOW).map(s => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32"><SelectValue placeholder="All Priorities" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{["urgent","high","medium","low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={() => setShowNew(true)}>+ New Request</Button>
      </div>

      <table className="w-full text-sm">
        <thead><tr className="text-muted-foreground text-xs border-b border-border">
          {["Category","Title","Priority","Status","Est. Cost","Actual Cost","Assigned To","Actions"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(r)}>
              <td className="py-2 pr-3">{MAINTENANCE_CATEGORIES.find(c => c.key === r.category)?.label ?? r.category}</td>
              <td className="py-2 pr-3 max-w-[160px] truncate">{r.title}</td>
              <td className="py-2 pr-3"><Badge className={priorityColor[r.priority]}>{r.priority}</Badge></td>
              <td className="py-2 pr-3"><Badge className={maintenanceStatusColor[r.status]}>{statusLabel(r.status)}</Badge></td>
              <td className="py-2 pr-3">{formatINR(r.estimatedCost)}</td>
              <td className="py-2 pr-3 text-emerald-400">{r.actualCost > 0 ? formatINR(r.actualCost) : "—"}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r.assignedTo ?? "—"}</td>
              <td className="py-2 pr-3" onClick={ev => ev.stopPropagation()}>
                {(MAINTENANCE_STATUS_FLOW[r.status] ?? []).slice(0,2).map(s => (
                  <Button key={s} size="sm" variant="outline" className="h-6 text-xs mr-1" onClick={() => updateMaintenanceRecord(r.id, { status: s as MaintenanceStatus })}>{statusLabel(s)}</Button>
                ))}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No maintenance records</td></tr>}
        </tbody>
      </table>

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Category", MAINTENANCE_CATEGORIES.find(c=>c.key===selected.category)?.label ?? selected.category], ["Priority", selected.priority], ["Status", statusLabel(selected.status)], ["Reported", selected.reportedDate], ["Assigned To", selected.assignedTo ?? "—"], ["Expected Completion", selected.expectedCompletion ?? "—"], ["Actual Completion", selected.actualCompletion ?? "—"], ["Est. Cost", formatINR(selected.estimatedCost)], ["Actual Cost", formatINR(selected.actualCost)], ["Invoice Ref", selected.invoiceReference ?? "—"], ["Notes", selected.notes ?? "—"], ["Description", selected.description ?? "—"]].map(([k,v]) => (
                <div key={String(k)}><span className="text-muted-foreground">{k}: </span><span>{String(v)}</span></div>
              ))}
            </div>
            <DialogFooter className="flex-wrap gap-2">
              {nextStatuses.map(s => (
                <Button key={s} size="sm" variant="outline" onClick={() => { updateMaintenanceRecord(selected.id, { status: s as MaintenanceStatus }); setSelected(null); }}>{statusLabel(s)}</Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showNew && (
        <Dialog open onOpenChange={() => setShowNew(false)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-muted-foreground text-xs">Category</label>
                <Select value={nf.category} onValueChange={v => setNf(x=>({...x,category:v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-muted-foreground text-xs">Priority</label>
                <Select value={nf.priority} onValueChange={v => setNf(x=>({...x,priority:v as MaintenancePriority}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["urgent","high","medium","low"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Title</label><Input value={nf.title} onChange={e => setNf(x=>({...x,title:e.target.value}))} /></div>
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Description</label><Input value={nf.description} onChange={e => setNf(x=>({...x,description:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Reported Date</label><Input type="date" value={nf.reportedDate} onChange={e => setNf(x=>({...x,reportedDate:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Assigned To</label><Input value={nf.assignedTo} onChange={e => setNf(x=>({...x,assignedTo:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Expected Completion</label><Input type="date" value={nf.expectedCompletion} onChange={e => setNf(x=>({...x,expectedCompletion:e.target.value}))} /></div>
              <div><label className="text-muted-foreground text-xs">Estimated Cost (₹)</label><Input type="number" value={nf.estimatedCost} onChange={e => setNf(x=>({...x,estimatedCost:e.target.value}))} /></div>
              <div className="col-span-2"><label className="text-muted-foreground text-xs">Notes</label><Input value={nf.notes} onChange={e => setNf(x=>({...x,notes:e.target.value}))} /></div>
            </div>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAdd} disabled={!nf.title}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab({ projectId }: Props) {
  const expPayments = useExpensePayments();
  const rentPayments = useOfficeRentPayments();
  const projects = useAppDataSlice("projects");
  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.title])), [projects]);
  const [filterType, setFilterType] = useState("all");

  type UnifiedPayment = { date: string; type: string; reference: string; amount: number; project: string; linked: string; method: string; recordedBy: string };

  const unified: UnifiedPayment[] = useMemo(() => {
    const rows: UnifiedPayment[] = [];
    expPayments.forEach(p => {
      if (projectId && p.projectId !== projectId) return;
      rows.push({ date: p.paymentDate, type: "Expense", reference: p.referenceNumber ?? "—", amount: p.amount, project: projectMap[p.projectId] ?? p.projectId, linked: p.expenseId, method: p.paymentMethod, recordedBy: p.recordedBy });
    });
    rentPayments.forEach(p => {
      if (projectId && p.projectId && p.projectId !== projectId) return;
      rows.push({ date: p.paymentDate, type: "Office Rent", reference: p.referenceNumber ?? "—", amount: p.amount, project: p.projectId ? (projectMap[p.projectId] ?? p.projectId) : "Shared", linked: `${p.officeRentalId} (${p.month})`, method: p.paymentMethod, recordedBy: p.recordedBy });
    });
    return rows.sort((a,b) => b.date.localeCompare(a.date));
  }, [expPayments, rentPayments, projectMap, projectId]);

  const filtered = unified.filter(p => filterType === "all" || p.type === filterType);
  const total = filtered.reduce((s,p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="Expense">Expense</SelectItem><SelectItem value="Office Rent">Office Rent</SelectItem></SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground">Total: <strong>{formatINR(total)}</strong></div>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-muted-foreground text-xs border-b border-border">
          {["Date","Type","Reference","Amount","Project","Linked Record","Method","Recorded By"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr key={i} className="border-b border-border/40">
              <td className="py-2 pr-3">{p.date}</td>
              <td className="py-2 pr-3"><Badge className={p.type==="Expense"?"bg-blue-500/20 text-blue-300":"bg-violet-500/20 text-violet-300"}>{p.type}</Badge></td>
              <td className="py-2 pr-3 text-muted-foreground">{p.reference}</td>
              <td className="py-2 pr-3 font-medium">{formatINR(p.amount)}</td>
              <td className="py-2 pr-3 truncate max-w-[120px]">{p.project}</td>
              <td className="py-2 pr-3 text-muted-foreground text-xs">{p.linked}</td>
              <td className="py-2 pr-3">{p.method}</td>
              <td className="py-2 pr-3 text-muted-foreground">{p.recordedBy}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No payments found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ projectId }: Props) {
  const expenses = useProductionExpenses(projectId);
  const rentals = useOfficeRentals(projectId);
  const maintenance = useMaintenanceRecords(projectId);
  const allRentPayments = useOfficeRentPayments();
  const projects = useAppDataSlice("projects");
  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.title])), [projects]);
  const [subTab, setSubTab] = useState("project");

  const active = expenses.filter(e => !["cancelled","rejected"].includes(e.paymentStatus));

  const byProject = useMemo(() => {
    const map: Record<string, { title: string; expenses: number; rent: number; maintenance: number; paid: number; outstanding: number }> = {};
    active.forEach(e => {
      if (!map[e.projectId]) map[e.projectId] = { title: projectMap[e.projectId] ?? e.projectId, expenses: 0, rent: 0, maintenance: 0, paid: 0, outstanding: 0 };
      map[e.projectId].expenses += e.finalAmount;
      map[e.projectId].paid += e.totalPaid;
      map[e.projectId].outstanding += Math.max(0, e.finalAmount - e.totalPaid);
    });
    return Object.values(map).sort((a,b) => b.expenses - a.expenses);
  }, [active, projectMap]);

  const byCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    active.forEach(e => { if (!map[e.category]) map[e.category] = { total: 0, count: 0 }; map[e.category].total += e.finalAmount; map[e.category].count++; });
    return Object.entries(map).sort((a,b) => b[1].total - a[1].total);
  }, [active]);

  const byDept = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    active.forEach(e => { const k = e.department || "Unassigned"; if (!map[k]) map[k] = { total: 0, count: 0 }; map[k].total += e.finalAmount; map[k].count++; });
    return Object.entries(map).sort((a,b) => b[1].total - a[1].total);
  }, [active]);

  const monthly = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    active.forEach(e => { const m = e.expenseDate.slice(0,7); if (!map[m]) map[m] = { amount: 0, count: 0 }; map[m].amount += e.finalAmount; map[m].count++; });
    return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 12);
  }, [active]);

  const rentHistory = useMemo(() => rentals.map(r => ({
    ...r,
    payments: allRentPayments.filter(p => p.officeRentalId === r.id),
    totalPaid: allRentPayments.filter(p => p.officeRentalId === r.id).reduce((s,p) => s+p.amount, 0),
  })), [rentals, allRentPayments]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[["project","Project-wise"],["category","Category-wise"],["dept","Department-wise"],["monthly","Monthly"],["rent","Office Rent"],["maint","Maintenance"]].map(([k,l]) => (
          <Button key={k} size="sm" variant={subTab===k?"default":"outline"} onClick={() => setSubTab(k)}>{l}</Button>
        ))}
      </div>

      {subTab === "project" && (
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground text-xs border-b border-border">
            {["Project","Total Expenses","Paid","Outstanding"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {byProject.map(r => <tr key={r.title} className="border-b border-border/40">
              <td className="py-2 pr-3">{r.title}</td><td className="py-2 pr-3">{formatINR(r.expenses)}</td><td className="py-2 pr-3 text-emerald-400">{formatINR(r.paid)}</td><td className="py-2 pr-3 text-amber-400">{formatINR(r.outstanding)}</td>
            </tr>)}
            <tr className="font-semibold border-t border-border">
              <td className="py-2">Total</td><td className="py-2 pr-3">{formatINR(byProject.reduce((s,r)=>s+r.expenses,0))}</td><td className="py-2 pr-3 text-emerald-400">{formatINR(byProject.reduce((s,r)=>s+r.paid,0))}</td><td className="py-2 pr-3 text-amber-400">{formatINR(byProject.reduce((s,r)=>s+r.outstanding,0))}</td>
            </tr>
          </tbody>
        </table>
      )}

      {subTab === "category" && (
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground text-xs border-b border-border">
            {["Category","Records","Total Amount"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {byCategory.map(([k,v]) => <tr key={k} className="border-b border-border/40">
              <td className="py-2 pr-3">{catLabel(k)}</td><td className="py-2 pr-3">{v.count}</td><td className="py-2 pr-3">{formatINR(v.total)}</td>
            </tr>)}
          </tbody>
        </table>
      )}

      {subTab === "dept" && (
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground text-xs border-b border-border">
            {["Department","Records","Total Amount"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {byDept.map(([k,v]) => <tr key={k} className="border-b border-border/40">
              <td className="py-2 pr-3">{k}</td><td className="py-2 pr-3">{v.count}</td><td className="py-2 pr-3">{formatINR(v.total)}</td>
            </tr>)}
          </tbody>
        </table>
      )}

      {subTab === "monthly" && (
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground text-xs border-b border-border">
            {["Month","Records","Total Amount"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {monthly.map(([m,v]) => <tr key={m} className="border-b border-border/40">
              <td className="py-2 pr-3">{m}</td><td className="py-2 pr-3">{v.count}</td><td className="py-2 pr-3">{formatINR(v.amount)}</td>
            </tr>)}
          </tbody>
        </table>
      )}

      {subTab === "rent" && (
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground text-xs border-b border-border">
            {["Property","Project","Monthly Rent","Payments","Total Paid"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {rentHistory.map(r => <tr key={r.id} className="border-b border-border/40">
              <td className="py-2 pr-3">{r.propertyName}</td><td className="py-2 pr-3 text-muted-foreground">{r.projectId ?? "Shared"}</td><td className="py-2 pr-3">{formatINR(r.monthlyRent)}</td><td className="py-2 pr-3">{r.payments.length}</td><td className="py-2 pr-3 text-emerald-400">{formatINR(r.totalPaid)}</td>
            </tr>)}
          </tbody>
        </table>
      )}

      {subTab === "maint" && (
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground text-xs border-b border-border">
            {["Title","Category","Status","Est. Cost","Actual Cost"].map(h => <th key={h} className="text-left py-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {maintenance.map(m => <tr key={m.id} className="border-b border-border/40">
              <td className="py-2 pr-3 truncate max-w-[160px]">{m.title}</td><td className="py-2 pr-3">{MAINTENANCE_CATEGORIES.find(c=>c.key===m.category)?.label??m.category}</td><td className="py-2 pr-3"><Badge className={maintenanceStatusColor[m.status]}>{statusLabel(m.status)}</Badge></td><td className="py-2 pr-3">{formatINR(m.estimatedCost)}</td><td className="py-2 pr-3 text-emerald-400">{m.actualCost > 0 ? formatINR(m.actualCost) : "—"}</td>
            </tr>)}
            <tr className="font-semibold border-t border-border">
              <td className="py-2" colSpan={3}>Total</td><td className="py-2 pr-3">{formatINR(maintenance.reduce((s,m)=>s+m.estimatedCost,0))}</td><td className="py-2 pr-3 text-emerald-400">{formatINR(maintenance.reduce((s,m)=>s+m.actualCost,0))}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function ExpensesWorkspace({ projectId }: Props) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="register">Expense Register</TabsTrigger>
          <TabsTrigger value="rent">Office Rent</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab projectId={projectId} /></TabsContent>
        <TabsContent value="register"><ExpenseRegisterTab projectId={projectId} /></TabsContent>
        <TabsContent value="rent"><OfficeRentTab projectId={projectId} /></TabsContent>
        <TabsContent value="maintenance"><MaintenanceTab projectId={projectId} /></TabsContent>
        <TabsContent value="payments"><PaymentsTab projectId={projectId} /></TabsContent>
        <TabsContent value="reports"><ReportsTab projectId={projectId} /></TabsContent>
      </Tabs>
    </div>
  );
}
