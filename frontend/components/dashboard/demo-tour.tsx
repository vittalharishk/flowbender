"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const tourSteps = [
  { title: "Portfolio command center", description: "Review budgets, risks, upcoming shoot days, and project health.", href: "/dashboard" },
  { title: "Project workspace", description: "Open a project to explore its cast, crew, scripts, scenes, and assets.", href: "/dashboard/projects" },
  { title: "Schedule and call sheets", description: "Follow the 12-week production calendar and publish-ready call sheets.", href: "/dashboard/schedule" },
  { title: "Production and finance", description: "Track daily reports, tasks, equipment, spend, and delivery readiness.", href: "/dashboard/production" },
];

export function DemoTour() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Compass className="h-4 w-4 text-amber-500" />
          Demo tour
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>FlowBender demo tour</DialogTitle>
          <DialogDescription>
            A short route through the most important production workflows.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {tourSteps.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3 rounded-lg border p-3">
              <button
                type="button"
                aria-label={`${completed.includes(index) ? "Mark incomplete" : "Mark complete"}: ${step.title}`}
                onClick={() =>
                  setCompleted((current) =>
                    current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
                  )
                }
                className="mt-0.5 text-muted-foreground hover:text-amber-500"
              >
                <CheckCircle2 className={`h-5 w-5 ${completed.includes(index) ? "fill-amber-500 text-amber-500" : ""}`} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{index + 1}. {step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
              </div>
              <Button asChild size="sm" variant="ghost" className="shrink-0 gap-1">
                <DialogClose asChild>
                  <Link href={step.href}>
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </DialogClose>
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
