import type { Project } from "./types";
import {
  getAppDataSlice,
  updateAppData,
  updateAppDataSlice,
  useAppDataSelector,
  useAppDataSlice,
} from "./app-data-store";

const tollywoodProjectProfiles = [
  { title: "Pushpa 2: The Rule", type: "feature-film" as const, genre: "Action / Period Drama", language: "Telugu / Hindi", director: "Sukumar", producer: "Naveen Yerneni", productionHouse: "Mythri Movie Makers", status: "production" as const, logline: "Pushpa Raj faces a new power struggle as his rise in the red-sandalwood trade challenges rival syndicates." },
  { title: "Kalki 2898 AD", type: "feature-film" as const, genre: "Sci-Fi / Dystopian Epic", language: "Telugu / Hindi", director: "Nag Ashwin", producer: "C. Aswani Dutt", productionHouse: "Vyjayanthi Movies", status: "completed" as const, logline: "In a dystopian future, a bounty hunter and a rebel protect a child believed to be the final hope of humanity." },
  { title: "Devara: Part 1", type: "feature-film" as const, genre: "Coastal Action Drama", language: "Telugu / Hindi", director: "Koratala Siva", producer: "Sudhakar Mikkilineni", productionHouse: "Yuvasudha Arts", status: "completed" as const, logline: "A coastal community confronts a violent legacy when fear, loyalty, and succession collide." },
  { title: "Game Changer", type: "feature-film" as const, genre: "Political Action Thriller", language: "Telugu / Tamil", director: "S. Shankar", producer: "Dil Raju", productionHouse: "Sri Venkateswara Creations", status: "production" as const, logline: "An idealistic officer challenges a corrupt political system through an election reform campaign." },
  { title: "They Call Him OG", type: "feature-film" as const, genre: "Underworld Action Thriller", language: "Telugu", director: "Sujeeth", producer: "D. V. V. Danayya", productionHouse: "DVV Entertainment", status: "production" as const, logline: "A former gangster returns to Mumbai when an old promise draws him into a new underworld war." },
  { title: "HIT: The Third Case", type: "feature-film" as const, genre: "Crime Investigation", language: "Telugu", director: "Sailesh Kolanu", producer: "Prashanti Tipirneni", productionHouse: "Wall Poster Cinema", status: "pre-production" as const, logline: "A relentless investigator follows a brutal case across borders while confronting the cost of justice." },
  { title: "The Raja Saab", type: "feature-film" as const, genre: "Horror Romantic Comedy", language: "Telugu", director: "Maruthi", producer: "T. G. Vishwa Prasad", productionHouse: "People Media Factory", status: "post-production" as const, logline: "A carefree heir discovers that an ancestral palace has a supernatural claim on his family." },
];




const posterColors = [
  "from-sky-600 to-indigo-800",
  "from-slate-700 to-rose-900",
  "from-amber-700 to-red-900",
  "from-teal-700 to-slate-900",
  "from-zinc-800 to-fuchsia-950",
  "from-pink-600 to-rose-900",
  "from-stone-600 to-emerald-900",
  "from-blue-700 to-cyan-900",
  "from-orange-600 to-red-800",
  "from-emerald-700 to-teal-900",
];

