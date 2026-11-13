"use client";

import { useParams } from "next/navigation";
import { CallSheetWorkspace } from "@/components/call-sheets/call-sheet-workspace";

export default function ProjectCallSheetsPage() {
  const params = useParams();
  return <CallSheetWorkspace projectId={params.id as string} />;
}
