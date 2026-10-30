"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Trash2,
  Globe,
  IndianRupee,
  Film,
  Tv,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  FileText,
  Filter,
} from "lucide-react";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import { useProject, useSelectedProjectId, useProjects } from "@/lib/project-store";
import type { RightsDeal } from "@/lib/types";
import { ProjectSelector } from "@/components/app/project-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const emptyDeal = {
  territory: "",
  distributor: "",
  minimumGuarantee: "0",
  advanceReceived: "0",
  rightsType: "theatrical" as RightsDeal["rightsType"],
  status: "open" as RightsDeal["status"],
  deliveryStatus: "pending" as RightsDeal["deliveryStatus"],
};

const ALL_RIGHTS_TYPES = [
  "theatrical",
  "digital",
  "satellite",
  "audio",
  "remake",
  "broadcast",
  "ancillary",
  "dubbed",
] as const;

export function ProjectDistributionWorkspace({ projectId }: { projectId?: string }) {
  const centralSelectedId = useSelectedProjectId();
  const activeProjectId = projectId || centralSelectedId || "p1";

  const project = useProject(activeProjectId);
  const projects = useProjects();

  const allDeals = useAppDataSlice("rightsDeals");
  const allDeliverables = useAppDataSlice("deliverables");

  const deals = useMemo(
    () => allDeals.filter((deal) => deal.projectId === activeProjectId),
    [allDeals, activeProjectId]
  );

  const deliverables = useMemo(
    () => allDeliverables.filter((item) => item.projectId === activeProjectId),
    [allDeliverables, activeProjectId]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterRights, setFilterRights] = useState<string>("all");
  const [form, setForm] = useState(emptyDeal);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!project) {
    return (
      <div className="mx-auto max-w-[1400px] p-8 text-center space-y-4">
        <p className="text-muted-foreground">Select an active flowbender project to view distribution & rights.</p>
        <ProjectSelector />
      </div>
    );
  }

  function startNewDeal() {
    setSelectedId(null);
    setForm(emptyDeal);
    setError("");
    setMessage("");
    setIsFormOpen(true);
  }

  function handleEditDeal(deal: RightsDeal) {
    setSelectedId(deal.id);
    setForm({
      territory: deal.territory,
      distributor: deal.distributor,
      minimumGuarantee: String(deal.minimumGuarantee),
      advanceReceived: String(deal.advanceReceived),
      rightsType: deal.rightsType,
      status: deal.status,
      deliveryStatus: deal.deliveryStatus,
    });
    setError("");
    setMessage("");
    setIsFormOpen(true);
  }

  function saveDeal(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const minimumGuarantee = Number(form.minimumGuarantee);
    const advanceReceived = Number(form.advanceReceived);

    if (
      !form.territory.trim() ||
      !form.distributor.trim() ||
      !Number.isFinite(minimumGuarantee) ||
      !Number.isFinite(advanceReceived) ||
      minimumGuarantee < 0 ||
      advanceReceived < 0 ||
      advanceReceived > minimumGuarantee
    ) {
      setError(
        "Please enter territory and distributor. Advance received cannot be negative or exceed the minimum guarantee."
      );
      return;
    }

    const record: RightsDeal = {
      ...form,
      id: selectedId ?? `rights-${crypto.randomUUID()}`,
      projectId: activeProjectId,
      territory: form.territory.trim(),
      distributor: form.distributor.trim(),
      minimumGuarantee,
      advanceReceived,
    };

    updateAppDataSlice("rightsDeals", (current) =>
      selectedId
        ? current.map((d) => (d.id === selectedId ? record : d))
        : [record, ...current]
    );

    setIsFormOpen(false);
    setSelectedId(null);
    setMessage(`Rights deal for "${record.territory}" saved successfully.`);
  }

  function deleteDeal(dealId: string) {
    if (confirm("Delete this rights deal?")) {
      updateAppDataSlice("rightsDeals", (current) => current.filter((d) => d.id !== dealId));
      if (selectedId === dealId) {
        setIsFormOpen(false);
        setSelectedId(null);
      }
      setMessage("Deal removed from local register.");
    }
  }

  // 6 KPI Calculations
  const grossRightsValue = deals.reduce((sum, d) => sum + (d.minimumGuarantee || 0), 0);
  const totalAdvances = deals.reduce((sum, d) => sum + (d.advanceReceived || 0), 0);
  const outstandingBalance = Math.max(0, grossRightsValue - totalAdvances);
  const openNegotiatingDeals = deals.filter((d) => ["open", "negotiating"].includes(d.status)).length;
  const signedClosedDeals = deals.filter((d) => ["signed", "closed"].includes(d.status)).length;
  const deliveredPercent = deliverables.length
    ? Math.round(
        (deliverables.filter((item) => ["ready", "delivered"].includes(item.status)).length /
          deliverables.length) *
          100
      )
    : 0;

  // Filtered deals
  const visibleDeals = deals.filter((deal) => {
    if (filterRights !== "all" && deal.rightsType !== filterRights) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      {/* Top Banner with Project Context Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Distribution & Rights Management</h1>
              <Badge variant="outline" className="text-xs lowercase">
                flowbender hub
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Territory licensing, minimum guarantees, digital platform sales & advances
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <ProjectSelector currentProjectId={activeProjectId} />
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <span>{message}</span>
          <Button variant="ghost" size="sm" onClick={() => setMessage("")} className="h-6 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Project Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-gradient-to-br from-card via-card/80 to-muted/20">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold">{project.title}</h2>
            <Badge variant="secondary" className="capitalize">
              {project.type.replace("-", " ")}
            </Badge>
            <Badge variant="outline" className="capitalize text-amber-500 border-amber-500/30">
              {project.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{project.logline}</p>
        </div>

        <Button onClick={startNewDeal} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-3.5 h-3.5" />
          Add Rights Deal
        </Button>
      </div>

      {/* Modal / Inline Form */}
      {isFormOpen && (
        <Card className="border-amber-500/30 bg-card/80 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>{selectedId ? "Edit Rights Deal" : "Add Territory / Platform Rights Deal"}</span>
              <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)} className="h-7 text-xs">
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveDeal} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Territory / Territory Group</label>
                <Input
                  required
                  placeholder="e.g. Nizam & Hyderabad Urban or North America Theatrical"
                  value={form.territory}
                  onChange={(e) => setForm({ ...form, territory: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Distributor / Buyer / Platform</label>
                <Input
                  required
                  placeholder="e.g. Asian Cinemas / Netflix India / Zee Telugu"
                  value={form.distributor}
                  onChange={(e) => setForm({ ...form, distributor: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Rights Type</label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs capitalize"
                  value={form.rightsType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rightsType: e.target.value as RightsDeal["rightsType"],
                    })
                  }
                >
                  {ALL_RIGHTS_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Minimum Guarantee (MG in ₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={form.minimumGuarantee}
                  onChange={(e) => setForm({ ...form, minimumGuarantee: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Advance Received (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={form.advanceReceived}
                  onChange={(e) => setForm({ ...form, advanceReceived: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Deal Status</label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as RightsDeal["status"],
                    })
                  }
                >
                  <option value="open">Open / Pitching</option>
                  <option value="negotiating">Negotiating Terms</option>
                  <option value="signed">Agreement Signed</option>
                  <option value="closed">Closed & Executed</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-medium">Delivery Status (Asset Handover)</label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                  value={form.deliveryStatus}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deliveryStatus: e.target.value as RightsDeal["deliveryStatus"],
                    })
                  }
                >
                  <option value="pending">Pending Master Asset Handover</option>
                  <option value="partial">Partial Materials Delivered</option>
                  <option value="complete">Complete Delivery Verified</option>
                </select>
              </div>

              {error && <p className="text-xs text-red-500 md:col-span-3">{error}</p>}

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Save Rights Deal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Gross Rights</p>
            <p className="text-lg font-bold text-amber-500 truncate">{formatINR(grossRightsValue)}</p>
            <p className="text-[10px] text-muted-foreground">{deals.length} total deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Advances Received</p>
            <p className="text-lg font-bold text-emerald-500 truncate">{formatINR(totalAdvances)}</p>
            <p className="text-[10px] text-muted-foreground">
              {grossRightsValue > 0
                ? `${Math.round((totalAdvances / grossRightsValue) * 100)}% collected`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Balance Due</p>
            <p className="text-lg font-bold truncate">{formatINR(outstandingBalance)}</p>
            <p className="text-[10px] text-muted-foreground">Pending delivery release</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Open / Negotiating</p>
            <p className="text-lg font-bold text-blue-500">{openNegotiatingDeals}</p>
            <p className="text-[10px] text-muted-foreground">Active pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Signed / Closed</p>
            <p className="text-lg font-bold text-emerald-500">{signedClosedDeals}</p>
            <p className="text-[10px] text-muted-foreground">Confirmed agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Deliverables Ready</p>
            <p className="text-lg font-bold text-purple-500">{deliveredPercent}%</p>
            <Progress value={deliveredPercent} className="h-1 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card/40">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Filter Rights Type:</span>
          <select
            className="h-8 rounded-md border bg-background px-2 text-xs capitalize"
            value={filterRights}
            onChange={(e) => setFilterRights(e.target.value)}
          >
            <option value="all">All Rights ({deals.length})</option>
            {ALL_RIGHTS_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {visibleDeals.length} of {deals.length} deals
        </div>
      </div>

      {/* Rights Deals List */}
      <div className="rounded-xl border bg-card divide-y">
        {visibleDeals.map((deal) => {
          const balance = Math.max(0, deal.minimumGuarantee - deal.advanceReceived);
          const advanceRatio =
            deal.minimumGuarantee > 0
              ? Math.round((deal.advanceReceived / deal.minimumGuarantee) * 100)
              : 0;

          return (
            <div key={deal.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{deal.territory}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {deal.rightsType}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${
                      deal.status === "closed" || deal.status === "signed"
                        ? "border-emerald-500/40 text-emerald-500"
                        : deal.status === "negotiating"
                        ? "border-amber-500/40 text-amber-500"
                        : "border-blue-500/40 text-blue-500"
                    }`}
                  >
                    {deal.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Delivery: {deal.deliveryStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Distributor / Partner: <span className="text-foreground font-medium">{deal.distributor}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-left sm:text-right space-y-0.5">
                  <div className="text-sm font-bold text-amber-500">{formatINR(deal.minimumGuarantee)}</div>
                  <div className="text-xs text-muted-foreground">
                    Advance: {formatINR(deal.advanceReceived)} ({advanceRatio}%)
                  </div>
                  {balance > 0 && (
                    <div className="text-[10px] text-muted-foreground">Balance: {formatINR(balance)}</div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleEditDeal(deal)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-red-500 hover:text-red-600"
                    onClick={() => deleteDeal(deal.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {visibleDeals.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No rights deals found for this filter. Click &quot;Add Rights Deal&quot; to register a territory agreement.
          </div>
        )}
      </div>
    </div>
  );
}
