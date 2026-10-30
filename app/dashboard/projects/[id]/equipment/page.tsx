"use client";

import { useParams } from "next/navigation";
import { EquipmentWorkspace } from "@/components/equipment/equipment-workspace";

export default function ProjectEquipmentPage() {
  const { id } = useParams<{ id: string }>();
  return <EquipmentWorkspace key={id} projectId={id} />;
}
