"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  FileText,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Lock,
  Unlock,
} from "lucide-react";
import type { ProjectLocation } from "@/lib/types";
import { updateAppDataSlice } from "@/lib/app-data-store";
import { toast } from "sonner";

interface LocationPermitDialogProps {
  location: ProjectLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationPermitDialog({
  location,
  open,
  onOpenChange,
}: LocationPermitDialogProps) {
  const [authority, setAuthority] = useState("");
  const [permitRef, setPermitRef] = useState("");
  const [fee, setFee] = useState("");
  const [validDates, setValidDates] = useState("");
  const [policeNoc, setPoliceNoc] = useState(true);
  const [fireNoc, setFireNoc] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (location) {
      setAuthority(
        (location as any).permitAuthority ||
          (location.city.toLowerCase().includes("hyderabad")
            ? "GHMC Film Facilitation Cell & Cyberabad Police"
            : `${location.city} Municipal Administration`)
      );
      setPermitRef(
        (location as any).permitRef ||
          `PRM-${location.id.toUpperCase().slice(-5)}-2026`
      );
      setFee((location as any).permitFee || "₹35,000 / day");
      setValidDates(
        (location as any).permitValidDates || "Approved for scheduled shoot days"
      );
      setNotes(
        (location as any).permitNotes ||
          "Standard security perimeter, sound decibel limit compliance, and sanitation cleanup mandatory."
      );
    }
  }, [location, open]);

  const handleUpdateStatus = (newStatus: "scouting" | "permit-pending" | "locked") => {
    if (!location) return;
    updateAppDataSlice("locations", (current) =>
      current.map((l) =>
        l.id === location.id
          ? {
              ...l,
              status: newStatus,
              permitAuthority: authority,
              permitRef: permitRef,
              permitFee: fee,
              permitValidDates: validDates,
              permitNotes: notes,
            }
          : l
      )
    );

    const statusNames = {
      scouting: "Scouting (Unpermitted)",
      "permit-pending": "Permit Application Pending",
      locked: "Permits Cleared & Locked",
    };

    toast.success(`Location updated to ${statusNames[newStatus]}.`);
    onOpenChange(false);
  };

  const handleSavePermitData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;
    updateAppDataSlice("locations", (current) =>
      current.map((l) =>
        l.id === location.id
          ? {
              ...l,
              permitAuthority: authority,
              permitRef: permitRef,
              permitFee: fee,
              permitValidDates: validDates,
              permitNotes: notes,
            }
          : l
      )
    );
    toast.success("Permit record details saved.");
    onOpenChange(false);
  };

  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Location Permit Clearance</DialogTitle>
              <DialogDescription className="text-xs">
                {location.name} · {location.city} ({location.type})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Status Overview Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
            location.status === "locked"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : location.status === "permit-pending"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300"
          }`}
        >
          {location.status === "locked" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
          ) : location.status === "permit-pending" ? (
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          )}
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5">
              Current Stage: {location.status.replace(/-/g, " ")}
            </span>
            <p className="opacity-90 leading-relaxed">
              {location.status === "locked"
                ? "All municipal, police, and safety clearance permits have been approved and fees processed. This venue is locked for principal photography."
                : location.status === "permit-pending"
                ? "Official permit filing has been submitted and is currently undergoing review by municipal corporations, traffic police, and venue custodians."
                : "Location is in scouting phase. Production permits must be filed and approved before cast and camera crew can shoot on site."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePermitData} className="space-y-3.5 pt-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Issuing Authority / Board</Label>
              <Input
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="e.g. GHMC / ASI / Police Commissioner"
                className="text-xs mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Permit Application Ref #</Label>
              <Input
                value={permitRef}
                onChange={(e) => setPermitRef(e.target.value)}
                placeholder="e.g. PERMIT-2026-0041"
                className="text-xs mt-1 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Permit Tariff / Fee</Label>
              <Input
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="e.g. ₹40,000 / day"
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Approved Shoot Schedule</Label>
              <Input
                value={validDates}
                onChange={(e) => setValidDates(e.target.value)}
                placeholder="e.g. 05:00 - 09:00 hrs daily"
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* Compliance Checkboxes */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border bg-muted/20">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={policeNoc}
                onChange={(e) => setPoliceNoc(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Police NOC Clearance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={fireNoc}
                onChange={(e) => setFireNoc(e.target.checked)}
                className="rounded accent-primary"
              />
              <span>Fire Safety & Evacuation</span>
            </label>
          </div>

          <div>
            <Label className="text-xs font-semibold">Regulatory Notes & Conditions</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sound decibel rules, generator truck parking, crowd buffer zones..."
              rows={2}
              className="text-xs mt-1 resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 border-t flex flex-wrap items-center justify-between">
            {/* Direct Workflow Advance Buttons */}
            <div className="flex items-center gap-1.5">
              {location.status !== "permit-pending" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => handleUpdateStatus("permit-pending")}
                >
                  <Send className="w-3.5 h-3.5 text-amber-500" />
                  Mark as Permit Pending
                </Button>
              )}

              {location.status !== "locked" ? (
                <Button
                  type="button"
                  size="sm"
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={() => handleUpdateStatus("locked")}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve & Lock Location
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  onClick={() => handleUpdateStatus("scouting")}
                >
                  <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
                  Unlock (Back to Scouting)
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button type="submit" size="sm" className="bg-primary">
                Save Details
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
