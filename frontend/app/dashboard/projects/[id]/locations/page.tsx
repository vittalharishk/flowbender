"use client";

import { useParams } from "next/navigation";
import { LocationsManagementWorkspace } from "@/components/locations/locations-management-workspace";

export default function ProjectLocationsPage() {
  const { id } = useParams<{ id: string }>();
  return <LocationsManagementWorkspace key={id} projectId={id} />;
}
