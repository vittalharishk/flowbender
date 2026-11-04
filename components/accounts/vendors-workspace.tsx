"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Building2, Users, AlertTriangle, CheckCircle2, Clock, Search,
  Plus, Edit2, Power, PowerOff, FileText, ShoppingCart,
  ChevronLeft, ChevronRight, Eye, XCircle, Filter, RotateCcw,
} from "lucide-react";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useRentalVendors, addRentalVendor, updateRentalVendor } from "@/lib/rental-store";
import {
  useVendorFinancials, useVendorTransactions, useVendorReconciliation,
  useVendorDashboard, resolveException, dismissException,
  activateVendor, deactivateVendor, hasVendorTransactions,
  type VendorFinancialSummary, type VendorTransaction, type ReconciliationException,
} from "@/lib/vendor-store";
import { formatCurrency, formatCompactINR } from "@/lib/accounts-departments";
import type { Vendor, VendorCategory } from "@/lib/types";

const VENDOR_CATEGORIES: { key: VendorCategory; label: string }[] = [
  { key: "camera-equipment", label: "Camera Equipment" },
  { key: "lighting-equipment", label: "Lighting Equipment" },
  { key: "generator-electrical", label: "Generator/Electrical" },
  { key: "art-set-suppliers", label: "Art/Set Suppliers" },
  { key: "props-suppliers", label: "Props Suppliers" },
  { key: "costume-suppliers", label: "Costume Suppliers" },
  { key: "makeup-prosthetics", label: "Makeup/Prosthetics" },
  { key: "location-services", label: "Location Services" },
  { key: "hotel-accommodation", label: "Hotel/Accommodation" },
  { key: "travel-transport", label: "Travel/Transport" },
  { key: "vehicle-caravan", label: "Vehicle/Caravan" },
  { key: "catering", label: "Catering" },
  { key: "general-rental", label: "General Rental" },
  { key: "other", label: "Other" },
];

const PAGE_SIZE = 15;

