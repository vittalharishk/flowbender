"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  usePropItems,
  addPropItem,
  updatePropItem,
  usePropTransactions,
  checkoutProp,
  checkinProp,
  useProductionSets,
  addProductionSet,
  updateProductionSet,
  updateSetStatus,
  useSetTasks,
  addSetTask,
  updateSetTask,
  useAISetExtensionTasks,
  addAISetExtensionTask,
  updateAISetExtensionTask,
  useAISetExtensionVersions,
  addAISetExtensionVersion,
  calcArtDashboard,
  formatINR,
} from "@/lib/art-store";
import {
  PROP_CATEGORIES,
  SET_CATEGORIES,
  SET_STATUS_FLOW,
  AI_STATUS_FLOW,
  PROP_CONDITION_COLORS,
  SET_STATUS_COLORS,
  AI_STATUS_COLORS,
  SET_STATUS_LABELS,
  AI_STATUS_LABELS,
  PROP_CONDITION_LABELS,
} from "@/lib/art-categories";
import { useAppDataSlice } from "@/lib/app-data-store";
import type { PropItem, PropTransaction, ProductionSet, AISetExtensionTask, SetTask } from "@/lib/types";

interface Props { projectId?: string; }

function StatusBadge({ status, colorMap, labelMap }: { status: string; colorMap: Record<string, string>; labelMap: Record<string, string> }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[status] || "bg-slate-500/20 text-slate-300"}`}>
      {labelMap[status] || status}
    </span>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ projectId }: Props) {
  const props = usePropItems(projectId);
  const sets = useProductionSets(projectId);
  const tasks = useAISetExtensionTasks(projectId);
  const projects = useAppDataSlice("projects");
  const d = calcArtDashboard(props, sets, tasks);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Props", value: d.totalProps, sub: `${d.totalPropQty} units` },
          { label: "Available Units", value: d.availableQty, sub: `${d.allocatedQty} allocated` },
          { label: "Damaged / Lost", value: d.damagedProps + d.lostProps, sub: `${d.damagedProps} damaged, ${d.lostProps} lost` },
          { label: "Active Sets", value: d.activeSets, sub: `${d.readyForShoot} ready for shoot` },
          { label: "Set Budget", value: formatINR(d.totalSetBudget), sub: "Estimated total" },
          { label: "Set Actual Cost", value: formatINR(d.totalSetActual), sub: d.totalSetActual > d.totalSetBudget ? "Over budget" : "Within budget" },
          { label: "AI Extension Tasks", value: d.aiTasksTotal, sub: `${d.aiDelivered} delivered` },
          { label: "Pending Review", value: d.aiPendingApproval, sub: "AI tasks in review" },
        ].map((c) => (
          <Card key={c.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">{c.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{c.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-sm text-slate-300">Active Sets</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
                <th className="text-left px-4 py-2">Set Name</th>
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Budget</th>
              </tr></thead>
              <tbody>
                {sets.filter(s => !["dismantled", "completed"].includes(s.status)).map(s => {
                  const proj = projects.find(p => p.id === s.projectId);
                  return (
                    <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-2 text-white">{s.name}</td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{proj?.title || s.projectId}</td>
                      <td className="px-4 py-2"><StatusBadge status={s.status} colorMap={SET_STATUS_COLORS} labelMap={SET_STATUS_LABELS} /></td>
                      <td className="px-4 py-2 text-right text-slate-300">{formatINR(s.estimatedBudget)}</td>
                    </tr>
                  );
                })}
                {sets.filter(s => !["dismantled", "completed"].includes(s.status)).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No active sets</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-sm text-slate-300">AI Extension Tasks by Status</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {Object.entries(AI_STATUS_LABELS).map(([status, label]) => {
              const count = tasks.filter(t => t.status === status).length;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} colorMap={AI_STATUS_COLORS} labelMap={AI_STATUS_LABELS} />
                  <span className="text-white font-medium">{count}</span>
                </div>
              );
            })}
            {tasks.length === 0 && <p className="text-slate-500 text-sm">No AI extension tasks</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Art Department Tab ────────────────────────────────────────────────────────

function ArtDepartmentTab({ projectId }: Props) {
  const crewMembers = useAppDataSlice("crewMembers");
  const crewAssignments = useAppDataSlice("crewAssignments");
  const remunerationAgreements = useAppDataSlice("remunerationAgreements");
  const projects = useAppDataSlice("projects");

  const artCrew = crewMembers.filter(c =>
    (c.department || "").toLowerCase().includes("art") ||
    (c.department || "").toLowerCase().includes("design") ||
    (c.role || "").toLowerCase().includes("art") ||
    (c.role || "").toLowerCase().includes("set dec") ||
    (c.role || "").toLowerCase().includes("props")
  );

  const filteredCrew = projectId
    ? artCrew.filter(c => crewAssignments.some(a => a.crewMemberId === c.id && a.projectId === projectId))
    : artCrew;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 bg-slate-800/50 border border-slate-700 rounded px-3 py-2">
        Art department crew is managed in the Crew &amp; Departments tab. This view is read-only and links to existing crew records.
      </p>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Department</th>
              <th className="text-left px-4 py-2">Designation</th>
              <th className="text-left px-4 py-2">Projects</th>
              <th className="text-right px-4 py-2">Day Rate</th>
            </tr></thead>
            <tbody>
              {filteredCrew.map(c => {
                const assignments = crewAssignments.filter(a => a.crewMemberId === c.id);
                const agreement = remunerationAgreements.find(r => r.crewMemberId === c.id);
                const projTitles = assignments
                  .map(a => projects.find(p => p.id === a.projectId)?.title)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-2 text-white font-medium">{c.name}</td>
                    <td className="px-4 py-2 text-slate-400">{c.department}</td>
                    <td className="px-4 py-2 text-slate-400">{c.role || "—"}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{projTitles || "—"}</td>
                    <td className="px-4 py-2 text-right text-slate-300">
                      {agreement ? formatINR(agreement.agreedAmount || 0) : "—"}
                    </td>
                  </tr>
                );
              })}
              {filteredCrew.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No art department crew found</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Props Library Tab ─────────────────────────────────────────────────────────

function PropsLibraryTab({ projectId }: Props) {
  const allProps = usePropItems(projectId);
  const allTransactions = usePropTransactions();
  const projects = useAppDataSlice("projects");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [filterOwnership, setFilterOwnership] = useState("all");
  const [filterProject, setFilterProject] = useState(projectId || "all");

  const [selectedProp, setSelectedProp] = useState<PropItem | null>(null);
  const [showAddProp, setShowAddProp] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCheckin, setShowCheckin] = useState<PropTransaction | null>(null);

  const filtered = allProps.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (filterCondition !== "all" && p.condition !== filterCondition) return false;
    if (filterOwnership !== "all" && p.ownership !== filterOwnership) return false;
    if (filterProject !== "all" && p.projectId !== filterProject && p.projectId) return false;
    return true;
  });

  const propTransactions = selectedProp ? allTransactions.filter(t => t.propItemId === selectedProp.id) : [];
  const activeTransactions = propTransactions.filter(t => t.status === "active");

  // Add prop form
  const [addForm, setAddForm] = useState<Partial<PropItem>>({ category: "other", condition: "excellent", ownership: "purchased", quantityTotal: 1, quantityAvailable: 1, purchaseCost: 0 });

  // Checkout form
  const [checkoutForm, setCheckoutForm] = useState({ quantity: 1, checkedOutBy: "", checkoutDate: new Date().toISOString().slice(0, 10), expectedReturnDate: "", notes: "" });
  const [checkoutError, setCheckoutError] = useState("");

  // Checkin form
  const [checkinForm, setCheckinForm] = useState({ quantity: 1, condition: "good" as PropItem["condition"], notes: "" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search props..." value={search} onChange={e => setSearch(e.target.value)} className="w-48 bg-slate-800 border-slate-700 text-white" />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Categories</SelectItem>
            {PROP_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Conditions</SelectItem>
            {Object.entries(PROP_CONDITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOwnership} onValueChange={setFilterOwnership}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Ownership</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="borrowed">Borrowed</SelectItem>
            <SelectItem value="production-made">Production Made</SelectItem>
          </SelectContent>
        </Select>
        {!projectId && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => setShowAddProp(true)} className="ml-auto bg-blue-600 hover:bg-blue-700">Add Prop</Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Project</th>
              <th className="text-center px-4 py-2">Total / Available / Alloc.</th>
              <th className="text-left px-4 py-2">Condition</th>
              <th className="text-left px-4 py-2">Ownership</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => {
                const proj = projects.find(pr => pr.id === p.projectId);
                return (
                  <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer" onClick={() => setSelectedProp(p)}>
                    <td className="px-4 py-2 text-white font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{PROP_CATEGORIES.find(c => c.key === p.category)?.label || p.category}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{proj?.title || "Shared Library"}</td>
                    <td className="px-4 py-2 text-center text-slate-300">{p.quantityTotal} / {p.quantityAvailable} / {p.quantityTotal - p.quantityAvailable}</td>
                    <td className="px-4 py-2"><StatusBadge status={p.condition} colorMap={PROP_CONDITION_COLORS} labelMap={PROP_CONDITION_LABELS} /></td>
                    <td className="px-4 py-2 text-slate-400 text-xs capitalize">{p.ownership}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No props found</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Prop Detail Dialog */}
      <Dialog open={!!selectedProp} onOpenChange={() => setSelectedProp(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader><DialogTitle>{selectedProp?.name}</DialogTitle></DialogHeader>
          {selectedProp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Category:</span> <span>{PROP_CATEGORIES.find(c => c.key === selectedProp.category)?.label}</span></div>
                <div><span className="text-slate-400">Condition:</span> <StatusBadge status={selectedProp.condition} colorMap={PROP_CONDITION_COLORS} labelMap={PROP_CONDITION_LABELS} /></div>
                <div><span className="text-slate-400">Qty Total:</span> <span>{selectedProp.quantityTotal}</span></div>
                <div><span className="text-slate-400">Qty Available:</span> <span>{selectedProp.quantityAvailable}</span></div>
                <div><span className="text-slate-400">Ownership:</span> <span className="capitalize">{selectedProp.ownership}</span></div>
                <div><span className="text-slate-400">Cost:</span> <span>{formatINR(selectedProp.purchaseCost || 0)}</span></div>
                {selectedProp.description && <div className="col-span-2"><span className="text-slate-400">Description:</span> <span>{selectedProp.description}</span></div>}
                {selectedProp.notes && <div className="col-span-2"><span className="text-slate-400">Notes:</span> <span>{selectedProp.notes}</span></div>}
              </div>
              <div className="flex gap-2">
                {selectedProp.quantityAvailable > 0 && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setShowCheckout(true); setCheckoutError(""); }}>Checkout</Button>
                )}
                {activeTransactions.length > 0 && (
                  <Button size="sm" variant="outline" className="border-slate-700" onClick={() => setShowCheckin(activeTransactions[0])}>Check In</Button>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Transaction History ({propTransactions.length})</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {propTransactions.map(t => (
                    <div key={t.id} className="flex justify-between text-xs bg-slate-800 rounded px-2 py-1">
                      <span>{t.checkoutDate} — Qty {t.quantity} by {t.checkedOutBy}</span>
                      <span className={`capitalize ${t.status === "active" ? "text-amber-400" : "text-slate-400"}`}>{t.status}</span>
                    </div>
                  ))}
                  {propTransactions.length === 0 && <p className="text-slate-500 text-xs">No transactions</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Checkout — {selectedProp?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {checkoutError && <p className="text-red-400 text-sm">{checkoutError}</p>}
            <div><Label>Quantity (max {selectedProp?.quantityAvailable})</Label><Input type="number" min={1} max={selectedProp?.quantityAvailable} value={checkoutForm.quantity} onChange={e => setCheckoutForm(f => ({ ...f, quantity: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Checked Out By</Label><Input value={checkoutForm.checkedOutBy} onChange={e => setCheckoutForm(f => ({ ...f, checkedOutBy: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Checkout Date</Label><Input type="date" value={checkoutForm.checkoutDate} onChange={e => setCheckoutForm(f => ({ ...f, checkoutDate: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Expected Return</Label><Input type="date" value={checkoutForm.expectedReturnDate} onChange={e => setCheckoutForm(f => ({ ...f, expectedReturnDate: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Notes</Label><Input value={checkoutForm.notes} onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              if (!selectedProp) return;
              const result = checkoutProp(selectedProp, {
                propItemId: selectedProp.id,
                projectId: projectId || selectedProp.projectId || "shared",
                quantity: checkoutForm.quantity,
                transactionType: "checkout",
                checkedOutBy: checkoutForm.checkedOutBy,
                checkoutDate: checkoutForm.checkoutDate,
                expectedReturnDate: checkoutForm.expectedReturnDate || undefined,
                notes: checkoutForm.notes || undefined,
              });
              if (result.ok) { setShowCheckout(false); setSelectedProp(null); }
              else setCheckoutError(result.error || "Checkout failed");
            }}>Confirm Checkout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkin Dialog */}
      <Dialog open={!!showCheckin} onOpenChange={() => setShowCheckin(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Check In — {selectedProp?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Quantity to Return</Label><Input type="number" min={1} max={showCheckin?.quantity} value={checkinForm.quantity} onChange={e => setCheckinForm(f => ({ ...f, quantity: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Condition on Return</Label>
              <Select value={checkinForm.condition} onValueChange={v => setCheckinForm(f => ({ ...f, condition: v as PropItem["condition"] }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(PROP_CONDITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Input value={checkinForm.notes} onChange={e => setCheckinForm(f => ({ ...f, notes: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckin(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
              if (!selectedProp || !showCheckin) return;
              checkinProp(selectedProp, showCheckin.id, checkinForm.quantity, checkinForm.condition, checkinForm.notes);
              setShowCheckin(null); setSelectedProp(null);
            }}>Confirm Check In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Prop Dialog */}
      <Dialog open={showAddProp} onOpenChange={setShowAddProp}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Add Prop Item</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Name *</Label><Input value={addForm.name || ""} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Category</Label>
              <Select value={addForm.category} onValueChange={v => setAddForm(f => ({ ...f, category: v as PropItem["category"] }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{PROP_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={addForm.description || ""} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Qty Total</Label><Input type="number" min={1} value={addForm.quantityTotal} onChange={e => setAddForm(f => ({ ...f, quantityTotal: +e.target.value, quantityAvailable: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><Label>Condition</Label>
                <Select value={addForm.condition} onValueChange={v => setAddForm(f => ({ ...f, condition: v as PropItem["condition"] }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{Object.entries(PROP_CONDITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Ownership</Label>
              <Select value={addForm.ownership} onValueChange={v => setAddForm(f => ({ ...f, ownership: v as PropItem["ownership"] }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="purchased">Purchased</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                  <SelectItem value="production-made">Production Made</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Purchase Cost (₹)</Label><Input type="number" min={0} value={addForm.purchaseCost} onChange={e => setAddForm(f => ({ ...f, purchaseCost: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Notes</Label><Input value={addForm.notes || ""} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProp(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              if (!addForm.name) return;
              addPropItem({ ...addForm, name: addForm.name!, category: addForm.category!, condition: addForm.condition!, ownership: addForm.ownership!, quantityTotal: addForm.quantityTotal!, quantityAvailable: addForm.quantityTotal!, purchaseCost: addForm.purchaseCost || 0, projectId: projectId });
              setShowAddProp(false);
              setAddForm({ category: "other", condition: "excellent", ownership: "purchased", quantityTotal: 1, quantityAvailable: 1, purchaseCost: 0 });
            }}>Add Prop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Set Management Tab ────────────────────────────────────────────────────────

function SetManagementTab({ projectId }: Props) {
  const sets = useProductionSets(projectId);
  const allTasks = useSetTasks();
  const projects = useAppDataSlice("projects");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterProject, setFilterProject] = useState(projectId || "all");
  const [selectedSet, setSelectedSet] = useState<ProductionSet | null>(null);
  const [showAddSet, setShowAddSet] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  const filtered = sets.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    if (filterProject !== "all" && s.projectId !== filterProject) return false;
    return true;
  });

  const setTasks = selectedSet ? allTasks.filter(t => t.setId === selectedSet.id) : [];
  const nextStatuses = selectedSet ? (SET_STATUS_FLOW[selectedSet.status] || []) : [];

  const [addSetForm, setAddSetForm] = useState<Partial<ProductionSet>>({ category: "interior", status: "planned", estimatedBudget: 0, actualCost: 0, linkedExpenseIds: [] });
  const [addTaskForm, setAddTaskForm] = useState({ title: "", assignedTo: "", dueDate: "", status: "pending" as SetTask["status"] });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search sets..." value={search} onChange={e => setSearch(e.target.value)} className="w-48 bg-slate-800 border-slate-700 text-white" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(SET_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Categories</SelectItem>
            {SET_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {!projectId && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => setShowAddSet(true)} className="ml-auto bg-blue-600 hover:bg-blue-700">Add Set</Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="text-left px-4 py-2">Set Name</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Project</th>
              <th className="text-left px-4 py-2">Art Director</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-right px-4 py-2">Budget</th>
              <th className="text-right px-4 py-2">Actual</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => {
                const proj = projects.find(p => p.id === s.projectId);
                const variance = s.actualCost - s.estimatedBudget;
                return (
                  <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer" onClick={() => setSelectedSet(s)}>
                    <td className="px-4 py-2 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{SET_CATEGORIES.find(c => c.key === s.category)?.label}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{proj?.title || s.projectId}</td>
                    <td className="px-4 py-2 text-slate-400">{s.artDirector}</td>
                    <td className="px-4 py-2"><StatusBadge status={s.status} colorMap={SET_STATUS_COLORS} labelMap={SET_STATUS_LABELS} /></td>
                    <td className="px-4 py-2 text-right text-slate-300">{formatINR(s.estimatedBudget)}</td>
                    <td className={`px-4 py-2 text-right ${variance > 0 && s.actualCost > 0 ? "text-red-400" : "text-slate-300"}`}>{s.actualCost > 0 ? formatINR(s.actualCost) : "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No sets found</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Set Detail Dialog */}
      <Dialog open={!!selectedSet} onOpenChange={() => setSelectedSet(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader><DialogTitle>{selectedSet?.name}</DialogTitle></DialogHeader>
          {selectedSet && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Category:</span> <span>{SET_CATEGORIES.find(c => c.key === selectedSet.category)?.label}</span></div>
                <div><span className="text-slate-400">Status:</span> <StatusBadge status={selectedSet.status} colorMap={SET_STATUS_COLORS} labelMap={SET_STATUS_LABELS} /></div>
                <div><span className="text-slate-400">Art Director:</span> <span>{selectedSet.artDirector}</span></div>
                <div><span className="text-slate-400">Approved By:</span> <span>{selectedSet.approvedBy || "—"}</span></div>
                <div><span className="text-slate-400">Est. Budget:</span> <span>{formatINR(selectedSet.estimatedBudget)}</span></div>
                <div><span className="text-slate-400">Actual Cost:</span> <span>{formatINR(selectedSet.actualCost)}</span></div>
                {selectedSet.constructionStartDate && <div><span className="text-slate-400">Construction:</span> <span>{selectedSet.constructionStartDate} → {selectedSet.constructionEndDate || "ongoing"}</span></div>}
                {selectedSet.shootStartDate && <div><span className="text-slate-400">Shoot Start:</span> <span>{selectedSet.shootStartDate}</span></div>}
                {selectedSet.description && <div className="col-span-2"><span className="text-slate-400">Description:</span> <span>{selectedSet.description}</span></div>}
                {selectedSet.notes && <div className="col-span-2"><span className="text-slate-400">Notes:</span> <span>{selectedSet.notes}</span></div>}
              </div>
              {nextStatuses.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Move Status To:</p>
                  <div className="flex gap-2 flex-wrap">
                    {nextStatuses.map(ns => (
                      <Button key={ns} size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => { updateSetStatus(selectedSet.id, ns as ProductionSet["status"]); setSelectedSet({ ...selectedSet, status: ns as ProductionSet["status"] }); }}>
                        {SET_STATUS_LABELS[ns] || ns}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400">Tasks ({setTasks.length})</p>
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => setShowAddTask(true)}>Add Task</Button>
                </div>
                <div className="space-y-1">
                  {setTasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-xs bg-slate-800 rounded px-2 py-1.5">
                      <div>
                        <span className="text-white">{t.title}</span>
                        <span className="text-slate-500 ml-2">{t.assignedTo}</span>
                        {t.dueDate && <span className="text-slate-500 ml-2">Due {t.dueDate}</span>}
                      </div>
                      <Select value={t.status} onValueChange={v => updateSetTask(t.id, { status: v as SetTask["status"] })}>
                        <SelectTrigger className="w-28 h-6 text-xs bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {["pending","in-progress","completed","blocked"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {setTasks.length === 0 && <p className="text-slate-500 text-xs">No tasks</p>}
                </div>
              </div>
              {selectedSet.linkedExpenseIds.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Linked Expense IDs</p>
                  <div className="flex gap-1 flex-wrap">{selectedSet.linkedExpenseIds.map(id => <Badge key={id} variant="outline" className="border-slate-600 text-slate-400 text-xs">{id}</Badge>)}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Add Task to {selectedSet?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={addTaskForm.title} onChange={e => setAddTaskForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Assigned To</Label><Input value={addTaskForm.assignedTo} onChange={e => setAddTaskForm(f => ({ ...f, assignedTo: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Due Date</Label><Input type="date" value={addTaskForm.dueDate} onChange={e => setAddTaskForm(f => ({ ...f, dueDate: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              if (!addTaskForm.title || !selectedSet) return;
              addSetTask({ setId: selectedSet.id, projectId: selectedSet.projectId, title: addTaskForm.title, assignedTo: addTaskForm.assignedTo, dueDate: addTaskForm.dueDate || undefined, status: "pending" });
              setShowAddTask(false);
              setAddTaskForm({ title: "", assignedTo: "", dueDate: "", status: "pending" });
            }}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Set Dialog */}
      <Dialog open={showAddSet} onOpenChange={setShowAddSet}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Add Production Set</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Set Name *</Label><Input value={addSetForm.name || ""} onChange={e => setAddSetForm(f => ({ ...f, name: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={addSetForm.category} onValueChange={v => setAddSetForm(f => ({ ...f, category: v as ProductionSet["category"] }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{SET_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {!projectId && (
                <div><Label>Project *</Label>
                  <Select value={addSetForm.projectId || ""} onValueChange={v => setAddSetForm(f => ({ ...f, projectId: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div><Label>Art Director</Label><Input value={addSetForm.artDirector || ""} onChange={e => setAddSetForm(f => ({ ...f, artDirector: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Description</Label><Textarea value={addSetForm.description || ""} onChange={e => setAddSetForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Estimated Budget (₹)</Label><Input type="number" min={0} value={addSetForm.estimatedBudget} onChange={e => setAddSetForm(f => ({ ...f, estimatedBudget: +e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><Label>Construction Start</Label><Input type="date" value={addSetForm.constructionStartDate || ""} onChange={e => setAddSetForm(f => ({ ...f, constructionStartDate: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSet(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              if (!addSetForm.name) return;
              const pid = projectId || addSetForm.projectId;
              if (!pid) return;
              addProductionSet({ name: addSetForm.name!, category: addSetForm.category || "interior", projectId: pid, artDirector: addSetForm.artDirector || "TBD", estimatedBudget: addSetForm.estimatedBudget || 0, actualCost: 0, linkedExpenseIds: [], status: "planned", description: addSetForm.description, constructionStartDate: addSetForm.constructionStartDate });
              setShowAddSet(false);
              setAddSetForm({ category: "interior", status: "planned", estimatedBudget: 0, actualCost: 0, linkedExpenseIds: [] });
            }}>Add Set</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── AI Set Extensions Tab ─────────────────────────────────────────────────────

function AISetExtensionsTab({ projectId }: Props) {
  const tasks = useAISetExtensionTasks(projectId);
  const allVersions = useAISetExtensionVersions();
  const projects = useAppDataSlice("projects");
  const vfxShots = useAppDataSlice("vfxShots");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState(projectId || "all");
  const [selectedTask, setSelectedTask] = useState<AISetExtensionTask | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddVersion, setShowAddVersion] = useState(false);

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterProject !== "all" && t.projectId !== filterProject) return false;
    return true;
  });

  const taskVersions = selectedTask ? allVersions.filter(v => v.taskId === selectedTask.id) : [];
  const nextStatuses = selectedTask ? (AI_STATUS_FLOW[selectedTask.status] || []) : [];

  const [addForm, setAddForm] = useState<Partial<AISetExtensionTask>>({ referencePlaceholders: [], status: "planned" });
  const [refInput, setRefInput] = useState("");
  const [versionForm, setVersionForm] = useState({ notes: "", reviewedBy: "", status: "in-review" as AISetExtensionTask["status"] });

  return (
    <div className="space-y-4">
      <div className="bg-amber-900/20 border border-amber-700/40 rounded px-3 py-2 text-xs text-amber-300">
        Image generation is not implemented — this is a workflow and reference tracker only. No actual AI service is called.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="w-48 bg-slate-800 border-slate-700 text-white" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(AI_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        {!projectId && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => setShowAddTask(true)} className="ml-auto bg-blue-600 hover:bg-blue-700">Add Extension Task</Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Project</th>
              <th className="text-left px-4 py-2">VFX Shot</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Assigned Artist</th>
              <th className="text-right px-4 py-2">Versions</th>
            </tr></thead>
            <tbody>
              {filtered.map(t => {
                const proj = projects.find(p => p.id === t.projectId);
                const shot = vfxShots.find(v => v.id === t.vfxShotId);
                const vCount = allVersions.filter(v => v.taskId === t.id).length;
                return (
                  <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer" onClick={() => setSelectedTask(t)}>
                    <td className="px-4 py-2 text-white font-medium">{t.title}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{proj?.title || t.projectId}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{shot ? `${shot.id}` : "—"}</td>
                    <td className="px-4 py-2"><StatusBadge status={t.status} colorMap={AI_STATUS_COLORS} labelMap={AI_STATUS_LABELS} /></td>
                    <td className="px-4 py-2 text-slate-400">{t.assignedArtist}</td>
                    <td className="px-4 py-2 text-right text-slate-400">{vCount}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No extension tasks found</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader><DialogTitle>{selectedTask?.title}</DialogTitle></DialogHeader>
          {selectedTask && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Status:</span> <StatusBadge status={selectedTask.status} colorMap={AI_STATUS_COLORS} labelMap={AI_STATUS_LABELS} /></div>
                <div><span className="text-slate-400">Assigned Artist:</span> <span>{selectedTask.assignedArtist}</span></div>
                {selectedTask.vfxShotId && <div><span className="text-slate-400">VFX Shot:</span> <span>{selectedTask.vfxShotId}</span></div>}
                {selectedTask.description && <div className="col-span-2"><span className="text-slate-400">Description:</span> <span>{selectedTask.description}</span></div>}
                {selectedTask.promptInstructions && <div className="col-span-2"><span className="text-slate-400">Reference Instructions:</span> <p className="text-slate-300 mt-1 bg-slate-800 rounded p-2 text-xs">{selectedTask.promptInstructions}</p></div>}
                {selectedTask.referencePlaceholders.length > 0 && <div className="col-span-2"><span className="text-slate-400">Reference Files:</span> <div className="flex gap-1 flex-wrap mt-1">{selectedTask.referencePlaceholders.map(f => <Badge key={f} variant="outline" className="border-slate-600 text-slate-400 text-xs">{f}</Badge>)}</div></div>}
                {selectedTask.deliveryPlaceholder && <div className="col-span-2"><span className="text-slate-400">Delivery File:</span> <span className="text-emerald-400">{selectedTask.deliveryPlaceholder}</span></div>}
                {selectedTask.reviewNotes && <div className="col-span-2"><span className="text-slate-400">Review Notes:</span> <span>{selectedTask.reviewNotes}</span></div>}
              </div>
              {nextStatuses.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Move Status To:</p>
                  <div className="flex gap-2 flex-wrap">
                    {nextStatuses.map(ns => (
                      <Button key={ns} size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => { updateAISetExtensionTask(selectedTask.id, { status: ns as AISetExtensionTask["status"] }); setSelectedTask({ ...selectedTask, status: ns as AISetExtensionTask["status"] }); }}>
                        → {AI_STATUS_LABELS[ns] || ns}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400">Version History ({taskVersions.length})</p>
                  <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => setShowAddVersion(true)}>Add Version</Button>
                </div>
                <div className="space-y-1">
                  {taskVersions.sort((a, b) => b.versionNumber - a.versionNumber).map(v => (
                    <div key={v.id} className="text-xs bg-slate-800 rounded px-2 py-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">v{v.versionNumber}</span>
                        <StatusBadge status={v.status} colorMap={AI_STATUS_COLORS} labelMap={AI_STATUS_LABELS} />
                      </div>
                      {v.notes && <p className="text-slate-400 mt-0.5">{v.notes}</p>}
                      {v.reviewedBy && <p className="text-slate-500">Reviewed by {v.reviewedBy}</p>}
                    </div>
                  ))}
                  {taskVersions.length === 0 && <p className="text-slate-500 text-xs">No versions recorded</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Version Dialog */}
      <Dialog open={showAddVersion} onOpenChange={setShowAddVersion}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader><DialogTitle>Add Version — {selectedTask?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>New Status</Label>
              <Select value={versionForm.status} onValueChange={v => setVersionForm(f => ({ ...f, status: v as AISetExtensionTask["status"] }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{Object.entries(AI_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={versionForm.notes} onChange={e => setVersionForm(f => ({ ...f, notes: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Reviewed By</Label><Input value={versionForm.reviewedBy} onChange={e => setVersionForm(f => ({ ...f, reviewedBy: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVersion(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              if (!selectedTask) return;
              const vNum = allVersions.filter(v => v.taskId === selectedTask.id).length + 1;
              addAISetExtensionVersion(selectedTask.id, vNum, versionForm.status, versionForm.notes, versionForm.reviewedBy);
              setShowAddVersion(false);
              setVersionForm({ notes: "", reviewedBy: "", status: "in-review" });
              setSelectedTask({ ...selectedTask, status: versionForm.status });
            }}>Save Version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>Add AI Set Extension Task</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Title *</Label><Input value={addForm.title || ""} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            {!projectId && (
              <div><Label>Project *</Label>
                <Select value={addForm.projectId || ""} onValueChange={v => setAddForm(f => ({ ...f, projectId: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue placeholder="Select project..." /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>VFX Shot ID (optional)</Label>
              <Select value={addForm.vfxShotId || "none"} onValueChange={v => setAddForm(f => ({ ...f, vfxShotId: v === "none" ? undefined : v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none">None</SelectItem>
                  {vfxShots.map(v => <SelectItem key={v.id} value={v.id}>{v.id} — {v.shotCode || v.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Assigned Artist</Label><Input value={addForm.assignedArtist || ""} onChange={e => setAddForm(f => ({ ...f, assignedArtist: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Description</Label><Textarea value={addForm.description || ""} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div><Label>Reference Instructions (text only — no AI calls)</Label><Textarea value={addForm.promptInstructions || ""} onChange={e => setAddForm(f => ({ ...f, promptInstructions: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" rows={3} /></div>
            <div>
              <Label>Reference Placeholders (filenames)</Label>
              <div className="flex gap-2">
                <Input value={refInput} onChange={e => setRefInput(e.target.value)} placeholder="filename.jpg" className="bg-slate-800 border-slate-700 text-white" onKeyDown={e => { if (e.key === "Enter") { setAddForm(f => ({ ...f, referencePlaceholders: [...(f.referencePlaceholders || []), refInput] })); setRefInput(""); }}} />
                <Button size="sm" variant="outline" className="border-slate-700" onClick={() => { if (refInput) { setAddForm(f => ({ ...f, referencePlaceholders: [...(f.referencePlaceholders || []), refInput] })); setRefInput(""); }}}>Add</Button>
              </div>
              <div className="flex gap-1 flex-wrap mt-1">{(addForm.referencePlaceholders || []).map((r, i) => <Badge key={i} variant="outline" className="border-slate-600 text-slate-400 text-xs cursor-pointer" onClick={() => setAddForm(f => ({ ...f, referencePlaceholders: (f.referencePlaceholders || []).filter((_, j) => j !== i) }))}>{r} ×</Badge>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              if (!addForm.title) return;
              const pid = projectId || addForm.projectId;
              if (!pid) return;
              addAISetExtensionTask({ title: addForm.title!, projectId: pid, assignedArtist: addForm.assignedArtist || "TBD", status: "planned", referencePlaceholders: addForm.referencePlaceholders || [], description: addForm.description, promptInstructions: addForm.promptInstructions, vfxShotId: addForm.vfxShotId });
              setShowAddTask(false);
              setAddForm({ referencePlaceholders: [], status: "planned" });
            }}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reports Tab ───────────────────────────────────────────────────────────────

function ReportsTab({ projectId }: Props) {
  const allProps = usePropItems(projectId);
  const allSets = useProductionSets(projectId);
  const allTasks = useAISetExtensionTasks(projectId);
  const projects = useAppDataSlice("projects");
  const [subTab, setSubTab] = useState<"props" | "sets" | "ai">("props");

  const projIds = projects.map(p => p.id);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["props", "sets", "ai"] as const).map(t => (
          <Button key={t} size="sm" variant={subTab === t ? "default" : "outline"} className={subTab === t ? "bg-blue-600" : "border-slate-700 text-slate-300"} onClick={() => setSubTab(t)}>
            {t === "props" ? "Props Inventory" : t === "sets" ? "Sets Cost" : "AI Extensions"}
          </Button>
        ))}
      </div>

      {subTab === "props" && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-right px-4 py-2">Props</th>
                <th className="text-right px-4 py-2">Total Units</th>
                <th className="text-right px-4 py-2">Allocated</th>
                <th className="text-right px-4 py-2">Purchase Cost</th>
              </tr></thead>
              <tbody>
                {[...projIds, undefined].map(pid => {
                  const pProps = allProps.filter(p => p.projectId === pid);
                  if (pProps.length === 0) return null;
                  const proj = projects.find(p => p.id === pid);
                  return (
                    <tr key={pid || "shared"} className="border-b border-slate-700/50">
                      <td className="px-4 py-2 text-white">{proj?.title || "Shared Library"}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{pProps.length}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{pProps.reduce((s, p) => s + p.quantityTotal, 0)}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{pProps.reduce((s, p) => s + (p.quantityTotal - p.quantityAvailable), 0)}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{formatINR(pProps.reduce((s, p) => s + p.purchaseCost, 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {subTab === "sets" && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
                <th className="text-left px-4 py-2">Set Name</th>
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Budget</th>
                <th className="text-right px-4 py-2">Actual</th>
                <th className="text-right px-4 py-2">Variance</th>
              </tr></thead>
              <tbody>
                {allSets.map(s => {
                  const proj = projects.find(p => p.id === s.projectId);
                  const variance = s.actualCost - s.estimatedBudget;
                  return (
                    <tr key={s.id} className="border-b border-slate-700/50">
                      <td className="px-4 py-2 text-white">{s.name}</td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{proj?.title || s.projectId}</td>
                      <td className="px-4 py-2"><StatusBadge status={s.status} colorMap={SET_STATUS_COLORS} labelMap={SET_STATUS_LABELS} /></td>
                      <td className="px-4 py-2 text-right text-slate-300">{formatINR(s.estimatedBudget)}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{s.actualCost > 0 ? formatINR(s.actualCost) : "—"}</td>
                      <td className={`px-4 py-2 text-right ${variance > 0 && s.actualCost > 0 ? "text-red-400" : variance < 0 && s.actualCost > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                        {s.actualCost > 0 ? (variance >= 0 ? "+" : "") + formatINR(variance) : "—"}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-slate-600 font-medium">
                  <td colSpan={3} className="px-4 py-2 text-slate-300">Total</td>
                  <td className="px-4 py-2 text-right text-white">{formatINR(allSets.reduce((s, st) => s + st.estimatedBudget, 0))}</td>
                  <td className="px-4 py-2 text-right text-white">{formatINR(allSets.reduce((s, st) => s + st.actualCost, 0))}</td>
                  <td className="px-4 py-2 text-right text-white">{formatINR(allSets.reduce((s, st) => s + (st.actualCost - st.estimatedBudget), 0))}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {subTab === "ai" && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700 text-xs text-slate-400">
                <th className="text-left px-4 py-2">Project</th>
                {Object.keys(AI_STATUS_LABELS).map(s => <th key={s} className="text-center px-2 py-2 text-xs">{AI_STATUS_LABELS[s]}</th>)}
                <th className="text-right px-4 py-2">Total</th>
              </tr></thead>
              <tbody>
                {projects.filter(p => allTasks.some(t => t.projectId === p.id)).map(proj => {
                  const pTasks = allTasks.filter(t => t.projectId === proj.id);
                  return (
                    <tr key={proj.id} className="border-b border-slate-700/50">
                      <td className="px-4 py-2 text-white">{proj.title}</td>
                      {Object.keys(AI_STATUS_LABELS).map(s => (
                        <td key={s} className="text-center px-2 py-2 text-slate-300">{pTasks.filter(t => t.status === s).length || "—"}</td>
                      ))}
                      <td className="px-4 py-2 text-right text-slate-300 font-medium">{pTasks.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main ArtWorkspace ─────────────────────────────────────────────────────────

export function ArtWorkspace({ projectId }: Props) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="dashboard">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="art-dept">Art Department</TabsTrigger>
          <TabsTrigger value="props">Props Library</TabsTrigger>
          <TabsTrigger value="sets">Set Management</TabsTrigger>
          <TabsTrigger value="ai">AI Set Extensions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab projectId={projectId} /></TabsContent>
        <TabsContent value="art-dept"><ArtDepartmentTab projectId={projectId} /></TabsContent>
        <TabsContent value="props"><PropsLibraryTab projectId={projectId} /></TabsContent>
        <TabsContent value="sets"><SetManagementTab projectId={projectId} /></TabsContent>
        <TabsContent value="ai"><AISetExtensionsTab projectId={projectId} /></TabsContent>
        <TabsContent value="reports"><ReportsTab projectId={projectId} /></TabsContent>
      </Tabs>
    </div>
  );
}