function nextProjectId(projects: Project[]) {
  return (
    projects.reduce((highest, project) => {
      const match = project.id.match(/^p(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1
  );
}

export function getProjects(): Project[] {
  return getAppDataSlice("projects");
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export interface CreateProjectInput {
  title: string;
  type: Project["type"];
  language: string;
  genre: string;
  productionHouse: string;
  director: string;
  producer: string;
  startDate: string;
  endDate: string;
  totalShootDays: number;
  budget: number;
  description: string;
  posterImage?: string | null;
  thumbnailImage?: string | null;
  bannerImage?: string | null;
}

export function createProject(input: CreateProjectInput): Project {
  const projects = getProjects();
  const id = `p${nextProjectId(projects)}`;
  const project: Project = {
    id,
    title: input.title,
    type: input.type,
    status: "development",
    genre: input.genre,
    language: input.language,
    director: input.director,
    producer: input.producer,
    productionHouse: input.productionHouse,
    startDate: input.startDate,
    endDate: input.endDate,
    budget: input.budget,
    spent: 0,
    posterColor: posterColors[projects.length % posterColors.length],
    logline: input.description.slice(0, 120) + (input.description.length > 120 ? "..." : ""),
    description: input.description,
    shootProgress: 0,
    totalShootDays: input.totalShootDays,
    completedShootDays: 0,
    nextShootDate: null,
    createdAt: new Date().toISOString(),
    posterImage: input.posterImage ?? null,
    thumbnailImage: input.thumbnailImage ?? null,
    bannerImage: input.bannerImage ?? null,
  };
  updateAppDataSlice("projects", (current) => [project, ...current]);
  return project;
}

export function updateProject(id: string, updates: Partial<Omit<Project, "id">>): Project | undefined {
  let updated: Project | undefined;
  updateAppData((current) => {
    const projects = current.projects.map((project) => {
      if (project.id !== id) return project;
      updated = { ...project, ...updates };
      return updated;
    });
    if (!updated) return current;
    const title = updated.title;
    return {
      ...current, projects,
      castMembers: current.castMembers.map((member) => member.projectId === id ? { ...member, projectTitle: title } : member),
      crewMembers: current.crewMembers.map((member) => member.projectId === id ? { ...member, projectTitle: title } : member),
      shootDays: current.shootDays.map((day) => day.projectId === id ? { ...day, projectTitle: title } : day),
      scheduleEntries: current.scheduleEntries.map((entry) => entry.projectId === id ? { ...entry, projectTitle: title } : entry),
      callSheets: current.callSheets.map((sheet) => sheet.projectId === id ? { ...sheet, project: title } : sheet),
    };
  });
  return updated;
}

export function useProjects() {
  return useAppDataSlice("projects");
}

export function useProject(id: string) {
  return useAppDataSelector((data) => data.projects.find((project) => project.id === id));
}

const SELECTED_PROJECT_STORAGE_KEY = "flowbender.selectedProjectId";
const DEFAULT_PROJECT_ID = "p1";

let selectedProjectIdMemory = DEFAULT_PROJECT_ID;
const projectSelectionListeners = new Set<() => void>();

function getStoredProjectId(): string {
  if (typeof window === "undefined") return selectedProjectIdMemory;
  try {
    const val = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
    if (val && val.trim()) return val.trim();
  } catch {
    // ignore
  }
  return DEFAULT_PROJECT_ID;
}

export function getSelectedProjectId(): string {
  return getStoredProjectId();
}

export function setSelectedProjectId(id: string): void {
  const cleanId = id.trim();
  if (!cleanId) return;
  selectedProjectIdMemory = cleanId;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, cleanId);
      window.dispatchEvent(new CustomEvent("flowbender:selected-project-change", { detail: cleanId }));
    } catch {
      // ignore
    }
  }
  projectSelectionListeners.forEach((listener) => listener());
}

function subscribeSelectedProject(callback: () => void) {
  projectSelectionListeners.add(callback);
  if (typeof window !== "undefined") {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SELECTED_PROJECT_STORAGE_KEY) {
        callback();
      }
    };
    const handleCustom = () => callback();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("flowbender:selected-project-change", handleCustom);
    return () => {
      projectSelectionListeners.delete(callback);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("flowbender:selected-project-change", handleCustom);
    };
  }
  return () => {
    projectSelectionListeners.delete(callback);
  };
}

export function useSelectedProjectId(): string {
  const { useSyncExternalStore } = require("react");
  return useSyncExternalStore(
    subscribeSelectedProject,
    getStoredProjectId,
    () => DEFAULT_PROJECT_ID
  );
}

export function useSelectedProject(): Project | undefined {
  const selectedId = useSelectedProjectId();
  const projects = useProjects();
  return projects.find((p) => p.id === selectedId) ?? projects.find((p) => p.id === DEFAULT_PROJECT_ID) ?? projects[0];
}

