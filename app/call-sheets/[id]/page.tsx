"use client";

import { useParams } from "next/navigation";
import { CallSheetWorkspace } from "@/components/call-sheets/call-sheet-workspace";

export default function CallSheetDetailPage() {
  const params = useParams();
  return <CallSheetWorkspace detailId={params.id as string} />;
}
