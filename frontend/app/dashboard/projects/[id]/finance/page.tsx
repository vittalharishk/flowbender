"use client";

import { useParams } from "next/navigation";
import { FinanceWorkspace } from "@/components/finance/finance-workspace";

export default function ProjectFinancePage() {
  const { id } = useParams<{ id: string }>();
  return <FinanceWorkspace key={id} projectId={id} />;
}
