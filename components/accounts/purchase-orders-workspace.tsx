"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Ban,
} from "lucide-react";
import { usePurchaseOrders, usePODashboard, submitPO, approvePO, rejectPO, returnPO, resubmitPO, cancelPO, createPurchaseOrder, recordFulfilment, type CreatePOInput } from "@/lib/purchase-order-store";
import type { PurchaseOrder, POStatus, POLineItem } from "@/lib/types";
import { useAppDataSlice } from "@/lib/app-data-store";
import { formatCurrency, formatCompactINR, ACCOUNTS_DEPARTMENTS } from "@/lib/accounts-departments";

interface Props {
  projectId?: string;
}

const PO_STATUS_COLORS: Record<POStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "dept-approved": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "finance-approved": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "producer-approved": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  returned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "partially-fulfilled": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "dept-approved": "Dept Approved",
  "finance-approved": "Finance Approved",
  "producer-approved": "Producer Approved",
  rejected: "Rejected",
  returned: "Returned",
  "partially-fulfilled": "Partially Fulfilled",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const ALL_PO_STATUSES: POStatus[] = [
  "draft", "submitted", "dept-approved", "finance-approved", "producer-approved",
  "rejected", "returned", "partially-fulfilled", "fulfilled", "cancelled",
];

const PAGE_SIZE = 15;

