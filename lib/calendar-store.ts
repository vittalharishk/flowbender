"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { CalendarEvent, CalendarEventStatus } from "@/lib/types";

export function useCalendarEvents(projectId?: string): CalendarEvent[] {
  const events = useAppDataSlice("calendarEvents") ?? [];
  return projectId ? events.filter(e => !e.projectId || e.projectId === projectId) : events;
}

export function addCalendarEvent(event: Omit<CalendarEvent, "id" | "createdAt">): CalendarEvent {
  const newEvent: CalendarEvent = {
    ...event,
    id: `evt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  updateAppDataSlice("calendarEvents", events => [...events, newEvent]);
  return newEvent;
}

export function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>) {
  updateAppDataSlice("calendarEvents", events =>
    events.map(e => e.id === id ? { ...e, ...updates } : e)
  );
}

export function cancelCalendarEvent(id: string) {
  updateAppDataSlice("calendarEvents", events =>
    events.map(e => e.id === id ? { ...e, status: "cancelled" as CalendarEventStatus } : e)
  );
}

export function deleteCalendarEvent(id: string) {
  updateAppDataSlice("calendarEvents", events => events.filter(e => e.id !== id));
}
