"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppDataSlice } from "@/lib/app-data-store";
import {
  useRentalVendors,
  addRentalVendor,
  useRentalRecords,
  addRentalRecord,
  updateRentalStatus,
  useRentalPayments,
  recordRentalPayment,
  calcRentalOutstanding,
  calcRentalDashboardSummary,
  calcRentalSubtotal,
} from "@/lib/rental-store";
import {
  VENDOR_CATEGORIES,
  RENTAL_CATEGORIES,
  RENTAL_STATUS_FLOW,
  RENTAL_STATUS_LABELS,
} from "@/lib/rental-categories";
import type { Vendor, RentalRecord, RentalStatus } from "@/lib/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const rentalStatusColor: Record<string, string> = {
  requested: "bg-slate-500/20 text-slate-300",
  approved: "bg-blue-500/20 text-blue-300",
  booked: "bg-violet-500/20 text-violet-300",
  issued: "bg-amber-500/20 text-amber-400",
  "partially-returned": "bg-orange-500/20 text-orange-300",
  returned: "bg-emerald-500/20 text-emerald-300",
  overdue: "bg-red-500/20 text-red-300",
  cancelled: "bg-gray-500/20 text-gray-400",
};

interface Props {
  projectId?: string;
}

export function RentalsWorkspace({ projectId }: Props) {
  const projects = useAppDataSlice("projects");
  const vendors = useRentalVendors();
  const allRentals = useRentalRecords(projectId);
  const allPayments = useRentalPayments();

  const summary = useMemo(() => calcRentalDashboardSummary(allRentals), [allRentals]);

  return (
    <Tabs defaultValue="dashboard" className="space-y-4">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="register">Rental Register</TabsTrigger>
        <TabsTrigger value="vendors">Vendors</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="returns">Returns & Overdue</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <DashboardTab
          summary={summary}
          rentals={allRentals}
          vendors={vendors}
          projects={projects}
          projectId={projectId}
        />
      </TabsContent>

      <TabsContent value="register">
        <RentalRegisterTab
          rentals={allRentals}
          vendors={vendors}
          projects={projects}
          payments={allPayments}
          projectId={projectId}
        />
      </TabsContent>

      <TabsContent value="vendors">
        <VendorsTab vendors={vendors} rentals={allRentals} />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentsTab
          payments={allPayments}
          rentals={allRentals}
          vendors={vendors}
          projects={projects}
          projectId={projectId}
        />
      </TabsContent>

      <TabsContent value="returns">
        <ReturnsOverdueTab rentals={allRentals} vendors={vendors} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardTab({
  summary,
  rentals,
  vendors,
  projects,
  projectId,
}: {
  summary: ReturnType<typeof calcRentalDashboardSummary>;
  rentals: RentalRecord[];
  vendors: Vendor[];
  projects: ReturnType<typeof useAppDataSlice<"projects">>;
  projectId?: string;
}) {
  const projectTotals = useMemo(() => {
    const map: Record<string, { count: number; cost: number; paid: number }> = {};
    rentals.forEach((r) => {
      if (!map[r.projectId]) map[r.projectId] = { count: 0, cost: 0, paid: 0 };
      map[r.projectId].count++;
      map[r.projectId].cost += r.totalRentalCost;
      map[r.projectId].paid += r.totalPaid;
    });
    return map;
  }, [rentals]);

  const catTotals = useMemo(() => {
    const map: Record<string, { count: number; cost: number }> = {};
    rentals.forEach((r) => {
      if (!map[r.category]) map[r.category] = { count: 0, cost: 0 };
      map[r.category].count++;
      map[r.category].cost += r.totalRentalCost;
    });
    return Object.entries(map).sort((a, b) => b[1].cost - a[1].cost);
  }, [rentals]);

  const today = new Date();
  const upcoming = rentals.filter((r) => {
    const ret = new Date(r.expectedReturnDate);
    const diff = (ret.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && ["issued", "partially-returned", "booked"].includes(r.status);
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Rentals", value: summary.total, sub: `${summary.active} active` },
          { label: "Pending Approval", value: summary.pendingApproval, sub: "awaiting approval" },
          { label: "Overdue", value: summary.overdue, sub: "past return date", warn: summary.overdue > 0 },
          { label: "Total Cost", value: fmt(summary.totalCost), sub: `Outstanding: ${fmt(summary.totalOutstanding)}` },
        ].map((c) => (
          <Card key={c.label} className={c.warn ? "border-red-500/40" : ""}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm font-medium mt-1">{c.label}</div>
              <div className={`text-xs mt-1 ${c.warn ? "text-red-400" : "text-muted-foreground"}`}>{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {!projectId && (
          <Card>
            <CardHeader><CardTitle className="text-sm">By Project</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th className="text-left pb-2">Project</th>
                    <th className="text-right pb-2">Rentals</th>
                    <th className="text-right pb-2">Cost</th>
                    <th className="text-right pb-2">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const t = projectTotals[p.id];
                    if (!t) return null;
                    return (
                      <tr key={p.id} className="border-t border-border/40">
                        <td className="py-1.5 pr-2 font-medium truncate max-w-[120px]">{p.title}</td>
                        <td className="text-right text-muted-foreground">{t.count}</td>
                        <td className="text-right">{fmt(t.cost)}</td>
                        <td className="text-right text-emerald-400">{fmt(t.paid)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {catTotals.slice(0, 8).map(([cat, t]) => {
              const label = RENTAL_CATEGORIES.find((c) => c.key === cat)?.label ?? cat;
              const pct = summary.totalCost > 0 ? Math.round((t.cost / summary.totalCost) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{label}</span>
                    <span className="text-muted-foreground">{fmt(t.cost)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {upcoming.length > 0 && (
          <Card className="border-amber-500/30">
            <CardHeader><CardTitle className="text-sm text-amber-400">Upcoming Returns (7 days)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                  <div>
                    <div className="font-medium">{r.itemName}</div>
                    <div className="text-xs text-muted-foreground">Due: {r.expectedReturnDate}</div>
                  </div>
                  <Badge className={`text-xs ${rentalStatusColor[r.status]}`}>{RENTAL_STATUS_LABELS[r.status]}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Rental Register ──────────────────────────────────────────────────────────

function RentalRegisterTab({
  rentals,
  vendors,
  projects,
  payments,
  projectId,
}: {
  rentals: RentalRecord[];
  vendors: Vendor[];
  projects: ReturnType<typeof useAppDataSlice<"projects">>;
  payments: ReturnType<typeof useRentalPayments>;
  projectId?: string;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");
  const [selectedRental, setSelectedRental] = useState<RentalRecord | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(
    () =>
      rentals.filter((r) => {
        const v = vendors.find((v) => v.id === r.vendorId);
        const matchSearch =
          !search ||
          r.itemName.toLowerCase().includes(search.toLowerCase()) ||
          v?.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === "all" || r.status === filterStatus;
        const matchCat = filterCat === "all" || r.category === filterCat;
        const matchVendor = filterVendor === "all" || r.vendorId === filterVendor;
        return matchSearch && matchStatus && matchCat && matchVendor;
      }),
    [rentals, search, filterStatus, filterCat, filterVendor, vendors]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search rentals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(RENTAL_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {RENTAL_CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!projectId && (
            <Select value={filterVendor} onValueChange={setFilterVendor}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Vendor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>+ New Rental</Button>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} records</div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Item</th>
              <th className="text-left p-3 font-medium">Vendor</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Dates</th>
              <th className="text-right p-3 font-medium">Cost</th>
              <th className="text-right p-3 font-medium">Outstanding</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const v = vendors.find((v) => v.id === r.vendorId);
              const outstanding = calcRentalOutstanding(r);
              const nextStatuses = RENTAL_STATUS_FLOW[r.status] ?? [];
              return (
                <tr key={r.id} className="border-t border-border/30 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{r.itemName}</div>
                    <div className="text-xs text-muted-foreground">Qty: {r.quantity}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{v?.name ?? r.vendorId}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {RENTAL_CATEGORIES.find((c) => c.key === r.category)?.label ?? r.category}
                  </td>
                  <td className="p-3 text-xs">
                    <div>{r.rentalStartDate}</div>
                    <div className="text-muted-foreground">→ {r.expectedReturnDate}</div>
                  </td>
                  <td className="p-3 text-right">{fmt(r.totalRentalCost)}</td>
                  <td className={`p-3 text-right ${outstanding > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {fmt(outstanding)}
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={`text-xs ${rentalStatusColor[r.status]}`}>
                      {RENTAL_STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRental(r)}>View</Button>
                      {nextStatuses.slice(0, 1).map((ns) => (
                        <Button
                          key={ns}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => updateRentalStatus(r.id, ns as RentalStatus)}
                        >
                          {RENTAL_STATUS_LABELS[ns]}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No rentals match filters</div>
        )}
      </div>

      {selectedRental && (
        <RentalDetailDialog
          rental={selectedRental}
          vendors={vendors}
          payments={payments.filter((p) => p.rentalId === selectedRental.id)}
          onClose={() => setSelectedRental(null)}
        />
      )}

      {showNew && (
        <NewRentalDialog
          vendors={vendors}
          projects={projects}
          projectId={projectId}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}

// ─── Rental Detail Dialog ─────────────────────────────────────────────────────

function RentalDetailDialog({
  rental,
  vendors,
  payments,
  onClose,
}: {
  rental: RentalRecord;
  vendors: Vendor[];
  payments: RentalPayment[];
  onClose: () => void;
}) {
  const vendor = vendors.find((v) => v.id === rental.vendorId);
  const outstanding = calcRentalOutstanding(rental);
  const nextStatuses = RENTAL_STATUS_FLOW[rental.status] ?? [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rental.itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Vendor:</span> {vendor?.name}</div>
            <div><span className="text-muted-foreground">Category:</span> {RENTAL_CATEGORIES.find((c) => c.key === rental.category)?.label}</div>
            <div><span className="text-muted-foreground">Quantity:</span> {rental.quantity}</div>
            <div><span className="text-muted-foreground">Rate:</span> {fmt(rental.rateAmount)} / {rental.ratePeriod}</div>
            <div><span className="text-muted-foreground">Start:</span> {rental.rentalStartDate}</div>
            <div><span className="text-muted-foreground">Expected Return:</span> {rental.expectedReturnDate}</div>
            {rental.actualReturnDate && <div><span className="text-muted-foreground">Actual Return:</span> {rental.actualReturnDate}</div>}
            <div><span className="text-muted-foreground">Duration:</span> {rental.rentalDays} {rental.ratePeriod === "fixed" ? "(fixed)" : "days"}</div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm bg-muted/30 p-3 rounded">
            <div><div className="text-muted-foreground text-xs">Subtotal</div><div className="font-medium">{fmt(rental.subtotal)}</div></div>
            <div><div className="text-muted-foreground text-xs">Additional</div><div className="font-medium">{fmt(rental.additionalCharges)}</div></div>
            <div><div className="text-muted-foreground text-xs">Late Fees</div><div className="font-medium text-red-400">{fmt(rental.lateFees)}</div></div>
            <div><div className="text-muted-foreground text-xs">Total Cost</div><div className="font-bold">{fmt(rental.totalRentalCost)}</div></div>
            <div><div className="text-muted-foreground text-xs">Deposit</div><div className="font-medium">{fmt(rental.deposit)}</div></div>
            <div><div className="text-muted-foreground text-xs">Outstanding</div><div className={`font-bold ${outstanding > 0 ? "text-amber-400" : "text-emerald-400"}`}>{fmt(outstanding)}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className={rentalStatusColor[rental.status]}>{RENTAL_STATUS_LABELS[rental.status]}</Badge>
            {nextStatuses.map((ns) => (
              <Button key={ns} size="sm" variant="outline" onClick={() => { updateRentalStatus(rental.id, ns as RentalStatus); onClose(); }}>
                → {RENTAL_STATUS_LABELS[ns]}
              </Button>
            ))}
          </div>
          {rental.notes && <div className="text-sm text-muted-foreground">{rental.notes}</div>}
          {payments.length > 0 && (
            <div>
              <div className="font-medium text-sm mb-2">Payment History</div>
              <div className="space-y-1">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm border-b border-border/30 pb-1">
                    <div>
                      <span className={p.isDeposit ? "text-violet-400" : ""}>{p.isDeposit ? "Deposit" : "Payment"}</span>
                      {p.paymentReference && <span className="text-xs text-muted-foreground ml-2">{p.paymentReference}</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{fmt(p.amount)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{p.paymentDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Rental Dialog ────────────────────────────────────────────────────────

function NewRentalDialog({
  vendors,
  projects,
  projectId,
  onClose,
}: {
  vendors: Vendor[];
  projects: ReturnType<typeof useAppDataSlice<"projects">>;
  projectId?: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    projectId: projectId ?? "",
    vendorId: "",
    category: "camera-equipment" as string,
    itemName: "",
    quantity: 1,
    ratePeriod: "daily" as string,
    rateAmount: 0,
    rentalStartDate: "",
    expectedReturnDate: "",
    deposit: 0,
    description: "",
    notes: "",
  });

  const rentalDays = useMemo(() => {
    if (!form.rentalStartDate || !form.expectedReturnDate) return 0;
    const diff =
      (new Date(form.expectedReturnDate).getTime() - new Date(form.rentalStartDate).getTime()) /
      (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diff));
  }, [form.rentalStartDate, form.expectedReturnDate]);

  const subtotal =
    form.ratePeriod === "fixed"
      ? form.rateAmount
      : form.quantity * form.rateAmount * rentalDays;

  const handleSubmit = () => {
    if (!form.projectId || !form.vendorId || !form.itemName || !form.rentalStartDate || !form.expectedReturnDate) return;
    addRentalRecord({
      projectId: form.projectId,
      vendorId: form.vendorId,
      category: form.category as RentalRecord["category"],
      itemName: form.itemName,
      description: form.description,
      quantity: form.quantity,
      ratePeriod: form.ratePeriod as RentalRecord["ratePeriod"],
      rateAmount: form.rateAmount,
      rentalStartDate: form.rentalStartDate,
      expectedReturnDate: form.expectedReturnDate,
      rentalDays,
      subtotal,
      deposit: form.deposit,
      additionalCharges: 0,
      lateFees: 0,
      totalRentalCost: subtotal,
      depositForfeited: false,
      totalPaid: 0,
      status: "requested",
      notes: form.notes,
    });
    onClose();
  };

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Rental Request</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          {!projectId && (
            <div>
              <label className="text-muted-foreground text-xs">Project</label>
              <Select value={form.projectId} onValueChange={(v) => set("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-muted-foreground text-xs">Vendor</label>
            <Select value={form.vendorId} onValueChange={(v) => set("vendorId", v)}>
              <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
              <SelectContent>{vendors.filter(v => v.status === "active").map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Category</label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RENTAL_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Item Name</label>
            <Input value={form.itemName} onChange={(e) => set("itemName", e.target.value)} placeholder="e.g. ARRI ALEXA Mini LF" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs">Quantity</label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="text-muted-foreground text-xs">Rate Period</label>
              <Select value={form.ratePeriod} onValueChange={(v) => set("ratePeriod", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs">Rate Amount (₹)</label>
              <Input type="number" min={0} value={form.rateAmount} onChange={(e) => set("rateAmount", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-muted-foreground text-xs">Deposit (₹)</label>
              <Input type="number" min={0} value={form.deposit} onChange={(e) => set("deposit", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs">Start Date</label>
              <Input type="date" value={form.rentalStartDate} onChange={(e) => set("rentalStartDate", e.target.value)} />
            </div>
            <div>
              <label className="text-muted-foreground text-xs">Expected Return</label>
              <Input type="date" value={form.expectedReturnDate} onChange={(e) => set("expectedReturnDate", e.target.value)} />
            </div>
          </div>
          {rentalDays > 0 && (
            <div className="bg-muted/30 p-3 rounded text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span><span>{rentalDays} {form.ratePeriod === "fixed" ? "" : "days"}</span></div>
              <div className="flex justify-between font-medium"><span>Estimated Cost:</span><span>{fmt(subtotal)}</span></div>
            </div>
          )}
          <div>
            <label className="text-muted-foreground text-xs">Notes</label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vendors Tab ──────────────────────────────────────────────────────────────

function VendorsTab({ vendors, rentals }: { vendors: Vendor[]; rentals: RentalRecord[] }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [showNew, setShowNew] = useState(false);

  const vendorTotals = useMemo(() => {
    const map: Record<string, { count: number; cost: number }> = {};
    rentals.forEach((r) => {
      if (!map[r.vendorId]) map[r.vendorId] = { count: 0, cost: 0 };
      map[r.vendorId].count++;
      map[r.vendorId].cost += r.totalRentalCost;
    });
    return map;
  }, [rentals]);

  const filtered = vendors.filter((v) => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || v.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {VENDOR_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>+ Add Vendor</Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Vendor</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Contact</th>
              <th className="text-right p-3 font-medium">Rentals</th>
              <th className="text-right p-3 font-medium">Business Value</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const t = vendorTotals[v.id];
              return (
                <tr key={v.id} className="border-t border-border/30 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{v.name}</div>
                    {v.gstin && <div className="text-xs text-muted-foreground">GSTIN: {v.gstin}</div>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{VENDOR_CATEGORIES.find((c) => c.key === v.category)?.label}</td>
                  <td className="p-3">
                    <div>{v.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">{v.phone}</div>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">{t?.count ?? 0}</td>
                  <td className="p-3 text-right">{t ? fmt(t.cost) : "—"}</td>
                  <td className="p-3 text-center">
                    <Badge className={v.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-500/20 text-gray-400"}>
                      {v.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(v)}>View</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">No vendors found</div>}
      </div>

      {selected && (
        <VendorDetailDialog
          vendor={selected}
          rentals={rentals.filter((r) => r.vendorId === selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
      {showNew && <NewVendorDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}

function VendorDetailDialog({ vendor, rentals, onClose }: { vendor: Vendor; rentals: RentalRecord[]; onClose: () => void }) {
  const totalBusiness = rentals.reduce((s, r) => s + r.totalRentalCost, 0);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{vendor.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Category: </span>{VENDOR_CATEGORIES.find((c) => c.key === vendor.category)?.label}</div>
            <div><span className="text-muted-foreground">Status: </span><Badge className={vendor.status === "active" ? "bg-emerald-500/20 text-emerald-300 text-xs" : "bg-gray-500/20 text-gray-400 text-xs"}>{vendor.status}</Badge></div>
            <div><span className="text-muted-foreground">Contact: </span>{vendor.contactPerson}</div>
            <div><span className="text-muted-foreground">Phone: </span>{vendor.phone}</div>
            <div><span className="text-muted-foreground">Email: </span>{vendor.email}</div>
            {vendor.gstin && <div><span className="text-muted-foreground">GSTIN: </span>{vendor.gstin}</div>}
          </div>
          <div><span className="text-muted-foreground">Address: </span>{vendor.address}</div>
          <div><span className="text-muted-foreground">Services: </span>{vendor.services}</div>
          <div><span className="text-muted-foreground">Payment Terms: </span>{vendor.paymentTerms}</div>
          <div className="bg-muted/30 p-3 rounded">
            <div className="font-medium">Total Business: {fmt(totalBusiness)}</div>
            <div className="text-muted-foreground text-xs">{rentals.length} rental(s)</div>
          </div>
          {rentals.length > 0 && (
            <div>
              <div className="font-medium mb-2">Rental History</div>
              {rentals.map((r) => (
                <div key={r.id} className="flex justify-between text-sm border-b border-border/30 pb-1 mb-1">
                  <span>{r.itemName}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground text-xs">{r.rentalStartDate}</span>
                    <Badge className={`text-xs ${rentalStatusColor[r.status]}`}>{RENTAL_STATUS_LABELS[r.status]}</Badge>
                    <span>{fmt(r.totalRentalCost)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewVendorDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", contactPerson: "", phone: "", email: "", address: "",
    gstin: "", category: "camera-equipment" as string, services: "",
    paymentTerms: "", notes: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.name || !form.contactPerson || !form.phone) return;
    addRentalVendor({ ...form, category: form.category as Vendor["category"], status: "active" });
    onClose();
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div><label className="text-muted-foreground text-xs">Name *</label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><label className="text-muted-foreground text-xs">Category</label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VENDOR_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-muted-foreground text-xs">Contact Person *</label><Input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} /></div>
            <div><label className="text-muted-foreground text-xs">Phone *</label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div><label className="text-muted-foreground text-xs">Email</label><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className="text-muted-foreground text-xs">Address</label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-muted-foreground text-xs">GSTIN</label><Input value={form.gstin} onChange={(e) => set("gstin", e.target.value)} /></div>
            <div><label className="text-muted-foreground text-xs">Payment Terms</label><Input value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} /></div>
          </div>
          <div><label className="text-muted-foreground text-xs">Services</label><Textarea value={form.services} onChange={(e) => set("services", e.target.value)} rows={2} /></div>
          <div><label className="text-muted-foreground text-xs">Notes</label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Vendor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

type RentalPayment = ReturnType<typeof useRentalPayments>[number];

function PaymentsTab({
  payments,
  rentals,
  vendors,
  projects,
  projectId,
}: {
  payments: RentalPayment[];
  rentals: RentalRecord[];
  vendors: Vendor[];
  projects: ReturnType<typeof useAppDataSlice<"projects">>;
  projectId?: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const [filterRental, setFilterRental] = useState("all");

  const filtered = payments.filter((p) => filterRental === "all" || p.rentalId === filterRental);

  const activeRentals = rentals.filter((r) =>
    ["booked", "issued", "partially-returned", "overdue", "approved"].includes(r.status)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-between">
        <Select value={filterRental} onValueChange={setFilterRental}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Filter by rental" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rentals</SelectItem>
            {rentals.map((r) => <SelectItem key={r.id} value={r.id}>{r.itemName}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowNew(true)}>+ Record Payment</Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Rental Item</th>
              <th className="text-left p-3 font-medium">Vendor</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Reference</th>
              <th className="text-left p-3 font-medium">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const rental = rentals.find((r) => r.id === p.rentalId);
              const vendor = vendors.find((v) => v.id === p.vendorId);
              return (
                <tr key={p.id} className="border-t border-border/30 hover:bg-muted/20">
                  <td className="p-3 font-medium">{rental?.itemName ?? p.rentalId}</td>
                  <td className="p-3 text-muted-foreground">{vendor?.name ?? p.vendorId}</td>
                  <td className="p-3">
                    <Badge className={p.isDeposit ? "bg-violet-500/20 text-violet-300 text-xs" : "bg-emerald-500/20 text-emerald-300 text-xs"}>
                      {p.isDeposit ? "Deposit" : "Payment"}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-medium">{fmt(p.amount)}</td>
                  <td className="p-3 text-muted-foreground">{p.paymentDate}</td>
                  <td className="p-3 text-xs text-muted-foreground">{p.paymentReference ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.recordedBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">No payments found</div>}
      </div>

      {showNew && (
        <RecordPaymentDialog
          rentals={activeRentals}
          vendors={vendors}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}

function RecordPaymentDialog({
  rentals,
  vendors,
  onClose,
}: {
  rentals: RentalRecord[];
  vendors: Vendor[];
  onClose: () => void;
}) {
  const [rentalId, setRentalId] = useState("");
  const [amount, setAmount] = useState(0);
  const [isDeposit, setIsDeposit] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const rental = rentals.find((r) => r.id === rentalId);
  const outstanding = rental ? calcRentalOutstanding(rental) : 0;

  const handleSubmit = () => {
    if (!rental) return;
    if (!isDeposit && amount > outstanding) {
      setError("Payment exceeds outstanding amount");
      return;
    }
    recordRentalPayment(rentalId, {
      projectId: rental.projectId,
      vendorId: rental.vendorId,
      amount,
      isDeposit,
      paymentDate: date,
      paymentReference: ref,
      notes,
      recordedBy: "Production Manager",
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-muted-foreground text-xs">Rental</label>
            <Select value={rentalId} onValueChange={(v) => { setRentalId(v); setError(""); }}>
              <SelectTrigger><SelectValue placeholder="Select rental" /></SelectTrigger>
              <SelectContent>{rentals.map((r) => <SelectItem key={r.id} value={r.id}>{r.itemName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {rental && (
            <div className="bg-muted/30 p-2 rounded text-xs">
              <span className="text-muted-foreground">Outstanding: </span>
              <span className="font-medium">{fmt(outstanding)}</span>
            </div>
          )}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={isDeposit} onChange={(e) => setIsDeposit(e.target.checked)} />
              Security Deposit
            </label>
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Amount (₹)</label>
            <Input type="number" min={0} value={amount} onChange={(e) => { setAmount(parseFloat(e.target.value) || 0); setError(""); }} />
            {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Payment Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Reference</label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Cheque / NEFT / UPI ref" />
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!rentalId || amount <= 0}>Record Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Returns & Overdue Tab ────────────────────────────────────────────────────

function ReturnsOverdueTab({ rentals, vendors }: { rentals: RentalRecord[]; vendors: Vendor[] }) {
  const items = rentals.filter((r) =>
    ["overdue", "partially-returned", "issued"].includes(r.status)
  );
  const [lateFeeInput, setLateFeeInput] = useState<Record<string, string>>({});

  const handleMarkReturned = (r: RentalRecord) => {
    const today = new Date().toISOString().slice(0, 10);
    const lateFee = parseFloat(lateFeeInput[r.id] || "0") || 0;
    const totalRentalCost = r.subtotal + r.additionalCharges + lateFee;
    updateRentalStatus(r.id, "returned");
    if (lateFee > 0 || r.actualReturnDate !== today) {
      // Update with actual return date and late fee
      import("@/lib/rental-store").then(({ updateRentalRecord: upd }) => {
        upd(r.id, { actualReturnDate: today, lateFees: lateFee, totalRentalCost });
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{items.length} item(s) need attention</div>
      {items.length === 0 && (
        <div className="p-8 text-center text-muted-foreground border rounded-lg">
          No overdue or pending returns
        </div>
      )}
      {items.map((r) => {
        const vendor = vendors.find((v) => v.id === r.vendorId);
        const outstanding = calcRentalOutstanding(r);
        const today = new Date();
        const expected = new Date(r.expectedReturnDate);
        const overdueDays = Math.max(0, Math.round((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24)));
        return (
          <Card key={r.id} className={r.status === "overdue" ? "border-red-500/40" : r.status === "partially-returned" ? "border-orange-500/30" : ""}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{r.itemName}</div>
                  <div className="text-sm text-muted-foreground">{vendor?.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">Expected: {r.expectedReturnDate}</div>
                  {overdueDays > 0 && <div className="text-xs text-red-400 mt-0.5">{overdueDays} day(s) overdue</div>}
                  {r.notes && <div className="text-xs text-muted-foreground mt-1">{r.notes}</div>}
                </div>
                <div className="text-right">
                  <Badge className={`mb-2 ${rentalStatusColor[r.status]}`}>{RENTAL_STATUS_LABELS[r.status]}</Badge>
                  <div className="text-sm"><span className="text-muted-foreground">Outstanding: </span><span className={outstanding > 0 ? "text-amber-400 font-medium" : "text-emerald-400"}>{fmt(outstanding)}</span></div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 items-center">
                <Input
                  type="number"
                  min={0}
                  placeholder="Late fee (₹)"
                  value={lateFeeInput[r.id] ?? ""}
                  onChange={(e) => setLateFeeInput((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="w-36 text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleMarkReturned(r)}>
                  Mark Returned
                </Button>
                {RENTAL_STATUS_FLOW[r.status]?.filter((s) => s !== "returned").map((ns) => (
                  <Button key={ns} size="sm" variant="ghost" onClick={() => updateRentalStatus(r.id, ns as RentalStatus)}>
                    → {RENTAL_STATUS_LABELS[ns]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
