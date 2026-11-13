"use client";

import Link from "next/link";
import { useProjects } from "@/lib/project-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BusinessProjectPicker({ module, title }: { module: "finance" | "post-production" | "distribution"; title: string }) {
  const projects = useProjects();
  return <div className="mx-auto max-w-5xl space-y-5">
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-sm text-muted-foreground">Choose a project to view and update its records. Seeded business records are fictional demo data; no payments or deliveries are sent.</p>
    <div className="grid gap-3 sm:grid-cols-2">{projects.map((project) => <Link key={project.id} href={`/dashboard/projects/${project.id}/${module}`} className="min-w-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary"><Card className="h-full hover:border-primary"><CardContent className="space-y-2 p-5"><h2 className="break-words font-semibold">{project.title}</h2><Badge variant="outline">{project.status}</Badge></CardContent></Card></Link>)}</div>
    {!projects.length && <p>No projects yet. <Link href="/dashboard/projects" className="text-primary underline">Create a project</Link> to get started.</p>}
  </div>;
}
