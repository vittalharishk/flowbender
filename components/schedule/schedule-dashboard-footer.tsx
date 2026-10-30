"use client";

import { Flag, Clock, MessageSquare, Circle, CheckCircle2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export function ScheduleDashboardFooter() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Key Milestones */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-foreground">Key Milestones</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium">Script Locked</span>
                </div>
                <span className="text-muted-foreground text-[11px]">15 Jan 2024</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium">Cast Finalized</span>
                </div>
                <span className="text-muted-foreground text-[11px]">10 Feb 2024</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium">First Day of Shoot</span>
                </div>
                <span className="text-muted-foreground text-[11px]">01 Mar 2024</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />
                  <span className="font-medium">Last Day of Shoot</span>
                </div>
                <span className="text-muted-foreground text-[11px]">30 Jun 2024</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">Final Cut Locked</span>
                </div>
                <span className="text-muted-foreground text-[11px]">30 Sep 2024</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">Theatrical Release</span>
                </div>
                <span className="text-muted-foreground text-[11px]">12 Jan 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-foreground">Recent Updates</h3>
          </div>
          <Link href="#" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="space-y-3 text-[13px]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-muted-foreground">Schedule B completed ahead of time.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">2 hours ago</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-muted-foreground">New location added: Vizag Beach.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">5 hours ago</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-muted-foreground">Casting for cameo role confirmed.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">1 day ago</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-muted-foreground">VFX vendor contracted.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">1 day ago</span>
          </div>
        </div>
      </div>

      {/* Team Notes */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-foreground">Team Notes</h3>
          </div>
          <Link href="#" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="space-y-3 text-[13px]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-muted-foreground">Need rain cover arrangement for Vizag schedule.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">3 hours ago</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-muted-foreground">Confirm overseas travel visas.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">8 hours ago</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-muted-foreground">Music sitting scheduled for next week.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">1 day ago</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-muted-foreground">Marketing campaign kickoff on Oct 1.</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
