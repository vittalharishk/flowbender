"use client";

// Generic add / edit / delete control for any data section.
// The form is built from the fields the section's records already have, so
// every field stays editable without a hand-written form per module.
import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getModuleSlice, updateModuleSlice, useModuleSlice } from "@/lib/module-store";
import { getAppDataSlice, updateAppDataSlice, useAppDataSlice, type AppDataCollectionKey } from "@/lib/app-data-store";
import { useProjects, useSelectedProjectId } from "@/lib/project-store";
import { uploadFile } from "@/lib/file-upload";

type Row = Record<string, unknown> & { id: string };
type Kind = "file" | "text" | "textarea" | "number" | "boolean" | "date" | "select" | "project" | "list" | "json";
type Field = { key: string; kind: Kind; options?: string[] };

const HIDDEN = new Set(["id", "createdAt", "updatedAt", "ownerAccount", "isDemo", "projectTitle"]);
const ENUM_KEY = /(status|type|category|stage|priority|kind|platform|format|mode|channel|tier|level|method|frequency|currency)$/i;
const LONG_KEY = /(notes|description|summary|remarks|comment|terms|synopsis|details|reason)$/i;
// Text fields that hold a file: they get an Upload button (file goes to /api/files).
const FILE_KEY = /(image|photo|poster|logo|thumbnail|banner|avatar|cover|file|document|attachment|pdf|scan|receipt|proof|artwork|fileLocation|fileReference|url|link)$/i;
const LABEL_KEYS = ["title", "name", "campaignName", "language", "invoiceNumber", "character", "description", "label"];

function humanize(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function inferFields(rows: Row[]): Field[] {
  const keys: string[] = [];
  rows.forEach((r) => Object.keys(r).forEach((k) => !HIDDEN.has(k) && !keys.includes(k) && keys.push(k)));
  return keys.map((key) => {
    if (key === "projectId") return { key, kind: "project" as Kind };
    const values = rows.map((r) => r[key]).filter((v) => v !== undefined && v !== null && v !== "");
    const sample = values[0];
    if (typeof sample === "boolean") return { key, kind: "boolean" as Kind };
    if (typeof sample === "number") return { key, kind: "number" as Kind };
    if (Array.isArray(sample)) return { key, kind: (sample.every((v) => typeof v !== "object") ? "list" : "json") as Kind };
    if (sample && typeof sample === "object") return { key, kind: "json" as Kind };
    if (typeof sample === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sample)) return { key, kind: "date" as Kind };
    const distinct = Array.from(new Set(values.map(String)));
    if (ENUM_KEY.test(key) && distinct.length > 0 && distinct.length <= 12) return { key, kind: "select" as Kind, options: distinct };
    if (FILE_KEY.test(key) || (typeof sample === "string" && /^(data:|\/api\/files\/|https?:\/\/)/.test(sample))) return { key, kind: "file" as Kind };
    if (LONG_KEY.test(key) || (typeof sample === "string" && sample.length > 80)) return { key, kind: "textarea" as Kind };
    return { key, kind: "text" as Kind };
  });
}

function rowLabel(r: Row) {
  for (const k of LABEL_KEYS) if (typeof r[k] === "string" && r[k]) return String(r[k]).slice(0, 70);
  return r.id;
}

function toDraft(fields: Field[], r: Partial<Row>): Record<string, string | boolean> {
  const d: Record<string, string | boolean> = {};
  fields.forEach(({ key, kind }) => {
    const v = r[key];
    if (kind === "boolean") d[key] = Boolean(v);
    else if (kind === "list") d[key] = Array.isArray(v) ? v.join(", ") : "";
    else if (kind === "json") d[key] = v === undefined ? "" : JSON.stringify(v, null, 2);
    else d[key] = v === undefined || v === null ? "" : String(v);
  });
  return d;
}

function fromDraft(fields: Field[], d: Record<string, string | boolean>, base: Partial<Row>): Partial<Row> {
  const out: Record<string, unknown> = { ...base };
  for (const { key, kind } of fields) {
    const v = d[key];
    if (kind === "boolean") out[key] = Boolean(v);
    else if (kind === "number") out[key] = v === "" ? 0 : Number(v);
    else if (kind === "list") out[key] = String(v).split(",").map((s) => s.trim()).filter(Boolean);
    else if (kind === "json") {
      if (String(v).trim() === "") continue;
      try { out[key] = JSON.parse(String(v)); } catch { throw new Error(`${humanize(key)} is not valid JSON`); }
    } else out[key] = v ?? "";
  }
  return out as Partial<Row>;
}

