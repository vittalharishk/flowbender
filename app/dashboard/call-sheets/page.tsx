"use client";

import { CallSheetWorkspace } from "@/components/call-sheets/call-sheet-workspace";

export default function CallSheetsPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Call Sheets</h1>
        <p className="text-sm text-muted-foreground mt-1">Production call sheets across all projects</p>
      </div>
      <CallSheetWorkspace />
    </div>
  );
}
