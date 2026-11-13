"use client";

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function exportToCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  options: { filename: string; title?: string; filters?: string; }
): void {
  const lines: string[] = [];

  if (options.title) lines.push(escapeRow([options.title]));
  lines.push(escapeRow([`Generated: ${new Date().toLocaleString()}`]));
  if (options.filters) lines.push(escapeRow([`Filters: ${options.filters}`]));
  if (options.title || options.filters) lines.push("");

  lines.push(escapeRow(columns.map((c) => c.header)));

  for (const row of rows) {
    lines.push(escapeRow(columns.map((c) => {
      const val = c.accessor(row);
      return val == null ? "" : String(val);
    })));
  }

  const csv = lines.join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${options.filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeRow(cells: string[]): string {
  return cells.map((c) => {
    const s = String(c);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(",");
}

export function formatFilterContext(filters: {
  projectId?: string;
  projectName?: string;
  dateFrom?: string;
  dateTo?: string;
  department?: string;
  status?: string;
}): string {
  const parts: string[] = [];
  if (filters.projectName && filters.projectName !== "All projects") parts.push(`Project: ${filters.projectName}`);
  if (filters.dateFrom) parts.push(`From: ${filters.dateFrom}`);
  if (filters.dateTo) parts.push(`To: ${filters.dateTo}`);
  if (filters.department && filters.department !== "all") parts.push(`Department: ${filters.department}`);
  if (filters.status && filters.status !== "all") parts.push(`Status: ${filters.status}`);
  return parts.length > 0 ? parts.join(" | ") : "No filters applied";
}
