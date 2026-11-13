"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, Layers, Send } from "lucide-react";
import { toast } from "sonner";
import type { VfxShot } from "@/lib/types";
import { submitVfxVersion, reviewVfxVersion, useVfxVersions, useVfxReviews } from "@/lib/vfx-store";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vfxPriorityTones, vfxStatusLabels, vfxStatusTones, vfxVersionTones, isOverdue } from "./vfx-status";

interface VfxShotDetailDialogProps {
  shot: VfxShot | null;
  projectTitle?: string;
  onClose: () => void;
  onEdit: (shot: VfxShot) => void;
}

export function VfxShotDetailDialog({ shot, projectTitle, onClose, onEdit }: VfxShotDetailDialogProps) {
  return (
    <Dialog open={!!shot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {shot && <DetailBody shot={shot} projectTitle={projectTitle} onEdit={onEdit} />}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({
  shot,
  projectTitle,
  onEdit,
}: {
  shot: VfxShot;
  projectTitle?: string;
  onEdit: (shot: VfxShot) => void;
}) {
  const versions = useVfxVersions(shot.id);
  const reviews = useVfxReviews(shot.id);
  const [assetReference, setAssetReference] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewComments, setReviewComments] = useState("");

  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const reviewable = sorted.find((v) => v.status === "submitted" || v.status === "in-review");
  const overdue = isOverdue(shot.dueDate, shot.status);

  function handleSubmitVersion(event: React.FormEvent) {
    event.preventDefault();
    const result = submitVfxVersion(shot.id, {
      assetReference: assetReference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (result.success) {
      toast.success(`Version v${result.version.versionNumber} submitted for ${shot.shotCode}.`);
      setAssetReference("");
      setNotes("");
    } else {
      toast.error(result.error);
    }
  }

  function handleReview(decision: "approved" | "rejected" | "revision-required") {
    if (!reviewable) return;
    const result = reviewVfxVersion(reviewable.id, decision, undefined, reviewComments.trim() || undefined);
    if (result.success) {
      toast.success(`Version v${reviewable.versionNumber} marked ${decision.replace(/-/g, " ")}.`);
      setReviewComments("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {shot.shotCode}
          <StatusBadge status={shot.status} tone={vfxStatusTones[shot.status]} label={vfxStatusLabels[shot.status]} />
          <StatusBadge status={shot.priority} tone={vfxPriorityTones[shot.priority]} label={`${shot.priority} priority`} />
          {overdue && <StatusBadge status="overdue" tone="error" label="Overdue" />}
        </DialogTitle>
        <DialogDescription>
          {shot.sequence}
          {projectTitle ? ` · ${projectTitle}` : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <p className="text-sm">{shot.description}</p>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Due date</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {shot.dueDate}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Vendor</dt>
            <dd className="mt-0.5 truncate font-medium">{shot.vendorId || "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Versions</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{versions.length}</dd>
          </div>
        </dl>

        {overdue && (
          <p className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This shot passed its due date and is not yet final.
          </p>
        )}

        <Tabs defaultValue="versions">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
            <TabsTrigger value="reviews">Review history ({reviews.length})</TabsTrigger>
            <TabsTrigger value="submit">Submit version</TabsTrigger>
          </TabsList>

          <TabsContent value="versions" className="mt-3">
            {sorted.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No versions submitted"
                description="Submit the first vendor turnover from the Submit version tab."
                className="py-8"
              />
            ) : (
              <ul className="space-y-2">
                {sorted.map((version) => (
                  <li key={version.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">v{version.versionNumber}</span>
                      <StatusBadge
                        status={version.status}
                        tone={vfxVersionTones[version.status] ?? "neutral"}
                        label={version.status.replace(/-/g, " ")}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {new Date(version.submittedAt).toLocaleString()}
                      {version.submittedBy ? ` by ${version.submittedBy}` : ""}
                    </p>
                    {version.assetReference && (
                      <p className="mt-1 break-all text-xs">Asset: {version.assetReference}</p>
                    )}
                    {version.notes && <p className="mt-1 text-sm">{version.notes}</p>}
                    {version.reviewNotes && (
                      <p className="mt-1 text-xs text-muted-foreground">Review note: {version.reviewNotes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {reviewable && (
              <div className="mt-4 space-y-2 rounded-lg border p-3">
                <Label htmlFor="vfx-review-comments" className="text-sm font-semibold">
                  Review v{reviewable.versionNumber}
                </Label>
                <Textarea
                  id="vfx-review-comments"
                  rows={2}
                  placeholder="Optional reviewer comments"
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" onClick={() => handleReview("approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReview("revision-required")}>
                    Request revision
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReview("rejected")}>
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-3">
            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" description="Reviews appear once a submitted version is actioned." className="py-8" />
            ) : (
              <ul className="space-y-2">
                {[...reviews]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((review) => (
                    <li key={review.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusBadge
                          status={review.decision}
                          tone={vfxVersionTones[review.decision] ?? "neutral"}
                          label={review.decision.replace(/-/g, " ")}
                        />
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {review.comments && <p className="mt-1">{review.comments}</p>}
                      {review.reviewerRole && (
                        <p className="mt-1 text-xs text-muted-foreground">{review.reviewerRole}</p>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="submit" className="mt-3">
            <form onSubmit={handleSubmitVersion} className="space-y-3">
              <div>
                <Label htmlFor="vfx-asset-ref">Asset reference</Label>
                <Input
                  id="vfx-asset-ref"
                  className="mt-1"
                  placeholder="e.g. /turnovers/VFX-042_v003.mov"
                  value={assetReference}
                  onChange={(e) => setAssetReference(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vfx-version-notes">Submission notes</Label>
                <Textarea
                  id="vfx-version-notes"
                  className="mt-1"
                  rows={3}
                  placeholder="What changed in this version?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button type="submit" variant="primary" className="gap-1.5">
                <Send className="h-4 w-4" aria-hidden="true" />
                Submit version
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end border-t pt-3">
          <Button variant="outline" size="sm" onClick={() => onEdit(shot)}>
            Edit shot details
          </Button>
        </div>
      </div>
    </>
  );
}