export function PurchaseOrdersWorkspace({ projectId }: Props) {
  const pos = usePurchaseOrders(projectId);
  const dashboard = usePODashboard(projectId);
  const projects = useAppDataSlice("projects");
  const rentalVendors = useAppDataSlice("rentalVendors");
  const vendors = useAppDataSlice("vendors");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ type: string; po: PurchaseOrder } | null>(null);
  const [actionComments, setActionComments] = useState("");
  const [fulfilDialog, setFulfilDialog] = useState<{ po: PurchaseOrder; lineItem: POLineItem } | null>(null);
  const [fulfilQty, setFulfilQty] = useState("");
  const [fulfilRef, setFulfilRef] = useState("");
  const [fulfilNotes, setFulfilNotes] = useState("");

  const vendorMap = useMemo(() => {
    const m = new Map<string, string>();
    rentalVendors.forEach((v) => m.set(v.id, v.name));
    vendors.forEach((v) => m.set(v.id, v.name));
    return m;
  }, [rentalVendors, vendors]);

  const projectMap = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p) => m.set(p.id, p.title));
    return m;
  }, [projects]);

  const filtered = useMemo(() => {
    let items = [...pos];
    if (statusFilter !== "all") items = items.filter((po) => po.status === statusFilter);
    if (deptFilter !== "all") items = items.filter((po) => po.department === deptFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (po) =>
          po.title.toLowerCase().includes(q) ||
          po.poNumber.toLowerCase().includes(q) ||
          (vendorMap.get(po.vendorId) ?? "").toLowerCase().includes(q) ||
          po.department.toLowerCase().includes(q),
      );
    }
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [pos, statusFilter, deptFilter, search, vendorMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAction = useCallback((type: string) => {
    if (!actionDialog) return;
    const po = actionDialog.po;
    switch (type) {
      case "submit": submitPO(po.id); break;
      case "approve": approvePO(po.id, "Current User", actionComments || "Approved"); break;
      case "reject": rejectPO(po.id, "Current User", actionComments); break;
      case "return": returnPO(po.id, "Current User", actionComments); break;
      case "resubmit": resubmitPO(po.id); break;
      case "cancel": cancelPO(po.id, actionComments); break;
    }
    setActionDialog(null);
    setActionComments("");
    setSelectedPO(null);
  }, [actionDialog, actionComments]);

  const handleFulfilment = useCallback(() => {
    if (!fulfilDialog) return;
    const qty = Number(fulfilQty);
    if (!qty || qty <= 0) return;
    recordFulfilment(fulfilDialog.po.id, fulfilDialog.lineItem.id, qty, "Current User", fulfilRef, fulfilNotes);
    setFulfilDialog(null);
    setFulfilQty("");
    setFulfilRef("");
    setFulfilNotes("");
    setSelectedPO(null);
  }, [fulfilDialog, fulfilQty, fulfilRef, fulfilNotes]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          title="Total POs"
          value={String(dashboard.total)}
          subtitle={`${formatCompactINR(dashboard.totalINR)} total value`}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <SummaryCard
          title="PO Commitment"
          value={formatCompactINR(dashboard.poCommitment)}
          subtitle="Approved + Fulfilling"
          icon={<Package className="h-4 w-4" />}
          highlight
        />
        <SummaryCard
          title="Pending Approval"
          value={String(dashboard.pendingApproval)}
          subtitle="Awaiting action"
          icon={<FileText className="h-4 w-4" />}
        />
        <SummaryCard
          title="Fulfilled"
          value={String(dashboard.byStatus.fulfilled.count + dashboard.byStatus["partially-fulfilled"].count)}
          subtitle={`${dashboard.byStatus.fulfilled.count} complete, ${dashboard.byStatus["partially-fulfilled"].count} partial`}
          icon={<Truck className="h-4 w-4" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PO number, title, vendor, dept..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_PO_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{PO_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Depts</SelectItem>
            {ACCOUNTS_DEPARTMENTS.map((d) => (
              <SelectItem key={d.key} value={d.key}>{d.display}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New PO
        </Button>
        {(search || statusFilter !== "all" || deptFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setDeptFilter("all"); setPage(1); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Register Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">PO #</TableHead>
                <TableHead>Title</TableHead>
                {!projectId && <TableHead>Project</TableHead>}
                <TableHead>Vendor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Fulfilment</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={projectId ? 8 : 9} className="text-center py-8 text-muted-foreground">
                    {pos.length === 0 ? "No purchase orders yet" : "No POs match the current filters"}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPO(po)}
                  >
                    <TableCell className="font-mono text-xs">{po.poNumber}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{po.title}</TableCell>
                    {!projectId && (
                      <TableCell className="text-sm">{projectMap.get(po.projectId) ?? po.projectId}</TableCell>
                    )}
                    <TableCell className="text-sm">{vendorMap.get(po.vendorId) ?? po.vendorId}</TableCell>
                    <TableCell className="text-sm capitalize">{po.department.replace(/-/g, " ")}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(po.inrTotal, "INR")}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${PO_STATUS_COLORS[po.status]}`}>
                        {PO_STATUS_LABELS[po.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <FulfilmentBar po={po} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedPO(po); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filtered.length} PO{filtered.length !== 1 ? "s" : ""} — Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selectedPO} onOpenChange={(open) => { if (!open) setSelectedPO(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedPO && (
            <PODetailPanel
              po={selectedPO}
              vendorName={vendorMap.get(selectedPO.vendorId) ?? selectedPO.vendorId}
              projectName={projectMap.get(selectedPO.projectId) ?? selectedPO.projectId}
              onAction={(type) => {
                if (type === "submit" || type === "resubmit") {
                  if (type === "submit") submitPO(selectedPO.id);
                  else resubmitPO(selectedPO.id);
                  setSelectedPO(null);
                } else {
                  setActionDialog({ type, po: selectedPO });
                }
              }}
              onFulfil={(lineItem) => setFulfilDialog({ po: selectedPO, lineItem })}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => { if (!open) { setActionDialog(null); setActionComments(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === "approve" && "Approve Purchase Order"}
              {actionDialog?.type === "reject" && "Reject Purchase Order"}
              {actionDialog?.type === "return" && "Return Purchase Order"}
              {actionDialog?.type === "cancel" && "Cancel Purchase Order"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {actionDialog?.po.poNumber} — {actionDialog?.po.title}
            </p>
            <div>
              <Label>Comments {actionDialog?.type !== "approve" && <span className="text-red-500">*</span>}</Label>
              <Textarea
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                placeholder={actionDialog?.type === "approve" ? "Optional comments..." : "Required — explain your decision"}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setActionComments(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAction(actionDialog!.type)}
              disabled={actionDialog?.type !== "approve" && !actionComments.trim()}
              variant={actionDialog?.type === "reject" || actionDialog?.type === "cancel" ? "destructive" : "default"}
            >
              {actionDialog?.type === "approve" && "Approve"}
              {actionDialog?.type === "reject" && "Reject"}
              {actionDialog?.type === "return" && "Return for Revision"}
              {actionDialog?.type === "cancel" && "Cancel PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfilment Dialog */}
      <Dialog open={!!fulfilDialog} onOpenChange={(open) => { if (!open) { setFulfilDialog(null); setFulfilQty(""); setFulfilRef(""); setFulfilNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Delivery</DialogTitle>
          </DialogHeader>
          {fulfilDialog && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {fulfilDialog.lineItem.itemName} — {fulfilDialog.lineItem.fulfilledQty}/{fulfilDialog.lineItem.quantity} {fulfilDialog.lineItem.unit} fulfilled
              </p>
              <div>
                <Label>Quantity Received</Label>
                <Input
                  type="number"
                  value={fulfilQty}
                  onChange={(e) => setFulfilQty(e.target.value)}
                  max={fulfilDialog.lineItem.quantity - fulfilDialog.lineItem.fulfilledQty}
                  min={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {fulfilDialog.lineItem.quantity - fulfilDialog.lineItem.fulfilledQty} {fulfilDialog.lineItem.unit}
                </p>
              </div>
              <div>
                <Label>Delivery Reference</Label>
                <Input value={fulfilRef} onChange={(e) => setFulfilRef(e.target.value)} placeholder="e.g. DEL-001, GRN-123" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={fulfilNotes} onChange={(e) => setFulfilNotes(e.target.value)} placeholder="Optional notes" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFulfilDialog(null); setFulfilQty(""); setFulfilRef(""); setFulfilNotes(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleFulfilment}
              disabled={!fulfilQty || Number(fulfilQty) <= 0}
            >
              Record Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
      <CreatePODialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={projectId}
        projects={projects}
        vendors={[...rentalVendors.map((v) => ({ id: v.id, name: v.name })), ...vendors.map((v) => ({ id: v.id, name: v.name }))]}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SummaryCard({ title, value, subtitle, icon, highlight }: {
  title: string; value: string; subtitle: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-blue-200 dark:border-blue-800" : ""}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{title}</span>
          {icon}
        </div>
        <div className={`text-lg font-bold ${highlight ? "text-blue-600 dark:text-blue-400" : ""}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function FulfilmentBar({ po }: { po: PurchaseOrder }) {
  const totalQty = po.lineItems.reduce((s, li) => s + li.quantity, 0);
  const fulfilledQty = po.lineItems.reduce((s, li) => s + li.fulfilledQty, 0);
  if (totalQty === 0) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round((fulfilledQty / totalQty) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-orange-500" : "bg-gray-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs">{pct}%</span>
    </div>
  );
}

function PODetailPanel({ po, vendorName, projectName, onAction, onFulfil }: {
  po: PurchaseOrder;
  vendorName: string;
  projectName: string;
  onAction: (type: string) => void;
  onFulfil: (lineItem: POLineItem) => void;
}) {
  const canApprove = ["submitted", "dept-approved", "finance-approved"].includes(po.status);
  const canSubmit = po.status === "draft";
  const canResubmit = po.status === "returned";
  const canFulfil = po.status === "producer-approved" || po.status === "partially-fulfilled";
  const canCancel = ["draft", "submitted", "dept-approved", "finance-approved", "producer-approved"].includes(po.status);

  return (
    <div className="space-y-4 pt-2">
      <SheetHeader>
        <SheetTitle className="text-base">{po.poNumber}</SheetTitle>
      </SheetHeader>

      <div>
        <h3 className="font-semibold text-sm">{po.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge className={`text-[10px] ${PO_STATUS_COLORS[po.status]}`}>
            {PO_STATUS_LABELS[po.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">{projectName}</span>
        </div>
      </div>

      {/* Key details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-muted-foreground">Vendor:</span> {vendorName}</div>
        <div><span className="text-muted-foreground">Dept:</span> <span className="capitalize">{po.department.replace(/-/g, " ")}</span></div>
        <div><span className="text-muted-foreground">PO Date:</span> {po.poDate}</div>
        <div><span className="text-muted-foreground">Delivery:</span> {po.expectedDeliveryDate}</div>
        <div><span className="text-muted-foreground">Terms:</span> {po.paymentTerms}</div>
        <div><span className="text-muted-foreground">Created by:</span> {po.createdBy}</div>
      </div>

      {/* Amount Summary */}
      <Card>
        <CardContent className="p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatCurrency(po.subtotal, po.currency)}</span></div>
          {po.totalDiscount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="font-mono">-{formatCurrency(po.totalDiscount, po.currency)}</span></div>}
          <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="font-mono">{formatCurrency(po.totalTax, po.currency)}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Grand Total</span><span className="font-mono">{formatCurrency(po.grandTotal, po.currency)}</span></div>
          {po.currency !== "INR" && (
            <div className="flex justify-between text-xs text-muted-foreground"><span>INR Equivalent</span><span className="font-mono">{formatCurrency(po.inrTotal, "INR")}</span></div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Line Items ({po.lineItems.length})</h4>
        <div className="space-y-2">
          {po.lineItems.map((li) => (
            <div key={li.id} className="border rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">{li.itemName}</span>
                <span className="font-mono">{formatCurrency(li.lineTotal, po.currency)}</span>
              </div>
              <div className="text-muted-foreground">{li.description}</div>
              <div className="flex justify-between">
                <span>{li.quantity} {li.unit} × {formatCurrency(li.unitPrice, po.currency)}{li.discount > 0 ? ` (${li.discount}% off)` : ""}</span>
                <span className="flex items-center gap-1">
                  {li.fulfilledQty}/{li.quantity} delivered
                  {canFulfil && li.fulfilledQty < li.quantity && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 text-[10px] px-1.5"
                      onClick={() => onFulfil(li)}
                    >
                      <Truck className="h-3 w-3 mr-0.5" /> Receive
                    </Button>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amendments */}
      {po.amendments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Amendments ({po.amendments.length})</h4>
          {po.amendments.map((amd) => (
            <div key={amd.id} className="border rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">{amd.reason}</span>
                <Badge variant="outline" className="text-[10px]">{amd.status}</Badge>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Original: {formatCurrency(amd.originalAmount, po.currency)}</span>
                <span>Revised: {formatCurrency(amd.revisedAmount, po.currency)}</span>
              </div>
              <div className="text-muted-foreground">Difference: {formatCurrency(amd.difference, po.currency)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Fulfilments */}
      {po.fulfilments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Delivery History ({po.fulfilments.length})</h4>
          {po.fulfilments.map((f) => (
            <div key={f.id} className="border rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span>{po.lineItems.find((li) => li.id === f.lineItemId)?.itemName ?? f.lineItemId}</span>
                <span>{f.quantity} received</span>
              </div>
              <div className="text-muted-foreground">{f.deliveryDate} — Ref: {f.deliveryReference || "—"}</div>
              {f.notes && <div className="text-muted-foreground">{f.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Approval History */}
      {po.approvalHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Approval History</h4>
          {po.approvalHistory.map((rec, i) => (
            <div key={i} className="border rounded p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-medium capitalize">{rec.level}</span>
                <Badge
                  className={`text-[10px] ${rec.decision === "approved" ? "bg-green-100 text-green-800" : rec.decision === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {rec.decision}
                </Badge>
              </div>
              <div className="text-muted-foreground">{rec.approverName} — {new Date(rec.decisionDate).toLocaleDateString()}</div>
              {rec.comments && <div className="text-muted-foreground">{rec.comments}</div>}
            </div>
          ))}
        </div>
      )}

      {po.notes && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Notes</h4>
          <p className="text-xs text-muted-foreground">{po.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 border-t pt-3">
        {canSubmit && (
          <Button size="sm" onClick={() => onAction("submit")}>
            <Send className="h-3.5 w-3.5 mr-1" /> Submit for Approval
          </Button>
        )}
        {canResubmit && (
          <Button size="sm" onClick={() => onAction("resubmit")}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Resubmit
          </Button>
        )}
        {canApprove && (
          <>
            <Button size="sm" onClick={() => onAction("approve")}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("return")}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Return
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAction("reject")}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
            </Button>
          </>
        )}
        {canCancel && po.status !== "draft" && (
          <Button size="sm" variant="outline" onClick={() => onAction("cancel")}>
            <Ban className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Create PO Dialog ──────────────────────────────────────────────────────

function CreatePODialog({ open, onClose, projectId, projects, vendors }: {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  projects: { id: string; title: string }[];
  vendors: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [projId, setProjId] = useState(projectId ?? "");
  const [department, setDepartment] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ name: "", desc: "", category: "", qty: "1", unit: "unit", price: "", discount: "0", tax: "18" }]);

  const resetForm = () => {
    setTitle("");
    setVendorId("");
    setProjId(projectId ?? "");
    setDepartment("");
    setDeliveryDate("");
    setPaymentTerms("Net 30");
    setNotes("");
    setItems([{ name: "", desc: "", category: "", qty: "1", unit: "unit", price: "", discount: "0", tax: "18" }]);
  };

  const handleCreate = () => {
    const lineItems = items
      .filter((i) => i.name && Number(i.price) > 0)
      .map((i) => ({
        itemName: i.name,
        description: i.desc,
        category: i.category,
        quantity: Number(i.qty) || 1,
        unit: i.unit,
        unitPrice: Number(i.price) || 0,
        discount: Number(i.discount) || 0,
        taxPercent: Number(i.tax) || 0,
        lineSubtotal: 0,
        lineTax: 0,
        lineTotal: 0,
      }));
    if (!lineItems.length) return;

    const input: CreatePOInput = {
      title,
      vendorId,
      projectId: projId,
      department,
      expectedDeliveryDate: deliveryDate,
      currency: "INR",
      exchangeRate: 1,
      paymentTerms,
      deliveryAddress: "",
      billingAddress: "Flowbender Studios",
      contactPerson: "",
      notes,
      termsAndConditions: "Standard",
      lineItems,
      createdBy: "Current User",
    };

    const id = createPurchaseOrder(input);
    if (id) {
      resetForm();
      onClose();
    }
  };

  const updateItem = (idx: number, field: string, value: string) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Camera Equipment Rental" />
            </div>
            <div>
              <Label>Vendor *</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!projectId && (
              <div>
                <Label>Project *</Label>
                <Select value={projId} onValueChange={setProjId}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                <SelectContent>
                  {ACCOUNTS_DEPARTMENTS.map((d) => (
                    <SelectItem key={d.key} value={d.key}>{d.display}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Delivery</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItems([...items, { name: "", desc: "", category: "", qty: "1", unit: "unit", price: "", discount: "0", tax: "18" }])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-2 mb-2 text-sm">
                <div className="col-span-2">
                  <Input placeholder="Item name *" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} className="text-xs" />
                </div>
                <div>
                  <Input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} className="text-xs" />
                </div>
                <div>
                  <Input type="number" placeholder="Unit price *" value={item.price} onChange={(e) => updateItem(idx, "price", e.target.value)} className="text-xs" />
                </div>
                <div>
                  <Input type="number" placeholder="Disc %" min="0" max="100" value={item.discount} onChange={(e) => updateItem(idx, "discount", e.target.value)} className="text-xs" />
                </div>
                <div>
                  <Input type="number" placeholder="Tax %" value={item.tax} onChange={(e) => updateItem(idx, "tax", e.target.value)} className="text-xs" />
                </div>
                <div>
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-xs text-red-500">
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || !vendorId || !projId || !department || items.every((i) => !i.name || !Number(i.price))}
          >
            Create PO (Draft)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
