import type { Scene, SceneStatus, IntExt, TimeOfDay, ScriptVersion, SceneBreakdownItem } from "./types";
import {
  getAppDataSlice,
  updateAppDataSlice,
  useAppDataSelector,
  useAppDataSlice,
} from "./app-data-store";

export const sceneStatusLabels: Record<SceneStatus, string> = {
  "not-scheduled": "Not Scheduled",
  scheduled: "Scheduled",
  shot: "Shot",
  "partially-shot": "Partially Shot",
  "reshoot-required": "Reshoot Required",
};

export const sceneStatusColors: Record<SceneStatus, string> = {
  "not-scheduled": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  shot: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "partially-shot": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "reshoot-required": "bg-red-500/10 text-red-400 border-red-500/20",
};

export const sceneStatusDot: Record<SceneStatus, string> = {
  "not-scheduled": "bg-zinc-400",
  scheduled: "bg-amber-400",
  shot: "bg-emerald-400",
  "partially-shot": "bg-blue-400",
  "reshoot-required": "bg-red-400",
};

function bp(category: SceneBreakdownItem["category"], name: string, notes?: string): SceneBreakdownItem {
  return { id: `bi-${Math.random().toString(36).slice(2, 8)}`, category, name, notes };
}

const seedScenes: Scene[] = [
  // ===== The Last Horizon (p1) =====
  {
    id: "sc-1", projectId: "p1", sceneNumber: "1", heading: "EARTH — DEEP SPACE ARRAY — CONTROL ROOM",
    intExt: "INT", location: "Floor 1 — Mission Control", timeOfDay: "NIGHT",
    characters: ["Dr. Vikram Sahay", "Technician #1", "Technician #2"],
    props: [bp("prop", "Radar console bank"), bp("prop", "Coffee mugs"), bp("prop", "Classified folder")],
    costumes: [bp("costume", "Lab coats"), bp("costume", "NASA-style badges")],
    vehicles: [], specialRequirements: [bp("special", "Practical LED screens showing signal data")],
    vfxRequired: true, vfxNotes: "Screen comps for radar display. Subtle alarm lighting FX.",
    notes: "Cold open. Establish tone — quiet tension escalating to alarm.", estimatedDuration: "3 min", pages: 2.5,
    status: "shot", shootDate: "2026-06-16", shootDay: 2, synopsis: "Late at night, Kwame detects an anomalous signal from deep space. What starts as routine monitoring becomes humanity's first contact with something unknown.",
  },
  {
    id: "sc-2", projectId: "p1", sceneNumber: "2", heading: "ARIA'S HOUSE — LIVING ROOM",
    intExt: "INT", location: "Practical Location — Bandra House", timeOfDay: "DAY",
    characters: ["Commander Aria Singh"],
    props: [bp("prop", "Old mission photos on wall"), bp("prop", "Telescope"), bp("prop", "Ringing phone")],
    costumes: [bp("costume", "Casual home clothes")],
    vehicles: [], specialRequirements: [],
    vfxRequired: false, vfxNotes: "",
    notes: "Character intro for Aria. Quiet, domestic, deliberately unglamorous. Show her distance from space.", estimatedDuration: "2 min", pages: 1.5,
    status: "shot", shootDate: "2026-06-18", shootDay: 4, synopsis: "Aria lives a quiet retirement far from the Space Agency. A phone call interrupts her solitary morning — the Agency needs her back.",
  },
  {
    id: "sc-3", projectId: "p1", sceneNumber: "3", heading: "EARTH — DEEP SPACE ARRAY — MISSION CONTROL",
    intExt: "INT", location: "Stage 1 — Mission Control", timeOfDay: "DAY",
    characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Brigadier Vikram Rathore"],
    props: [bp("prop", "Classified briefing binder"), bp("prop", "Signal printout"), bp("prop", "Security badges")],
    costumes: [bp("costume", "Aria: formal suit"), bp("costume", "Morales: military dress uniform")],
    vehicles: [], specialRequirements: [bp("special", "Extras — 12 mission control staff")],
    vfxRequired: true, vfxNotes: "Large wall display showing signal origin — star map composite.",
    notes: "Key exposition scene. Keep pace brisk despite heavy info.", estimatedDuration: "5 min", pages: 4,
    status: "scheduled", shootDate: "2026-09-12", shootDay: 40, synopsis: "Aria arrives at Mission Control and sees the signal data. Morales pushes a military agenda while Kwame argues for scientific caution. Aria must choose a side.",
  },
  {
    id: "sc-4", projectId: "p1", sceneNumber: "4", heading: "MISSION CONTROL — BRIEFING ROOM",
    intExt: "INT", location: "Floor 1 — Mission Control", timeOfDay: "DAY",
    characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Brigadier Vikram Rathore", "Captain Yuki Tanaka"],
    props: [bp("prop", "Holographic mission timeline"), bp("prop", "Mission patches")],
    costumes: [bp("costume", "Yuki: flight suit")],
    vehicles: [], specialRequirements: [bp("special", "Large LED wall — mission briefing graphics")],
    vfxRequired: true, vfxNotes: "Holographic display comp. Mission trajectory visualization.",
    notes: "Introduce Yuki. First time the full crew is assembled.", estimatedDuration: "4 min", pages: 3,
    status: "scheduled", shootDate: "2026-09-12", shootDay: 40, synopsis: "The mission team assembles. Kwame presents the signal analysis, Yuki questions the flight plan, and Morales reveals the classified scope of what they're heading into.",
  },
  {
    id: "sc-15", projectId: "p1", sceneNumber: "15", heading: "LADAKH LAUNCH FACILITY — EXTERIOR",
    intExt: "EXT", location: "Backlot — Ladakh Exterior", timeOfDay: "DAY",
    characters: ["Commander Aria Singh"],
    props: [bp("prop", "Military escort vehicles"), bp("prop", "Badge checkpoint")],
    costumes: [bp("costume", "Aria: tactical field jacket")],
    vehicles: [bp("vehicle", "Black SUV convoy (3)"), bp("vehicle", "Military Humvee")],
    specialRequirements: [bp("special", "Dust FX — fan rigs"), bp("special", "Helicopter pass overhead")],
    vfxRequired: true, vfxNotes: "Sky replacement — dramatic clouds. Extend launch facility in background.",
    notes: "Big establishing shot. Helicopter pass needs FAA clearance.", estimatedDuration: "2 min", pages: 1.5,
    status: "scheduled", shootDate: "2026-09-05", shootDay: 35, synopsis: "Aria arrives at the secret launch facility in the Mojave desert, escorted by military convoy. The scale of the mission becomes real.",
  },
  {
    id: "sc-16", projectId: "p1", sceneNumber: "16", heading: "LAUNCH FACILITY — HANGAR",
    intExt: "INT", location: "Backlot — Desert Exterior", timeOfDay: "DAY",
    characters: ["Commander Aria Singh", "Captain Yuki Tanaka"],
    props: [bp("prop", "Flight suits on rack"), bp("prop", "Mission briefcase")],
    costumes: [bp("costume", "Yuki: casual jacket over flight suit"), bp("costume", "Aria: tactical field jacket")],
    vehicles: [], specialRequirements: [bp("special", "Partial spacecraft mockup visible in BG")],
    vfxRequired: true, vfxNotes: "Extend hangar depth. Full spacecraft composite in background.",
    notes: "Yuki & Aria's first real interaction. Establish dynamic — mutual respect, different approaches.", estimatedDuration: "3 min", pages: 2,
    status: "scheduled", shootDate: "2026-09-05", shootDay: 35, synopsis: "Yuki intercepts Aria at the hangar. Their first face-to-face reveals tension about the command structure, but also an unspoken understanding.",
  },
  {
    id: "sc-17", projectId: "p1", sceneNumber: "17", heading: "LAUNCH FACILITY — COMMS ROOM / LONDON STUDIO",
    intExt: "INT", location: "Backlot — Desert Exterior", timeOfDay: "DAY",
    characters: ["Commander Aria Singh", "Professor Edmund Hale"],
    props: [bp("prop", "Secure video terminal"), bp("prop", "Archive photographs")],
    costumes: [bp("costume", "Hale: tweed jacket, reading glasses")],
    vehicles: [], specialRequirements: [bp("special", "Split screen video call setup"), bp("special", "Remote shoot — London studio")],
    vfxRequired: true, vfxNotes: "Video call composite. Screen-in-screen split.",
    notes: "Hale is remote from London studio. Coordinate timezones for simultaneous shoot.", estimatedDuration: "4 min", pages: 3,
    status: "scheduled", shootDate: "2026-09-05", shootDay: 35, synopsis: "Aria contacts her retired mentor, Professor Hale. He warns her about a classified 1970s program that detected a similar signal — and the people who covered it up.",
  },
  {
    id: "sc-28", projectId: "p1", sceneNumber: "28", heading: "SPACECRAFT — SCIENCE LAB",
    intExt: "INT", location: "Stage 2 — Lab Set", timeOfDay: "CONTINUOUS",
    characters: ["Dr. Vikram Sahay", "Dr. Nandini Reddy"],
    props: [bp("prop", "Signal decryption equipment"), bp("prop", "Lab tablets"), bp("prop", "Sample containers")],
    costumes: [bp("costume", "Kwame: ship jumpsuit"), bp("costume", "Nandini: lab coat over jumpsuit")],
    vehicles: [], specialRequirements: [bp("special", "Zero-G wire rig for floating objects")],
    vfxRequired: true, vfxNotes: "Zero-G floating objects. Holographic signal visualization on table display.",
    notes: "Wire rig needed for floating props. Stunt coordinator sign-off required.", estimatedDuration: "4 min", pages: 3,
    status: "scheduled", shootDate: "2026-09-06", shootDay: 36, synopsis: "Kwame and Nandini work together to decode a fragment of the signal. What they find challenges everything they assumed about its origin.",
  },
  {
    id: "sc-42", projectId: "p1", sceneNumber: "42", heading: "SPACECRAFT — BRIDGE",
    intExt: "INT", location: "Stage 4 — Spacecraft Interior", timeOfDay: "NIGHT",
    characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Captain Yuki Tanaka"],
    props: [bp("prop", "Navigation console"), bp("prop", "Emergency protocol binder")],
    costumes: [bp("costume", "All: mission jumpsuits")],
    vehicles: [], specialRequirements: [bp("special", "Practical lighting FX — emergency red"), bp("special", "Camera gimbal for ship movement")],
    vfxRequired: true, vfxNotes: "Starfield through viewports. Alien signal visual on main screen. Ship vibration FX.",
    notes: "The pivotal first contact attempt. High tension — keep energy building.", estimatedDuration: "6 min", pages: 5,
    status: "shot", shootDate: "2026-09-04", shootDay: 34, synopsis: "The crew makes their first attempt to respond to the alien signal. Something responds back — but not what any of them expected.",
  },
  {
    id: "sc-43", projectId: "p1", sceneNumber: "43", heading: "SPACECRAFT — BRIDGE",
    intExt: "INT", location: "Stage 4 — Spacecraft Interior", timeOfDay: "NIGHT",
    characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Captain Yuki Tanaka"],
    props: [bp("prop", "Decoded signal display"), bp("prop", "Data pads")],
    costumes: [bp("costume", "All: mission jumpsuits")],
    vehicles: [], specialRequirements: [bp("special", "Practical LED panels for decoded message display")],
    vfxRequired: true, vfxNotes: "Decoded signal visualization — complex data pattern on all screens.",
    notes: "Emotional beat following 42. Crew processes what they've received.", estimatedDuration: "3 min", pages: 2.5,
    status: "shot", shootDate: "2026-09-04", shootDay: 34, synopsis: "The decoded signal reveals coordinates — pointing deeper into space. The crew must decide whether to follow the signal or turn back to Earth.",
  },
  {
    id: "sc-44", projectId: "p1", sceneNumber: "44", heading: "SPACECRAFT — CREW QUARTERS",
    intExt: "INT", location: "Stage 4 — Spacecraft Interior", timeOfDay: "NIGHT",
    characters: ["Commander Aria Singh", "Captain Yuki Tanaka", "Dr. Vikram Sahay"],
    props: [bp("prop", "Personal effects"), bp("prop", "Photo of Earth")],
    costumes: [bp("costume", "Off-duty casual variants of jumpsuits")],
    vehicles: [], specialRequirements: [],
    vfxRequired: false, vfxNotes: "",
    notes: "Intimate confrontation. Handheld camera, close-ups.", estimatedDuration: "5 min", pages: 4,
    status: "scheduled", shootDate: "2026-09-09", shootDay: 38, synopsis: "Aria confronts the crew about their divided loyalties. Old wounds surface. Yuki challenges Aria's authority, and Kwame tries to mediate — but his own secret weighs on him.",
  },
  {
    id: "sc-45", projectId: "p1", sceneNumber: "45", heading: "SPACECRAFT — SCIENCE LAB",
    intExt: "INT", location: "Stage 4 — Spacecraft Interior", timeOfDay: "NIGHT",
    characters: ["Dr. Vikram Sahay", "Commander Aria Singh"],
    props: [bp("prop", "Classified data drive"), bp("prop", "Signal analysis hologram")],
    costumes: [bp("costume", "Kwame: jumpsuit"), bp("costume", "Aria: jumpsuit")],
    vehicles: [], specialRequirements: [bp("special", "Dramatic lighting shift — reveal moment")],
    vfxRequired: true, vfxNotes: "Holographic data reveal — visual storytelling of Kwame's secret.",
    notes: "Kwame's confession scene. Major dramatic turn. Shoot with two cameras.", estimatedDuration: "6 min", pages: 4.5,
    status: "scheduled", shootDate: "2026-09-09", shootDay: 38, synopsis: "Kwame reveals the truth he's been hiding: he knew about the signal before the mission. The classified data changes everything about why they were really sent.",
  },
  {
    id: "sc-51", projectId: "p1", sceneNumber: "51", heading: "SOUTH MUMBAI STREET — ARIA'S PAST",
    intExt: "EXT", location: "South Mumbai — Exterior Street", timeOfDay: "DUSK",
    characters: ["Commander Aria Singh"],
    props: [bp("prop", "Old newspaper"), bp("prop", "Street vendor cart")],
    costumes: [bp("costume", "Aria: heavy coat, scarf")],
    vehicles: [bp("vehicle", "Period-appropriate cars (3)"), bp("vehicle", "Yellow taxi")],
    specialRequirements: [bp("special", "Crowd extras — 40 pedestrians"), bp("special", "Wet-down streets")],
    vfxRequired: true, vfxNotes: "Sky replacement — sunset gradient. Remove modern signage.",
    notes: "Flashback sequence intercut with Sc. 51B. Golden hour critical — schedule accordingly.", estimatedDuration: "2 min", pages: 1.5,
    status: "scheduled", shootDate: "2026-09-08", shootDay: 37, synopsis: "A memory: young adult Aria walks the streets after the failed mission, haunted by what went wrong. The city feels alien to her now.",
  },
  {
    id: "sc-52", projectId: "p1", sceneNumber: "52", heading: "SOUTH MUMBAI — PRESS CONFERENCE EXTERIOR",
    intExt: "EXT", location: "South Mumbai — Exterior Street", timeOfDay: "DAY",
    characters: ["Commander Aria Singh", "Brigadier Vikram Rathore", "Guest Reporter Tanaka"],
    props: [bp("prop", "Press podium"), bp("prop", "Microphones (15+)"), bp("prop", "Press badges")],
    costumes: [bp("costume", "Aria: formal blazer"), bp("costume", "Morales: military dress")],
    vehicles: [bp("vehicle", "News vans (4)")],
    specialRequirements: [bp("special", "Crowd extras — 60 press/public"), bp("special", "Multiple practical camera flashes")],
    vfxRequired: false, vfxNotes: "",
    notes: "Major crowd scene. Background actors need press credentials. Security detail extras.", estimatedDuration: "4 min", pages: 3,
    status: "scheduled", shootDate: "2026-09-08", shootDay: 37, synopsis: "General Morales forces a public press conference. Aria faces hostile questions. Reporter Tanaka asks the question that unravels Morales' narrative.",
  },
  {
    id: "sc-60", projectId: "p1", sceneNumber: "60", heading: "WAREHOUSE DISTRICT — ROOFTOP",
    intExt: "EXT", location: "Warehouse District — Night Exterior", timeOfDay: "NIGHT",
    characters: ["Commander Aria Singh"],
    props: [bp("prop", "Transmission device (hero prop)"), bp("prop", "Star chart")],
    costumes: [bp("costume", "Aria: mission jacket, weathered")],
    vehicles: [], specialRequirements: [bp("special", "Rooftop safety rigging"), bp("special", "Rain towers (light rain)"), bp("special", "Condor lift for high angle")],
    vfxRequired: true, vfxNotes: "Night sky replacement — alien signal visible as aurora-like phenomenon. Transmission beam FX.",
    notes: "Climactic scene. Rain towers, night shoot. Stunt safety for rooftop.", estimatedDuration: "5 min", pages: 3.5,
    status: "scheduled", shootDate: "2026-09-11", shootDay: 39, synopsis: "Aria makes her final transmission alone on a warehouse rooftop in the rain, sending humanity's answer into the void. Whatever comes next, she chose hope.",
  },
  {
    id: "sc-61", projectId: "p1", sceneNumber: "61", heading: "WAREHOUSE DISTRICT — INTERIOR",
    intExt: "INT", location: "Warehouse District — Night Exterior", timeOfDay: "NIGHT",
    characters: ["Dr. Nandini Reddy"],
    props: [bp("prop", "Portable lab equipment"), bp("prop", "Signal receiver"), bp("prop", "Laptop")],
    costumes: [bp("costume", "Nandini: rain jacket over lab clothes")],
    vehicles: [], specialRequirements: [bp("special", "Practical flickering lights")],
    vfxRequired: false, vfxNotes: "",
    notes: "Intimate counterpoint to Sc. 60's scale. Nandini working alone in silence.", estimatedDuration: "2 min", pages: 1.5,
    status: "scheduled", shootDate: "2026-09-11", shootDay: 39, synopsis: "While Aria transmits above, Nandini discovers that the signal has been broadcasting a reply for days — aimed directly at Earth. They were never alone.",
  },
  {
    id: "sc-65", projectId: "p1", sceneNumber: "65", heading: "SPACECRAFT — OBSERVATION DECK",
    intExt: "INT", location: "Stage 4 — Spacecraft Interior", timeOfDay: "DAWN",
    characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Captain Yuki Tanaka"],
    props: [bp("prop", "Empty coffee cups"), bp("prop", "Handwritten letter")],
    costumes: [bp("costume", "All: worn jumpsuits — end-of-journey look")],
    vehicles: [], specialRequirements: [bp("special", "Sunrise lighting cue — slow build over 6 min")],
    vfxRequired: true, vfxNotes: "Earth visible through viewport — hero VFX shot. Sunrise over planet curvature.",
    notes: "Final scene. Emotional payoff. One take preferred — rehearse extensively.", estimatedDuration: "4 min", pages: 3,
    status: "not-scheduled", synopsis: "The crew watches Earth from orbit — changed, uncertain, but together. Aria reads a letter she never sent. The signal pulses one last time.",
  },

  // ===== Nightfall Chronicles (p2) — Episode 1 scenes =====
  {
    id: "sc-n1", projectId: "p2", sceneNumber: "1", heading: "COASTAL CLIFF — CRIME SCENE",
    intExt: "EXT", location: "Coastal Location TBD", timeOfDay: "DAWN",
    characters: ["Inspector Arjun Cole"],
    props: [bp("prop", "Police tape"), bp("prop", "Evidence markers"), bp("prop", "Detective notebook")],
    costumes: [bp("costume", "Cole: rumpled overcoat, badge")],
    vehicles: [bp("vehicle", "Police cruiser"), bp("vehicle", "Forensics van")],
    specialRequirements: [bp("special", "Fog machine for coastal atmosphere"), bp("special", "Drone for establishing aerial")],
    vfxRequired: true, vfxNotes: "Enhanced fog. Drone shot stabilization. Possible sky grade for ominous tone.",
    notes: "Cold open. Location TBD — scouting three coastal sites in October.", estimatedDuration: "3 min", pages: 2.5,
    status: "not-scheduled", synopsis: "Detective Cole arrives at a wind-swept clifftop crime scene at dawn. Something about this disappearance doesn't fit any pattern he's seen — and the local cops are nervous.",
  },
  {
    id: "sc-n5", projectId: "p2", sceneNumber: "5", heading: "POLICE STATION — BULLPEN",
    intExt: "INT", location: "Practical Location TBD", timeOfDay: "DAY",
    characters: ["Inspector Arjun Cole", "Inspector Tom Bradley"],
    props: [bp("prop", "Case file boxes"), bp("prop", "Missing persons board"), bp("prop", "Desk clutter")],
    costumes: [bp("costume", "Cole: shirt sleeves, badge"), bp("costume", "Bradley: chief's uniform")],
    vehicles: [], specialRequirements: [bp("special", "Extras — 8 station staff")],
    vfxRequired: false, vfxNotes: "",
    notes: "Establish the uneasy dynamic between Cole and Bradley. Bradley hides something.", estimatedDuration: "4 min", pages: 3,
    status: "not-scheduled", synopsis: "Cole reviews the case files and notices a pattern the locals missed. Chief Bradley seems oddly eager to guide Cole toward a specific theory — and away from another.",
  },
  {
    id: "sc-n7", projectId: "p2", sceneNumber: "7", heading: "TOWN LIBRARY — ARCHIVE ROOM",
    intExt: "INT", location: "Practical Location TBD", timeOfDay: "DAY",
    characters: ["Maya Castillo"],
    props: [bp("prop", "Ancient manuscript"), bp("prop", "Magnifying glass"), bp("prop", "Archival gloves"), bp("prop", "Old town maps")],
    costumes: [bp("costume", "Maya: cardigan, glasses on chain")],
    vehicles: [], specialRequirements: [bp("special", "Practical dust motes — haze machine")],
    vfxRequired: false, vfxNotes: "",
    notes: "Solo Maya scene. Establish her as the keeper of secrets.", estimatedDuration: "2 min", pages: 1.5,
    status: "not-scheduled", synopsis: "Maya discovers a centuries-old manuscript that describes events eerily similar to the current disappearances. The town's history is darker than anyone admits.",
  },
  {
    id: "sc-n10", projectId: "p2", sceneNumber: "10", heading: "TOWN SQUARE — GAZEBO",
    intExt: "EXT", location: "Practical Location TBD", timeOfDay: "DUSK",
    characters: ["Inspector Arjun Cole", "Maya Castillo"],
    props: [bp("prop", "Newspaper clippings"), bp("prop", "Coffee cups")],
    costumes: [bp("costume", "Cole: jacket"), bp("costume", "Maya: autumn layers")],
    vehicles: [], specialRequirements: [bp("special", "Practical string lights on gazebo"), bp("special", "BG extras — 6 townspeople")],
    vfxRequired: false, vfxNotes: "",
    notes: "First real connection between leads. Chemistry is crucial.", estimatedDuration: "5 min", pages: 3.5,
    status: "not-scheduled", synopsis: "Cole tracks Maya down in the town square. Their conversation shifts from suspicious interrogation to reluctant alliance as Maya shares what the manuscript revealed.",
  },
  {
    id: "sc-n12", projectId: "p2", sceneNumber: "12", heading: "COASTAL CLIFF — OVERLOOK",
    intExt: "EXT", location: "Coastal Location TBD", timeOfDay: "NIGHT",
    characters: ["Inspector Arjun Cole"],
    props: [bp("prop", "Flashlight"), bp("prop", "Phone")],
    costumes: [bp("costume", "Cole: heavy coat")],
    vehicles: [], specialRequirements: [bp("special", "Practical wind FX"), bp("special", "SFX: ethereal distant sound")],
    vfxRequired: true, vfxNotes: "Apparition figure composited in distance — subtle, ambiguous. Enhanced moonlight.",
    notes: "Episode cliffhanger. VFX apparition must be subtle — audience should wonder if it's real.", estimatedDuration: "2 min", pages: 1.5,
    status: "not-scheduled", synopsis: "Cole returns to the cliff at night. In the fog below, he sees something — a figure that shouldn't be there. When he blinks, it's gone. Or is it?",
  },
];

