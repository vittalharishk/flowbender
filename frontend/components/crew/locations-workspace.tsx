"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFilmLocations, useLocationScouting, useLocationAgreements, useLocationPayments, formatINR } from "@/lib/location-store";
import { useHotels, useHotelBookings, useHotelPayments } from "@/lib/hotel-store";
import { useTrips, useTravelPayments } from "@/lib/travel-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import type { FilmLocation, LocationScouting, Hotel, HotelBooking, Trip } from "@/lib/types";

// ─── Badge helpers ────────────────────────────────────────────────────────────

function permissionBadge(status: string) {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    requested: "bg-blue-100 text-blue-700",
    "under-review": "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    expired: "bg-gray-200 text-gray-600",
    "not-requested": "bg-gray-100 text-gray-500",
  };
  return (
    <Badge className={`text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status.replace(/-/g, " ")}
    </Badge>
  );
}

function statusBadge(status: string, colorMap: Record<string, string>) {
  return (
    <Badge className={`text-xs font-medium ${colorMap[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status.replace(/-/g, " ")}
    </Badge>
  );
}

const scoutingColors: Record<string, string> = {
  planned: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  visited: "bg-purple-100 text-purple-700",
  "under-review": "bg-yellow-100 text-yellow-700",
  shortlisted: "bg-indigo-100 text-indigo-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const bookingColors: Record<string, string> = {
  requested: "bg-gray-100 text-gray-600",
  confirmed: "bg-blue-100 text-blue-700",
  "checked-in": "bg-green-100 text-green-700",
  "checked-out": "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
  "no-show": "bg-orange-100 text-orange-700",
};

const tripColors: Record<string, string> = {
  planned: "bg-gray-100 text-gray-600",
  requested: "bg-blue-100 text-blue-700",
  booked: "bg-indigo-100 text-indigo-700",
  confirmed: "bg-teal-100 text-teal-700",
  "in-transit": "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ projectId }: { projectId?: string }) {
  const filmLocations = useFilmLocations();
  const agreements = useLocationAgreements();
  const locationPayments = useLocationPayments();
  const hotels = useHotels();
  const bookings = useHotelBookings();
  const hotelPayments = useHotelPayments();
  const trips = useTrips();
  const travelPayments = useTravelPayments();
  const projects = useAppDataSlice("projects") as { id: string; title: string }[];

  const filteredAgreements = projectId
    ? agreements.filter((a) => a.projectId === projectId)
    : agreements;
  const filteredBookings = projectId
    ? bookings.filter((b) => b.projectId === projectId)
    : bookings;
  const filteredTrips = projectId ? trips.filter((t) => t.projectId === projectId) : trips;

  const activeAgreements = filteredAgreements.filter((a) => a.status !== "cancelled");
  const activeBookings = filteredBookings.filter((b) => !["cancelled", "no-show"].includes(b.status));
  const activeTrips = filteredTrips.filter((t) => t.status !== "cancelled");

  const locTotal = activeAgreements.reduce((s, a) => s + a.agreedAmount, 0);
  const locPaid = activeAgreements.reduce((s, a) => s + a.totalPaid, 0);
  const hotelTotal = activeBookings.reduce((s, b) => s + b.totalAmount, 0);
  const hotelPaid = activeBookings.reduce((s, b) => s + b.totalPaid, 0);
  const travelTotal = activeTrips.reduce((s, t) => s + t.totalCost, 0);
  const travelPaid = activeTrips.reduce((s, t) => s + t.totalPaid, 0);
  const grandTotal = locTotal + hotelTotal + travelTotal;
  const grandPaid = locPaid + hotelPaid + travelPaid;

  const statCard = (label: string, value: string, sub: string, color: string) => (
    <Card key={label}>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCard("Total Budget", formatINR(grandTotal), `${formatINR(grandPaid)} paid`, "text-slate-800 dark:text-slate-100")}
        {statCard("Location Costs", formatINR(locTotal), `${activeAgreements.length} agreements`, "text-amber-700 dark:text-amber-400")}
        {statCard("Hotel / Boarding", formatINR(hotelTotal), `${activeBookings.length} bookings`, "text-indigo-700 dark:text-indigo-400")}
        {statCard("Travel / Trips", formatINR(travelTotal), `${activeTrips.length} trips`, "text-teal-700 dark:text-teal-400")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Locations Overview</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Film Locations</span><span className="font-medium">{filmLocations.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Available</span><span className="font-medium text-green-600">{filmLocations.filter((l) => l.status === "available").length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Booked</span><span className="font-medium text-amber-600">{filmLocations.filter((l) => l.status === "booked").length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Active Agreements</span><span className="font-medium">{activeAgreements.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Agreed Amount</span><span className="font-medium">{formatINR(locTotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-green-600">{formatINR(locPaid)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Hotels & Boarding</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Hotels</span><span className="font-medium">{hotels.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Bookings</span><span className="font-medium">{activeBookings.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Checked-In</span><span className="font-medium text-green-600">{filteredBookings.filter((b) => b.status === "checked-in").length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Confirmed</span><span className="font-medium text-blue-600">{filteredBookings.filter((b) => b.status === "confirmed").length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Cost</span><span className="font-medium">{formatINR(hotelTotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-green-600">{formatINR(hotelPaid)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Travel & Trips</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Trips</span><span className="font-medium">{activeTrips.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium text-green-600">{filteredTrips.filter((t) => t.status === "completed").length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">In Transit</span><span className="font-medium text-yellow-600">{filteredTrips.filter((t) => t.status === "in-transit").length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Booked/Confirmed</span><span className="font-medium text-blue-600">{filteredTrips.filter((t) => ["booked","confirmed"].includes(t.status)).length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Cost</span><span className="font-medium">{formatINR(travelTotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-green-600">{formatINR(travelPaid)}</span></div>
          </CardContent>
        </Card>
      </div>

      {!projectId && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Project-wise Breakdown</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Location Cost</TableHead>
                  <TableHead className="text-right">Hotel Cost</TableHead>
                  <TableHead className="text-right">Travel Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const lc = agreements.filter((a) => a.projectId === p.id && a.status !== "cancelled").reduce((s, a) => s + a.agreedAmount, 0);
                  const hc = bookings.filter((b) => b.projectId === p.id && !["cancelled","no-show"].includes(b.status)).reduce((s, b) => s + b.totalAmount, 0);
                  const tc = trips.filter((t) => t.projectId === p.id && t.status !== "cancelled").reduce((s, t) => s + t.totalCost, 0);
                  if (lc + hc + tc === 0) return null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-right">{formatINR(lc)}</TableCell>
                      <TableCell className="text-right">{formatINR(hc)}</TableCell>
                      <TableCell className="text-right">{formatINR(tc)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatINR(lc + hc + tc)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Locations Tab ────────────────────────────────────────────────────────────

function LocationsTab({ projectId }: { projectId?: string }) {
  const filmLocations = useFilmLocations();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = [
    "film-set","studio","outdoor","indoor","residential",
    "commercial","road-public","hotel-resort","village-rural","other",
  ];

  const filtered = useMemo(
    () =>
      filmLocations.filter((l) => {
        const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === "all" || l.category === catFilter;
        const matchStatus = statusFilter === "all" || l.status === statusFilter;
        return matchSearch && matchCat && matchStatus;
      }),
    [filmLocations, search, catFilter, statusFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          className="w-56"
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c.replace(/-/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        <span className="self-center text-sm text-muted-foreground ml-auto">{filtered.length} locations</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rate/Day</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-medium">{l.name}</div>
                    {l.locationOwner && <div className="text-xs text-muted-foreground">{l.locationOwner}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{l.category.replace(/-/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{l.city}, {l.state}</TableCell>
                  <TableCell>{permissionBadge(l.permissionStatus)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${l.status === "available" ? "bg-green-100 text-green-700" : l.status === "booked" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatINR(l.ratePerDay)}</TableCell>
                  <TableCell className="text-right text-sm">{formatINR(l.deposit)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No locations found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Scouting & Permissions Tab ───────────────────────────────────────────────

function ScoutingTab({ projectId }: { projectId?: string }) {
  const scouting = useLocationScouting();
  const agreements = useLocationAgreements();
  const [statusFilter, setStatusFilter] = useState("all");
  const projects = useAppDataSlice("projects") as { id: string; title: string }[];

  const filtered = useMemo(() => {
    const base = projectId ? scouting.filter((s) => s.projectId === projectId) : scouting;
    return statusFilter === "all" ? base : base.filter((s) => s.status === statusFilter);
  }, [scouting, projectId, statusFilter]);

  const filteredAgreements = projectId
    ? agreements.filter((a) => a.projectId === projectId)
    : agreements;

  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.title ?? pid;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Location Scouting Records</h3>
        <div className="flex gap-2 mb-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["planned","scheduled","visited","under-review","shortlisted","approved","rejected"].map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/-/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="self-center text-sm text-muted-foreground">{filtered.length} records</span>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {!projectId && <TableHead>Project</TableHead>}
                  <TableHead>Location</TableHead>
                  <TableHead>Scout Date</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    {!projectId && <TableCell className="text-sm">{getProjectName(s.projectId)}</TableCell>}
                    <TableCell>
                      <div className="font-medium text-sm">{s.locationName}</div>
                      {s.requirements && <div className="text-xs text-muted-foreground">{s.requirements}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{s.scoutingDate}</TableCell>
                    <TableCell className="text-sm">{s.assignedManager}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{"★".repeat(s.suitabilityRating)}{"☆".repeat(5 - s.suitabilityRating)}</span>
                    </TableCell>
                    <TableCell>{statusBadge(s.status, scoutingColors)}</TableCell>
                    <TableCell className="text-right text-sm">{formatINR(s.estimatedCost)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No scouting records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Location Agreements & Permissions</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {!projectId && <TableHead>Project</TableHead>}
                  <TableHead>Location ID</TableHead>
                  <TableHead>Usage Period</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Agreement Status</TableHead>
                  <TableHead className="text-right">Agreed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgreements.map((a) => (
                  <TableRow key={a.id}>
                    {!projectId && <TableCell className="text-sm">{getProjectName(a.projectId)}</TableCell>}
                    <TableCell className="text-sm font-medium">{a.locationId}</TableCell>
                    <TableCell className="text-sm">{a.usageStartDate} → {a.usageEndDate}</TableCell>
                    <TableCell>{permissionBadge(a.permissionStatus)}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${a.status === "active" ? "bg-green-100 text-green-700" : a.status === "completed" ? "bg-blue-100 text-blue-700" : a.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatINR(a.agreedAmount)}</TableCell>
                    <TableCell className="text-right text-sm">{formatINR(a.totalPaid)}</TableCell>
                  </TableRow>
                ))}
                {filteredAgreements.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No agreements</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Boarding / Hotels Tab ────────────────────────────────────────────────────

function BoardingTab({ projectId }: { projectId?: string }) {
  const hotels = useHotels();
  const bookings = useHotelBookings();
  const [statusFilter, setStatusFilter] = useState("all");
  const [hotelFilter, setHotelFilter] = useState("all");
  const projects = useAppDataSlice("projects") as { id: string; title: string }[];

  const filteredBookings = useMemo(() => {
    let base = projectId ? bookings.filter((b) => b.projectId === projectId) : bookings;
    if (statusFilter !== "all") base = base.filter((b) => b.status === statusFilter);
    if (hotelFilter !== "all") base = base.filter((b) => b.hotelId === hotelFilter);
    return base;
  }, [bookings, projectId, statusFilter, hotelFilter]);

  const getHotelName = (id: string) => hotels.find((h) => h.id === id)?.name ?? id;
  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.title ?? pid;

  const activeBookings = filteredBookings.filter((b) => !["cancelled","no-show"].includes(b.status));
  const totalCost = activeBookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid = activeBookings.reduce((s, b) => s + b.totalPaid, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Hotels</p><p className="text-2xl font-bold">{hotels.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Cost</p><p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{formatINR(totalCost)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Amount Paid</p><p className="text-lg font-bold text-green-700 dark:text-green-400">{formatINR(totalPaid)}</p></CardContent></Card>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Hotel Directory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {hotels.map((h) => (
            <Card key={h.id} className="text-sm">
              <CardContent className="pt-3 space-y-1">
                <div className="font-semibold">{h.name}</div>
                <div className="text-muted-foreground">{h.city}</div>
                <Badge variant="outline" className="text-xs">{h.accommodationType.replace(/-/g, " ")}</Badge>
                {h.facilities && <div className="text-xs text-muted-foreground line-clamp-1">{h.facilities}</div>}
                {h.contactPerson && <div className="text-xs">Contact: {h.contactPerson}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Bookings</h3>
        <div className="flex gap-2 mb-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["requested","confirmed","checked-in","checked-out","cancelled","no-show"].map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/-/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={hotelFilter} onValueChange={setHotelFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Hotel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hotels</SelectItem>
              {hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="self-center text-sm text-muted-foreground ml-auto">{filteredBookings.length} bookings</span>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {!projectId && <TableHead>Project</TableHead>}
                  <TableHead>Guest</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((b) => (
                  <TableRow key={b.id}>
                    {!projectId && <TableCell className="text-xs">{getProjectName(b.projectId)}</TableCell>}
                    <TableCell>
                      <div className="font-medium text-sm">{b.guestName}</div>
                      <div className="text-xs text-muted-foreground capitalize">{b.guestType}</div>
                    </TableCell>
                    <TableCell className="text-sm">{getHotelName(b.hotelId)}</TableCell>
                    <TableCell className="text-sm">{b.roomType}</TableCell>
                    <TableCell className="text-sm">{b.checkInDate}</TableCell>
                    <TableCell className="text-sm">{b.nights > 0 ? b.nights : "—"}</TableCell>
                    <TableCell>{statusBadge(b.status, bookingColors)}</TableCell>
                    <TableCell className="text-right text-sm">{formatINR(b.totalAmount)}</TableCell>
                    <TableCell className="text-right text-sm">{formatINR(b.totalPaid)}</TableCell>
                  </TableRow>
                ))}
                {filteredBookings.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No bookings found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Travel / Trips Tab ───────────────────────────────────────────────────────

function TravelTab({ projectId }: { projectId?: string }) {
  const trips = useTrips();
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const projects = useAppDataSlice("projects") as { id: string; title: string }[];

  const filtered = useMemo(() => {
    let base = projectId ? trips.filter((t) => t.projectId === projectId) : trips;
    if (statusFilter !== "all") base = base.filter((t) => t.status === statusFilter);
    if (catFilter !== "all") base = base.filter((t) => t.category === catFilter);
    return base;
  }, [trips, projectId, statusFilter, catFilter]);

  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.title ?? pid;

  const categories = ["flight","train","bus","car","taxi","production-vehicle","rental-vehicle","other"];

  const activeTrips = filtered.filter((t) => t.status !== "cancelled");
  const totalCost = activeTrips.reduce((s, t) => s + t.totalCost, 0);
  const totalPaid = activeTrips.reduce((s, t) => s + t.totalPaid, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Active Trips</p><p className="text-2xl font-bold">{activeTrips.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Cost</p><p className="text-lg font-bold text-teal-700 dark:text-teal-400">{formatINR(totalCost)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Amount Paid</p><p className="text-lg font-bold text-green-700 dark:text-green-400">{formatINR(totalPaid)}</p></CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c.replace(/-/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["planned","requested","booked","confirmed","in-transit","completed","cancelled"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/-/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="self-center text-sm text-muted-foreground ml-auto">{filtered.length} trips</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {!projectId && <TableHead>Project</TableHead>}
                <TableHead>Trip</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  {!projectId && <TableCell className="text-xs">{getProjectName(t.projectId)}</TableCell>}
                  <TableCell>
                    <div className="font-medium text-sm">{t.title}</div>
                    {t.vendorProvider && <div className="text-xs text-muted-foreground">{t.vendorProvider}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{t.category.replace(/-/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{t.origin} → {t.destination}</TableCell>
                  <TableCell className="text-sm">{t.departureDateTime.slice(0, 10)}</TableCell>
                  <TableCell className="text-sm">{t.passengers.length}</TableCell>
                  <TableCell>{statusBadge(t.status, tripColors)}</TableCell>
                  <TableCell className="text-right text-sm">{formatINR(t.totalCost)}</TableCell>
                  <TableCell className="text-right text-sm">{formatINR(t.totalPaid)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No trips found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Payments & Reports Tab ───────────────────────────────────────────────────

function PaymentsTab({ projectId }: { projectId?: string }) {
  const locationPayments = useLocationPayments();
  const hotelPayments = useHotelPayments();
  const travelPayments = useTravelPayments();
  const agreements = useLocationAgreements();
  const bookings = useHotelBookings();
  const trips = useTrips();
  const projects = useAppDataSlice("projects") as { id: string; title: string }[];

  const filtLoc = projectId ? locationPayments.filter((p) => p.projectId === projectId) : locationPayments;
  const filtHot = projectId ? hotelPayments.filter((p) => p.projectId === projectId) : hotelPayments;
  const filtTrv = projectId ? travelPayments.filter((p) => p.projectId === projectId) : travelPayments;

  const locTotal = filtLoc.filter((p) => !p.isDeposit).reduce((s, p) => s + p.amount, 0);
  const locDeposits = filtLoc.filter((p) => p.isDeposit).reduce((s, p) => s + p.amount, 0);
  const hotTotal = filtHot.filter((p) => !p.isDeposit).reduce((s, p) => s + p.amount, 0);
  const hotDeposits = filtHot.filter((p) => p.isDeposit).reduce((s, p) => s + p.amount, 0);
  const trvTotal = filtTrv.reduce((s, p) => s + p.amount, 0);

  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.title ?? pid;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 space-y-1">
          <p className="text-sm text-muted-foreground">Location Fees Paid</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{formatINR(locTotal)}</p>
          <p className="text-xs text-muted-foreground">Deposits: {formatINR(locDeposits)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 space-y-1">
          <p className="text-sm text-muted-foreground">Hotel Fees Paid</p>
          <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{formatINR(hotTotal)}</p>
          <p className="text-xs text-muted-foreground">Deposits: {formatINR(hotDeposits)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 space-y-1">
          <p className="text-sm text-muted-foreground">Travel Paid</p>
          <p className="text-xl font-bold text-teal-700 dark:text-teal-400">{formatINR(trvTotal)}</p>
          <p className="text-xs text-muted-foreground">{filtTrv.length} payments</p>
        </CardContent></Card>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Location Payments</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {!projectId && <TableHead>Project</TableHead>}
                  <TableHead>Agreement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtLoc.slice(0, 20).map((p) => (
                  <TableRow key={p.id}>
                    {!projectId && <TableCell className="text-xs">{getProjectName(p.projectId)}</TableCell>}
                    <TableCell className="text-sm">{p.agreementId}</TableCell>
                    <TableCell className="text-sm">{p.paymentDate}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${p.isDeposit ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                        {p.isDeposit ? "Deposit" : "Fee"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.referenceNumber}</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(p.amount)}</TableCell>
                  </TableRow>
                ))}
                {filtLoc.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No location payments</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Hotel Payments</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {!projectId && <TableHead>Project</TableHead>}
                  <TableHead>Booking</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtHot.slice(0, 20).map((p) => (
                  <TableRow key={p.id}>
                    {!projectId && <TableCell className="text-xs">{getProjectName(p.projectId)}</TableCell>}
                    <TableCell className="text-sm">{p.bookingId}</TableCell>
                    <TableCell className="text-sm">{p.paymentDate}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${p.isDeposit ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700"}`}>
                        {p.isDeposit ? "Deposit" : "Fee"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.referenceNumber}</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(p.amount)}</TableCell>
                  </TableRow>
                ))}
                {filtHot.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No hotel payments</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Travel Payments</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {!projectId && <TableHead>Project</TableHead>}
                  <TableHead>Trip</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtTrv.slice(0, 20).map((p) => (
                  <TableRow key={p.id}>
                    {!projectId && <TableCell className="text-xs">{getProjectName(p.projectId)}</TableCell>}
                    <TableCell className="text-sm">{p.tripId}</TableCell>
                    <TableCell className="text-sm">{p.paymentDate}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.referenceNumber}</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(p.amount)}</TableCell>
                  </TableRow>
                ))}
                {filtTrv.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No travel payments</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function LocationsWorkspace({ projectId }: { projectId?: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Locations, Boarding & Travel</h2>
        <p className="text-sm text-muted-foreground">
          Film locations, scouting, agreements, hotel bookings and travel management
          {projectId ? " for this project" : " across all projects"}.
        </p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="scouting">Scouting & Permissions</TabsTrigger>
          <TabsTrigger value="boarding">Boarding / Hotels</TabsTrigger>
          <TabsTrigger value="travel">Travel / Trips</TabsTrigger>
          <TabsTrigger value="payments">Payments & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
          <LocationsTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="scouting" className="mt-4">
          <ScoutingTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="boarding" className="mt-4">
          <BoardingTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="travel" className="mt-4">
          <TravelTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
