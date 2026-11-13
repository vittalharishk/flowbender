// ─── Event Calendar ────────────────────────────────────────────────────────

export type CalendarEventType =
  | "shoot"
  | "cast-meeting"
  | "crew-meeting"
  | "audition"
  | "rehearsal"
  | "table-read"
  | "location-scouting"
  | "pre-prod-deadline"
  | "post-prod-deadline"
  | "dubbing"
  | "delivery"
  | "other";

export type CalendarEventStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "postponed";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  projectId?: string;
  projectTitle?: string;
  location?: string;
  department?: string;
  description?: string;
  participants?: string[];
  notes?: string;
  status: CalendarEventStatus;
  linkedShootDayId?: string;
  linkedCallSheetId?: string;
  linkedTaskId?: string;
  linkedPostProdId?: string;
  linkedDprId?: string;
  createdBy?: string;
  createdAt: string;
}