const seedVersions: ScriptVersion[] = [
  { id: "sv-1", projectId: "p1", version: "1.0", label: "White Draft", date: "2025-12-01", author: "Rajkumar Menon", pageCount: 118, sceneCount: 65, notes: "First complete draft. Story locked for budget estimation.", color: "bg-white text-zinc-900", isCurrent: false },
  { id: "sv-2", projectId: "p1", version: "1.1", label: "Blue Revision", date: "2026-01-15", author: "Rajkumar Menon", pageCount: 122, sceneCount: 67, notes: "Added two new character scenes per producer notes. Expanded spacecraft sequences.", color: "bg-blue-200 text-blue-900", isCurrent: false },
  { id: "sv-3", projectId: "p1", version: "1.2", label: "Pink Revision", date: "2026-02-20", author: "Rajkumar Menon", pageCount: 120, sceneCount: 65, notes: "Cut two scenes for pacing. Revised Kwame's arc per actor notes. VFX breakdown updated.", color: "bg-pink-200 text-pink-900", isCurrent: false },
  { id: "sv-4", projectId: "p1", version: "2.0", label: "Yellow Draft", date: "2026-04-10", author: "Rajkumar Menon", pageCount: 124, sceneCount: 68, notes: "Production draft. All departments signed off. Added flashback sequences.", color: "bg-yellow-200 text-yellow-900", isCurrent: false },
  { id: "sv-5", projectId: "p1", version: "2.1", label: "Green Revision", date: "2026-07-05", author: "Rajkumar Menon", pageCount: 123, sceneCount: 68, notes: "Current shooting script. Minor dialogue changes from rehearsals. Final VFX shots locked.", color: "bg-green-200 text-green-900", isCurrent: true },

  { id: "sv-6", projectId: "p2", version: "1.0", label: "White Draft", date: "2026-05-01", author: "Anvita Dutt", pageCount: 52, sceneCount: 28, notes: "Episode 1 pilot draft. Character introductions and core mystery established.", color: "bg-white text-zinc-900", isCurrent: false },
  { id: "sv-7", projectId: "p2", version: "1.1", label: "Blue Revision", date: "2026-07-20", author: "Anvita Dutt", pageCount: 55, sceneCount: 30, notes: "Added Maya backstory scenes. Expanded cliffhanger ending.", color: "bg-blue-200 text-blue-900", isCurrent: true },

  { id: "sv-8", projectId: "p3", version: "3.0", label: "Locked Script", date: "2026-02-01", author: "Leena Yadav", pageCount: 98, sceneCount: 52, notes: "Final locked script. All scenes wrapped. Script locked for post-production reference.", color: "bg-emerald-200 text-emerald-900", isCurrent: true },
];


