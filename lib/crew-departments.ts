import type { CrewDeptInfo } from "@/lib/types";

export const CREW_DEPARTMENTS: CrewDeptInfo[] = [
  {
    key: "writing-direction",
    name: "Writing & Direction",
    designations: ["Script Writer", "Lyric Writer", "Dialogue Writer", "Co-Director", "Assistant Director"],
  },
  {
    key: "daily-production",
    name: "Daily Production & Catering",
    designations: ["Catering In-charge", "Production Assistant", "Runner", "Set PA"],
  },
  {
    key: "camera-lights",
    name: "Camera & Lights",
    designations: ["Camera Assistant", "Focus Puller", "Clapper Loader", "Gaffer", "Best Boy", "Light Boy", "Electrician"],
  },
  {
    key: "locations",
    name: "Locations",
    designations: ["Production Manager", "Location Manager", "Spot Boy", "Location Scout"],
  },
  {
    key: "art-props",
    name: "Art & Props",
    designations: ["Art Director", "Set Decorator", "Prop Master", "Set Assistant", "Props Assistant"],
  },
  {
    key: "costume-makeup",
    name: "Costume & Makeup",
    designations: ["Costume Designer", "Costume Assistant", "Makeup Artist", "Hair Stylist", "Prosthetics Artist"],
  },
  {
    key: "vehicles",
    name: "Vehicles",
    designations: ["Caravan Driver", "Production Vehicle Driver", "Unit Driver", "Transport Manager"],
  },
  {
    key: "action-stunts",
    name: "Action & Stunts",
    designations: ["Action Director", "Stunt Coordinator", "Stunt Double", "Stunt Boy"],
  },
  {
    key: "production-office",
    name: "Production Office",
    designations: ["Office Manager", "Accountant", "Receptionist", "Maintenance", "Miscellaneous"],
  },
];

// Map existing crewMember.department strings to canonical dept keys
const RAW_DEPT_MAP: Record<string, string> = {
  camera: "camera-lights",
  lighting: "camera-lights",
  vfx: "camera-lights",
  art: "art-props",
  "production-design": "art-props",
  sound: "daily-production",
  production: "daily-production",
  editing: "daily-production",
  di: "daily-production",
  dubbing: "daily-production",
  direction: "writing-direction",
  script: "writing-direction",
  costume: "costume-makeup",
  makeup: "costume-makeup",
  action: "action-stunts",
  stunt: "action-stunts",
  location: "locations",
  transport: "vehicles",
  accounts: "production-office",
  publicity: "production-office",
};

export function normalizeDeptKey(rawDept: string | undefined): string {
  if (!rawDept) return "daily-production";
  const lower = rawDept.toLowerCase();
  for (const [k, v] of Object.entries(RAW_DEPT_MAP)) {
    if (lower.includes(k)) return v;
  }
  return "daily-production";
}

export const DEPT_BY_KEY = Object.fromEntries(CREW_DEPARTMENTS.map(d => [d.key, d]));
