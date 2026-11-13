export interface ProjectOverviewData {
  scenes: {
    total: number;
    completed: number;
    inProgress: number;
  };
  keyPeople: Array<{
    name: string;
    role: string;
    department: string;
    initials: string;
  }>;
  activity: Array<{
    id: string;
    type: "call-sheet" | "schedule" | "cast" | "expense" | "review";
    title: string;
    description: string;
    project: string;
    timestamp: string;
    user: string;
  }>;
  alerts: Array<{
    id: string;
    severity: "warning" | "info" | "critical";
    title: string;
    description: string;
    project: string;
    timestamp: string;
    actionLabel: string;
  }>;
}

export const projectOverviews: Record<string, ProjectOverviewData> = {
  p1: {
    scenes: { total: 160, completed: 142, inProgress: 4 },
    keyPeople: [
      { name: "Sukumar", role: "Director / Writer", department: "Direction", initials: "SK" },
      { name: "Naveen Yerneni", role: "Producer", department: "Production", initials: "NY" },
      { name: "Miroslaw Kuba Brozek", role: "Director of Photography", department: "Camera", initials: "MB" },
      { name: "Devi Sri Prasad", role: "Music Director", department: "Sound", initials: "DSP" },
      { name: "Naveen Nooli", role: "Lead Film Editor", department: "Editing", initials: "NN" },
      { name: "Peter Hein", role: "Action Director", department: "Stunts", initials: "PH" },
    ],
    activity: [
      { id: "pa1", type: "call-sheet", title: "Call Sheet Published", description: "Day 142 Jathara Climax Temple shoot with Pushpa Raj & Shekhawat", project: "Pushpa 2: The Rule", timestamp: "2024-10-14T06:00:00", user: "Sukumar Unit" },
      { id: "pa2", type: "schedule", title: "Seshachalam Forest Night Permit Approved", description: "Forest conservation night convoy clearance locked for 60 trucks", project: "Pushpa 2: The Rule", timestamp: "2024-10-13T18:40:00", user: "Production Legal" },
      { id: "pa3", type: "cast", title: "Allu Arjun Look Continuity Locked", description: "Jathara indigo printed dhoti and sacred vermillion paste continuity verified", project: "Pushpa 2: The Rule", timestamp: "2024-10-12T14:15:00", user: "Sukumar" },
      { id: "pa4", type: "expense", title: "Temple Fair Holy Sindoor Batch Cleared", description: "Organic crimson vermillion and festival pyrotechnics cleared by production", project: "Pushpa 2: The Rule", timestamp: "2024-10-11T11:20:00", user: "Naveen Yerneni" },
    ],
    alerts: [
      { id: "al1", severity: "warning", title: "Jathara Crowd Control Protocol", description: "3,000 festival background artists safety perimeter signed off prior to pyro effects.", project: "Pushpa 2: The Rule", timestamp: "2024-10-14T07:15:00", actionLabel: "Review protocol" },
      { id: "al2", severity: "info", title: "High-Speed Phantom Window", description: "Trident clash 1000fps slow-motion shots scheduled strictly between 19:30 and 21:15.", project: "Pushpa 2: The Rule", timestamp: "2024-10-13T16:30:00", actionLabel: "View schedule" },
    ],
  },
  p2: {
    scenes: { total: 210, completed: 210, inProgress: 0 },
    keyPeople: [
      { name: "Nag Ashwin", role: "Director / Writer", department: "Direction", initials: "NA" },
      { name: "C. Aswani Dutt", role: "Producer", department: "Production", initials: "AD" },
      { name: "Djordje Stojiljkovic", role: "Director of Photography", department: "Camera", initials: "DS" },
      { name: "Santhosh Narayanan", role: "Music Composer", department: "Sound", initials: "SN" },
      { name: "Kotagiri Venkateswara Rao", role: "Lead Editor", department: "Editing", initials: "KR" },
    ],
    activity: [
      { id: "pa5", type: "review", title: "IMAX DMR Theatrical Master Approved", description: "Dual 4K projection laser DMR print signed off at IMAX Tech Lab", project: "Kalki 2898 AD", timestamp: "2024-06-20T20:00:00", user: "Nag Ashwin" },
      { id: "pa6", type: "expense", title: "Bujji AI Supercar Final Ingest", description: "Custom automated engineering and neural telemetry systems delivered to set", project: "Kalki 2898 AD", timestamp: "2024-06-18T12:00:00", user: "Swapna Dutt" },
    ],
    alerts: [
      { id: "al3", severity: "info", title: "Global Premiere Schedule", description: "Worldwide theatrical prints dispatched across 8,500 screens in Dolby Vision & IMAX.", project: "Kalki 2898 AD", timestamp: "2024-06-22T09:00:00", actionLabel: "View log" },
    ],
  },
  p3: {
    scenes: { total: 135, completed: 135, inProgress: 0 },
    keyPeople: [
      { name: "Koratala Siva", role: "Director / Writer", department: "Direction", initials: "KS" },
      { name: "Sudhakar Mikkilineni", role: "Producer", department: "Production", initials: "SM" },
      { name: "R. Rathnavelu", role: "Director of Photography", department: "Camera", initials: "RR" },
      { name: "Anirudh Ravichander", role: "Music Composer", department: "Sound", initials: "AR" },
      { name: "A. Sreekar Prasad", role: "Lead Editor", department: "Editing", initials: "SP" },
      { name: "Sabu Cyril", role: "Production Designer", department: "Art", initials: "SC" },
    ],
    activity: [
      { id: "pa7", type: "review", title: "Red Sea Climax Grade Locked", description: "Dolby Atmos theatrical master certified with Anirudh score stems", project: "Devara: Part 1", timestamp: "2024-09-18T18:00:00", user: "Koratala Siva" },
      { id: "pa8", type: "expense", title: "Underwater Ocean Tank Stunt Settlement", description: "Ramoji deep-tank hydrodynamic rig payments cleared for stunt department", project: "Devara: Part 1", timestamp: "2024-09-15T15:30:00", user: "Sudhakar Mikkilineni" },
    ],
    alerts: [
      { id: "al4", severity: "info", title: "CBFC Censor Certificate Issued", description: "U/A censor clearance approved with zero visual cuts across all territories.", project: "Devara: Part 1", timestamp: "2024-09-20T10:00:00", actionLabel: "Review files" },
    ],
  },
  p4: {
    scenes: { total: 170, completed: 168, inProgress: 2 },
    keyPeople: [
      { name: "S. Shankar", role: "Director / Writer", department: "Direction", initials: "SS" },
      { name: "Dil Raju", role: "Producer", department: "Production", initials: "DR" },
      { name: "S. Thirunavukarasu", role: "Director of Photography", department: "Camera", initials: "ST" },
      { name: "Thaman S", role: "Music Composer", department: "Sound", initials: "TS" },
      { name: "Shameer Muhammed", role: "Lead Editor", department: "Editing", initials: "SM" },
    ],
    activity: [
      { id: "pa9", type: "review", title: "Election Climax Crowd VFX Delivered", description: "100,000 voter stadium simulation composite locked by Pixel Adda", project: "Game Changer", timestamp: "2024-11-20T16:00:00", user: "S. Shankar" },
    ],
    alerts: [
      { id: "al5", severity: "info", title: "Helicopter Action Clearance", description: "Aviation authority clearance signed for low-altitude aerial sequence.", project: "Game Changer", timestamp: "2024-11-22T11:00:00", actionLabel: "View clearance" },
    ],
  },
  p5: {
    scenes: { total: 110, completed: 82, inProgress: 5 },
    keyPeople: [
      { name: "Sujeeth", role: "Director / Writer", department: "Direction", initials: "SJ" },
      { name: "D. V. V. Danayya", role: "Producer", department: "Production", initials: "DD" },
      { name: "Ravi K. Chandran", role: "Director of Photography", department: "Camera", initials: "RC" },
      { name: "Thaman S", role: "Music Composer", department: "Sound", initials: "TS" },
      { name: "Naveen Nooli", role: "Lead Editor", department: "Editing", initials: "NN" },
    ],
    activity: [
      { id: "pa10", type: "call-sheet", title: "Mumbai Docks Night Shoot Call Sheet", description: "Pawan Kalyan Katana action sequence at container terminal 4", project: "They Call Him OG", timestamp: "2024-11-04T19:00:00", user: "Sujeeth" },
    ],
    alerts: [
      { id: "al6", severity: "warning", title: "Docks Pyro Hazard Check", description: "Industrial harbor fire clearance certified by Mumbai Port Trust safety division.", project: "They Call Him OG", timestamp: "2024-11-04T17:00:00", actionLabel: "Check safety" },
    ],
  },
  p6: {
    scenes: { total: 75, completed: 16, inProgress: 2 },
    keyPeople: [
      { name: "Sailesh Kolanu", role: "Director / Writer", department: "Direction", initials: "SK" },
      { name: "Prashanti Tipirneni", role: "Producer", department: "Production", initials: "PT" },
      { name: "Sanu Varghese", role: "Director of Photography", department: "Camera", initials: "SV" },
      { name: "Mickey J. Meyer", role: "Music Composer", department: "Sound", initials: "MM" },
      { name: "Karthika Srinivas", role: "Lead Editor", department: "Editing", initials: "KS" },
    ],
    activity: [
      { id: "pa11", type: "review", title: "Arjun Sarkaar First Teaser Cut", description: "Nani intense interrogation teaser audio stings locked for title launch", project: "HIT: The Third Case", timestamp: "2024-09-12T14:00:00", user: "Sailesh Kolanu" },
    ],
    alerts: [],
  },
  p7: {
    scenes: { total: 120, completed: 110, inProgress: 2 },
    keyPeople: [
      { name: "Maruthi", role: "Director / Writer", department: "Direction", initials: "MR" },
      { name: "T. G. Vishwa Prasad", role: "Producer", department: "Production", initials: "VP" },
      { name: "Karthik Palani", role: "Director of Photography", department: "Camera", initials: "KP" },
      { name: "Thaman S", role: "Music Composer", department: "Sound", initials: "TS" },
      { name: "Kotagiri Venkateswara Rao", role: "Lead Editor", department: "Editing", initials: "KR" },
    ],
    activity: [
      { id: "pa12", type: "expense", title: "Palace Ghost Previz Render Approved", description: "Supernatural floating chandelier sequence simulation approved by director", project: "The Raja Saab", timestamp: "2024-11-15T17:00:00", user: "T. G. Vishwa Prasad" },
    ],
    alerts: [],
  },
};

const defaultOverview: ProjectOverviewData = {
  scenes: { total: 50, completed: 30, inProgress: 2 },
  keyPeople: [
    { name: "Director", role: "Director", department: "Direction", initials: "DR" },
    { name: "Producer", role: "Producer", department: "Production", initials: "PR" },
  ],
  activity: [],
  alerts: [],
};

export function getProjectOverviewData(projectId: string): ProjectOverviewData {
  return projectOverviews[projectId] ?? defaultOverview;
}
