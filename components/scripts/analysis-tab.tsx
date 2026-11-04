"use client";

import { useState, useMemo } from "react";
import {
  Brain,
  BarChart3,
  Users,
  Layers,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { Script, ScriptScene, ScriptBlock } from "@/lib/types";

interface Props {
  scriptId: string;
  script: Script;
}

interface ActData {
  act: 1 | 2 | 3;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  scenes: ScriptScene[];
  startPage: number;
  endPage: number;
  pageCount: number;
  dialogueRatio: number;
  actionRatio: number;
  charactersIntroduced: string[];
  longestScene: { number: string; pages: number } | null;
}

interface PlotPoint {
  name: string;
  expectedPct: number;
  expectedPage: number;
  actualScene: string;
  deviation: number;
}

function assignAct(cumulativeEnd: number, totalPages: number): 1 | 2 | 3 {
  const pct = totalPages > 0 ? cumulativeEnd / totalPages : 0;
  if (pct <= 0.25) return 1;
  if (pct <= 0.75) return 2;
  return 3;
}

function findSceneAtPage(scenes: ScriptScene[], targetPage: number): string {
  let cum = 0;
  for (const s of scenes) {
    cum += s.pages;
    if (cum >= targetPage) return s.number;
  }
  return scenes.length > 0 ? scenes[scenes.length - 1].number : "—";
}

function getBlocksForScene(scene: ScriptScene, allBlocks: ScriptBlock[]): ScriptBlock[] {
  if (scene.blockIds.length > 0) {
    const idSet = new Set(scene.blockIds);
    return allBlocks.filter((b) => idSet.has(b.id));
  }
  return [];
}

function extractCharactersFromBlocks(blocks: ScriptBlock[]): string[] {
  const chars = new Set<string>();
  blocks.forEach((b) => {
    if (b.type === "character") {
      chars.add(b.text.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase());
    }
  });
  return Array.from(chars);
}

export function AnalysisTab({ scriptId, script }: Props) {
  const [notes, setNotes] = useState("");
  const [expandedActs, setExpandedActs] = useState<Set<number>>(new Set([1]));

  const analysis = useMemo(() => {
    const scenes = script.scenes;
    const blocks = script.blocks;
    const totalPages = scenes.reduce((sum, s) => sum + s.pages, 0);

    if (scenes.length === 0 || totalPages === 0) return null;

    let cumPages = 0;
    const sceneWithCum = scenes.map((s) => {
      cumPages += s.pages;
      return { scene: s, cumEnd: cumPages, act: assignAct(cumPages - s.pages / 2, totalPages) };
    });

    const actScenes: Record<1 | 2 | 3, ScriptScene[]> = { 1: [], 2: [], 3: [] };
    sceneWithCum.forEach(({ scene, act }) => actScenes[act].push(scene));

    const seenCharsGlobal = new Set<string>();

    const actConfigs: Array<{ act: 1 | 2 | 3; label: string; color: string; bgColor: string; borderColor: string }> = [
      { act: 1, label: "Setup", color: "bg-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
      { act: 2, label: "Confrontation", color: "bg-amber-500", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
      { act: 3, label: "Resolution", color: "bg-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
    ];

    let pageOffset = 0;
    const acts: ActData[] = actConfigs.map(({ act, label, color, bgColor, borderColor }) => {
      const actS = actScenes[act];
      const actPages = actS.reduce((sum, s) => sum + s.pages, 0);
      const startPage = pageOffset + 1;
      pageOffset += actPages;
      const endPage = pageOffset;

      const actBlocks = actS.flatMap((s) => getBlocksForScene(s, blocks));
      const totalBlocks = actBlocks.length || 1;
      const dialogueCount = actBlocks.filter((b) => b.type === "dialogue").length;
      const actionCount = actBlocks.filter((b) => b.type === "action").length;

      const actChars = actS.flatMap((s) => extractCharactersFromBlocks(getBlocksForScene(s, blocks)));
      const introduced: string[] = [];
      actChars.forEach((c) => {
        if (!seenCharsGlobal.has(c)) {
          seenCharsGlobal.add(c);
          introduced.push(c);
        }
      });

      const longest = actS.reduce<{ number: string; pages: number } | null>((best, s) => {
        if (!best || s.pages > best.pages) return { number: s.number, pages: s.pages };
        return best;
      }, null);

      return {
        act, label, color, bgColor, borderColor,
        scenes: actS,
        startPage, endPage,
        pageCount: actPages,
        dialogueRatio: dialogueCount / totalBlocks,
        actionRatio: actionCount / totalBlocks,
        charactersIntroduced: introduced,
        longestScene: longest,
      };
    });

    const plotPointDefs: Array<{ name: string; pct: number }> = [
      { name: "Inciting Incident", pct: 0.1 },
      { name: "First Plot Point", pct: 0.25 },
      { name: "Midpoint", pct: 0.5 },
      { name: "Second Plot Point", pct: 0.75 },
      { name: "Climax", pct: 0.9 },
    ];

    const plotPoints: PlotPoint[] = plotPointDefs.map(({ name, pct }) => {
      const expectedPage = Math.round(totalPages * pct);
      const actualScene = findSceneAtPage(scenes, expectedPage);
      const sceneObj = scenes.find((s) => s.number === actualScene);
      let actualPage = 0;
      for (const s of scenes) {
        actualPage += s.pages;
        if (s.number === actualScene) break;
      }
      return {
        name,
        expectedPct: pct,
        expectedPage,
        actualScene,
        deviation: sceneObj ? Math.abs(actualPage - expectedPage) : 0,
      };
    });

    // Protagonist detection
    const charWords = new Map<string, [number, number, number]>();
    let currentChar: string | null = null;
    let currentSceneAct: 1 | 2 | 3 = 1;

    blocks.forEach((b) => {
      if (b.type === "scene_heading") {
        const match = sceneWithCum.find(({ scene }) => scene.blockIds.includes(b.id));
        if (match) currentSceneAct = match.act;
      } else if (b.type === "character") {
        currentChar = b.text.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
      } else if (b.type === "dialogue" && currentChar) {
        const words = b.text.split(/\s+/).filter(Boolean).length;
        if (!charWords.has(currentChar)) charWords.set(currentChar, [0, 0, 0]);
        const arr = charWords.get(currentChar)!;
        arr[currentSceneAct - 1] += words;
      } else if (b.type !== "parenthetical") {
        currentChar = null;
      }
    });

    let protagonist = { name: "Unknown", totalWords: 0, byAct: [0, 0, 0] as [number, number, number] };
    charWords.forEach((byAct, name) => {
      const total = byAct[0] + byAct[1] + byAct[2];
      if (total > protagonist.totalWords) {
        protagonist = { name, totalWords: total, byAct };
      }
    });

    // Structure Score
    let score = 0;
    const act1Pct = acts[0].pageCount / totalPages;
    const act2Pct = acts[1].pageCount / totalPages;
    const act3Pct = acts[2].pageCount / totalPages;

    if (act1Pct >= 0.2 && act1Pct <= 0.3) score += 25;
    else score += Math.max(0, 25 - Math.round(Math.abs(act1Pct - 0.25) * 100));

    if (act2Pct >= 0.4 && act2Pct <= 0.6) score += 25;
    else score += Math.max(0, 25 - Math.round(Math.abs(act2Pct - 0.5) * 100));

    if (act3Pct >= 0.15 && act3Pct <= 0.3) score += 25;
    else score += Math.max(0, 25 - Math.round(Math.abs(act3Pct - 0.225) * 100));

    if (acts.every((a) => a.scenes.length >= 3)) score += 15;
    else score += Math.round(15 * (acts.filter((a) => a.scenes.length >= 3).length / 3));

    if (protagonist.byAct.every((w) => w > 0)) score += 10;
    else score += Math.round(10 * (protagonist.byAct.filter((w) => w > 0).length / 3));

    score = Math.min(100, Math.max(0, score));

    // Suggestions
    const suggestions: string[] = [];
    if (act1Pct < 0.2) suggestions.push("Act 1 (Setup) is shorter than typical. Consider adding more character introduction or world-building scenes.");
    if (act1Pct > 0.3) suggestions.push("Act 1 (Setup) runs long. Consider tightening the opening to reach the first plot point sooner.");
    if (act2Pct < 0.4) suggestions.push("Act 2 (Confrontation) is short. The main conflict may need more development and obstacles.");
    if (act2Pct > 0.6) suggestions.push("Act 2 (Confrontation) is lengthy. Consider splitting or tightening the middle section to maintain pacing.");
    if (act3Pct < 0.15) suggestions.push("Act 3 (Resolution) feels rushed. Consider expanding the climax or resolution.");
    if (act3Pct > 0.3) suggestions.push("Act 3 (Resolution) is longer than typical. Ensure the ending remains tight and impactful.");
    if (acts.some((a) => a.scenes.length < 3)) suggestions.push(`Consider adding more scenes to ${acts.filter((a) => a.scenes.length < 3).map((a) => `Act ${a.act}`).join(" and ")}.`);
    if (protagonist.byAct[2] > 0 && protagonist.byAct[1] > 0 && protagonist.byAct[2] < protagonist.byAct[1] * 0.5) {
      suggestions.push(`Protagonist (${protagonist.name}) dialogue drops significantly in Act 3. Consider whether this is intentional or a pacing issue.`);
    }
    if (protagonist.byAct[0] === 0) suggestions.push(`Protagonist (${protagonist.name}) has no dialogue in Act 1. Consider introducing them earlier.`);
    if (suggestions.length === 0) suggestions.push("The script structure follows a well-balanced three-act pattern. No major structural concerns detected.");

    // Pacing data
    const pacing = sceneWithCum.map(({ scene, act }) => ({
      sceneNumber: scene.number,
      pages: scene.pages,
      act,
    }));

    return { totalPages, acts, plotPoints, protagonist, score, suggestions, pacing, sceneWithCum };
  }, [script]);

  function toggleAct(act: number) {
    setExpandedActs((prev) => {
      const next = new Set(prev);
      if (next.has(act)) next.delete(act);
      else next.add(act);
      return next;
    });
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Brain className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-1">No scenes to analyse</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Add scenes to the script to generate a three-act structure analysis. The analysis engine needs at least one scene with page data.
        </p>
      </div>
    );
  }

  const { totalPages, acts, plotPoints, protagonist, score, suggestions, pacing } = analysis;
  const maxPacingPages = Math.max(...pacing.map((p) => p.pages), 1);

  const scoreColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const scoreBg = score >= 80 ? "bg-emerald-500/10 border-emerald-500/30" : score >= 60 ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-500" />
            Three-Act Structure Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Structural breakdown of {totalPages} pages across {script.scenes.length} scenes
          </p>
        </div>
        <Badge variant="outline" className="text-xs gap-1.5 self-start">
          <Target className="h-3 w-3" />
          Rule-based structural analysis
        </Badge>
      </div>

      {/* Three-Act Color Bar */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">Structure Overview</h3>
        <div className="relative">
          <div className="flex h-8 rounded-lg overflow-hidden">
            {acts.map((a) => {
              const widthPct = totalPages > 0 ? (a.pageCount / totalPages) * 100 : 33;
              return (
                <div
                  key={a.act}
                  className={`${a.color} flex items-center justify-center text-xs font-bold text-white`}
                  style={{ width: `${widthPct}%` }}
                >
                  Act {a.act} ({Math.round(widthPct)}%)
                </div>
              );
            })}
          </div>
          {/* Plot point markers */}
          <div className="relative h-5 mt-1">
            {plotPoints.map((pp) => (
              <div
                key={pp.name}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pp.expectedPct * 100}%` }}
              >
                <div className="w-2 h-2 rounded-full bg-foreground border border-background" />
                <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-0.5 hidden sm:block">{pp.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score + Protagonist row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Structure Score */}
        <div className={`rounded-xl border p-5 ${scoreBg}`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Structure Score
          </h3>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${scoreBg}`}>
              <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {score >= 80 ? "Well structured" : score >= 60 ? "Mostly balanced" : "Needs attention"}
              </p>
              <p className="text-xs mt-1">
                Based on act proportions, scene distribution and protagonist presence.
              </p>
            </div>
          </div>
        </div>

        {/* Protagonist */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            Protagonist
          </h3>
          {protagonist.totalWords > 0 ? (
            <div>
              <p className="font-bold text-lg">{protagonist.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{protagonist.totalWords} spoken words</p>
              <div className="space-y-1.5">
                {["Act 1", "Act 2", "Act 3"].map((label, idx) => {
                  const maxW = Math.max(...protagonist.byAct, 1);
                  const pct = (protagonist.byAct[idx] / maxW) * 100;
                  const colors = ["bg-blue-500", "bg-amber-500", "bg-emerald-500"];
                  return (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className="w-10 text-muted-foreground">{label}</span>
                      <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
                        <div className={`h-full rounded-full ${colors[idx]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-12 text-right font-mono">{protagonist.byAct[idx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dialogue detected to determine protagonist.</p>
          )}
        </div>
      </div>

      {/* Act Breakdown Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {acts.map((a) => (
          <div key={a.act} className={`rounded-xl border p-5 ${a.bgColor} ${a.borderColor}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Act {a.act}</p>
                <p className="font-bold text-lg">{a.label}</p>
              </div>
              <div className={`w-8 h-8 rounded-full ${a.color} flex items-center justify-center text-white text-sm font-bold`}>
                {a.act}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-medium">{a.startPage}–{a.endPage} ({a.pageCount} pg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scenes</span>
                <span className="font-medium">{a.scenes.length}</span>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Dialogue</span>
                  <span className="font-mono text-xs">{Math.round(a.dialogueRatio * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div className={`h-full rounded-full ${a.color}`} style={{ width: `${a.dialogueRatio * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Action</span>
                  <span className="font-mono text-xs">{Math.round(a.actionRatio * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div className={`h-full rounded-full ${a.color} opacity-60`} style={{ width: `${a.actionRatio * 100}%` }} />
                </div>
              </div>
              {a.longestScene && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longest</span>
                  <span className="font-medium">Sc. {a.longestScene.number} ({a.longestScene.pages} pg)</span>
                </div>
              )}
              {a.charactersIntroduced.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground mb-1">Characters introduced:</p>
                  <div className="flex flex-wrap gap-1">
                    {a.charactersIntroduced.slice(0, 6).map((c) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 font-medium">{c}</span>
                    ))}
                    {a.charactersIntroduced.length > 6 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">+{a.charactersIntroduced.length - 6}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pacing Chart */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-500" />
          Scene Pacing
        </h3>
        <div className="flex items-end gap-[2px] h-32 overflow-x-auto pb-1">
          {pacing.map((p, i) => {
            const heightPct = (p.pages / maxPacingPages) * 100;
            const actColors = { 1: "bg-blue-500", 2: "bg-amber-500", 3: "bg-emerald-500" };
            return (
              <div key={i} className="group relative flex-1 min-w-[6px] max-w-[24px] flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t ${actColors[p.act]} transition-opacity group-hover:opacity-80`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-2 py-1 text-[10px] font-mono whitespace-nowrap shadow-lg z-10">
                  Sc. {p.sceneNumber} — {p.pages} pg
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Act 1</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Act 2</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Act 3</span>
        </div>
      </div>

      {/* Plot Points */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-500" />
          Key Plot Points
        </h3>
        <div className="space-y-2">
          {plotPoints.map((pp) => (
            <div key={pp.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 text-sm">
              <Target className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{pp.name}</span>
                <span className="text-muted-foreground ml-2">at page {pp.expectedPage}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">Sc. {pp.actualScene}</span>
              {pp.deviation > 2 && (
                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                  {pp.deviation} pg off
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Observations & Suggestions
        </h3>
        <div className="space-y-2">
          {suggestions.map((s, i) => {
            const isPositive = s.includes("well-balanced") || s.includes("No major");
            return (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${isPositive ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-amber-500/5 border border-amber-500/20"}`}>
                {isPositive ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <p className="text-muted-foreground">{s}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenes by Act (accordion) */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-500" />
          Scenes by Act
        </h3>
        <div className="space-y-2">
          {acts.map((a) => {
            const isOpen = expandedActs.has(a.act);
            return (
              <div key={a.act} className={`rounded-lg border ${a.borderColor}`}>
                <button
                  onClick={() => toggleAct(a.act)}
                  className={`w-full flex items-center gap-3 p-3 text-left text-sm font-medium ${a.bgColor} rounded-t-lg`}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className={`w-6 h-6 rounded-full ${a.color} text-white text-xs flex items-center justify-center font-bold`}>{a.act}</span>
                  <span>Act {a.act} — {a.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{a.scenes.length} scenes · {a.pageCount} pages</span>
                </button>
                {isOpen && (
                  <div className="divide-y">
                    {a.scenes.map((scene) => (
                      <div key={scene.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="font-mono font-bold text-xs text-primary w-12">Sc. {scene.number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{scene.intExt}. {scene.heading} — {scene.timeOfDay}</p>
                          <p className="text-xs text-muted-foreground truncate">{scene.location || "No location"} · {scene.pages} pg</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{scene.status}</Badge>
                      </div>
                    ))}
                    {a.scenes.length === 0 && (
                      <p className="px-4 py-3 text-sm text-muted-foreground">No scenes in this act.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* User Notes */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          Analysis Notes
        </h3>
        <Textarea
          placeholder="Add your own analysis notes, observations, or story development ideas..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="text-sm"
        />
        <p className="text-[10px] text-muted-foreground mt-2">Notes are stored locally in this session and are not persisted.</p>
      </div>
    </section>
  );
}
