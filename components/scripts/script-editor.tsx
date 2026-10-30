"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
  MessageSquare,
  Film,
  Sparkles,
  BookOpen,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  AlignLeft,
} from "lucide-react";
import { useProjects } from "@/lib/project-store";
import {
  addScriptBlock,
  addScriptScene,
  createScriptVersion,
  deleteScript,
  removeScriptBlock,
  removeScriptScene,
  updateScript,
  updateScriptBlock,
  updateScriptScene,
  useScript,
} from "@/lib/script-store";
import type { IntExt, TimeOfDay, ScriptBlockType, ScriptStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScriptUploadDialog } from "./script-upload-dialog";
import "@/lib/persistence-bootstrap";

const blockTypes: ScriptBlockType[] = [
  "scene_heading",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
  "note",
];
const statuses: ScriptStatus[] = [
  "Concept",
  "First Draft",
  "Second Draft",
  "Revised Draft",
  "Production Draft",
  "Shooting Draft",
  "Locked",
  "Archived",
];

export default function ScriptEditor(props: { scriptId: string; embeddedProjectId?: string }) {
  return <ScriptEditorContent key={`${props.embeddedProjectId ?? ""}:${props.scriptId}`} {...props} />;
}

function ScriptEditorContent({
  scriptId,
  embeddedProjectId,
}: {
  scriptId: string;
  embeddedProjectId?: string;
}) {
  const id = scriptId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const script = useScript(id);
  const projects = useProjects();
  const [tab, setTab] = useState("Overview");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [characterSearch, setCharacterSearch] = useState("");
  const [selectedCharacterForInspect, setSelectedCharacterForInspect] = useState<string | null>(null);

  // Form states
  const [blockType, setBlockType] = useState<ScriptBlockType>("action");
  const [blockText, setBlockText] = useState("");
  const [sceneNumber, setSceneNumber] = useState("");
  const [sceneHeading, setSceneHeading] = useState("");
  const [sceneLocation, setSceneLocation] = useState("");
  const [scenePages, setScenePages] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [sceneIntExt, setSceneIntExt] = useState<IntExt>("INT");
  const [sceneTime, setSceneTime] = useState<TimeOfDay>("DAY");
  const [versionName, setVersionName] = useState("");
  const [message, setMessage] = useState("");

  const returnTo = searchParams.get("returnTo");
  const backHref = embeddedProjectId
    ? `/dashboard/projects/${embeddedProjectId}/script`
    : returnTo && /^\/dashboard\/projects\/[^/?#]+(?:\/(?:script|scenes))?$/.test(returnTo)
    ? returnTo
    : "/scripts";

  // Character Dialogue Analysis
  const characterMetrics = useMemo(() => {
    if (!script) {
      return { characters: [], totalDialogueCount: 0, totalScriptWords: 0 };
    }
    const map = new Map<
      string,
      {
        name: string;
        dialogueCount: number;
        wordCount: number;
        scenes: Set<string>;
        dialogues: Array<{ sceneNumber: string; sceneHeading: string; text: string; parenthetical?: string }>;
      }
    >();

    let currentSceneNum = "1";
    let currentSceneHeading = "MAIN SCENE";
    let activeChar: string | null = null;
    let activeParenthetical: string | null = null;
    let totalScriptWords = 0;
    let totalDialogueCount = 0;

    script.blocks.forEach((block) => {
      if (block.type === "scene_heading") {
        const foundScene = script.scenes.find((s) => s.blockIds.includes(block.id));
        currentSceneNum = foundScene?.number || block.sceneId || "1";
        currentSceneHeading = block.text;
        activeChar = null;
        activeParenthetical = null;
      } else if (block.type === "character") {
        const rawName = block.text.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
        activeChar = rawName;
        activeParenthetical = null;
        if (!map.has(rawName)) {
          map.set(rawName, {
            name: rawName,
            dialogueCount: 0,
            wordCount: 0,
            scenes: new Set<string>(),
            dialogues: [],
          });
        }
      } else if (block.type === "parenthetical") {
        activeParenthetical = block.text;
      } else if (block.type === "dialogue" && activeChar) {
        totalDialogueCount++;
        const words = block.text.split(/\s+/).filter(Boolean).length;
        totalScriptWords += words;

        const entry = map.get(activeChar);
        if (entry) {
          entry.dialogueCount++;
          entry.wordCount += words;
          entry.scenes.add(currentSceneNum);
          entry.dialogues.push({
            sceneNumber: currentSceneNum,
            sceneHeading: currentSceneHeading,
            text: block.text,
            parenthetical: activeParenthetical || undefined,
          });
        }
      } else {
        activeChar = null;
        activeParenthetical = null;
      }
    });

    const list = Array.from(map.values()).map((char) => {
      const percentage = totalScriptWords > 0 ? Math.round((char.wordCount / totalScriptWords) * 1000) / 10 : 0;
      const roleTier: "Lead" | "Major Supporting" | "Supporting" | "Minor / Cameo" =
        percentage >= 25 || char.dialogueCount >= 10
          ? "Lead"
          : percentage >= 10 || char.dialogueCount >= 5
          ? "Major Supporting"
          : percentage >= 3 || char.dialogueCount >= 2
          ? "Supporting"
          : "Minor / Cameo";

      return {
        ...char,
        sceneList: Array.from(char.scenes).sort(),
        sceneCount: char.scenes.size,
        percentage,
        roleTier,
      };
    });

    list.sort((a, b) => b.dialogueCount - a.dialogueCount || b.wordCount - a.wordCount);
    return {
      characters: list,
      totalDialogueCount,
      totalScriptWords,
    };
  }, [script]);

  const filteredCharacters = useMemo(() => {
    return characterMetrics.characters.filter((c) =>
      c.name.toLowerCase().includes(characterSearch.toLowerCase())
    );
  }, [characterMetrics.characters, characterSearch]);

  const activeInspectChar = useMemo(() => {
    if (!selectedCharacterForInspect) {
      return characterMetrics.characters[0] || null;
    }
    return characterMetrics.characters.find((c) => c.name === selectedCharacterForInspect) || null;
  }, [characterMetrics.characters, selectedCharacterForInspect]);

  if (!script || (embeddedProjectId && script.projectId !== embeddedProjectId)) {
    return (
      <main className="p-8">
        <p>Script not found in this project.</p>
        <Button asChild variant="link">
          <Link href={backHref}>Back</Link>
        </Button>
      </main>
    );
  }

  const currentStatus = script.status;
  const project = projects.find((item) => item.id === script.projectId);
  const backLabel = backHref === "/scripts" ? "Back to Scripts" : "Back to Project";
  const totalPages = script.scenes.reduce((sum, scene) => sum + scene.pages, 0);
  const locations = new Set(script.scenes.map((scene) => scene.location).filter(Boolean));

  function saveMeta(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    if (!title) {
      setMessage("A script title is required.");
      return;
    }
    updateScript(id, {
      title,
      writer: String(form.get("writer") ?? "").trim(),
      genre: String(form.get("genre") ?? "").trim(),
      notes: String(form.get("notes") ?? ""),
      status: String(form.get("status") ?? currentStatus) as ScriptStatus,
    });
    setMessage("Script metadata saved.");
  }

  function addBlock(event: React.FormEvent) {
    event.preventDefault();
    if (!blockText.trim()) return;
    addScriptBlock(id, { type: blockType, text: blockText.trim() });
    setBlockText("");
  }

  function addScene(event: React.FormEvent) {
    event.preventDefault();
    if (!sceneNumber.trim() || !sceneHeading.trim()) return;
    if (script?.scenes.some((scene) => scene.number.toLowerCase() === sceneNumber.trim().toLowerCase())) {
      setMessage("This scene number already exists in the script.");
      return;
    }
    const pages = Number(scenePages);
    if (!Number.isFinite(pages) || pages < 0 || !Number.isInteger(pages * 8)) {
      setMessage("Pages must be a non-negative number in eighth-page increments.");
      return;
    }
    addScriptScene(id, {
      number: sceneNumber.trim(),
      heading: sceneHeading.trim(),
      intExt: sceneIntExt,
      location: sceneLocation.trim(),
      timeOfDay: sceneTime,
      scriptDay: "",
      pages,
      eighths: Math.round(pages * 8),
      description: sceneDescription.trim(),
    });
    setMessage("Script scene added. Production scene records are managed in the project scene list.");
    setSceneNumber("");
    setSceneHeading("");
    setSceneLocation("");
    setScenePages("");
    setSceneDescription("");
  }

  function newVersion() {
    if (!versionName.trim()) return;
    createScriptVersion(id, {
      name: versionName.trim(),
      notes: "Created from current draft",
      status: currentStatus,
    });
    setVersionName("");
  }

  return (
    <main className={embeddedProjectId ? "space-y-6" : "mx-auto max-w-7xl space-y-6 p-6"}>
      {!embeddedProjectId && (
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground">
          {backLabel}
        </Link>
      )}

      {message && <p role="status" className="rounded-md border bg-muted p-3 text-sm">{message}</p>}

      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {project?.title ?? "Project"}
            </Badge>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{script.status}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">{script.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowUploadDialog(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
          >
            <Upload className="mr-1.5 h-4 w-4" /> Upload & Ingest Script
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/projects/${script.projectId}/scenes`}>
              <Film className="mr-1.5 h-4 w-4" /> Production Scenes
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex gap-1 overflow-auto border-b">
        {["Overview", "Script", "Scenes", "Characters & Dialogue", "Breakdown", "Locations", "Versions", "Reports"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              tab === item
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item}
            {item === "Characters & Dialogue" && (
              <span className="ml-1.5 rounded-full bg-amber-500/10 text-amber-500 px-1.5 py-0.2 text-[11px]">
                {characterMetrics.characters.length}
              </span>
            )}
            {item === "Scenes" && (
              <span className="ml-1.5 rounded-full bg-muted text-muted-foreground px-1.5 py-0.2 text-[11px]">
                {script.scenes.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab: Overview */}
      {tab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <form onSubmit={saveMeta} className="space-y-4 rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Script Metadata & Production Info</h2>
              <Badge variant="outline">{script.type}</Badge>
            </div>
            <div>
              <Label htmlFor="script-title">Title</Label>
              <Input id="script-title" name="title" required defaultValue={script.title} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="script-writer">Writer / Screenplay</Label>
                <Input id="script-writer" name="writer" defaultValue={script.writer} />
              </div>
              <div>
                <Label htmlFor="script-genre">Genre</Label>
                <Input id="script-genre" name="genre" defaultValue={script.genre} />
              </div>
            </div>
            <div>
              <Label htmlFor="script-status">Status</Label>
              <Select name="status" defaultValue={script.status}>
                <SelectTrigger id="script-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="script-notes">Production Notes</Label>
              <Textarea id="script-notes" name="notes" defaultValue={script.notes} rows={3} />
            </div>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Save Metadata
            </Button>
          </form>

          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Script Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground">Est. Pages</span>
                  <p className="text-2xl font-bold mt-0.5">{totalPages || Math.round(script.blocks.length / 25) || 1}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground">Scenes</span>
                  <p className="text-2xl font-bold mt-0.5">{script.scenes.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground">Speaking Cast</span>
                  <p className="text-2xl font-bold text-amber-500 mt-0.5">{characterMetrics.characters.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground">Total Dialogues</span>
                  <p className="text-2xl font-bold text-primary mt-0.5">{characterMetrics.totalDialogueCount}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(true)}
                  className="w-full text-xs"
                >
                  <Upload className="mr-2 h-3.5 w-3.5 text-amber-500" />
                  Replace / Re-parse Script File
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Script (Screenplay Reader / Editor) */}
      {tab === "Script" && (
        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <form onSubmit={addBlock} className="h-fit space-y-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold text-sm">Add Script Element</h2>
            <Select value={blockType} onValueChange={(value) => setBlockType(value as ScriptBlockType)}>
              <SelectTrigger aria-label="Block type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {blockTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              aria-label="New screenplay text"
              value={blockText}
              onChange={(event) => setBlockText(event.target.value)}
              placeholder="Write screenplay text..."
              required
              rows={4}
              className="font-mono text-xs"
            />
            <Button type="submit" className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Element
            </Button>
          </form>

          {/* Authentic Screenplay Page */}
          <div className="min-h-[600px] rounded-xl border bg-card p-6 sm:p-10 font-mono shadow-sm space-y-4">
            {script.blocks.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No script elements found. Click below to upload or paste a screenplay document.
                </p>
                <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Script Document
                </Button>
              </div>
            ) : (
              <div className="max-w-[760px] mx-auto space-y-4 text-xs sm:text-sm leading-relaxed">
                {script.blocks.map((block) => (
                  <div key={block.id} className="group relative">
                    {block.type === "scene_heading" && (
                      <div className="font-bold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-4 border-amber-500 py-1.5 px-3 rounded-r my-4">
                        {block.text}
                      </div>
                    )}

                    {block.type === "character" && (
                      <div className="text-center font-bold tracking-widest text-foreground uppercase pt-3 pb-0.5">
                        {block.text}
                      </div>
                    )}

                    {block.type === "parenthetical" && (
                      <div className="max-w-[380px] mx-auto text-center italic text-muted-foreground text-xs pb-0.5">
                        {block.text}
                      </div>
                    )}

                    {block.type === "dialogue" && (
                      <div className="max-w-[480px] mx-auto text-foreground leading-relaxed text-center sm:text-left sm:pl-8 sm:pr-4 pb-2">
                        {block.text}
                      </div>
                    )}

                    {block.type === "action" && (
                      <div className="text-foreground/90 leading-relaxed py-1">
                        {block.text}
                      </div>
                    )}

                    {block.type === "transition" && (
                      <div className="text-right font-bold tracking-wider uppercase text-muted-foreground py-2">
                        {block.text}
                      </div>
                    )}

                    {/* Hover delete */}
                    <div className="absolute top-0 right-0 hidden group-hover:flex items-center gap-1 bg-background/90 px-1.5 py-0.5 rounded border shadow-sm">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        aria-label={`Delete ${block.type} block`}
                        onClick={() => {
                          if (window.confirm("Delete this screenplay block?")) {
                            removeScriptBlock(id, block.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab: Characters & Dialogue (The Core Feature) */}
      {tab === "Characters & Dialogue" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Character Dialogue & Screen Time Breakdown
              </h2>
              <p className="text-xs text-muted-foreground">
                Automatic dialogue count, speech percentages, and scene appearances parsed directly from screenplay text.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search character..."
                value={characterSearch}
                onChange={(e) => setCharacterSearch(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* Character Table / Cards */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-3.5 bg-muted/40 border-b flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
                <span>Character Name & Role</span>
                <span className="text-right">Dialogue Count & Share</span>
              </div>

              <div className="divide-y max-h-[580px] overflow-y-auto">
                {filteredCharacters.map((char, idx) => {
                  const isSelected = activeInspectChar?.name === char.name;
                  return (
                    <div
                      key={char.name}
                      onClick={() => setSelectedCharacterForInspect(char.name)}
                      className={`p-4 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isSelected ? "bg-amber-500/10 border-l-4 border-l-amber-500" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{char.name}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              char.roleTier === "Lead"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : char.roleTier === "Major Supporting"
                                ? "bg-blue-500/15 text-blue-500 border-blue-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {char.roleTier}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Speaks in {char.sceneCount} {char.sceneCount === 1 ? "scene" : "scenes"}:{" "}
                          <span className="font-mono text-foreground/80">
                            {char.sceneList.map((s) => `Sc. ${s}`).join(", ")}
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0 min-w-[130px]">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-lg font-bold text-primary">{char.dialogueCount}</span>
                          <span className="text-xs text-muted-foreground">speeches</span>
                          <span className="text-xs font-mono font-semibold ml-1">({char.percentage}%)</span>
                        </div>
                        <div className="w-28 ml-auto mt-1">
                          <Progress value={Math.min(100, char.percentage * 2)} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCharacters.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground space-y-2">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p>No characters match your search or screenplay is empty.</p>
                    <Button size="sm" variant="outline" onClick={() => setShowUploadDialog(true)}>
                      Upload or Load Sample Script
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Character Dialogue Drawer */}
            <div className="rounded-xl border bg-card p-5 space-y-4 h-fit">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base">Spoken Lines Inspector</h3>
                  <p className="text-xs text-muted-foreground">
                    Verbatim quotes spoken in the script
                  </p>
                </div>
                {activeInspectChar && (
                  <Badge variant="outline" className="text-xs font-bold text-amber-500">
                    {activeInspectChar.name}
                  </Badge>
                )}
              </div>

              {activeInspectChar ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center p-2.5 rounded-lg bg-muted/40 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Total Speeches</span>
                      <p className="font-bold text-lg text-primary">{activeInspectChar.dialogueCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Spoken Words</span>
                      <p className="font-bold text-lg text-foreground">{activeInspectChar.wordCount}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {activeInspectChar.dialogues.map((quote, qIdx) => (
                      <div key={qIdx} className="p-3 rounded-lg border bg-background/60 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                          <span className="font-semibold text-primary">Scene {quote.sceneNumber}</span>
                          <span className="truncate max-w-[170px]">{quote.sceneHeading}</span>
                        </div>
                        {quote.parenthetical && (
                          <p className="italic text-muted-foreground text-[11px]">{quote.parenthetical}</p>
                        )}
                        <p className="font-medium text-foreground leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="p-6 text-center text-xs text-muted-foreground">
                  Select a character to view their spoken dialogues.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab: Scenes */}
      {tab === "Scenes" && (
        <section className="space-y-5">
          <form onSubmit={addScene} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <Label>Scene # *</Label>
              <Input value={sceneNumber} onChange={(e) => setSceneNumber(e.target.value)} placeholder="4A" />
            </div>
            <div className="lg:col-span-2">
              <Label>Heading *</Label>
              <Input value={sceneHeading} onChange={(e) => setSceneHeading(e.target.value)} placeholder="OLD HOUSE - NIGHT" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={sceneLocation} onChange={(e) => setSceneLocation(e.target.value)} />
            </div>
            <div>
              <Label>Pages</Label>
              <Input type="number" step="0.125" min="0" value={scenePages} onChange={(e) => setScenePages(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Scene
              </Button>
            </div>
            <div className="sm:col-span-2 lg:col-span-6">
              <Label>Description / Synopsis</Label>
              <Input value={sceneDescription} onChange={(e) => setSceneDescription(e.target.value)} />
            </div>
          </form>

          <div className="space-y-2">
            {script.scenes.map((scene) => {
              // Find characters speaking in this scene
              const sceneBlocks = script.blocks.filter((b) => scene.blockIds.includes(b.id));
              const sceneChars = Array.from(
                new Set(
                  sceneBlocks
                    .filter((b) => b.type === "character")
                    .map((b) => b.text.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase())
                )
              );

              return (
                <div key={scene.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                  <span className="w-12 font-mono font-bold text-base text-primary">
                    Sc. {scene.number}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold uppercase text-sm">
                      {scene.intExt}. {scene.heading} - {scene.timeOfDay}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scene.location || "No location"} · {scene.pages} pages · {scene.status}
                    </p>
                    {scene.description && <p className="text-xs text-foreground/80">{scene.description}</p>}

                    {/* Characters in scene */}
                    {sceneChars.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sceneChars.map((char) => (
                          <span
                            key={char}
                            onClick={() => {
                              setSelectedCharacterForInspect(char);
                              setTab("Characters & Dialogue");
                            }}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeScriptScene(id, scene.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab: Breakdown */}
      {tab === "Breakdown" && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold text-base">Scene Elements Breakdown</h2>
          <p className="mb-5 text-xs text-muted-foreground">
            Manage props, costumes, vehicles, and VFX elements for each scene.
          </p>
          <div className="divide-y">
            {script.scenes.map((scene) => (
              <div key={scene.id} className="grid gap-3 py-4 sm:grid-cols-[90px_1fr_220px]">
                <span className="font-mono font-bold text-sm text-primary">Scene {scene.number}</span>
                <div>
                  <p className="font-semibold text-sm">{scene.heading}</p>
                  <p className="text-xs text-muted-foreground">{scene.location || "Location not set"}</p>
                </div>
                <Input
                  aria-label={`Breakdown for scene ${scene.number}`}
                  placeholder="Props, costumes, VFX..."
                  defaultValue={scene.breakdown.map((item) => item.name).join(", ")}
                  className="text-xs"
                  onBlur={(event) =>
                    updateScriptScene(id, scene.id, {
                      breakdown: Array.from(
                        new Set(event.target.value.split(",").map((name) => name.trim()).filter(Boolean))
                      ).map(
                        (name) =>
                          scene.breakdown.find((item) => item.name === name) ?? {
                            id: `item-${crypto.randomUUID()}`,
                            category: "prop" as const,
                            name,
                          }
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Locations */}
      {tab === "Locations" && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold text-base">Unique Script Locations ({locations.size})</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(locations).map((location) => (
              <span key={location} className="rounded-lg border bg-muted/50 px-3 py-1.5 text-xs font-medium">
                {location}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Versions */}
      {tab === "Versions" && (
        <section className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Version name, e.g. Locked Shooting Draft Rev 4"
            />
            <Button onClick={newVersion}>Create Version</Button>
          </div>
          <div className="rounded-xl border bg-card divide-y">
            {script.versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">
                    V{version.number} · {version.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(version.revisionDate).toLocaleDateString()} · {version.status}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{version.scenes.length} scenes</span>
              </div>
            ))}
            {script.versions.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">No saved versions yet.</p>
            )}
          </div>
        </section>
      )}

      {/* Tab: Reports */}
      {tab === "Reports" && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold text-base">Production Script Report</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="p-3 rounded-lg border bg-muted/40">
              <p className="text-xs text-muted-foreground">Page Eighths</p>
              <p className="text-xl font-bold">{Math.round(totalPages * 8)}/8</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/40">
              <p className="text-xs text-muted-foreground">Speaking Characters</p>
              <p className="text-xl font-bold text-amber-500">{characterMetrics.characters.length}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/40">
              <p className="text-xs text-muted-foreground">Dialogue Speeches</p>
              <p className="text-xl font-bold text-primary">{characterMetrics.totalDialogueCount}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/40">
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-xl font-bold">{new Date(script.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </section>
      )}

      {/* Script Upload Dialog Modal */}
      <ScriptUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        scriptId={id}
        projectId={script.projectId}
        projectTitle={project?.title || "Film Project"}
        onImportSuccess={() => {
          setMessage("Screenplay successfully imported! Characters, dialogues, and scenes are now synced.");
          setTab("Characters & Dialogue");
        }}
      />

      <div className="flex justify-end pt-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (window.confirm("Delete this script and all its versions?")) {
              deleteScript(id);
              router.push(backHref);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Script
        </Button>
      </div>
    </main>
  );
}