function nextSceneId(scenes: Scene[]) {
  return (
    scenes.reduce((highest, scene) => {
      const match = scene.id.match(/^sc(?:-new)?-(\d+)$/) ?? scene.id.match(/^sc(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1
  );
}

export function getScenesByProject(projectId: string): Scene[] {
  return getAppDataSlice("scenes").filter((s) => s.projectId === projectId);
}

export function getSceneById(id: string): Scene | undefined {
  return getAppDataSlice("scenes").find((s) => s.id === id);
}

export function getAllScenes(): Scene[] {
  return getAppDataSlice("scenes");
}

export function getScriptVersionsByProject(projectId: string): ScriptVersion[] {
  return getAppDataSlice("scriptVersions").filter((v) => v.projectId === projectId);
}

export function getScriptVersions(): ScriptVersion[] {
  return getAppDataSlice("scriptVersions");
}

export function updateScene(id: string, updates: Partial<Omit<Scene, "id" | "projectId">>): Scene | undefined {
  let updatedScene: Scene | undefined;

  updateAppDataSlice("scenes", (current) =>
    current.map((scene) => {
      if (scene.id !== id) {
        return scene;
      }

      updatedScene = { ...scene, ...updates };
      return updatedScene;
    })
  );

  return updatedScene;
}

export interface CreateSceneInput {
  projectId: string;
  sceneNumber: string;
  heading: string;
  intExt: IntExt;
  location: string;
  timeOfDay: TimeOfDay;
  characters: string[];
  synopsis: string;
  estimatedDuration: string;
  pages: number;
  notes: string;
  vfxRequired: boolean;
  vfxNotes: string;
}

export function createScene(input: CreateSceneInput): Scene {
  const scenes = getAllScenes();
  const id = `sc-new-${nextSceneId(scenes)}`;
  const scene: Scene = {
    id,
    projectId: input.projectId,
    sceneNumber: input.sceneNumber,
    heading: input.heading,
    intExt: input.intExt,
    location: input.location,
    timeOfDay: input.timeOfDay,
    characters: input.characters,
    props: [],
    costumes: [],
    vehicles: [],
    specialRequirements: [],
    vfxRequired: input.vfxRequired,
    vfxNotes: input.vfxNotes,
    notes: input.notes,
    estimatedDuration: input.estimatedDuration,
    pages: input.pages,
    status: "not-scheduled",
    synopsis: input.synopsis,
  };
  updateAppDataSlice("scenes", (current) => [...current, scene]);
  return scene;
}

export function useAllScenes() {
  return useAppDataSlice("scenes");
}

export function useScenesByProject(projectId: string) {
  return useAppDataSelector((data) => data.scenes.filter((scene) => scene.projectId === projectId));
}

export function useScene(id: string) {
  return useAppDataSelector((data) => data.scenes.find((scene) => scene.id === id));
}

export function useScriptVersions() {
  return useAppDataSlice("scriptVersions");
}

export function useScriptVersionsByProject(projectId: string) {
  return useAppDataSelector((data) =>
    data.scriptVersions.filter((version) => version.projectId === projectId)
  );
}
