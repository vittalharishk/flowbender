"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Clock, Users, Film, FileText, UserCog,
  Wrench, AlertTriangle, StickyNote, CalendarDays, Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppDataSlice } from "@/lib/app-data-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShootDay, ShootDayStatus, ShootDayScene, ShootDayCrewReq, ShootDayEquipment, ScheduleConflict } from "@/lib/types";
import { shootDayStatusLabels, shootDayStatusColors, shootDayStatusDot, updateShootDay } from "@/lib/schedule-store";
import { getEquipmentImage, getEquipmentFallback } from "@/lib/equipment-image-references";

interface Props {
  day: ShootDay;
  backHref: string;
  backLabel: string;
  onUpdate?: () => void;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function ShootDayDetail({ day, backHref, backLabel, onUpdate }: Props) {
  const scenes = useAppDataSlice("scenes").filter((scene) => scene.projectId === day.projectId);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const status = day.status;
  const TODAY = new Date().toLocaleDateString("en-CA");
  const isToday = day.date === TODAY;

  function handleStatusChange(s: ShootDayStatus) {
    updateShootDay(day.id, { status: s });
    onUpdate?.();
  }

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>
      <div className="flex flex-wrap items-center gap-4 text-sm"><Button variant="outline" onClick={() => setEditing(!editing)}>{editing ? "Cancel editing" : "Edit shoot day"}</Button><Link className="text-primary underline" href={`/dashboard/projects/${day.projectId}/call-sheets`}>Project call sheets</Link><Link className="text-primary underline" href={`/dashboard/projects/${day.projectId}/production`}>Production report</Link></div>
      {message && <p role="status" className="text-sm">{message}</p>}
      {editing && <form key={day.id} className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-3" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const location = String(form.get("location") ?? "").trim();
        if (!location) { setMessage("Location is required."); return; }
        updateShootDay(day.id, { date: String(form.get("date")), callTime: String(form.get("callTime")), wrapTime: String(form.get("wrapTime")), location, locationAddress: String(form.get("address") ?? "").trim(), notes: String(form.get("notes") ?? "") });
        setEditing(false); setMessage("Shoot day saved. Review existing call sheets after schedule changes."); onUpdate?.();
      }}>
        <div><Label htmlFor="day-date">Date</Label><Input id="day-date" name="date" type="date" required defaultValue={day.date} /></div>
        <div><Label htmlFor="day-call">Call time</Label><Input id="day-call" name="callTime" type="time" required defaultValue={day.callTime} /></div>
        <div><Label htmlFor="day-wrap">Wrap time</Label><Input id="day-wrap" name="wrapTime" type="time" required defaultValue={day.wrapTime} /></div>
        <div><Label htmlFor="day-location">Location</Label><Input id="day-location" name="location" required defaultValue={day.location} /></div>
        <div className="sm:col-span-2"><Label htmlFor="day-address">Address</Label><Input id="day-address" name="address" defaultValue={day.locationAddress} /></div>
        <div className="sm:col-span-3"><Label htmlFor="day-notes">Notes</Label><Textarea id="day-notes" name="notes" defaultValue={day.notes} /></div><Button type="submit">Save shoot day</Button>
      </form>}

      {/* Hero */}
      <div className={cn("rounded-xl border bg-card overflow-hidden", isToday && "border-amber-500/30")}>
        <div className={cn("h-2", shootDayStatusDot[status])} />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex flex-col items-center justify-center",
                  isToday ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" : "bg-muted"
                )}>
                  <span className="text-xl font-bold leading-none">{new Date(day.date).getDate()}</span>
                  <span className="text-[9px] uppercase opacity-80">{new Date(day.date).toLocaleDateString("en", { month: "short" })}</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {day.shootDayNumber > 0 ? `Day ${day.shootDayNumber}` : "Pre-Production"}
                  </h1>
                  <p className="text-muted-foreground">{fmtDate(day.date)}</p>
                </div>
                {isToday && <span className="text-xs text-amber-400 font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded-full">Today</span>}
              </div>
              <p className="text-sm text-muted-foreground">
                <Link href={`/dashboard/projects/${day.projectId}`} className="hover:text-amber-400 transition-colors font-medium">
                  {day.projectTitle}
                </Link>
                {day.shootDayNumber > 0 && <span> &middot; Day {day.shootDayNumber} of {day.totalShootDays}</span>}
              </p>
            </div>
            <Select value={status} onValueChange={(v) => handleStatusChange(v as ShootDayStatus)}>
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", shootDayStatusDot[status])} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(shootDayStatusLabels) as [ShootDayStatus, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", shootDayStatusDot[k])} /> {v}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Call: {day.callTime} &middot; Wrap: {day.wrapTime}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {day.location}</span>
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {day.totalPages} pages</span>
          </div>
        </div>
      </div>

      {/* Conflicts */}
      {day.conflicts.length > 0 && (
        <div className="space-y-2">
          {day.conflicts.map((c, i) => (
            <ConflictBanner key={i} conflict={c} />
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scenes */}
          <Section title="Scenes Planned" icon={Film} count={day.scenes.length}>
            {day.scenes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No scenes assigned.</p>
            ) : (
              <div className="space-y-2">
                {day.scenes.map((sc) => (
                  <div key={sc.sceneNumber} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-lg font-bold text-amber-400 w-10 shrink-0">
                      {sc.sceneNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{scenes.find((scene) => scene.sceneNumber === sc.sceneNumber) ? <Link className="hover:text-primary hover:underline" href={`/dashboard/projects/${day.projectId}/scenes/${scenes.find((scene) => scene.sceneNumber === sc.sceneNumber)!.id}`}>{sc.heading}</Link> : sc.heading}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span>{sc.intExt}</span>
                        <span>{sc.pages} pg</span>
                        <span>{sc.characters.length} chars</span>
                      </div>
                      {sc.characters.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sc.characters.map((ch) => (
                            <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ch}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Cast */}
          <Section title="Cast Required" icon={Users} count={day.castRequired.length}>
            {day.castRequired.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No cast assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {day.castRequired.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 text-sm bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg">
                    <Users className="w-3.5 h-3.5" /> {c}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Crew */}
          <Section title="Crew Required" icon={UserCog} count={day.crewRequired.length}>
            {day.crewRequired.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No crew assigned.</p>
            ) : (
              <div className="space-y-1.5">
                {day.crewRequired.map((cr, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 text-sm">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium shrink-0">{cr.department}</span>
                    <span className="text-muted-foreground">{cr.role}</span>
                    <span className="ml-auto font-medium">{cr.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Equipment */}
          <Section title="Equipment" icon={Wrench} count={day.equipment.length}>
            {day.equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No equipment listed.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {day.equipment.map((eq) => {
                  const imgUrl = eq.imageUrl || getEquipmentImage({ name: eq.name, notes: eq.notes });
                  return (
                    <div key={eq.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 border text-sm">
                      <img
                        src={imgUrl}
                        alt={eq.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getEquipmentFallback();
                        }}
                        className="h-9 w-12 rounded object-cover border shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-xs block truncate">{eq.name}</span>
                        {eq.notes && <p className="text-[11px] text-muted-foreground truncate">{eq.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Day Info */}
          <Section title="Day Info">
            <div className="space-y-3 text-sm">
              <InfoRow label="Date" value={fmtDate(day.date)} />
              {day.shootDayNumber > 0 && <InfoRow label="Shoot Day" value={`${day.shootDayNumber} of ${day.totalShootDays}`} />}
              <InfoRow label="Call Time" value={day.callTime} />
              <InfoRow label="Wrap Time" value={day.wrapTime} />
              <InfoRow label="Location" value={day.location} />
              {day.locationAddress && <InfoRow label="Address" value={day.locationAddress} />}
              <InfoRow label="Total Pages" value={String(day.totalPages)} />
              <InfoRow label="Scenes" value={String(day.scenes.length)} />
              <InfoRow label="Call Sheet" value={day.callSheetStatus.charAt(0).toUpperCase() + day.callSheetStatus.slice(1)} />
            </div>
          </Section>

          {/* Notes */}
          {day.notes && (
            <Section title="Notes">
              <div className="flex gap-2">
                <StickyNote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{day.notes}</p>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, count, children }: { title: string; icon?: typeof Film; count?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="font-semibold">{title}</h3>
        {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function ConflictBanner({ conflict }: { conflict: ScheduleConflict }) {
  const isCritical = conflict.severity === "critical";
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border",
      isCritical ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"
    )}>
      <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", isCritical ? "text-red-400" : "text-amber-400")} />
      <div>
        <span className={cn("text-xs font-medium uppercase", isCritical ? "text-red-400" : "text-amber-400")}>
          {conflict.type.replace(/-/g, " ")}
        </span>
        <p className="text-sm text-muted-foreground mt-0.5">{conflict.message}</p>
      </div>
    </div>
  );
}
