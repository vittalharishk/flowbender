"use client";

import { useMemo, useState } from "react";
import { useAttendanceRecords, useCateringAdjustments, calcCateringCount } from "@/lib/attendance-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, FileCheck2, Plus, Printer, Search, Trash2 } from "lucide-react";
import { BackLink } from "@/components/app/back-link";
import {
  callSheetWorkflowOptions,
  createCallSheet,
  createCallSheetRevision,
  deleteCallSheet,
  duplicateCallSheet,
  updateCallSheet,
  useCallSheets,
} from "@/lib/call-sheet-store";
import { useAppDataSelector } from "@/lib/app-data-store";
import type { AppDataState } from "@/lib/app-data-store";
import type { CallSheet, CallSheetStatus, CallSheetWorkflow, CallSheetRow } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const statuses: CallSheetStatus[] = ["Draft", "Ready for Review", "Approved", "Published", "Revised", "Completed"];
const statusClass: Record<CallSheetStatus, string> = {
  Draft: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
  "Ready for Review": "border-amber-500/20 bg-amber-500/10 text-amber-400",
  Approved: "border-teal-500/20 bg-teal-500/10 text-teal-400",
  Published: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  Revised: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  Completed: "border-violet-500/20 bg-violet-500/10 text-violet-400",
};
const nowText = () => new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function workflowForType(type?: string): CallSheetWorkflow {
  if (type === "series") return "OTT / Web Series";
  if (type === "short-film") return "Short Film";
  if (type === "music-video") return "Music Video";
  return "Feature Film";
}

function normalizeSheet(sheet: CallSheet): CallSheet {
  return {
    ...sheet,
    version: sheet.version ?? 1,
    sceneIds: sheet.sceneIds ?? [],
    castAssignments: sheet.castAssignments ?? [],
    crewAssignments: sheet.crewAssignments ?? [],
    locationIds: sheet.locationIds ?? [],
    locations: sheet.locations ?? [],
    schedule: sheet.schedule ?? [],
    transport: sheet.transport ?? [],
    catering: sheet.catering ?? [],
    equipment: sheet.equipment ?? [],
    revisions: sheet.revisions ?? [],
    callTime: sheet.callTime ?? "05:30",
    firstShot: sheet.firstShot ?? "07:00",
    packUp: sheet.packUp ?? "18:30",
    projectImage: sheet.projectImage ?? null,
  };
}

export function CallSheetWorkspace(props: { detailId?: string; projectId?: string }) {
  return <CallSheetWorkspaceContent key={`${props.projectId ?? ""}:${props.detailId ?? ""}`} {...props} />;
}

