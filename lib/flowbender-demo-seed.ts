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
  SeriesEpisode,
  SeriesSeason,
  ShootDay,
  StorageDevice,
  SubtitleLanguage,
  VendorRecord,
  VfxShot,
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
        title: `${project.title} - ${scriptIndex === 1 ? "Production Draft" : "Pickup Scenes"}`,
        type: project.type === "series" ? "OTT Series" : "Feature Film",
        language: project.language,
        genre: project.genre,
        writer: project.director,
        storyBy: project.director,
        screenplayBy: project.director,
        dialoguesBy: project.director,
        scriptCoordinator: projectCrew.find((member) => member.department === "direction")?.name ?? "Production Office",
        draftName: scriptIndex === 1 ? "Production Draft" : "Pickup Scenes",
        draftNumber: `Draft ${scriptIndex + 2}`,
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
    scripts: [],
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
      // p1: Pushpa 2: The Rule (₹500 Cr)
      { id: "b-p1-1", projectId: "p1", category: "Above the Line & Direction", allocated: 1500000000, spent: 1200000000, committed: 1500000000, notes: "Director Sukumar & Allu Arjun lead contracts." },
      { id: "b-p1-2", projectId: "p1", category: "Sets & Jathara Climax Construction", allocated: 900000000, spent: 780000000, committed: 900000000, notes: "Ramoji mega temple fair & Maredumilli forest stages." },
      { id: "b-p1-3", projectId: "p1", category: "Camera, Lenses & High-Speed Rig Units", allocated: 350000000, spent: 290000000, committed: 350000000, notes: "Anand Cine ARRI Alexa 35 & Phantom 4K Flex packages." },
      { id: "b-p1-4", projectId: "p1", category: "Forest Locations, Convoys & Security", allocated: 450000000, spent: 380000000, committed: 450000000, notes: "Seshachalam & Maredumilli permits, 300-truck logistics." },
      { id: "b-p1-5", projectId: "p1", category: "Music, Songs & Live Sound Score", allocated: 300000000, spent: 260000000, committed: 300000000, notes: "Devi Sri Prasad Chennai orchestra & sync audio team." },
      { id: "b-p1-6", projectId: "p1", category: "Post-Production, Color & VFX Reserve", allocated: 500000000, spent: 440000000, committed: 500000000, notes: "Makuta & Annapurna Dolby Atmos final theatrical mix." },
      { id: "b-p1-7", projectId: "p1", category: "Pan-India Marketing, Publicity & Dubbing", allocated: 1000000000, spent: 500000000, committed: 1000000000, notes: "Multi-language trailer launch tours across 6 metropolitan capitals." },

      // p2: Kalki 2898 AD (₹600 Cr)
      { id: "b-p2-1", projectId: "p2", category: "Above the Line & Star Ensemble", allocated: 2100000000, spent: 2100000000, committed: 2100000000, notes: "Nag Ashwin, Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika." },
      { id: "b-p2-2", projectId: "p2", category: "Futuristic Bujji Vehicle & Complex Sets", allocated: 1100000000, spent: 1100000000, committed: 1100000000, notes: "Custom engineered 6-ton AI vehicle & Kasi dystopian sets." },
      { id: "b-p2-3", projectId: "p2", category: "International VFX & CGI Simulation", allocated: 1800000000, spent: 1780000000, committed: 1800000000, notes: "DNEG, The Embassy, Makuta & Lola VFX suites." },
      { id: "b-p2-4", projectId: "p2", category: "Music, Choral Score & Dolby Atmos Mix", allocated: 250000000, spent: 250000000, committed: 250000000, notes: "Santhosh Narayanan European orchestra & Atmos print master." },
      { id: "b-p2-5", projectId: "p2", category: "Animatronics, Tactical Armor & Props", allocated: 350000000, spent: 340000000, committed: 350000000, notes: "Ashwatthama staff, futuristic weaponry & armor plating." },
      { id: "b-p2-6", projectId: "p2", category: "Global IMAX & Comic-Con Marketing", allocated: 400000000, spent: 380000000, committed: 400000000, notes: "San Diego Comic-Con premiere, IMAX DMR & worldwide promos." },

      // p3: Devara: Part 1 (₹300 Cr)
      { id: "b-p3-1", projectId: "p3", category: "Above the Line Direction & Cast", allocated: 1200000000, spent: 1200000000, committed: 1200000000, notes: "Koratala Siva, Jr NTR, Saif Ali Khan, Janhvi Kapoor." },
      { id: "b-p3-2", projectId: "p3", category: "Massive Water Tank & Coastal Set Rigs", allocated: 600000000, spent: 590000000, committed: 600000000, notes: "Ramoji film city ocean tank, underwater stages & sea rigs." },
      { id: "b-p3-3", projectId: "p3", category: "Ocean Stunts & International Action Units", allocated: 400000000, spent: 390000000, committed: 400000000, notes: "Kenny Bates & Peter Hein shark and tide battle units." },
      { id: "b-p3-4", projectId: "p3", category: "Anirudh Ravichander Score & Audio", allocated: 200000000, spent: 200000000, committed: 200000000, notes: "Anirudh sound engineering, 'Fear Song' & multi-stems." },
      { id: "b-p3-5", projectId: "p3", category: "VFX Fluid Dynamics & Sea Simulations", allocated: 350000000, spent: 330000000, committed: 350000000, notes: "High-density ocean waves, stormy skies & digital blood passes." },
      { id: "b-p3-6", projectId: "p3", category: "Pan-India Release DCP & Distribution PR", allocated: 250000000, spent: 210000000, committed: 250000000, notes: "Qube Cinema Pan-India DCP replication & North India campaigns." },

      // p4: Game Changer (₹400 Cr)
      { id: "b-p4-1", projectId: "p4", category: "Above the Line Direction & Lead Cast", allocated: 1600000000, spent: 1500000000, committed: 1600000000, notes: "S. Shankar direction & Ram Charan dual-role contracts." },
      { id: "b-p4-2", projectId: "p4", category: "Grand Song Sets & 1000 Dancers Rigs", allocated: 800000000, spent: 760000000, committed: 800000000, notes: "Shankar signature visual extravaganza songs and costumes." },
      { id: "b-p4-3", projectId: "p4", category: "Political Rally Crowds & Helicopter Logistics", allocated: 450000000, spent: 410000000, committed: 450000000, notes: "Assembly sets, chopper chase & 5,000 background artists." },
      { id: "b-p4-4", projectId: "p4", category: "High-End VFX, Trains & Action CGI", allocated: 600000000, spent: 540000000, committed: 600000000, notes: "Electrifying stadium and railway fight visual extensions." },
      { id: "b-p4-5", projectId: "p4", category: "Thaman S Soundtrack & Orchestra Suites", allocated: 250000000, spent: 220000000, committed: 250000000, notes: "High-energy commercial beats, sync stems and vocal sessions." },
      { id: "b-p4-6", projectId: "p4", category: "Pan-India Release Mastering & Promotions", allocated: 300000000, spent: 220000000, committed: 300000000, notes: "Sri Venkateswara Creations nationwide multi-city promotions." },

      // p5: They Call Him OG (₹250 Cr)
      { id: "b-p5-1", projectId: "p5", category: "Above the Line Direction & Star Cast", allocated: 1100000000, spent: 850000000, committed: 1100000000, notes: "Sujeeth direction & Pawan Kalyan / Emraan Hashmi." },
      { id: "b-p5-2", projectId: "p5", category: "Mumbai Port, Docks & Neo-Noir Sets", allocated: 450000000, spent: 340000000, committed: 450000000, notes: "Japanese mafia dojo & Mumbai container shipping yard sets." },
      { id: "b-p5-3", projectId: "p5", category: "High-Octane Martial Arts & Stunt Rigging", allocated: 350000000, spent: 260000000, committed: 350000000, notes: "Katana swordplay, gun-fu choreography and pyro safety." },
      { id: "b-p5-4", projectId: "p5", category: "Cinematography & ARRI Alexa LF Package", allocated: 200000000, spent: 150000000, committed: 200000000, notes: "Ravi K. Chandran anamorphic low-light glass package." },
      { id: "b-p5-5", projectId: "p5", category: "Thaman S Heavy Bass BGM & Sound Design", allocated: 250000000, spent: 170000000, committed: 250000000, notes: "Cult underworld background score & firearm sound engineering." },
      { id: "b-p5-6", projectId: "p5", category: "Post-Production, Color & Visual Effects", allocated: 150000000, spent: 80000000, committed: 150000000, notes: "Neo-noir high contrast color grading and muzzle flash VFX." },

      // p6: HIT: The Third Case (₹80 Cr)
      { id: "b-p6-1", projectId: "p6", category: "Above the Line Direction & Lead Actor", allocated: 350000000, spent: 90000000, committed: 350000000, notes: "Sailesh Kolanu direction & Nani (Arjun Sarkaar)." },
      { id: "b-p6-2", projectId: "p6", category: "Forensic Lab & Snow Hideout Art Sets", allocated: 120000000, spent: 30000000, committed: 120000000, notes: "High-tech HIT forensic wing & North India snow terrain hideout." },
      { id: "b-p6-3", projectId: "p6", category: "Cinematography & Anamorphic Lenses", allocated: 80000000, spent: 20000000, committed: 80000000, notes: "Sanu Varghese low-key suspense lens package." },
      { id: "b-p6-4", projectId: "p6", category: "Tactical Police Operations & Stunts", allocated: 100000000, spent: 25000000, committed: 100000000, notes: "Highway high-speed pursuit & tactical assault units." },
      { id: "b-p6-5", projectId: "p6", category: "Mickey J. Meyer Suspense Score & Mix", allocated: 70000000, spent: 15000000, committed: 70000000, notes: "Psychological thriller score & tension ambient audio." },
      { id: "b-p6-6", projectId: "p6", category: "Post-Production, Grading & Theatrical Release", allocated: 80000000, spent: 10000000, committed: 80000000, notes: "Prasad Labs cold-tone grade and nationwide DCP distribution." },

      // p7: The Raja Saab (₹200 Cr)
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
      // p1: Pushpa 2: The Rule (Total: ~₹990 Cr across all rights)
      { id: "rd-p1-1", projectId: "p1", territory: "North India Hindi Theatrical", distributor: "AA Films (Anil Thadani)", rightsType: "theatrical", status: "signed", minimumGuarantee: 2000000000, advanceReceived: 1000000000, deliveryStatus: "partial" },
      { id: "rd-p1-2", projectId: "p1", territory: "Nizam (Telangana)", distributor: "Mythri Movie Distribution", rightsType: "theatrical", status: "signed", minimumGuarantee: 1000000000, advanceReceived: 500000000, deliveryStatus: "partial" },
      { id: "rd-p1-3", projectId: "p1", territory: "Ceded (Rayalaseema)", distributor: "Sri Venkateswara / Local Guild", rightsType: "theatrical", status: "signed", minimumGuarantee: 350000000, advanceReceived: 175000000, deliveryStatus: "partial" },
      { id: "rd-p1-4", projectId: "p1", territory: "Andhra (Coastal 6 Territories)", distributor: "Mythri Release Network", rightsType: "theatrical", status: "signed", minimumGuarantee: 850000000, advanceReceived: 425000000, deliveryStatus: "partial" },
      { id: "rd-p1-5", projectId: "p1", territory: "Overseas (USA, UK, Gulf, Aus)", distributor: "Phars Film & Prathyangira Cinemas", rightsType: "theatrical", status: "signed", minimumGuarantee: 1200000000, advanceReceived: 600000000, deliveryStatus: "partial" },
      { id: "rd-p1-6", projectId: "p1", territory: "Worldwide Digital OTT (All Languages)", distributor: "Netflix India", rightsType: "digital", status: "signed", minimumGuarantee: 2750000000, advanceReceived: 1375000000, deliveryStatus: "pending" },
      { id: "rd-p1-7", projectId: "p1", territory: "Satellite Television (Telugu & Hindi)", distributor: "Star Maa / Goldmines", rightsType: "satellite", status: "signed", minimumGuarantee: 800000000, advanceReceived: 400000000, deliveryStatus: "pending" },
      { id: "rd-p1-8", projectId: "p1", territory: "Audio & Music Rights Worldwide", distributor: "T-Series", rightsType: "audio", status: "signed", minimumGuarantee: 650000000, advanceReceived: 650000000, deliveryStatus: "complete" },

      // p2: Kalki 2898 AD (Total: ~₹890 Cr)
      { id: "rd-p2-1", projectId: "p2", territory: "Global Theatrical (All India & Overseas)", distributor: "Vyjayanthi Release & AA Films", rightsType: "theatrical", status: "closed", minimumGuarantee: 3800000000, advanceReceived: 3800000000, deliveryStatus: "complete" },
      { id: "rd-p2-2", projectId: "p2", territory: "Worldwide Digital OTT (Hindi & South)", distributor: "Netflix & Prime Video", rightsType: "digital", status: "closed", minimumGuarantee: 3750000000, advanceReceived: 3750000000, deliveryStatus: "complete" },
      { id: "rd-p2-3", projectId: "p2", territory: "Satellite Television (India)", distributor: "Zee Entertainment Network", rightsType: "satellite", status: "closed", minimumGuarantee: 1000000000, advanceReceived: 1000000000, deliveryStatus: "complete" },
      { id: "rd-p2-4", projectId: "p2", territory: "Audio & Original Score Worldwide", distributor: "Saregama India", rightsType: "audio", status: "closed", minimumGuarantee: 350000000, advanceReceived: 350000000, deliveryStatus: "complete" },

      // p3: Devara: Part 1 (Total: ~₹407 Cr)
      { id: "rd-p3-1", projectId: "p3", territory: "Telugu States Theatrical", distributor: "Sitara / Naga Vamsi", rightsType: "theatrical", status: "closed", minimumGuarantee: 1200000000, advanceReceived: 1200000000, deliveryStatus: "complete" },
      { id: "rd-p3-2", projectId: "p3", territory: "North India Hindi Theatrical", distributor: "Karan Johar / Dharma Productions", rightsType: "theatrical", status: "closed", minimumGuarantee: 500000000, advanceReceived: 500000000, deliveryStatus: "complete" },
      { id: "rd-p3-3", projectId: "p3", territory: "Overseas Theatrical", distributor: "Moksha Movies & Prathyangira", rightsType: "theatrical", status: "closed", minimumGuarantee: 550000000, advanceReceived: 550000000, deliveryStatus: "complete" },
      { id: "rd-p3-4", projectId: "p3", territory: "Worldwide Digital OTT", distributor: "Netflix Worldwide", rightsType: "digital", status: "closed", minimumGuarantee: 1550000000, advanceReceived: 1550000000, deliveryStatus: "complete" },
      { id: "rd-p3-5", projectId: "p3", territory: "Audio & Music Rights", distributor: "T-Series South", rightsType: "audio", status: "closed", minimumGuarantee: 270000000, advanceReceived: 270000000, deliveryStatus: "complete" },

      // p4: Game Changer (Total: ~₹395 Cr)
      { id: "rd-p4-1", projectId: "p4", territory: "Telugu States Theatrical", distributor: "Sri Venkateswara Creations (Dil Raju)", rightsType: "theatrical", status: "signed", minimumGuarantee: 1400000000, advanceReceived: 700000000, deliveryStatus: "partial" },
      { id: "rd-p4-2", projectId: "p4", territory: "North India Hindi Theatrical", distributor: "Zee Studios Theatrical", rightsType: "theatrical", status: "signed", minimumGuarantee: 750000000, advanceReceived: 375000000, deliveryStatus: "partial" },
      { id: "rd-p4-3", projectId: "p4", territory: "Worldwide Digital OTT", distributor: "Amazon Prime Video", rightsType: "digital", status: "signed", minimumGuarantee: 1050000000, advanceReceived: 525000000, deliveryStatus: "pending" },
      { id: "rd-p4-4", projectId: "p4", territory: "Satellite Television Telecast", distributor: "Zee Telugu Network", rightsType: "satellite", status: "signed", minimumGuarantee: 500000000, advanceReceived: 250000000, deliveryStatus: "pending" },
      { id: "rd-p4-5", projectId: "p4", territory: "Audio & Soundtrack Rights", distributor: "Saregama South", rightsType: "audio", status: "signed", minimumGuarantee: 250000000, advanceReceived: 250000000, deliveryStatus: "complete" },

      // p5: They Call Him OG (Total: ~₹240 Cr)
      { id: "rd-p5-1", projectId: "p5", territory: "Nizam & Andhra Theatrical", distributor: "Asian Suresh Entertainment", rightsType: "theatrical", status: "negotiating", minimumGuarantee: 1000000000, advanceReceived: 500000000, deliveryStatus: "pending" },
      { id: "rd-p5-2", projectId: "p5", territory: "Overseas Theatrical", distributor: "Great India Films", rightsType: "theatrical", status: "signed", minimumGuarantee: 300000000, advanceReceived: 150000000, deliveryStatus: "partial" },
      { id: "rd-p5-3", projectId: "p5", territory: "Worldwide Digital OTT", distributor: "Netflix Worldwide", rightsType: "digital", status: "signed", minimumGuarantee: 920000000, advanceReceived: 460000000, deliveryStatus: "pending" },
      { id: "rd-p5-4", projectId: "p5", territory: "Audio & Original Score", distributor: "Sony Music India", rightsType: "audio", status: "signed", minimumGuarantee: 180000000, advanceReceived: 180000000, deliveryStatus: "complete" },

      // p6: HIT: The Third Case (Total: ~₹94 Cr)
      { id: "rd-p6-1", projectId: "p6", territory: "Telugu States Theatrical", distributor: "Wall Poster Cinema / Suresh Release", rightsType: "theatrical", status: "signed", minimumGuarantee: 350000000, advanceReceived: 175000000, deliveryStatus: "pending" },
      { id: "rd-p6-2", projectId: "p6", territory: "Worldwide Digital OTT", distributor: "Amazon Prime Video", rightsType: "digital", status: "signed", minimumGuarantee: 380000000, advanceReceived: 190000000, deliveryStatus: "pending" },
      { id: "rd-p6-3", projectId: "p6", territory: "Satellite & Dubbing Rights", distributor: "Star Network", rightsType: "satellite", status: "negotiating", minimumGuarantee: 160000000, advanceReceived: 80000000, deliveryStatus: "pending" },
      { id: "rd-p6-4", projectId: "p6", territory: "Audio & OST", distributor: "Aditya Music", rightsType: "audio", status: "signed", minimumGuarantee: 50000000, advanceReceived: 50000000, deliveryStatus: "complete" },

      // p7: The Raja Saab (Total: ~₹212 Cr)
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
        nativeName: "हिन्दी",
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
        nativeName: "తెలుగు",
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
        nativeName: "தமிழ்",
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
        nativeName: "Español",
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
        nativeName: "తెలుగు",
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
  };

  enrichDemoCoverage(data);
  return data;
}