export interface RecordManagerProps {
  /** "module" = module-store slice, "app" = app-data collection. */
  source: "module" | "app";
  sliceKey: string;
  /** Singular label, e.g. "Dubbing session". */
  label: string;
  /** Project pre-selected for new records. */
  defaultProjectId?: string;
}

export function RecordManager(props: RecordManagerProps) {
  return props.source === "module" ? <ModuleManager {...props} /> : <AppManager {...props} />;
}

function ModuleManager(props: RecordManagerProps) {
  const rows = useModuleSlice<Row>(props.sliceKey);
  return (
    <ManagerUi
      {...props}
      rows={rows}
      schemaRows={() => getModuleSlice<Row>(props.sliceKey)}
      write={(fn) => updateModuleSlice<Row>(props.sliceKey, fn)}
    />
  );
}

function AppManager(props: RecordManagerProps) {
  const key = props.sliceKey as AppDataCollectionKey;
  const rows = useAppDataSlice(key) as unknown as Row[];
  return (
    <ManagerUi
      {...props}
      rows={rows}
      schemaRows={() => getAppDataSlice(key) as unknown as Row[]}
      write={(fn) => updateAppDataSlice(key, (cur) => fn(cur as unknown as Row[]) as never)}
    />
  );
}

function ManagerUi({
  label, rows, schemaRows, write, defaultProjectId,
}: RecordManagerProps & { rows: Row[]; schemaRows: () => Row[]; write: (fn: (rows: Row[]) => Row[]) => void }) {
  const projects = useProjects();
  const selectedProjectId = useSelectedProjectId();
  const [open, setOpen] = useState<null | "add" | "edit">(null);
  const [editId, setEditId] = useState<string>("");
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const fields = useMemo(() => (open ? inferFields(schemaRows().slice(0, 300)) : []), [open, schemaRows]);

  const start = (mode: "add" | "edit") => {
    const f = inferFields(schemaRows().slice(0, 300));
    if (mode === "add") {
      setEditId("");
      const seed: Record<string, unknown> = { projectId: defaultProjectId ?? (projects.some((p) => p.id === selectedProjectId) ? selectedProjectId : projects[0]?.id) };
      f.forEach((x) => { if (x.kind === "select" && x.options?.length) seed[x.key] = x.options[0]; });
      setDraft(toDraft(f, seed as Partial<Row>));
    } else {
      const first = rows[0];
      setEditId(first?.id ?? "");
      setDraft(first ? toDraft(f, first) : {});
    }
    setOpen(mode);
  };

  const pick = (id: string) => {
    setEditId(id);
    const r = rows.find((x) => x.id === id);
    if (r) setDraft(toDraft(fields, r));
  };

  const save = () => {
    try {
      const now = new Date().toISOString();
      if (open === "add") {
        const rec = fromDraft(fields, draft, { id: `rec-${Date.now().toString(36)}`, createdAt: now, updatedAt: now }) as Row;
        write((cur) => [...cur, rec]);
        toast.success(`${label} added`);
      } else {
        const existing = rows.find((x) => x.id === editId);
        if (!existing) return;
        const rec = fromDraft(fields, draft, { ...existing, updatedAt: now }) as Row;
        write((cur) => cur.map((x) => (x.id === editId ? rec : x)));
        toast.success(`${label} updated`);
      }
      setOpen(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  const remove = () => {
    if (!editId || !window.confirm(`Delete this ${label.toLowerCase()}?`)) return;
    write((cur) => cur.filter((x) => x.id !== editId));
    toast.success(`${label} deleted`);
    setOpen(null);
  };

  const set = (k: string, v: string | boolean) => setDraft((d) => ({ ...d, [k]: v }));
  const [uploading, setUploading] = useState<string | null>(null);
  const upload = async (k: string, file?: File) => {
    if (!file) return;
    setUploading(k);
    try {
      const stored = await uploadFile(file);
      set(k, stored.url);
      toast.success(`${stored.name} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => start("add")}><Plus className="mr-1 h-4 w-4" />Add {label.toLowerCase()}</Button>
        <Button size="sm" variant="outline" disabled={rows.length === 0} onClick={() => start("edit")}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
      </div>
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{open === "add" ? `Add ${label.toLowerCase()}` : `Edit ${label.toLowerCase()}`}</DialogTitle>
            <DialogDescription>All fields are optional except the ones your team relies on. Changes save to the database.</DialogDescription>
          </DialogHeader>
          {open === "edit" && (
            <div className="space-y-1">
              <Label>Record</Label>
              <Select value={editId} onValueChange={pick}>
                <SelectTrigger><SelectValue placeholder="Choose a record" /></SelectTrigger>
                <SelectContent>{rows.map((r) => <SelectItem key={r.id} value={r.id}>{rowLabel(r)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(({ key, kind, options }) => {
              const id = `rm-${key}`;
              const value = draft[key];
              const wide = kind === "textarea" || kind === "json";
              return (
                <div key={key} className={wide ? "space-y-1 sm:col-span-2" : "space-y-1"}>
                  <Label htmlFor={id}>{humanize(key)}</Label>
                  {kind === "boolean" ? (
                    <div className="pt-1"><Switch id={id} checked={Boolean(value)} onCheckedChange={(c) => set(key, c)} /></div>
                  ) : kind === "project" ? (
                    <Select value={String(value || "")} onValueChange={(v) => set(key, v)}>
                      <SelectTrigger id={id}><SelectValue placeholder="Project" /></SelectTrigger>
                      <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : kind === "select" ? (
                    <Select value={String(value || "")} onValueChange={(v) => set(key, v)}>
                      <SelectTrigger id={id}><SelectValue placeholder="Choose" /></SelectTrigger>
                      <SelectContent>{(options ?? []).map((o) => <SelectItem key={o} value={o}>{humanize(o)}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : kind === "file" ? (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <Input id={id} value={String(value ?? "")} placeholder="Upload a file or paste a link" onChange={(e) => set(key, e.target.value)} />
                        <Button type="button" size="sm" variant="outline" disabled={uploading === key} onClick={() => document.getElementById(`${id}-file`)?.click()}>
                          <Upload className="mr-1 h-3.5 w-3.5" />{uploading === key ? "Uploading…" : "Upload"}
                        </Button>
                        <input id={`${id}-file`} type="file" aria-label={`Upload ${humanize(key)}`} className="hidden" onChange={(e) => { void upload(key, e.target.files?.[0]); e.currentTarget.value = ""; }} />
                      </div>
                      {/^(data:image|\/api\/files\/.*\.(png|jpe?g|webp|gif)$)/i.test(String(value ?? "")) && <img src={String(value)} alt="" className="h-20 rounded border object-cover" />}
                      {/^(\/api\/files\/|https?:\/\/)/.test(String(value ?? "")) && <a href={String(value)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-amber-500 hover:underline"><ExternalLink className="h-3 w-3" />Open file</a>}
                    </div>
                  ) : wide ? (
                    <Textarea id={id} rows={kind === "json" ? 5 : 3} className={kind === "json" ? "font-mono text-xs" : undefined} value={String(value ?? "")} onChange={(e) => set(key, e.target.value)} />
                  ) : (
                    <Input id={id} type={kind === "number" ? "number" : kind === "date" ? "date" : "text"} value={String(value ?? "")}
                      placeholder={kind === "list" ? "Comma separated" : undefined} onChange={(e) => set(key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            {open === "edit" && <Button variant="destructive" onClick={remove} className="mr-auto"><Trash2 className="mr-1 h-4 w-4" />Delete</Button>}
            <Button variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
            <Button onClick={save}>{open === "add" ? "Add" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Several sections on one page: choose the section, then Add / Edit it. */
export function RecordManagerGroup({ sections }: { sections: RecordManagerProps[] }) {
  const [index, setIndex] = useState(0);
  const current = sections[index] ?? sections[0];
  if (!current) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={String(index)} onValueChange={(v) => setIndex(Number(v))}>
        <SelectTrigger className="h-9 w-52" aria-label="Section to manage"><SelectValue /></SelectTrigger>
        <SelectContent>{sections.map((s, i) => <SelectItem key={s.sliceKey} value={String(i)}>{s.label}</SelectItem>)}</SelectContent>
      </Select>
      <RecordManager key={current.sliceKey} {...current} />
    </div>
  );
}
