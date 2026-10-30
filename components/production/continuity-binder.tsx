"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  Plus,
  Scissors,
  Search,
  Shirt,
  Sparkles,
  Tag,
  User,
  Wand2,
  X,
  Zap,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/lib/project-store";

export interface ContinuityEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  characterName: string;
  actorName: string;
  sceneNumber: string;
  shootDayNumber: number;
  date: string;
  blockTitle: string;
  wardrobeStage: string;
  hairMakeupNotes: string;
  propsInHand: string;
  cameraSpecs: string;
  beforeImageUrl: string;
  beforeLabel: string;
  afterImageUrl: string;
  afterLabel: string;
  status: "verified" | "flagged" | "pending-check";
  supervisorNotes: string;
}

const demoContinuityEntries: ContinuityEntry[] = [
  {
    id: "cont-1",
    projectId: "p1",
    projectTitle: "Pushpa 2: The Rule",
    characterName: "Pushpa Raj",
    actorName: "Allu Arjun",
    sceneNumber: "Sc. 18",
    shootDayNumber: 14,
    date: "2024-09-04",
    blockTitle: "Jathara Climax Temple Faceoff",
    wardrobeStage: "Jathara Festival Attire: Heavy indigo printed dhoti, vermillion crimson chest paste; gold tiger-claw pendant.",
    hairMakeupNotes: "Seshachalam mud and holy sindoor blend; thick rugged beard styled with left-side lock; intense bloodshot stare.",
    propsInHand: "Ceremonial bronze trident in right hand; sacred yellow lemon garland draped over left wrist.",
    cameraSpecs: "ARRI Alexa 35 · 35mm Master Anamorphic · T2.8 · 5600K key light with swirling smoke filters.",
    beforeImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80",
    beforeLabel: "Day 14 (Principal Shoot)",
    afterImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    afterLabel: "Day 31 (Reverse Coverage)",
    status: "verified",
    supervisorNotes: "Checked against Day 14 wrap photo. Sindoor streak alignment and tiger-claw amulet height match accurately.",
  },
  {
    id: "cont-2",
    projectId: "p1",
    projectTitle: "Pushpa 2: The Rule",
    characterName: "Srivalli",
    actorName: "Rashmika Mandanna",
    sceneNumber: "Sc. 12",
    shootDayNumber: 11,
    date: "2024-09-02",
    blockTitle: "Pushpa Raj Estate Courtyard",
    wardrobeStage: "Traditional South Chittoor silk green pattu saree with gold zari border; traditional bridal waist belt (vaddanam).",
    hairMakeupNotes: "Jasmine flower veni in long plaited braid; vermillion bindi; soft warm South Indian bridal makeup.",
    propsInHand: "Brass aarti plate with burning camphor in right hand; fresh betel leaf offering in left.",
    cameraSpecs: "Sony FX6 B-cam · 50mm Prime · T2.0 · Low angle 3ft height warm fill.",
    beforeImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
    beforeLabel: "Take 2 Reference",
    afterImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
    afterLabel: "Reverse Close-Up Coverage",
    status: "verified",
    supervisorNotes: "Saree pallu pleats count and jasmine veni placement verified across both camera setups.",
  },
  {
    id: "cont-3",
    projectId: "p2",
    projectTitle: "Kalki 2898 AD",
    characterName: "Bhairava",
    actorName: "Prabhas",
    sceneNumber: "Sc. 5",
    shootDayNumber: 22,
    date: "2024-05-18",
    blockTitle: "Complex Sector 4 Infiltration",
    wardrobeStage: "Dystopian Scavenger Armor: Distressed dark ballistic harness, articulated knee guards, neural comms gauntlet.",
    hairMakeupNotes: "Desert dust smudge 60%; combat scratches on right jawline; weathered post-apocalyptic skin tone.",
    propsInHand: "Custom Bujji remote ignition key-card in left hand; sonic bounty disruptor rifle holstered on back.",
    cameraSpecs: "RED V-Raptor XL · 24mm Cooke S8/i · Dystopian amber practical lighting.",
    beforeImageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80",
    beforeLabel: "Platform Master Take",
    afterImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
    afterLabel: "Close-up Cockpit Take",
    status: "verified",
    supervisorNotes: "Comms gauntlet wire harness route and cheek dust consistency approved by script supervisor.",
  },
  {
    id: "cont-4",
    projectId: "p5",
    projectTitle: "They Call Him OG",
    characterName: "OG / Ojas Gambheera",
    actorName: "Pawan Kalyan",
    sceneNumber: "Sc. 27",
    shootDayNumber: 38,
    date: "2024-08-15",
    blockTitle: "Mumbai Docks Container Showdown",
    wardrobeStage: "Matte black oversized Japanese neo-noir trenchcoat over charcoal turtleneck; leather gloves.",
    hairMakeupNotes: "Rain-drenched hair; subtle blood graze on left temple; intense underworld gaze.",
    propsInHand: "Custom black steel Katana sword in left scabbard; tactical storm lighter in right pocket.",
    cameraSpecs: "ARRI Alexa LF · 40mm Vintage Anamorphic · High-contrast night rain neon illumination.",
    beforeImageUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=900&q=80",
    beforeLabel: "Day 38 Exterior Docks",
    afterImageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80",
    afterLabel: "Interior Container Wrap",
    status: "verified",
    supervisorNotes: "Trenchcoat collar pop height and Katana blade blood splatter orientation confirmed across all takes.",
  },
];

