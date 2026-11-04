"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Car, Bus, Truck, Shield, AlertTriangle, Users, Wrench, BarChart3,
} from "lucide-react";
import {
  useProductionVehicles, useVehicleAllocations, useCaravans,
  useCaravanAllocations, useDriverProfiles, useDriverAssignments,
  useStuntPlans, useStuntSafetyChecklists, useStuntEquipment,
  useStuntEquipmentTransactions, calcVehicleStuntDashboard, formatINR,
  isLicenseExpired, isLicenseExpiring,
} from "@/lib/vehicle-stunt-store";
import {
  VEHICLE_STATUS_COLORS, CARAVAN_STATUS_COLORS, STUNT_STATUS_COLORS, RISK_LEVEL_COLORS,
  ALLOCATION_STATUS_COLORS,
} from "@/lib/vehicle-stunt-categories";
import { useAppDataSlice } from "@/lib/app-data-store";
import type { CrewMember, Vendor } from "@/lib/types";

interface Props {
  projectId?: string;
}

export default function VehiclesStuntsWorkspace({ projectId }: Props) {
  const [tab, setTab] = useState("dashboard");

  const vehicles = useProductionVehicles(projectId);
  const allocations = useVehicleAllocations(projectId);
  const caravans = useCaravans(projectId);
  const caravanAllocations = useCaravanAllocations(projectId);
  const driverProfiles = useDriverProfiles();
  const driverAssignments = useDriverAssignments(projectId);
  const stuntPlans = useStuntPlans(projectId);
  const stuntChecklists = useStuntSafetyChecklists();
  const stuntEquipment = useStuntEquipment();
  const stuntTransactions = useStuntEquipmentTransactions(projectId);
  const crewMembers = useAppDataSlice("crewMembers") as CrewMember[];
  const vendors = useAppDataSlice("rentalVendors") as Vendor[];

  const dash = calcVehicleStuntDashboard(
    vehicles, allocations, caravans, caravanAllocations, driverProfiles, stuntPlans, stuntEquipment
  );

  const crewName = (id?: string) => crewMembers.find((c) => c.id === id)?.name ?? id ?? "—";
  const vendorName = (id?: string) => vendors.find((v) => v.id === id)?.name ?? id ?? "—";
  const checklist = (spId: string) => stuntChecklists.find((c) => c.stuntPlanId === spId);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="vehicles"><Car className="h-4 w-4 mr-1" />Vehicles</TabsTrigger>
          <TabsTrigger value="caravans"><Bus className="h-4 w-4 mr-1" />Caravans</TabsTrigger>
          <TabsTrigger value="drivers"><Users className="h-4 w-4 mr-1" />Drivers</TabsTrigger>
          <TabsTrigger value="stunts"><Shield className="h-4 w-4 mr-1" />Action & Stunts</TabsTrigger>
          <TabsTrigger value="equipment"><Wrench className="h-4 w-4 mr-1" />Stunt Equipment</TabsTrigger>
          <TabsTrigger value="reports"><Truck className="h-4 w-4 mr-1" />Reports</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD ── */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Vehicles" value={dash.totalVehicles} sub={`${dash.availableVehicles} available`} />
            <StatCard label="Allocated" value={dash.allocatedVehicles} sub={`${dash.maintenanceVehicles} in maintenance`} color="blue" />
            <StatCard label="Caravans" value={dash.totalCaravans} sub={`${dash.activeCaravanAllocations} active allocations`} />
            <StatCard label="Drivers" value={dash.totalDrivers} sub={`${dash.availableDrivers} available`} color={dash.expiringLicenses > 0 ? "orange" : undefined} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Stunt Plans" value={dash.totalStunts} sub={`${dash.completedStunts} completed`} />
            <StatCard label="High Risk Stunts" value={dash.highRiskStunts} sub={`${dash.pendingApproval} pending approval`} color="red" />
            <StatCard label="Equipment Units" value={dash.totalEquipment} sub={`${dash.equipmentAvailable} available`} />
            <StatCard label="Checked Out" value={dash.equipmentCheckedOut} sub="units currently out" color="blue" />
          </div>

          {dash.expiringLicenses > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="pt-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-700 dark:text-orange-400">
                  {dash.expiringLicenses} driver license{dash.expiringLicenses > 1 ? "s" : ""} expiring within 30 days
                </span>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Stunt Plans</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {stuntPlans.slice(0, 5).map((sp) => (
                  <div key={sp.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{sp.title}</span>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <Badge variant="outline" className={`text-xs ${RISK_LEVEL_COLORS[sp.riskLevel]}`}>{sp.riskLevel}</Badge>
                      <Badge variant="outline" className={`text-xs ${STUNT_STATUS_COLORS[sp.status]}`}>{sp.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Active Vehicle Allocations</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {allocations.filter((a) => a.status === "active").slice(0, 5).map((a) => {
                  const v = vehicles.find((x) => x.id === a.vehicleId);
                  return (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{v?.name ?? a.vehicleId}</span>
                      <Badge variant="outline" className={`text-xs ml-2 flex-shrink-0 ${ALLOCATION_STATUS_COLORS[a.status]}`}>{a.status}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── VEHICLES ── */}
        <TabsContent value="vehicles">
          <Card>
            <CardHeader><CardTitle className="text-sm">Production Vehicles ({vehicles.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Name", "Reg. No.", "Category", "Seats", "Ownership", "Vendor", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{v.name}</td>
                        <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{v.registrationNumber}</td>
                        <td className="px-3 py-2 capitalize">{v.category}</td>
                        <td className="px-3 py-2">{v.seatingCapacity}</td>
                        <td className="px-3 py-2 capitalize">{v.ownership}</td>
                        <td className="px-3 py-2 text-muted-foreground">{v.vendorId ? vendorName(v.vendorId) : "—"}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-xs ${VEHICLE_STATUS_COLORS[v.status]}`}>{v.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Vehicle Allocations ({allocations.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Vehicle", "Driver", "From", "To", "Passengers", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((a) => {
                      const v = vehicles.find((x) => x.id === a.vehicleId);
                      return (
                        <tr key={a.id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{v?.name ?? a.vehicleId}</td>
                          <td className="px-3 py-2">{a.driverCrewId ? crewName(a.driverCrewId) : "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{a.startDate}</td>
                          <td className="px-3 py-2 text-muted-foreground">{a.endDate}</td>
                          <td className="px-3 py-2">{a.passengerCount}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={`text-xs ${ALLOCATION_STATUS_COLORS[a.status]}`}>{a.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CARAVANS ── */}
        <TabsContent value="caravans">
          <Card>
            <CardHeader><CardTitle className="text-sm">Caravans ({caravans.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Name", "ID No.", "Category", "Capacity", "Ownership", "Vendor", "Rental/Day", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {caravans.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{c.name}</td>
                        <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{c.identificationNumber}</td>
                        <td className="px-3 py-2 capitalize">{c.category.replace("-", " ")}</td>
                        <td className="px-3 py-2">{c.capacity}</td>
                        <td className="px-3 py-2 capitalize">{c.ownership}</td>
                        <td className="px-3 py-2 text-muted-foreground">{c.vendorId ? vendorName(c.vendorId) : "—"}</td>
                        <td className="px-3 py-2">{c.rentalCostPerDay > 0 ? formatINR(c.rentalCostPerDay) : "—"}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-xs ${CARAVAN_STATUS_COLORS[c.status]}`}>{c.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Caravan Allocations ({caravanAllocations.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Caravan", "Assigned To", "From", "To", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {caravanAllocations.map((a) => {
                      const c = caravans.find((x) => x.id === a.caravanId);
                      return (
                        <tr key={a.id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{c?.name ?? a.caravanId}</td>
                          <td className="px-3 py-2">{a.assignedTo}</td>
                          <td className="px-3 py-2 text-muted-foreground">{a.startDate}</td>
                          <td className="px-3 py-2 text-muted-foreground">{a.endDate}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={`text-xs ${ALLOCATION_STATUS_COLORS[a.status]}`}>{a.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DRIVERS ── */}
        <TabsContent value="drivers">
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">
            Driver profiles are linked to Crew Members. To edit crew details, use the <strong>Crew &amp; Departments</strong> tab.
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Driver Profiles ({driverProfiles.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Name", "License No.", "Type", "Expiry", "Available", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {driverProfiles.map((dp) => {
                      const expired = isLicenseExpired(dp);
                      const expiring = isLicenseExpiring(dp);
                      return (
                        <tr key={dp.id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{crewName(dp.crewMemberId)}</td>
                          <td className="px-3 py-2 font-mono text-xs">{dp.licenseNumber}</td>
                          <td className="px-3 py-2">{dp.licenseType}</td>
                          <td className={`px-3 py-2 ${expired ? "text-red-600" : expiring ? "text-orange-600" : ""}`}>
                            {dp.licenseExpiry}
                            {expired && <span className="ml-1 text-xs">(EXPIRED)</span>}
                            {expiring && !expired && <span className="ml-1 text-xs">(expiring)</span>}
                          </td>
                          <td className="px-3 py-2">{dp.available ? "Yes" : "No"}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={`text-xs ${expired ? "bg-red-100 text-red-700" : dp.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {expired ? "Expired" : dp.available ? "Available" : "Unavailable"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Driver Assignments ({driverAssignments.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Driver", "Vehicle", "Duty Start", "Duty End", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {driverAssignments.map((da) => {
                      const dp = driverProfiles.find((x) => x.id === da.driverProfileId);
                      const v = vehicles.find((x) => x.id === da.vehicleId);
                      return (
                        <tr key={da.id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{dp ? crewName(dp.crewMemberId) : da.driverProfileId}</td>
                          <td className="px-3 py-2">{v?.name ?? da.vehicleId}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{da.dutyStart.replace("T", " ")}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{da.dutyEnd.replace("T", " ")}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={`text-xs ${ALLOCATION_STATUS_COLORS[da.status]}`}>{da.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STUNTS ── */}
        <TabsContent value="stunts">
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>This is an administrative tracking tool only. Do not use as a substitute for professional stunt safety assessment or qualified safety supervision.</span>
          </div>
          <div className="space-y-3">
            {stuntPlans.map((sp) => {
              const cl = checklist(sp.id);
              return (
                <Card key={sp.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{sp.title}</span>
                          <Badge variant="outline" className={`text-xs ${RISK_LEVEL_COLORS[sp.riskLevel]}`}>{sp.riskLevel}</Badge>
                          <Badge variant="outline" className={`text-xs ${STUNT_STATUS_COLORS[sp.status]}`}>{sp.status.replace("-", " ")}</Badge>
                          {sp.safetySignedOff && <Badge variant="outline" className="text-xs bg-green-100 text-green-700">Safety ✓</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{sp.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          {sp.plannedDate && <span>Planned: {sp.plannedDate}</span>}
                          {sp.rehearsalDate && <span>Rehearsal: {sp.rehearsalDate}</span>}
                          {sp.completedDate && <span>Completed: {sp.completedDate}</span>}
                          {sp.assignedStuntCrewIds.length > 0 && <span>{sp.assignedStuntCrewIds.length} stunt crew</span>}
                          {sp.vehicleIds.length > 0 && <span>{sp.vehicleIds.length} vehicle(s)</span>}
                          {sp.equipmentIds.length > 0 && <span>{sp.equipmentIds.length} equipment</span>}
                        </div>
                        {cl && (
                          <div className="flex gap-3 mt-2 text-xs flex-wrap">
                            <CheckPill label="Risk Assessment" done={cl.riskAssessmentDone} />
                            <CheckPill label="Safety Briefing" done={cl.safetyBriefingDone} />
                            <CheckPill label="Rehearsal" done={cl.rehearsalDone} />
                            <CheckPill label="Officer Sign-off" done={cl.safetyOfficerSignOff} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── STUNT EQUIPMENT ── */}
        <TabsContent value="equipment">
          <Card>
            <CardHeader><CardTitle className="text-sm">Stunt Equipment ({stuntEquipment.length} items)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Name", "Category", "Total", "Available", "Condition", "Ownership", "Vendor"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stuntEquipment.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{e.name}</td>
                        <td className="px-3 py-2 capitalize">{e.category.replace(/-/g, " ")}</td>
                        <td className="px-3 py-2">{e.quantityTotal}</td>
                        <td className={`px-3 py-2 font-medium ${e.quantityAvailable === 0 ? "text-red-600" : e.quantityAvailable < e.quantityTotal * 0.3 ? "text-orange-600" : "text-green-700"}`}>
                          {e.quantityAvailable}
                        </td>
                        <td className="px-3 py-2 capitalize">{e.condition}</td>
                        <td className="px-3 py-2 capitalize">{e.ownership}</td>
                        <td className="px-3 py-2 text-muted-foreground">{e.vendorId ? vendorName(e.vendorId) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Equipment Transactions ({stuntTransactions.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {["Equipment", "Stunt Plan", "Type", "Qty", "Checked Out By", "Checkout Date", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stuntTransactions.map((t) => {
                      const eq = stuntEquipment.find((x) => x.id === t.equipmentId);
                      const sp = stuntPlans.find((x) => x.id === t.stuntPlanId);
                      return (
                        <tr key={t.id} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{eq?.name ?? t.equipmentId}</td>
                          <td className="px-3 py-2 text-muted-foreground">{sp?.title ?? t.stuntPlanId ?? "—"}</td>
                          <td className="px-3 py-2 capitalize">{t.type}</td>
                          <td className="px-3 py-2">{t.quantity}</td>
                          <td className="px-3 py-2">{t.checkedOutBy}</td>
                          <td className="px-3 py-2 text-muted-foreground">{t.checkoutDate}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={`text-xs ${t.status === "active" ? "bg-blue-100 text-blue-700" : t.status === "returned" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REPORTS ── */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Caravan Rental Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {caravans.filter((c) => c.ownership === "rented").map((c) => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="truncate text-muted-foreground">{c.name}</span>
                    <span className="font-medium ml-2 flex-shrink-0">{formatINR(c.totalRentalCost)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>{formatINR(caravans.filter((c) => c.ownership === "rented").reduce((s, c) => s + c.totalRentalCost, 0))}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Stunt Plans by Risk Level</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(["extreme", "high", "medium", "low"] as const).map((level) => {
                  const count = stuntPlans.filter((s) => s.riskLevel === level).length;
                  return (
                    <div key={level} className="flex items-center justify-between text-sm">
                      <Badge variant="outline" className={`text-xs ${RISK_LEVEL_COLORS[level]}`}>{level}</Badge>
                      <span>{count} plan{count !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Vehicle Fleet by Category</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {["bus", "suv", "car", "van", "truck", "cargo", "special-purpose"].map((cat) => {
                  const count = vehicles.filter((v) => v.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{cat}</span>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Stunt Equipment Utilization</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {stuntEquipment.map((e) => {
                  const pct = e.quantityTotal > 0
                    ? Math.round(((e.quantityTotal - e.quantityAvailable) / e.quantityTotal) * 100)
                    : 0;
                  return (
                    <div key={e.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="truncate text-muted-foreground">{e.name}</span>
                        <span className="ml-2 flex-shrink-0">{e.quantityTotal - e.quantityAvailable}/{e.quantityTotal} out</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  const borderColor = color === "red" ? "border-red-200 dark:border-red-800" : color === "orange" ? "border-orange-200 dark:border-orange-800" : color === "blue" ? "border-blue-200 dark:border-blue-800" : "";
  return (
    <Card className={borderColor}>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs font-medium">{label}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function CheckPill({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${done ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {done ? "✓" : "○"} {label}
    </span>
  );
}
