"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Clapperboard,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Plus,
  Minus,
  X,
  Film,
  Camera,
  Sun,
  Moon,
  Mic,
  MicOff,
  Download,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Layers,
  Video,
  Compass,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useProjects } from "@/lib/project-store";
import { useScenesByProject } from "@/lib/scene-store";

interface DigitalClapperboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultProjectTitle?: string;
  defaultDirector?: string;
}

interface TakeLogItem {
  id: string;
  project: string;
  scene: string;
  sceneHeading?: string;
  take: number;
  roll: string;
  cameraUnit: string;
  timecode: string;
  fps: string;
  soundMode?: "SYNC" | "MOS";
  timeOfDay?: "DAY" | "NIGHT";
  setting?: "EXT" | "INT";
  filter?: string;
  timestamp: string;
  status: "circle" | "good" | "ng" | "hold";
  notes: string;
}

const TAKE_LOG_STORAGE_PREFIX = "flowbender.slate.takeLogs.v1";

const defaultTakeLogs: TakeLogItem[] = [
  {
    id: "log-1",
    project: "Pushpa 2: The Rule",
    scene: "14 A",
    sceneHeading: "EXT. RED SANDALWOOD FOREST - DAY",
    take: 1,
    roll: "A 01",
    cameraUnit: "A-CAM",
    timecode: "01:14:22:15",
    fps: "24.00",
    timestamp: "10:15 AM",
    status: "good",
    notes: "Establishing wide profile shot",
  },
  {
    id: "log-2",
    project: "Pushpa 2: The Rule",
    scene: "14 A",
    sceneHeading: "EXT. RED SANDALWOOD FOREST - DAY",
    take: 2,
    roll: "A 01",
    cameraUnit: "A-CAM",
    timecode: "01:18:45:02",
    fps: "24.00",
    timestamp: "10:22 AM",
    status: "circle",
    notes: "Director chosen circle take (Print / Master)",
  },
];

function getTakeLogStorageKey(projectId: string) {
  return `${TAKE_LOG_STORAGE_PREFIX}:${projectId}`;
}

function isTakeLogItem(value: unknown): value is TakeLogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TakeLogItem>;
  return (
    typeof item.id === "string" &&
    typeof item.project === "string" &&
    typeof item.scene === "string" &&
    (item.sceneHeading === undefined || typeof item.sceneHeading === "string") &&
    typeof item.take === "number" &&
    typeof item.roll === "string" &&
    typeof item.cameraUnit === "string" &&
    typeof item.timecode === "string" &&
    typeof item.fps === "string" &&
    (item.soundMode === undefined || item.soundMode === "SYNC" || item.soundMode === "MOS") &&
    (item.timeOfDay === undefined || item.timeOfDay === "DAY" || item.timeOfDay === "NIGHT") &&
    (item.setting === undefined || item.setting === "EXT" || item.setting === "INT") &&
    (item.filter === undefined || typeof item.filter === "string") &&
    typeof item.timestamp === "string" &&
    (item.status === "circle" || item.status === "good" || item.status === "ng" || item.status === "hold") &&
    typeof item.notes === "string"
  );
}

// Authentic Telugu & Indian feature film technical camera packages
const filmCameraProfiles: Record<
  string,
  {
    dop: string;
    camera: string;
    lens: string;
    studio: string;
  }
> = {
  "Pushpa 2: The Rule": {
    dop: "Mirosław Brożek",
    camera: "ARRI Alexa 35",
    lens: "ARRI Rental DNA 35mm",
    studio: "Mythri Movie Makers",
  },
  "Kalki 2898 AD": {
    dop: "Djordje Stojiljkovic",
    camera: "ARRI Alexa 65 Large Format",
    lens: "Hasselblad Prime DNA",
    studio: "Vyjayanthi Movies",
  },
  "Devara: Part 1": {
    dop: "R. Rathnavelu (Randy)",
    camera: "RED V-Raptor XL 8K",
    lens: "Cooke /i Anamorphic SF",
    studio: "Yuvasudha Arts",
  },
  "Game Changer": {
    dop: "S. Thirunavukkarasu",
    camera: "Sony VENICE 2 8K",
    lens: "Zeiss Supreme Prime Radiance",
    studio: "Sri Venkateswara Creations",
  },
  "They Call Him OG": {
    dop: "Ravi K. Chandran",
    camera: "ARRI Alexa Mini LF",
    lens: "Hawk V-Lite Anamorphic 2x",
    studio: "DVV Entertainment",
  },
  "HIT: The Third Case": {
    dop: "Sanu John Varghese",
    camera: "ARRI Alexa Mini LF",
    lens: "Leitz SUMMILUX-C",
    studio: "Wall Poster Cinema",
  },
  "The Raja Saab": {
    dop: "Karthik Palani",
    camera: "RED Monstro 8K VV",
    lens: "Atlas Orion Anamorphic",
    studio: "People Media Factory",
  },
};

