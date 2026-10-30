"use client";

import Link from "next/link";
import { Clock, MapPin, Users, Sparkles, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scene } from "@/lib/types";
import { sceneStatusLabels, sceneStatusColors, sceneStatusDot } from "@/lib/scene-store";

interface Props {
  scene: Scene;
  projectScope?: boolean;
  basePath: string;
}

const intExtColors: Record<string, string> = {
  INT: "bg-sky-500/15 text-sky-400",
  EXT: "bg-amber-500/15 text-amber-400",
  "INT/EXT": "bg-cyan-500/15 text-cyan-400",
};

const todColors: Record<string, string> = {
  DAY: "bg-yellow-500/15 text-yellow-400",
  NIGHT: "bg-indigo-500/15 text-indigo-300",
  DAWN: "bg-orange-500/15 text-orange-400",
  DUSK: "bg-rose-500/15 text-rose-400",
  CONTINUOUS: "bg-zinc-500/15 text-zinc-400",
  "MAGIC HOUR": "bg-pink-500/15 text-pink-400",
};

export function SceneStrip({ scene, projectScope, basePath }: Props) {
  const href = `${basePath}/${scene.id}`;
  const totalBreakdown = scene.props.length + scene.costumes.length + scene.vehicles.length + scene.specialRequirements.length;

  return (
    <Link href={href} className="group block">
      <div className="flex items-stretch border rounded-lg hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/5 bg-card overflow-hidden">
        {/* Left color strip */}
        <div className={cn("w-1.5 shrink-0", sceneStatusDot[scene.status])} />

        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            {/* Scene number */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold text-foreground group-hover:text-amber-400 transition-colors">
                {scene.sceneNumber}
              </span>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", intExtColors[scene.intExt])}>
                {scene.intExt}
              </span>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", todColors[scene.timeOfDay])}>
                {scene.timeOfDay}
              </span>
            </div>

            {/* Heading & details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{scene.heading}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {scene.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {scene.characters.length} character{scene.characters.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {scene.estimatedDuration}
                </span>
                <span className="flex items-center gap-1">
                  <Film className="w-3 h-3" /> {scene.pages} pg{scene.pages !== 1 ? "s" : ""}
                </span>
                {scene.vfxRequired && (
                  <span className="flex items-center gap-1 text-violet-400">
                    <Sparkles className="w-3 h-3" /> VFX
                  </span>
                )}
              </div>
            </div>

            {/* Status + shoot info */}
            <div className="flex items-center gap-2 shrink-0 self-start">
              {scene.shootDate && (
                <span className="text-[11px] text-muted-foreground hidden md:block">
                  Day {scene.shootDay}
                </span>
              )}
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", sceneStatusColors[scene.status])}>
                {sceneStatusLabels[scene.status]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
