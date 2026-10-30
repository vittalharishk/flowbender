"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { createScript, useScripts } from "@/lib/script-store";
import { useProject } from "@/lib/project-store";
import { Button } from "@/components/ui/button";
import ScriptEditor from "@/components/scripts/script-editor";

export default function ProjectScriptPage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = useProject(projectId);
  const scripts = useScripts().filter((item) => item.projectId === projectId && !item.archived && item.status !== "Archived");
  const [selectedId, setSelectedId] = useState("");
  const script = scripts.find((item) => item.id === selectedId) ?? scripts[0];

  function create() {
    if (!project) return;
    const created = createScript({ projectId, title: `${project.title} — First Draft`, type: project.type === "series" ? "OTT Series" : project.type === "short-film" ? "Short Film" : project.type === "music-video" ? "Music Video" : project.type === "commercial" ? "Other" : "Feature Film", language: project.language || "English" });
    setSelectedId(created.id);
  }

  if (!script) {
    return <div className="space-y-3 rounded-xl border bg-card p-6"><p className="text-sm text-muted-foreground">No active script is linked to this project.</p><Button disabled={!project} onClick={create}>Create project script</Button></div>;
  }

  return <div className="space-y-4">{scripts.length > 1 && <label className="flex items-center gap-3 text-sm">Active script<select className="rounded border bg-background p-2" value={script.id} onChange={(event) => setSelectedId(event.target.value)}>{scripts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}<ScriptEditor scriptId={script.id} embeddedProjectId={projectId} /></div>;
}