interface Props {
  projectId?: string;
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function DashboardCards({ dashboard }: { dashboard: ReturnType<typeof useVendorDashboard> }) {
  const cards = [
    { label: "Total Vendors", value: String(dashboard.totalVendors), icon: Building2, color: "text-blue-400" },
    { label: "Active", value: String(dashboard.activeVendors), icon: Users, color: "text-emerald-400" },
    { label: "PO Commitment", value: formatCompactINR(dashboard.totalPOCommitment), icon: ShoppingCart, color: "text-violet-400" },
    { label: "Expense Committed", value: formatCompactINR(dashboard.totalExpenseCommitted), icon: FileText, color: "text-amber-400" },
    { label: "Total Paid", value: formatCompactINR(dashboard.totalPaid), icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Outstanding", value: formatCompactINR(dashboard.totalOutstanding), icon: Clock, color: "text-orange-400" },
    { label: "Open Exceptions", value: String(dashboard.openExceptions), icon: AlertTriangle, color: dashboard.openExceptions > 0 ? "text-red-400" : "text-slate-400" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-lg font-bold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Vendor Directory Tab ────────────────────────────────────────────────────

function VendorDirectoryTab({ projectId, onSelectVendor }: Props & { onSelectVendor: (id: string) => void }) {
  const vendors = useRentalVendors();
  const financials = useVendorFinancials(projectId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  const finMap = useMemo(() => new Map(financials.map((f) => [f.vendorId, f])), [financials]);

  const filtered = useMemo(() => {
    let list = vendors;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        (v.gstin ?? "").toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((v) => v.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter((v) => v.category === categoryFilter);
    return list;
  }, [vendors, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendors..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {VENDOR_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all" || categoryFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setPage(1); }}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Vendor
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">POs</TableHead>
              <TableHead className="text-right">PO Commitment</TableHead>
              <TableHead className="text-right">Expense Committed</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  {search || statusFilter !== "all" || categoryFilter !== "all"
                    ? "No vendors match filters"
                    : "No vendors registered"}
                </TableCell>
              </TableRow>
            ) : paged.map((v) => {
              const fin = finMap.get(v.id);
              return (
                <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectVendor(v.id)}>
                  <TableCell>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.id}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{v.category.replace(/-/g, " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="text-xs">{v.contactPerson}</div>
                    <div className="text-xs text-muted-foreground">{v.phone}</div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{v.gstin || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "active" ? "default" : "secondary"} className={v.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{fin?.poCount ?? 0}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCompactINR(fin?.poCommitment ?? 0)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCompactINR(fin?.expenseCommitted ?? 0)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCompactINR(fin?.totalPaid ?? 0)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditVendor(v)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} vendors</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <VendorFormDialog open={showCreate} onClose={() => setShowCreate(false)} mode="create" />
      {editVendor && <VendorFormDialog open={true} onClose={() => setEditVendor(null)} mode="edit" vendor={editVendor} />}
    </div>
  );
}

// ─── Vendor Form Dialog (Create/Edit) ────────────────────────────────────────

function VendorFormDialog({ open, onClose, mode, vendor }: { open: boolean; onClose: () => void; mode: "create" | "edit"; vendor?: Vendor }) {
  const vendors = useRentalVendors();
  const [name, setName] = useState(vendor?.name ?? "");
  const [contactPerson, setContactPerson] = useState(vendor?.contactPerson ?? "");
  const [phone, setPhone] = useState(vendor?.phone ?? "");
  const [email, setEmail] = useState(vendor?.email ?? "");
  const [address, setAddress] = useState(vendor?.address ?? "");
  const [gstin, setGstin] = useState(vendor?.gstin ?? "");
  const [category, setCategory] = useState<VendorCategory>(vendor?.category ?? "general-rental");
  const [services, setServices] = useState(vendor?.services ?? "");
  const [paymentTerms, setPaymentTerms] = useState(vendor?.paymentTerms ?? "Net 30");
  const [notes, setNotes] = useState(vendor?.notes ?? "");
  const [error, setError] = useState("");

  const validate = (): string | null => {
    if (!name.trim()) return "Vendor name is required";
    if (gstin && gstin.trim().length > 0 && gstin.trim().length !== 15) return "GSTIN must be 15 characters";
    if (gstin && vendors.some((v) => v.gstin && v.gstin === gstin.trim() && v.id !== vendor?.id)) return "Duplicate GSTIN";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
    if (phone && !/^\d{10,15}$/.test(phone.replace(/[+\- ]/g, ""))) return "Invalid phone (10-15 digits)";
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }

    if (mode === "create") {
      addRentalVendor({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim() || undefined,
        category,
        services: services.trim(),
        paymentTerms: paymentTerms.trim(),
        notes: notes.trim() || undefined,
        status: "active",
      } as Omit<Vendor, "id" | "createdAt">);
    } else if (vendor) {
      updateRentalVendor(vendor.id, {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim() || undefined,
        category,
        services: services.trim(),
        paymentTerms: paymentTerms.trim(),
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Vendor" : `Edit ${vendor?.name}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error && <div className="bg-red-500/10 text-red-400 text-sm p-2 rounded">{error}</div>}
          <div>
            <Label>Vendor Name *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VENDOR_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Contact Person</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => { setPhone(e.target.value); setError(""); }} placeholder="9849001001" /></div>
            <div><Label>Email</Label><Input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="name@example.com" /></div>
          </div>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>GSTIN</Label><Input value={gstin} onChange={(e) => { setGstin(e.target.value); setError(""); }} placeholder="36AABCP1234A1Z5" maxLength={15} /></div>
            <div><Label>Payment Terms</Label><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></div>
          </div>
          <div><Label>Services</Label><Input value={services} onChange={(e) => setServices(e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>{mode === "create" ? "Add Vendor" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vendor Detail Sheet ─────────────────────────────────────────────────────

function VendorDetailSheet({ vendorId, projectId, onClose }: { vendorId: string; projectId?: string; onClose: () => void }) {
  const vendors = useRentalVendors();
  const financials = useVendorFinancials(projectId);
  const transactions = useVendorTransactions(vendorId, projectId);
  const vendor = vendors.find((v) => v.id === vendorId);
  const fin = financials.find((f) => f.vendorId === vendorId);

  if (!vendor) return null;

  const handleToggleStatus = () => {
    if (vendor.status === "active") {
      if (hasVendorTransactions(vendor.id)) {
        deactivateVendor(vendor.id);
      }
    } else {
      activateVendor(vendor.id);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {vendor.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={vendor.status === "active" ? "default" : "secondary"} className={vendor.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>
              {vendor.status}
            </Badge>
            <Badge variant="outline" className="capitalize">{vendor.category.replace(/-/g, " ")}</Badge>
            <Button variant="outline" size="sm" className="ml-auto h-7" onClick={handleToggleStatus}>
              {vendor.status === "active" ? <><PowerOff className="h-3.5 w-3.5 mr-1" /> Deactivate</> : <><Power className="h-3.5 w-3.5 mr-1" /> Activate</>}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Contact:</span> {vendor.contactPerson}</div>
            <div><span className="text-muted-foreground">Phone:</span> {vendor.phone}</div>
            <div><span className="text-muted-foreground">Email:</span> {vendor.email}</div>
            <div><span className="text-muted-foreground">GSTIN:</span> {vendor.gstin || "—"}</div>
            <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {vendor.address}</div>
            <div><span className="text-muted-foreground">Services:</span> {vendor.services}</div>
            <div><span className="text-muted-foreground">Payment Terms:</span> {vendor.paymentTerms}</div>
          </div>

          {fin && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Financial Summary</CardTitle></CardHeader>
              <CardContent className="p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>PO Commitment</span><span className="font-mono">{formatCurrency(fin.poCommitment, "INR")}</span></div>
                <div className="flex justify-between"><span>Expense Committed</span><span className="font-mono">{formatCurrency(fin.expenseCommitted, "INR")}</span></div>
                <div className="flex justify-between"><span>Total Paid</span><span className="font-mono">{formatCurrency(fin.totalPaid, "INR")}</span></div>
                <div className="flex justify-between font-bold border-t pt-1"><span>Outstanding</span><span className="font-mono">{formatCurrency(fin.totalOutstanding, "INR")}</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>POs: {fin.poCount}</span><span>Expenses: {fin.expenseCount}</span></div>
              </CardContent>
            </Card>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-2">Transaction History ({transactions.length})</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No transactions found</div>
              ) : transactions.slice(0, 20).map((t) => (
                <div key={t.id} className="border rounded p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{t.description}</span>
                    <span className="font-mono">{formatCurrency(t.inrAmount, "INR")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t.transactionType} • {t.reference}</span>
                    <Badge variant="outline" className="text-[10px]">{t.paymentStatus}</Badge>
                  </div>
                  <div className="text-muted-foreground">{t.projectName} • {t.transactionDate}</div>
                </div>
              ))}
            </div>
          </div>

          {vendor.notes && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Notes</h4>
              <p className="text-sm text-muted-foreground">{vendor.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Transaction Ledger Tab ──────────────────────────────────────────────────

function TransactionLedgerTab({ projectId }: Props) {
  const transactions = useVendorTransactions(undefined, projectId);
  const projects = useAppDataSlice("projects");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = transactions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.description.toLowerCase().includes(q) ||
        t.vendorName.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.poNumber.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter((t) => t.sourceType === typeFilter);
    if (statusFilter !== "all") list = list.filter((t) => t.paymentStatus === statusFilter);
    if (projectFilter !== "all") list = list.filter((t) => t.projectId === projectFilter);
    return list;
  }, [transactions, search, typeFilter, statusFilter, projectFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const txTypes = [...new Set(transactions.map((t) => t.sourceType))];
  const txStatuses = [...new Set(transactions.map((t) => t.paymentStatus))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {txTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {txStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {!projectId && (
          <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {(search || typeFilter !== "all" || statusFilter !== "all" || projectFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setProjectFilter("all"); setPage(1); }}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
              </TableRow>
            ) : paged.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs font-mono">{t.transactionDate}</TableCell>
                <TableCell className="text-sm">{t.vendorName}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{t.transactionType}</Badge></TableCell>
                <TableCell className="text-xs font-mono">{t.reference}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{t.description}</TableCell>
                <TableCell className="text-xs">{t.projectName}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(t.inrAmount, "INR")}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{t.paymentStatus}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} transactions</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reconciliation Tab ──────────────────────────────────────────────────────

function ReconciliationTab({ projectId }: Props) {
  const exceptions = useVendorReconciliation(projectId);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [resolveTarget, setResolveTarget] = useState<ReconciliationException | null>(null);
  const [resolveReason, setResolveReason] = useState("");
  const [resolveAction, setResolveAction] = useState<"resolve" | "dismiss">("resolve");

  const filtered = useMemo(() => {
    let list = exceptions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.vendorName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
    if (severityFilter !== "all") list = list.filter((e) => e.severity === severityFilter);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    return list;
  }, [exceptions, search, categoryFilter, severityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categories = [...new Set(exceptions.map((e) => e.category))];

  const handleResolve = () => {
    if (!resolveTarget || !resolveReason.trim()) return;
    if (resolveAction === "resolve") {
      resolveException(resolveTarget.id, "manual-resolution", resolveReason.trim(), "Current User");
    } else {
      dismissException(resolveTarget.id, resolveReason.trim(), "Current User");
    }
    setResolveTarget(null);
    setResolveReason("");
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "error": return "bg-red-500/20 text-red-400";
      case "warning": return "bg-amber-500/20 text-amber-400";
      default: return "bg-blue-500/20 text-blue-400";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "resolved": return "bg-emerald-500/20 text-emerald-400";
      case "dismissed": return "bg-slate-500/20 text-slate-400";
      default: return "bg-orange-500/20 text-orange-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{exceptions.length}</div>
            <div className="text-xs text-muted-foreground">Total Exceptions</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{exceptions.filter((e) => e.status === "open").length}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{exceptions.filter((e) => e.status === "resolved").length}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-slate-400">{exceptions.filter((e) => e.status === "dismissed").length}</div>
            <div className="text-xs text-muted-foreground">Dismissed</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search exceptions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c.replace(/-/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {paged.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-50" />
              <p className="text-sm">{exceptions.length === 0 ? "No reconciliation exceptions detected" : "No exceptions match filters"}</p>
            </CardContent>
          </Card>
        ) : paged.map((ex) => (
          <Card key={ex.id} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={severityColor(ex.severity)}>{ex.severity}</Badge>
                    <Badge className={statusColor(ex.status)}>{ex.status}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{ex.category.replace(/-/g, " ")}</Badge>
                  </div>
                  <h4 className="text-sm font-medium">{ex.title}</h4>
                  <p className="text-xs text-muted-foreground">{ex.description}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Vendor: {ex.vendorName}</span>
                    <span>Project: {ex.projectId}</span>
                    {ex.amountDiscrepancy !== undefined && <span>Discrepancy: {formatCurrency(ex.amountDiscrepancy, "INR")}</span>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {ex.sourceRecords.map((sr, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{sr.type}: {sr.reference}</Badge>
                    ))}
                  </div>
                  {ex.resolutionHistory.length > 0 && (
                    <div className="mt-2 border-t pt-2">
                      {ex.resolutionHistory.map((r, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="capitalize">{r.action}</span> by {r.resolvedBy} — {r.reason} ({r.resolvedAt.slice(0, 10)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {ex.status === "open" && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7" onClick={() => { setResolveTarget(ex); setResolveAction("resolve"); }}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => { setResolveTarget(ex); setResolveAction("dismiss"); }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} exceptions</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {resolveTarget && (
        <Dialog open={true} onOpenChange={() => { setResolveTarget(null); setResolveReason(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{resolveAction === "resolve" ? "Resolve Exception" : "Dismiss Exception"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm">{resolveTarget.title}</div>
              <div><Label>Reason *</Label><Textarea value={resolveReason} onChange={(e) => setResolveReason(e.target.value)} rows={3} placeholder="Provide reason for resolution..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setResolveTarget(null); setResolveReason(""); }}>Cancel</Button>
              <Button onClick={handleResolve} disabled={!resolveReason.trim()}>
                {resolveAction === "resolve" ? "Resolve" : "Dismiss"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Main Vendor Workspace ───────────────────────────────────────────────────

export function VendorsWorkspace({ projectId }: Props) {
  const dashboard = useVendorDashboard(projectId);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <DashboardCards dashboard={dashboard} />

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Vendor Directory</TabsTrigger>
          <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <VendorDirectoryTab projectId={projectId} onSelectVendor={setSelectedVendor} />
        </TabsContent>

        <TabsContent value="ledger">
          <TransactionLedgerTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="reconciliation">
          <ReconciliationTab projectId={projectId} />
        </TabsContent>
      </Tabs>

      {selectedVendor && (
        <VendorDetailSheet vendorId={selectedVendor} projectId={projectId} onClose={() => setSelectedVendor(null)} />
      )}
    </div>
  );
}
