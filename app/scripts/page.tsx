"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, Copy, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useProjects } from "@/lib/project-store";
import { archiveScript, createScript, deleteScript, duplicateScript, useScripts } from "@/lib/script-store";
import type { Script, ScriptStatus, ScriptType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "@/lib/persistence-bootstrap";

const types: ScriptType[] = ["Feature Film", "OTT Series", "OTT Episode", "TV Series", "TV Episode", "Short Film", "Music Video", "Other"];
// Main screenplays first, then most recently updated
const byMainThenRecent = (a: Script, b: Script) =>
  Number(!!b.isMain) - Number(!!a.isMain) || b.updatedAt.localeCompare(a.updatedAt);

const statuses: ScriptStatus[] = ["Concept", "First Draft", "Second Draft", "Revised Draft", "Production Draft", "Shooting Draft", "Locked", "Archived"];

export default function ScriptsPage() {
  const scripts = useScripts();
  const projects = useProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<ScriptType>("Feature Film");
  const [language, setLanguage] = useState("English");
  const [writer, setWriter] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => scripts.filter((script) => {
    const haystack = `${script.title} ${script.writer} ${projects.find((p) => p.id === script.projectId)?.title ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) &&
      (status === "all" || script.status === status) &&
      (projectFilter === "all" || script.projectId === projectFilter);
  }).sort(byMainThenRecent), [scripts, projects, query, status, projectFilter]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !projectId) { setError("Script title and project are required."); return; }
    const script = createScript({ title, projectId, type, language, writer });
    setTitle(""); setWriter(""); setError(""); setShowForm(false);
    window.location.assign(`/scripts/${script.id}`);
  }

  return <div className="mx-auto max-w-[1400px] space-y-5">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="text-2xl font-bold">Script Library</h1><p className="mt-1 text-sm text-muted-foreground">Manage screenplays, versions and production breakdowns.</p></div>
      <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> New Script</Button>
    </header>
    {showForm && <form onSubmit={submit} className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Create script</h2><span className="text-xs text-muted-foreground">Required fields marked *</span></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2"><Label>Script title *</Label><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mana Hyderabad" /></div>
        <div><Label>Project *</Label><Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Script type</Label><Select value={type} onValueChange={(value) => setType(value as ScriptType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{types.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Language</Label><Input value={language} onChange={(e) => setLanguage(e.target.value)} /></div>
        <div><Label>Writer</Label><Input value={writer} onChange={(e) => setWriter(e.target.value)} placeholder="Writer name" /></div>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex gap-2"><Button type="submit">Save & open</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
    </form>}
    <div className="flex flex-col gap-3 sm:flex-row">
      <Select value={projectFilter} onValueChange={(value) => { setProjectFilter(value); if (value !== "all") setProjectId(value); }}><SelectTrigger className="w-full bg-muted/40 sm:w-60"><SelectValue placeholder="All projects" /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}</SelectContent></Select>
      <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="bg-muted/40 pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, project or writer..." /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full bg-muted/40 sm:w-52"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
    </div>
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_90px_110px_140px] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"><span>Script</span><span>Type</span><span>Version</span><span>Scenes</span><span>Status</span><span>Actions</span></div>
      {filtered.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground"><FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />No scripts found. Create your first script to begin a breakdown.</div>}
      {filtered.map((script) => <div key={script.id} className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[minmax(0,2fr)_1fr_1fr_90px_110px_140px] md:items-center md:gap-4">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={`/scripts/${script.id}`} className="font-medium hover:text-primary">{script.title}</Link>{script.isMain && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">Main</span>}</div><p className="truncate text-xs text-muted-foreground">{projects.find((p) => p.id === script.projectId)?.title ?? "Unassigned"} · {script.language}{script.writer && ` · ${script.writer}`}</p></div>
        <span className="text-sm text-muted-foreground">{script.type}</span><span className="text-sm">{script.draftName} v{script.draftNumber}</span><span className="text-sm">{script.scenes.length}</span><span className="w-fit rounded-full bg-muted px-2 py-1 text-xs">{script.status}</span>
        <div className="flex gap-1"><Button asChild size="sm" variant="outline"><Link href={`/scripts/${script.id}`}>Open</Link></Button><Button size="icon" variant="ghost" title="Duplicate" onClick={() => duplicateScript(script.id)}><Copy className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Archive" onClick={() => archiveScript(script.id)}><Archive className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Delete" onClick={() => window.confirm(`Delete ${script.title}? This cannot be undone.`) && deleteScript(script.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
      </div>)}
    </div>
  </div>;
}
