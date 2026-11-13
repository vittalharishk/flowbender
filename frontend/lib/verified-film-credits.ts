import type { CastCategory, CastMember, CrewDepartment, CrewMember } from "./types";

export const verifiedProjectTitles: Record<string, string> = {
  p1: "Pushpa 2: The Rule",
  p2: "Kalki 2898 AD",
  p3: "Devara: Part 1",
  p4: "Game Changer",
  p5: "They Call Him OG",
  p6: "HIT: The Third Case",
  p7: "The Raja Saab",
};

export const verifiedCastCredits: Record<string, Array<{ name: string; character: string; category: CastCategory }>> = {
  p1: [
    { name: "Allu Arjun", character: "Pushpa Raj", category: "lead" },
    { name: "Rashmika Mandanna", character: "Srivalli", category: "lead" },
    { name: "Fahadh Faasil", character: "SP Bhanwar Singh Shekhawat", category: "supporting" },
    { name: "Jagapathi Babu", character: "Dhanunjay Varma", category: "supporting" },
  ],
  p2: [
    { name: "Prabhas", character: "Bhairava / Karna", category: "lead" },
    { name: "Amitabh Bachchan", character: "Ashwatthama", category: "lead" },
    { name: "Kamal Haasan", character: "Supreme Yaskin", category: "supporting" },
    { name: "Deepika Padukone", character: "Sumathi", category: "lead" },
  ],
  p3: [
    { name: "N. T. Rama Rao Jr.", character: "Devara / Varadha", category: "lead" },
    { name: "Janhvi Kapoor", character: "Thangam", category: "lead" },
    { name: "Saif Ali Khan", character: "Bhaira", category: "supporting" },
  ],
  p4: [
    { name: "Ram Charan", character: "Ram Nandan IAS / Appanna", category: "lead" },
    { name: "Kiara Advani", character: "Deepika", category: "lead" },
    { name: "S. J. Suryah", character: "Minister M. K. Satyamoorthy", category: "supporting" },
  ],
  p5: [
    { name: "Pawan Kalyan", character: "OG / Ojas Gambheera", category: "lead" },
    { name: "Emraan Hashmi", character: "Omi Bhau", category: "supporting" },
    { name: "Priyanka Mohan", character: "Vimala", category: "supporting" },
  ],
  p6: [
    { name: "Nani", character: "Arjun Sarkaar", category: "lead" },
    { name: "Srinidhi Shetty", character: "Mrudula", category: "lead" },
    { name: "Rao Ramesh", character: "Director General of Police", category: "supporting" },
  ],
  p7: [
    { name: "Prabhas", character: "Raja Saab", category: "lead" },
    { name: "Sanjay Dutt", character: "Ancestral Thakur", category: "supporting" },
    { name: "Nidhhi Agerwal", character: "Maya", category: "lead" },
  ],
};

export const verifiedCrewCredits: Record<string, Array<{ name: string; department: CrewDepartment; role: string }>> = {
  p1: [
    { name: "Sukumar", department: "direction", role: "Director / Writer" },
    { name: "Miroslaw Kuba Brozek", department: "camera", role: "Director of Photography" },
    { name: "Naveen Nooli", department: "editing", role: "Editor" },
    { name: "Devi Sri Prasad", department: "sound", role: "Music Composer" },
    { name: "S. Ramakrishna", department: "art", role: "Production Designer" },
    { name: "Peter Hein", department: "vfx", role: "Action Choreographer" },
  ],
  p2: [
    { name: "Nag Ashwin", department: "direction", role: "Director / Writer" },
    { name: "Djordje Stojiljkovic", department: "camera", role: "Director of Photography" },
    { name: "Kotagiri Venkateswara Rao", department: "editing", role: "Editor" },
    { name: "Santhosh Narayanan", department: "sound", role: "Music Composer" },
    { name: "Nithin Zihani Choudhary", department: "production-design", role: "Production Designer" },
  ],
  p3: [
    { name: "Koratala Siva", department: "direction", role: "Director / Writer" },
    { name: "R. Rathnavelu", department: "camera", role: "Director of Photography" },
    { name: "A. Sreekar Prasad", department: "editing", role: "Editor" },
    { name: "Anirudh Ravichander", department: "sound", role: "Music Composer" },
    { name: "Sabu Cyril", department: "production-design", role: "Production Designer" },
    { name: "Kenny Bates", department: "vfx", role: "Action Director" },
  ],
  p4: [
    { name: "S. Shankar", department: "direction", role: "Director / Writer" },
    { name: "S. Thirunavukarasu", department: "camera", role: "Director of Photography" },
    { name: "Shameer Muhammed", department: "editing", role: "Editor" },
    { name: "Thaman S", department: "sound", role: "Music Composer" },
    { name: "Avinash Kolla", department: "production-design", role: "Production Designer" },
  ],
  p5: [
    { name: "Sujeeth", department: "direction", role: "Director / Writer" },
    { name: "Ravi K. Chandran", department: "camera", role: "Director of Photography" },
    { name: "Naveen Nooli", department: "editing", role: "Editor" },
    { name: "Thaman S", department: "sound", role: "Music Composer" },
    { name: "A. S. Prakash", department: "production-design", role: "Production Designer" },
  ],
  p6: [
    { name: "Sailesh Kolanu", department: "direction", role: "Director / Writer" },
    { name: "Sanu Varghese", department: "camera", role: "Director of Photography" },
    { name: "Karthika Srinivas", department: "editing", role: "Editor" },
    { name: "Mickey J. Meyer", department: "sound", role: "Music Composer" },
  ],
  p7: [
    { name: "Maruthi", department: "direction", role: "Director / Writer" },
    { name: "Karthik Palani", department: "camera", role: "Director of Photography" },
    { name: "Kotagiri Venkateswara Rao", department: "editing", role: "Editor" },
    { name: "Thaman S", department: "sound", role: "Music Composer" },
    { name: "Rajeevan Nambiar", department: "production-design", role: "Art Director" },
  ],
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : name.slice(0, 2)).toUpperCase();
}