export function ContinuityBinder({ projectId }: { projectId?: string }) {
  const projects = useProjects();
  const [entries, setEntries] = useState<ContinuityEntry[]>(demoContinuityEntries);
  const [selectedEntryId, setSelectedEntryId] = useState<string>(demoContinuityEntries[0].id);
  const [characterFilter, setCharacterFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='320'%3E%3Crect width='100%25' height='100%25' fill='%23272a31'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white'%3ENo reference image%3C/text%3E%3C/svg%3E";
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem("showrunner-continuity-v1") ?? "null");
      if (Array.isArray(stored)) setEntries(stored.filter((entry) => entry && typeof entry === "object" && ["id", "projectId", "projectTitle", "characterName", "actorName", "sceneNumber", "blockTitle", "wardrobeStage", "hairMakeupNotes", "propsInHand", "cameraSpecs", "beforeImageUrl", "beforeLabel", "afterImageUrl", "afterLabel", "supervisorNotes"].every((field) => typeof entry[field] === "string") && ["verified", "flagged", "pending-check"].includes(entry.status)));
    } catch { setMessage("Saved continuity cards could not be read. Demo examples are shown."); }
    setReady(true);
  }, []);

  function saveEntries(next: ContinuityEntry[]) {
    try {
      localStorage.setItem("showrunner-continuity-v1", JSON.stringify(next));
      setEntries(next);
      setMessage("Continuity cards saved in this browser.");
      return true;
    } catch {
      setMessage("Could not save: browser storage is unavailable or full.");
      return false;
    }
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const projMatch = !projectId || item.projectId === projectId;
      const charMatch = characterFilter === "all" || item.characterName === characterFilter;
      const queryMatch =
        `${item.characterName} ${item.actorName} ${item.sceneNumber} ${item.blockTitle} ${item.wardrobeStage}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return projMatch && charMatch && queryMatch;
    });
  }, [entries, projectId, characterFilter, query]);

  const selectedEntry =
    filteredEntries.find((e) => e.id === selectedEntryId) ?? filteredEntries[0];

  const uniqueCharacters = useMemo(() => {
    const set = new Set<string>();
    entries.filter((entry) => !projectId || entry.projectId === projectId).forEach((e) => set.add(e.characterName));
    return Array.from(set);
  }, [entries, projectId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">On-Set Digital Continuity Binder</h2>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
              Browser-local records
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Side-by-side continuity references. Preloaded cards are fictional demo examples with stock photos, not verified production evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={!ready || !projects.length}
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground gap-1.5 shadow-sm text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add Continuity Card
          </Button>
        </div>
        {message && <p role="status" className="rounded border bg-muted p-3 text-sm">{message}</p>}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scene, character, wardrobe..."
              className="h-9 pl-8 text-xs w-56 sm:w-64"
            />
          </div>

          <select
            value={characterFilter}
            onChange={(e) => setCharacterFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-xs focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Characters</option>
            {uniqueCharacters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredEntries.length}</span> continuity records
        </div>
      </div>

      {/* Main Two-Column Continuity Workspace */}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left Column: Continuity Records Roster */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Continuity Match Cards
          </p>

          <div className="space-y-2.5">
            {filteredEntries.length === 0 && <p className="rounded border p-5 text-sm text-muted-foreground">No continuity cards match this project and filters.</p>}
            {filteredEntries.map((item) => {
              const isSelected = selectedEntry?.id === item.id;
              return (
                <Card
                  key={item.id}
                  onClick={() => setSelectedEntryId(item.id)}
                  className={`cursor-pointer transition-all border rounded-xl overflow-hidden hover:border-primary/50 ${
                    isSelected ? "ring-2 ring-primary border-primary bg-primary/[.04]" : "bg-card"
                  }`}
                >
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold rounded bg-black/40 px-1.5 py-0.5 border border-white/10">
                          {item.sceneNumber}
                        </span>
                        <span className="font-bold text-sm text-foreground leading-tight">
                          {item.characterName}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${
                          item.status === "verified"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : item.status === "flagged"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <p className="text-xs font-medium text-muted-foreground truncate">
                      {item.projectTitle} · Day {item.shootDayNumber}
                    </p>

                    {/* Dual thumbnail preview */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="relative h-20 rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={item.beforeImageUrl || placeholderImage}
                          alt={item.beforeLabel}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] px-1 py-0.2 rounded text-white backdrop-blur-xs">
                          {item.beforeLabel}
                        </span>
                      </div>
                      <div className="relative h-20 rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={item.afterImageUrl || placeholderImage}
                          alt={item.afterLabel}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] px-1 py-0.2 rounded text-white backdrop-blur-xs">
                          {item.afterLabel}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic pt-1 border-t border-border/40">
                      {item.wardrobeStage}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Side-by-Side Inspector & Specs */}
        {selectedEntry && (
          <div className="space-y-6">
            <Card className="border shadow-md overflow-hidden bg-card/95">
              <CardHeader className="border-b pb-4 bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{selectedEntry.characterName}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({selectedEntry.actorName})
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedEntry.sceneNumber}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {projects.find((project) => project.id === selectedEntry.projectId)?.title ?? selectedEntry.projectTitle} · Shoot Day {selectedEntry.shootDayNumber} · {selectedEntry.blockTitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                        selectedEntry.status === "verified"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {selectedEntry.status}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-6">
                {/* Visual Side-by-Side Shot Comparison Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-primary" /> Visual Shot Match (Before vs After)
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      Comparing: <span className="font-semibold text-foreground">{selectedEntry.beforeLabel}</span> ↔ <span className="font-semibold text-foreground">{selectedEntry.afterLabel}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before Angle */}
                    <div className="rounded-xl border overflow-hidden bg-black/60 shadow-inner">
                      <div className="relative h-64 sm:h-72 w-full">
                        <img
                          src={selectedEntry.beforeImageUrl || placeholderImage}
                          alt={selectedEntry.beforeLabel}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-xs font-bold text-white border border-white/10">
                          {selectedEntry.beforeLabel}
                        </div>
                        <a
                          href={/^https?:\/\//i.test(selectedEntry.beforeImageUrl) ? selectedEntry.beforeImageUrl : undefined}
                          aria-label="Open before reference image"
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2.5 right-2.5 rounded-full bg-black/70 p-1.5 text-white/80 hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <div className="p-2.5 text-[11px] text-muted-foreground bg-muted/30">
                        Camera Angle: Master Setup · Reference Frame
                      </div>
                    </div>

                    {/* After Angle / Pickup */}
                    <div className="rounded-xl border overflow-hidden bg-black/60 shadow-inner">
                      <div className="relative h-64 sm:h-72 w-full">
                        <img
                          src={selectedEntry.afterImageUrl || placeholderImage}
                          alt={selectedEntry.afterLabel}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute top-2.5 left-2.5 bg-amber-500/90 px-2 py-0.5 rounded text-xs font-bold text-black border border-white/10">
                          {selectedEntry.afterLabel}
                        </div>
                        <a
                          href={/^https?:\/\//i.test(selectedEntry.afterImageUrl) ? selectedEntry.afterImageUrl : undefined}
                          aria-label="Open after reference image"
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2.5 right-2.5 rounded-full bg-black/70 p-1.5 text-white/80 hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <div className="p-2.5 text-[11px] text-muted-foreground bg-muted/30">
                        Camera Angle: Reverse Insert / Match Frame
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continuity Check Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wardrobe & Costume */}
                  <div className="rounded-xl border p-4 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <Shirt className="h-4 w-4" /> Wardrobe & Dirt / Blood Stage
                    </div>
                    <p className="text-xs text-foreground leading-relaxed pt-1">
                      {selectedEntry.wardrobeStage}
                    </p>
                  </div>

                  {/* Hair & Makeup */}
                  <div className="rounded-xl border p-4 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <Scissors className="h-4 w-4" /> Hair, Makeup & Wounds
                    </div>
                    <p className="text-xs text-foreground leading-relaxed pt-1">
                      {selectedEntry.hairMakeupNotes}
                    </p>
                  </div>

                  {/* Props & Accessories */}
                  <div className="rounded-xl border p-4 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <Sparkles className="h-4 w-4" /> Props & Jewelry in Hand
                    </div>
                    <p className="text-xs text-foreground leading-relaxed pt-1">
                      {selectedEntry.propsInHand}
                    </p>
                  </div>

                  {/* Camera & Lighting Continuity */}
                  <div className="rounded-xl border p-4 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <Camera className="h-4 w-4" /> Technical Camera & Lighting Specs
                    </div>
                    <p className="text-xs text-foreground leading-relaxed pt-1">
                      {selectedEntry.cameraSpecs}
                    </p>
                  </div>
                </div>

                {/* Script Supervisor Log Note */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Script Supervisor Review Log
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    &ldquo;{selectedEntry.supervisorNotes}&rdquo;
                  </p>
                </div>

                {/* Quick Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    disabled={!ready}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      saveEntries(
                        entries.map((e) =>
                          e.id === selectedEntry.id
                            ? { ...e, status: e.status === "verified" ? "flagged" : "verified" }
                            : e
                        )
                      );
                    }}
                  >
                    Toggle Flag / Verify
                  </Button>
                  <Button
                    size="sm"
                    disabled={!ready}
                    className="bg-primary text-primary-foreground text-xs"
                    onClick={() => saveEntries(entries.map((entry) => entry.id === selectedEntry.id ? { ...entry, status: "verified", supervisorNotes: `${entry.supervisorNotes}\nMarked verified locally on ${new Date().toLocaleString()}.` } : entry))}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Mark verified
                  </Button>
                  <Button variant="destructive" size="icon" aria-label="Delete continuity card" disabled={!ready} onClick={() => { if (window.confirm("Delete this continuity card?")) saveEntries(entries.filter((entry) => entry.id !== selectedEntry.id)); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Continuity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Add Scene Continuity Log</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              className="space-y-3 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const selectedProject = projects.find((project) => project.id === (projectId ?? String(form.get("projectId"))));
                const characterName = String(form.get("characterName") ?? "").trim();
                const sceneNumber = String(form.get("sceneNumber") ?? "").trim();
                const wardrobeStage = String(form.get("wardrobeStage") ?? "").trim();
                if (!selectedProject || !characterName || !sceneNumber || !wardrobeStage) { setMessage("Project, character, scene number and wardrobe notes are required."); return; }
                const entry: ContinuityEntry = {
                  id: `continuity-${crypto.randomUUID()}`, projectId: selectedProject.id, projectTitle: selectedProject.title,
                  characterName, actorName: String(form.get("actorName") ?? "").trim(), sceneNumber,
                  shootDayNumber: Number(form.get("shootDayNumber")), date: new Date().toLocaleDateString("en-CA"),
                  blockTitle: "Continuity log", wardrobeStage, hairMakeupNotes: "Not recorded",
                  propsInHand: String(form.get("props") ?? "").trim(), cameraSpecs: "Not recorded",
                  beforeImageUrl: String(form.get("beforeImageUrl") ?? "").trim(), beforeLabel: "Before reference",
                  afterImageUrl: String(form.get("afterImageUrl") ?? "").trim(), afterLabel: "After reference",
                  status: "pending-check", supervisorNotes: "Awaiting supervisor review.",
                };
                if ([entry.beforeImageUrl, entry.afterImageUrl].some((url) => url && !/^https?:\/\//i.test(url))) { setMessage("Reference images must use HTTP or HTTPS URLs."); return; }
                if (saveEntries([entry, ...entries])) { setSelectedEntryId(entry.id); setCharacterFilter("all"); setQuery(""); setShowAddModal(false); }
              }}
            >
              {!projectId && <label className="block">Project<select name="projectId" required className="mt-1 w-full rounded border bg-background p-2"><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}
              <div>
                <label className="block font-semibold mb-1">Character Name</label>
                <Input name="characterName" placeholder="Character name" required className="h-8 text-xs" />
              </div>
              <Input name="actorName" aria-label="Actor name" placeholder="Actor name (optional)" className="h-8 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Scene Number</label>
                  <Input name="sceneNumber" placeholder="e.g. Sc. 44" required className="h-8 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Shoot Day</label>
                  <Input name="shootDayNumber" type="number" min="1" step="1" defaultValue="1" required className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Wardrobe / Dirt Stage Notes</label>
                <Input name="wardrobeStage" placeholder="e.g. Stage 2 blood splatter on collar" required className="h-8 text-xs" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Props & Continuity Details</label>
                <Input name="props" placeholder="e.g. Hero axe in right hand, watch on left wrist" className="h-8 text-xs" />
              </div>
              <Input name="beforeImageUrl" type="url" aria-label="Before reference image URL" placeholder="Before image URL (optional)" className="h-8 text-xs" />
              <Input name="afterImageUrl" type="url" aria-label="After reference image URL" placeholder="After image URL (optional)" className="h-8 text-xs" />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Save Continuity Card
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
