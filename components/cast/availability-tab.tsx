"use client";

import { useState, useMemo } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Camera, AlertTriangle,
  CheckCircle2, Clock, XCircle, User, Plus, Edit2, List,
  LayoutGrid, Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/lib/project-store";
import { useCastMembers } from "@/lib/cast-store";
import { useShootDays } from "@/lib/schedule-store";
import {
  useArtistAvailability,
  setArtistAvailability,
} from "@/lib/casting-store";
import type { ArtistAvailabilityState, CastMember, ShootDay } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type AvailState = ArtistAvailabilityState | "unknown";

interface ConflictEntry {
  castId: string;
  name: string;
  date: string;
  projectTitle: string;
  type: "hard" | "soft" | "overlap";
  state: AvailState;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATE_LABELS: Record<AvailState, string> = {
  confirmed:   "Confirmed",
  available:   "Available",
  tentative:   "Tentative",
  unavailable: "Unavailable",
  unknown:     "Unknown",
};

const STATE_COLORS: Record<AvailState, string> = {
  confirmed:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  available:   "bg-lime-500/10 text-lime-400 border-lime-500/20",
  tentative:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  unavailable: "bg-red-500/10 text-red-400 border-red-500/20",
  unknown:     "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const STATE_DOT: Record<AvailState, string> = {
  confirmed:   "bg-emerald-400",
  available:   "bg-lime-400",
  tentative:   "bg-amber-400",
  unavailable: "bg-red-400",
  unknown:     "bg-slate-500",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string { return new Date().toISOString().slice(0,10); }

function isoDate(d: Date): string { return d.toISOString().slice(0,10); }

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = new Date(start), e = new Date(end);
  const cur = new Date(s);
  while (cur <= e) { dates.push(isoDate(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

// ── StateBadge ────────────────────────────────────────────────────────────────

function StateBadge({ state, small }: { state: AvailState; small?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${small ? "text-[10px]" : "text-xs"} ${STATE_COLORS[state]}`}>
      {STATE_LABELS[state]}
    </span>
  );
}

// ── Add/Edit Availability Dialog ──────────────────────────────────────────────

interface AddAvailDialogProps {
  castMembers: CastMember[];
  preselectedCastId?: string;
  onClose: () => void;
}

function AddAvailDialog({ castMembers, preselectedCastId, onClose }: AddAvailDialogProps) {
  const [castId, setCastId] = useState(preselectedCastId ?? castMembers[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [state, setState] = useState<ArtistAvailabilityState>("available");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!castId) { setError("Select an artist."); return; }
    if (!startDate || !endDate) { setError("Enter date range."); return; }
    if (endDate < startDate) { setError("End date must be after start date."); return; }
    const dates = datesInRange(startDate, endDate);
    if (dates.length > 90) { setError("Date range too large. Max 90 days at once."); return; }
    setSaving(true);
    for (const d of dates) {
      setArtistAvailability(castId, d, state, note.trim());
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card border shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="border-b px-5 py-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold">Set Availability</h2>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div>
            <Label>Artist *</Label>
            <Select value={castId} onValueChange={setCastId}>
              <SelectTrigger><SelectValue placeholder="Select artist" /></SelectTrigger>
              <SelectContent>
                {castMembers.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.projectTitle})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date *</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date *</Label>
              <Input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={state} onValueChange={v => setState(v as ArtistAvailabilityState)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="tentative">Tentative</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note / reason</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Other project, personal, confirmed shoot..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              Save availability
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
          {startDate && endDate && endDate >= startDate && (
            <p className="text-xs text-muted-foreground">
              Will set {datesInRange(startDate, endDate).length} date(s) to <strong>{STATE_LABELS[state]}</strong>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({
  castMembers, shootDays, availMap, conflicts, projectId,
  onAddAvail,
}: {
  castMembers: CastMember[];
  shootDays: ShootDay[];
  availMap: Map<string, AvailState>; // key: castId|date
  conflicts: ConflictEntry[];
  projectId?: string;
  onAddAvail: () => void;
}) {
  const todayStr = today();
  const in14 = addDays(todayStr, 14);

  const upcoming = useMemo(() => {
    return shootDays
      .filter(sd => sd.date >= todayStr && sd.date <= in14 && (!projectId || sd.projectId === projectId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .flatMap(sd =>
        (sd.castRequired ?? []).map(name => {
          const member = castMembers.find(m => m.name === name);
          const state: AvailState = member
            ? (availMap.get(`${member.id}|${sd.date}`) ?? "unknown")
            : "unknown";
          return { sd, name, member, state };
        })
      );
  }, [shootDays, castMembers, availMap, todayStr, in14, projectId]);

  const countByState = useMemo(() => {
    const counts: Record<AvailState, Set<string>> = {
      confirmed: new Set(), available: new Set(), tentative: new Set(),
      unavailable: new Set(), unknown: new Set(),
    };
    const seen = new Set<string>();
    castMembers.forEach(m => {
      const states = Array.from(availMap.entries())
        .filter(([k]) => k.startsWith(`${m.id}|`))
        .map(([, v]) => v);
      if (states.length === 0) { counts.unknown.add(m.id); return; }
      if (states.includes("confirmed")) counts.confirmed.add(m.id);
      else if (states.includes("available")) counts.available.add(m.id);
      else if (states.includes("tentative")) counts.tentative.add(m.id);
      else counts.unavailable.add(m.id);
    });
    return counts;
  }, [castMembers, availMap]);

  const conflictArtistIds = new Set(conflicts.map(c => c.castId));

  const stats = [
    { label: "Total Artists", value: castMembers.length, color: "text-foreground" },
    { label: "Confirmed", value: countByState.confirmed.size, color: "text-emerald-400" },
    { label: "Available", value: countByState.available.size, color: "text-lime-400" },
    { label: "Tentative", value: countByState.tentative.size, color: "text-amber-400" },
    { label: "Unavailable", value: countByState.unavailable.size, color: "text-red-400" },
    { label: "With Conflicts", value: conflictArtistIds.size, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Upcoming commitments */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">Upcoming Shooting Commitments (14 days)</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No shoots in the next 14 days.</p>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {upcoming.slice(0, 30).map((u, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.sd.projectTitle} · {u.sd.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">{u.sd.date}</p>
                    <StateBadge state={u.state} small />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conflicts */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h3 className="font-semibold text-sm">Scheduling Conflicts</h3>
          </div>
          {conflicts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No conflicts detected.</p>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {conflicts.slice(0, 30).map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${c.type === "hard" ? "bg-red-400" : c.type === "overlap" ? "bg-orange-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.type === "hard" ? "Unavailable" : c.type === "overlap" ? "Overlap" : "Tentative"} — {c.projectTitle}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{c.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" onClick={onAddAvail}>
          <Plus className="w-4 h-4" /> Set Availability
        </Button>
      </div>
    </div>
  );
}

// ── Monthly Calendar View ─────────────────────────────────────────────────────

function CalendarView({
  castMembers, shootDays, availMap, projectId,
}: {
  castMembers: CastMember[];
  shootDays: ShootDay[];
  availMap: Map<string, AvailState>;
  projectId?: string;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterArtist, setFilterArtist] = useState("all");
  const [filterProject, setFilterProject] = useState(projectId ?? "all");

  function prevMonth() { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const shootDaySet = useMemo(() => {
    const map = new Map<string, ShootDay[]>();
    shootDays
      .filter(sd => (!projectId || sd.projectId === projectId) && (filterProject === "all" || sd.projectId === filterProject))
      .forEach(sd => {
        const list = map.get(sd.date) ?? [];
        list.push(sd);
        map.set(sd.date, list);
      });
    return map;
  }, [shootDays, projectId, filterProject]);

  function getCellStates(dateStr: string): AvailState[] {
    const members = filterArtist !== "all"
      ? castMembers.filter(m => m.id === filterArtist)
      : castMembers.filter(m => !projectId || m.projectId === projectId);
    return members.map(m => availMap.get(`${m.id}|${dateStr}`) ?? "unknown");
  }

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    const sds = shootDaySet.get(selectedDate) ?? [];
    const artistData = castMembers
      .filter(m => !projectId || m.projectId === projectId)
      .map(m => ({
        member: m,
        state: availMap.get(`${m.id}|${selectedDate}`) ?? "unknown" as AvailState,
        shooting: sds.some(sd => (sd.castRequired ?? []).includes(m.name)),
      }));
    return { sds, artistData };
  }, [selectedDate, shootDaySet, castMembers, availMap, projectId]);

  const uniqueProjects = useMemo(() => {
    const seen = new Map<string, string>();
    shootDays.forEach(sd => seen.set(sd.projectId, sd.projectTitle));
    return Array.from(seen.entries());
  }, [shootDays]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterArtist} onValueChange={setFilterArtist}>
          <SelectTrigger className="w-44 bg-muted/40"><SelectValue placeholder="All artists" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All artists</SelectItem>
            {castMembers.filter(m => !projectId || m.projectId === projectId).map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!projectId && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-52 bg-muted/40"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {uniqueProjects.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {/* Legend */}
        <div className="flex flex-wrap gap-3 ml-auto text-xs">
          {(Object.keys(STATE_DOT) as AvailState[]).map(s => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${STATE_DOT[s]}`} />
              {STATE_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      <div className={`grid gap-5 ${selectedDate ? "lg:grid-cols-[1fr_300px]" : ""}`}>
        {/* Calendar grid */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-muted">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-muted">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {/* Day labels */}
          <div className="grid grid-cols-7 border-b">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-border/30 bg-muted/10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const states = getCellStates(dateStr);
              const isShootDay = shootDaySet.has(dateStr);
              const isToday = dateStr === today();
              const isSelected = dateStr === selectedDate;
              const col = (firstDay + i) % 7;
              const isLastInRow = col === 6;
              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(d => d === dateStr ? null : dateStr)}
                  className={`min-h-[72px] p-1.5 border-b cursor-pointer transition-colors ${isLastInRow ? "" : "border-r"} border-border/30 ${isSelected ? "bg-amber-500/10" : "hover:bg-muted/30"}`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-amber-500 text-white" : "text-foreground"}`}>
                    {day}
                  </div>
                  {isShootDay && (
                    <div className="mb-1">
                      <Camera className="w-3 h-3 text-amber-500" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from(new Set(states)).filter(s => s !== "unknown").slice(0, 5).map((s, si) => (
                      <span key={si} className={`w-2 h-2 rounded-full ${STATE_DOT[s]}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day panel */}
        {selectedDate && selectedDayData && (
          <div className="rounded-xl border bg-card overflow-hidden max-h-[500px] overflow-y-auto">
            <div className="border-b px-4 py-3">
              <h4 className="font-semibold text-sm">{selectedDate}</h4>
              {selectedDayData.sds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDayData.sds.length} shoot day(s) · {selectedDayData.sds.map(s => s.location).join(", ")}
                </p>
              )}
            </div>
            <div className="divide-y">
              {selectedDayData.artistData.map(({ member, state, shooting }) => (
                <div key={member.id} className="flex items-center gap-3 px-4 py-2.5">
                  {shooting && <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  {!shooting && <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.character}</p>
                  </div>
                  <StateBadge state={state} small />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Weekly View ────────────────────────────────────────────────────────────────

function WeeklyView({
  castMembers, shootDays, availMap, projectId,
}: {
  castMembers: CastMember[];
  shootDays: ShootDay[];
  availMap: Map<string, AvailState>;
  projectId?: string;
}) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = startOfWeek(new Date());
    return isoDate(d);
  });

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const shootSet = useMemo(() => {
    const map = new Map<string, Set<string>>(); // date → Set<castMemberName>
    shootDays.filter(sd => !projectId || sd.projectId === projectId).forEach(sd => {
      const names = sd.castRequired ?? [];
      const existing = map.get(sd.date) ?? new Set<string>();
      names.forEach(n => existing.add(n));
      map.set(sd.date, existing);
    });
    return map;
  }, [shootDays, projectId]);

  const filteredMembers = projectId
    ? castMembers.filter(m => m.projectId === projectId)
    : castMembers;

  return (
    <div className="space-y-3">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <button onClick={prevWeek} className="rounded-lg p-1.5 hover:bg-muted border">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">
          {weekDates[0]} — {weekDates[6]}
        </span>
        <button onClick={nextWeek} className="rounded-lg p-1.5 hover:bg-muted border">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="border-b">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-36">Artist</th>
              {weekDates.map(d => {
                const isToday = d === today();
                const dow = new Date(d).getDay();
                return (
                  <th key={d} className={`px-2 py-2 font-medium text-center ${isToday ? "text-amber-500" : "text-muted-foreground"}`}>
                    <div>{DAYS_OF_WEEK[dow]}</div>
                    <div className={`text-[10px] ${isToday ? "text-amber-400" : "text-muted-foreground/60"}`}>{d.slice(5)}</div>
                    {shootSet.has(d) && <Camera className="w-3 h-3 mx-auto mt-0.5 text-amber-500/60" />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(m => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 font-medium truncate max-w-[140px]">{m.name}</td>
                {weekDates.map(d => {
                  const state = availMap.get(`${m.id}|${d}`) ?? "unknown" as AvailState;
                  const isShoot = shootSet.get(d)?.has(m.name) ?? false;
                  return (
                    <td key={d} className="px-1 py-1.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`rounded-full px-1.5 py-0.5 border text-[10px] ${STATE_COLORS[state]}`}>
                          {STATE_LABELS[state].slice(0, 4)}
                        </span>
                        {isShoot && <Camera className="w-2.5 h-2.5 text-amber-500" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Artist View ────────────────────────────────────────────────────────────────

function ArtistView({
  castMembers, availMap, allAvail, projectId, onAddForArtist,
}: {
  castMembers: CastMember[];
  availMap: Map<string, AvailState>;
  allAvail: Array<{ id: string; castId: string; date: string; state: ArtistAvailabilityState; note: string }>;
  projectId?: string;
  onAddForArtist: (castId: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = projectId ? castMembers.filter(m => m.projectId === projectId) : castMembers;

  function getArtistSummary(m: CastMember): { dominant: AvailState; count: number } {
    const entries = allAvail.filter(a => a.castId === m.id);
    if (entries.length === 0) return { dominant: "unknown", count: 0 };
    const prio: AvailState[] = ["confirmed","available","tentative","unavailable","unknown"];
    for (const s of prio) {
      if (entries.some(e => e.state === s)) return { dominant: s, count: entries.length };
    }
    return { dominant: "unknown", count: entries.length };
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          onClick={() => onAddForArtist("")}>
          <Plus className="w-3.5 h-3.5" /> Set Availability
        </Button>
      </div>
      {filtered.map(m => {
        const { dominant, count } = getArtistSummary(m);
        const isOpen = expanded === m.id;
        const history = allAvail.filter(a => a.castId === m.id).sort((a,b) => a.date.localeCompare(b.date));
        return (
          <div key={m.id} className="rounded-xl border bg-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpanded(isOpen ? null : m.id)}
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATE_DOT[dominant]}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground truncate">{m.character} · {m.projectTitle}</p>
              </div>
              <StateBadge state={dominant} small />
              <span className="text-xs text-muted-foreground">{count} entries</span>
              <button
                className="rounded-lg p-1.5 hover:bg-muted text-amber-500"
                onClick={e => { e.stopPropagation(); onAddForArtist(m.id); }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isOpen && (
              <div className="border-t px-4 py-3 space-y-2 bg-muted/5">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No availability records yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {history.map(a => (
                      <div key={a.id} className="flex items-center gap-3 text-sm">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATE_DOT[a.state]}`} />
                        <span className="font-mono text-xs text-muted-foreground w-24 shrink-0">{a.date}</span>
                        <StateBadge state={a.state} small />
                        {a.note && <span className="text-xs text-muted-foreground truncate">{a.note}</span>}
                        <button
                          className="ml-auto rounded p-1 hover:bg-muted text-amber-500 shrink-0"
                          onClick={() => setArtistAvailability(m.id, a.date, a.state, a.note)}
                          title="Re-confirm (click to refresh)"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Project View ────────────────────────────────────────────────────────────────

function ProjectView({
  castMembers, shootDays, availMap, projectId,
}: {
  castMembers: CastMember[];
  shootDays: ShootDay[];
  availMap: Map<string, AvailState>;
  projectId?: string;
}) {
  const byProject = useMemo(() => {
    const map = new Map<string, { title: string; days: ShootDay[] }>();
    const filtered = projectId ? shootDays.filter(sd => sd.projectId === projectId) : shootDays;
    filtered.sort((a,b) => a.date.localeCompare(b.date)).forEach(sd => {
      const existing = map.get(sd.projectId) ?? { title: sd.projectTitle, days: [] };
      existing.days.push(sd);
      map.set(sd.projectId, existing);
    });
    return map;
  }, [shootDays, projectId]);

  return (
    <div className="space-y-5">
      {Array.from(byProject.entries()).map(([pid, { title, days }]) => (
        <div key={pid} className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">{title}</h3>
            <span className="text-xs text-muted-foreground ml-auto">{days.length} shoot days</span>
          </div>
          <div className="divide-y">
            {days.map(sd => {
              const required = (sd.castRequired ?? []).map(name => {
                const member = castMembers.find(m => m.name === name);
                const state: AvailState = member
                  ? (availMap.get(`${member.id}|${sd.date}`) ?? "unknown")
                  : "unknown";
                const hasConflict = state === "unavailable" || state === "tentative";
                return { name, member, state, hasConflict };
              });
              const hasAnyConflict = required.some(r => r.hasConflict);
              return (
                <div key={sd.id} className={`px-4 py-3 ${hasAnyConflict ? "bg-orange-500/5" : ""}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <span className="font-medium text-sm">{sd.date}</span>
                      <span className="text-xs text-muted-foreground ml-2">Day {sd.shootDayNumber} · {sd.location}</span>
                    </div>
                    {hasAnyConflict && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-orange-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> Conflict
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {required.map((r, i) => (
                      <div key={i} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 ${STATE_COLORS[r.state]}`}>
                        {r.state === "unavailable" && <XCircle className="w-3 h-3" />}
                        {r.state === "tentative" && <Clock className="w-3 h-3" />}
                        {r.state === "confirmed" && <CheckCircle2 className="w-3 h-3" />}
                        <span className="text-xs font-medium">{r.name}</span>
                        <span className="text-[10px] opacity-70">({STATE_LABELS[r.state]})</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main AvailabilityTab
// ══════════════════════════════════════════════════════════════════════════════

type SubView = "dashboard" | "calendar" | "weekly" | "artist" | "project";

const SUB_TABS: { id: SubView; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { id: "calendar",  label: "Monthly",   icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: "weekly",    label: "Weekly",    icon: <List className="w-3.5 h-3.5" /> },
  { id: "artist",    label: "By Artist", icon: <User className="w-3.5 h-3.5" /> },
  { id: "project",   label: "By Project",icon: <Film className="w-3.5 h-3.5" /> },
];

interface AvailabilityTabProps {
  projectId?: string;
}

export function AvailabilityTab({ projectId }: AvailabilityTabProps) {
  const [view, setView] = useState<SubView>("dashboard");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForCastId, setAddForCastId] = useState<string | undefined>(undefined);

  const allCastMembers = useCastMembers();
  const allShootDays = useShootDays();
  const allAvail = useArtistAvailability() as Array<{ id: string; castId: string; date: string; state: ArtistAvailabilityState; note: string }>;

  // Scope to project if provided
  const castMembers = useMemo(
    () => projectId ? allCastMembers.filter(m => m.projectId === projectId) : allCastMembers,
    [allCastMembers, projectId]
  );
  const shootDays = useMemo(
    () => projectId ? allShootDays.filter(sd => sd.projectId === projectId) : allShootDays,
    [allShootDays, projectId]
  );

  // Build availMap: "castId|date" → state
  const availMap = useMemo(() => {
    const map = new Map<string, AvailState>();
    allAvail.forEach(a => map.set(`${a.castId}|${a.date}`, a.state as AvailState));
    return map;
  }, [allAvail]);

  // Conflict detection
  const conflicts = useMemo((): ConflictEntry[] => {
    const result: ConflictEntry[] = [];
    const artistDateProjects = new Map<string, string[]>(); // "castId|date" → projectIds

    shootDays.forEach(sd => {
      (sd.castRequired ?? []).forEach(name => {
        const member = castMembers.find(m => m.name === name);
        if (!member) return;
        const key = `${member.id}|${sd.date}`;
        const state = availMap.get(key) ?? "unknown";

        if (state === "unavailable") {
          result.push({ castId: member.id, name, date: sd.date, projectTitle: sd.projectTitle, type: "hard", state });
        } else if (state === "tentative") {
          result.push({ castId: member.id, name, date: sd.date, projectTitle: sd.projectTitle, type: "soft", state });
        }

        // Track overlap
        const existing = artistDateProjects.get(key) ?? [];
        existing.push(sd.projectId);
        artistDateProjects.set(key, existing);
      });
    });

    // Overlap conflicts (artist needed in 2+ projects same day)
    artistDateProjects.forEach((projectIds, key) => {
      if (new Set(projectIds).size > 1) {
        const [castId, date] = key.split("|");
        const member = castMembers.find(m => m.id === castId);
        if (member && !result.some(r => r.castId === castId && r.date === date && r.type === "overlap")) {
          result.push({
            castId, name: member.name, date,
            projectTitle: "Multiple projects",
            type: "overlap",
            state: availMap.get(key) ?? "unknown",
          });
        }
      }
    });

    return result.sort((a,b) => a.date.localeCompare(b.date));
  }, [shootDays, castMembers, availMap]);

  function openAddDialog(castId?: string) {
    setAddForCastId(castId || undefined);
    setAddDialogOpen(true);
  }

  return (
    <div className="space-y-5">
      {/* Sub-tab bar */}
      <div className="flex gap-1 flex-wrap">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === t.id
                ? "bg-amber-500/10 text-amber-500"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Views */}
      {view === "dashboard" && (
        <DashboardView
          castMembers={castMembers}
          shootDays={shootDays}
          availMap={availMap}
          conflicts={conflicts}
          projectId={projectId}
          onAddAvail={() => openAddDialog()}
        />
      )}
      {view === "calendar" && (
        <CalendarView
          castMembers={castMembers}
          shootDays={shootDays}
          availMap={availMap}
          projectId={projectId}
        />
      )}
      {view === "weekly" && (
        <WeeklyView
          castMembers={castMembers}
          shootDays={shootDays}
          availMap={availMap}
          projectId={projectId}
        />
      )}
      {view === "artist" && (
        <ArtistView
          castMembers={castMembers}
          availMap={availMap}
          allAvail={allAvail}
          projectId={projectId}
          onAddForArtist={openAddDialog}
        />
      )}
      {view === "project" && (
        <ProjectView
          castMembers={castMembers}
          shootDays={shootDays}
          availMap={availMap}
          projectId={projectId}
        />
      )}

      {/* Add dialog */}
      {addDialogOpen && (
        <AddAvailDialog
          castMembers={castMembers.length > 0 ? castMembers : allCastMembers}
          preselectedCastId={addForCastId}
          onClose={() => { setAddDialogOpen(false); setAddForCastId(undefined); }}
        />
      )}
    </div>
  );
}