// Web Audio synthesis for authentic wooden slate snap + 1000Hz sync pip
function playSlateSound(muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    // 1kHz Sync Beep (LTC Tone Pip)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    oscGain.gain.setValueAtTime(0.35, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);

    // Wooden Slate Snap (Resonant band-passed noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
  } catch {
    // Audio context prevented or unavailable
  }
}

interface SlateSceneOption {
  id: string;
  sceneNumber: string;
  heading: string;
  intExt: "INT" | "EXT";
  timeOfDay: "DAY" | "NIGHT";
}

const defaultProjectScenes: Record<string, SlateSceneOption[]> = {
  "Pushpa 2: The Rule": [
    { id: "p1-s1", sceneNumber: "1", heading: "EXT. CHARMINAR LANE - DAWN", intExt: "EXT", timeOfDay: "DAY" },
    { id: "p1-s2", sceneNumber: "2", heading: "INT. RADIO DECCAN STUDIO - MORNING", intExt: "INT", timeOfDay: "DAY" },
    { id: "p1-s11", sceneNumber: "11", heading: "EXT. TANK BUND - SUNSET", intExt: "EXT", timeOfDay: "NIGHT" },
    { id: "p1-s12", sceneNumber: "12", heading: "INT. IRANI CAFE - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
    { id: "p1-s14a", sceneNumber: "14 A", heading: "EXT. RED SANDALWOOD FOREST - DAY", intExt: "EXT", timeOfDay: "DAY" },
    { id: "p1-s14b", sceneNumber: "14 B", heading: "INT. SYNDICATE WAREHOUSE - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
    { id: "p1-s24", sceneNumber: "24", heading: "INT. SPECIAL POLICE HQ - DAY", intExt: "INT", timeOfDay: "DAY" },
    { id: "p1-s31", sceneNumber: "31", heading: "EXT. SESHACHALAM CHECKPOST - NIGHT", intExt: "EXT", timeOfDay: "NIGHT" },
  ],
  "Kalki 2898 AD": [
    { id: "p2-s1", sceneNumber: "1", heading: "EXT. KASI RUINS & BAZAAR - DUSK", intExt: "EXT", timeOfDay: "NIGHT" },
    { id: "p2-s4", sceneNumber: "4", heading: "INT. COMPLEX UPPER SANCTUM - DAY", intExt: "INT", timeOfDay: "DAY" },
    { id: "p2-s12", sceneNumber: "12", heading: "INT. BUJJIE COCKPIT - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
    { id: "p2-s28", sceneNumber: "28", heading: "EXT. SHAMBHALA REBEL GATE - DAY", intExt: "EXT", timeOfDay: "DAY" },
    { id: "p2-s45", sceneNumber: "45", heading: "INT. SUPREME YASKIN CHAMBER - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
  ],
  "Devara: Part 1": [
    { id: "p3-s1", sceneNumber: "1", heading: "EXT. RED SEA CLIFFS - NIGHT", intExt: "EXT", timeOfDay: "NIGHT" },
    { id: "p3-s3", sceneNumber: "3", heading: "INT. COASTAL TEMPLE SANCTUM - DAY", intExt: "INT", timeOfDay: "DAY" },
    { id: "p3-s8", sceneNumber: "8", heading: "EXT. SMUGGLING BOAT DECK - DUSK", intExt: "EXT", timeOfDay: "NIGHT" },
    { id: "p3-s14", sceneNumber: "14", heading: "INT. DEVARA STRONGHOLD - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
  ],
  "Game Changer": [
    { id: "p4-s1", sceneNumber: "1", heading: "INT. ELECTION COMMISSION WAR ROOM - DAY", intExt: "INT", timeOfDay: "DAY" },
    { id: "p4-s5", sceneNumber: "5", heading: "EXT. HYDERABAD SECRETARIAT - DAY", intExt: "EXT", timeOfDay: "DAY" },
    { id: "p4-s9", sceneNumber: "9", heading: "INT. CHIEF MINISTER BUNGALOW - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
    { id: "p4-s16", sceneNumber: "16", heading: "EXT. STADIUM RALLY - NIGHT", intExt: "EXT", timeOfDay: "NIGHT" },
  ],
  "They Call Him OG": [
    { id: "p5-s1", sceneNumber: "1", heading: "EXT. MUMBAI PORT DOCKS - NIGHT", intExt: "EXT", timeOfDay: "NIGHT" },
    { id: "p5-s6", sceneNumber: "6", heading: "INT. UNDERWORLD SAFE HOUSE - DAY", intExt: "INT", timeOfDay: "DAY" },
    { id: "p5-s11", sceneNumber: "11", heading: "EXT. MARINE DRIVE PROMENADE - DUSK", intExt: "EXT", timeOfDay: "NIGHT" },
    { id: "p5-s20", sceneNumber: "20", heading: "INT. OMI GANG HEADQUARTERS - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
  ],
  "HIT: The Third Case": [
    { id: "p6-s1", sceneNumber: "1", heading: "EXT. HIMALAYAN HIGHWAY - DAWN", intExt: "EXT", timeOfDay: "DAY" },
    { id: "p6-s4", sceneNumber: "4", heading: "INT. FORENSIC CRIME LAB - DAY", intExt: "INT", timeOfDay: "DAY" },
    { id: "p6-s9", sceneNumber: "9", heading: "INT. ABANDONED PAPER MILL - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
    { id: "p6-s15", sceneNumber: "15", heading: "EXT. MOUNTAIN VALLEY CRIME SCENE - NIGHT", intExt: "EXT", timeOfDay: "NIGHT" },
  ],
  "The Raja Saab": [
    { id: "p7-s1", sceneNumber: "1", heading: "EXT. VINTAGE PALACE COURTYARD - DUSK", intExt: "EXT", timeOfDay: "NIGHT" },
    { id: "p7-s3", sceneNumber: "3", heading: "INT. HAUNTED ROYAL BEDCHAMBER - NIGHT", intExt: "INT", timeOfDay: "NIGHT" },
    { id: "p7-s8", sceneNumber: "8", heading: "INT. GRAND BALLROOM - DAY", intExt: "INT", timeOfDay: "DAY" },
    { id: "p7-s12", sceneNumber: "12", heading: "EXT. PALACE LABYRINTH GARDEN - NIGHT", intExt: "EXT", timeOfDay: "NIGHT" },
  ],
};

export function DigitalClapperboardModal({
  open,
  onOpenChange,
  defaultProjectId,
  defaultProjectTitle,
  defaultDirector,
}: DigitalClapperboardModalProps) {
  const projects = useProjects();
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Active Project Selection
  const getDefaultProjectId = useCallback(() => {
    if (defaultProjectId) return defaultProjectId;
    if (defaultProjectTitle) {
      const match = projects.find((p) => p.title.toLowerCase() === defaultProjectTitle.toLowerCase());
      if (match) return match.id;
    }
    return projects[0]?.id || "p1";
  }, [defaultProjectId, defaultProjectTitle, projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(getDefaultProjectId);
  const defaultProjectContextRef = useRef({
    projectId: defaultProjectId,
    projectTitle: defaultProjectTitle,
  });

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Actual Scenes from the chosen project!
  const projectScenes = useScenesByProject(activeProject?.id || "p1");

  // Robust fallback scenes ensuring every project has both INT and EXT, DAY and NIGHT
  const availableScenes: SlateSceneOption[] = useMemo(() => {
    if (projectScenes && projectScenes.length > 0) {
      return projectScenes.map((s) => {
        const rawIntExt = (s.intExt || "").toUpperCase();
        const headingUpper = (s.heading || "").toUpperCase();
        const isInt = rawIntExt.includes("INT") || headingUpper.startsWith("INT");
        const rawTime = (s.timeOfDay || "").toUpperCase();
        const isNight = rawTime.includes("NIGHT") || rawTime.includes("DUSK") || rawTime.includes("EVENING");
        return {
          id: s.id,
          sceneNumber: s.sceneNumber,
          heading: s.heading,
          intExt: (isInt ? "INT" : "EXT") as "INT" | "EXT",
          timeOfDay: (isNight ? "NIGHT" : "DAY") as "DAY" | "NIGHT",
        };
      });
    }
    return defaultProjectScenes[activeProject?.title || ""] || defaultProjectScenes["Pushpa 2: The Rule"] || [];
  }, [projectScenes, activeProject?.title]);

  const [selectedSceneId, setSelectedSceneId] = useState<string>("");
  const initializedProjectIdRef = useRef<string | null>(null);

  // Slate Parameters
  const [production, setProduction] = useState("");
  const [director, setDirector] = useState("");
  const [camera, setCamera] = useState("");
  const [cameraUnit, setCameraUnit] = useState<"A-CAM" | "B-CAM" | "C-CAM" | "DRONE">("A-CAM");
  const [cameraModel, setCameraModel] = useState("ARRI Alexa 35");
  const [lens, setLens] = useState("35mm Anamorphic");
  const [roll, setRoll] = useState("A 01");
  const [scene, setScene] = useState("1");
  const [selectedSceneHeading, setSelectedSceneHeading] = useState("");
  const [take, setTake] = useState(1);
  const [fps, setFps] = useState<"23.976" | "24.00" | "25.00" | "29.97" | "30.00" | "60.00">("24.00");
  const [soundMode, setSoundMode] = useState<"SYNC" | "MOS">("SYNC");
  const [timeOfDay, setTimeOfDay] = useState<"DAY" | "NIGHT">("DAY");
  const [setting, setSetting] = useState<"EXT" | "INT">("EXT");
  const [filter, setFilter] = useState("ND .9");

  // Interactive State
  const [isClapping, setIsClapping] = useState(false);
  const [markFlash, setMarkFlash] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timecode, setTimecode] = useState("01:00:00:00");
  const [takeLogs, setTakeLogs] = useState<TakeLogItem[]>([]);
  const loadedTakeLogsProjectRef = useRef<string | null>(null);

  // Keep the modal aligned with the project context supplied by its caller,
  // while preserving an explicit project choice made inside the modal.
  useEffect(() => {
    const contextChanged =
      defaultProjectContextRef.current.projectId !== defaultProjectId ||
      defaultProjectContextRef.current.projectTitle !== defaultProjectTitle;
    if (!contextChanged) return;

    defaultProjectContextRef.current = {
      projectId: defaultProjectId,
      projectTitle: defaultProjectTitle,
    };
    const nextProjectId = getDefaultProjectId();
    setSelectedProjectId((currentProjectId) => {
      if (nextProjectId === currentProjectId) return currentProjectId;
      initializedProjectIdRef.current = null;
      return nextProjectId;
    });
  }, [defaultProjectId, defaultProjectTitle, getDefaultProjectId]);

  useEffect(() => {
    if (!selectedProjectId || typeof window === "undefined") return;

    let nextLogs = selectedProjectId === "p1" ? defaultTakeLogs : [];
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(getTakeLogStorageKey(selectedProjectId)) ?? "null");
      if (Array.isArray(stored) && stored.every(isTakeLogItem)) {
        nextLogs = stored;
      }
    } catch {
      console.error("Slate take logs could not be read from browser storage.");
    }

    loadedTakeLogsProjectRef.current = selectedProjectId;
    setTakeLogs(nextLogs);
  }, [selectedProjectId]);

  useEffect(() => {
    if (
      !selectedProjectId ||
      typeof window === "undefined" ||
      loadedTakeLogsProjectRef.current !== selectedProjectId
    ) {
      return;
    }

    try {
      localStorage.setItem(getTakeLogStorageKey(selectedProjectId), JSON.stringify(takeLogs));
    } catch {
      console.error("Slate take logs could not be saved to browser storage.");
    }
  }, [selectedProjectId, takeLogs]);

  // When project changes, initialize project profile and default scene ONCE per project
  // Never reset or overwrite manual user button toggles on interval re-renders!
  useEffect(() => {
    if (!activeProject) return;
    if (initializedProjectIdRef.current === activeProject.id) {
      return;
    }
    initializedProjectIdRef.current = activeProject.id;

    setProduction(activeProject.title);
    setDirector(activeProject.director || "Director");

    const profile = filmCameraProfiles[activeProject.title];
    if (profile) {
      setCamera(profile.dop);
      setCameraModel(profile.camera);
      setLens(profile.lens);
    } else {
      setCamera("Chief Cinematographer");
      setCameraModel("ARRI Alexa 35");
      setLens("35mm Prime");
    }

    // Initialize to first available scene of this project
    if (availableScenes.length > 0) {
      const firstScene = availableScenes[0];
      setSelectedSceneId(firstScene.id);
      setScene(firstScene.sceneNumber || "1");
      setSelectedSceneHeading(firstScene.heading || "");
      setSetting(firstScene.intExt);
      setTimeOfDay(firstScene.timeOfDay);
    }
  }, [activeProject, availableScenes]);

  // High-precision SMPTE 24.00 fps broadcast timecode generator
  useEffect(() => {
    if (!open) return;
    const targetFps = parseFloat(fps);
    const interval = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      const frameNum = Math.floor((now.getMilliseconds() / 1000) * targetFps);
      const f = String(frameNum).padStart(2, "0");
      setTimecode(`${h}:${m}:${s}:${f}`);
    }, 1000 / targetFps);

    return () => clearInterval(interval);
  }, [open, fps]);

  // Trigger Physical Clapper Action
  const triggerClap = useCallback(() => {
    if (isClapping) return;
    setIsClapping(true);
    setMarkFlash(true);
    playSlateSound(!soundEnabled);

    const currentTc = timecode;
    const currentTake = take;
    const currentScene = scene;
    const currentHeading = selectedSceneHeading;
    const currentUnit = cameraUnit;
    const currentRoll = roll;
    const currentProj = production;
    const currentSound = soundMode;
    const currentTimeOfDay = timeOfDay;
    const currentSetting = setting;
    const currentFilter = filter;

    setTimeout(() => {
      setTakeLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          project: currentProj,
          scene: currentScene,
          sceneHeading: currentHeading,
          take: currentTake,
          roll: currentRoll,
          cameraUnit: currentUnit,
          timecode: currentTc,
          fps,
          soundMode: currentSound,
          timeOfDay: currentTimeOfDay,
          setting: currentSetting,
          filter: currentFilter,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          status: "good",
          notes: `${currentSetting} · ${currentTimeOfDay} · ${currentSound}`,
        },
        ...prev.slice(0, 11),
      ]);
    }, 120);

    setTimeout(() => setMarkFlash(false), 150);
    setTimeout(() => {
      setIsClapping(false);
      setTake((prev) => prev + 1);
    }, 280);
  }, [
    isClapping,
    soundEnabled,
    timecode,
    take,
    scene,
    selectedSceneHeading,
    cameraUnit,
    roll,
    production,
    fps,
    soundMode,
    timeOfDay,
    setting,
    filter,
  ]);

  const incrementScene = useCallback(() => {
    const match = scene.match(/^(\d+)\s*([A-Za-z]?)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const letter = match[2];
      if (!letter) {
        setScene(`${num} A`);
      } else {
        const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
        setScene(`${num} ${nextLetter}`);
      }
    } else {
      setScene((currentScene) => `${currentScene} +`);
    }
    setTake(1);
  }, [scene]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        triggerClap();
      } else if (e.key.toLowerCase() === "t") {
        setTake((t) => t + 1);
      } else if (e.key.toLowerCase() === "s") {
        incrementScene();
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        setSoundEnabled((s) => !s);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, triggerClap, incrementScene]);

  function handleSceneSelect(sceneId: string) {
    setSelectedSceneId(sceneId);
    const found = availableScenes.find((s) => s.id === sceneId);
    if (found) {
      setScene(found.sceneNumber || "1");
      setSelectedSceneHeading(found.heading || "");
      setSetting(found.intExt);
      setTimeOfDay(found.timeOfDay);
      setTake(1);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }

  function updateLogStatus(id: string, status: TakeLogItem["status"]) {
    setTakeLogs((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  // Export take log as formatted CSV for Script Supervisor & Editorial
  function exportTakeLogCSV() {
    const headers = ["Project", "Scene", "Scene Heading", "Take", "Roll", "Camera Unit", "Setting", "Time of Day", "Sound", "Filter", "Timecode", "FPS", "Time", "Status", "Notes"];
    const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = takeLogs.map((log) => [
      csvEscape(log.project),
      csvEscape(log.scene),
      csvEscape(log.sceneHeading || ""),
      log.take,
      csvEscape(log.roll),
      csvEscape(log.cameraUnit),
      csvEscape(log.setting || ""),
      csvEscape(log.timeOfDay || ""),
      csvEscape(log.soundMode || ""),
      csvEscape(log.filter || ""),
      csvEscape(log.timecode),
      csvEscape(log.fps),
      csvEscape(log.timestamp),
      csvEscape(log.status),
      csvEscape(log.notes),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `flowbender-slate-log-${production.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={modalContainerRef}
        className="max-w-4xl p-0 overflow-hidden border-zinc-800 bg-zinc-950 text-white shadow-2xl shadow-amber-500/10 sm:rounded-2xl [&>button]:hidden"
      >
        <DialogTitle className="sr-only">flowbender Digital Cinema Clapperboard</DialogTitle>

        {/* TOP CONTROL BAR & FILM SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-900/90 px-4 py-2.5 backdrop-blur-md">
          {/* Film Switcher Dropdown */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shrink-0">
              <Clapperboard className="h-4 w-4 text-white" />
            </div>

            {/* Switch Active Project */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 hidden sm:inline">
                Film:
              </span>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    initializedProjectIdRef.current = null;
                  }}
                  className="rounded-lg border border-amber-500/40 bg-zinc-950 px-3 py-1 text-xs font-bold text-white shadow-sm focus:border-amber-400 focus:outline-none pr-8 cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-900 text-white py-1 font-semibold">
                      {p.title} ({p.status})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400" />
              </div>
            </div>

            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] hidden md:inline-flex"
            >
              {activeProject?.productionHouse || "Studio"}
            </Badge>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-zinc-400 hover:text-white"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Sound ON (Clap & 1kHz Beep)" : "Sound MUTED"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4 text-zinc-500" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-zinc-400 hover:text-white"
              onClick={toggleFullscreen}
              title="Fullscreen Slate (for on-set camera framing)"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* MAIN CINEMA SLATE BODY */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 select-none">
          {/* Visual Flash on MARK */}
          {markFlash && (
            <div className="absolute inset-0 z-50 pointer-events-none bg-white/40 mix-blend-overlay animate-out fade-out duration-150" />
          )}

          {/* CLAPPER STICKS (Top Hinged Arm + Fixed Lower Arm) */}
          <div className="relative mb-4 cursor-pointer" onClick={triggerClap} title="Click anywhere on sticks to CLAP / MARK">
            {/* Top Moving Arm */}
            <div
              className={`relative h-10 sm:h-14 w-full rounded-t-lg origin-bottom-left transition-transform duration-100 ease-out border-b-2 border-zinc-950 shadow-lg ${
                isClapping ? "-rotate-[28deg]" : "rotate-0"
              }`}
              style={{
                background: "repeating-linear-gradient(135deg, #09090b, #09090b 28px, #fafafa 28px, #fafafa 56px)",
              }}
            >
              {/* Dual Metallic Pivot Screws */}
              <div className="absolute left-2.5 top-2.5 h-4 w-4 rounded-full border border-zinc-500 bg-gradient-to-tr from-zinc-400 to-zinc-200 shadow-md" />
              <div className="absolute left-8 top-2.5 h-4 w-4 rounded-full border border-zinc-500 bg-gradient-to-tr from-zinc-400 to-zinc-200 shadow-md" />
            </div>

            {/* Bottom Fixed Arm */}
            <div
              className="relative h-10 sm:h-14 w-full rounded-b-lg border-t border-zinc-950 shadow-inner"
              style={{
                background: "repeating-linear-gradient(135deg, #fafafa, #fafafa 28px, #09090b 28px, #09090b 56px)",
              }}
            >
              <div className="absolute left-2.5 top-2.5 h-4 w-4 rounded-full border border-zinc-500 bg-gradient-to-tr from-zinc-400 to-zinc-200 shadow-md" />
              <div className="absolute left-8 top-2.5 h-4 w-4 rounded-full border border-zinc-500 bg-gradient-to-tr from-zinc-400 to-zinc-200 shadow-md" />
            </div>
          </div>

          {/* SLATE DIGITAL TIMECODE READOUT (High-Contrast Amber LED Display) */}
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between rounded-xl border-2 border-amber-500/50 bg-black/95 px-5 py-3.5 shadow-[0_0_30px_rgba(245,158,11,0.18)]">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-mono tracking-widest text-zinc-300 font-bold uppercase">
                REC · SMPTE TIMECODE
              </span>
            </div>

            {/* Glowing 7-segment digital font readout */}
            <div className="font-mono text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] my-1 sm:my-0">
              {timecode}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500 text-[10px] uppercase">FPS:</span>
              <select
                value={fps}
                onChange={(e) => setFps(e.target.value as typeof fps)}
                className="rounded border border-amber-500/40 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
              >
                <option value="23.976">23.98 FPS</option>
                <option value="24.00">24.00 FPS</option>
                <option value="25.00">25.00 FPS</option>
                <option value="29.97">29.97 FPS</option>
                <option value="30.00">30.00 FPS</option>
                <option value="60.00">60.00 FPS</option>
              </select>
            </div>
          </div>

          {/* PROJECT SCENE QUICK-LINK PICKER */}
          {availableScenes.length > 0 && (
            <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Layers className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-zinc-400">Load Project Scene:</span>
                <select
                  id="slate-select-project-scene"
                  value={selectedSceneId}
                  onChange={(e) => handleSceneSelect(e.target.value)}
                  className="rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white max-w-[280px] sm:max-w-[420px] truncate focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  {availableScenes.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white py-1">
                      Sc. {s.sceneNumber}: {s.heading} ({s.intExt} · {s.timeOfDay})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSceneHeading && (
                <span className="text-[11px] text-amber-300 font-mono truncate max-w-full sm:max-w-xs">
                  {selectedSceneHeading}
                </span>
              )}
            </div>
          )}

          {/* SLATE CHALKBOARD GRID */}
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-950 p-4 shadow-2xl">
            {/* Row 1: Roll, Scene, Take */}
            <div className="grid grid-cols-3 gap-3 border-b border-zinc-800 pb-4 text-center">
              {/* ROLL */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">ROLL</span>
                  {/* Camera Unit Selector */}
                  <select
                    value={cameraUnit}
                    onChange={(e) => setCameraUnit(e.target.value as typeof cameraUnit)}
                    className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[10px] font-bold text-amber-300 focus:outline-none"
                  >
                    <option value="A-CAM">A-CAM</option>
                    <option value="B-CAM">B-CAM</option>
                    <option value="C-CAM">C-CAM</option>
                    <option value="DRONE">DRONE</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  className="mt-1 w-full text-center font-mono text-2xl sm:text-3xl font-black text-white bg-transparent border-b border-dashed border-zinc-700 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* SCENE */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">SCENE</span>
                  <button
                    id="slate-btn-scene-plus"
                    onClick={incrementScene}
                    className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
                    title="Advance to Next Scene Letter (e.g. 14A -> 14B)"
                  >
                    +1
                  </button>
                </div>
                <input
                  type="text"
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                  className="mt-1 w-full text-center font-mono text-2xl sm:text-3xl font-black text-amber-300 bg-transparent border-b border-dashed border-amber-500/40 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* TAKE */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">TAKE</span>
                  <div className="flex gap-1">
                    <button
                      id="slate-btn-take-minus"
                      onClick={() => setTake((t) => Math.max(1, t - 1))}
                      className="rounded bg-zinc-800 px-1 text-[10px] text-zinc-400 hover:text-white"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      id="slate-btn-take-plus"
                      onClick={() => setTake((t) => t + 1)}
                      className="rounded bg-emerald-500/20 px-1.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 font-mono text-2xl sm:text-3xl font-black text-emerald-300">
                  {take}
                </div>
              </div>
            </div>

            {/* Row 2: Production, Director, Camera / DoP */}
            <div className="grid sm:grid-cols-3 gap-3 py-3 border-b border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">PRODUCTION</span>
                <input
                  type="text"
                  value={production}
                  onChange={(e) => setProduction(e.target.value)}
                  className="mt-0.5 w-full font-bold text-white bg-transparent border-b border-zinc-800 focus:border-amber-400 focus:outline-none truncate"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">DIRECTOR</span>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  className="mt-0.5 w-full font-semibold text-zinc-300 bg-transparent border-b border-zinc-800 focus:border-amber-400 focus:outline-none truncate"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">CAMERA / DoP</span>
                <input
                  type="text"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  className="mt-0.5 w-full font-semibold text-zinc-300 bg-transparent border-b border-zinc-800 focus:border-amber-400 focus:outline-none truncate"
                />
              </div>
            </div>

            {/* Row 3: Camera Model, Lens, Filter & Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
              {/* Sound Mode Toggle */}
              <button
                type="button"
                id="slate-btn-sound"
                onClick={() => setSoundMode((m) => (m === "SYNC" ? "MOS" : "SYNC"))}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                  soundMode === "SYNC"
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500"
                }`}
                title="Toggle Sound Mode: SYNC (Recorded) vs MOS (Silent)"
              >
                {soundMode === "SYNC" ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-zinc-500" />}
                <span>{soundMode}</span>
              </button>

              {/* Day / Night Toggle */}
              <button
                type="button"
                id="slate-btn-day-night"
                onClick={() => setTimeOfDay((t) => (t === "DAY" ? "NIGHT" : "DAY"))}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                  timeOfDay === "DAY"
                    ? "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                    : "border-indigo-500/60 bg-indigo-500/25 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                }`}
                title="Toggle Lighting Time: DAY (Sun) vs NIGHT (Moon)"
              >
                {timeOfDay === "DAY" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
                <span>{timeOfDay}</span>
              </button>

              {/* Int / Ext Toggle */}
              <button
                type="button"
                id="slate-btn-int-ext"
                onClick={() => setSetting((s) => (s === "EXT" ? "INT" : "EXT"))}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                  setting === "EXT"
                    ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "border-orange-500/60 bg-orange-500/20 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.25)]"
                }`}
                title="Toggle Location: EXT (Exterior) vs INT (Interior)"
              >
                {setting === "EXT" ? <Compass className="h-3.5 w-3.5 text-cyan-400" /> : <Building className="h-3.5 w-3.5 text-orange-400" />}
                <span>{setting}</span>
              </button>

              {/* Filter Selector */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-xs">
                <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1 shrink-0">FILTER:</span>
                <select
                  id="slate-select-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-zinc-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="CLEAR" className="bg-zinc-900 text-white">CLEAR</option>
                  <option value="ND .3" className="bg-zinc-900 text-white">ND .3</option>
                  <option value="ND .6" className="bg-zinc-900 text-white">ND .6</option>
                  <option value="ND .9" className="bg-zinc-900 text-white">ND .9</option>
                  <option value="ND 1.2" className="bg-zinc-900 text-white">ND 1.2</option>
                  <option value="POLA" className="bg-zinc-900 text-white">POLA</option>
                </select>
              </div>
            </div>

            {/* Row 4: Camera Model & Lens Specs */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-xs">
              <div className="flex items-center gap-2">
                <Camera className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-[10px] text-zinc-500 uppercase font-bold">RIG:</span>
                <input
                  type="text"
                  value={cameraModel}
                  onChange={(e) => setCameraModel(e.target.value)}
                  className="w-full text-zinc-300 font-mono text-[11px] bg-transparent focus:outline-none truncate border-b border-zinc-800 focus:border-amber-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-[10px] text-zinc-500 uppercase font-bold">LENS:</span>
                <input
                  type="text"
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  className="w-full text-zinc-300 font-mono text-[11px] bg-transparent focus:outline-none truncate border-b border-zinc-800 focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* MAIN ACTION BUTTON: BIG CLAP / MARK */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">Space</kbd>
              <span>to Mark</span>
              <span>·</span>
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">T</kbd>
              <span>Take</span>
              <span>·</span>
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">S</kbd>
              <span>Scene</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={triggerClap}
                disabled={isClapping}
                className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-base tracking-wider uppercase shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Clapperboard className="mr-2 h-5 w-5 fill-black" />
                MARK / CLAP
              </Button>
            </div>
          </div>

          {/* TAKE LOG HISTORY DRAWER */}
          <div className="mt-6 border-t border-zinc-800/80 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>On-Set Take Log ({takeLogs.length} takes)</span>
              </div>

              {takeLogs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTakeLogCSV}
                  className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white gap-1.5"
                >
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
              )}
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {takeLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2 text-xs hover:border-zinc-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-amber-400 shrink-0">Sc. {log.scene}</span>
                    <span className="font-mono font-bold text-white shrink-0">Tk. {log.take}</span>
                    <span className="font-mono text-zinc-400 shrink-0">{log.timecode}</span>
                    <Badge variant="outline" className="border-zinc-700 text-[10px] hidden sm:inline-flex shrink-0">
                      {log.cameraUnit}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] hidden sm:inline-flex shrink-0 ${
                        log.setting === "EXT"
                          ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                          : "border-orange-500/40 text-orange-400 bg-orange-500/10"
                      }`}
                    >
                      {log.setting || "EXT"} · {log.timeOfDay || "DAY"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] hidden md:inline-flex shrink-0 ${
                        log.soundMode === "SYNC"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                          : "border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {log.soundMode || "SYNC"}
                    </Badge>
                    <span className="text-[11px] text-zinc-400 truncate hidden lg:inline">
                      {log.project} {log.sceneHeading ? `· ${log.sceneHeading}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => updateLogStatus(log.id, "circle")}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                        log.status === "circle"
                          ? "bg-amber-500 text-black shadow-sm"
                          : "text-zinc-400 hover:text-amber-300"
                      }`}
                      title="Circle Take / Print (Best Take for Editor)"
                    >
                      ★ Circle
                    </button>
                    <button
                      onClick={() => updateLogStatus(log.id, "good")}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                        log.status === "good" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-emerald-300"
                      }`}
                    >
                      Good
                    </button>
                    <button
                      onClick={() => updateLogStatus(log.id, "ng")}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                        log.status === "ng" ? "bg-red-700 text-white" : "text-zinc-400 hover:text-red-300"
                      }`}
                    >
                      NG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