export function applyVerifiedCastCredits(members: CastMember[]) {
  const offsets: Record<string, number> = {};
  return members.map((member) => {
    const projectId = member.projectId;
    const credits = verifiedCastCredits[projectId] ?? [];
    const index = offsets[projectId] ?? 0;
    offsets[projectId] = index + 1;
    const credit = credits[index];
    if (!credit) return member;
    return {
      ...member,
      ...credit,
      projectTitle: verifiedProjectTitles[projectId] ?? member.projectTitle,
      characterDescription: `Publicly credited cast member for ${verifiedProjectTitles[projectId]}.`,
      initials: initials(credit.name),
    };
  });
}

export function applyVerifiedCrewCredits(members: CrewMember[]) {
  const offsets: Record<string, number> = {};
  return members.map((member) => {
    const projectId = member.projectId;
    const credits = verifiedCrewCredits[projectId] ?? [];
    const index = offsets[projectId] ?? 0;
    offsets[projectId] = index + 1;
    const credit = credits[index];
    if (!credit) return member;
    return {
      ...member,
      ...credit,
      projectTitle: verifiedProjectTitles[projectId] ?? member.projectTitle,
      notes: `Publicly credited ${credit.role} for ${verifiedProjectTitles[projectId]}.`,
      initials: initials(credit.name),
    };
  });
}

export function ensureGameChangerCredits(castMembers: CastMember[], crewMembers: CrewMember[]) {
  const cast = [...castMembers];
  const crew = [...crewMembers];
  const castTemplate = cast[0];
  if (castTemplate && !cast.some((member) => member.projectId === "p4")) {
    cast.push({
      ...castTemplate,
      id: "c16",
      name: "Ram Charan",
      character: "Ram Nandan / Appanna",
      category: "lead",
      projectId: "p4",
      projectTitle: verifiedProjectTitles.p4,
      initials: initials("Ram Charan"),
      profileImage: null,
    });
  }

  const crewTemplate = crew[0];
  if (crewTemplate && !crew.some((member) => member.projectId === "p4")) {
    crew.push({
      ...crewTemplate,
      id: "cr16",
      name: "S. Shankar",
      department: "direction",
      role: "Director / Writer",
      projectId: "p4",
      projectTitle: verifiedProjectTitles.p4,
      initials: initials("S. Shankar"),
      profileImage: null,
    });
  }
  return { cast, crew };
}

function nextNumericId(items: Array<{ id: string }>, prefix: string) {
  return items.reduce((highest, item) => {
    const match = item.id.match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
}

export function reconcileVerifiedCredits(castMembers: CastMember[], crewMembers: CrewMember[]) {
  const cast = [...castMembers];
  const crew = [...crewMembers];
  const castTemplate = cast[0];
  const crewTemplate = crew[0];
  let nextCast = nextNumericId(cast, "c");
  let nextCrew = nextNumericId(crew, "cr");

  Object.entries(verifiedCastCredits).forEach(([projectId, credits]) => {
    const current = cast.filter((member) => member.projectId === projectId);
    credits.forEach((credit, index) => {
      const existing = current[index];
      if (existing) {
        const targetIndex = cast.findIndex((member) => member.id === existing.id);
        cast[targetIndex] = { ...existing, ...credit, projectTitle: verifiedProjectTitles[projectId], characterDescription: `Publicly credited cast member for ${verifiedProjectTitles[projectId]}.`, initials: initials(credit.name) };
        return;
      }
      if (!castTemplate) return;
      cast.push({ ...castTemplate, ...credit, id: `c${nextCast++}`, projectId, projectTitle: verifiedProjectTitles[projectId], characterDescription: `Publicly credited cast member for ${verifiedProjectTitles[projectId]}.`, initials: initials(credit.name), scenes: [], paymentMilestones: [], profileImage: null });
    });
  });

  Object.entries(verifiedCrewCredits).forEach(([projectId, credits]) => {
    const current = crew.filter((member) => member.projectId === projectId);
    credits.forEach((credit, index) => {
      const existing = current[index];
      if (existing) {
        const targetIndex = crew.findIndex((member) => member.id === existing.id);
        crew[targetIndex] = { ...existing, ...credit, projectTitle: verifiedProjectTitles[projectId], notes: `Publicly credited ${credit.role} for ${verifiedProjectTitles[projectId]}.`, initials: initials(credit.name) };
        return;
      }
      if (!crewTemplate) return;
      crew.push({ ...crewTemplate, ...credit, id: `cr${nextCrew++}`, projectId, projectTitle: verifiedProjectTitles[projectId], notes: `Publicly credited ${credit.role} for ${verifiedProjectTitles[projectId]}.`, profileImage: null });
    });
  });

  return { cast, crew };
}
