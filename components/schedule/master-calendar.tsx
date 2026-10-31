"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Plus, X, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/calendar-store";
import type { CalendarEvent, CalendarEventType, CalendarEventStatus, ShootDay } from "@/lib/types";

// ─── Constants ─────────────────────────────────────────────────────────────

const EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
  { value: "shoot", label: "Shooting Day" },
  { value: "cast-meeting", label: "Cast Meeting" },
  { value: "crew-meeting", label: "Crew Meeting" },
  { value: "audition", label: "Audition" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "table-read", label: "Table Read" },
  { value: "location-scouting", label: "Location Scouting" },
  { value: "pre-prod-deadline", label: "Pre-Production Deadline" },
  { value: "post-prod-deadline", label: "Post-Production Deadline" },
  { value: "dubbing", label: "Dubbing" },
  { value: "delivery", label: "Delivery" },
  { value: "other", label: "Other" },
];

const EVENT_STATUSES: { value: CalendarEventStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "postponed", label: "Postponed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_COLOR: Record<string, string> = {
  shoot: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "cast-meeting": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "crew-meeting": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  audition: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  rehearsal: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "table-read": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "location-scouting": "bg-green-500/20 text-green-300 border-green-500/30",
  "pre-prod-deadline": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "post-prod-deadline": "bg-red-500/20 text-red-300 border-red-500/30",
  dubbing: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  delivery: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const TYPE_DOT: Record<string, string> = {
  shoot: "bg-amber-400",
  "cast-meeting": "bg-violet-400",
  "crew-meeting": "bg-blue-400",
  audition: "bg-pink-400",
  rehearsal: "bg-purple-400",
  "table-read": "bg-cyan-400",
  "location-scouting": "bg-green-400",
  "pre-prod-deadline": "bg-orange-400",
  "post-prod-deadline": "bg-red-400",
  dubbing: "bg-teal-400",
  delivery: "bg-emerald-400",
  other: "bg-slate-400",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function shootDayToEvent(sd: ShootDay): CalendarEvent {
  return {
    id: `sd-event-${sd.id}`,
    type: "shoot",
    title: `Day ${sd.shootDayNumber ?? ""}: ${sd.location ?? ""}`.trim(),
    date: sd.date,
    projectId: sd.projectId,
    projectTitle: sd.projectTitle ?? "",
    location: sd.location ?? "",
    status: "confirmed",
    linkedShootDayId: sd.id,
    createdAt: "",
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────

function EventBadge({ event, onClick }: { event: CalendarEvent; onClick?: () => void }) {
  const label = EVENT_TYPES.find(t => t.value === event.type)?.label ?? event.type;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded border truncate ${TYPE_COLOR[event.type] ?? TYPE_COLOR.other} hover:opacity-80 transition-opacity`}
      title={event.title}
    >
      {event.title}
    </button>
  );
}

function EventDetailDialog({
  event,
  shootDays,
  onClose,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  shootDays: ShootDay[];
  onClose: () => void;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  const isShootDay = event.id.startsWith("sd-event-");
  const linkedSd = event.linkedShootDayId ? shootDays.find(s => s.id === event.linkedShootDayId) : null;
  const typLabel = EVENT_TYPES.find(t => t.value === event.type)?.label ?? event.type;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="pr-8">{event.title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge className={TYPE_COLOR[event.type] ?? TYPE_COLOR.other}>{typLabel}</Badge>
          <Badge variant="outline">{event.status}</Badge>
          {event.projectTitle && <Badge variant="outline" className="bg-slate-800">{event.projectTitle}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div><span className="text-foreground font-medium">Date:</span> {fmt(event.date)}{event.time ? ` · ${event.time}` : ""}{event.endTime ? ` – ${event.endTime}` : ""}</div>
          {event.endDate && <div><span className="text-foreground font-medium">End:</span> {fmt(event.endDate)}</div>}
          {event.location && <div className="col-span-2"><span className="text-foreground font-medium">Location:</span> {event.location}</div>}
          {event.department && <div><span className="text-foreground font-medium">Dept:</span> {event.department}</div>}
        </div>
        {event.description && <p className="text-muted-foreground text-xs">{event.description}</p>}
        {event.participants && event.participants.length > 0 && (
          <div>
            <p className="font-medium text-xs mb-1">Participants</p>
            <div className="flex flex-wrap gap-1">
              {event.participants.map((p, i) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{p}</span>)}
            </div>
          </div>
        )}
        {event.notes && <p className="text-xs text-muted-foreground italic">{event.notes}</p>}
        {linkedSd && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1">
            <p className="font-medium text-amber-400">Linked Shoot Day</p>
            <p>Day {linkedSd.shootDayNumber} · {linkedSd.location}</p>
            <p>Cast: {linkedSd.castRequired?.length ?? 0} · Scenes: {linkedSd.scenes?.length ?? 0}</p>
          </div>
        )}
      </div>
      <DialogFooter className="gap-2">
        {!isShootDay && (
          <>
            <Button size="sm" variant="destructive" onClick={() => { onDelete(event.id); onClose(); }}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onEdit(event); onClose(); }}>
              <Edit2 className="w-3 h-3 mr-1" /> Edit
            </Button>
          </>
        )}
        <Button size="sm" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EventFormDialog({
  initial,
  projects,
  onSave,
  onClose,
}: {
  initial?: CalendarEvent | null;
  projects: { id: string; title: string }[];
  onSave: (data: Omit<CalendarEvent, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<CalendarEvent>>(
    initial ?? { type: "other", status: "scheduled", date: today(), participants: [] }
  );

  const set = (k: keyof CalendarEvent, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit Event" : "Create Event"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs text-muted-foreground">Title *</label>
          <Input value={form.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="Event title" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Type *</label>
            <Select value={form.type ?? "other"} onValueChange={v => set("type", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={form.status ?? "scheduled"} onValueChange={v => set("status", v as CalendarEventStatus)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{EVENT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Project</label>
          <Select value={form.projectId ?? "__none__"} onValueChange={v => {
            const p = projects.find(pr => pr.id === v);
            set("projectId", v === "__none__" ? undefined : v);
            set("projectTitle", p?.title ?? "");
          }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">All projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Start Date *</label>
            <Input type="date" value={form.date ?? ""} onChange={e => set("date", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">End Date</label>
            <Input type="date" value={form.endDate ?? ""} onChange={e => set("endDate", e.target.value || undefined)} className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Start Time</label>
            <Input type="time" value={form.time ?? ""} onChange={e => set("time", e.target.value || undefined)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">End Time</label>
            <Input type="time" value={form.endTime ?? ""} onChange={e => set("endTime", e.target.value || undefined)} className="mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Location</label>
          <Input value={form.location ?? ""} onChange={e => set("location", e.target.value)} className="mt-1" placeholder="Location" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Department</label>
          <Input value={form.department ?? ""} onChange={e => set("department", e.target.value)} className="mt-1" placeholder="Department" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Participants (comma-separated)</label>
          <Input
            value={(form.participants ?? []).join(", ")}
            onChange={e => set("participants", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="mt-1" placeholder="Person A, Person B" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Description</label>
          <Textarea value={form.description ?? ""} onChange={e => set("description", e.target.value)} className="mt-1" rows={2} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <Textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} className="mt-1" rows={2} />
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => {
          if (!form.title || !form.date) return;
          onSave({
            type: form.type ?? "other",
            title: form.title,
            date: form.date,
            status: form.status ?? "scheduled",
            endDate: form.endDate,
            time: form.time,
            endTime: form.endTime,
            projectId: form.projectId,
            projectTitle: form.projectTitle,
            location: form.location,
            department: form.department,
            participants: form.participants,
            description: form.description,
            notes: form.notes,
          });
          onClose();
        }}>
          {initial ? "Save Changes" : "Create Event"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────

function DashboardTab({ allEvents }: { allEvents: CalendarEvent[] }) {
  const t = today();
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const d7 = in7.toISOString().slice(0, 10);
  const d30 = in30.toISOString().slice(0, 10);

  const todayEvts = allEvents.filter(e => e.date === t && e.status !== "cancelled");
  const upcoming7 = allEvents.filter(e => e.date > t && e.date <= d7 && e.status !== "cancelled");
  const upcoming30 = allEvents.filter(e => e.date > t && e.date <= d30 && e.status !== "cancelled");
  const overdue = allEvents.filter(e => e.date < t && !["completed", "cancelled"].includes(e.status));

  // By project
  const byProject: Record<string, number> = {};
  allEvents.filter(e => e.status !== "cancelled").forEach(e => {
    const k = e.projectTitle ?? "General";
    byProject[k] = (byProject[k] ?? 0) + 1;
  });

  // By category
  const byType: Record<string, number> = {};
  allEvents.filter(e => e.status !== "cancelled").forEach(e => {
    byType[e.type] = (byType[e.type] ?? 0) + 1;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Today", value: todayEvts.length, color: "text-amber-400" },
          { label: "Next 7 Days", value: upcoming7.length, color: "text-blue-400" },
          { label: "Next 30 Days", value: upcoming30.length, color: "text-violet-400" },
          { label: "Overdue", value: overdue.length, color: "text-red-400" },
        ].map(c => (
          <Card key={c.label} className="border-border/40">
            <CardContent className="px-4 py-3">
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {todayEvts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-amber-400">Today&apos;s Events</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {todayEvts.map(e => (
              <div key={e.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other}`}>
                <span className="text-xs font-medium flex-1 truncate">{e.title}</span>
                {e.time && <span className="text-xs text-muted-foreground">{e.time}</span>}
                {e.projectTitle && <Badge variant="outline" className="text-[10px]">{e.projectTitle}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Project-wise Events</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(byProject).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([proj, cnt]) => (
              <div key={proj} className="flex items-center gap-2">
                <span className="flex-1 text-xs truncate">{proj}</span>
                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${Math.min(100, (cnt / allEvents.length) * 100 * 3)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{cnt}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Category-wise Events</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([type, cnt]) => {
              const label = EVENT_TYPES.find(t => t.value === type)?.label ?? type;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[type] ?? "bg-slate-400"}`} />
                  <span className="flex-1 text-xs truncate">{label}</span>
                  <span className="text-xs text-muted-foreground">{cnt}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {overdue.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader><CardTitle className="text-sm text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Overdue Events</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 8).map(e => (
              <div key={e.id} className="flex items-center gap-3 text-xs">
                <span className="w-20 text-muted-foreground flex-shrink-0">{fmt(e.date)}</span>
                <span className="flex-1 truncate">{e.title}</span>
                {e.projectTitle && <Badge variant="outline" className="text-[10px]">{e.projectTitle}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Month View ────────────────────────────────────────────────────────────

function MonthView({
  allEvents,
  onSelect,
}: { allEvents: CalendarEvent[]; onSelect: (e: CalendarEvent) => void }) {
  const [cur, setCur] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { year, month } = cur;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const t = today();

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  allEvents.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  const cells: (string | null)[] = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(dateStr);
  }

  const dayEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setCur(c => { const d = new Date(c.year, c.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-semibold">{MONTHS[month]} {year}</span>
          <Button variant="outline" size="sm" onClick={() => { const n = new Date(); setCur({ year: n.getFullYear(), month: n.getMonth() }); }}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setCur(c => { const d = new Date(c.year, c.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-px text-center text-[11px] text-muted-foreground">
          {DAYS.map(d => <div key={d} className="py-1 font-medium">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} className="min-h-[72px] bg-muted/10 rounded" />;
            const evts = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === t;
            const isSelected = dateStr === selectedDay;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                className={`min-h-[72px] p-1 rounded text-left border transition-colors ${isSelected ? "border-primary" : "border-transparent"} ${isToday ? "bg-amber-500/10" : "bg-muted/10 hover:bg-muted/20"}`}
              >
                <span className={`text-[11px] font-medium block mb-1 ${isToday ? "text-amber-400" : "text-muted-foreground"}`}>
                  {new Date(dateStr + "T00:00:00").getDate()}
                </span>
                <div className="space-y-px">
                  {evts.slice(0, 2).map(e => (
                    <div key={e.id} className={`text-[9px] truncate px-1 rounded ${TYPE_DOT[e.type] ? `${TYPE_DOT[e.type].replace("bg-", "bg-").replace("400", "500")}/30` : ""}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-0.5 ${TYPE_DOT[e.type] ?? "bg-slate-400"}`} />
                      {e.title}
                    </div>
                  ))}
                  {evts.length > 2 && <span className="text-[9px] text-muted-foreground">+{evts.length - 2} more</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        {selectedDay ? (
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="text-sm">{fmt(selectedDay)} — {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {dayEvents.length === 0 && <p className="text-xs text-muted-foreground">No events this day.</p>}
              {dayEvents.map(e => (
                <button key={e.id} onClick={() => onSelect(e)} className={`w-full text-left rounded-lg border px-3 py-2 text-xs ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other} hover:opacity-80`}>
                  <p className="font-medium truncate">{e.title}</p>
                  {e.time && <p className="text-muted-foreground">{e.time}{e.endTime ? ` – ${e.endTime}` : ""}</p>}
                  {e.location && <p className="text-muted-foreground truncate">{e.location}</p>}
                </button>
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm border rounded-lg">
            <Calendar className="w-6 h-6 mb-2 opacity-40" />
            Click a day to see events
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week View ─────────────────────────────────────────────────────────────

function WeekView({ allEvents, onSelect }: { allEvents: CalendarEvent[]; onSelect: (e: CalendarEvent) => void }) {
  const [weekStart, setWeekStart] = useState(() => {
    const n = new Date(); n.setDate(n.getDate() - n.getDay()); n.setHours(0,0,0,0); return n;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const t = today();
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  allEvents.forEach(e => { if (!eventsByDate[e.date]) eventsByDate[e.date] = []; eventsByDate[e.date].push(e); });

  const move = (dir: number) => setWeekStart(w => { const n = new Date(w); n.setDate(n.getDate() + dir * 7); return n; });
  const goToday = () => { const n = new Date(); n.setDate(n.getDate() - n.getDay()); n.setHours(0,0,0,0); setWeekStart(n); };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => move(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="font-semibold text-sm">{fmt(weekDays[0])} – {fmt(weekDays[6])}</span>
        <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
        <Button variant="outline" size="sm" onClick={() => move(1)}><ChevronRight className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(dateStr => {
          const evts = eventsByDate[dateStr] ?? [];
          const isToday = dateStr === t;
          const d = new Date(dateStr + "T00:00:00");
          return (
            <div key={dateStr} className={`min-h-[120px] rounded-lg border p-2 ${isToday ? "border-amber-500/30 bg-amber-500/5" : "border-border/30 bg-muted/5"}`}>
              <p className={`text-[11px] font-medium mb-1 ${isToday ? "text-amber-400" : "text-muted-foreground"}`}>
                {DAYS[d.getDay()]} {d.getDate()}
              </p>
              <div className="space-y-1">
                {evts.map(e => <EventBadge key={e.id} event={e} onClick={() => onSelect(e)} />)}
                {evts.length === 0 && <p className="text-[10px] text-muted-foreground/40 text-center mt-4">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ──────────────────────────────────────────────────────────────

function DayView({ allEvents, onSelect }: { allEvents: CalendarEvent[]; onSelect: (e: CalendarEvent) => void }) {
  const [day, setDay] = useState(today);

  const evts = allEvents.filter(e => e.date === day).sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00"));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setDay(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n.toISOString().slice(0,10); })}><ChevronLeft className="w-4 h-4" /></Button>
        <Input type="date" value={day} onChange={e => setDay(e.target.value)} className="w-40" />
        <Button variant="outline" size="sm" onClick={() => setDay(today())}>Today</Button>
        <Button variant="outline" size="sm" onClick={() => setDay(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n.toISOString().slice(0,10); })}><ChevronRight className="w-4 h-4" /></Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">{fmt(day)} — {evts.length} event{evts.length !== 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {evts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No events scheduled for this day.</p>}
          {evts.map(e => (
            <button key={e.id} onClick={() => onSelect(e)} className={`w-full text-left rounded-lg border px-4 py-3 ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other} hover:opacity-80 transition-opacity`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{EVENT_TYPES.find(t => t.value === e.type)?.label}</p>
                  {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                  {e.participants && e.participants.length > 0 && <p className="text-xs text-muted-foreground">{e.participants.slice(0,3).join(", ")}{e.participants.length > 3 ? ` +${e.participants.length-3}` : ""}</p>}
                </div>
                <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                  {e.time && <p>{e.time}{e.endTime ? `–${e.endTime}` : ""}</p>}
                  {e.projectTitle && <Badge variant="outline" className="text-[10px] mt-1">{e.projectTitle}</Badge>}
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Agenda View ───────────────────────────────────────────────────────────

function AgendaView({ allEvents, onSelect }: { allEvents: CalendarEvent[]; onSelect: (e: CalendarEvent) => void }) {
  const t = today();
  const upcoming = [...allEvents].filter(e => e.status !== "cancelled").sort((a, b) => a.date.localeCompare(b.date));
  const grouped: Record<string, CalendarEvent[]> = {};
  upcoming.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {sortedDates.length === 0 && <p className="text-muted-foreground text-sm text-center py-12">No events found.</p>}
      {sortedDates.map(dateStr => (
        <div key={dateStr}>
          <div className={`flex items-center gap-2 mb-2 ${dateStr < t ? "opacity-60" : ""}`}>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dateStr === t ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>{dateStr === t ? "TODAY" : fmt(dateStr)}</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="space-y-1.5 ml-2">
            {grouped[dateStr].map(e => (
              <button key={e.id} onClick={() => onSelect(e)} className={`w-full text-left flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${TYPE_COLOR[e.type] ?? TYPE_COLOR.other} hover:opacity-80`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[e.type] ?? "bg-slate-400"}`} />
                <span className="flex-1 truncate font-medium">{e.title}</span>
                {e.time && <span className="text-muted-foreground">{e.time}</span>}
                {e.projectTitle && <Badge variant="outline" className="text-[10px]">{e.projectTitle}</Badge>}
                <Badge variant="outline" className="text-[10px]">{e.status}</Badge>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

interface MasterCalendarProps {
  projectId?: string;
}

export function MasterCalendar({ projectId }: MasterCalendarProps) {
  const storedEvents = useCalendarEvents(projectId);
  const shootDays = useAppDataSlice("shootDays") ?? [];
  const projects = useAppDataSlice("projects") ?? [];

  // Filters
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("__all__");
  const [filterType, setFilterType] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");

  // Dialogs
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Combine stored events + shoot day overlays
  const allEventsRaw = useMemo(() => {
    const sdEvents: CalendarEvent[] = shootDays
      .filter(sd => !projectId || sd.projectId === projectId)
      .map(shootDayToEvent);
    return [...sdEvents, ...storedEvents];
  }, [storedEvents, shootDays, projectId]);

  // Apply filters
  const allEvents = useMemo(() => {
    return allEventsRaw.filter(e => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !(e.projectTitle ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterProject !== "__all__" && e.projectId !== filterProject) return false;
      if (filterType !== "__all__" && e.type !== filterType) return false;
      if (filterStatus !== "__all__" && e.status !== filterStatus) return false;
      return true;
    });
  }, [allEventsRaw, search, filterProject, filterType, filterStatus]);

  const handleSave = (data: Omit<CalendarEvent, "id" | "createdAt">) => {
    if (editEvent) {
      updateCalendarEvent(editEvent.id, data);
    } else {
      addCalendarEvent(data);
    }
    setEditEvent(null);
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    deleteCalendarEvent(id);
    setDeleteConfirm(null);
    setDetailEvent(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search events…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-48"
        />
        {!projectId && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            {EVENT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">{allEvents.length} events shown</span>
      </div>

      {/* Calendar tabs */}
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab allEvents={allEvents} />
        </TabsContent>
        <TabsContent value="month" className="mt-4">
          <MonthView allEvents={allEvents} onSelect={setDetailEvent} />
        </TabsContent>
        <TabsContent value="week" className="mt-4">
          <WeekView allEvents={allEvents} onSelect={setDetailEvent} />
        </TabsContent>
        <TabsContent value="day" className="mt-4">
          <DayView allEvents={allEvents} onSelect={setDetailEvent} />
        </TabsContent>
        <TabsContent value="agenda" className="mt-4">
          <AgendaView allEvents={allEvents} onSelect={setDetailEvent} />
        </TabsContent>
      </Tabs>

      {/* Event detail dialog */}
      {detailEvent && (
        <Dialog open onOpenChange={() => setDetailEvent(null)}>
          <EventDetailDialog
            event={detailEvent}
            shootDays={shootDays}
            onClose={() => setDetailEvent(null)}
            onEdit={e => { setEditEvent(e); setDetailEvent(null); }}
            onDelete={id => setDeleteConfirm(id)}
          />
        </Dialog>
      )}

      {/* Create/Edit dialog */}
      {(showCreate || editEvent) && (
        <Dialog open onOpenChange={() => { setShowCreate(false); setEditEvent(null); }}>
          <EventFormDialog
            initial={editEvent}
            projects={projects.map(p => ({ id: p.id, title: p.title }))}
            onSave={handleSave}
            onClose={() => { setShowCreate(false); setEditEvent(null); }}
          />
        </Dialog>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Event</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">This will permanently delete the event. This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
