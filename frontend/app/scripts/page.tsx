"use client";

import { useConfirm } from "@/components/app/confirm-dialog";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, Copy, FileText, Plus, Trash2 } from "lucide-react";
import { useProjects } from "@/lib/project-store";
import { archiveScript, createScript, deleteScript, duplicateScript, useScripts } from "@/lib/script-store";
import type { Script, ScriptStatus, ScriptType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "@/lib/persistence-bootstrap";

const types: ScriptType[] = ["Feature Film", "OTT Series", "OTT Episode", "TV Series", "TV Episode", "Short Film", "Music Video", "Other"];
// Main screenplays first, then most recently updated
const byMainThenRecent = (a: Script, b: Script) =>
  Number(!!b.isMain) - Number(!!a.isMain) || b.updatedAt.localeCompare(a.updatedAt);

const statuses: ScriptStatus[] = ["Concept", "First Draft", "Second Draft", "Revised Draft", "Production Draft", "Shooting Draft", "Locked", "Archived"];

export default function ScriptsPage() {
  const confirm = useConfirm();
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

  return <div className="space-y-5">
    <PageHeader
      as="h1"
      icon={FileText}
      title="Script Library"
      description="Manage screenplays, versions and production breakdowns."
      actions={
        <Button variant="primary" aria-expanded={showForm} onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> New Script
        </Button>
      }
    />
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
      <div className="relative flex-1"><SearchInput label="Search scripts" className="h-10 bg-muted/40" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, project or writer..." /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full bg-muted/40 sm:w-52"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
    </div>
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_90px_110px_140px] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"><span>Script</span><span>Type</span><span>Version</span><span>Scenes</span><span>Status</span><span>Actions</span></div>
      {filtered.length === 0 && <EmptyState icon={FileText} title="No scripts found" description={query || status !== "all" || projectFilter !== "all" ? "Try adjusting your search or filters." : "Create your first script to begin a breakdown."} />}
      {filtered.map((script) => <div key={script.id} className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[minmax(0,2fr)_1fr_1fr_90px_110px_140px] md:items-center md:gap-4">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={`/scripts/${script.id}`} className="font-medium hover:text-primary">{script.title}</Link>{script.isMain && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">Main</span>}</div><p className="truncate text-xs text-muted-foreground">{projects.find((p) => p.id === script.projectId)?.title ?? "Unassigned"} · {script.language}{script.writer && ` · ${script.writer}`}</p></div>
        <span className="text-sm text-muted-foreground">{script.type}</span><span className="text-sm">{script.draftName} v{script.draftNumber}</span><span className="text-sm">{script.scenes.length}</span><StatusBadge status={script.status} className="w-fit" />
        <div className="flex gap-1"><Button asChild size="sm" variant="outline"><Link href={`/scripts/${script.id}`}>Open</Link></Button><Button size="icon" variant="ghost" aria-label={`Duplicate ${script.title}`} title="Duplicate" onClick={() => duplicateScript(script.id)}><Copy className="h-4 w-4" aria-hidden="true" /></Button><Button size="icon" variant="ghost" aria-label={`Archive ${script.title}`} title="Archive" onClick={() => archiveScript(script.id)}><Archive className="h-4 w-4" aria-hidden="true" /></Button><Button size="icon" variant="ghost" aria-label={`Delete ${script.title}`} title="Delete" onClick={async () => { if (await confirm({ title: `Delete ${script.title}?`, description: "This cannot be undone.", confirmLabel: "Delete" })) deleteScript(script.id); }}><Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" /></Button></div>
      </div>)}
    </div>
  </div>;
}
