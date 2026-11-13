"use client";

import { useState, useMemo } from "react";
import { FileText, IndianRupee, AlertTriangle, CheckCircle } from "lucide-react";
import { useInvoices, useInvoiceDashboard } from "@/lib/invoice-store";
import { useProjects } from "@/lib/project-store";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { Invoice } from "@/lib/invoice-store";

export function InvoicesWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const invoices = useInvoices(pid);
  const dash = useInvoiceDashboard(pid);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return invoices;
    return invoices.filter((i) => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const columns: DataTableColumn<Invoice>[] = [
    { key: "number", header: "Invoice #", cell: (r) => <span className="font-mono text-xs">{r.invoiceNumber}</span>, sortValue: (r) => r.invoiceNumber },
    { key: "vendor", header: "Vendor", cell: (r) => <span className="font-medium">{r.vendorName}</span>, sortValue: (r) => r.vendorName },
    { key: "desc", header: "Description", cell: (r) => <span className="max-w-[220px] truncate block text-muted-foreground">{r.description}</span>, sortValue: (r) => r.description },
    { key: "amount", header: "Amount", cell: (r) => <span className="font-mono">{formatINR(r.totalAmount)}</span>, sortValue: (r) => r.totalAmount, align: "right" },
    { key: "date", header: "Date", cell: (r) => <span className="text-muted-foreground">{r.invoiceDate}</span>, sortValue: (r) => r.invoiceDate },
    { key: "due", header: "Due Date", cell: (r) => <span className="text-muted-foreground">{r.dueDate}</span>, sortValue: (r) => r.dueDate },
    { key: "dept", header: "Department", cell: (r) => r.department ? <span className="capitalize text-xs">{r.department}</span> : "—" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Invoices"
        description="Track vendor invoices and payment status."
        icon={FileText}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div className="flex items-center gap-2">
            <div>
              <Label htmlFor="inv-status-filter" className="sr-only">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="inv-status-filter" aria-label="Filter by status" className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inv-project-filter" className="sr-only">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="inv-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Invoices" value={String(dash.total)} icon={FileText} />
        <StatCard label="Total Value" value={formatINR(dash.totalAmount)} icon={IndianRupee} />
        <StatCard label="Paid" value={formatINR(dash.paidAmount)} icon={CheckCircle} />
        <StatCard label="Overdue" value={String(dash.overdueCount)} icon={AlertTriangle} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No invoices" description="No invoices match the current filters." icon={FileText} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} caption="Invoices" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
