import type { AppDataCollections } from "./app-data-store";
import type {
  AttendanceRecord,
  BudgetLineItem,
  CallSheet,
  CameraCard,
  CastMember,
  CharacterProfile,
  CrewMember,
  DeliverableItem,
  DprReport,
  EquipmentItem,
  ExpenseItem,
  FootageMetadata,
  MarketingItem,
  Notification,
  PayrollEntry,
  PostProductionItem,
  ProductionTask,
  Project,
  ProjectLocation,
  RightsDeal,
  ScheduleEntry,
  Scene,
  Script,
  SeriesEpisode,
  SeriesSeason,
  ShootDay,
  Shot,
  ScriptReference,
  StorageDevice,
  SubtitleLanguage,
  VendorRecord,
  VfxShot,
  CastCandidate,
  CastCandidateStatus,
  CastCategory,
} from "./types";
import { demoImage } from "./demo-image";
import { projectImageReferences } from "./project-image-references";
import { actorImageReferences } from "./actor-image-references";
import { reconcileVerifiedCredits, verifiedProjectTitles } from "./verified-film-credits";
import * as baseDemo from "./demo-data";

const demoPeopleImagePool = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=85",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=500&q=85",
];

function buildSeedScripts(): Script[] {
  const now = "2026-10-28T10:00:00.000Z";

  // â”€â”€ P1: Pushpa 2 shots & references (unchanged) â”€â”€
  const p1Shots: Shot[] = [
    { id: "shot-1", sceneId: "ss-1", shotNumber: "1A", type: "establishing", movement: "drone", lens: "24mm anamorphic", angle: "bird's-eye", description: "Aerial sweep over Seshachalam forest canopy at dawn, camera descends through mist", duration: "12s", characters: [], equipment: ["DJI Inspire 3", "Anamorphic adapter"], vfx: true, vfxNotes: "Enhance mist, color grade for golden hour", status: "approved", notes: "Schedule for golden hour 5:45-6:15 AM", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80" },
    { id: "shot-2", sceneId: "ss-1", shotNumber: "1B", type: "wide", movement: "steadicam", lens: "35mm", angle: "eye-level", description: "Pushpa walks through sandalwood grove, camera follows from behind", duration: "15s", characters: ["PUSHPA"], equipment: ["Steadicam Volt", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "approved", notes: "Allu Arjun walk â€” rehearse timing with smoke FX", imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80" },
    { id: "shot-3", sceneId: "ss-1", shotNumber: "1C", type: "close-up", movement: "static", lens: "85mm", angle: "eye-level", description: "Pushpa's face â€” determination, sweat on brow, eyes narrow", duration: "4s", characters: ["PUSHPA"], equipment: ["ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "shot", notes: "Get multiple takes for editor options", imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80" },
    { id: "shot-4", sceneId: "ss-2", shotNumber: "2A", type: "wide", movement: "crane", lens: "24mm", angle: "high", description: "Police convoy enters village from dust road, three vehicles", duration: "10s", characters: [], equipment: ["Technocrane 50", "ARRI Alexa 65"], vfx: true, vfxNotes: "Extend convoy, add dust enhancement", status: "storyboarded", notes: "Need 3 matching police vehicles", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80" },
    { id: "shot-5", sceneId: "ss-2", shotNumber: "2B", type: "over-shoulder", movement: "dolly", lens: "50mm", angle: "eye-level", description: "SP Bhanwar Singh surveys the crowd from vehicle, camera pushes in", duration: "8s", characters: ["SP BHANWAR SINGH"], equipment: ["Dana dolly", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "planned", notes: "", imageUrl: "https://images.unsplash.com/photo-1520095972714-909e91b038e5?auto=format&fit=crop&w=800&q=80" },
    { id: "shot-6", sceneId: "ss-2", shotNumber: "2C", type: "medium", movement: "handheld", lens: "40mm", angle: "eye-level", description: "Villagers scatter as police step out, handheld energy", duration: "6s", characters: [], equipment: ["Easyrig Vario 5"], vfx: false, vfxNotes: "", status: "planned", notes: "30 background actors minimum", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
    { id: "shot-7", sceneId: "ss-3", shotNumber: "3A", type: "medium-close", movement: "steadicam", lens: "50mm", angle: "low", description: "Srivalli at the temple entrance, wind in hair, looking up", duration: "5s", characters: ["SRIVALLI"], equipment: ["Steadicam Volt"], vfx: false, vfxNotes: "", status: "planned", notes: "Backlight from temple oil lamps", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80" },
    { id: "shot-8", sceneId: "ss-3", shotNumber: "3B", type: "two-shot", movement: "dolly", lens: "65mm", angle: "eye-level", description: "Srivalli and Pushpa reunion â€” slow dolly in as they see each other", duration: "10s", characters: ["SRIVALLI", "PUSHPA"], equipment: ["Dana dolly", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "planned", notes: "Hero moment â€” Devi Sri Prasad musical cue", imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80" },
  ];
  const p1Refs: ScriptReference[] = [
    { id: "ref-1", category: "image", title: "Seshachalam forest reference", description: "Real forest canopy photos for drone shot composition and color reference", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ss-1"], linkedCharacters: [], tags: ["forest", "drone", "establishing"], createdAt: now, notes: "Source: Location scout November 2025" },
    { id: "ref-2", category: "image", title: "Sandalwood texture close-up", description: "Art department reference for practical set dressing â€” bark and leaf detail", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ss-1"], linkedCharacters: [], tags: ["art-dept", "set-dressing", "texture"], createdAt: now, notes: "Match to actual sandalwood grove colors" },
    { id: "ref-3", category: "video", title: "Pushpa 1 climax sequence", description: "Tone and pacing reference for forest chase choreography", url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ss-1", "ss-2"], linkedCharacters: ["PUSHPA"], tags: ["tone-ref", "action", "choreography"], createdAt: now, notes: "Match energy level, not copy shots" },
    { id: "ref-4", category: "character", title: "Pushpa â€” costume board", description: "Look development for Pushpa's forest outfit â€” aged shirt, lungi style", url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=60", linkedSceneIds: [], linkedCharacters: ["PUSHPA"], tags: ["costume", "character-design"], createdAt: now, notes: "Approved by Sukumar on 2026-03-15" },
    { id: "ref-5", category: "location", title: "Charminar East Gate â€” scout photos", description: "Production scouting reference for city sequences, crowd management plan", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ss-3"], linkedCharacters: [], tags: ["location-scout", "crowd", "permits"], createdAt: now, notes: "Permit window: 5 AM - 8 AM only" },
    { id: "ref-6", category: "prop", title: "Sandalwood logs â€” real vs. prop", description: "Prop department comparison for hero sandalwood logs", url: "https://images.unsplash.com/photo-1520095972714-909e91b038e5?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1520095972714-909e91b038e5?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ss-1", "ss-2"], linkedCharacters: [], tags: ["props", "comparison", "hero-prop"], createdAt: now, notes: "Use real bark texture, foam core interior" },
    { id: "ref-7", category: "location", title: "Visakhapatnam coast â€” aerial survey", description: "Drone footage from location scout for coastal sequences", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=60", linkedSceneIds: [], linkedCharacters: [], tags: ["aerial", "coast", "location-scout"], createdAt: now, notes: "Potential Act 3 location" },
  ];

  // â”€â”€ P2: Kalki 2898 AD shots & references â”€â”€
  const p2Shots: Shot[] = [
    { id: "p2-shot-1", sceneId: "ks-1", shotNumber: "1A", type: "establishing", movement: "drone", lens: "14mm ultra-wide", angle: "bird's-eye", description: "Vast overhead of the dystopian Kasi cityscape â€” towering Complex spire, smog layers, refugee camps below", duration: "15s", characters: [], equipment: ["DJI Inspire 3", "ARRI Alexa 65"], vfx: true, vfxNotes: "Full CG city extension from plate photography â€” DNEG lead", status: "shot", notes: "Plate shot at Ramoji backlot, CG city built on top", imageUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80" },
    { id: "p2-shot-2", sceneId: "ks-1", shotNumber: "1B", type: "medium", movement: "steadicam", lens: "40mm", angle: "eye-level", description: "Bhairava weaves through the Kasi bazaar crowd, Bujji hovering alongside", duration: "18s", characters: ["BHAIRAVA"], equipment: ["Steadicam Volt", "ARRI Alexa Mini LF", "Tracking markers"], vfx: true, vfxNotes: "Bujji full CG composited into live plate", status: "shot", notes: "200 background actors in dystopian costume", imageUrl: "https://images.unsplash.com/photo-1535732820275-9ffd998cac22?auto=format&fit=crop&w=800&q=80" },
    { id: "p2-shot-3", sceneId: "ks-2", shotNumber: "2A", type: "wide", movement: "crane", lens: "24mm anamorphic", angle: "high", description: "Ashwatthama stands atop Shambhala fortress wall, camera cranes down to reveal the army massing below", duration: "14s", characters: ["ASHWATTHAMA"], equipment: ["Technocrane 50", "ARRI Alexa 65"], vfx: true, vfxNotes: "Fortress wall extension, army crowd multiplication", status: "approved", notes: "Amitabh Bachchan â€” schedule with stunt double for wide", imageUrl: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=800&q=80" },
    { id: "p2-shot-4", sceneId: "ks-2", shotNumber: "2B", type: "close-up", movement: "static", lens: "100mm", angle: "eye-level", description: "Ashwatthama's eyes â€” ancient resolve, divine glow reflected in iris", duration: "4s", characters: ["ASHWATTHAMA"], equipment: ["ARRI Alexa Mini LF"], vfx: true, vfxNotes: "Subtle eye glow VFX enhancement", status: "approved", notes: "Prosthetic aging makeup check before take", imageUrl: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=800&q=80" },
    { id: "p2-shot-5", sceneId: "ks-3", shotNumber: "3A", type: "medium-close", movement: "dolly", lens: "50mm", angle: "low", description: "Sumathi clutches her abdomen protectively, stepping backward from Complex soldiers", duration: "6s", characters: ["SUMATHI"], equipment: ["Dana dolly", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "storyboarded", notes: "Deepika Padukone â€” minimal dialogue, performance-driven", imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80" },
    { id: "p2-shot-6", sceneId: "ks-4", shotNumber: "4A", type: "wide", movement: "track", lens: "21mm", angle: "low", description: "Supreme Yaskin's throne room â€” massive scale reveal as doors open, camera tracks forward", duration: "20s", characters: ["SUPREME YASKIN"], equipment: ["Track rails 40ft", "ARRI Alexa 65", "Steadicam backup"], vfx: true, vfxNotes: "Full CG throne room extension, particle atmosphere", status: "storyboarded", notes: "Kamal Haasan prosthetic â€” 4hr makeup call", imageUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80" },
  ];
  const p2Refs: ScriptReference[] = [
    { id: "k-ref-1", category: "image", title: "Kasi city concept art â€” production design bible", description: "Approved concept paintings for the dystopian Kasi cityscape, building silhouettes, color palette", url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ks-1"], linkedCharacters: [], tags: ["concept-art", "production-design", "world-building"], createdAt: now, notes: "Art director Nitin Zihani Choudhary final approvals" },
    { id: "k-ref-2", category: "video", title: "Bujji vehicle on-set reference footage", description: "Practical Bujji vehicle rig on Ramoji backlot â€” tracking markers for CG replacement", url: "https://images.unsplash.com/photo-1535732820275-9ffd998cac22?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1535732820275-9ffd998cac22?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ks-1"], linkedCharacters: ["BHAIRAVA"], tags: ["vfx-reference", "vehicle", "on-set"], createdAt: now, notes: "6-ton hydraulic rig, speed limited to 15 kmph on set" },
    { id: "k-ref-3", category: "character", title: "Ashwatthama â€” prosthetic and armor board", description: "Final approved look for Ashwatthama armor plating, staff weapon, aging prosthetics", url: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ks-2"], linkedCharacters: ["ASHWATTHAMA"], tags: ["prosthetic", "armor", "character-design"], createdAt: now, notes: "4-hour application, 1.5-hour removal â€” schedule accordingly" },
    { id: "k-ref-4", category: "location", title: "Ramoji Film City â€” Complex interior stage layout", description: "Stage floor plans for the Complex interior set build, rigging points, power distribution", url: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ks-4"], linkedCharacters: [], tags: ["stage-plan", "set-build", "rigging"], createdAt: now, notes: "Stage 7 and 8 combined â€” 40,000 sq ft" },
    { id: "k-ref-5", category: "audio", title: "Santhosh Narayanan â€” orchestral temp score", description: "Temp orchestral cues for Shambhala battle and Yaskin throne room sequences", url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ks-2", "ks-4"], linkedCharacters: [], tags: ["temp-score", "orchestral", "sound-design"], createdAt: now, notes: "European choral recording scheduled for final mix" },
  ];

  // â”€â”€ P3: Devara Part 1 shots & references â”€â”€
  const p3Shots: Shot[] = [
    { id: "p3-shot-1", sceneId: "ds-1", shotNumber: "1A", type: "establishing", movement: "drone", lens: "16mm", angle: "bird's-eye", description: "Aerial approach over rough ocean waves toward the coastal village â€” fishing boats dot the shoreline", duration: "14s", characters: [], equipment: ["DJI Inspire 3", "ARRI Alexa Mini LF"], vfx: true, vfxNotes: "Ocean enhancement, extend village coastline", status: "shot", notes: "Vizag coast â€” tide window 6:00-7:30 AM", imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80" },
    { id: "p3-shot-2", sceneId: "ds-1", shotNumber: "1B", type: "wide", movement: "steadicam", lens: "32mm", angle: "eye-level", description: "Devara walks along the shore, villagers part to make way, camera follows in single take", duration: "22s", characters: ["DEVARA"], equipment: ["Steadicam Volt", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "shot", notes: "Jr NTR hero walk â€” 80 background actors, fishing nets dressed", imageUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80" },
    { id: "p3-shot-3", sceneId: "ds-2", shotNumber: "2A", type: "medium", movement: "handheld", lens: "40mm", angle: "eye-level", description: "Bhaira confronts Devara across the smuggling boat deck, both soaked in rain", duration: "8s", characters: ["DEVARA", "BHAIRA"], equipment: ["Easyrig Vario 5", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "approved", notes: "Rain tower on both sides, Saif Ali Khan stunt rehearsal required", imageUrl: "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=800&q=80" },
    { id: "p3-shot-4", sceneId: "ds-2", shotNumber: "2B", type: "close-up", movement: "static", lens: "85mm", angle: "eye-level", description: "Devara's eyes â€” cold fury, rain streaking down face", duration: "3s", characters: ["DEVARA"], equipment: ["ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "approved", notes: "Hero close-up â€” multiple takes for intensity variation", imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80" },
    { id: "p3-shot-5", sceneId: "ds-3", shotNumber: "3A", type: "wide", movement: "crane", lens: "24mm", angle: "high", description: "Underwater cargo hold revealed as tide rushes in â€” crates of weapons float loose", duration: "10s", characters: [], equipment: ["Technocrane 50", "Underwater housing", "ARRI Alexa Mini LF"], vfx: true, vfxNotes: "Water simulation extension, weapon crate CG multiplication", status: "storyboarded", notes: "Ramoji water tank â€” safety divers on standby", imageUrl: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=800&q=80" },
  ];
  const p3Refs: ScriptReference[] = [
    { id: "d-ref-1", category: "location", title: "Vizag coast â€” fishing village scout", description: "Location photographs of active fishing villages along Visakhapatnam coastline for set dressing reference", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ds-1"], linkedCharacters: [], tags: ["location-scout", "coastal", "fishing-village"], createdAt: now, notes: "Permit secured for Rushikonda beach stretch" },
    { id: "d-ref-2", category: "video", title: "Ocean tank test footage â€” Ramoji", description: "Test shoots from Ramoji Film City ocean tank facility for underwater and rain sequences", url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ds-2", "ds-3"], linkedCharacters: [], tags: ["water-tank", "test-footage", "underwater"], createdAt: now, notes: "Tank depth 12ft, wave machine calibrated for 4ft swells" },
    { id: "d-ref-3", category: "character", title: "Devara â€” clan chief costume board", description: "Approved costume design for Devara's coastal chieftain look â€” weathered fabric, shell necklace, arm wraps", url: "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=300&q=60", linkedSceneIds: [], linkedCharacters: ["DEVARA"], tags: ["costume", "character-design", "coastal"], createdAt: now, notes: "Three duplicate sets for water damage rotation" },
    { id: "d-ref-4", category: "prop", title: "Smuggling boat â€” practical build specs", description: "Art department build specifications for the hero smuggling trawler â€” 40ft wooden hull, aged finish", url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ds-2", "ds-3"], linkedCharacters: [], tags: ["prop-build", "boat", "hero-prop"], createdAt: now, notes: "Structurally reinforced for stunt work, breakaway stern section" },
    { id: "d-ref-5", category: "audio", title: "Anirudh â€” coastal storm ambience stems", description: "Sound design reference stems for storm, ocean, and rain layering across water sequences", url: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["ds-2", "ds-3"], linkedCharacters: [], tags: ["sound-design", "ambience", "storm"], createdAt: now, notes: "Wild track recording scheduled at Vizag during monsoon" },
  ];

  // â”€â”€ P4: Game Changer shots & references â”€â”€
  const p4Shots: Shot[] = [
    { id: "p4-shot-1", sceneId: "gs-1", shotNumber: "1A", type: "establishing", movement: "drone", lens: "24mm", angle: "bird's-eye", description: "Government building exterior at dawn, flags waving, security convoy arriving", duration: "8s", characters: [], equipment: ["DJI Inspire 3"], vfx: true, vfxNotes: "Sky replacement, enhance building facade", status: "approved", notes: "", imageUrl: "https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=800&q=80" },
    { id: "p4-shot-2", sceneId: "gs-1", shotNumber: "1B", type: "medium", movement: "steadicam", lens: "35mm", angle: "eye-level", description: "Ram Nandan enters collector's office, walks past staff â€” single continuous take", duration: "12s", characters: ["RAM NANDAN"], equipment: ["Steadicam Volt", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "planned", notes: "One continuous take preferred â€” Ram Charan walk rehearsal", imageUrl: "https://images.unsplash.com/photo-1555952494-efd681c7e3f9?auto=format&fit=crop&w=800&q=80" },
    { id: "p4-shot-3", sceneId: "gs-2", shotNumber: "2A", type: "close-up", movement: "static", lens: "100mm macro", angle: "eye-level", description: "Ballot box seal being broken â€” extreme detail insert", duration: "3s", characters: [], equipment: ["ARRI Alexa Mini LF", "Macro lens"], vfx: false, vfxNotes: "", status: "planned", notes: "Insert shot â€” hero prop needed", imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80" },
    { id: "p4-shot-4", sceneId: "gs-2", shotNumber: "2B", type: "group", movement: "crane", lens: "24mm", angle: "high", description: "Crowd erupts at election result announcement â€” wide chaos", duration: "8s", characters: [], equipment: ["Technocrane 50"], vfx: true, vfxNotes: "Crowd multiplication â€” extend from 200 to 2000", status: "storyboarded", notes: "200 background actors, rest VFX", imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80" },
    { id: "p4-shot-5", sceneId: "gs-3", shotNumber: "3A", type: "wide", movement: "track", lens: "32mm", angle: "low", description: "Ram Nandan confronts the CM across the assembly floor, camera tracks parallel", duration: "15s", characters: ["RAM NANDAN", "CM BOORA NARSAIAH"], equipment: ["Track rails 30ft", "ARRI Alexa 65"], vfx: false, vfxNotes: "", status: "planned", notes: "Assembly set on Stage 4 â€” 150 BG artists as MLAs", imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80" },
    { id: "p4-shot-6", sceneId: "gs-3", shotNumber: "3B", type: "over-shoulder", movement: "dolly", lens: "75mm", angle: "eye-level", description: "Over CM's shoulder onto Ram Nandan â€” defiance in his stance", duration: "6s", characters: ["RAM NANDAN", "CM BOORA NARSAIAH"], equipment: ["Dana dolly", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "planned", notes: "Key confrontation â€” multiple coverage angles", imageUrl: "https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=800&q=80" },
  ];
  const p4Refs: ScriptReference[] = [
    { id: "g-ref-1", category: "image", title: "AP Legislative Assembly â€” architecture reference", description: "Interior and exterior photographs for accurate assembly hall set recreation", url: "https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["gs-3"], linkedCharacters: [], tags: ["set-design", "architecture", "assembly"], createdAt: now, notes: "Art dept to replicate facade columns and chamber layout" },
    { id: "g-ref-2", category: "image", title: "Government building facade reference", description: "Architecture reference for the collector's office exterior and interior design", url: "https://images.unsplash.com/photo-1555952494-efd681c7e3f9?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1555952494-efd681c7e3f9?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["gs-1"], linkedCharacters: [], tags: ["set-design", "architecture"], createdAt: now, notes: "Based on real AP collectorate buildings" },
    { id: "g-ref-3", category: "audio", title: "Election crowd ambience", description: "Sound design reference â€” crowd reactions, slogans, loudspeaker PA systems", url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["gs-2"], linkedCharacters: [], tags: ["sound-design", "crowd", "ambience"], createdAt: now, notes: "Record wild track on location" },
    { id: "g-ref-4", category: "character", title: "Ram Nandan â€” IAS officer wardrobe board", description: "Approved look for Ram Nandan's formal IAS attire â€” crisp white shirt, formal trousers progression", url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=300&q=60", linkedSceneIds: [], linkedCharacters: ["RAM NANDAN"], tags: ["costume", "character-design", "formal"], createdAt: now, notes: "Costume ages across three acts â€” fresh to battle-worn" },
    { id: "g-ref-5", category: "prop", title: "Election ballot box â€” hero prop build", description: "Custom-built hero ballot box with breakaway seal mechanism for close-up insert shots", url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["gs-2"], linkedCharacters: [], tags: ["hero-prop", "election", "insert-shot"], createdAt: now, notes: "Two identical units â€” one sealed, one pre-broken for continuity" },
  ];

  // â”€â”€ P5: They Call Him OG shots & references â”€â”€
  const p5Shots: Shot[] = [
    { id: "p5-shot-1", sceneId: "os-1", shotNumber: "1A", type: "establishing", movement: "drone", lens: "24mm", angle: "bird's-eye", description: "Mumbai port at night â€” container ships, dockside lights, crane silhouettes against hazy sky", duration: "10s", characters: [], equipment: ["DJI Inspire 3", "ARRI Alexa Mini LF"], vfx: true, vfxNotes: "Enhance dock lights, add distant ship traffic", status: "approved", notes: "Actual Mumbai port permit 10 PM - 4 AM window", imageUrl: "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=800&q=80" },
    { id: "p5-shot-2", sceneId: "os-1", shotNumber: "1B", type: "medium", movement: "steadicam", lens: "40mm anamorphic", angle: "eye-level", description: "OG emerges from shadows between shipping containers, walks toward camera, face lit by sodium vapor", duration: "12s", characters: ["OG"], equipment: ["Steadicam Volt", "ARRI Alexa Mini LF", "Anamorphic Hawk V-Lite"], vfx: false, vfxNotes: "", status: "approved", notes: "Pawan Kalyan hero entrance â€” anamorphic flares from dock lights", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80" },
    { id: "p5-shot-3", sceneId: "os-2", shotNumber: "2A", type: "wide", movement: "track", lens: "28mm", angle: "low", description: "Omi Bhau's warehouse lair â€” camera tracks along rows of contraband, armed men in silhouette", duration: "14s", characters: ["OMI BHAU"], equipment: ["Track rails 30ft", "ARRI Alexa 65"], vfx: false, vfxNotes: "", status: "storyboarded", notes: "Emraan Hashmi â€” subtle menace, underplay the villain entrance", imageUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80" },
    { id: "p5-shot-4", sceneId: "os-2", shotNumber: "2B", type: "two-shot", movement: "dolly", lens: "50mm", angle: "eye-level", description: "OG and Omi Bhau face off across warehouse table â€” slow push in", duration: "10s", characters: ["OG", "OMI BHAU"], equipment: ["Dana dolly", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "planned", notes: "Key confrontation scene â€” tension build with silence", imageUrl: "https://images.unsplash.com/photo-1520095972714-909e91b038e5?auto=format&fit=crop&w=800&q=80" },
    { id: "p5-shot-5", sceneId: "os-3", shotNumber: "3A", type: "medium-close", movement: "handheld", lens: "50mm", angle: "eye-level", description: "OG in katana stance inside the dojo, fluorescent tubes flicker overhead", duration: "6s", characters: ["OG"], equipment: ["Easyrig Vario 5", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "planned", notes: "Pawan Kalyan sword training for 3 weeks prior", imageUrl: "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=800&q=80" },
  ];
  const p5Refs: ScriptReference[] = [
    { id: "o-ref-1", category: "location", title: "Mumbai container port â€” night scout", description: "Night photography from Mumbai port scouting sessions for lighting and staging reference", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["os-1"], linkedCharacters: [], tags: ["location-scout", "night", "port"], createdAt: now, notes: "Security clearance required â€” port authority liaison: Deepak M." },
    { id: "o-ref-2", category: "character", title: "OG â€” neo-noir wardrobe board", description: "Approved costume design â€” dark overcoat, fitted tactical wear, aging from decade in exile", url: "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=300&q=60", linkedSceneIds: [], linkedCharacters: ["OG"], tags: ["costume", "character-design", "neo-noir"], createdAt: now, notes: "Three aging stages â€” exile, return, final confrontation" },
    { id: "o-ref-3", category: "prop", title: "Katana hero prop â€” forged steel", description: "Custom-forged hero katana with retractable blade mechanism for close-quarters choreography", url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["os-3"], linkedCharacters: ["OG"], tags: ["hero-prop", "weapon", "stunt-safe"], createdAt: now, notes: "Two units: display steel + rubber stunt duplicate" },
    { id: "o-ref-4", category: "video", title: "Gun-fu choreography pre-vis", description: "Stunt team pre-visualization for warehouse shootout blending martial arts with firearm choreography", url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["os-2", "os-3"], linkedCharacters: ["OG"], tags: ["stunt-previs", "choreography", "action"], createdAt: now, notes: "Peter Hein action unit â€” 12 stunt performers" },
  ];

  // â”€â”€ P6: HIT: The Third Case shots & references â”€â”€
  const p6Shots: Shot[] = [
    { id: "p6-shot-1", sceneId: "hs-1", shotNumber: "1A", type: "establishing", movement: "drone", lens: "35mm", angle: "high", description: "HIT headquarters exterior at dawn â€” sterile government building, squad cars parked outside", duration: "8s", characters: [], equipment: ["DJI Inspire 3"], vfx: false, vfxNotes: "", status: "shot", notes: "Hyderabad police commissionerate exterior â€” permit secured", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80" },
    { id: "p6-shot-2", sceneId: "hs-1", shotNumber: "1B", type: "medium", movement: "steadicam", lens: "32mm", angle: "eye-level", description: "Arjun Sarkaar walks through the forensic lab, examining evidence boards, camera follows tight", duration: "16s", characters: ["ARJUN SARKAAR"], equipment: ["Steadicam Volt", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "shot", notes: "Nani â€” methodical, obsessive energy â€” single take preferred", imageUrl: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&q=80" },
    { id: "p6-shot-3", sceneId: "hs-2", shotNumber: "2A", type: "close-up", movement: "static", lens: "100mm macro", angle: "eye-level", description: "Evidence close-up â€” blood-stained fiber under UV light, forensic detail", duration: "3s", characters: [], equipment: ["ARRI Alexa Mini LF", "Macro probe lens"], vfx: false, vfxNotes: "", status: "approved", notes: "Practical UV lighting rig â€” props dept blood typing", imageUrl: "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?auto=format&fit=crop&w=800&q=80" },
    { id: "p6-shot-4", sceneId: "hs-2", shotNumber: "2B", type: "over-shoulder", movement: "dolly", lens: "50mm", angle: "eye-level", description: "Arjun studying the crime scene photographs pinned to the investigation board", duration: "8s", characters: ["ARJUN SARKAAR"], equipment: ["Dana dolly", "ARRI Alexa Mini LF"], vfx: false, vfxNotes: "", status: "approved", notes: "Props: 40+ crime scene photos, string connections, annotated maps", imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80" },
    { id: "p6-shot-5", sceneId: "hs-3", shotNumber: "3A", type: "wide", movement: "handheld", lens: "24mm", angle: "eye-level", description: "Snow-covered hideout exterior â€” Arjun and tactical team approach through treeline at dawn", duration: "12s", characters: ["ARJUN SARKAAR"], equipment: ["Easyrig Vario 5", "ARRI Alexa Mini LF"], vfx: true, vfxNotes: "Snow enhancement, breath vapor addition", status: "planned", notes: "Manali location â€” early morning fog for atmosphere", imageUrl: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?auto=format&fit=crop&w=800&q=80" },
    { id: "p6-shot-6", sceneId: "hs-3", shotNumber: "3B", type: "pov", movement: "handheld", lens: "28mm", angle: "eye-level", description: "POV through night-vision scope â€” scanning the hideout windows for movement", duration: "5s", characters: [], equipment: ["GoPro Hero 12", "NV scope attachment"], vfx: true, vfxNotes: "Night-vision green overlay, HUD elements", status: "planned", notes: "Practical NV footage with CG HUD composited", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80" },
  ];
  const p6Refs: ScriptReference[] = [
    { id: "h-ref-1", category: "location", title: "Hyderabad forensic lab â€” reference visit", description: "Photographs from guided visit to actual police forensic wing for set accuracy", url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["hs-1", "hs-2"], linkedCharacters: [], tags: ["location-reference", "forensic", "set-accuracy"], createdAt: now, notes: "Forensic advisor Dr. Raman consulting on prop accuracy" },
    { id: "h-ref-2", category: "location", title: "Manali snow terrain â€” aerial scout", description: "Drone survey of Manali valley locations for the mountain hideout sequence exterior", url: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["hs-3"], linkedCharacters: [], tags: ["location-scout", "snow", "mountain"], createdAt: now, notes: "Best window: late November to early December for consistent snow" },
    { id: "h-ref-3", category: "character", title: "Arjun Sarkaar â€” SP uniform progression", description: "Costume board showing SP Arjun Sarkaar's look across three investigation phases", url: "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?auto=format&fit=crop&w=300&q=60", linkedSceneIds: [], linkedCharacters: ["ARJUN SARKAAR"], tags: ["costume", "character-design", "police"], createdAt: now, notes: "Phase 1: crisp formal, Phase 2: rolled sleeves, Phase 3: field tactical" },
    { id: "h-ref-4", category: "audio", title: "Mickey J. Meyer â€” suspense score demos", description: "Temp score cues for forensic lab tension sequences and mountain pursuit ambience", url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["hs-1", "hs-3"], linkedCharacters: [], tags: ["temp-score", "suspense", "sound-design"], createdAt: now, notes: "Low-frequency drone textures approved by director" },
    { id: "h-ref-5", category: "prop", title: "Investigation board â€” layout mockup", description: "Detailed mockup of the evidence investigation board with victim photos, string connections, map pins", url: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["hs-2"], linkedCharacters: ["ARJUN SARKAAR"], tags: ["prop-design", "investigation", "hero-prop"], createdAt: now, notes: "40 unique evidence photos, color-coded string connections" },
  ];

  // â”€â”€ P7: The Raja Saab shots & references â”€â”€
  const p7Shots: Shot[] = [
    { id: "p7-shot-1", sceneId: "rs-1", shotNumber: "1A", type: "establishing", movement: "crane", lens: "24mm", angle: "low", description: "Ancestral palace exterior at night â€” camera cranes up from gate to reveal the full Gothic facade, lightning flash", duration: "12s", characters: [], equipment: ["Technocrane 50", "ARRI Alexa Mini LF"], vfx: true, vfxNotes: "Lightning FX, atmospheric fog enhancement, flying bats", status: "approved", notes: "Ramoji palace set â€” night exterior, 40ft crane clearance confirmed", imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80" },
    { id: "p7-shot-2", sceneId: "rs-1", shotNumber: "1B", type: "wide", movement: "steadicam", lens: "18mm", angle: "eye-level", description: "Raja enters the palace foyer â€” camera follows as chandeliers sway, dust particles float in moonbeams", duration: "18s", characters: ["RAJA"], equipment: ["Steadicam Volt", "ARRI Alexa Mini LF", "Haze machine"], vfx: true, vfxNotes: "Chandelier sway enhancement, floating dust particles CG", status: "approved", notes: "Prabhas â€” comedic unease, checking over shoulder", imageUrl: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80" },
    { id: "p7-shot-3", sceneId: "rs-2", shotNumber: "2A", type: "medium-close", movement: "dolly", lens: "50mm", angle: "eye-level", description: "The Ghost materializes in the ornate mirror behind Raja, camera dollies in on the reflection", duration: "8s", characters: ["THE GHOST", "RAJA"], equipment: ["Dana dolly", "ARRI Alexa Mini LF", "Half-silvered mirror rig"], vfx: true, vfxNotes: "Ghost materialization â€” practical mirror rig + CG smoke tendrils", status: "storyboarded", notes: "Sanjay Dutt ghost makeup â€” 3hr prosthetic application", imageUrl: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=800&q=80" },
    { id: "p7-shot-4", sceneId: "rs-2", shotNumber: "2B", type: "two-shot", movement: "steadicam", lens: "35mm", angle: "eye-level", description: "Ghost and Raja face to face in the portrait hall, ghost floating 6 inches off ground", duration: "10s", characters: ["THE GHOST", "RAJA"], equipment: ["Steadicam Volt", "Wire rig", "ARRI Alexa Mini LF"], vfx: true, vfxNotes: "Wire removal, ghost levitation, spectral glow", status: "storyboarded", notes: "Sanjay Dutt on wire rig â€” safety harness under costume", imageUrl: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=800&q=80" },
    { id: "p7-shot-5", sceneId: "rs-3", shotNumber: "3A", type: "wide", movement: "crane", lens: "24mm", angle: "high", description: "Grand ballroom set for the vintage dance number â€” 200 dancers in period costume, chandelier centerpiece", duration: "15s", characters: ["RAJA"], equipment: ["Technocrane 50", "ARRI Alexa 65"], vfx: true, vfxNotes: "Crowd extension from 200 to 500 dancers, chandelier sparkle enhancement", status: "planned", notes: "3-day song shoot â€” Prabhas dance rehearsal 2 weeks prior", imageUrl: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=800&q=80" },
  ];
  const p7Refs: ScriptReference[] = [
    { id: "r-ref-1", category: "image", title: "Gothic palace â€” art direction mood board", description: "Reference images for the ancestral palace set â€” Victorian Gothic with Indian royal elements", url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["rs-1", "rs-2"], linkedCharacters: [], tags: ["set-design", "gothic", "palace"], createdAt: now, notes: "Inspired by Falaknuma and Brijraj Bhawan interiors" },
    { id: "r-ref-2", category: "character", title: "The Ghost â€” prosthetic design board", description: "Approved prosthetic and costume design for the royal ghost character â€” regal decay aesthetic", url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=300&q=60", linkedSceneIds: [], linkedCharacters: ["THE GHOST"], tags: ["prosthetic", "character-design", "ghost"], createdAt: now, notes: "Sanjay Dutt â€” 3hr application, test run completed" },
    { id: "r-ref-3", category: "prop", title: "Vintage Rolls Royce â€” hero vehicle specs", description: "Restored 1930s Rolls Royce Phantom for the palace driveway sequences â€” mechanical and cosmetic specs", url: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["rs-1"], linkedCharacters: [], tags: ["hero-vehicle", "vintage", "period"], createdAt: now, notes: "Owner: classic car collector Hyderabad â€” rental agreement signed" },
    { id: "r-ref-4", category: "video", title: "Period dance choreography â€” rehearsal tapes", description: "Dance rehearsal footage for the grand ballroom vintage number â€” 200 dancer formations", url: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["rs-3"], linkedCharacters: ["RAJA"], tags: ["choreography", "rehearsal", "song-sequence"], createdAt: now, notes: "Sekhar master choreography â€” three formation changes" },
    { id: "r-ref-5", category: "audio", title: "Thaman S â€” haunted palace ambient stems", description: "Sound design stems for creaking doors, wind through corridors, distant whispers, clock chimes", url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=800&q=80", thumbnail: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=300&q=60", linkedSceneIds: ["rs-1", "rs-2"], linkedCharacters: [], tags: ["sound-design", "horror", "ambience"], createdAt: now, notes: "Foley session scheduled at Annapurna Studios" },
  ];

  return [
    // â”€â”€ P1: Pushpa 2: The Rule (unchanged) â”€â”€
    {
      id: "p1-s1", projectId: "p1", title: "Pushpa 2: The Rule â€” Main Screenplay", type: "Feature Film" as const,
      language: "Telugu", genre: "Action Drama", writer: "Sukumar", storyBy: "Sukumar", screenplayBy: "Sukumar",
      dialoguesBy: "Sukumar", scriptCoordinator: "Ravi Shankar", draftName: "Shooting Draft Rev 3",
      draftNumber: "5", status: "Shooting Draft" as const, notes: "Locked for production. Minor dialogue adjustments allowed with director approval.",
      createdAt: "2025-06-15T10:00:00.000Z", updatedAt: now, createdBy: "Production Team", archived: false, isMain: true,
      blocks: [
        { id: "b1", type: "scene_heading" as const, text: "EXT. SESHACHALAM FOREST â€” DAWN", sceneId: "ss-1" },
        { id: "b2", type: "action" as const, text: "Mist rolls between ancient sandalwood trees. The forest is alive â€” birds, insects, rustling. Camera drifts through the canopy." },
        { id: "b3", type: "character" as const, text: "PUSHPA" },
        { id: "b4", type: "parenthetical" as const, text: "(walking slowly, surveying his domain)" },
        { id: "b5", type: "dialogue" as const, text: "Ee adavi lo raja evarante... Pushpa Raj." },
        { id: "b6", type: "action" as const, text: "Pushpa runs his hand along the bark of a sandalwood tree. His eyes scan the grove â€” counting, assessing." },
        { id: "b7", type: "scene_heading" as const, text: "EXT. VILLAGE ROAD â€” DAY", sceneId: "ss-2" },
        { id: "b8", type: "action" as const, text: "Dust rises as three police vehicles barrel down a narrow village road. Villagers stop and stare." },
        { id: "b9", type: "character" as const, text: "SP BHANWAR SINGH" },
        { id: "b10", type: "dialogue" as const, text: "Pushpa Raj ki location batao. Nahi toh gaon mein ek bhi aadmi nahi bachega." },
        { id: "b11", type: "action" as const, text: "SP Bhanwar Singh steps out in full uniform. His men fan out. The villagers scatter." },
        { id: "b12", type: "character" as const, text: "VILLAGER" },
        { id: "b13", type: "dialogue" as const, text: "Saab, Pushpa anna gaon mein nahi hai. Jangal mein gaye." },
        { id: "b14", type: "scene_heading" as const, text: "EXT. TEMPLE ENTRANCE â€” DUSK", sceneId: "ss-3" },
        { id: "b15", type: "action" as const, text: "Oil lamps flicker at the ancient temple entrance. Srivalli stands at the threshold, wind catching her dupatta." },
        { id: "b16", type: "character" as const, text: "SRIVALLI" },
        { id: "b17", type: "parenthetical" as const, text: "(turning, seeing someone approach)" },
        { id: "b18", type: "dialogue" as const, text: "Pushpa... nuvvu tirigochav." },
        { id: "b19", type: "character" as const, text: "PUSHPA" },
        { id: "b20", type: "dialogue" as const, text: "Nenu entha dooram vellina, nee daggiriki vasthanu Srivalli." },
        { id: "b21", type: "transition" as const, text: "CUT TO:" },
      ],
      scenes: [
        { id: "ss-1", number: "1", heading: "SESHACHALAM FOREST â€” DAWN", intExt: "EXT" as const, location: "Seshachalam Forest", timeOfDay: "DAWN" as const, scriptDay: "1", pages: 3, eighths: 24, description: "Pushpa surveys his sandalwood empire at dawn. Establishing his territory and authority.", breakdown: [{ id: "bi-1", category: "prop" as const, name: "Sandalwood logs" }, { id: "bi-2", category: "special" as const, name: "Smoke/mist FX machines" }], status: "shot" as const, blockIds: ["b1", "b2", "b3", "b4", "b5", "b6"] },
        { id: "ss-2", number: "2", heading: "VILLAGE ROAD â€” DAY", intExt: "EXT" as const, location: "Seshachalam Village", timeOfDay: "DAY" as const, scriptDay: "1", pages: 2.5, eighths: 20, description: "SP Bhanwar Singh arrives with police convoy, terrorizing villagers to find Pushpa.", breakdown: [{ id: "bi-3", category: "vehicle" as const, name: "Police vehicles (3)" }, { id: "bi-4", category: "costume" as const, name: "SP uniform" }], status: "scheduled" as const, blockIds: ["b7", "b8", "b9", "b10", "b11", "b12", "b13"] },
        { id: "ss-3", number: "3", heading: "TEMPLE ENTRANCE â€” DUSK", intExt: "EXT" as const, location: "Seshachalam Temple", timeOfDay: "DUSK" as const, scriptDay: "2", pages: 2, eighths: 16, description: "Srivalli waits at the temple. Pushpa returns â€” their reunion is tender amidst the chaos.", breakdown: [{ id: "bi-5", category: "prop" as const, name: "Oil lamps (12)" }, { id: "bi-6", category: "costume" as const, name: "Srivalli dupatta" }], status: "not-scheduled" as const, blockIds: ["b14", "b15", "b16", "b17", "b18", "b19", "b20", "b21"] },
      ],
      versions: [
        { id: "v1", number: 1, name: "White Draft", revisionDate: "2025-06-15T10:00:00.000Z", createdBy: "Sukumar", notes: "First complete draft. Story locked for budget estimation.", status: "First Draft" as const, blocks: [], scenes: [] },
        { id: "v2", number: 2, name: "Blue Revision", revisionDate: "2025-09-20T10:00:00.000Z", createdBy: "Sukumar", notes: "Added interval block, expanded Bhanwar Singh arc.", status: "Revised Draft" as const, blocks: [], scenes: [] },
        { id: "v3", number: 3, name: "Pink Revision", revisionDate: "2026-01-10T10:00:00.000Z", createdBy: "Sukumar", notes: "Trimmed Act 2 by 8 pages. Tightened Srivalli subplot.", status: "Production Draft" as const, blocks: [], scenes: [] },
        { id: "v4", number: 4, name: "Yellow Draft", revisionDate: "2026-04-05T10:00:00.000Z", createdBy: "Sukumar", notes: "Production draft. All departments signed off.", status: "Production Draft" as const, blocks: [], scenes: [] },
        { id: "v5", number: 5, name: "Shooting Draft Rev 3", revisionDate: "2026-08-20T10:00:00.000Z", createdBy: "Sukumar", notes: "Current shooting script. Dialogue polish from rehearsals.", status: "Shooting Draft" as const, blocks: [], scenes: [] },
      ],
      linkedSceneIds: [],
      shots: p1Shots,
      references: p1Refs,
    },

    // â”€â”€ P2: Kalki 2898 AD â”€â”€
    {
      id: "p2-s1", projectId: "p2", title: "Kalki 2898 AD â€” Main Screenplay", type: "Feature Film" as const,
      language: "Telugu", genre: "Sci-Fi Dystopian Epic", writer: "Nag Ashwin", storyBy: "Nag Ashwin", screenplayBy: "Nag Ashwin",
      dialoguesBy: "Nag Ashwin", scriptCoordinator: "Aditya Srinivas", draftName: "Final Theatrical Cut",
      draftNumber: "6", status: "Shooting Draft" as const, notes: "Locked for theatrical release. IMAX DMR approved. Part 2 pre-production referencing this draft.",
      createdAt: "2021-07-24T10:00:00.000Z", updatedAt: now, createdBy: "Production Team", archived: false, isMain: true,
      blocks: [
        { id: "k-b1", type: "scene_heading" as const, text: "EXT. KASI CITY â€” BAZAAR DISTRICT â€” DAY", sceneId: "ks-1" },
        { id: "k-b2", type: "action" as const, text: "A sprawling dystopian bazaar under the shadow of the Complex spire. Vendors hawk synthetic food. Refugees crowd narrow alleys. Holographic bounty boards flicker overhead." },
        { id: "k-b3", type: "character" as const, text: "BHAIRAVA" },
        { id: "k-b4", type: "dialogue" as const, text: "Oka bounty pakka ayyindi ante, Complex lo seat guarantee." },
        { id: "k-b5", type: "scene_heading" as const, text: "EXT. SHAMBHALA FORTRESS â€” WALL â€” DAWN", sceneId: "ks-2" },
        { id: "k-b6", type: "action" as const, text: "Ancient stone walls rising from dense jungle mist. Ashwatthama stands motionless atop the parapet, his staff planted beside him, surveying the valley below." },
        { id: "k-b7", type: "character" as const, text: "ASHWATTHAMA" },
        { id: "k-b8", type: "parenthetical" as const, text: "(ancient, weary, resolute)" },
        { id: "k-b9", type: "dialogue" as const, text: "Veyyi samvatsaralu kaadu... naaku time anedhi ledu. Dharma maatrame undi." },
        { id: "k-b10", type: "scene_heading" as const, text: "INT. REBEL SAFEHOUSE â€” NIGHT", sceneId: "ks-3" },
        { id: "k-b11", type: "action" as const, text: "A cramped underground chamber. Rebel fighters huddle around a holographic map. Sumathi sits apart, arms wrapped around herself, staring at the floor." },
        { id: "k-b12", type: "character" as const, text: "SUMATHI" },
        { id: "k-b13", type: "dialogue" as const, text: "Naa babu ni kaapaadithe chaalu. Migithadhi mee istam." },
        { id: "k-b14", type: "scene_heading" as const, text: "INT. THE COMPLEX â€” THRONE ROOM â€” NIGHT", sceneId: "ks-4" },
        { id: "k-b15", type: "action" as const, text: "Cavernous obsidian chamber. Columns stretch into darkness above. A single beam of light falls on the throne. Supreme Yaskin sits motionless â€” part machine, part myth." },
        { id: "k-b16", type: "character" as const, text: "SUPREME YASKIN" },
        { id: "k-b17", type: "dialogue" as const, text: "Kalki puttithe... naa prapancham antham. Aa pillavaadini naaku kaavali." },
        { id: "k-b18", type: "transition" as const, text: "SMASH CUT TO:" },
      ],
      scenes: [
        { id: "ks-1", number: "1", heading: "KASI CITY â€” BAZAAR DISTRICT â€” DAY", intExt: "EXT" as const, location: "Kasi Bazaar Set â€” Ramoji Film City", timeOfDay: "DAY" as const, scriptDay: "1", pages: 3.5, eighths: 28, description: "Bhairava hunts bounties through the dystopian Kasi bazaar. World-building establishing sequence â€” scale and scope of the Complex's control.", breakdown: [{ id: "k-bi-1", category: "prop" as const, name: "Holographic bounty board (practical LED rig)" }, { id: "k-bi-2", category: "special" as const, name: "Bujji vehicle tracking rig" }, { id: "k-bi-3", category: "costume" as const, name: "200 dystopian crowd costumes" }], status: "shot" as const, blockIds: ["k-b1", "k-b2", "k-b3", "k-b4"] },
        { id: "ks-2", number: "2", heading: "SHAMBHALA FORTRESS â€” WALL â€” DAWN", intExt: "EXT" as const, location: "Shambhala Set â€” Ramoji Backlot", timeOfDay: "DAWN" as const, scriptDay: "2", pages: 2.5, eighths: 20, description: "Ashwatthama guards the ancient fortress of Shambhala. Introduces the immortal warrior and the stakes of the divine prophecy.", breakdown: [{ id: "k-bi-4", category: "prop" as const, name: "Ashwatthama staff (hero weapon)" }, { id: "k-bi-5", category: "costume" as const, name: "Ashwatthama armor plating set" }, { id: "k-bi-6", category: "special" as const, name: "Jungle mist FX machines (4 units)" }], status: "shot" as const, blockIds: ["k-b5", "k-b6", "k-b7", "k-b8", "k-b9"] },
        { id: "ks-3", number: "3", heading: "REBEL SAFEHOUSE â€” NIGHT", intExt: "INT" as const, location: "Underground Set â€” Stage 5 Ramoji", timeOfDay: "NIGHT" as const, scriptDay: "3", pages: 2, eighths: 16, description: "Sumathi takes refuge with the rebel fighters. Her pregnancy and the divine child are revealed as the prophecy's key.", breakdown: [{ id: "k-bi-7", category: "prop" as const, name: "Holographic battle map (practical LED table)" }, { id: "k-bi-8", category: "costume" as const, name: "Rebel fighter tactical gear (12 sets)" }], status: "shot" as const, blockIds: ["k-b10", "k-b11", "k-b12", "k-b13"] },
        { id: "ks-4", number: "4", heading: "THE COMPLEX â€” THRONE ROOM â€” NIGHT", intExt: "INT" as const, location: "Complex Throne Set â€” Stages 7-8 Ramoji", timeOfDay: "NIGHT" as const, scriptDay: "4", pages: 3, eighths: 24, description: "Supreme Yaskin commands the Complex from his obsidian throne. The antagonist's scale and menace established â€” the hunt for Kalki begins.", breakdown: [{ id: "k-bi-9", category: "prop" as const, name: "Obsidian throne (hero set piece)" }, { id: "k-bi-10", category: "costume" as const, name: "Yaskin cybernetic prosthetics" }, { id: "k-bi-11", category: "special" as const, name: "Atmospheric haze + single beam lighting rig" }], status: "shot" as const, blockIds: ["k-b14", "k-b15", "k-b16", "k-b17", "k-b18"] },
      ],
      versions: [
        { id: "kv-1", number: 1, name: "White Draft", revisionDate: "2021-07-24T10:00:00.000Z", createdBy: "Nag Ashwin", notes: "Initial mythological framework. World-building bible attached.", status: "First Draft" as const, blocks: [], scenes: [] },
        { id: "kv-2", number: 2, name: "Blue Revision", revisionDate: "2022-06-15T10:00:00.000Z", createdBy: "Nag Ashwin", notes: "Bhairava arc restructured. Bujji character expanded. Ashwatthama backstory deepened.", status: "Revised Draft" as const, blocks: [], scenes: [] },
        { id: "kv-3", number: 3, name: "Pink Revision", revisionDate: "2023-03-10T10:00:00.000Z", createdBy: "Nag Ashwin", notes: "VFX breakdown locked. Complex interior sequences reduced by 12 pages for budget.", status: "Production Draft" as const, blocks: [], scenes: [] },
        { id: "kv-4", number: 4, name: "Green Revision", revisionDate: "2023-11-20T10:00:00.000Z", createdBy: "Nag Ashwin", notes: "Action choreography finalized with stunt team. IMAX framing notes added.", status: "Production Draft" as const, blocks: [], scenes: [] },
        { id: "kv-5", number: 5, name: "Shooting Draft", revisionDate: "2024-02-15T10:00:00.000Z", createdBy: "Nag Ashwin", notes: "Final production script. Dialogue polish. Part 2 tease locked at end credits.", status: "Shooting Draft" as const, blocks: [], scenes: [] },
        { id: "kv-6", number: 6, name: "Final Theatrical Cut", revisionDate: "2024-06-10T10:00:00.000Z", createdBy: "Nag Ashwin", notes: "Post-production script reflecting editorial changes. IMAX DMR approved.", status: "Shooting Draft" as const, blocks: [], scenes: [] },
      ],
      linkedSceneIds: [],
      shots: p2Shots,
      references: p2Refs,
    },

    // â”€â”€ P3: Devara: Part 1 â”€â”€
    {
      id: "p3-s1", projectId: "p3", title: "Devara: Part 1 â€” Main Screenplay", type: "Feature Film" as const,
      language: "Telugu", genre: "Coastal Action Drama", writer: "Koratala Siva", storyBy: "Koratala Siva", screenplayBy: "Koratala Siva",
      dialoguesBy: "Koratala Siva", scriptCoordinator: "Venkat Reddy", draftName: "Final Shooting Draft",
      draftNumber: "4", status: "Shooting Draft" as const, notes: "Locked for theatrical. All water tank sequences completed. Part 2 story outline in progress.",
      createdAt: "2023-04-01T10:00:00.000Z", updatedAt: now, createdBy: "Production Team", archived: false, isMain: true,
      blocks: [
        { id: "d-b1", type: "scene_heading" as const, text: "EXT. COASTAL VILLAGE â€” SHORELINE â€” DAY", sceneId: "ds-1" },
        { id: "d-b2", type: "action" as const, text: "Waves crash against the rocky shore. Fishing boats line the beach. The coastal village bustles â€” nets being mended, fish being sorted. A figure walks along the waterline." },
        { id: "d-b3", type: "character" as const, text: "DEVARA" },
        { id: "d-b4", type: "parenthetical" as const, text: "(commanding, unhurried)" },
        { id: "d-b5", type: "dialogue" as const, text: "Ee samudram lo smuggling aapali ante... manalni aapagalava?" },
        { id: "d-b6", type: "scene_heading" as const, text: "EXT. SMUGGLING TRAWLER â€” DECK â€” NIGHT", sceneId: "ds-2" },
        { id: "d-b7", type: "action" as const, text: "Rain hammers the deck of a large fishing trawler. Lightning illuminates crates of weapons lashed to the gunwales. Two men face each other across the deck." },
        { id: "d-b8", type: "character" as const, text: "BHAIRA" },
        { id: "d-b9", type: "dialogue" as const, text: "Devara... nee time aipoyindi. Ee samudram ippudu naadi." },
        { id: "d-b10", type: "character" as const, text: "DEVARA" },
        { id: "d-b11", type: "dialogue" as const, text: "Samudram evadidhi kaadu. Kaani dhaanni kaapaadevadu naane." },
        { id: "d-b12", type: "scene_heading" as const, text: "INT. TRAWLER â€” CARGO HOLD â€” NIGHT", sceneId: "ds-3" },
        { id: "d-b13", type: "action" as const, text: "Water pours through the breached hull. Weapons crates float in rising seawater. Emergency lanterns cast swinging shadows. The hold is flooding fast." },
        { id: "d-b14", type: "transition" as const, text: "CUT TO:" },
      ],
      scenes: [
        { id: "ds-1", number: "1", heading: "COASTAL VILLAGE â€” SHORELINE â€” DAY", intExt: "EXT" as const, location: "Visakhapatnam Fishing Village", timeOfDay: "DAY" as const, scriptDay: "1", pages: 3, eighths: 24, description: "Devara is introduced as the feared coastal chieftain. World-building of the Red Sea clan's territory and the smuggling economy.", breakdown: [{ id: "d-bi-1", category: "prop" as const, name: "Fishing nets and boats (8 practical)" }, { id: "d-bi-2", category: "costume" as const, name: "Devara coastal outfit" }, { id: "d-bi-3", category: "special" as const, name: "Wave machine (shoreline enhancement)" }], status: "shot" as const, blockIds: ["d-b1", "d-b2", "d-b3", "d-b4", "d-b5"] },
        { id: "ds-2", number: "2", heading: "SMUGGLING TRAWLER â€” DECK â€” NIGHT", intExt: "EXT" as const, location: "Ramoji Water Tank â€” Trawler Set", timeOfDay: "NIGHT" as const, scriptDay: "2", pages: 3.5, eighths: 28, description: "Devara and Bhaira confront each other on the smuggling trawler in a storm. The core rivalry established through dialogue and physicality.", breakdown: [{ id: "d-bi-4", category: "prop" as const, name: "Weapons crates (20 â€” breakaway and hero)" }, { id: "d-bi-5", category: "vehicle" as const, name: "Hero trawler (40ft practical build)" }, { id: "d-bi-6", category: "special" as const, name: "Rain tower array (8 units)" }, { id: "d-bi-7", category: "special" as const, name: "Lightning FX rigs" }], status: "shot" as const, blockIds: ["d-b6", "d-b7", "d-b8", "d-b9", "d-b10", "d-b11"] },
        { id: "ds-3", number: "3", heading: "TRAWLER â€” CARGO HOLD â€” NIGHT", intExt: "INT" as const, location: "Ramoji Water Tank â€” Hold Interior", timeOfDay: "NIGHT" as const, scriptDay: "2", pages: 2, eighths: 16, description: "The trawler's cargo hold floods during the battle. The smuggled weapons are exposed as evidence of the clan's corruption.", breakdown: [{ id: "d-bi-8", category: "prop" as const, name: "Floating weapons crates (foam core)" }, { id: "d-bi-9", category: "special" as const, name: "Controlled flooding rig" }, { id: "d-bi-10", category: "special" as const, name: "Emergency lantern practicals (6)" }], status: "shot" as const, blockIds: ["d-b12", "d-b13", "d-b14"] },
      ],
      versions: [
        { id: "dv-1", number: 1, name: "White Draft", revisionDate: "2023-04-01T10:00:00.000Z", createdBy: "Koratala Siva", notes: "First draft. Coastal world and clan dynamics established. Dual timeline structure.", status: "First Draft" as const, blocks: [], scenes: [] },
        { id: "dv-2", number: 2, name: "Blue Revision", revisionDate: "2023-10-15T10:00:00.000Z", createdBy: "Koratala Siva", notes: "Bhaira antagonist expanded. Water tank sequences added. Stunt team consulted.", status: "Revised Draft" as const, blocks: [], scenes: [] },
        { id: "dv-3", number: 3, name: "Pink Revision", revisionDate: "2024-04-20T10:00:00.000Z", createdBy: "Koratala Siva", notes: "Varadha subplot tightened. Interval point restructured. Peter Hein stunt breakdown.", status: "Production Draft" as const, blocks: [], scenes: [] },
        { id: "dv-4", number: 4, name: "Final Shooting Draft", revisionDate: "2024-08-10T10:00:00.000Z", createdBy: "Koratala Siva", notes: "Locked for shooting. Anirudh score spotting complete. All departments signed off.", status: "Shooting Draft" as const, blocks: [], scenes: [] },
      ],
      linkedSceneIds: [],
      shots: p3Shots,
      references: p3Refs,
    },

    // â”€â”€ P4: Game Changer (fixed projectId, new scene IDs) â”€â”€
    {
      id: "p4-s1", projectId: "p4", title: "Game Changer â€” Main Screenplay", type: "Feature Film" as const,
      language: "Telugu", genre: "Political Action Thriller", writer: "S. Shankar", storyBy: "S. Shankar", screenplayBy: "S. Shankar & Karthik Subbaraj",
      dialoguesBy: "Sai Madhav Burra", scriptCoordinator: "Priya Menon", draftName: "Production Draft",
      draftNumber: "3", status: "Production Draft" as const, notes: "Production draft locked. VFX sequences being refined. Assembly confrontation is the hero sequence.",
      createdAt: "2021-10-22T10:00:00.000Z", updatedAt: now, createdBy: "Production Team", archived: false, isMain: true,
      blocks: [
        { id: "g-b1", type: "scene_heading" as const, text: "EXT. GOVERNMENT BUILDING â€” DAWN", sceneId: "gs-1" },
        { id: "g-b2", type: "action" as const, text: "A massive government building against the dawn sky. Flags flutter. Security guards patrol. A convoy of white Ambassador cars pulls up." },
        { id: "g-b3", type: "character" as const, text: "RAM NANDAN" },
        { id: "g-b4", type: "parenthetical" as const, text: "(determined stride)" },
        { id: "g-b5", type: "dialogue" as const, text: "System ni change cheyyalanukuntunna. Lopalunchi." },
        { id: "g-b6", type: "scene_heading" as const, text: "INT. ELECTION HALL â€” DAY", sceneId: "gs-2" },
        { id: "g-b7", type: "action" as const, text: "A sealed ballot box sits on a table. Tension in the room. Officials, journalists, party workers crowd every corner." },
        { id: "g-b8", type: "character" as const, text: "ELECTION OFFICER" },
        { id: "g-b9", type: "dialogue" as const, text: "Results announce chestunnam. Silence maintain cheyandi." },
        { id: "g-b10", type: "character" as const, text: "RAM NANDAN" },
        { id: "g-b11", type: "parenthetical" as const, text: "(under his breath)" },
        { id: "g-b12", type: "dialogue" as const, text: "Ee result tho era maaripothundi." },
        { id: "g-b13", type: "scene_heading" as const, text: "INT. STATE LEGISLATIVE ASSEMBLY â€” DAY", sceneId: "gs-3" },
        { id: "g-b14", type: "action" as const, text: "The assembly is in uproar. MLAs shout across the aisle. Ram Nandan stands at the podium, unflinching. CM Boora Narsaiah watches from the treasury bench, seething." },
        { id: "g-b15", type: "character" as const, text: "RAM NANDAN" },
        { id: "g-b16", type: "dialogue" as const, text: "Ee assembly lo nijam cheppina vaadiki chair ledu. Kaani nenu naa duty vadlanu." },
        { id: "g-b17", type: "character" as const, text: "CM BOORA NARSAIAH" },
        { id: "g-b18", type: "parenthetical" as const, text: "(standing, furious)" },
        { id: "g-b19", type: "dialogue" as const, text: "Nuvvu IAS officer vi. Nee panilo nuvvu undu. Rajakeeyam naaku vaddu." },
        { id: "g-b20", type: "transition" as const, text: "CUT TO:" },
      ],
      scenes: [
        { id: "gs-1", number: "1", heading: "GOVERNMENT BUILDING â€” DAWN", intExt: "EXT" as const, location: "AP Government Complex", timeOfDay: "DAWN" as const, scriptDay: "1", pages: 2, eighths: 16, description: "Ram Nandan arrives at the government building, ready to change the system from within. Hero introduction establishing his moral authority.", breakdown: [{ id: "g-bi-1", category: "prop" as const, name: "Security checkpoint props" }, { id: "g-bi-2", category: "costume" as const, name: "Ram Nandan formal IAS suit" }, { id: "g-bi-3", category: "vehicle" as const, name: "White Ambassador convoy (3)" }], status: "scheduled" as const, blockIds: ["g-b1", "g-b2", "g-b3", "g-b4", "g-b5"] },
        { id: "gs-2", number: "2", heading: "ELECTION HALL â€” DAY", intExt: "INT" as const, location: "Visakhapatnam Convention Center", timeOfDay: "DAY" as const, scriptDay: "1", pages: 3, eighths: 24, description: "The election results are announced. The crowd erupts. Ram Nandan's political journey begins â€” the inciting incident.", breakdown: [{ id: "g-bi-4", category: "prop" as const, name: "Ballot box (hero prop)" }, { id: "g-bi-5", category: "special" as const, name: "Crowd extras (200+)" }], status: "not-scheduled" as const, blockIds: ["g-b6", "g-b7", "g-b8", "g-b9", "g-b10", "g-b11", "g-b12"] },
        { id: "gs-3", number: "3", heading: "STATE LEGISLATIVE ASSEMBLY â€” DAY", intExt: "INT" as const, location: "Assembly Set â€” Stage 4 Ramoji", timeOfDay: "DAY" as const, scriptDay: "3", pages: 4, eighths: 32, description: "Ram Nandan confronts CM Boora Narsaiah in the legislative assembly. The hero sequence â€” political confrontation at the highest stakes.", breakdown: [{ id: "g-bi-6", category: "prop" as const, name: "Assembly podium and treasury bench" }, { id: "g-bi-7", category: "costume" as const, name: "150 MLA costumes (formal kurta and shirt mix)" }, { id: "g-bi-8", category: "special" as const, name: "Background artists (150 as MLAs)" }], status: "not-scheduled" as const, blockIds: ["g-b13", "g-b14", "g-b15", "g-b16", "g-b17", "g-b18", "g-b19", "g-b20"] },
      ],
      versions: [
        { id: "gv-1", number: 1, name: "White Draft", revisionDate: "2021-10-22T10:00:00.000Z", createdBy: "S. Shankar", notes: "First draft. Core political narrative established. Dual-role concept introduced.", status: "First Draft" as const, blocks: [], scenes: [] },
        { id: "gv-2", number: 2, name: "Blue Revision", revisionDate: "2023-02-15T10:00:00.000Z", createdBy: "S. Shankar", notes: "Added election sequences. Ram Nandan backstory expanded. Assembly confrontation written.", status: "Revised Draft" as const, blocks: [], scenes: [] },
        { id: "gv-3", number: 3, name: "Production Draft", revisionDate: "2024-06-10T10:00:00.000Z", createdBy: "S. Shankar", notes: "Production locked. VFX breakdown complete. Thaman S score spotting done.", status: "Production Draft" as const, blocks: [], scenes: [] },
      ],
      linkedSceneIds: [],
      shots: p4Shots,
      references: p4Refs,
    },

    // â”€â”€ P5: They Call Him OG â”€â”€
    {
      id: "p5-s1", projectId: "p5", title: "They Call Him OG â€” Main Screenplay", type: "Feature Film" as const,
      language: "Telugu", genre: "Underworld Action Thriller", writer: "Sujeeth", storyBy: "Sujeeth", screenplayBy: "Sujeeth",
      dialoguesBy: "Sujeeth", scriptCoordinator: "Karthik Nair", draftName: "Revised Production Draft",
      draftNumber: "3", status: "Production Draft" as const, notes: "Production draft. Mumbai port night sequences require special permits. Martial arts choreography locked.",
      createdAt: "2023-04-15T10:00:00.000Z", updatedAt: now, createdBy: "Production Team", archived: false, isMain: true,
      blocks: [
        { id: "o-b1", type: "scene_heading" as const, text: "EXT. MUMBAI PORT â€” CONTAINER YARD â€” NIGHT", sceneId: "os-1" },
        { id: "o-b2", type: "action" as const, text: "Sodium vapor lights cast orange pools across stacked shipping containers. The port is quiet â€” too quiet. A figure steps out from between two containers." },
        { id: "o-b3", type: "character" as const, text: "OG" },
        { id: "o-b4", type: "parenthetical" as const, text: "(ten years of exile in his eyes)" },
        { id: "o-b5", type: "dialogue" as const, text: "Mumbai maaripoyindi. Kaani naa unfinished business maaragaledu." },
        { id: "o-b6", type: "scene_heading" as const, text: "INT. WAREHOUSE â€” OMI BHAU'S LAIR â€” NIGHT", sceneId: "os-2" },
        { id: "o-b7", type: "action" as const, text: "A converted warehouse. Contraband lines the shelves. Armed men in shadows. Omi Bhau sits at a steel table, counting stacks of currency." },
        { id: "o-b8", type: "character" as const, text: "OMI BHAU" },
        { id: "o-b9", type: "dialogue" as const, text: "OG vapas aadu ani chepparu. Vaadiki Mumbai lo place ledu ippudu." },
        { id: "o-b10", type: "scene_heading" as const, text: "INT. UNDERGROUND DOJO â€” NIGHT", sceneId: "os-3" },
        { id: "o-b11", type: "action" as const, text: "Bare concrete floor. Fluorescent tubes flicker. OG stands in the center holding a katana. Training dummies surround him. He breathes once, then moves." },
        { id: "o-b12", type: "character" as const, text: "OG" },
        { id: "o-b13", type: "dialogue" as const, text: "Revenge ki prepare avvadaniki padi samvatsaralu pattindi. Execute cheyyataniki oka raatri chaalu." },
        { id: "o-b14", type: "transition" as const, text: "CUT TO:" },
      ],
      scenes: [
        { id: "os-1", number: "1", heading: "MUMBAI PORT â€” CONTAINER YARD â€” NIGHT", intExt: "EXT" as const, location: "Mumbai Port Trust", timeOfDay: "NIGHT" as const, scriptDay: "1", pages: 2.5, eighths: 20, description: "OG returns to Mumbai after a decade in exile. The port serves as his re-entry point â€” familiar territory now controlled by enemies.", breakdown: [{ id: "o-bi-1", category: "prop" as const, name: "Shipping containers (12 dressed)" }, { id: "o-bi-2", category: "costume" as const, name: "OG dark overcoat and tactical wear" }, { id: "o-bi-3", category: "special" as const, name: "Sodium vapor lighting rig (port ambience)" }], status: "scheduled" as const, blockIds: ["o-b1", "o-b2", "o-b3", "o-b4", "o-b5"] },
        { id: "os-2", number: "2", heading: "WAREHOUSE â€” OMI BHAU'S LAIR â€” NIGHT", intExt: "INT" as const, location: "Warehouse Set â€” Hyderabad Studio", timeOfDay: "NIGHT" as const, scriptDay: "2", pages: 3, eighths: 24, description: "Omi Bhau's criminal headquarters. The antagonist is established in his power base before OG's arrival disrupts the status quo.", breakdown: [{ id: "o-bi-4", category: "prop" as const, name: "Currency stacks (prop money)" }, { id: "o-bi-5", category: "prop" as const, name: "Contraband crates (assorted)" }, { id: "o-bi-6", category: "costume" as const, name: "Omi Bhau silk kurta set" }], status: "not-scheduled" as const, blockIds: ["o-b6", "o-b7", "o-b8", "o-b9"] },
        { id: "os-3", number: "3", heading: "UNDERGROUND DOJO â€” NIGHT", intExt: "INT" as const, location: "Dojo Set â€” Hyderabad Studio", timeOfDay: "NIGHT" as const, scriptDay: "3", pages: 2.5, eighths: 20, description: "OG trains with his signature katana. Establishes his martial arts discipline and the decade of preparation behind his revenge.", breakdown: [{ id: "o-bi-7", category: "prop" as const, name: "Hero katana (forged steel + rubber stunt)" }, { id: "o-bi-8", category: "prop" as const, name: "Training dummies (6)" }, { id: "o-bi-9", category: "special" as const, name: "Flickering fluorescent practical rig" }], status: "not-scheduled" as const, blockIds: ["o-b10", "o-b11", "o-b12", "o-b13", "o-b14"] },
      ],
      versions: [
        { id: "ov-1", number: 1, name: "White Draft", revisionDate: "2023-04-15T10:00:00.000Z", createdBy: "Sujeeth", notes: "First draft. Neo-noir tone established. OG backstory and Mumbai underworld rules set.", status: "First Draft" as const, blocks: [], scenes: [] },
        { id: "ov-2", number: 2, name: "Blue Revision", revisionDate: "2024-01-20T10:00:00.000Z", createdBy: "Sujeeth", notes: "Omi Bhau arc expanded. Dojo training sequence added. Gun-fu choreography outlined.", status: "Revised Draft" as const, blocks: [], scenes: [] },
        { id: "ov-3", number: 3, name: "Revised Production Draft", revisionDate: "2024-09-05T10:00:00.000Z", createdBy: "Sujeeth", notes: "Production locked. Peter Hein stunt breakdown. Mumbai port permits confirmed.", status: "Production Draft" as const, blocks: [], scenes: [] },
      ],
      linkedSceneIds: [],
      shots: p5Shots,
      references: p5Refs,
    },

    // â”€â”€ P6: HIT: The Third Case â”€â”€
    {
      id: "p6-s1", projectId: "p6", title: "HIT: The Third Case â€” Main Screenplay", type: "Feature Film" as const,
      language: "Telugu", genre: "Crime Investigation Mystery", writer: "Sailesh Kolanu", storyBy: "Sailesh Kolanu", screenplayBy: "Sailesh Kolanu",
      dialoguesBy: "Sailesh Kolanu", scriptCoordinator: "Meghana Rao", draftName: "Blue Revision",
      draftNumber: "2", status: "Revised Draft" as const, notes: "Second draft. Forensic procedures verified with consultant. Mountain hideout location scouting in progress.",
      createdAt: "2024-09-01T10:00:00.000Z", updatedAt: now, createdBy: "Production Team", archived: false, isMain: true,
      blocks: [
        { id: "h-b1", type: "scene_heading" as const, text: "INT. HIT HEADQUARTERS â€” FORENSIC LAB â€” DAY", sceneId: "hs-1" },
        { id: "h-b2", type: "action" as const, text: "Sterile white walls. Evidence bags arranged on steel tables. Microscopes, UV lamps, chemical reagent bottles. SP Arjun Sarkaar enters, scanning the room." },
        { id: "h-b3", type: "character" as const, text: "ARJUN SARKAAR" },
        { id: "h-b4", type: "parenthetical" as const, text: "(methodical, obsessive)" },
        { id: "h-b5", type: "dialogue" as const, text: "Ee case lo prathi evidence ni rendu saarlu verify cheyandi. Oka mistake ki scope ledu." },
        { id: "h-b6", type: "scene_heading" as const, text: "INT. HIT HEADQUARTERS â€” INVESTIGATION ROOM â€” NIGHT", sceneId: "hs-2" },
        { id: "h-b7", type: "action" as const, text: "A large board dominates the wall â€” photos of victims, maps with red pins, string connections between suspects. Arjun studies it alone, coffee going cold." },
        { id: "h-b8", type: "character" as const, text: "ARJUN SARKAAR" },
        { id: "h-b9", type: "dialogue" as const, text: "Pattern undi. Vaadu manaki kanipinchani pattern follow avuthunnadu." },
        { id: "h-b10", type: "scene_heading" as const, text: "EXT. MOUNTAIN HIDEOUT â€” TREELINE â€” DAWN", sceneId: "hs-3" },
        { id: "h-b11", type: "action" as const, text: "Snow-covered pine forest. Dawn light filters through ice-coated branches. Arjun leads a tactical team in single file through the trees, breath visible in the cold." },
        { id: "h-b12", type: "character" as const, text: "ARJUN SARKAAR" },
        { id: "h-b13", type: "parenthetical" as const, text: "(whispering into radio)" },
        { id: "h-b14", type: "dialogue" as const, text: "Positions confirm cheyandi. Entry point South side. Vaadu loptala unnadu â€” vaadiki teliyakunda vellaali." },
        { id: "h-b15", type: "transition" as const, text: "CUT TO:" },
      ],
      scenes: [
        { id: "hs-1", number: "1", heading: "HIT HEADQUARTERS â€” FORENSIC LAB â€” DAY", intExt: "INT" as const, location: "Forensic Lab Set â€” Hyderabad Studio", timeOfDay: "DAY" as const, scriptDay: "1", pages: 2, eighths: 16, description: "SP Arjun Sarkaar is introduced in his element â€” the forensic lab. His obsessive methodology and refusal to cut corners are established.", breakdown: [{ id: "h-bi-1", category: "prop" as const, name: "Evidence bags and steel tables" }, { id: "h-bi-2", category: "prop" as const, name: "Microscopes, UV lamps, reagent bottles" }, { id: "h-bi-3", category: "costume" as const, name: "Arjun SP uniform â€” crisp formal" }], status: "scheduled" as const, blockIds: ["h-b1", "h-b2", "h-b3", "h-b4", "h-b5"] },
        { id: "hs-2", number: "2", heading: "HIT HEADQUARTERS â€” INVESTIGATION ROOM â€” NIGHT", intExt: "INT" as const, location: "Investigation Room Set â€” Hyderabad Studio", timeOfDay: "NIGHT" as const, scriptDay: "3", pages: 2.5, eighths: 20, description: "Arjun works alone at night, studying the investigation board. The serial pattern emerges. A key deduction scene that drives the Act 2 pivot.", breakdown: [{ id: "h-bi-4", category: "prop" as const, name: "Investigation board (40+ photos, string, maps)" }, { id: "h-bi-5", category: "prop" as const, name: "Cold coffee cup, scattered files" }, { id: "h-bi-6", category: "costume" as const, name: "Arjun rolled-sleeves look (Phase 2)" }], status: "not-scheduled" as const, blockIds: ["h-b6", "h-b7", "h-b8", "h-b9"] },
        { id: "hs-3", number: "3", heading: "MOUNTAIN HIDEOUT â€” TREELINE â€” DAWN", intExt: "EXT" as const, location: "Manali Pine Forest", timeOfDay: "DAWN" as const, scriptDay: "7", pages: 3.5, eighths: 28, description: "The Act 3 tactical pursuit. Arjun leads a team through snow terrain to the suspect's mountain hideout. Maximum tension and atmosphere.", breakdown: [{ id: "h-bi-7", category: "costume" as const, name: "Tactical field gear (8 officers)" }, { id: "h-bi-8", category: "prop" as const, name: "Tactical radio units (8)" }, { id: "h-bi-9", category: "special" as const, name: "Snow machines (4 units)" }, { id: "h-bi-10", category: "special" as const, name: "Breath vapor enhancement (cold FX)" }], status: "not-scheduled" as const, blockIds: ["h-b10", "h-b11", "h-b12", "h-b13", "h-b14", "h-b15"] },
      ],
      versions: [
        { id: "hv-1", number: 1, name: "White Draft", revisionDate: "2024-09-01T10:00:00.000Z", createdBy: "Sailesh Kolanu", notes: "First draft. Interstate serial killer premise. Forensic procedural tone locked.", status: "First Draft" as const, blocks: [], scenes: [] },
        { id: "hv-2", number: 2, name: "Blue Revision", revisionDate: "2025-03-15T10:00:00.000Z", createdBy: "Sailesh Kolanu", notes: "Mountain pursuit sequence expanded. Forensic consultant feedback incorporated. Arjun psychology deepened.", status: "Revised Draft" as const, blocks: [], scenes: [] },
      ],
      linkedSceneIds: [],
      shots: p6Shots,
      references: p6Refs,
    },

    // â”€â”€ P7: The Raja Saab â”€â”€
    {
      id: "p7-s1", projectId: "p7", title: "The Raja Saab â€” Main Screenplay", type: "Feature Film" as const,
      language: "Telugu", genre: "Horror Romantic Comedy", writer: "Maruthi", storyBy: "Maruthi", screenplayBy: "Maruthi",
      dialoguesBy: "Maruthi", scriptCoordinator: "Lavanya Shetty", draftName: "Shooting Draft",
      draftNumber: "4", status: "Shooting Draft" as const, notes: "Shooting draft locked. All palace interior sets built at Ramoji. Wire rig safety clearances approved.",
      createdAt: "2022-10-18T10:00:00.000Z", updatedAt: now, createdBy: "Production Team", archived: false, isMain: true,
      blocks: [
        { id: "r-b1", type: "scene_heading" as const, text: "EXT. ANCESTRAL PALACE â€” GATE â€” NIGHT", sceneId: "rs-1" },
        { id: "r-b2", type: "action" as const, text: "A towering Gothic palace looms against a stormy sky. Iron gates creak open on their own. Lightning illuminates gargoyle rain spouts and crumbling balustrades." },
        { id: "r-b3", type: "character" as const, text: "RAJA" },
        { id: "r-b4", type: "parenthetical" as const, text: "(nervously looking up at the palace)" },
        { id: "r-b5", type: "dialogue" as const, text: "Property papers sign cheyyadaaniki vacchanu. Oka raatri stay cheste chaalu annaru. Easy ga..." },
        { id: "r-b6", type: "action" as const, text: "Thunder BOOMS. Raja flinches. He squares his shoulders and walks through the gate." },
        { id: "r-b7", type: "scene_heading" as const, text: "INT. ANCESTRAL PALACE â€” PORTRAIT HALL â€” NIGHT", sceneId: "rs-2" },
        { id: "r-b8", type: "action" as const, text: "A long hall lined with oil portraits of ancestors. Moonlight streams through tall windows. Raja walks slowly, eyeing the portraits. In one ornate mirror, a figure materializes behind him." },
        { id: "r-b9", type: "character" as const, text: "THE GHOST" },
        { id: "r-b10", type: "parenthetical" as const, text: "(appearing in the mirror, amused)" },
        { id: "r-b11", type: "dialogue" as const, text: "Naa palace ki welcome, raja gaaru. Ikkada oka raatri ante... naa conditions ki agree avvaali." },
        { id: "r-b12", type: "character" as const, text: "RAJA" },
        { id: "r-b13", type: "dialogue" as const, text: "Meeru... meeru nijam ga... bhootham aa?" },
        { id: "r-b14", type: "scene_heading" as const, text: "INT. ANCESTRAL PALACE â€” GRAND BALLROOM â€” NIGHT", sceneId: "rs-3" },
        { id: "r-b15", type: "action" as const, text: "A vast ballroom in pristine vintage condition â€” as if frozen in time. Crystal chandeliers blaze. Period-costumed dancers fill the floor. Raja stands at the entrance, stunned." },
        { id: "r-b16", type: "character" as const, text: "THE GHOST" },
        { id: "r-b17", type: "dialogue" as const, text: "Dance cheyyandi raja gaaru. Ee palace lo celebrate cheyyani raatri undadu." },
        { id: "r-b18", type: "transition" as const, text: "CUT TO:" },
      ],
      scenes: [
        { id: "rs-1", number: "1", heading: "ANCESTRAL PALACE â€” GATE â€” NIGHT", intExt: "EXT" as const, location: "Palace Exterior Set â€” Ramoji Film City", timeOfDay: "NIGHT" as const, scriptDay: "1", pages: 2.5, eighths: 20, description: "Raja arrives at the inherited palace for one night. Gothic horror establishing sequence â€” the palace as a character.", breakdown: [{ id: "r-bi-1", category: "prop" as const, name: "Iron gate mechanism (motorized open)" }, { id: "r-bi-2", category: "special" as const, name: "Lightning FX rigs + thunder playback" }, { id: "r-bi-3", category: "vehicle" as const, name: "Vintage Rolls Royce Phantom (hero)" }], status: "shot" as const, blockIds: ["r-b1", "r-b2", "r-b3", "r-b4", "r-b5", "r-b6"] },
        { id: "rs-2", number: "2", heading: "ANCESTRAL PALACE â€” PORTRAIT HALL â€” NIGHT", intExt: "INT" as const, location: "Portrait Hall Set â€” Ramoji Stage 3", timeOfDay: "NIGHT" as const, scriptDay: "1", pages: 3, eighths: 24, description: "The Ghost materializes in the portrait hall mirror. The supernatural comedy begins â€” two characters with opposing energy.", breakdown: [{ id: "r-bi-4", category: "prop" as const, name: "Oil portraits (24 â€” custom painted)" }, { id: "r-bi-5", category: "prop" as const, name: "Half-silvered mirror rig (ghost reveal)" }, { id: "r-bi-6", category: "costume" as const, name: "Ghost royal regalia with aging patina" }, { id: "r-bi-7", category: "special" as const, name: "Haze machine for moonbeam atmosphere" }], status: "shot" as const, blockIds: ["r-b7", "r-b8", "r-b9", "r-b10", "r-b11", "r-b12", "r-b13"] },
        { id: "rs-3", number: "3", heading: "ANCESTRAL PALACE â€” GRAND BALLROOM â€” NIGHT", intExt: "INT" as const, location: "Ballroom Set â€” Ramoji Stages 5-6", timeOfDay: "NIGHT" as const, scriptDay: "2", pages: 4, eighths: 32, description: "The grand ballroom dance sequence. Ghost transports Raja into a vintage celebration. Combines horror, comedy, and spectacle.", breakdown: [{ id: "r-bi-8", category: "prop" as const, name: "Crystal chandeliers (6 â€” practical rigged)" }, { id: "r-bi-9", category: "costume" as const, name: "200 period dance costumes" }, { id: "r-bi-10", category: "special" as const, name: "Wire rig for Ghost levitation" }, { id: "r-bi-11", category: "special" as const, name: "Crowd extension markers for VFX" }], status: "scheduled" as const, blockIds: ["r-b14", "r-b15", "r-b16", "r-b17", "r-b18"] },
      ],
      versions: [
        { id: "rv-1", number: 1, name: "White Draft", revisionDate: "2022-10-18T10:00:00.000Z", createdBy: "Maruthi", notes: "First draft. Horror-comedy tone established. Ghost character dynamics locked.", status: "First Draft" as const, blocks: [], scenes: [] },
        { id: "rv-2", number: 2, name: "Blue Revision", revisionDate: "2023-06-20T10:00:00.000Z", createdBy: "Maruthi", notes: "Ballroom dance sequence expanded. Sanjay Dutt ghost characterization deepened. Comedy beats refined.", status: "Revised Draft" as const, blocks: [], scenes: [] },
        { id: "rv-3", number: 3, name: "Pink Revision", revisionDate: "2024-03-10T10:00:00.000Z", createdBy: "Maruthi", notes: "Wire rig sequences safety-reviewed. VFX breakdown for ghost effects finalized. Romance subplot tightened.", status: "Production Draft" as const, blocks: [], scenes: [] },
        { id: "rv-4", number: 4, name: "Shooting Draft", revisionDate: "2025-01-15T10:00:00.000Z", createdBy: "Maruthi", notes: "Final shooting script. Thaman S score spotting complete. All palace sets approved.", status: "Shooting Draft" as const, blocks: [], scenes: [] },
      ],
      linkedSceneIds: [],
      shots: p7Shots,
      references: p7Refs,
    },
  ] as Script[];
}

function enrichDemoCoverage(data: AppDataCollections) {
  const projectById = new Map(data.projects.map((project) => [project.id, project]));
  const demoDate = (offsetDays: number) => {
    const date = new Date("2026-09-08T00:00:00.000Z");
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  };
  data.projects.forEach((project, index) => {
    const release = new Date(Date.UTC(2027, 0, 15));
    release.setUTCDate(release.getUTCDate() + index * 35);
    project.releaseDate = release.toISOString().slice(0, 10);
    const start = new Date(Date.UTC(2027, 0, 1));
    start.setUTCDate(start.getUTCDate() + index * 35);
    const end = new Date(release);
    end.setUTCDate(end.getUTCDate() - 7);
    project.startDate = start.toISOString().slice(0, 10);
    project.endDate = end.toISOString().slice(0, 10);
  });

  data.castMembers = data.castMembers.map((member, index) => ({
    ...member,
    projectTitle: projectById.get(member.projectId)?.title ?? member.projectTitle,
    profileImage:
      actorImageReferences[member.name] ??
      member.profileImage ??
      demoPeopleImagePool[index % demoPeopleImagePool.length],
  }));

  data.crewMembers = data.crewMembers.map((member, index) => ({
    ...member,
    projectTitle: projectById.get(member.projectId)?.title ?? member.projectTitle,
    // Do not assign actor portraits to crew members. Role-labelled artwork
    // prevents a real person's face from being shown for the wrong credit.
    profileImage:
      (member.profileImage && !/^https?:\/\//i.test(member.profileImage) ? member.profileImage : null) ??
      demoImage(`${member.role} - ${member.name}`, index % 2 === 0 ? "#1d4ed8" : "#334155"),
  }));

  const sceneTemplate = data.scenes[0];
  const shootDayTemplate = data.shootDays[0];
  const scheduleTemplate = data.scheduleEntries[0];
  const callSheetTemplate = data.callSheets[0];
  const locationTemplate = data.locations[0];
  const equipmentTemplate = data.equipmentInventory[0];

  data.projects.forEach((project) => {
    const projectCast = data.castMembers.filter((member) => member.projectId === project.id);
    const projectCrew = data.crewMembers.filter((member) => member.projectId === project.id);
    const projectCharacters = projectCast.map((member) => member.character);
    const scenes = data.scenes.filter((scene) => scene.projectId === project.id);

    if (sceneTemplate && scenes.length < 4) {
      const sceneHeadings = [
        `EXT. ${project.title.toUpperCase()} - ESTABLISHING LOCATION - DAY`,
        `INT. ${project.title.toUpperCase()} - CONTROL ROOM - NIGHT`,
        `EXT. ${project.title.toUpperCase()} - ACTION SET PIECE - DUSK`,
        `INT. ${project.title.toUpperCase()} - FINAL CONFRONTATION - NIGHT`,
      ];
      const locations = ["Main Unit Location", "Studio Set", "Second Unit Location", "Backlot Stage"];
      for (let index = scenes.length; index < 4; index += 1) {
        const sceneNumber = String(index + 1);
        data.scenes.push({
          ...sceneTemplate,
          id: `demo-${project.id}-scene-${index + 1}`,
          projectId: project.id,
          sceneNumber,
          heading: sceneHeadings[index],
          location: locations[index],
          timeOfDay: index === 0 ? "DAY" : index === 1 ? "NIGHT" : index === 2 ? "DUSK" : "NIGHT",
          characters: projectCharacters.slice(0, 4),
          props: [],
          costumes: [],
          vehicles: [],
          specialRequirements: [],
          vfxRequired: index > 1,
          vfxNotes: index > 1 ? "Demo VFX tracking placeholder for previs and review." : "",
          notes: `Demo scene breakdown for ${project.title}.`,
          status: project.status === "completed" ? "shot" : index === 0 ? "scheduled" : "not-scheduled",
          shootDate: project.nextShootDate ?? project.startDate,
          shootDay: index + 1,
          synopsis: `Production coverage scene for ${project.title}, prepared for demo review.`,
          pages: 2 + index * 0.5,
          estimatedDuration: `${3 + index} min`,
        });
      }
    }

    const projectScenes = data.scenes.filter((scene) => scene.projectId === project.id);
    if (shootDayTemplate && data.shootDays.filter((day) => day.projectId === project.id).length === 0) {
      data.shootDays.push({
        ...shootDayTemplate,
        id: `demo-${project.id}-shoot-day-1`,
        projectId: project.id,
        projectTitle: project.title,
        date: project.nextShootDate ?? project.startDate,
        shootDayNumber: 1,
        totalShootDays: project.totalShootDays,
        location: `${project.title} Main Unit Stage`,
        scenes: projectScenes.slice(0, 4).map((scene) => ({
          sceneNumber: scene.sceneNumber,
          heading: scene.heading,
          pages: scene.pages,
          intExt: scene.intExt,
          characters: scene.characters,
          timeOfDay: scene.timeOfDay,
          location: scene.location,
          estimatedDuration: scene.estimatedDuration,
          status: scene.status,
          synopsis: scene.synopsis,
        })),
        castRequired: projectCast.map((member) => member.name),
        crewRequired: projectCrew.slice(0, 8).map((member) => ({
          department: member.department,
          role: member.role,
          name: member.name,
        })),
        equipment: [],
        notes: `Demo first-unit shoot day for ${project.title}.`,
      });
    }

    if (scheduleTemplate && data.scheduleEntries.filter((entry) => entry.projectId === project.id).length === 0) {
      data.scheduleEntries.push({
        ...scheduleTemplate,
        id: `demo-${project.id}-schedule-1`,
        projectId: project.id,
        projectTitle: project.title,
        date: project.nextShootDate ?? project.startDate,
        callTime: "06:00",
        location: `${project.title} Main Unit Stage`,
        scenes: projectScenes.slice(0, 4).map((scene) => `Sc. ${scene.sceneNumber}`),
        shootDayNumber: 1,
        totalShootDays: project.totalShootDays,
        callSheetStatus: "draft",
        status: project.status === "completed" ? "completed" : "scheduled",
      });
    }

    if (callSheetTemplate && data.callSheets.filter((sheet) => sheet.projectId === project.id).length === 0) {
      data.callSheets.push({
        ...callSheetTemplate,
        id: `demo-${project.id}-call-sheet-1`,
        projectId: project.id,
        project: project.title,
        shootDay: 1,
        date: project.nextShootDate ?? project.startDate,
        location: `${project.title} Main Unit Stage`,
        director: project.director,
        producer: project.producer,
        language: project.language,
        genre: project.genre,
        productionCompany: project.productionHouse,
        cast: projectCast.length,
        crew: projectCrew.length,
        status: project.status === "completed" ? "Completed" : "Draft",
        scenes: projectScenes.slice(0, 4).map((scene) => ({
          number: scene.sceneNumber,
          description: scene.synopsis,
          setting: scene.intExt,
          time: scene.timeOfDay,
          pages: scene.pages,
          characters: scene.characters.join(", "),
          duration: scene.estimatedDuration,
          status: scene.status,
          sourceId: scene.id,
          location: scene.location,
        })),
        notes: `Demo call sheet for ${project.title}.`,
      });
    }

    if (locationTemplate && data.locations.filter((location) => location.projectId === project.id).length === 0) {
      data.locations.push(
        {
          ...locationTemplate,
          id: `demo-${project.id}-location-1`,
          projectId: project.id,
          name: `${project.title} Main Unit Stage`,
          city: "Hyderabad",
          address: `${project.title} Production Base`,
          status: "locked",
          notes: "Demo location record with permit and access placeholders.",
        },
        {
          ...locationTemplate,
          id: `demo-${project.id}-location-2`,
          projectId: project.id,
          name: `${project.title} Second Unit`,
          city: "Ramoji Film City",
          address: "Second unit access road",
          status: "scouting",
          notes: "Demo alternate location for pickups and inserts.",
        },
      );
    }

    if (equipmentTemplate && data.equipmentInventory.filter((item) => item.projectId === project.id).length === 0) {
      ["Camera package", "Sound package", "Lighting and grip package", "Transport unit"].forEach((name, equipmentIndex) => {
        data.equipmentInventory.push({
          ...equipmentTemplate,
          id: `demo-${project.id}-equipment-${equipmentIndex + 1}`,
          projectId: project.id,
          name: `${project.title} ${name}`,
          category: equipmentIndex === 0 ? "camera" : equipmentIndex === 1 ? "sound" : equipmentIndex === 2 ? "lighting" : "transport",
          status: equipmentIndex === 3 ? "reserved" : "available",
          notes: `Demo inventory allocation for ${project.title}.`,
        });
      });
    }

  });

  // Build a realistic rolling three-month production calendar for every
  // project. Records are deterministic so migrations can safely add only
  // missing demo rows without replacing user edits.
  data.projects.forEach((project, projectIndex) => {
    const projectCast = data.castMembers.filter((member) => member.projectId === project.id);
    const projectCrew = data.crewMembers.filter((member) => member.projectId === project.id);
    const projectScenes = data.scenes.filter((scene) => scene.projectId === project.id);
    const scriptSceneIds: string[] = [];

    for (let scriptIndex = 1; scriptIndex <= 2; scriptIndex += 1) {
      const scriptId = `demo-${project.id}-script-${scriptIndex}`;
      if (data.scripts.some((script) => script.id === scriptId)) continue;
      const blocks = projectScenes.slice(0, 8).flatMap((scene, sceneIndex) => {
        const sceneId = `demo-${project.id}-script-${scriptIndex}-scene-${sceneIndex + 1}`;
        const headingId = `${sceneId}-heading`;
        return [
          { id: headingId, type: "scene_heading" as const, text: scene.heading, sceneId },
          { id: `${sceneId}-action`, type: "action" as const, text: scene.synopsis, sceneId },
          { id: `${sceneId}-character`, type: "character" as const, text: projectCast[sceneIndex % Math.max(projectCast.length, 1)]?.name ?? "PROTAGONIST", sceneId },
          { id: `${sceneId}-dialogue`, type: "dialogue" as const, text: `The plan changes tonight. We finish what we started in ${project.title}.`, sceneId },
        ];
      });
      const scenes = projectScenes.slice(0, 8).map((scene, sceneIndex) => {
        const sceneId = `demo-${project.id}-script-${scriptIndex}-scene-${sceneIndex + 1}`;
        const blockIds = blocks.filter((block) => block.sceneId === sceneId).map((block) => block.id);
        return {
          id: sceneId,
          number: scene.sceneNumber,
          heading: scene.heading,
          intExt: scene.intExt,
          location: scene.location,
          timeOfDay: scene.timeOfDay,
          scriptDay: `Day ${Math.floor(sceneIndex / 2) + 1}`,
          pages: scene.pages,
          eighths: Math.round(scene.pages * 8),
          description: scene.synopsis,
          breakdown: [...scene.props, ...scene.costumes, ...scene.vehicles, ...scene.specialRequirements],
          status: scene.status,
          blockIds,
        };
      });
      scriptSceneIds.push(...scenes.map((scene) => scene.id));
      data.scripts.push({
        id: scriptId,
        projectId: project.id,
        title: `${project.title} â€” ${scriptIndex === 1 ? "Production Draft" : "Pickup Scenes"}`,
        type: project.type === "series" ? "OTT Series" : "Feature Film",
        language: project.language,
        genre: project.genre,
        writer: project.director,
        storyBy: project.director,
        screenplayBy: project.director,
        dialoguesBy: project.director,
        scriptCoordinator: projectCrew.find((member) => member.department === "direction")?.name ?? "Production Office",
        draftName: scriptIndex === 1 ? "Production Draft" : "Pickup Scenes",
        draftNumber: `${scriptIndex + 2}`,
        status: scriptIndex === 1 ? "Production Draft" : "Revised Draft",
        notes: `Demo script coverage for the next three months of ${project.title}.`,
        createdAt: "2026-09-01T09:00:00.000Z",
        updatedAt: "2026-09-08T09:00:00.000Z",
        createdBy: "FlowBender Demo Team",
        archived: false,
        blocks,
        scenes,
        versions: [],
        linkedSceneIds: scenes.map((scene) => scene.id),
        shots: [],
        references: [],
      });

      // Keep the complete demo slate in the upcoming 2027 release cycle.
      const shiftDates = (value: unknown): void => {
        if (Array.isArray(value)) {
          value.forEach(shiftDates);
          return;
        }
        if (!value || typeof value !== "object") return;
        Object.entries(value).forEach(([key, entry]) => {
          if (typeof entry === "string" && /date|at|updated|created|due|shoot|air|delivery|release/i.test(key)) {
            (value as Record<string, unknown>)[key] = entry.replace(/\b20\d{2}\b/g, "2027");
          } else {
            shiftDates(entry);
          }
        });
      };
      shiftDates(data);
    }

    for (let week = 0; week < 12; week += 1) {
      const date = demoDate(projectIndex * 2 + week * 7);
      const dayNumber = week + 2;
      const scene = projectScenes[week % Math.max(projectScenes.length, 1)];
      const scheduleId = `demo-${project.id}-schedule-${week + 2}`;
      if (!data.scheduleEntries.some((entry) => entry.id === scheduleId)) {
        data.scheduleEntries.push({
          id: scheduleId,
          projectId: project.id,
          projectTitle: project.title,
          date,
          callTime: week % 3 === 0 ? "05:30" : "06:00",
          location: `${project.title} ${week % 2 === 0 ? "Main Unit" : "Second Unit"} Stage`,
          scenes: scene ? [`Sc. ${scene.sceneNumber}`] : [],
          shootDayNumber: dayNumber,
          totalShootDays: project.totalShootDays,
          callSheetStatus: week < 2 ? "published" : "draft",
          status: week === 0 ? "shooting" : "scheduled",
        });
      }

      const shootDayId = `demo-${project.id}-shoot-day-${week + 2}`;
      if (!data.shootDays.some((day) => day.id === shootDayId)) {
        data.shootDays.push({
          id: shootDayId,
          projectId: project.id,
          projectTitle: project.title,
          date,
          shootDayNumber: dayNumber,
          totalShootDays: project.totalShootDays,
          callTime: "06:00",
          wrapTime: week % 2 === 0 ? "19:00" : "21:00",
          location: `${project.title} ${week % 2 === 0 ? "Main Unit" : "Second Unit"} Stage`,
          locationAddress: "Demo production base, Hyderabad",
          scenes: scene ? [{
            sceneNumber: scene.sceneNumber,
            heading: scene.heading,
            pages: scene.pages,
            intExt: scene.intExt,
            characters: scene.characters,
            timeOfDay: scene.timeOfDay,
            location: scene.location,
            estimatedDuration: scene.estimatedDuration,
            synopsis: scene.synopsis,
            status: week < 2 ? "scheduled" : "pending",
          }] : [],
          castRequired: projectCast.slice(0, 6).map((member) => member.name),
          crewRequired: projectCrew.slice(0, 10).map((member) => ({ department: member.department, role: member.role, name: member.name })),
          equipment: [],
          status: week === 0 ? "in-progress" : "planned",
          callSheetStatus: week < 2 ? "published" : "draft",
          totalPages: scene?.pages ?? 2,
          notes: `Three-month demo plan: week ${week + 1} for ${project.title}.`,
          conflicts: [],
        });
      }

      const callSheetId = `demo-${project.id}-call-sheet-${week + 2}`;
      if (!data.callSheets.some((sheet) => sheet.id === callSheetId)) {
        data.callSheets.push({
          id: callSheetId,
          project: project.title,
          projectId: project.id,
          workflow: project.type === "series" ? "OTT / Web Series" : "Feature Film",
          shootDay: dayNumber,
          date,
          location: `${project.title} ${week % 2 === 0 ? "Main Unit" : "Second Unit"} Stage`,
          director: project.director,
          ad: projectCrew.find((member) => member.department === "direction")?.name ?? "Assistant Director",
          cast: projectCast.length,
          crew: projectCrew.length,
          status: week < 2 ? "Published" : "Draft",
          updated: date,
          scenes: scene ? [{ number: scene.sceneNumber, description: scene.synopsis, setting: scene.intExt, time: scene.timeOfDay, pages: scene.pages, characters: scene.characters.join(", "), duration: scene.estimatedDuration ?? "4 min", status: scene.status, sourceId: scene.id, location: scene.location }] : [],
          notes: `Call sheet ${week + 1} of the next-three-month demo plan.`,
          producer: project.producer,
          language: project.language,
          genre: project.genre,
          productionCompany: project.productionHouse,
          callTime: "06:00",
          firstShot: "07:30",
          packUp: "19:00",
          sceneIds: scene ? [scene.id] : [],
          castAssignments: projectCast.slice(0, 6).map((member) => ({ id: `${callSheetId}-${member.id}`, castId: member.id, name: member.name, character: member.character, status: "Confirmed", pickup: "05:00", call: "06:00", makeup: "06:15", costume: "06:30", onSet: "07:00", wrap: "19:00", transport: "Unit Van", notes: "" })),
          crewAssignments: projectCrew.slice(0, 10).map((member) => ({ id: `${callSheetId}-${member.id}`, crewId: member.id, name: member.name, designation: member.role, department: member.department, callTime: "06:00", transport: "Unit Van", phone: member.phone, notes: "" })),
        });
      }
    }

    for (let taskIndex = 0; taskIndex < 12; taskIndex += 1) {
      const taskId = `demo-${project.id}-task-${taskIndex + 1}`;
      if (!data.productionTasks.some((task) => task.id === taskId)) {
        data.productionTasks.push({
          id: taskId,
          projectId: project.id,
          department: ["Direction", "Production", "Camera", "Art", "Sound", "Post"][taskIndex % 6],
          title: `Week ${taskIndex + 1}: ${["lock locations", "confirm cast", "prep camera package", "approve set dressing", "review sound plan", "publish edit notes"][taskIndex % 6]}`,
          owner: projectCrew[taskIndex % Math.max(projectCrew.length, 1)]?.name ?? "Production Office",
          dueDate: demoDate(projectIndex * 2 + taskIndex * 7 + 4),
          status: taskIndex < 2 ? "in-progress" : "open",
          priority: taskIndex % 5 === 0 ? "high" : "medium",
        });
      }
    }
  });
}

export function createFlowBenderSeedData(): AppDataCollections {
  const reconciled = reconcileVerifiedCredits([...baseDemo.castMembers], [...baseDemo.crewMembers]);

  const data: AppDataCollections = {
    projects: [
      {
        id: "p1",
        title: "Pushpa 2: The Rule",
        type: "feature-film",
        status: "production",
        genre: "Action / Period Drama",
        language: "Telugu / Hindi / Multi",
        director: "Sukumar",
        producer: "Naveen Yerneni, Y. Ravi Shankar",
        productionHouse: "Mythri Movie Makers / Sukumar Writings",
        startDate: "2023-10-12",
        endDate: "2024-12-05",
        budget: 5000000000,
        spent: 3850000000,
        posterColor: "from-amber-700 to-red-900",
        posterImage: projectImageReferences["Pushpa 2: The Rule"] || demoImage("Pushpa 2: The Rule", "#f59e0b"),
        thumbnailImage: projectImageReferences["Pushpa 2: The Rule"] || demoImage("Pushpa 2: The Rule", "#f59e0b"),
        bannerImage: projectImageReferences["Pushpa 2: The Rule"] || demoImage("Pushpa 2: The Rule", "#f59e0b"),
        logline: "Pushpa Raj faces a fierce war with SP Bhanwar Singh Shekhawat and syndicate bosses as his red-sandalwood empire expands.",
        description:
          "Pushpa Raj consolidates his syndicate empire across the Seshachalam forests into international waters, colliding with SP Bhanwar Singh Shekhawat in an explosive showdown of ego, survival, and absolute dominance.",
        shootProgress: 88,
        totalShootDays: 160,
        completedShootDays: 142,
        nextShootDate: "2024-10-15",
        createdAt: "2023-08-01T09:15:00.000Z",
      },
      {
        id: "p2",
        title: "Kalki 2898 AD",
        type: "feature-film",
        status: "completed",
        genre: "Sci-Fi / Dystopian Epic",
        language: "Telugu / Hindi / Multi",
        director: "Nag Ashwin",
        producer: "C. Aswani Dutt, Swapna Dutt, Priyanka Dutt",
        productionHouse: "Vyjayanthi Movies",
        startDate: "2021-07-24",
        endDate: "2024-06-27",
        budget: 6000000000,
        spent: 5950000000,
        posterColor: "from-sky-700 to-slate-900",
        posterImage: projectImageReferences["Kalki 2898 AD"] || demoImage("Kalki 2898 AD", "#38bdf8"),
        thumbnailImage: projectImageReferences["Kalki 2898 AD"] || demoImage("Kalki 2898 AD", "#38bdf8"),
        bannerImage: projectImageReferences["Kalki 2898 AD"] || demoImage("Kalki 2898 AD", "#38bdf8"),
        logline: "In the dystopian city of Kasi 2898 AD, bounty hunter Bhairava and the immortal Ashwatthama clash over pregnant refugee Sumathi carrying the savior of mankind.",
        description:
          "Set in a post-apocalyptic future where the Complex controls all resources, Kalki 2898 AD follows Bhairava, the immortal warrior Ashwatthama, and Supreme Yaskin in an epic technological-mythological clash for the unborn avatar.",
        shootProgress: 100,
        totalShootDays: 210,
        completedShootDays: 210,
        nextShootDate: null,
        createdAt: "2021-06-15T12:00:00.000Z",
      },
      {
        id: "p3",
        title: "Devara: Part 1",
        type: "feature-film",
        status: "completed",
        genre: "Coastal Action / Drama",
        language: "Telugu / Tamil / Hindi",
        director: "Koratala Siva",
        producer: "Sudhakar Mikkilineni, Kosaraju Harikrishna",
        productionHouse: "Yuvasudha Arts / NTR Arts",
        startDate: "2023-04-01",
        endDate: "2024-09-27",
        budget: 3000000000,
        spent: 2920000000,
        posterColor: "from-blue-900 to-slate-950",
        posterImage: projectImageReferences["Devara: Part 1"] || demoImage("Devara: Part 1", "#2563eb"),
        thumbnailImage: projectImageReferences["Devara: Part 1"] || demoImage("Devara: Part 1", "#2563eb"),
        bannerImage: projectImageReferences["Devara: Part 1"] || demoImage("Devara: Part 1", "#2563eb"),
        logline: "A fearless coastal chieftain Devara fights to stop his clan's smuggling empire, leaving his fearful son Varadha to protect his legacy from ruthless rivals.",
        description:
          "Spanning the treacherous coastal tides of the Red Sea clan, Devara: Part 1 chronicles the fierce confrontation between Devara and Bhaira over arms smuggling, family vengeance, and enduring bloodlines.",
        shootProgress: 100,
        totalShootDays: 135,
        completedShootDays: 135,
        nextShootDate: null,
        createdAt: "2023-01-10T10:30:00.000Z",
      },
      {
        id: "p4",
        title: "Game Changer",
        type: "feature-film",
        status: "post-production",
        genre: "Political Action / Thriller",
        language: "Telugu / Tamil / Hindi",
        director: "S. Shankar",
        producer: "Dil Raju, Sirish",
        productionHouse: "Sri Venkateswara Creations",
        startDate: "2021-10-22",
        endDate: "2025-01-10",
        budget: 4000000000,
        spent: 3650000000,
        posterColor: "from-emerald-700 to-zinc-900",
        posterImage: projectImageReferences["Game Changer"] || demoImage("Game Changer", "#10b981"),
        thumbnailImage: projectImageReferences["Game Changer"] || demoImage("Game Changer", "#10b981"),
        bannerImage: projectImageReferences["Game Changer"] || demoImage("Game Changer", "#10b981"),
        logline: "An unyielding IAS officer wages war against corrupt political kingpins to revolutionize state electoral democracy.",
        description:
          "Ram Nandan IAS spearheads a fierce battle against deeply entrenched political corruption, deploying radical constitutional mechanisms and voter awareness to defeat an oligarchic syndicate.",
        shootProgress: 98,
        totalShootDays: 170,
        completedShootDays: 168,
        nextShootDate: null,
        createdAt: "2021-09-08T08:00:00.000Z",
      },
      {
        id: "p5",
        title: "They Call Him OG",
        type: "feature-film",
        status: "production",
        genre: "Action / Underworld Thriller",
        language: "Telugu / Hindi",
        director: "Sujeeth",
        producer: "D. V. V. Danayya",
        productionHouse: "DVV Entertainment",
        startDate: "2023-04-15",
        endDate: "2025-03-27",
        budget: 2500000000,
        spent: 1850000000,
        posterColor: "from-red-800 to-neutral-950",
        posterImage: projectImageReferences["They Call Him OG"] || demoImage("They Call Him OG", "#dc2626"),
        thumbnailImage: projectImageReferences["They Call Him OG"] || demoImage("They Call Him OG", "#dc2626"),
        bannerImage: projectImageReferences["They Call Him OG"] || demoImage("They Call Him OG", "#dc2626"),
        logline: "Ojas Gambheera, a feared underworld boss who vanished a decade ago, resurfaces in Mumbai to settle unfinished blood debts.",
        description:
          "Ten years after vanishing into exile, gangster Ojas Gambheera (OG) returns to the Mumbai underworld to dismantle criminal baron Omi Bhau's syndicate in a stylish neo-noir bloodbath.",
        shootProgress: 74,
        totalShootDays: 110,
        completedShootDays: 82,
        nextShootDate: "2024-11-05",
        createdAt: "2023-02-14T11:20:00.000Z",
      },
      {
        id: "p6",
        title: "HIT: The Third Case",
        type: "feature-film",
        status: "pre-production",
        genre: "Crime Investigation / Mystery",
        language: "Telugu / Multi",
        director: "Sailesh Kolanu",
        producer: "Prashanti Tipirneni",
        productionHouse: "Wall Poster Cinema",
        startDate: "2024-09-01",
        endDate: "2025-05-01",
        budget: 800000000,
        spent: 190000000,
        posterColor: "from-stone-700 to-zinc-950",
        posterImage: projectImageReferences["HIT: The Third Case"] || demoImage("HIT: The Third Case", "#78716c"),
        thumbnailImage: projectImageReferences["HIT: The Third Case"] || demoImage("HIT: The Third Case", "#78716c"),
        bannerImage: projectImageReferences["HIT: The Third Case"] || demoImage("HIT: The Third Case", "#78716c"),
        logline: "Fierce cop Arjun Sarkaar is drafted into the Homicide Intervention Team's darkest cross-border serial murder investigation.",
        description:
          "SP Arjun Sarkaar takes charge of the HIT franchise's most brutal interstate manhunt, tracking an elusive predator whose cryptic psychological patterns push Sarkaar to the very edge of sanity.",
        shootProgress: 22,
        totalShootDays: 75,
        completedShootDays: 16,
        nextShootDate: "2024-11-12",
        createdAt: "2024-06-20T18:00:00.000Z",
      },
      {
        id: "p7",
        title: "The Raja Saab",
        type: "feature-film",
        status: "post-production",
        genre: "Horror / Romantic Comedy",
        language: "Telugu / Multi",
        director: "Maruthi",
        producer: "T. G. Vishwa Prasad",
        productionHouse: "People Media Factory",
        startDate: "2022-10-18",
        endDate: "2025-04-10",
        budget: 2000000000,
        spent: 1720000000,
        posterColor: "from-amber-600 to-stone-900",
        posterImage: projectImageReferences["The Raja Saab"] || demoImage("The Raja Saab", "#d97706"),
        thumbnailImage: projectImageReferences["The Raja Saab"] || demoImage("The Raja Saab", "#d97706"),
        bannerImage: projectImageReferences["The Raja Saab"] || demoImage("The Raja Saab", "#d97706"),
        logline: "A young romantic discovers his royal ancestral estate is guarded by an eccentric ghost with a bizarre claim to his bloodline.",
        description:
          "Blending lavish vintage horror aesthetics with slapstick romance, The Raja Saab follows an easygoing heir navigating an eccentric royal spirit within a labyrinthine haunted palace.",
        shootProgress: 92,
        totalShootDays: 120,
        completedShootDays: 110,
        nextShootDate: null,
        createdAt: "2022-09-01T09:45:00.000Z",
      },
    ],
    scripts: buildSeedScripts(),
    scriptVersions: [...baseDemo.scriptVersions],
    castMembers: reconciled.cast,
    crewMembers: reconciled.crew,
    scenes: baseDemo.scenes.map((sc) => ({
      ...sc,
      notes: sc.notes?.replace(/Mana Hyderabad/g, "Pushpa 2: The Rule") ?? sc.notes,
    })),
    scheduleEntries: baseDemo.scheduleEntries.map((se) => ({
      ...se,
      projectTitle: verifiedProjectTitles[se.projectId] ?? se.projectTitle,
    })),
    shootDays: baseDemo.shootDays.map((sd) => ({
      ...sd,
      projectTitle: verifiedProjectTitles[sd.projectId] ?? sd.projectTitle,
    })),
    callSheets: baseDemo.callSheets.map((cs) => {
      const projectId = cs.projectId ?? "";
      const pTitle = (projectId && verifiedProjectTitles[projectId]) || (cs.id === "CS-2026-001" ? "Pushpa 2: The Rule" : cs.project);
      return {
        ...cs,
        project: pTitle,
        director: cs.id === "CS-2026-001" ? "Sukumar" : cs.director,
      };
    }),
    characters: [...baseDemo.characters],
    locations: [...baseDemo.locations],
    dprReports: [...baseDemo.dprReports],
    productionTasks: [...baseDemo.productionTasks],
    equipmentInventory: [...baseDemo.equipmentInventory],
    vendors: [...baseDemo.vendors],
    marketingItems: [],
    notifications: [],

    // Series Seasons & Episodes (Chapters for Franchise Exploration)
    seriesSeasons: [
      ...baseDemo.seriesSeasons,
      {
        id: "ss-kalki-1",
        projectId: "p2",
        title: "Kalki 2898 AD - Cinematic Chapters",
        seasonNumber: 1,
        episodeCount: 4,
        status: "completed",
        logline: "Chapter breakdown of the Complex infiltration, Shambhala fortress war, and Yaskin's cosmic awakening.",
        showrunner: "Nag Ashwin",
        deliveryWindow: "Theatrical / IMAX",
      },
      {
        id: "ss-pushpa-1",
        projectId: "p1",
        title: "Pushpa 2 - Seshachalam Arcs",
        seasonNumber: 1,
        episodeCount: 3,
        status: "production",
        logline: "Act-by-act breakdown of the Red Sandalwood syndicate conflict and Shekhawat confrontation.",
        showrunner: "Sukumar",
        deliveryWindow: "Pan-India Theatrical",
      },
    ],
    seriesEpisodes: [
      ...baseDemo.seriesEpisodes,
      {
        id: "se-kalki-101",
        projectId: "p2",
        seasonId: "ss-kalki-1",
        episodeNumber: 1,
        title: "Chapter 1: The Dystopian City of Kasi",
        status: "delivered",
        synopsis: "Bhairava tracks bounties to earn enough units to enter the Complex, while rebels uncover Project K.",
        scriptVersionId: "sv-4",
      },
      {
        id: "se-kalki-102",
        projectId: "p2",
        seasonId: "ss-kalki-1",
        episodeNumber: 2,
        title: "Chapter 2: The Awakening of Ashwatthama",
        status: "delivered",
        synopsis: "The immortal warrior Ashwatthama rises to safeguard Sumathi and the unborn divine avatar.",
        scriptVersionId: "sv-4",
      },
      {
        id: "se-kalki-103",
        projectId: "p2",
        seasonId: "ss-kalki-1",
        episodeNumber: 3,
        title: "Chapter 3: Siege of Shambhala",
        status: "delivered",
        synopsis: "Commander Manas leads Complex forces against the hidden city of Shambhala as Bhairava and Bujji arrive.",
        scriptVersionId: "sv-4",
      },
      {
        id: "se-kalki-104",
        projectId: "p2",
        seasonId: "ss-kalki-1",
        episodeNumber: 4,
        title: "Chapter 4: The Karna Revelation & Supreme Yaskin",
        status: "delivered",
        synopsis: "Bhairava taps into his ancient warrior memories while Supreme Yaskin activates the divine drop of serum.",
        scriptVersionId: "sv-4",
      },
    ],

    // 1. BUDGET LINE ITEMS (All 7 authentic blockbusters)
    budgetLineItems: [
      // p1: Pushpa 2: The Rule (â‚¹500 Cr)
      { id: "b-p1-1", projectId: "p1", category: "Above the Line & Direction", allocated: 1500000000, spent: 1200000000, committed: 1500000000, notes: "Director Sukumar & Allu Arjun lead contracts." },
      { id: "b-p1-2", projectId: "p1", category: "Sets & Jathara Climax Construction", allocated: 900000000, spent: 780000000, committed: 900000000, notes: "Ramoji mega temple fair & Maredumilli forest stages." },
      { id: "b-p1-3", projectId: "p1", category: "Camera, Lenses & High-Speed Rig Units", allocated: 350000000, spent: 290000000, committed: 350000000, notes: "Anand Cine ARRI Alexa 35 & Phantom 4K Flex packages." },
      { id: "b-p1-4", projectId: "p1", category: "Forest Locations, Convoys & Security", allocated: 450000000, spent: 380000000, committed: 450000000, notes: "Seshachalam & Maredumilli permits, 300-truck logistics." },
      { id: "b-p1-5", projectId: "p1", category: "Music, Songs & Live Sound Score", allocated: 300000000, spent: 260000000, committed: 300000000, notes: "Devi Sri Prasad Chennai orchestra & sync audio team." },
      { id: "b-p1-6", projectId: "p1", category: "Post-Production, Color & VFX Reserve", allocated: 500000000, spent: 440000000, committed: 500000000, notes: "Makuta & Annapurna Dolby Atmos final theatrical mix." },
      { id: "b-p1-7", projectId: "p1", category: "Pan-India Marketing, Publicity & Dubbing", allocated: 1000000000, spent: 500000000, committed: 1000000000, notes: "Multi-language trailer launch tours across 6 metropolitan capitals." },

      // p2: Kalki 2898 AD (â‚¹600 Cr)
      { id: "b-p2-1", projectId: "p2", category: "Above the Line & Star Ensemble", allocated: 2100000000, spent: 2100000000, committed: 2100000000, notes: "Nag Ashwin, Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika." },
      { id: "b-p2-2", projectId: "p2", category: "Futuristic Bujji Vehicle & Complex Sets", allocated: 1100000000, spent: 1100000000, committed: 1100000000, notes: "Custom engineered 6-ton AI vehicle & Kasi dystopian sets." },
      { id: "b-p2-3", projectId: "p2", category: "International VFX & CGI Simulation", allocated: 1800000000, spent: 1780000000, committed: 1800000000, notes: "DNEG, The Embassy, Makuta & Lola VFX suites." },
      { id: "b-p2-4", projectId: "p2", category: "Music, Choral Score & Dolby Atmos Mix", allocated: 250000000, spent: 250000000, committed: 250000000, notes: "Santhosh Narayanan European orchestra & Atmos print master." },
      { id: "b-p2-5", projectId: "p2", category: "Animatronics, Tactical Armor & Props", allocated: 350000000, spent: 340000000, committed: 350000000, notes: "Ashwatthama staff, futuristic weaponry & armor plating." },
      { id: "b-p2-6", projectId: "p2", category: "Global IMAX & Comic-Con Marketing", allocated: 400000000, spent: 380000000, committed: 400000000, notes: "San Diego Comic-Con premiere, IMAX DMR & worldwide promos." },

      // p3: Devara: Part 1 (â‚¹300 Cr)
      { id: "b-p3-1", projectId: "p3", category: "Above the Line Direction & Cast", allocated: 1200000000, spent: 1200000000, committed: 1200000000, notes: "Koratala Siva, Jr NTR, Saif Ali Khan, Janhvi Kapoor." },
      { id: "b-p3-2", projectId: "p3", category: "Massive Water Tank & Coastal Set Rigs", allocated: 600000000, spent: 590000000, committed: 600000000, notes: "Ramoji film city ocean tank, underwater stages & sea rigs." },
      { id: "b-p3-3", projectId: "p3", category: "Ocean Stunts & International Action Units", allocated: 400000000, spent: 390000000, committed: 400000000, notes: "Kenny Bates & Peter Hein shark and tide battle units." },
      { id: "b-p3-4", projectId: "p3", category: "Anirudh Ravichander Score & Audio", allocated: 200000000, spent: 200000000, committed: 200000000, notes: "Anirudh sound engineering, 'Fear Song' & multi-stems." },
      { id: "b-p3-5", projectId: "p3", category: "VFX Fluid Dynamics & Sea Simulations", allocated: 350000000, spent: 330000000, committed: 350000000, notes: "High-density ocean waves, stormy skies & digital blood passes." },
      { id: "b-p3-6", projectId: "p3", category: "Pan-India Release DCP & Distribution PR", allocated: 250000000, spent: 210000000, committed: 250000000, notes: "Qube Cinema Pan-India DCP replication & North India campaigns." },

      // p4: Game Changer (â‚¹400 Cr)
      { id: "b-p4-1", projectId: "p4", category: "Above the Line Direction & Lead Cast", allocated: 1600000000, spent: 1500000000, committed: 1600000000, notes: "S. Shankar direction & Ram Charan dual-role contracts." },
      { id: "b-p4-2", projectId: "p4", category: "Grand Song Sets & 1000 Dancers Rigs", allocated: 800000000, spent: 760000000, committed: 800000000, notes: "Shankar signature visual extravaganza songs and costumes." },
      { id: "b-p4-3", projectId: "p4", category: "Political Rally Crowds & Helicopter Logistics", allocated: 450000000, spent: 410000000, committed: 450000000, notes: "Assembly sets, chopper chase & 5,000 background artists." },
      { id: "b-p4-4", projectId: "p4", category: "High-End VFX, Trains & Action CGI", allocated: 600000000, spent: 540000000, committed: 600000000, notes: "Electrifying stadium and railway fight visual extensions." },
      { id: "b-p4-5", projectId: "p4", category: "Thaman S Soundtrack & Orchestra Suites", allocated: 250000000, spent: 220000000, committed: 250000000, notes: "High-energy commercial beats, sync stems and vocal sessions." },
      { id: "b-p4-6", projectId: "p4", category: "Pan-India Release Mastering & Promotions", allocated: 300000000, spent: 220000000, committed: 300000000, notes: "Sri Venkateswara Creations nationwide multi-city promotions." },

      // p5: They Call Him OG (â‚¹250 Cr)
      { id: "b-p5-1", projectId: "p5", category: "Above the Line Direction & Star Cast", allocated: 1100000000, spent: 850000000, committed: 1100000000, notes: "Sujeeth direction & Pawan Kalyan / Emraan Hashmi." },
      { id: "b-p5-2", projectId: "p5", category: "Mumbai Port, Docks & Neo-Noir Sets", allocated: 450000000, spent: 340000000, committed: 450000000, notes: "Japanese mafia dojo & Mumbai container shipping yard sets." },
      { id: "b-p5-3", projectId: "p5", category: "High-Octane Martial Arts & Stunt Rigging", allocated: 350000000, spent: 260000000, committed: 350000000, notes: "Katana swordplay, gun-fu choreography and pyro safety." },
      { id: "b-p5-4", projectId: "p5", category: "Cinematography & ARRI Alexa LF Package", allocated: 200000000, spent: 150000000, committed: 200000000, notes: "Ravi K. Chandran anamorphic low-light glass package." },
      { id: "b-p5-5", projectId: "p5", category: "Thaman S Heavy Bass BGM & Sound Design", allocated: 250000000, spent: 170000000, committed: 250000000, notes: "Cult underworld background score & firearm sound engineering." },
      { id: "b-p5-6", projectId: "p5", category: "Post-Production, Color & Visual Effects", allocated: 150000000, spent: 80000000, committed: 150000000, notes: "Neo-noir high contrast color grading and muzzle flash VFX." },

      // p6: HIT: The Third Case (â‚¹80 Cr)
      { id: "b-p6-1", projectId: "p6", category: "Above the Line Direction & Lead Actor", allocated: 350000000, spent: 90000000, committed: 350000000, notes: "Sailesh Kolanu direction & Nani (Arjun Sarkaar)." },
      { id: "b-p6-2", projectId: "p6", category: "Forensic Lab & Snow Hideout Art Sets", allocated: 120000000, spent: 30000000, committed: 120000000, notes: "High-tech HIT forensic wing & North India snow terrain hideout." },
      { id: "b-p6-3", projectId: "p6", category: "Cinematography & Anamorphic Lenses", allocated: 80000000, spent: 20000000, committed: 80000000, notes: "Sanu Varghese low-key suspense lens package." },
      { id: "b-p6-4", projectId: "p6", category: "Tactical Police Operations & Stunts", allocated: 100000000, spent: 25000000, committed: 100000000, notes: "Highway high-speed pursuit & tactical assault units." },
      { id: "b-p6-5", projectId: "p6", category: "Mickey J. Meyer Suspense Score & Mix", allocated: 70000000, spent: 15000000, committed: 70000000, notes: "Psychological thriller score & tension ambient audio." },
      { id: "b-p6-6", projectId: "p6", category: "Post-Production, Grading & Theatrical Release", allocated: 80000000, spent: 10000000, committed: 80000000, notes: "Prasad Labs cold-tone grade and nationwide DCP distribution." },

      // p7: The Raja Saab (â‚¹200 Cr)
      { id: "b-p7-1", projectId: "p7", category: "Above the Line Direction & Star Cast", allocated: 900000000, spent: 800000000, committed: 900000000, notes: "Maruthi direction, Prabhas & Sanjay Dutt." },
      { id: "b-p7-2", projectId: "p7", category: "Vintage Ancestral Palace Interior Sets", allocated: 400000000, spent: 360000000, committed: 400000000, notes: "Grand 19th-century royal palace and secret dungeon construction." },
      { id: "b-p7-3", projectId: "p7", category: "Supernatural VFX & Ghost Simulation", allocated: 280000000, spent: 240000000, committed: 280000000, notes: "Levitation, spectral phenomena & gothic illusion CGI." },
      { id: "b-p7-4", projectId: "p7", category: "Thaman S Commercial Tracks & Spooky Symphony", allocated: 180000000, spent: 150000000, committed: 180000000, notes: "Chartbuster dance numbers & haunting melodic orchestra." },
      { id: "b-p7-5", projectId: "p7", category: "Period Costumes, Vintage Cars & Props", allocated: 120000000, spent: 100000000, committed: 120000000, notes: "Royal attire, vintage Rolls Royce fleet and antique swords." },
      { id: "b-p7-6", projectId: "p7", category: "Post-Production, HDR DI & Promotion", allocated: 120000000, spent: 70000000, committed: 120000000, notes: "Warm gothic color grading, trailer master & festival release." },
    ],

    // 2. EXPENSE ITEMS (All 7 authentic blockbusters)
    expenseItems: [
      // p1: Pushpa 2: The Rule
      { id: "exp-p1-1", projectId: "p1", date: "2024-09-03", category: "Production", description: "Jathara sequence holy sindoor, temple props and 1,200 costume dyes", amount: 4850000, status: "approved" },
      { id: "exp-p1-2", projectId: "p1", date: "2024-09-04", category: "Locations", description: "Maredumilli deep forest conservation permit and security escorts", amount: 1650000, status: "paid" },
      { id: "exp-p1-3", projectId: "p1", date: "2024-09-01", category: "Equipment & Rentals", description: "ARRI Alexa 35 & high-speed Phantom Flex 4K camera hire installment", vendorId: "v-anand", amount: 3500000, status: "paid" },
      { id: "exp-p1-4", projectId: "p1", date: "2024-08-28", category: "Above the Line", description: "Sukumar direction unit second schedule workshop allowance", amount: 2500000, status: "paid" },
      { id: "exp-p1-5", projectId: "p1", date: "2024-08-25", category: "Production", description: "Truck convoy 60-vehicle diesel and off-road towing gear", amount: 1200000, status: "paid" },

      // p2: Kalki 2898 AD
      { id: "exp-p2-1", projectId: "p2", date: "2024-05-18", category: "Equipment & Rentals", description: "Bujji custom vehicle hydraulic suspension and tire replacement kit", amount: 2800000, status: "paid" },
      { id: "exp-p2-2", projectId: "p2", date: "2024-05-28", category: "Post-Production", description: "DNEG international VFX milestone 4 - Shambhala battle pass", vendorId: "v-makuta", amount: 14500000, status: "paid" },
      { id: "exp-p2-3", projectId: "p2", date: "2024-06-02", category: "Post-Production", description: "Santhosh Narayanan European choral orchestra recording master", amount: 3800000, status: "paid" },
      { id: "exp-p2-4", projectId: "p2", date: "2024-06-10", category: "Post-Production", description: "IMAX DMR theatrical color and audio mastering certificate", vendorId: "v-qube", amount: 4200000, status: "paid" },

      // p3: Devara: Part 1
      { id: "exp-p3-1", projectId: "p3", date: "2024-08-15", category: "Equipment & Rentals", description: "Underwater camera housing waterproof sealing & water heating units", vendorId: "v-anand", amount: 1850000, status: "paid" },
      { id: "exp-p3-2", projectId: "p3", date: "2024-08-22", category: "Production", description: "Ocean stunt harness cables & high-tension wire pull rigs", amount: 2200000, status: "paid" },
      { id: "exp-p3-3", projectId: "p3", date: "2024-09-01", category: "Post-Production", description: "Anirudh 'Fear Song' 128-track Atmos final mix session", vendorId: "v-annapurna", amount: 1950000, status: "paid" },
      { id: "exp-p3-4", projectId: "p3", date: "2024-09-05", category: "Locations", description: "Vizag port and coastal rocky cove filming permissions", amount: 1400000, status: "paid" },

      // p4: Game Changer
      { id: "exp-p4-1", projectId: "p4", date: "2024-09-02", category: "Production", description: "Shankar mega song 800-dancer custom designer outfit batch", amount: 6500000, status: "approved" },
      { id: "exp-p4-2", projectId: "p4", date: "2024-08-28", category: "Locations", description: "Ramoji Film City central assembly building floor reservation", amount: 3200000, status: "paid" },
      { id: "exp-p4-3", projectId: "p4", date: "2024-09-03", category: "Post-Production", description: "Stadium rally CGI crowd multiplication visual effects package", vendorId: "v-makuta", amount: 4800000, status: "approved" },
      { id: "exp-p4-4", projectId: "p4", date: "2024-09-05", category: "Equipment & Rentals", description: "Technocrane 50ft remote head weekly rental package", vendorId: "v-modern", amount: 1750000, status: "draft" },

      // p5: They Call Him OG
      { id: "exp-p5-1", projectId: "p5", date: "2024-09-01", category: "Locations", description: "Mumbai shipping container yard night shoot clearance and fire safety", amount: 2600000, status: "paid" },
      { id: "exp-p5-2", projectId: "p5", date: "2024-08-29", category: "Production", description: "Japanese martial arts katana stunt props and weapon safety certification", amount: 1450000, status: "paid" },
      { id: "exp-p5-3", projectId: "p5", date: "2024-09-03", category: "Equipment & Rentals", description: "Ravi K. Chandran ARRI Alexa LF lens and filter rental batch", vendorId: "v-anand", amount: 2100000, status: "approved" },
      { id: "exp-p5-4", projectId: "p5", date: "2024-09-04", category: "Post-Production", description: "High-contrast neo-noir color grading look development at Prasad Labs", vendorId: "v-prasad", amount: 1200000, status: "draft" },

      // p6: HIT: The Third Case
      { id: "exp-p6-1", projectId: "p6", date: "2024-09-02", category: "Production", description: "HIT forensic department authentic autopsy and crime scene lab props", amount: 950000, status: "paid" },
      { id: "exp-p6-2", projectId: "p6", date: "2024-09-04", category: "Locations", description: "Himachal Pradesh snow mountain highway police permit advance", amount: 1100000, status: "approved" },
      { id: "exp-p6-3", projectId: "p6", date: "2024-09-05", category: "Equipment & Rentals", description: "Sanu Varghese low-light prime lens package security deposit", vendorId: "v-anand", amount: 850000, status: "draft" },

      // p7: The Raja Saab
      { id: "exp-p7-1", projectId: "p7", date: "2024-09-01", category: "Production", description: "Vintage royal palace chandelier restoration and electrical safety rig", amount: 1850000, status: "paid" },
      { id: "exp-p7-2", projectId: "p7", date: "2024-09-03", category: "Post-Production", description: "Palace ghost spectral particle dynamics previz test render", vendorId: "v-makuta", amount: 1600000, status: "approved" },
      { id: "exp-p7-3", projectId: "p7", date: "2024-09-05", category: "Above the Line", description: "Maruthi direction script polish and comedy track review workshop", amount: 750000, status: "draft" },
    ],

    // 3. PAYROLL ENTRIES (All 7 authentic blockbusters)
    payrollEntries: [
      // p1: Pushpa 2
      { id: "pay-p1-1", projectId: "p1", payeeName: "Sukumar", department: "Direction", period: "August 2024", grossAmount: 15000000, paidAmount: 15000000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p1-2", projectId: "p1", payeeName: "Miroslaw Kuba Brozek", department: "Camera", period: "August 2024", grossAmount: 3500000, paidAmount: 3500000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p1-3", projectId: "p1", payeeName: "Naveen Nooli", department: "Editing", period: "August 2024", grossAmount: 1800000, paidAmount: 1800000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p1-4", projectId: "p1", payeeName: "Devi Sri Prasad", department: "Music", period: "Song Mix Pass", grossAmount: 8000000, paidAmount: 8000000, status: "paid", dueDate: "2024-09-01" },

      // p2: Kalki 2898 AD
      { id: "pay-p2-1", projectId: "p2", payeeName: "Nag Ashwin", department: "Direction", period: "Final Post Lock", grossAmount: 12000000, paidAmount: 12000000, status: "paid", dueDate: "2024-06-15" },
      { id: "pay-p2-2", projectId: "p2", payeeName: "Djordje Stojiljkovic", department: "Camera", period: "Wrap Retainer", grossAmount: 4000000, paidAmount: 4000000, status: "paid", dueDate: "2024-06-15" },
      { id: "pay-p2-3", projectId: "p2", payeeName: "Kotagiri Venkateswara Rao", department: "Editing", period: "Final Edit", grossAmount: 2200000, paidAmount: 2200000, status: "paid", dueDate: "2024-06-15" },
      { id: "pay-p2-4", projectId: "p2", payeeName: "Santhosh Narayanan", department: "Music", period: "Score Delivery", grossAmount: 6500000, paidAmount: 6500000, status: "paid", dueDate: "2024-06-20" },

      // p3: Devara: Part 1
      { id: "pay-p3-1", projectId: "p3", payeeName: "Koratala Siva", department: "Direction", period: "Final Cut Review", grossAmount: 10000000, paidAmount: 10000000, status: "paid", dueDate: "2024-09-01" },
      { id: "pay-p3-2", projectId: "p3", payeeName: "R. Rathnavelu", department: "Camera", period: "Ocean Unit Retainer", grossAmount: 3800000, paidAmount: 3800000, status: "paid", dueDate: "2024-09-01" },
      { id: "pay-p3-3", projectId: "p3", payeeName: "Anirudh Ravichander", department: "Music", period: "Final Stems", grossAmount: 7500000, paidAmount: 7500000, status: "paid", dueDate: "2024-09-05" },

      // p4: Game Changer
      { id: "pay-p4-1", projectId: "p4", payeeName: "S. Shankar", department: "Direction", period: "Post Supervision", grossAmount: 18000000, paidAmount: 18000000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p4-2", projectId: "p4", payeeName: "S. Thirunavukarasu", department: "Camera", period: "August 2024", grossAmount: 3200000, paidAmount: 3200000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p4-3", projectId: "p4", payeeName: "Thaman S", department: "Music", period: "Song Mastering", grossAmount: 4500000, paidAmount: 4500000, status: "paid", dueDate: "2024-09-02" },

      // p5: They Call Him OG
      { id: "pay-p5-1", projectId: "p5", payeeName: "Sujeeth", department: "Direction", period: "Schedule 3", grossAmount: 5000000, paidAmount: 5000000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p5-2", projectId: "p5", payeeName: "Ravi K. Chandran", department: "Camera", period: "Mumbai Schedule", grossAmount: 3000000, paidAmount: 3000000, status: "paid", dueDate: "2024-08-31" },

      // p6: HIT: The Third Case
      { id: "pay-p6-1", projectId: "p6", payeeName: "Sailesh Kolanu", department: "Direction", period: "Prep Phase", grossAmount: 2500000, paidAmount: 2500000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p6-2", projectId: "p6", payeeName: "Sanu Varghese", department: "Camera", period: "Recce Retainer", grossAmount: 1200000, paidAmount: 1200000, status: "paid", dueDate: "2024-08-31" },

      // p7: The Raja Saab
      { id: "pay-p7-1", projectId: "p7", payeeName: "Maruthi", department: "Direction", period: "Post Supervision", grossAmount: 4000000, paidAmount: 4000000, status: "paid", dueDate: "2024-08-31" },
      { id: "pay-p7-2", projectId: "p7", payeeName: "Kotagiri Venkateswara Rao", department: "Editing", period: "Fine Cut", grossAmount: 1500000, paidAmount: 1500000, status: "paid", dueDate: "2024-08-31" },
    ],

    // 4. POST PRODUCTION ITEMS (All 7 authentic blockbusters)
    postProductionItems: [
      // p1: Pushpa 2: The Rule
      { id: "post-p1-1", projectId: "p1", department: "Editing", task: "Climax Jathara Battle Picture Lock", owner: "Naveen Nooli", status: "review", progress: 92, dueDate: "2024-10-20" },
      { id: "post-p1-2", projectId: "p1", department: "VFX", task: "Seshachalam Forest Night Gunfight CG Dust & Tracers", owner: "Makuta VFX", status: "in-progress", progress: 85, dueDate: "2024-10-30" },
      { id: "post-p1-3", projectId: "p1", department: "DI", task: "Rustic Red Sandalwood 4K HDR Dolby Vision Grade", owner: "Prasad Labs Lead", status: "in-progress", progress: 80, dueDate: "2024-11-05" },
      { id: "post-p1-4", projectId: "p1", department: "Sound", task: "Dolby Atmos 128-Track Theatrical Final Mix", owner: "Resul Pookutty", status: "in-progress", progress: 75, dueDate: "2024-11-10" },
      { id: "post-p1-5", projectId: "p1", department: "Dubbing", task: "Pan-India Multi-Language Dubbing (Hindi, Tamil, Mal, Kan)", owner: "YRF Dubbing Desk", status: "in-progress", progress: 88, dueDate: "2024-10-25" },
      { id: "post-p1-6", projectId: "p1", department: "Music", task: "Devi Sri Prasad High-Voltage Climax BGM Final Score", owner: "DSP Studios Chennai", status: "in-progress", progress: 82, dueDate: "2024-11-02" },
      { id: "post-p1-7", projectId: "p1", department: "QC", task: "Pan-India 4K DCI DCP Qube Theatrical Verification", owner: "Qube Operations", status: "in-progress", progress: 70, dueDate: "2024-11-15" },

      // p2: Kalki 2898 AD (100% Completed Master)
      { id: "post-p2-1", projectId: "p2", department: "VFX", task: "Kurukshetra Prologue & Shambhala Shield VFX Complete", owner: "DNEG & The Embassy", status: "completed", progress: 100, dueDate: "2024-06-10" },
      { id: "post-p2-2", projectId: "p2", department: "DI", task: "Dystopian Amber & Complex Neon Grade Final", owner: "Prasad Labs", status: "completed", progress: 100, dueDate: "2024-06-12" },
      { id: "post-p2-3", projectId: "p2", department: "Sound", task: "Dolby Atmos Theatrical Print Master & IMAX 12-Track", owner: "Annapurna Sound Stage", status: "completed", progress: 100, dueDate: "2024-06-15" },
      { id: "post-p2-4", projectId: "p2", department: "Music", task: "Santhosh Narayanan Symphonic Choral Master", owner: "Santhosh Narayanan", status: "completed", progress: 100, dueDate: "2024-06-14" },
      { id: "post-p2-5", projectId: "p2", department: "QC", task: "Global IMAX DMR & Dolby Cinema Release QC", owner: "IMAX Tech Desk", status: "completed", progress: 100, dueDate: "2024-06-20" },

      // p3: Devara: Part 1
      { id: "post-p3-1", projectId: "p3", department: "VFX", task: "Red Sea Fluid Simulation & Shark Battle Composite", owner: "Makuta VFX", status: "completed", progress: 100, dueDate: "2024-09-10" },
      { id: "post-p3-2", projectId: "p3", department: "Editing", task: "A. Sreekar Prasad Final Theatrical Censor Cut", owner: "A. Sreekar Prasad", status: "completed", progress: 100, dueDate: "2024-09-12" },
      { id: "post-p3-3", projectId: "p3", department: "Sound", task: "Anirudh 'All Hail The Tiger' Climax Atmos Mix", owner: "Albuquerque Sound", status: "completed", progress: 100, dueDate: "2024-09-15" },
      { id: "post-p3-4", projectId: "p3", department: "DI", task: "Coastal Twilight & High-Contrast Night Water Grade", owner: "Prasad Labs", status: "completed", progress: 100, dueDate: "2024-09-14" },
      { id: "post-p3-5", projectId: "p3", department: "QC", task: "Theatrical 4K DCI DCP Pan-India Certification", owner: "Qube Cinema", status: "completed", progress: 100, dueDate: "2024-09-20" },

      // p4: Game Changer
      { id: "post-p4-1", projectId: "p4", department: "Editing", task: "Shankar Signature 3-Hour Cutdown & Conforming", owner: "Shameer Muhammed", status: "in-progress", progress: 85, dueDate: "2024-11-15" },
      { id: "post-p4-2", projectId: "p4", department: "VFX", task: "Song Sequences Visual Splendor & Helicopter Action CG", owner: "Pixel Adda", status: "in-progress", progress: 78, dueDate: "2024-11-20" },
      { id: "post-p4-3", projectId: "p4", department: "DI", task: "Vibrant Commercial Shankar Palette 4K HDR Pass", owner: "Prasad Labs", status: "in-progress", progress: 70, dueDate: "2024-11-25" },
      { id: "post-p4-4", projectId: "p4", department: "Music", task: "Thaman S Multi-Language Master Stems & BGM Mix", owner: "Thaman Audio Suite", status: "in-progress", progress: 80, dueDate: "2024-11-18" },
      { id: "post-p4-5", projectId: "p4", department: "QC", task: "CBFC Censor Screening Theatrical Master QC", owner: "SVC Post Desk", status: "in-progress", progress: 60, dueDate: "2024-12-05" },

      // p5: They Call Him OG
      { id: "post-p5-1", projectId: "p5", department: "Editing", task: "Teaser Cuts & Principal Action Rough Assembly", owner: "Naveen Nooli", status: "in-progress", progress: 65, dueDate: "2024-11-30" },
      { id: "post-p5-2", projectId: "p5", department: "Sound", task: "Underworld Gunshot Foley & Sword Clash Acoustic Mix", owner: "Annapurna Sound", status: "in-progress", progress: 55, dueDate: "2024-12-10" },
      { id: "post-p5-3", projectId: "p5", department: "DI", task: "Japanese Neo-Noir High-Contrast Look LUT Development", owner: "Prasad Color Suite", status: "in-progress", progress: 60, dueDate: "2024-12-05" },

      // p6: HIT: The Third Case
      { id: "post-p6-1", projectId: "p6", department: "Editing", task: "Arjun Sarkaar First Teaser Cut & Sound Stings", owner: "Karthika Srinivas", status: "in-progress", progress: 30, dueDate: "2024-12-15" },
      { id: "post-p6-2", projectId: "p6", department: "Music", task: "Psychological Investigation Main Theme Motifs", owner: "Mickey J. Meyer", status: "in-progress", progress: 40, dueDate: "2024-12-20" },

      // p7: The Raja Saab
      { id: "post-p7-1", projectId: "post-p7-1", department: "Editing", task: "Horror Comedy Balance Fine Assembly Cut", owner: "Kotagiri Venkateswara Rao", status: "in-progress", progress: 80, dueDate: "2024-11-25" },
      { id: "post-p7-2", projectId: "p7", department: "VFX", task: "Palace Ghost Supernatural Illusions & Floating Props", owner: "Makuta VFX", status: "in-progress", progress: 75, dueDate: "2024-12-05" },
      { id: "post-p7-3", projectId: "p7", department: "DI", task: "Gothic Warmth & Palace Chandelier Color Grade", owner: "Prasad Labs", status: "in-progress", progress: 72, dueDate: "2024-12-10" },
    ],

    // 5. DELIVERABLES (All 7 authentic blockbusters)
    deliverables: [
      // p1: Pushpa 2
      { id: "del-p1-1", projectId: "p1", name: "Theatrical Master 4K DCI DCP (All India)", format: "4K DCI SMPTE", territory: "Worldwide Theatrical", status: "pending", dueDate: "2024-11-28" },
      { id: "del-p1-2", projectId: "p1", name: "Hindi Theatrical Master (AA Films)", format: "ProRes 4444 XQ", territory: "North India Theatrical", status: "ready", dueDate: "2024-11-20" },
      { id: "del-p1-3", projectId: "p1", name: "Netflix Global OTT 4K HDR IMF Package", format: "SMPTE IMF ProRes", territory: "Worldwide Streaming", status: "pending", dueDate: "2025-01-15" },
      { id: "del-p1-4", projectId: "p1", name: "T-Series Audio Single & OST Master", format: "24-bit 96kHz WAV", territory: "Global Audio Platforms", status: "ready", dueDate: "2024-10-15" },

      // p2: Kalki 2898 AD
      { id: "del-p2-1", projectId: "p2", name: "IMAX DMR 3D & 2D Theatrical Package", format: "IMAX 4K DMR", territory: "Global IMAX Theaters", status: "delivered", dueDate: "2024-06-22" },
      { id: "del-p2-2", projectId: "p2", name: "Netflix Hindi Streaming 4K Dolby Vision", format: "Netflix IMF Package", territory: "Worldwide OTT", status: "delivered", dueDate: "2024-08-10" },
      { id: "del-p2-3", projectId: "p2", name: "Prime Video South Languages Master", format: "ProRes 422 HQ", territory: "South India Streaming", status: "delivered", dueDate: "2024-08-10" },
      { id: "del-p2-4", projectId: "p2", name: "Saregama Full OST Orchestral Stems", format: "24-bit 96kHz WAV", territory: "Worldwide Music", status: "delivered", dueDate: "2024-06-25" },

      // p3: Devara: Part 1
      { id: "del-p3-1", projectId: "p3", name: "Theatrical 4K DCI DCP Master", format: "4K DCI JPEG2000", territory: "India & Overseas Theatrical", status: "delivered", dueDate: "2024-09-22" },
      { id: "del-p3-2", projectId: "p3", name: "Netflix Multi-Language OTT Master", format: "SMPTE IMF", territory: "Worldwide Digital", status: "delivered", dueDate: "2024-11-05" },
      { id: "del-p3-3", projectId: "p3", name: "T-Series South OST Master", format: "24-bit WAV", territory: "Global Audio", status: "delivered", dueDate: "2024-09-20" },

      // p4: Game Changer
      { id: "del-p4-1", projectId: "p4", name: "Zee Studios Theatrical DCP Package", format: "4K DCI SMPTE", territory: "Pan-India Theatrical", status: "in-progress", dueDate: "2024-12-25" },
      { id: "del-p4-2", projectId: "p4", name: "Amazon Prime Video Global 4K HDR", format: "ProRes 422 HQ", territory: "Worldwide Digital OTT", status: "pending", dueDate: "2025-02-15" },
      { id: "del-p4-3", projectId: "p4", name: "Zee Telugu Satellite Telecast Tape", format: "OP1a MXF Broadcast", territory: "Satellite Television", status: "pending", dueDate: "2025-03-01" },

      // p5: They Call Him OG
      { id: "del-p5-1", projectId: "p5", name: "Theatrical 4K DCI Teaser & Trailer", format: "4K DCI DCP", territory: "Worldwide Theatrical", status: "ready", dueDate: "2024-10-10" },
      { id: "del-p5-2", projectId: "p5", name: "Netflix Worldwide Digital Streaming Master", format: "SMPTE IMF", territory: "Global Streaming", status: "pending", dueDate: "2025-05-15" },
      { id: "del-p5-3", projectId: "p5", name: "Sony Music India OST Master Stems", format: "24-bit WAV 96kHz", territory: "Worldwide Audio", status: "in-progress", dueDate: "2025-01-20" },

      // p6: HIT: The Third Case
      { id: "del-p6-1", projectId: "p6", name: "Title Announcement Teaser 4K Master", format: "ProRes 422 HQ", territory: "Digital & Theaters", status: "ready", dueDate: "2024-09-15" },
      { id: "del-p6-2", projectId: "p6", name: "Theatrical 4K DCI DCP Master", format: "4K DCI", territory: "Worldwide Theatrical", status: "pending", dueDate: "2025-04-20" },

      // p7: The Raja Saab
      { id: "del-p7-1", projectId: "p7", name: "First Look Glimpse 4K DCP & ProRes", format: "ProRes 4444", territory: "Digital & Theatrical", status: "ready", dueDate: "2024-10-23" },
      { id: "del-p7-2", projectId: "p7", name: "Theatrical 4K DCI DCP Master", format: "4K DCI SMPTE", territory: "Worldwide Theatrical", status: "pending", dueDate: "2025-03-25" },
      { id: "del-p7-3", projectId: "p7", name: "People Media Audio OST Master", format: "24-bit 48kHz WAV", territory: "Global Audio", status: "in-progress", dueDate: "2025-02-15" },
    ],

    // 6. RIGHTS DEALS (All 7 authentic blockbusters with real commercial scale)
    rightsDeals: [
      // p1: Pushpa 2: The Rule (Total: ~â‚¹990 Cr across all rights)
      { id: "rd-p1-1", projectId: "p1", territory: "North India Hindi Theatrical", distributor: "AA Films (Anil Thadani)", rightsType: "theatrical", status: "signed", minimumGuarantee: 2000000000, advanceReceived: 1000000000, deliveryStatus: "partial" },
      { id: "rd-p1-2", projectId: "p1", territory: "Nizam (Telangana)", distributor: "Mythri Movie Distribution", rightsType: "theatrical", status: "signed", minimumGuarantee: 1000000000, advanceReceived: 500000000, deliveryStatus: "partial" },
      { id: "rd-p1-3", projectId: "p1", territory: "Ceded (Rayalaseema)", distributor: "Sri Venkateswara / Local Guild", rightsType: "theatrical", status: "signed", minimumGuarantee: 350000000, advanceReceived: 175000000, deliveryStatus: "partial" },
      { id: "rd-p1-4", projectId: "p1", territory: "Andhra (Coastal 6 Territories)", distributor: "Mythri Release Network", rightsType: "theatrical", status: "signed", minimumGuarantee: 850000000, advanceReceived: 425000000, deliveryStatus: "partial" },
      { id: "rd-p1-5", projectId: "p1", territory: "Overseas (USA, UK, Gulf, Aus)", distributor: "Phars Film & Prathyangira Cinemas", rightsType: "theatrical", status: "signed", minimumGuarantee: 1200000000, advanceReceived: 600000000, deliveryStatus: "partial" },
      { id: "rd-p1-6", projectId: "p1", territory: "Worldwide Digital OTT (All Languages)", distributor: "Netflix India", rightsType: "digital", status: "signed", minimumGuarantee: 2750000000, advanceReceived: 1375000000, deliveryStatus: "pending" },
      { id: "rd-p1-7", projectId: "p1", territory: "Satellite Television (Telugu & Hindi)", distributor: "Star Maa / Goldmines", rightsType: "satellite", status: "signed", minimumGuarantee: 800000000, advanceReceived: 400000000, deliveryStatus: "pending" },
      { id: "rd-p1-8", projectId: "p1", territory: "Audio & Music Rights Worldwide", distributor: "T-Series", rightsType: "audio", status: "signed", minimumGuarantee: 650000000, advanceReceived: 650000000, deliveryStatus: "complete" },

      // p2: Kalki 2898 AD (Total: ~â‚¹890 Cr)
      { id: "rd-p2-1", projectId: "p2", territory: "Global Theatrical (All India & Overseas)", distributor: "Vyjayanthi Release & AA Films", rightsType: "theatrical", status: "closed", minimumGuarantee: 3800000000, advanceReceived: 3800000000, deliveryStatus: "complete" },
      { id: "rd-p2-2", projectId: "p2", territory: "Worldwide Digital OTT (Hindi & South)", distributor: "Netflix & Prime Video", rightsType: "digital", status: "closed", minimumGuarantee: 3750000000, advanceReceived: 3750000000, deliveryStatus: "complete" },
      { id: "rd-p2-3", projectId: "p2", territory: "Satellite Television (India)", distributor: "Zee Entertainment Network", rightsType: "satellite", status: "closed", minimumGuarantee: 1000000000, advanceReceived: 1000000000, deliveryStatus: "complete" },
      { id: "rd-p2-4", projectId: "p2", territory: "Audio & Original Score Worldwide", distributor: "Saregama India", rightsType: "audio", status: "closed", minimumGuarantee: 350000000, advanceReceived: 350000000, deliveryStatus: "complete" },

      // p3: Devara: Part 1 (Total: ~â‚¹407 Cr)
      { id: "rd-p3-1", projectId: "p3", territory: "Telugu States Theatrical", distributor: "Sitara / Naga Vamsi", rightsType: "theatrical", status: "closed", minimumGuarantee: 1200000000, advanceReceived: 1200000000, deliveryStatus: "complete" },
      { id: "rd-p3-2", projectId: "p3", territory: "North India Hindi Theatrical", distributor: "Karan Johar / Dharma Productions", rightsType: "theatrical", status: "closed", minimumGuarantee: 500000000, advanceReceived: 500000000, deliveryStatus: "complete" },
      { id: "rd-p3-3", projectId: "p3", territory: "Overseas Theatrical", distributor: "Moksha Movies & Prathyangira", rightsType: "theatrical", status: "closed", minimumGuarantee: 550000000, advanceReceived: 550000000, deliveryStatus: "complete" },
      { id: "rd-p3-4", projectId: "p3", territory: "Worldwide Digital OTT", distributor: "Netflix Worldwide", rightsType: "digital", status: "closed", minimumGuarantee: 1550000000, advanceReceived: 1550000000, deliveryStatus: "complete" },
      { id: "rd-p3-5", projectId: "p3", territory: "Audio & Music Rights", distributor: "T-Series South", rightsType: "audio", status: "closed", minimumGuarantee: 270000000, advanceReceived: 270000000, deliveryStatus: "complete" },

      // p4: Game Changer (Total: ~â‚¹395 Cr)
      { id: "rd-p4-1", projectId: "p4", territory: "Telugu States Theatrical", distributor: "Sri Venkateswara Creations (Dil Raju)", rightsType: "theatrical", status: "signed", minimumGuarantee: 1400000000, advanceReceived: 700000000, deliveryStatus: "partial" },
      { id: "rd-p4-2", projectId: "p4", territory: "North India Hindi Theatrical", distributor: "Zee Studios Theatrical", rightsType: "theatrical", status: "signed", minimumGuarantee: 750000000, advanceReceived: 375000000, deliveryStatus: "partial" },
      { id: "rd-p4-3", projectId: "p4", territory: "Worldwide Digital OTT", distributor: "Amazon Prime Video", rightsType: "digital", status: "signed", minimumGuarantee: 1050000000, advanceReceived: 525000000, deliveryStatus: "pending" },
      { id: "rd-p4-4", projectId: "p4", territory: "Satellite Television Telecast", distributor: "Zee Telugu Network", rightsType: "satellite", status: "signed", minimumGuarantee: 500000000, advanceReceived: 250000000, deliveryStatus: "pending" },
      { id: "rd-p4-5", projectId: "p4", territory: "Audio & Soundtrack Rights", distributor: "Saregama South", rightsType: "audio", status: "signed", minimumGuarantee: 250000000, advanceReceived: 250000000, deliveryStatus: "complete" },

      // p5: They Call Him OG (Total: ~â‚¹240 Cr)
      { id: "rd-p5-1", projectId: "p5", territory: "Nizam & Andhra Theatrical", distributor: "Asian Suresh Entertainment", rightsType: "theatrical", status: "negotiating", minimumGuarantee: 1000000000, advanceReceived: 500000000, deliveryStatus: "pending" },
      { id: "rd-p5-2", projectId: "p5", territory: "Overseas Theatrical", distributor: "Great India Films", rightsType: "theatrical", status: "signed", minimumGuarantee: 300000000, advanceReceived: 150000000, deliveryStatus: "partial" },
      { id: "rd-p5-3", projectId: "p5", territory: "Worldwide Digital OTT", distributor: "Netflix Worldwide", rightsType: "digital", status: "signed", minimumGuarantee: 920000000, advanceReceived: 460000000, deliveryStatus: "pending" },
      { id: "rd-p5-4", projectId: "p5", territory: "Audio & Original Score", distributor: "Sony Music India", rightsType: "audio", status: "signed", minimumGuarantee: 180000000, advanceReceived: 180000000, deliveryStatus: "complete" },

      // p6: HIT: The Third Case (Total: ~â‚¹94 Cr)
      { id: "rd-p6-1", projectId: "p6", territory: "Telugu States Theatrical", distributor: "Wall Poster Cinema / Suresh Release", rightsType: "theatrical", status: "signed", minimumGuarantee: 350000000, advanceReceived: 175000000, deliveryStatus: "pending" },
      { id: "rd-p6-2", projectId: "p6", territory: "Worldwide Digital OTT", distributor: "Amazon Prime Video", rightsType: "digital", status: "signed", minimumGuarantee: 380000000, advanceReceived: 190000000, deliveryStatus: "pending" },
      { id: "rd-p6-3", projectId: "p6", territory: "Satellite & Dubbing Rights", distributor: "Star Network", rightsType: "satellite", status: "negotiating", minimumGuarantee: 160000000, advanceReceived: 80000000, deliveryStatus: "pending" },
      { id: "rd-p6-4", projectId: "p6", territory: "Audio & OST", distributor: "Aditya Music", rightsType: "audio", status: "signed", minimumGuarantee: 50000000, advanceReceived: 50000000, deliveryStatus: "complete" },

      // p7: The Raja Saab (Total: ~â‚¹212 Cr)
      { id: "rd-p7-1", projectId: "p7", territory: "Telugu States Theatrical", distributor: "People Media Factory Release", rightsType: "theatrical", status: "signed", minimumGuarantee: 750000000, advanceReceived: 375000000, deliveryStatus: "partial" },
      { id: "rd-p7-2", projectId: "p7", territory: "Rest of India & Hindi Theatrical", distributor: "Pen Marudhar", rightsType: "theatrical", status: "signed", minimumGuarantee: 350000000, advanceReceived: 150000000, deliveryStatus: "pending" },
      { id: "rd-p7-3", projectId: "p7", territory: "Worldwide Digital OTT", distributor: "Zee5 Streaming", rightsType: "digital", status: "signed", minimumGuarantee: 650000000, advanceReceived: 325000000, deliveryStatus: "pending" },
      { id: "rd-p7-4", projectId: "p7", territory: "Satellite Television", distributor: "Zee Telugu Network", rightsType: "satellite", status: "signed", minimumGuarantee: 250000000, advanceReceived: 125000000, deliveryStatus: "pending" },
      { id: "rd-p7-5", projectId: "p7", territory: "Audio & Music Rights", distributor: "T-Series Worldwide", rightsType: "audio", status: "signed", minimumGuarantee: 120000000, advanceReceived: 120000000, deliveryStatus: "complete" },
    ],

    vfxShots: [...baseDemo.vfxShots],

    attendanceRecords: [
      {
        id: "att-1",
        projectId: "p1",
        personId: "cast-001",
        name: "Prabhas",
        role: "Bhairava / Lead Actor",
        department: "Cast",
        date: "2026-09-16",
        checkIn: "06:00",
        checkOut: "18:30",
        status: "present",
        hoursWorked: 12.5,
        notes: "Full day shoot, complex VFX green screen and action rig sequences",
      },
      {
        id: "att-2",
        projectId: "p1",
        personId: "cast-002",
        name: "Deepika Padukone",
        role: "SUM-80 / Lead Actress",
        department: "Cast",
        date: "2026-09-16",
        checkIn: "07:00",
        checkOut: "18:00",
        status: "present",
        hoursWorked: 11,
        notes: "Dramatic dialogue scenes with rebel forces",
      },
      {
        id: "att-3",
        projectId: "p1",
        personId: "crew-001",
        name: "Djordje Stojiljkovic",
        role: "Director of Photography",
        department: "Camera",
        date: "2026-09-16",
        checkIn: "05:30",
        checkOut: "19:00",
        status: "present",
        hoursWorked: 13.5,
        notes: "IMAX setup and high-speed motion control testing",
      },
      {
        id: "att-4",
        projectId: "p1",
        personId: "crew-002",
        name: "Camera Assistant Unit 1",
        role: "1st AC",
        department: "Camera",
        date: "2026-09-16",
        checkIn: "06:00",
        checkOut: "14:00",
        status: "partial",
        hoursWorked: 8,
        notes: "Shift handover completed for unit rotation",
      },
      {
        id: "att-5",
        projectId: "p2",
        personId: "cast-003",
        name: "Prabhas",
        role: "IPS Officer / Protagonist",
        department: "Cast",
        date: "2026-09-16",
        checkIn: "06:00",
        checkOut: "18:00",
        status: "present",
        hoursWorked: 12,
        notes: "High intensity interrogation room sequence",
      },
      {
        id: "att-6",
        projectId: "p5",
        personId: "cast-004",
        name: "Pawan Kalyan",
        role: "Ojas Gambheera",
        department: "Cast",
        date: "2026-09-16",
        checkIn: "07:30",
        checkOut: "18:30",
        status: "present",
        hoursWorked: 11,
        notes: "Port shipyard fight choreography take 1 to 6",
      },
    ],

    cameraCards: [
      {
        id: "card-1",
        projectId: "p1",
        cardId: "CFast-P1-001",
        capacity: 512,
        available: 48,
        format: "RAW",
        shootDate: "2026-09-15",
        status: "verified",
        shootCount: 56,
        backupStatus: "verified",
        location: "DIT Unit Safe A",
        notes: "IMAX 8K plates - Shambala citadel invasion",
      },
      {
        id: "card-2",
        projectId: "p1",
        cardId: "CFast-P1-002",
        capacity: 512,
        available: 92,
        format: "RAW",
        shootDate: "2026-09-16",
        status: "active",
        shootCount: 42,
        backupStatus: "in-progress",
        location: "Set Cart Unit 1",
        notes: "A-Cam high speed 96fps stunt captures",
      },
      {
        id: "card-3",
        projectId: "p1",
        cardId: "CFast-P1-003",
        capacity: 256,
        available: 120,
        format: "ProRes",
        shootDate: "2026-09-16",
        status: "active",
        shootCount: 28,
        backupStatus: "pending",
        location: "B-Cam Steadicam",
        notes: "Close-up hero coverage",
      },
      {
        id: "card-4",
        projectId: "p2",
        cardId: "CFast-P2-001",
        capacity: 512,
        available: 64,
        format: "RAW",
        shootDate: "2026-09-14",
        status: "verified",
        shootCount: 38,
        backupStatus: "verified",
        location: "Safe Vault B",
        notes: "Police headquarters exterior establishing shots",
      },
      {
        id: "card-5",
        projectId: "p5",
        cardId: "CFast-P5-001",
        capacity: 256,
        available: 30,
        format: "RAW",
        shootDate: "2026-09-15",
        status: "verified",
        shootCount: 50,
        backupStatus: "verified",
        location: "Main Production Vault",
        notes: "Shipyard shootout master takes",
      },
    ],

    storageDevices: [
      {
        id: "stor-1",
        projectId: "p1",
        deviceId: "HDD-P1-01",
        type: "HDD",
        capacity: 16000,
        used: 12400,
        status: "active",
        location: "Edit Suite A",
        content: ["Raw Rushes", "ProRes Proxies", "Sound Stems"],
        lastVerified: "2026-09-15",
        redundancy: true,
        temperature: 37,
      },
      {
        id: "stor-2",
        projectId: "p1",
        deviceId: "SSD-P1-01",
        type: "SSD",
        capacity: 4000,
        used: 2900,
        status: "active",
        location: "Color Grading Suite",
        content: ["ACES Grading Nodes", "DCI P3 Masters", "HDR Passes"],
        lastVerified: "2026-09-15",
        redundancy: true,
        temperature: 34,
      },
      {
        id: "stor-3",
        projectId: "p1",
        deviceId: "NAS-P1-01",
        type: "NAS",
        capacity: 64000,
        used: 48500,
        status: "backup",
        location: "Server Room Rack 3",
        content: ["Full Project Master Archive", "VFX Turnovers", "Daily LTO Pre-staging"],
        lastVerified: "2026-09-14",
        redundancy: true,
      },
      {
        id: "stor-4",
        projectId: "p2",
        deviceId: "SSD-P2-01",
        type: "SSD",
        capacity: 4000,
        used: 1800,
        status: "active",
        location: "Sound Studio 2",
        content: ["Sync Audio Stems", "Foley Masters", "Dialogue Tracks"],
        lastVerified: "2026-09-14",
        redundancy: true,
        temperature: 32,
      },
      {
        id: "stor-5",
        projectId: "p5",
        deviceId: "HDD-P5-01",
        type: "HDD",
        capacity: 12000,
        used: 8600,
        status: "active",
        location: "Post Suite 4",
        content: ["RAW Action Footage", "Editorial Assemblies", "Offline Cuts"],
        lastVerified: "2026-09-13",
        redundancy: true,
        temperature: 36,
      },
    ],

    footageMetadata: [
      {
        id: "ft-1",
        projectId: "p1",
        sceneId: "SC-101",
        takeNumber: 1,
        duration: 180,
        format: "RED R3D",
        resolution: "8K",
        fps: 24,
        codecs: "REDCODE RAW",
        storedOn: ["HDD-P1-01", "NAS-P1-01"],
        status: "synced",
        notes: "Master IMAX take approved by director",
        shootDate: "2026-09-15",
      },
      {
        id: "ft-2",
        projectId: "p1",
        sceneId: "SC-101",
        takeNumber: 2,
        duration: 175,
        format: "RED R3D",
        resolution: "8K",
        fps: 24,
        codecs: "REDCODE RAW",
        storedOn: ["HDD-P1-01"],
        status: "proxies-ready",
        notes: "Alternate angle - camera tracking marker reference",
        shootDate: "2026-09-15",
      },
      {
        id: "ft-3",
        projectId: "p1",
        sceneId: "SC-104",
        takeNumber: 1,
        duration: 240,
        format: "ARRI RAW",
        resolution: "4.5K",
        fps: 48,
        codecs: "ARRIRAW",
        storedOn: ["SSD-P1-01", "NAS-P1-01"],
        status: "synced",
        notes: "High speed vehicle explosion sequence",
        shootDate: "2026-09-16",
      },
      {
        id: "ft-4",
        projectId: "p5",
        sceneId: "SC-001",
        takeNumber: 3,
        duration: 210,
        format: "Sony RAW",
        resolution: "4K",
        fps: 24,
        codecs: "X-OCN",
        storedOn: ["HDD-P5-01"],
        status: "synced",
        notes: "Shipyard intro hero entrance take approved",
        shootDate: "2026-09-15",
      },
    ],

    subtitleLanguages: [
      {
        id: "sub-1",
        projectId: "p1",
        language: "English",
        languageCode: "en",
        nativeName: "English",
        totalLines: 1450,
        completedLines: 1450,
        inProgressLines: 0,
        qcStatus: "approved",
        translator: "David Miller",
        startDate: "2026-08-01",
        deliveryDate: "2026-08-20",
        notes: "Master English subtitle file certified",
        fileSize: "165 KB",
      },
      {
        id: "sub-2",
        projectId: "p1",
        language: "Hindi",
        languageCode: "hi",
        nativeName: "à¤¹à¤¿à¤¨à¥à¤¦à¥€",
        totalLines: 1450,
        completedLines: 1450,
        inProgressLines: 0,
        qcStatus: "approved",
        translator: "Manoj Sharma",
        startDate: "2026-08-05",
        deliveryDate: "2026-09-01",
        notes: "Hindi theatrical adaptation verified and locked",
        fileSize: "172 KB",
      },
      {
        id: "sub-3",
        projectId: "p1",
        language: "Telugu",
        languageCode: "te",
        nativeName: "à°¤à±†à°²à±à°—à±",
        totalLines: 1450,
        completedLines: 1450,
        inProgressLines: 0,
        qcStatus: "approved",
        translator: "Srikanth Rao",
        startDate: "2026-08-05",
        deliveryDate: "2026-09-02",
        notes: "Native Telugu CC & Subtitles finalized",
        fileSize: "180 KB",
      },
      {
        id: "sub-4",
        projectId: "p1",
        language: "Tamil",
        languageCode: "ta",
        nativeName: "à®¤à®®à®¿à®´à¯",
        totalLines: 1450,
        completedLines: 1380,
        inProgressLines: 70,
        qcStatus: "in-progress",
        translator: "K. V. Anand",
        startDate: "2026-08-10",
        deliveryDate: "2026-09-22",
        notes: "Tamil theatrical subtitles in final QC",
        fileSize: "175 KB",
      },
      {
        id: "sub-5",
        projectId: "p1",
        language: "Spanish",
        languageCode: "es",
        nativeName: "EspaÃ±ol",
        totalLines: 1450,
        completedLines: 1200,
        inProgressLines: 250,
        qcStatus: "in-progress",
        translator: "Elena Morales",
        startDate: "2026-08-15",
        deliveryDate: "2026-09-30",
        notes: "Latin American & European Spanish tracks",
        fileSize: "160 KB",
      },
      {
        id: "sub-6",
        projectId: "p5",
        language: "English",
        languageCode: "en",
        nativeName: "English",
        totalLines: 1120,
        completedLines: 1120,
        inProgressLines: 0,
        qcStatus: "approved",
        translator: "John Myers",
        startDate: "2026-08-10",
        deliveryDate: "2026-08-30",
        notes: "Action dialogue sync complete",
        fileSize: "130 KB",
      },
      {
        id: "sub-7",
        projectId: "p5",
        language: "Telugu",
        languageCode: "te",
        nativeName: "à°¤à±†à°²à±à°—à±",
        totalLines: 1120,
        completedLines: 1120,
        inProgressLines: 0,
        qcStatus: "approved",
        translator: "T. Ramana",
        startDate: "2026-08-12",
        deliveryDate: "2026-09-05",
        notes: "Telugu SDH ready",
        fileSize: "142 KB",
      },
    ],
    castCandidates: [],
    castDecisionLog: [],
    artistAvailability: [],
    castContracts: [],
    cateringAdjustments: [],
    preProdChecklist: [],
    richDprReports: [],
    postProdMilestones: [],
    calendarEvents: [],
  };

  data.castCandidates = buildSeedCastCandidates();
  data.castContracts = buildSeedCastContracts();

  enrichDemoCoverage(data);
  return data;
}

function buildSeedPreProdChecklist() { return []; }
function buildSeedRichDprReports() { return []; }

// â”€â”€ Real Telugu star casting pipeline (demo data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildSeedCastCandidates(): CastCandidate[] {
  const now = "2026-10-01T10:00:00.000Z";
  return [
    // â”€â”€ p1: Pushpa 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ch1: Pushpa Raj
    { id: "cnd1",  roleId: "ch1",  projectId: "p1", name: "Allu Arjun",          category: "lead" as const,            agency: "Geetha Arts",           email: "alluarjun@geethaarts.fictitious",      phone: "+91 98400 10001", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Bound from Nov 2026",          status: "selected" as const,          notes: "Star vehicle. Attached from inception. Pushpa franchise lead.",                negotiationNotes: "Deferred + backend rev share agreed.",      linkedCastId: "c1",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd2",  roleId: "ch1",  projectId: "p1", name: "Ram Charan",           category: "lead" as const,            agency: "Mega Artistes Corp",    email: "ramcharan@megaartistes.fictitious",    phone: "+91 98400 10002", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 180000000, availabilityNote: "Initial discussion only",      status: "proposed" as const,          notes: "Considered in early development before Allu Arjun was locked.",               negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd3",  roleId: "ch1",  projectId: "p1", name: "Vijay Deverakonda",    category: "lead" as const,            agency: "King of the Hill",      email: "vijay@koth.fictitious",               phone: "+91 98400 10003", languages: ["Telugu", "Hindi"],             proposedFee: 120000000, availabilityNote: "Not available",               status: "rejected" as const,          notes: "Age profile did not fit the raw labour-class mass-hero arc.",                 negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch2: Srivalli
    { id: "cnd4",  roleId: "ch2",  projectId: "p1", name: "Rashmika Mandanna",    category: "lead" as const,            agency: "Mythri Movie Makers",   email: "rashmika@mythri.fictitious",          phone: "+91 98400 10004", languages: ["Telugu", "Hindi", "Kannada"], proposedFee: 80000000,  availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Franchise heroine. Chemistry with Allu Arjun validated in Part 1.",           negotiationNotes: "Flat fee. No backend. Billing: Solo female lead.",  linkedCastId: "c2",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd5",  roleId: "ch2",  projectId: "p1", name: "Pooja Hegde",          category: "lead" as const,            agency: "People Media Factory",  email: "pooja@pmf.fictitious",                phone: "+91 98400 10005", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 60000000,  availabilityNote: "Was available Q4 2024",        status: "shortlisted" as const,       notes: "Strong chemistry read. Eventually not pursued after Rashmika confirmed.",      negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd6",  roleId: "ch2",  projectId: "p1", name: "Samantha Ruth Prabhu", category: "lead" as const,            agency: "Independent",           email: "samantha@independent.fictitious",     phone: "+91 98400 10006", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 70000000,  availabilityNote: "Health constraints",           status: "rejected" as const,          notes: "Health schedule made continuity impossible for 60+ shoot days.",              negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch3: SP Bhanwar Singh Shekawat
    { id: "cnd7",  roleId: "ch3",  projectId: "p1", name: "Fahadh Faasil",        category: "supporting" as const,      agency: "Fahadh Films",          email: "fahadh@fahadhfilms.fictitious",       phone: "+91 98400 10007", languages: ["Malayalam", "Tamil", "Hindi"], proposedFee: 50000000,  availabilityNote: "Locked for shoot block",       status: "selected" as const,          notes: "Director's first choice for the IPS antagonist arc. Method prep planned.",     negotiationNotes: "Agreed to 20-day Hyderabad shoot window.",  linkedCastId: "c3",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd8",  roleId: "ch3",  projectId: "p1", name: "Vijay Sethupathi",     category: "supporting" as const,      agency: "Passion Studios",       email: "vijaysethu@passion.fictitious",       phone: "+91 98400 10008", languages: ["Tamil", "Telugu", "Hindi"],    proposedFee: 45000000,  availabilityNote: "Under discussion",             status: "under-discussion" as const,  notes: "Considered as backup; directors admired his antagonist range.",               negotiationNotes: "Fee gap remains. Talks paused.",            linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch4: Dhanunjay Varma
    { id: "cnd9",  roleId: "ch4",  projectId: "p1", name: "Jagapathi Babu",       category: "supporting" as const,      agency: "Hyderabad Artists Guild", email: "jagapathi@hag.fictitious",          phone: "+91 98400 10009", languages: ["Telugu"],                      proposedFee: 20000000,  availabilityNote: "Available anytime",            status: "selected" as const,          notes: "Veteran gravitas ideal for the lumber-contractor elder role.",                 negotiationNotes: "Flat fee. 8-day schedule.",                 linkedCastId: "c4",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd10", roleId: "ch4",  projectId: "p1", name: "Prakash Raj",          category: "supporting" as const,      agency: "Independent",           email: "prakashraj@independent.fictitious",   phone: "+91 98400 10010", languages: ["Telugu", "Tamil", "Kannada"],  proposedFee: 18000000,  availabilityNote: "Available from Dec 2026",      status: "proposed" as const,          notes: "Initially proposed; Jagapathi Babu preferred for physicality.",               negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },

    // â”€â”€ p2: Kalki 2898 AD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ch5: Bhairava
    { id: "cnd11", roleId: "ch5",  projectId: "p2", name: "Prabhas",              category: "lead" as const,            agency: "UV Creations",          email: "prabhas@uvcreations.fictitious",      phone: "+91 98400 20001", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 300000000, availabilityNote: "Confirmed from day one",       status: "selected" as const,          notes: "Pan-India star. Kalki is his own franchise. Script built around him.",        negotiationNotes: "Equity participation + deferred bonus.",    linkedCastId: "c5",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd12", roleId: "ch5",  projectId: "p2", name: "Mahesh Babu",          category: "lead" as const,            agency: "G Mahesh Babu Entertainment", email: "mahesh@gmbe.fictitious",        phone: "+91 98400 20002", languages: ["Telugu", "Hindi"],             proposedFee: 250000000, availabilityNote: "Not considered post-Prabhas",  status: "rejected" as const,          notes: "Never formally approached â€” Prabhas was director's sole choice.",              negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd13", roleId: "ch5",  projectId: "p2", name: "Ram Charan",           category: "lead" as const,            agency: "Mega Artistes Corp",    email: "ramcharan@megaartistes.fictitious",   phone: "+91 98400 20003", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Initial brainstorm only",      status: "proposed" as const,          notes: "Name floated in early concept meetings. Not pursued beyond initial discussion.", negotiationNotes: "",                                         linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch6: Ashwatthama
    { id: "cnd14", roleId: "ch6",  projectId: "p2", name: "Amitabh Bachchan",     category: "lead" as const,            agency: "Saraswati Entertainment", email: "bigb@saraswati.fictitious",         phone: "+91 98400 20004", languages: ["Hindi", "Telugu"],             proposedFee: 150000000, availabilityNote: "Dates confirmed for Hyderabad block", status: "selected" as const,    notes: "Immortal warrior arc. Director flew to Mumbai for first narration.",           negotiationNotes: "Special billing: 'And Amitabh Bachchan as Ashwatthama'.",  linkedCastId: "c6",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd15", roleId: "ch6",  projectId: "p2", name: "Mohanlal",             category: "lead" as const,            agency: "Aashirvad Cinemas",     email: "mohanlal@aashirvad.fictitious",       phone: "+91 98400 20005", languages: ["Malayalam", "Tamil", "Hindi"], proposedFee: 100000000, availabilityNote: "Was available 2023",           status: "proposed" as const,          notes: "Proposed in early pre-production. Schedule and language preference led to Amitabh.", negotiationNotes: "",                                     linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch7: Supreme Yaskin
    { id: "cnd16", roleId: "ch7",  projectId: "p2", name: "Kamal Haasan",         category: "lead" as const,            agency: "Raaj Kamal Films",      email: "kamal@raajkamal.fictitious",          phone: "+91 98400 20006", languages: ["Tamil", "Telugu", "Hindi"],    proposedFee: 120000000, availabilityNote: "Special cameo block confirmed", status: "selected" as const,          notes: "Extended cameo building to sequel arc. Director's vision for Supreme Yaskin.", negotiationNotes: "Creative control over costume + dialogue.",linkedCastId: "c7",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd17", roleId: "ch7",  projectId: "p2", name: "Chiranjeevi",          category: "lead" as const,            agency: "Konidela Production",   email: "chiru@konidela.fictitious",           phone: "+91 98400 20007", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 150000000, availabilityNote: "Under consideration",          status: "proposed" as const,          notes: "Discussed as alternate for the supreme villain arc; Kamal confirmed instead.", negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch8: Sumathi
    { id: "cnd18", roleId: "ch8",  projectId: "p2", name: "Deepika Padukone",     category: "lead" as const,            agency: "KA Productions",        email: "deepika@kaproductions.fictitious",    phone: "+91 98400 20008", languages: ["Hindi", "Telugu", "Kannada"], proposedFee: 100000000, availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Central character to the sci-fi mythology. Deepika brings global recognition.", negotiationNotes: "Flat fee. Joint billing with Prabhas.",    linkedCastId: "c16", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd19", roleId: "ch8",  projectId: "p2", name: "Katrina Kaif",         category: "lead" as const,            agency: "Tiger & Katrina Agency", email: "katrina@tka.fictitious",             phone: "+91 98400 20009", languages: ["Hindi", "Telugu"],             proposedFee: 80000000,  availabilityNote: "Was available",               status: "shortlisted" as const,       notes: "Shortlisted before Deepika signed. Strong action portfolio noted.",            negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd20", roleId: "ch8",  projectId: "p2", name: "Mrunal Thakur",        category: "lead" as const,            agency: "Independent",           email: "mrunal@independent.fictitious",       phone: "+91 98400 20010", languages: ["Hindi", "Telugu"],             proposedFee: 40000000,  availabilityNote: "Available",                    status: "proposed" as const,          notes: "Telugu credibility strong (Sita Ramam). Proposed before leads were finalised.", negotiationNotes: "",                                         linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },

    // â”€â”€ p3: Devara â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ch9: Devara / Varadha
    { id: "cnd21", roleId: "ch9",  projectId: "p3", name: "Jr NTR",               category: "lead" as const,            agency: "NTR Arts",              email: "ntr@ntrarts.fictitious",              phone: "+91 98400 30001", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Dual role â€” father and son. Director-star first collaboration.",              negotiationNotes: "Deferred bonus tied to box office slabs.",  linkedCastId: "c8",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd22", roleId: "ch9",  projectId: "p3", name: "Ram Charan",           category: "lead" as const,            agency: "Mega Artistes Corp",    email: "ramcharan@megaartistes.fictitious",   phone: "+91 98400 30002", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 180000000, availabilityNote: "Schedule conflict",            status: "under-discussion" as const,  notes: "Discussed before NTR confirmed; now used for brand visibility benchmarking.", negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch10: Thangam
    { id: "cnd23", roleId: "ch10", projectId: "p3", name: "Janhvi Kapoor",        category: "lead" as const,            agency: "Dharma Productions",    email: "janhvi@dharma.fictitious",            phone: "+91 98400 30003", languages: ["Hindi", "Telugu"],             proposedFee: 50000000,  availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Telugu debut. Screen test chemistry with NTR was exceptional.",               negotiationNotes: "Performance-linked clause for sequel option.",linkedCastId: "c9",  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd24", roleId: "ch10", projectId: "p3", name: "Sai Pallavi",          category: "lead" as const,            agency: "Sai Pallavi Management", email: "saipallavi@mgmt.fictitious",         phone: "+91 98400 30004", languages: ["Telugu", "Tamil", "Malayalam"], proposedFee: 45000000, availabilityNote: "Was available",               status: "shortlisted" as const,       notes: "Strong shortlist. Preferred Janhvi for pan-India OTT optics.",                negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd25", roleId: "ch10", projectId: "p3", name: "Pooja Hegde",          category: "lead" as const,            agency: "People Media Factory",  email: "pooja@pmf.fictitious",                phone: "+91 98400 30005", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 40000000,  availabilityNote: "Not suitable for schedule",   status: "rejected" as const,          notes: "Dates clashed with another commitment; not pursued.",                         negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch11: Bhaira
    { id: "cnd26", roleId: "ch11", projectId: "p3", name: "Saif Ali Khan",        category: "supporting" as const,      agency: "Illuminati Films",      email: "saif@illuminati.fictitious",          phone: "+91 98400 30006", languages: ["Hindi", "Telugu"],             proposedFee: 60000000,  availabilityNote: "Confirmed for Vizag schedule", status: "selected" as const,          notes: "Antagonist arc. Saif's menacing screen presence fits Bhaira precisely.",     negotiationNotes: "Flat fee. NDA on character reveal signed.",  linkedCastId: "c10", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd27", roleId: "ch11", projectId: "p3", name: "Vijay Sethupathi",     category: "supporting" as const,      agency: "Passion Studios",       email: "vijaysethu@passion.fictitious",       phone: "+91 98400 30007", languages: ["Tamil", "Telugu", "Hindi"],    proposedFee: 50000000,  availabilityNote: "Fee mismatch",                 status: "proposed" as const,          notes: "Proposed for heavy antagonist; Saif confirmed after chemistry read.",         negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },

    // â”€â”€ p4: Game Changer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ch12: Ram Nandan IAS
    { id: "cnd28", roleId: "ch12", projectId: "p4", name: "Ram Charan",           category: "lead" as const,            agency: "Mega Artistes Corp",    email: "ramcharan@megaartistes.fictitious",   phone: "+91 98400 40001", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Confirmed â€” LOI signed",       status: "selected" as const,          notes: "IAS hero arc. Ram Charan locked post-RRR wave. Script delivered to star.",   negotiationNotes: "5% equity + deferred.",                     linkedCastId: "c17", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd29", roleId: "ch12", projectId: "p4", name: "Allu Arjun",           category: "lead" as const,            agency: "Geetha Arts",           email: "alluarjun@geethaarts.fictitious",     phone: "+91 98400 40002", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Pushpa 2 conflict",            status: "on-hold" as const,           notes: "On hold â€” Pushpa 2 schedule clash. Will revisit post-shoot if delays arise.", negotiationNotes: "LOI drafted but not signed.",               linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd30", roleId: "ch12", projectId: "p4", name: "Jr NTR",               category: "lead" as const,            agency: "NTR Arts",              email: "ntr@ntrarts.fictitious",              phone: "+91 98400 40003", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Devara schedule conflict",     status: "proposed" as const,          notes: "Name proposed in early brainstorm. Devara commitment ruled out."               , negotiationNotes: "",                                         linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch13: Deepika (female lead)
    { id: "cnd31", roleId: "ch13", projectId: "p4", name: "Kiara Advani",         category: "lead" as const,            agency: "Dharma Productions",    email: "kiara@dharma.fictitious",             phone: "+91 98400 40004", languages: ["Hindi", "Telugu"],             proposedFee: 70000000,  availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Lead heroine. Strong screen presence and pan-India pull.",                    negotiationNotes: "Flat fee. Sequel option clause agreed.",    linkedCastId: "c18", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd32", roleId: "ch13", projectId: "p4", name: "Rashmika Mandanna",    category: "lead" as const,            agency: "Mythri Movie Makers",   email: "rashmika@mythri.fictitious",          phone: "+91 98400 40005", languages: ["Telugu", "Hindi", "Kannada"], proposedFee: 60000000,  availabilityNote: "Pushpa 2 conflict",            status: "shortlisted" as const,       notes: "Shortlisted before Pushpa 2 schedule was confirmed. Strong preference noted.", negotiationNotes: "",                                         linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch14: Minister Satyamoorthy
    { id: "cnd33", roleId: "ch14", projectId: "p4", name: "SJ Suryah",            category: "supporting" as const,      agency: "SJ Productions",        email: "suryah@sjproductions.fictitious",     phone: "+91 98400 40006", languages: ["Tamil", "Telugu"],             proposedFee: 30000000,  availabilityNote: "Confirmed for Chennai + Hyd schedule", status: "selected" as const, notes: "Antagonist minister. Suryah's villain turns have cult following.",            negotiationNotes: "Flat fee + special credit negotiated.",     linkedCastId: "c19", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd34", roleId: "ch14", projectId: "p4", name: "Prakash Raj",          category: "supporting" as const,      agency: "Independent",           email: "prakashraj@independent.fictitious",   phone: "+91 98400 40007", languages: ["Telugu", "Tamil", "Kannada"],  proposedFee: 25000000,  availabilityNote: "Available",                    status: "proposed" as const,          notes: "Proposed for the minister role early on; Suryah preferred for screen energy.", negotiationNotes: "",                                         linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },

    // â”€â”€ p5: OG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ch15: OG
    { id: "cnd35", roleId: "ch15", projectId: "p5", name: "Pawan Kalyan",         category: "lead" as const,            agency: "Pawan Kalyan Creative Works", email: "pk@pkcw.fictitious",             phone: "+91 98400 50001", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Power Star's mass-hero avatar. Script designed exclusively for his persona.",  negotiationNotes: "Equity deal. Shoot windows around political duties.", linkedCastId: "c11", isDemo: true, createdAt: now, updatedAt: now },
    // ch16: Omi Bhau
    { id: "cnd36", roleId: "ch16", projectId: "p5", name: "Emraan Hashmi",        category: "supporting" as const,      agency: "Tips Industries",       email: "emraan@tips.fictitious",              phone: "+91 98400 50002", languages: ["Hindi", "Telugu"],             proposedFee: 50000000,  availabilityNote: "Confirmed for Hyderabad schedule", status: "selected" as const,      notes: "North-Indian villain arc. Pan-India recognition factor tipped decision.",       negotiationNotes: "10-day shoot block. NDA on villain reveal.",linkedCastId: "c12", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd37", roleId: "ch16", projectId: "p5", name: "Vijay Sethupathi",     category: "supporting" as const,      agency: "Passion Studios",       email: "vijaysethu@passion.fictitious",       phone: "+91 98400 50003", languages: ["Tamil", "Telugu", "Hindi"],    proposedFee: 45000000,  availabilityNote: "Conflicting schedule",         status: "shortlisted" as const,       notes: "Strong shortlist. Schedule gap post-Leo freed up briefly; Emraan confirmed.", negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd38", roleId: "ch16", projectId: "p5", name: "Naseeruddin Shah",     category: "supporting" as const,      agency: "Independent",           email: "naseer@independent.fictitious",       phone: "+91 98400 50004", languages: ["Hindi"],                       proposedFee: 30000000,  availabilityNote: "Open to OTT & theatrical",    status: "proposed" as const,          notes: "Veteran menace proposed by writer. Language flexibility was a concern.",       negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch17: Vimala
    { id: "cnd39", roleId: "ch17", projectId: "p5", name: "Priyanka Mohan",       category: "lead" as const,            agency: "Raaj Kamal Films",      email: "priyanka@raajkamal.fictitious",       phone: "+91 98400 50005", languages: ["Telugu", "Tamil"],             proposedFee: 30000000,  availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Heroine of the film. Director hand-picked after OG screen tests.",            negotiationNotes: "Flat fee. Solo female lead billing.",       linkedCastId: "c20", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd40", roleId: "ch17", projectId: "p5", name: "Sreeleela",            category: "lead" as const,            agency: "Gold Star Artists",     email: "sreeleela@goldstar.fictitious",       phone: "+91 98400 50006", languages: ["Telugu", "Tamil", "Hindi"],    proposedFee: 25000000,  availabilityNote: "Pushpa 2 conflict",            status: "shortlisted" as const,       notes: "Dance-first profile appealing; Pushpa 2 shoot block blocked dates.",          negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },

    // â”€â”€ p6: HIT 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ch18: Arjun Sarkaar
    { id: "cnd41", roleId: "ch18", projectId: "p6", name: "Nani",                 category: "lead" as const,            agency: "Wall Poster Cinema",    email: "nani@wallposter.fictitious",          phone: "+91 98400 60001", languages: ["Telugu"],                      proposedFee: 40000000,  availabilityNote: "Confirmed from Mar 2027",      status: "selected" as const,          notes: "HIT 3 lead. Third instalment in the franchise. Tone call done with director.", negotiationNotes: "Flat fee. Poster billing clause added.",   linkedCastId: "c13", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd42", roleId: "ch18", projectId: "p6", name: "Adivi Sesh",           category: "lead" as const,            agency: "People Media Factory",  email: "adivisesh@pmf.fictitious",            phone: "+91 98400 60002", languages: ["Telugu", "Hindi"],             proposedFee: 20000000,  availabilityNote: "Was available",               status: "shortlisted" as const,       notes: "HIT franchise alum (HIT 2). Strongly considered before Nani was locked.",     negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd43", roleId: "ch18", projectId: "p6", name: "Naveen Polishetty",    category: "lead" as const,            agency: "Mythri Movie Makers",   email: "naveen@mythri.fictitious",            phone: "+91 98400 60003", languages: ["Telugu", "English"],           proposedFee: 15000000,  availabilityNote: "Available Q1 2027",            status: "proposed" as const,          notes: "Proposed for fresh-blood approach. Director preferred franchise continuity.", negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch19: Mrudula
    { id: "cnd44", roleId: "ch19", projectId: "p6", name: "Srinidhi Shetty",     category: "lead" as const,            agency: "KGF Productions",       email: "srinidhi@kgfprod.fictitious",         phone: "+91 98400 60004", languages: ["Kannada", "Telugu", "Hindi"],  proposedFee: 20000000,  availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Pan-South heroine. Nani and Srinidhi screen test chemistry was strong.",      negotiationNotes: "Flat fee. Shoot in blocks of 10 days.",     linkedCastId: "c21", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd45", roleId: "ch19", projectId: "p6", name: "Pooja Hegde",          category: "lead" as const,            agency: "People Media Factory",  email: "pooja@pmf.fictitious",                phone: "+91 98400 60005", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 35000000,  availabilityNote: "Date conflict",               status: "shortlisted" as const,       notes: "Shortlisted early. Date clash with another Jan 2027 project.",                negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch20: DGP
    { id: "cnd46", roleId: "ch20", projectId: "p6", name: "Rao Ramesh",           category: "character-artist" as const, agency: "Hyderabad Artists Guild", email: "raoramesh@hag.fictitious",         phone: "+91 98400 60006", languages: ["Telugu"],                      proposedFee: 10000000,  availabilityNote: "Available",                    status: "selected" as const,          notes: "Top character actor for the DGP mentor role. Previous HIT universe alignment.", negotiationNotes: "Flat fee. 5-day schedule.",                linkedCastId: "c22", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd47", roleId: "ch20", projectId: "p6", name: "Prakash Raj",          category: "character-artist" as const, agency: "Independent",           email: "prakashraj@independent.fictitious",  phone: "+91 98400 60007", languages: ["Telugu", "Tamil", "Kannada"],  proposedFee: 12000000,  availabilityNote: "Available",                    status: "proposed" as const,          notes: "Proposed for mentor-cop gravitas. Rao Ramesh preferred for HIT continuity.", negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },

    // â”€â”€ p7: Raja Saab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ch21: Raja Saab
    { id: "cnd48", roleId: "ch21", projectId: "p7", name: "Prabhas",              category: "lead" as const,            agency: "UV Creations",          email: "prabhas@uvcreations.fictitious",      phone: "+91 98400 70001", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 300000000, availabilityNote: "Confirmed post-Kalki window",  status: "selected" as const,          notes: "Horror-comedy genre first for Prabhas. Director spent 3 years on narrations.", negotiationNotes: "Equity + deferred slab deal.",              linkedCastId: "c14", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd49", roleId: "ch21", projectId: "p7", name: "Vijay Deverakonda",    category: "lead" as const,            agency: "King of the Hill",      email: "vijay@koth.fictitious",               phone: "+91 98400 70002", languages: ["Telugu", "Hindi"],             proposedFee: 120000000, availabilityNote: "Available",                    status: "proposed" as const,          notes: "Proposed for younger-skewing take on Raja Saab. Prabhas fit genre better.", negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd50", roleId: "ch21", projectId: "p7", name: "Ram Charan",           category: "lead" as const,            agency: "Mega Artistes Corp",    email: "ramcharan@megaartistes.fictitious",   phone: "+91 98400 70003", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 200000000, availabilityNote: "Game Changer conflict",        status: "under-discussion" as const,  notes: "Discussed for horror-comedy genre stretch. Game Changer timeline ruled out.", negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    // ch22: Ancestral Thakur
    { id: "cnd51", roleId: "ch22", projectId: "p7", name: "Sanjay Dutt",          category: "supporting" as const,      agency: "Sanjay Dutt Productions", email: "sanju@sdproductions.fictitious",    phone: "+91 98400 70004", languages: ["Hindi", "Telugu"],             proposedFee: 80000000,  availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Ancestral villain. Physical screen presence unmatched. Director's first choice.", negotiationNotes: "Flat fee. Top billing after Prabhas.",     linkedCastId: "c15", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd52", roleId: "ch22", projectId: "p7", name: "Mohanlal",             category: "supporting" as const,      agency: "Aashirvad Cinemas",     email: "mohanlal@aashirvad.fictitious",       phone: "+91 98400 70005", languages: ["Malayalam", "Tamil", "Hindi"], proposedFee: 70000000,  availabilityNote: "Was considered",               status: "proposed" as const,          notes: "Proposed for supernatural patriarch; Sanjay Dutt chosen for rugged physicality.", negotiationNotes: "",                                        linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd53", roleId: "ch22", projectId: "p7", name: "Chiranjeevi",          category: "supporting" as const,      agency: "Konidela Production",   email: "chiru@konidela.fictitious",           phone: "+91 98400 70006", languages: ["Telugu", "Hindi", "Tamil"],    proposedFee: 100000000, availabilityNote: "Sentimental preference",       status: "shortlisted" as const,       notes: "Shortlisted as Telugu-grandeur option for the ancestral role.",               negotiationNotes: "Billing above Sanjay Dutt was a sticking point.", linkedCastId: null, isDemo: true, createdAt: now, updatedAt: now },
    // ch23: Maya
    { id: "cnd54", roleId: "ch23", projectId: "p7", name: "Nidhhi Agerwal",       category: "lead" as const,            agency: "Independent",           email: "nidhhi@independent.fictitious",       phone: "+91 98400 70007", languages: ["Telugu", "Hindi"],             proposedFee: 25000000,  availabilityNote: "Confirmed",                    status: "selected" as const,          notes: "Horror-heroine role. Nidhhi's expressive range suited the ghost-girl arc.", negotiationNotes: "Flat fee. Sequel option included.",         linkedCastId: "c23", isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd55", roleId: "ch23", projectId: "p7", name: "Nora Fatehi",          category: "lead" as const,            agency: "NF Talent Agency",      email: "nora@nfta.fictitious",                phone: "+91 98400 70008", languages: ["Hindi", "Telugu"],             proposedFee: 35000000,  availabilityNote: "Availability mismatch",       status: "rejected" as const,          notes: "Proposed for dance-centric ghost sequences. Rejected â€” tonal mismatch.",     negotiationNotes: "",                                          linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
    { id: "cnd56", roleId: "ch23", projectId: "p7", name: "Tara Sutaria",         category: "lead" as const,            agency: "Dharma Productions",    email: "tara@dharma.fictitious",              phone: "+91 98400 70009", languages: ["Hindi", "Telugu"],             proposedFee: 20000000,  availabilityNote: "Available",                    status: "proposed" as const,          notes: "Proposed for ethereal-ghost aesthetic. Nidhhi preferred for Telugu familiarity.", negotiationNotes: "",                                       linkedCastId: null,  isDemo: true, createdAt: now, updatedAt: now },
  ];
}

// â”€â”€ Seed cast contracts (demo data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildSeedCastContracts(): import("./types").CastContract[] {
  return [
    // â”€â”€ p1: Pushpa 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cc1", contractRef: "FLW-2027-001", projectId: "p1", castId: "c1", roleId: "ch1",
      contractStage: "signed", amount: 200000000,
      advance: 50000000,
      startDate: "2025-09-01", endDate: "2026-12-31",
      documentName: null, notes: "Allu Arjun â€” Pushpa Raj lead. Biggest contract in production history.",
      milestones: [
        { id: "ms1",  label: "Signing Advance",    amount: 50000000,  dueDate: "2025-09-05",  status: "paid",     paymentDate: "2025-09-05",  paymentRef: "UTR-PUS-001", notes: "Paid on signing day" },
        { id: "ms2",  label: "Pre-Production",     amount: 40000000,  dueDate: "2025-11-01",  status: "paid",     paymentDate: "2025-10-28",  paymentRef: "UTR-PUS-002", notes: "Released early for costumes & prep" },
        { id: "ms3",  label: "Schedule 1 â€“ Forest",amount: 40000000,  dueDate: "2026-01-15",  status: "paid",     paymentDate: "2026-01-15",  paymentRef: "UTR-PUS-003", notes: "" },
        { id: "ms4",  label: "Schedule 2 â€“ Action",amount: 40000000,  dueDate: "2026-04-15",  status: "paid",     paymentDate: "2026-04-10",  paymentRef: "UTR-PUS-004", notes: "" },
        { id: "ms5",  label: "Post-Production",    amount: 30000000,  dueDate: "2026-09-01",  status: "upcoming", notes: "Final dub + promo shoots" },
      ],
      createdAt: "2025-08-20T10:00:00.000Z", updatedAt: "2026-04-10T10:00:00.000Z",
    },
    {
      id: "cc2", contractRef: "FLW-2027-002", projectId: "p1", castId: "c2", roleId: "ch2",
      contractStage: "signed", amount: 80000000,
      advance: 20000000,
      startDate: "2025-10-01", endDate: "2026-12-31",
      documentName: null, notes: "Rashmika Mandanna â€” Srivalli. Back-to-back Pushpa commitment.",
      milestones: [
        { id: "ms6",  label: "Signing Advance",    amount: 20000000,  dueDate: "2025-10-05",  status: "paid",     paymentDate: "2025-10-05",  paymentRef: "UTR-PUS-010", notes: "" },
        { id: "ms7",  label: "Schedule 1",         amount: 25000000,  dueDate: "2026-02-01",  status: "paid",     paymentDate: "2026-01-30",  paymentRef: "UTR-PUS-011", notes: "" },
        { id: "ms8",  label: "Schedule 2",         amount: 25000000,  dueDate: "2026-06-01",  status: "upcoming", notes: "" },
        { id: "ms9",  label: "Completion",         amount: 10000000,  dueDate: "2026-11-01",  status: "upcoming", notes: "Post-production & dubbing" },
      ],
      createdAt: "2025-09-20T10:00:00.000Z", updatedAt: "2026-01-30T10:00:00.000Z",
    },
    {
      id: "cc3", contractRef: "FLW-2027-003", projectId: "p1", castId: "c3", roleId: "ch3",
      contractStage: "approved", amount: 50000000,
      advance: 12500000,
      startDate: "2026-01-01", endDate: "2026-10-31",
      documentName: null, notes: "Fahadh Faasil â€” Shekhawat IPS. Villain contract, condensed schedule.",
      milestones: [
        { id: "ms10", label: "Signing Advance",    amount: 12500000,  dueDate: "2026-01-05",  status: "paid",     paymentDate: "2026-01-04",  paymentRef: "UTR-PUS-020", notes: "" },
        { id: "ms11", label: "Schedule 1",         amount: 20000000,  dueDate: "2026-04-01",  status: "due",      notes: "Awaiting finance clearance" },
        { id: "ms12", label: "Completion",         amount: 17500000,  dueDate: "2026-09-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-12-15T10:00:00.000Z", updatedAt: "2026-01-04T10:00:00.000Z",
    },
    {
      id: "cc4", contractRef: "FLW-2027-004", projectId: "p1", castId: "c4", roleId: "ch4",
      contractStage: "signed", amount: 20000000,
      advance: 5000000,
      startDate: "2025-11-01", endDate: "2026-08-31",
      documentName: null, notes: "Jagapathi Babu â€” Bhanwar Singh. Character actor flat fee deal.",
      milestones: [
        { id: "ms13", label: "Signing Advance",    amount: 5000000,   dueDate: "2025-11-05",  status: "paid",     paymentDate: "2025-11-05",  paymentRef: "UTR-PUS-030", notes: "" },
        { id: "ms14", label: "Schedule Completion",amount: 10000000,  dueDate: "2026-04-01",  status: "paid",     paymentDate: "2026-03-28",  paymentRef: "UTR-PUS-031", notes: "" },
        { id: "ms15", label: "Final Delivery",     amount: 5000000,   dueDate: "2026-08-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-10-25T10:00:00.000Z", updatedAt: "2026-03-28T10:00:00.000Z",
    },

    // â”€â”€ p2: Kalki 2898 AD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cc5", contractRef: "FLW-2027-005", projectId: "p2", castId: "c5", roleId: "ch5",
      contractStage: "signed", amount: 300000000,
      advance: 75000000,
      startDate: "2025-06-01", endDate: "2027-03-31",
      documentName: null, notes: "Prabhas â€” Bhairava/Kalki. Largest contract in Telugu cinema for 2027.",
      milestones: [
        { id: "ms16", label: "Signing Advance",    amount: 75000000,  dueDate: "2025-06-05",  status: "paid",     paymentDate: "2025-06-05",  paymentRef: "UTR-KAL-001", notes: "" },
        { id: "ms17", label: "Pre-Production",     amount: 50000000,  dueDate: "2025-09-01",  status: "paid",     paymentDate: "2025-08-28",  paymentRef: "UTR-KAL-002", notes: "" },
        { id: "ms18", label: "Schedule 1",         amount: 60000000,  dueDate: "2026-02-01",  status: "paid",     paymentDate: "2026-02-01",  paymentRef: "UTR-KAL-003", notes: "" },
        { id: "ms19", label: "Schedule 2",         amount: 60000000,  dueDate: "2026-08-01",  status: "paid",     paymentDate: "2026-07-25",  paymentRef: "UTR-KAL-004", notes: "" },
        { id: "ms20", label: "Schedule 3",         amount: 55000000,  dueDate: "2027-01-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-05-15T10:00:00.000Z", updatedAt: "2026-07-25T10:00:00.000Z",
    },
    {
      id: "cc6", contractRef: "FLW-2027-006", projectId: "p2", castId: "c6", roleId: "ch6",
      contractStage: "signed", amount: 150000000,
      advance: 40000000,
      startDate: "2025-07-01", endDate: "2026-12-31",
      documentName: null, notes: "Amitabh Bachchan â€” Ashwatthama. Immortal character. Mega cameo contract.",
      milestones: [
        { id: "ms21", label: "Signing Advance",    amount: 40000000,  dueDate: "2025-07-05",  status: "paid",     paymentDate: "2025-07-05",  paymentRef: "UTR-KAL-010", notes: "" },
        { id: "ms22", label: "Principal Shoot",    amount: 60000000,  dueDate: "2025-11-01",  status: "paid",     paymentDate: "2025-10-30",  paymentRef: "UTR-KAL-011", notes: "" },
        { id: "ms23", label: "Re-shoots & VFX",    amount: 50000000,  dueDate: "2026-07-01",  status: "paid",     paymentDate: "2026-06-28",  paymentRef: "UTR-KAL-012", notes: "" },
      ],
      createdAt: "2025-06-20T10:00:00.000Z", updatedAt: "2026-06-28T10:00:00.000Z",
    },
    {
      id: "cc7", contractRef: "FLW-2027-007", projectId: "p2", castId: "c7", roleId: "ch7",
      contractStage: "approved", amount: 120000000,
      advance: 30000000,
      startDate: "2025-08-01", endDate: "2026-10-31",
      documentName: null, notes: "Kamal Haasan â€” Supreme Yaskin antagonist. Complex billing negotiation resolved.",
      milestones: [
        { id: "ms24", label: "Signing Advance",    amount: 30000000,  dueDate: "2025-08-05",  status: "paid",     paymentDate: "2025-08-05",  paymentRef: "UTR-KAL-020", notes: "" },
        { id: "ms25", label: "Shoot Block 1",      amount: 50000000,  dueDate: "2026-01-01",  status: "due",      notes: "Schedule TBD pending Kamal's next film completion" },
        { id: "ms26", label: "Completion",         amount: 40000000,  dueDate: "2026-09-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-07-20T10:00:00.000Z", updatedAt: "2025-08-05T10:00:00.000Z",
    },
    {
      id: "cc8", contractRef: "FLW-2027-008", projectId: "p2", castId: "c16", roleId: "ch8",
      contractStage: "approved", amount: 100000000,
      advance: 25000000,
      startDate: "2025-09-01", endDate: "2026-11-30",
      documentName: null, notes: "Deepika Padukone â€” Sumathi. Pan-India female lead.",
      milestones: [
        { id: "ms27", label: "Signing Advance",    amount: 25000000,  dueDate: "2025-09-05",  status: "paid",     paymentDate: "2025-09-05",  paymentRef: "UTR-KAL-030", notes: "" },
        { id: "ms28", label: "Schedule 1",         amount: 40000000,  dueDate: "2026-02-01",  status: "due",      notes: "Awaiting overseas schedule confirmation" },
        { id: "ms29", label: "Completion",         amount: 35000000,  dueDate: "2026-10-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-08-20T10:00:00.000Z", updatedAt: "2025-09-05T10:00:00.000Z",
    },

    // â”€â”€ p3: Devara â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cc9", contractRef: "FLW-2027-009", projectId: "p3", castId: "c8", roleId: "ch9",
      contractStage: "signed", amount: 200000000,
      advance: 50000000,
      startDate: "2025-08-01", endDate: "2026-09-30",
      documentName: null, notes: "Jr. NTR â€” Devara dual role. Emotional powerhouse performance demanded extra shoot days.",
      milestones: [
        { id: "ms30", label: "Signing Advance",    amount: 50000000,  dueDate: "2025-08-05",  status: "paid",     paymentDate: "2025-08-05",  paymentRef: "UTR-DEV-001", notes: "" },
        { id: "ms31", label: "Schedule 1",         amount: 60000000,  dueDate: "2025-12-01",  status: "paid",     paymentDate: "2025-11-28",  paymentRef: "UTR-DEV-002", notes: "" },
        { id: "ms32", label: "Schedule 2",         amount: 60000000,  dueDate: "2026-04-01",  status: "paid",     paymentDate: "2026-04-01",  paymentRef: "UTR-DEV-003", notes: "" },
        { id: "ms33", label: "Post & Promo",       amount: 30000000,  dueDate: "2026-08-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-07-20T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z",
    },
    {
      id: "cc10", contractRef: "FLW-2027-010", projectId: "p3", castId: "c9", roleId: "ch10",
      contractStage: "approved", amount: 50000000,
      advance: 12000000,
      startDate: "2025-09-01", endDate: "2026-07-31",
      documentName: null, notes: "Janhvi Kapoor â€” Thangam. Significant Telugu debut, talent-fee deal.",
      milestones: [
        { id: "ms34", label: "Signing Advance",    amount: 12000000,  dueDate: "2025-09-05",  status: "paid",     paymentDate: "2025-09-05",  paymentRef: "UTR-DEV-010", notes: "" },
        { id: "ms35", label: "Principal Shoot",    amount: 25000000,  dueDate: "2026-02-01",  status: "due",      notes: "Schedule blocked till NTR dates confirmed" },
        { id: "ms36", label: "Completion",         amount: 13000000,  dueDate: "2026-07-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-08-20T10:00:00.000Z", updatedAt: "2025-09-05T10:00:00.000Z",
    },
    {
      id: "cc11", contractRef: "FLW-2027-011", projectId: "p3", castId: "c10", roleId: "ch11",
      contractStage: "under-review", amount: 60000000,
      advance: 15000000,
      startDate: "2026-01-01", endDate: "2026-09-30",
      documentName: null, notes: "Saif Ali Khan â€” Zafar antagonist. Under legal review â€” billing order dispute.",
      milestones: [
        { id: "ms37", label: "Signing Advance",    amount: 15000000,  dueDate: "2026-01-15",  status: "upcoming", notes: "On hold till contract signed" },
        { id: "ms38", label: "Schedule",           amount: 30000000,  dueDate: "2026-05-01",  status: "upcoming", notes: "" },
        { id: "ms39", label: "Completion",         amount: 15000000,  dueDate: "2026-09-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-11-10T10:00:00.000Z", updatedAt: "2025-12-01T10:00:00.000Z",
    },

    // â”€â”€ p4: Game Changer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cc12", contractRef: "FLW-2027-012", projectId: "p4", castId: "c17", roleId: "ch12",
      contractStage: "signed", amount: 200000000,
      advance: 50000000,
      startDate: "2025-07-01", endDate: "2026-10-31",
      documentName: null, notes: "Ram Charan â€” dual-role political drama lead. Sequel option included.",
      milestones: [
        { id: "ms40", label: "Signing Advance",    amount: 50000000,  dueDate: "2025-07-05",  status: "paid",     paymentDate: "2025-07-05",  paymentRef: "UTR-GC-001", notes: "" },
        { id: "ms41", label: "Schedule 1",         amount: 60000000,  dueDate: "2025-11-01",  status: "paid",     paymentDate: "2025-10-30",  paymentRef: "UTR-GC-002", notes: "" },
        { id: "ms42", label: "Schedule 2",         amount: 60000000,  dueDate: "2026-03-01",  status: "paid",     paymentDate: "2026-02-28",  paymentRef: "UTR-GC-003", notes: "" },
        { id: "ms43", label: "Post & Promo",       amount: 30000000,  dueDate: "2026-09-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-06-20T10:00:00.000Z", updatedAt: "2026-02-28T10:00:00.000Z",
    },
    {
      id: "cc13", contractRef: "FLW-2027-013", projectId: "p4", castId: "c18", roleId: "ch13",
      contractStage: "approved", amount: 70000000,
      advance: 17500000,
      startDate: "2025-09-01", endDate: "2026-09-30",
      documentName: null, notes: "Kiara Advani â€” Deepika Nair political idealist. Strong performance contract.",
      milestones: [
        { id: "ms44", label: "Signing Advance",    amount: 17500000,  dueDate: "2025-09-05",  status: "paid",     paymentDate: "2025-09-05",  paymentRef: "UTR-GC-010", notes: "" },
        { id: "ms45", label: "Principal Shoot",    amount: 35000000,  dueDate: "2026-02-01",  status: "due",      notes: "Pending Ram Charan schedule lock" },
        { id: "ms46", label: "Completion",         amount: 17500000,  dueDate: "2026-08-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-08-20T10:00:00.000Z", updatedAt: "2025-09-05T10:00:00.000Z",
    },
    {
      id: "cc14", contractRef: "FLW-2027-014", projectId: "p4", castId: "c19", roleId: "ch14",
      contractStage: "under-review", amount: 30000000,
      advance: 7500000,
      startDate: "2026-02-01", endDate: "2026-08-31",
      documentName: null, notes: "SJ Suryah â€” antagonist cameo. Tamil-Telugu billing terms under review.",
      milestones: [
        { id: "ms47", label: "Signing Advance",    amount: 7500000,   dueDate: "2026-02-15",  status: "upcoming", notes: "" },
        { id: "ms48", label: "Shoot",              amount: 15000000,  dueDate: "2026-05-01",  status: "upcoming", notes: "" },
        { id: "ms49", label: "Completion",         amount: 7500000,   dueDate: "2026-08-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-12-01T10:00:00.000Z", updatedAt: "2025-12-15T10:00:00.000Z",
    },

    // â”€â”€ p5: OG (Original Ghost) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cc15", contractRef: "FLW-2027-015", projectId: "p5", castId: "c11", roleId: "ch15",
      contractStage: "signed", amount: 200000000,
      advance: 50000000,
      startDate: "2025-10-01", endDate: "2027-01-31",
      documentName: null, notes: "Pawan Kalyan â€” PSPK pan-India action lead. Staggered schedule around political duties.",
      milestones: [
        { id: "ms50", label: "Signing Advance",    amount: 50000000,  dueDate: "2025-10-05",  status: "paid",     paymentDate: "2025-10-05",  paymentRef: "UTR-OG-001", notes: "" },
        { id: "ms51", label: "Schedule 1",         amount: 60000000,  dueDate: "2026-03-01",  status: "paid",     paymentDate: "2026-02-28",  paymentRef: "UTR-OG-002", notes: "" },
        { id: "ms52", label: "Schedule 2",         amount: 60000000,  dueDate: "2026-09-01",  status: "upcoming", notes: "" },
        { id: "ms53", label: "Post & Promo",       amount: 30000000,  dueDate: "2027-01-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-09-15T10:00:00.000Z", updatedAt: "2026-02-28T10:00:00.000Z",
    },
    {
      id: "cc16", contractRef: "FLW-2027-016", projectId: "p5", castId: "c12", roleId: "ch16",
      contractStage: "approved", amount: 50000000,
      advance: 12500000,
      startDate: "2025-11-01", endDate: "2026-10-31",
      documentName: null, notes: "Emraan Hashmi â€” Bollywood antagonist. Hindi-market crossover value.",
      milestones: [
        { id: "ms54", label: "Signing Advance",    amount: 12500000,  dueDate: "2025-11-05",  status: "paid",     paymentDate: "2025-11-05",  paymentRef: "UTR-OG-010", notes: "" },
        { id: "ms55", label: "Shoot Block",        amount: 25000000,  dueDate: "2026-04-01",  status: "due",      notes: "Awaiting dates after Pawan Kalyan schedule 1" },
        { id: "ms56", label: "Completion",         amount: 12500000,  dueDate: "2026-10-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-10-20T10:00:00.000Z", updatedAt: "2025-11-05T10:00:00.000Z",
    },
    {
      id: "cc17", contractRef: "FLW-2027-017", projectId: "p5", castId: "c20", roleId: "ch17",
      contractStage: "under-review", amount: 30000000,
      advance: 7500000,
      startDate: "2026-01-01", endDate: "2026-09-30",
      documentName: null, notes: "Priyanka Chopra Jonas â€” international co-lead. Billing clause under review.",
      milestones: [
        { id: "ms57", label: "Signing Advance",    amount: 7500000,   dueDate: "2026-01-15",  status: "upcoming", notes: "Contract not yet executed" },
        { id: "ms58", label: "Shoot",              amount: 15000000,  dueDate: "2026-05-01",  status: "upcoming", notes: "" },
        { id: "ms59", label: "Completion",         amount: 7500000,   dueDate: "2026-09-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2025-11-20T10:00:00.000Z", updatedAt: "2025-12-01T10:00:00.000Z",
    },

    // â”€â”€ p6: HIT 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cc18", contractRef: "FLW-2027-018", projectId: "p6", castId: "c13", roleId: "ch18",
      contractStage: "draft", amount: 40000000,
      advance: 10000000,
      startDate: "2026-03-01", endDate: "2026-12-31",
      documentName: null, notes: "Nani â€” Arjun Sarkaar HIT-3 lead. Draft finalisation pending schedule lock.",
      milestones: [
        { id: "ms60", label: "Signing Advance",    amount: 10000000,  dueDate: "2026-03-15",  status: "upcoming", notes: "On signing of final contract" },
        { id: "ms61", label: "Schedule 1",         amount: 15000000,  dueDate: "2026-07-01",  status: "upcoming", notes: "" },
        { id: "ms62", label: "Schedule 2",         amount: 10000000,  dueDate: "2026-10-01",  status: "upcoming", notes: "" },
        { id: "ms63", label: "Completion",         amount: 5000000,   dueDate: "2026-12-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2026-01-10T10:00:00.000Z", updatedAt: "2026-01-20T10:00:00.000Z",
    },
    {
      id: "cc19", contractRef: "FLW-2027-019", projectId: "p6", castId: "c21", roleId: "ch19",
      contractStage: "draft", amount: 20000000,
      advance: 5000000,
      startDate: "2026-04-01", endDate: "2026-12-31",
      documentName: null, notes: "Srinidhi Shetty â€” female lead HIT 3. Draft â€” awaiting Nani confirmation.",
      milestones: [
        { id: "ms64", label: "Signing Advance",    amount: 5000000,   dueDate: "2026-04-10",  status: "upcoming", notes: "" },
        { id: "ms65", label: "Principal Shoot",    amount: 10000000,  dueDate: "2026-08-01",  status: "upcoming", notes: "" },
        { id: "ms66", label: "Completion",         amount: 5000000,   dueDate: "2026-12-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2026-01-15T10:00:00.000Z", updatedAt: "2026-01-22T10:00:00.000Z",
    },
    {
      id: "cc20", contractRef: "FLW-2027-020", projectId: "p6", castId: "c22", roleId: "ch20",
      contractStage: "draft", amount: 10000000,
      advance: 2500000,
      startDate: "2026-05-01", endDate: "2026-11-30",
      documentName: null, notes: "Rao Ramesh â€” senior cop. Character contract draft, fast track expected.",
      milestones: [
        { id: "ms67", label: "Signing Advance",    amount: 2500000,   dueDate: "2026-05-05",  status: "upcoming", notes: "" },
        { id: "ms68", label: "Shoot Completion",   amount: 5000000,   dueDate: "2026-09-01",  status: "upcoming", notes: "" },
        { id: "ms69", label: "Final Settlement",   amount: 2500000,   dueDate: "2026-11-15",  status: "upcoming", notes: "" },
      ],
      createdAt: "2026-01-20T10:00:00.000Z", updatedAt: "2026-01-25T10:00:00.000Z",
    },

    // â”€â”€ p7: Raja Saab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cc21", contractRef: "FLW-2027-021", projectId: "p7", castId: "c14", roleId: "ch21",
      contractStage: "under-review", amount: 300000000,
      advance: 75000000,
      startDate: "2026-06-01", endDate: "2027-06-30",
      documentName: null, notes: "Prabhas â€” Raja Saab horror-comedy lead. Equity slab under legal review.",
      milestones: [
        { id: "ms70", label: "Signing Advance",    amount: 75000000,  dueDate: "2026-06-15",  status: "upcoming", notes: "Pending contract execution" },
        { id: "ms71", label: "Pre-Production",     amount: 60000000,  dueDate: "2026-09-01",  status: "upcoming", notes: "" },
        { id: "ms72", label: "Schedule 1",         amount: 80000000,  dueDate: "2027-01-01",  status: "upcoming", notes: "" },
        { id: "ms73", label: "Schedule 2",         amount: 85000000,  dueDate: "2027-05-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2026-02-01T10:00:00.000Z", updatedAt: "2026-03-01T10:00:00.000Z",
    },
    {
      id: "cc22", contractRef: "FLW-2027-022", projectId: "p7", castId: "c15", roleId: "ch22",
      contractStage: "draft", amount: 80000000,
      advance: 20000000,
      startDate: "2026-07-01", endDate: "2027-04-30",
      documentName: null, notes: "Sanjay Dutt â€” Ancestral Thakur. Draft awaiting Prabhas deal closure.",
      milestones: [
        { id: "ms74", label: "Signing Advance",    amount: 20000000,  dueDate: "2026-07-10",  status: "upcoming", notes: "" },
        { id: "ms75", label: "Shoot Block",        amount: 40000000,  dueDate: "2026-11-01",  status: "upcoming", notes: "" },
        { id: "ms76", label: "Completion",         amount: 20000000,  dueDate: "2027-04-01",  status: "upcoming", notes: "" },
      ],
      createdAt: "2026-02-15T10:00:00.000Z", updatedAt: "2026-02-20T10:00:00.000Z",
    },
    {
      id: "cc23", contractRef: "FLW-2027-023", projectId: "p7", castId: "c23", roleId: "ch23",
      contractStage: "draft", amount: 25000000,
      advance: 6000000,
      startDate: "2026-08-01", endDate: "2027-03-31",
      documentName: null, notes: "Nidhhi Agerwal â€” Maya ghost-girl. Draft, sequel option. Fast-tracked post-Prabhas confirmation.",
      milestones: [
        { id: "ms77", label: "Signing Advance",    amount: 6000000,   dueDate: "2026-08-10",  status: "upcoming", notes: "" },
        { id: "ms78", label: "Principal Shoot",    amount: 12000000,  dueDate: "2026-12-01",  status: "upcoming", notes: "" },
        { id: "ms79", label: "Completion",         amount: 7000000,   dueDate: "2027-03-15",  status: "upcoming", notes: "" },
      ],
      createdAt: "2026-02-20T10:00:00.000Z", updatedAt: "2026-02-25T10:00:00.000Z",
    },
  ];
}