function CallSheetWorkspaceContent({ detailId, projectId }: { detailId?: string; projectId?: string }) {
  const router = useRouter();
  const sheets = useCallSheets();
  const data = useAppDataSelector((state) => state);
  const [selectedId, setSelectedId] = useState(detailId ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [projectFilter, setProjectFilter] = useState(projectId ?? "all");
  const [preview, setPreview] = useState(false);
  const effectiveProjectId = projectId ?? (projectFilter === "all" ? undefined : projectFilter);
  const scopedSheets = sheets.filter((sheet) => !effectiveProjectId || sheet.projectId === effectiveProjectId);
  const selected = selectedId ? scopedSheets.find((sheet) => sheet.id === selectedId) : undefined;

  const filtered = useMemo(() => sheets.filter((sheet) => {
    if (effectiveProjectId && sheet.projectId !== effectiveProjectId) return false;
    const text = `${sheet.id} ${sheet.project} ${sheet.location} ${sheet.workflow} ${sheet.date}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === "all" || sheet.status === statusFilter) && (workflowFilter === "all" || sheet.workflow === workflowFilter);
  }), [sheets, query, statusFilter, workflowFilter, effectiveProjectId]);

  function create() {
    const project = data.projects.find((item) => item.id === effectiveProjectId);
    const day = data.shootDays.find((item) => item.projectId === project?.id);
    if (!project) { notify("Select a project before creating a call sheet."); return; }
    const sheet = createCallSheet({
      project: project.title, projectId: project.id, workflow: workflowForType(project.type),
      shootDay: day?.shootDayNumber ?? 1, shootDayId: day?.id, date: day?.date ?? new Date().toISOString().slice(0, 10),
      location: day?.location ?? "Location to be confirmed", locationIds: [], director: project.director,
      ad: "1st AD", cast: 0, crew: 0, notes: "", scenes: [], sceneIds: [],
      callTime: day?.callTime ?? "05:30", firstShot: "07:00", packUp: day?.wrapTime ?? "18:30",
      castAssignments: [], crewAssignments: [], schedule: [], locations: [], transport: [], catering: [], equipment: [],
      projectImage: project.posterImage ?? null,
    });
    setSelectedId(sheet.id); setToast(`${sheet.id} created as a draft.`);
  }
  function notify(message: string) { setToast(message); }

  if (selected) {
    return <div className="space-y-4">{toast && <p role="status" className="rounded border bg-muted p-3 text-sm print:hidden">{toast}</p>}<SheetEditor key={selected.id} sheet={normalizeSheet(selected)} data={data} initialPreview={preview} onBack={() => { setPreview(false); setSelectedId(""); if (detailId) router.push(projectId ? `/dashboard/projects/${projectId}/call-sheets` : "/call-sheets"); }} notify={notify} /></div>;
  }
  if (detailId && selectedId) return <div className="space-y-4"><p>Call sheet not found.</p><Link className="underline" href={projectId ? `/dashboard/projects/${projectId}/call-sheets` : "/call-sheets"}>Back to call sheets</Link></div>;
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {projectId ? <Link className="text-sm text-muted-foreground" href={`/dashboard/projects/${projectId}`}>← Back to project</Link> : <BackLink />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3"><FileCheck2 className="mt-1 h-8 w-8 text-amber-500" /><div><h1 className="text-2xl font-bold">Call Sheets</h1><p className="text-sm text-muted-foreground">Live, relationship-driven production documents.</p></div></div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">{!projectId && <select aria-label="Filter call sheets by project" className="min-w-0 flex-1 rounded-md border bg-background p-2 text-sm sm:w-52 sm:flex-none" value={projectFilter} onChange={(event) => { setProjectFilter(event.target.value); setSelectedId(""); }}><option value="all">All projects</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select>}<Button onClick={create} disabled={!effectiveProjectId} className="gap-2"><Plus className="h-4 w-4" /> Create Call Sheet</Button></div>
      </div>
      {toast && <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400"><CheckCircle2 className="mr-2 inline h-4 w-4" />{toast}</div>}
      {(() => {
        const today = new Date().toISOString().slice(0, 10);
        const upcoming = scopedSheets
          .filter(s => s.date >= today && (s.status === "Published" || s.status === "Ready for Review"))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);
        if (upcoming.length === 0) return null;
        return (
          <Card className="border-amber-500/20">
            <CardHeader><CardTitle className="text-sm text-amber-400">Upcoming Shoot Days</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map(s => (
                <button key={s.id} onClick={() => { setPreview(false); setSelectedId(s.id); }} className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/30 transition-colors">
                  <span>
                    <span className="font-medium">{s.project}</span>
                    <span className="ml-2 text-muted-foreground">Day {s.shootDay} · {dateLabel(s.date)}</span>
                  </span>
                  <Badge variant="outline" className={statusClass[s.status]}>{s.status}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        );
      })()}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{statuses.map((item) => <Card key={item}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{item}</p><p className="text-2xl font-semibold">{scopedSheets.filter((s) => s.status === item).length}</p></CardContent></Card>)}</div>
      <Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search number, project, episode, location…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select className="rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select><select className="rounded-md border bg-background px-3 text-sm" value={workflowFilter} onChange={(e) => setWorkflowFilter(e.target.value)}><option value="all">All workflows</option>{callSheetWorkflowOptions.map((s) => <option key={s}>{s}</option>)}</select></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Production call sheets</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[1100px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground">{["Call Sheet #", "Project", "Workflow", "Shoot Day", "Date", "Location", "Call Time", "First Shot", "Cast assigned", "Crew assigned", "Status", "Version", "Last Updated", "Actions"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
          <tbody>{filtered.map((raw) => { const sheet = normalizeSheet(raw); return <tr key={sheet.id} className="border-b last:border-0 hover:bg-muted/30">
            {[sheet.id, sheet.project, sheet.workflow, `Day ${sheet.shootDay}`, dateLabel(sheet.date), sheet.location, sheet.callTime, sheet.firstShot, sheet.castAssignments?.length ?? 0, sheet.crewAssignments?.length ?? 0].map((value, index) => <td key={index} className="px-4 py-3">{value}</td>)}
            <td className="px-4 py-3"><Badge variant="outline" className={statusClass[sheet.status]}>{sheet.status}</Badge></td><td className="px-4 py-3">V{sheet.version}</td><td className="px-4 py-3">{sheet.updated}</td>
            <td className="px-4 py-3"><div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setPreview(false); setSelectedId(sheet.id); }}>View / Edit</Button>
              <Button size="icon" variant="ghost" title="Duplicate" aria-label={`Duplicate ${sheet.id}`} onClick={() => { const copy = duplicateCallSheet(sheet.id); if (copy) notify(`${copy.id} duplicated.`); }}><Copy className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title="Print preview" aria-label={`Print preview ${sheet.id}`} onClick={() => { setPreview(true); setSelectedId(sheet.id); }}><Printer className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title="Delete" aria-label={`Delete ${sheet.id}`} onClick={() => { if (window.confirm(`Delete ${sheet.id}?`)) { deleteCallSheet(sheet.id); notify("Call sheet deleted."); } }}><Trash2 className="h-4 w-4" /></Button>
            </div></td></tr>; })}</tbody>
        </table>{filtered.length === 0 && <p className="p-10 text-center text-muted-foreground">No call sheets match your filters.</p>}
      </CardContent></Card>
    </div>
  );
}

type Data = AppDataState;
function SheetEditor({ sheet, data, onBack, notify, initialPreview }: { sheet: CallSheet; data: Data; onBack: () => void; notify: (message: string) => void; initialPreview: boolean }) {
  const [preview, setPreview] = useState(initialPreview);
  const project = data.projects.find((p) => p.id === sheet.projectId) ?? data.projects.find((p) => p.title === sheet.project);
  const shootDays = data.shootDays.filter((d) => d.projectId === project?.id);
  const scenes = data.scenes.filter((s) => s.projectId === project?.id);
  const cast = data.castMembers.filter((m) => m.projectId === project?.id);
  const crew = data.crewMembers.filter((m) => m.projectId === project?.id);
  const locations = data.locations.filter((l) => l.projectId === project?.id);
  const sceneRecords = scenes.filter((s) => sheet.sceneIds?.includes(s.id));
  const totalPages = sheet.scenes.reduce((sum, scene) => sum + scene.pages, 0);
  const attendanceRecords = useAttendanceRecords();
  const cateringAdjustments = useCateringAdjustments();
  const liveCatering = calcCateringCount(attendanceRecords, cateringAdjustments, sheet.projectId ?? "", sheet.date);
  const patch = (updates: Partial<CallSheet>) => updateCallSheet(sheet.id, { ...updates, updated: nowText() });
  const addRow = (key: "transport" | "catering" | "equipment" | "locations") => patch({ [key]: [...(sheet[key] ?? []), { id: `${key}-${Date.now()}`, Item: "", Notes: "" }] } as Partial<CallSheet>);
  const removeRow = (key: "transport" | "catering" | "equipment" | "locations", id: string) => patch({ [key]: (sheet[key] ?? []).filter((row) => row.id !== id) } as Partial<CallSheet>);
  const updateRow = (key: "transport" | "catering" | "equipment" | "locations", id: string, field: string, value: string) => patch({ [key]: (sheet[key] ?? []).map((row) => row.id === id ? { ...row, [field]: value } : row) } as Partial<CallSheet>);
  const toggleScene = (id: string) => {
    const ids = sheet.sceneIds?.includes(id) ? sheet.sceneIds.filter((item) => item !== id) : [...(sheet.sceneIds ?? []), id];
    const selected = scenes.filter((s) => ids.includes(s.id));
    patch({ sceneIds: ids, scenes: selected.map((s) => ({ number: s.sceneNumber, description: s.heading, setting: s.intExt, time: s.timeOfDay, pages: s.pages, characters: s.characters.join(", "), duration: s.estimatedDuration, status: "Scheduled", sourceId: s.id, location: s.location })) });
  };
  const syncCast = () => patch({ castAssignments: cast.filter((m) => sceneRecords.some((s) => s.characters.includes(m.character))).map((m) => sheet.castAssignments?.find((item) => item.castId === m.id) ?? ({ id: m.id, castId: m.id, name: m.name, character: m.character, status: "W", pickup: "", call: sheet.callTime ?? "06:00", makeup: "", costume: "", onSet: "", wrap: sheet.packUp ?? "18:30", transport: "", notes: "" })) });
  const transition = (next: CallSheetStatus) => { if (next === "Published" && (!project || !sheet.date || !sheet.shootDay || !sheet.location.trim() || sheet.location === "Location to be confirmed" || !sheet.callTime || !sheet.firstShot)) { notify("Complete required project, date, shoot day, call time, first shot, and confirmed location fields."); return; } patch({ status: next }); notify(next === "Published" ? "Published locally. No email, SMS, or WhatsApp was sent. Use Print / PDF to distribute this document." : `Call sheet ${next.toLowerCase()}.`); };
  const addRevision = () => { createCallSheetRevision(sheet.id, "Call sheet revision created"); notify("Revision created without destroying the prior version."); };
  return <div className="mx-auto max-w-[1600px] space-y-5 print:max-w-none">
    <div className="flex flex-wrap items-center gap-3 print:hidden"><Button variant="outline" onClick={() => setPreview(!preview)}>{preview ? "Back to editing" : "Document preview"}</Button><p className="text-xs text-muted-foreground">Saved in this app. Publishing does not send messages to recipients.</p></div>
    <div className={preview ? "" : "hidden print:block"}><CallSheetDocument sheet={sheet} />{preview && <div className="my-4 flex gap-2 print:hidden"><Button onClick={() => window.print()}>Print / Save PDF</Button><Button variant="outline" onClick={onBack}>All call sheets</Button></div>}</div>
    <div className={preview ? "hidden" : "space-y-5 print:hidden"}>
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Button variant="ghost" onClick={onBack}>← All call sheets</Button><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print / PDF</Button>{sheet.status === "Draft" && <Button onClick={() => transition("Ready for Review")}>Submit for Review</Button>}{sheet.status === "Ready for Review" && <Button onClick={() => transition("Approved")}>Approve</Button>}{sheet.status === "Approved" && <Button onClick={() => transition("Published")}>Publish</Button>}{sheet.status === "Published" && <Button variant="outline" onClick={addRevision}>Create Revision</Button>}{sheet.status === "Revised" && <Button onClick={() => transition("Published")}>Publish Revision</Button>}{sheet.status !== "Completed" && <Button variant="outline" onClick={() => transition("Completed")}>Mark Completed</Button>}</div></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="space-y-5 print:col-span-2">
        <Card className="overflow-hidden"><div className="bg-slate-950 p-6 text-white"><div className="flex justify-between gap-4"><div className="flex items-center gap-4">{sheet.projectImage && <img src={sheet.projectImage} alt="" className="h-16 w-12 rounded object-cover" />}<div><p className="text-xs uppercase tracking-[.25em] text-amber-300">{sheet.workflow} · {sheet.productionCompany ?? project?.productionHouse ?? "Production Company"}</p><h1 className="mt-2 text-3xl font-bold">{project?.title ?? sheet.project}</h1><p className="mt-2 text-slate-300">{sheet.id} · Shoot Day {sheet.shootDay} · {dateLabel(sheet.date)} · V{sheet.version ?? 1}</p></div></div><Badge className={statusClass[sheet.status]}>{sheet.status}</Badge></div></div><CardContent className="grid grid-cols-2 gap-3 p-5 md:grid-cols-6"><EditField label="General Call" value={sheet.callTime ?? ""} type="time" onChange={(v) => patch({ callTime: v })} required /><EditField label="First Shot" value={sheet.firstShot ?? ""} type="time" onChange={(v) => patch({ firstShot: v })} required /><EditField label="Pack Up" value={sheet.packUp ?? ""} type="time" onChange={(v) => patch({ packUp: v })} /><EditField label="Shoot Date" value={sheet.date} type="date" onChange={(v) => patch({ date: v })} required /><div><Label>Location</Label><select className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={sheet.location} onChange={(e) => patch({ location: e.target.value })}><option value="">Select location</option>{locations.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}<option value={sheet.location}>{sheet.location}</option></select></div><div><Label>Project</Label><p className="mt-2 font-medium">{project?.title ?? sheet.project}</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Project & shoot day information</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-4"><div><Label>Shoot day</Label><select className="mt-1 w-full rounded border bg-background p-2" value={sheet.shootDayId ?? ""} onChange={(e) => { const day = shootDays.find((d) => d.id === e.target.value); if (day) patch({ shootDayId: day.id, shootDay: day.shootDayNumber, date: day.date, location: day.location, callTime: day.callTime, packUp: day.wrapTime }); }}><option value="">Select shoot day</option>{shootDays.map((d) => <option key={d.id} value={d.id}>Day {d.shootDayNumber} · {d.date}</option>)}</select></div><Read label="Type" value={project?.type ?? sheet.workflow} /><Read label="Producer" value={project?.producer ?? sheet.producer ?? ""} /><Read label="Director" value={project?.director ?? sheet.director} /><Read label="Language" value={project?.language ?? sheet.language ?? ""} /><Read label="Genre" value={project?.genre ?? sheet.genre ?? ""} /><Read label="Day of week" value={new Date(`${sheet.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long" })} /><Read label="Production days" value={`${sheet.shootDay} of ${project?.totalShootDays ?? shootDays.length}`} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Weather & production notice</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3"><EditField label="Temperature / condition" value={sheet.weather?.temperature ?? ""} onChange={(v) => patch({ weather: { ...(sheet.weather ?? { high: "", low: "", condition: "", sunrise: "", sunset: "", rainChance: "", notes: "" }), temperature: v } })} /><EditField label="Rain chance" value={sheet.weather?.rainChance ?? ""} onChange={(v) => patch({ weather: { ...(sheet.weather ?? { temperature: "", high: "", low: "", condition: "", sunrise: "", sunset: "", notes: "" }), rainChance: v } })} /><EditField label="Production message" value={sheet.productionMessage?.message ?? ""} onChange={(v) => patch({ productionMessage: { message: v, priority: sheet.productionMessage?.priority ?? "Normal" } })} /></CardContent></Card>
        <Section title={`Scenes · ${sceneRecords.length} selected · ${totalPages} pages`}><div className="grid gap-2 md:grid-cols-2">{scenes.map((scene) => <label key={scene.id} className="flex cursor-pointer gap-2 rounded border p-3 text-sm"><input type="checkbox" checked={sheet.sceneIds?.includes(scene.id)} onChange={() => toggleScene(scene.id)} /><span><b>Scene {scene.sceneNumber}</b> · {scene.heading}<br /><span className="text-xs text-muted-foreground">{scene.intExt} / {scene.timeOfDay} · {scene.pages} pages · {scene.characters.join(", ")}</span></span></label>)}</div></Section>
        <EditableTable title={`Locations · ${(sheet.locations ?? []).length}`} rows={sheet.locations ?? []} fields={["Set Location", "Address", "Contact", "Parking", "Notes"]} onAdd={() => addRow("locations")} onDelete={(id) => removeRow("locations", id)} onChange={(id, f, v) => updateRow("locations", id, f, v)} />
        <Section title={`Cast · ${sheet.castAssignments?.length ?? 0}`} action={<Button size="sm" variant="outline" onClick={syncCast}>Sync required cast</Button>}>{(sheet.castAssignments ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Select scenes and sync cast from project relationships.</p> : <div className="space-y-2">{sheet.castAssignments?.map((item) => <div key={item.id} className="grid gap-2 rounded border p-3 md:grid-cols-5"><b>{item.name}<small className="block text-muted-foreground">{item.character}</small></b><Input placeholder="Status" value={item.status} onChange={(e) => patch({ castAssignments: sheet.castAssignments?.map((x) => x.id === item.id ? { ...x, status: e.target.value } : x) })} /><Input type="time" value={item.call} onChange={(e) => patch({ castAssignments: sheet.castAssignments?.map((x) => x.id === item.id ? { ...x, call: e.target.value } : x) })} /><Input placeholder="Makeup" value={item.makeup} onChange={(e) => patch({ castAssignments: sheet.castAssignments?.map((x) => x.id === item.id ? { ...x, makeup: e.target.value } : x) })} /><Input placeholder="Wrap" value={item.wrap} onChange={(e) => patch({ castAssignments: sheet.castAssignments?.map((x) => x.id === item.id ? { ...x, wrap: e.target.value } : x) })} /></div>)}</div>}</Section>
        <Section title={`Crew · ${sheet.crewAssignments?.length ?? 0}`} action={<Button size="sm" variant="outline" onClick={() => patch({ crewAssignments: crew.map((member) => sheet.crewAssignments?.find((assignment) => assignment.crewId === member.id) ?? ({ id: member.id, crewId: member.id, name: member.name, designation: member.role, department: member.department, callTime: sheet.callTime ?? "05:30", transport: "", phone: member.phone, notes: "" })) })}>Sync project crew</Button>}><div className="grid gap-2 md:grid-cols-2">{(sheet.crewAssignments ?? []).map((member) => <div key={member.id} className="rounded border p-3 text-sm"><b>{member.name}</b> · {member.designation}<div className="mt-2 flex gap-2"><Input aria-label={`Call time for ${member.name}`} type="time" value={member.callTime} onChange={(event) => patch({ crewAssignments: sheet.crewAssignments?.map((assignment) => assignment.id === member.id ? { ...assignment, callTime: event.target.value } : assignment) })} /><span className="text-muted-foreground">{member.department}</span></div></div>)}</div></Section>
        <Section title="Schedule"><EditableTable title="" rows={sheet.schedule ?? []} fields={["Start", "End", "Scene", "Description", "Location", "Notes"]} onAdd={() => patch({ schedule: [...(sheet.schedule ?? []), { id: `schedule-${Date.now()}`, Start: sheet.firstShot ?? "", End: "", Scene: "", Description: "", Location: sheet.location, Notes: "" }] })} onDelete={(id) => patch({ schedule: (sheet.schedule ?? []).filter((r) => r.id !== id) })} onChange={(id, f, v) => patch({ schedule: (sheet.schedule ?? []).map((r) => r.id === id ? { ...r, [f]: v } : r) })} /></Section>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader><CardTitle className="text-sm">Live Catering Set Count</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-card px-3 py-2"><p className="text-[11px] text-muted-foreground">Cast Meals</p><p className="text-xl font-bold text-emerald-400">{liveCatering.castCount}</p></div>
              <div className="rounded-lg border bg-card px-3 py-2"><p className="text-[11px] text-muted-foreground">Crew Meals</p><p className="text-xl font-bold text-blue-400">{liveCatering.crewCount}</p></div>
              <div className="rounded-lg border bg-card px-3 py-2"><p className="text-[11px] text-muted-foreground">Visitors</p><p className="text-xl font-bold text-violet-400">{liveCatering.visitorCount}</p></div>
              <div className="rounded-lg border bg-amber-500/20 px-3 py-2"><p className="text-[11px] text-muted-foreground">Total Set Count</p><p className="text-xl font-bold text-amber-400">{liveCatering.total}</p></div>
            </div>
            {liveCatering.adjustmentDelta !== 0 && <p className="mt-2 text-xs text-muted-foreground">Includes manual adjustment: {liveCatering.adjustmentDelta > 0 ? "+" : ""}{liveCatering.adjustmentDelta}</p>}
            <p className="mt-2 text-xs text-muted-foreground">Based on attendance records for {sheet.date}. Update in the Attendance module.</p>
          </CardContent>
        </Card>
        <div className="grid gap-5 md:grid-cols-2"><EditableTable title={`Transport · ${(sheet.transport ?? []).length}`} rows={sheet.transport ?? []} fields={["Vehicle", "Driver", "Pickup Time", "Passenger", "Status", "Notes"]} onAdd={() => addRow("transport")} onDelete={(id) => removeRow("transport", id)} onChange={(id, f, v) => updateRow("transport", id, f, v)} /><EditableTable title={`Catering · ${(sheet.catering ?? []).length}`} rows={sheet.catering ?? []} fields={["Meal", "Time", "Location", "Expected People", "Menu", "Status"]} onAdd={() => addRow("catering")} onDelete={(id) => removeRow("catering", id)} onChange={(id, f, v) => updateRow("catering", id, f, v)} /></div>
        <div className="grid gap-5 md:grid-cols-2"><EditableTable title={`Equipment · ${(sheet.equipment ?? []).length}`} rows={sheet.equipment ?? []} fields={["Equipment", "Category", "Quantity", "Responsible Person", "Status", "Notes"]} onAdd={() => addRow("equipment")} onDelete={(id) => removeRow("equipment", id)} onChange={(id, f, v) => updateRow("equipment", id, f, v)} /><Card className="border-red-500/30"><CardHeader><CardTitle>Safety / Emergency</CardTitle></CardHeader><CardContent><Textarea value={sheet.safety?.specialInstructions ?? ""} placeholder="Hospital, police, emergency contact, first aid, fire safety…" onChange={(e) => patch({ safety: { ...(sheet.safety ?? {}), specialInstructions: e.target.value } })} /></CardContent></Card></div>
      </div>
      <div className="space-y-5 print:hidden"><Card><CardHeader><CardTitle>Live preview</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><h2 className="text-xl font-bold">{project?.title ?? sheet.project}</h2><p>{dateLabel(sheet.date)} · Day {sheet.shootDay} · {sheet.location}</p><div className="grid grid-cols-2 gap-2"><Read label="General call" value={sheet.callTime ?? ""} /><Read label="First shot" value={sheet.firstShot ?? ""} /><Read label="Cast" value={sheet.castAssignments?.length ?? 0} /><Read label="Crew" value={sheet.crewAssignments?.length ?? 0} /><Read label="Scenes" value={sceneRecords.length || sheet.scenes.length} /><Read label="Pages" value={totalPages.toFixed(3)} /><Read label="Vehicles" value={sheet.transport?.length ?? 0} /><Read label="Equipment" value={sheet.equipment?.length ?? 0} /></div></CardContent></Card><Card><CardHeader><CardTitle>Special notes</CardTitle></CardHeader><CardContent><Textarea value={sheet.notes} placeholder="Director, AD, production, location and safety notes" onChange={(e) => patch({ notes: e.target.value })} /></CardContent></Card><Card><CardHeader><CardTitle>Version history</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>V{sheet.version ?? 1} · {sheet.status}</p>{sheet.revisions?.map((r) => <p key={r.version} className="border-t pt-2">V{r.version} · {r.reason}<br /><span className="text-xs text-muted-foreground">{r.date}</span></p>)}</CardContent></Card></div>
    </div>
    </div>
  </div>;
}

function Read({ label, value }: { label: string; value: string | number }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value === "" ? "—" : value}</p></div>; }
function EditField({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <div><Label>{label}{required && <span className="text-red-500"> *</span>}</Label><Input className="mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) { return <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">{title}</CardTitle>{action}</CardHeader><CardContent>{children}</CardContent></Card>; }
function EditableTable({ title, rows, fields, onAdd, onDelete, onChange }: { title: string; rows: CallSheetRow[]; fields: string[]; onAdd: () => void; onDelete: (id: string) => void; onChange: (id: string, field: string, value: string) => void }) { return <Section title={title} action={<Button size="sm" variant="outline" onClick={onAdd}><Plus className="mr-1 h-3 w-3" /> Add</Button>}>{rows.length === 0 ? <p className="text-sm text-muted-foreground">No entries yet.</p> : <div className="space-y-2">{rows.map((row) => <div key={row.id} className="grid gap-2 rounded border p-2 md:grid-cols-[repeat(3,minmax(0,1fr))_32px]">{fields.map((field) => <Input key={field} placeholder={field} value={String(row[field] ?? "")} onChange={(e) => onChange(row.id, field, e.target.value)} />)}<Button size="icon" variant="ghost" onClick={() => onDelete(row.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}</Section>; }

function CallSheetDocument({ sheet }: { sheet: CallSheet }) {
  return <article aria-label="Call sheet print preview" className="space-y-5 rounded border bg-white p-6 text-black print:border-0 print:p-0">
    <header className="border-b pb-4"><h1 className="text-2xl font-bold">{sheet.project}</h1><p>{sheet.id} · V{sheet.version} · {sheet.status}</p><p>{dateLabel(sheet.date)} · Day {sheet.shootDay} · {sheet.location}</p><p>General call: {sheet.callTime} · First shot: {sheet.firstShot} · Pack up: {sheet.packUp}</p></header>
    {sheet.productionMessage?.message && <p><b>Production notice:</b> {sheet.productionMessage.message}</p>}
    {sheet.weather && <p><b>Weather:</b> {sheet.weather.temperature} {sheet.weather.condition} · Rain: {sheet.weather.rainChance}</p>}
    <section><h2 className="font-bold">Scenes · {sheet.scenes.reduce((total, scene) => total + scene.pages, 0)} pages</h2>{sheet.scenes.length ? sheet.scenes.map((scene, index) => <p key={`${scene.number}:${index}`} className="border-b py-2">{scene.number} · {scene.description} · {scene.setting} / {scene.time} · {scene.pages} pages · {scene.characters}</p>) : <p>No scenes selected.</p>}</section>
    <section><h2 className="font-bold">Cast assignments</h2>{sheet.castAssignments?.map((member) => <p key={member.id} className="border-b py-2">{member.name} · {member.character} · Call: {member.call || "—"} · Makeup: {member.makeup || "—"} · Wrap: {member.wrap || "—"} · {member.notes}</p>)}{!sheet.castAssignments?.length && <p>No cast assignments.</p>}</section>
    <section><h2 className="font-bold">Crew assignments</h2>{sheet.crewAssignments?.map((member) => <p key={member.id} className="border-b py-2">{member.name} · {member.designation} · {member.department} · Call: {member.callTime || "—"} · {member.phone}</p>)}{!sheet.crewAssignments?.length && <p>No crew assignments.</p>}</section>
    {(["locations", "schedule", "transport", "catering", "equipment"] as const).map((key) => <section key={key}><h2 className="font-bold capitalize">{key}</h2>{sheet[key]?.map((row) => <p key={row.id} className="border-b py-2">{Object.entries(row).filter(([field, value]) => field !== "id" && value !== "").map(([field, value]) => `${field}: ${value}`).join(" · ")}</p>)}{!sheet[key]?.length && <p>No entries.</p>}</section>)}
    <section><h2 className="font-bold">Safety and emergency</h2><p className="whitespace-pre-wrap">{sheet.safety?.specialInstructions || "No instructions entered."}</p></section>
    <section><h2 className="font-bold">Special notes</h2><p className="whitespace-pre-wrap">{sheet.notes || "No special notes."}</p></section>
  </article>;
}
