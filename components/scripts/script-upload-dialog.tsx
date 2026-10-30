"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  Users,
  Film,
  MessageSquare,
  Clock,
  ChevronRight,
  Eye,
  AlertCircle,
  Copy,
  BarChart3,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Compass,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  parseScreenplayText,
  sampleScreenplays,
  type ScriptAnalysisResult,
  type CharacterAnalytics,
} from "@/lib/script-parser";
import { updateScript, type useScript } from "@/lib/script-store";
import { getAllScenes, createScene } from "@/lib/scene-store";
import { updateAppDataSlice } from "@/lib/app-data-store";
import type { Scene, ScriptBlock, ScriptScene } from "@/lib/types";

interface ScriptUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scriptId: string;
  projectId: string;
  projectTitle: string;
  onImportSuccess?: () => void;
}

export function ScriptUploadDialog({
  open,
  onOpenChange,
  scriptId,
  projectId,
  projectTitle,
  onImportSuccess,
}: ScriptUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "paste" | "samples">("samples");
  const [pastedText, setPastedText] = useState("");
  const [scriptTitle, setScriptTitle] = useState(`${projectTitle} — Screenplay`);
  const [isParsing, setIsParsing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysisResult | null>(() =>
    parseScreenplayText(sampleScreenplays.pushpa2.text, "Pushpa 2: The Rule — Forest & Jathara Screenplay")
  );
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterAnalytics | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload (.txt, .fountain, .fdx, .doc, .docx, .pdf, .md)
  async function handleFileUpload(file: File) {
    setErrorMessage("");
    setIsParsing(true);
    try {
      let content = "";
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "fdx") {
        // Final Draft XML: extract paragraph and text elements
        const xmlText = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const paragraphs = Array.from(xmlDoc.getElementsByTagName("Paragraph"));
        content = paragraphs
          .map((p) => {
            const type = p.getAttribute("Type") || "Action";
            const text = p.textContent?.trim() || "";
            if (!text) return "";
            if (type === "Scene Heading") return `\n${text}\n`;
            if (type === "Character") return `\n${text.toUpperCase()}`;
            if (type === "Parenthetical") return `(${text.replace(/^\(|\)$/g, "")})`;
            if (type === "Dialogue") return text;
            if (type === "Transition") return `\n${text.toUpperCase()}`;
            return text;
          })
          .filter(Boolean)
          .join("\n");
      } else {
        // Standard text, Fountain, Markdown, or raw document text
        content = await file.text();
      }

      if (!content.trim()) {
        setErrorMessage("Could not extract text from the file. Try pasting the screenplay text directly.");
        setIsParsing(false);
        return;
      }

      const titleGuess = file.name.replace(/\.[^/.]+$/, "");
      setScriptTitle(titleGuess);
      const parsed = parseScreenplayText(content, titleGuess);
      setAnalysisResult(parsed);
      setSelectedCharacter(parsed.characters[0] || null);
      setIsParsing(false);
    } catch (err) {
      console.error("Failed to parse script file", err);
      setErrorMessage("Error reading script document. You can paste the text directly into the 'Paste Script' tab.");
      setIsParsing(false);
    }
  }

  function handleFileDrop(event: React.DragEvent) {
    event.preventDefault();
    if (event.dataTransfer.files?.[0]) {
      handleFileUpload(event.dataTransfer.files[0]);
    }
  }

  function handlePasteParse() {
    if (!pastedText.trim()) {
      setErrorMessage("Please paste screenplay text to parse.");
      return;
    }
    setIsParsing(true);
    setErrorMessage("");
    const parsed = parseScreenplayText(pastedText, scriptTitle);
    setAnalysisResult(parsed);
    setSelectedCharacter(parsed.characters[0] || null);
    setIsParsing(false);
  }

  function handleLoadSample(key: keyof typeof sampleScreenplays) {
    const sample = sampleScreenplays[key];
    setScriptTitle(sample.title);
    setPastedText(sample.text);
    const parsed = parseScreenplayText(sample.text, sample.title);
    setAnalysisResult(parsed);
    setSelectedCharacter(parsed.characters[0] || null);
  }

  // Import into project
  function handleImportToProject() {
    if (!analysisResult) return;
    setIsImporting(true);

    try {
      // 1. Transform parsed blocks to ScriptBlocks
      const scriptBlocks: ScriptBlock[] = analysisResult.blocks.map((b) => ({
        id: b.id,
        type: b.type,
        text: b.text,
        sceneId: b.sceneNumber ? `${projectId}-parsed-scene-${b.sceneNumber}` : undefined,
      }));

      // 2. Transform parsed scenes to ScriptScenes
      const scriptScenes: ScriptScene[] = analysisResult.scenes.map((sc) => ({
        id: `${projectId}-parsed-scene-${sc.number}`,
        number: sc.number,
        heading: sc.heading,
        intExt: sc.intExt,
        location: sc.location,
        timeOfDay: sc.timeOfDay,
        scriptDay: sc.number,
        pages: sc.pages,
        eighths: sc.eighths,
        description: sc.synopsis,
        breakdown: [],
        status: "not-scheduled",
        blockIds: sc.blockIds,
      }));

      // 3. Update active Script
      updateScript(scriptId, {
        title: analysisResult.title,
        blocks: scriptBlocks,
        scenes: scriptScenes,
        draftName: "Uploaded Production Draft",
        updatedAt: new Date().toISOString(),
      });

      // 4. Sync production scenes into scene-store so they appear in project's Scenes & Schedule
      updateAppDataSlice("scenes", (existingScenes) => {
        // Keep other projects' scenes
        const otherScenes = existingScenes.filter((s) => s.projectId !== projectId);
        const newProjectScenes: Scene[] = analysisResult.scenes.map((sc, idx) => ({
          id: `sc-imported-${projectId}-${sc.number}`,
          projectId,
          sceneNumber: sc.number,
          heading: `${sc.intExt}. ${sc.heading} - ${sc.timeOfDay}`,
          intExt: sc.intExt,
          location: sc.location,
          timeOfDay: sc.timeOfDay,
          characters: sc.characters,
          props: [],
          costumes: [],
          vehicles: [],
          specialRequirements: [],
          vfxRequired: sc.heading.toLowerCase().includes("vfx") || sc.heading.toLowerCase().includes("drone"),
          vfxNotes: "",
          notes: `Parsed from screenplay: ${analysisResult.title}`,
          estimatedDuration: `${Math.round(sc.pages * 2)} min`,
          pages: sc.pages,
          status: "not-scheduled",
          synopsis: sc.synopsis,
        }));
        return [...otherScenes, ...newProjectScenes];
      });

      setImportSuccess(true);
      setTimeout(() => {
        setIsImporting(false);
        setImportSuccess(false);
        onOpenChange(false);
        onImportSuccess?.();
      }, 1200);
    } catch (err) {
      console.error("Failed to import parsed script", err);
      setErrorMessage("Failed to import script into project. Please check the text format.");
      setIsImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border/80 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-card/60">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Screenplay Ingest & Character Dialogue Analyzer
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Industry Standard
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Upload any script document (.txt, .fountain, .fdx, .doc, .pdf) to automatically detect scenes, character dialogue counts, and screen-time breakdowns.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          {/* Top Source Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "samples" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("samples")}
              className="text-xs"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> 1-Click Screenplays
            </Button>
            <Button
              variant={activeTab === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("upload")}
              className="text-xs"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload File (.txt, .fountain, .fdx, .docx)
            </Button>
            <Button
              variant={activeTab === "paste" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("paste")}
              className="text-xs"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Paste Screenplay Text
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Source Selection Area */}
          {activeTab === "samples" && (
            <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl border bg-card/40">
              <div
                onClick={() => handleLoadSample("pushpa2")}
                className="p-4 rounded-lg border hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm group-hover:text-amber-500 transition-colors">
                    Pushpa 2: The Rule
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    3 Scenes · Period Action
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Features deep Seshachalam forest rain confrontation, holy Jathara temple festival faceoff with Shekhawat, and international convoy launch.
                </p>
                <div className="flex gap-1.5 text-[10px] text-amber-500/90 font-mono">
                  <span>Pushpa Raj</span> • <span>Srivalli</span> • <span>Bhanwar Singh</span>
                </div>
              </div>

              <div
                onClick={() => handleLoadSample("kalki2898ad")}
                className="p-4 rounded-lg border hover:border-sky-500/50 hover:bg-sky-500/5 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm group-hover:text-sky-400 transition-colors">
                    Kalki 2898 AD
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    3 Scenes · Sci-Fi Epic
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Features Kasi dystopian outskirts bounty dialogue with AI supercar Bujji, Shambhala battle against Ashwatthama, and Supreme Yaskin&apos;s apex chamber.
                </p>
                <div className="flex gap-1.5 text-[10px] text-sky-400 font-mono">
                  <span>Bhairava</span> • <span>Ashwatthama</span> • <span>Supreme Yaskin</span>
                </div>
              </div>

              <div
                onClick={() => handleLoadSample("devara")}
                className="p-4 rounded-lg border hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm group-hover:text-blue-400 transition-colors">
                    Devara: Part 1
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    3 Scenes · Coastal Action
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Features Red Sea stormy cliff duel against Bhaira, deep-sea underwater reef assault, and coastal dawn legacy handoff to Varadha.
                </p>
                <div className="flex gap-1.5 text-[10px] text-blue-400 font-mono">
                  <span>Devara</span> • <span>Bhaira</span> • <span>Varadha</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-primary/5 space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.fountain,.fdx,.doc,.docx,.pdf,.md"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-sm">Click to browse or drop screenplay file here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .txt, .fountain, Final Draft (.fdx), Word (.docx), PDF, or Markdown
                </p>
              </div>
            </div>
          )}

          {activeTab === "paste" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="paste-script" className="text-xs font-semibold">
                  Paste Standard Screenplay Text
                </Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {pastedText.split(/\r?\n/).filter(Boolean).length} lines
                </span>
              </div>
              <Textarea
                id="paste-script"
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`1. EXT. CHARMINAR OLD CITY - NIGHT #1#\n\nRain washes the cobblestones outside the Irani cafe.\n\nRISHI DEV\nHyderabad manadi ra, evadi kosam vadilesi podam?\n\nCUT TO:\n\n2. INT. RADIO STATION BROADCAST BOOTH - NIGHT`}
                className="font-mono text-xs leading-relaxed"
              />
              <Button size="sm" onClick={handlePasteParse} disabled={!pastedText.trim()}>
                Parse & Analyze Text
              </Button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Analysis Output */}
          {analysisResult && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-lg">{analysisResult.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Analyzed Screenplay Breakdown & Character Dialogue Telemetry
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                    Ready for Ingest
                  </Badge>
                </div>
              </div>

              {/* Metric Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl border bg-card/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Total Scenes
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{analysisResult.totalScenes}</span>
                    <span className="text-xs text-muted-foreground">sluglines</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Characters
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-amber-500">{analysisResult.totalCharacters}</span>
                    <span className="text-xs text-muted-foreground">speaking</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Dialogue Cues
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{analysisResult.totalDialogues}</span>
                    <span className="text-xs text-muted-foreground">speeches</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Spoken Words
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{analysisResult.totalWords}</span>
                    <span className="text-xs text-muted-foreground">words</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Est. Duration
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{analysisResult.estimatedPages}</span>
                    <span className="text-xs text-muted-foreground">pages / min</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-card/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Day vs Night
                  </span>
                  <div className="mt-1 text-xs space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>{analysisResult.dayPercent}% Day</span>
                      <span>{analysisResult.nightPercent}% Night</span>
                    </div>
                    <Progress value={analysisResult.dayPercent} className="h-1.5" />
                  </div>
                </div>
              </div>

              {/* Character Dialogue & Screen Time Breakdown */}
              <div className="grid lg:grid-cols-[1fr_360px] gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" />
                      Character Dialogue & Scene Appearance Analysis
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Click any character to inspect their spoken dialogues
                    </span>
                  </div>

                  <div className="rounded-xl border bg-card/40 overflow-hidden divide-y">
                    {analysisResult.characters.map((char, index) => {
                      const isSelected = selectedCharacter?.normalizedName === char.normalizedName;
                      return (
                        <div
                          key={char.normalizedName}
                          onClick={() => setSelectedCharacter(char)}
                          className={`p-3.5 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            isSelected
                              ? "bg-primary/10 border-l-4 border-l-primary"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono font-bold text-muted-foreground w-4 text-center">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm tracking-tight">{char.normalizedName}</span>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ${
                                    char.roleTier === "Lead"
                                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                      : char.roleTier === "Major Supporting"
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {char.roleTier}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Appears in {char.sceneCount} {char.sceneCount === 1 ? "scene" : "scenes"}:{" "}
                                <span className="font-mono text-[11px] text-foreground/80">
                                  {char.scenes.map((s) => `Sc. ${s}`).join(", ")}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 min-w-[120px]">
                            <div className="flex items-baseline justify-end gap-1.5">
                              <span className="text-base font-bold text-primary">{char.dialogueCount}</span>
                              <span className="text-[11px] text-muted-foreground">dialogues</span>
                              <span className="text-[11px] font-mono font-semibold ml-1">({char.percentage}%)</span>
                            </div>
                            <div className="w-28 ml-auto mt-1">
                              <Progress value={Math.min(100, char.percentage * 2)} className="h-1.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {analysisResult.characters.length === 0 && (
                      <p className="p-6 text-center text-sm text-muted-foreground">
                        No character dialogue blocks were detected. Make sure character names are in UPPERCASE.
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Character Dialogue Inspector */}
                <div className="rounded-xl border bg-card/60 p-4 flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Spoken Dialogue Inspector
                    </h4>
                    {selectedCharacter && (
                      <Badge variant="outline" className="text-xs font-bold text-amber-500">
                        {selectedCharacter.normalizedName}
                      </Badge>
                    )}
                  </div>

                  {selectedCharacter ? (
                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
                      <div className="grid grid-cols-2 gap-2 text-center p-2 rounded-lg bg-muted/40 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground">Total Lines</span>
                          <p className="font-bold text-base">{selectedCharacter.dialogueCount}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">Spoken Words</span>
                          <p className="font-bold text-base">{selectedCharacter.wordCount}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {selectedCharacter.dialogues.map((quote, qIdx) => (
                          <div key={qIdx} className="p-2.5 rounded-lg border bg-background/60 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span>Scene {quote.sceneNumber}</span>
                              <span className="truncate max-w-[150px]">{quote.sceneHeading}</span>
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
                    <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-muted-foreground">
                      Select a character to view all their dialogues across scenes
                    </div>
                  )}
                </div>
              </div>

              {/* Scene Breakdown preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Film className="h-4 w-4 text-primary" />
                  Auto-Detected Scene Sluglines & Characters
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysisResult.scenes.map((scene) => (
                    <div key={scene.number} className="p-3 rounded-xl border bg-card/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          Sc. {scene.number}
                        </Badge>
                        <div className="flex gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                            {scene.intExt}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground">
                            {scene.timeOfDay}
                          </span>
                        </div>
                      </div>

                      <p className="font-semibold text-xs leading-snug line-clamp-1">{scene.heading}</p>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span>{scene.pages} pages</span>
                        <span className="text-primary font-mono">{scene.dialogueCount} dialogues</span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {scene.characters.map((char) => (
                          <span key={char} className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] text-foreground/80">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-card/80 flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {analysisResult && (
              <span>
                Found <strong>{analysisResult.totalScenes} scenes</strong> and{" "}
                <strong>{analysisResult.totalCharacters} characters</strong> with{" "}
                <strong>{analysisResult.totalDialogues} dialogue speeches</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImportToProject}
              disabled={!analysisResult || isImporting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5"
            >
              {importSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
                  Script Imported & Synced!
                </>
              ) : isImporting ? (
                "Importing Screenplay..."
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Import & Sync to Project Script
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
