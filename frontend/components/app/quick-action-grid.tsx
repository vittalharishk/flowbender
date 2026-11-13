"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, ClipboardList, MapPin, ReceiptIndianRupee, Users, Video, Clapperboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DigitalClapperboardModal } from "@/components/production/digital-clapperboard-modal";
import { useProject } from "@/lib/project-store";

const actions = [
  { label: "Call sheets", href: "/call-sheets", segment: "call-sheets", icon: ClipboardList },
  { label: "Shoot schedule", href: "/dashboard/schedule", segment: "schedule", icon: CalendarPlus },
  { label: "Finance and expenses", href: "/dashboard/finance", segment: "finance", icon: ReceiptIndianRupee },
  { label: "Cast directory", href: "/dashboard/cast", segment: "cast", icon: Users },
  { label: "Locations", href: "/dashboard/locations", segment: "locations", icon: MapPin },
  { label: "Crew directory", href: "/dashboard/crew", segment: "crew", icon: Video },
];

export function QuickActionGrid({ projectId }: { projectId?: string }) {
  const [slateOpen, setSlateOpen] = useState(false);
  const project = useProject(projectId || "");

  const scopedActions = projectId
    ? actions.map((action) => ({
        ...action,
        href: `/dashboard/projects/${projectId}/${action.segment}`,
      }))
    : actions;

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Quick actions</CardTitle>
            <p className="text-xs text-muted-foreground">Open the task you need without searching.</p>
          </div>
          <button
            type="button"
            onClick={() => setSlateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500 hover:bg-amber-500/20 transition-all shadow-sm cursor-pointer"
          >
            <Clapperboard className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Launch Slate</span>
          </button>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {scopedActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-xl border bg-muted/20 p-3 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-105">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <DigitalClapperboardModal
        open={slateOpen}
        onOpenChange={setSlateOpen}
        defaultProjectId={projectId}
        defaultProjectTitle={project?.title}
        defaultDirector={project?.director}
      />
    </>
  );
}
