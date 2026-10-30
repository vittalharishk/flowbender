"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Globe, FileText, CheckCircle, Clock, AlertCircle, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { useProjects, useProject } from "@/lib/project-store";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { SubtitleLanguage } from "@/lib/types";
import { toast } from "sonner";

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    complete: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    "in-progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
    case "complete":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case "in-progress":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "pending":
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

interface SubtitleManagementWorkspaceProps {
  projectId?: string;
}

export function SubtitleManagementWorkspace({ projectId: scopedProjectId }: SubtitleManagementWorkspaceProps) {
  const projects = useProjects();
  const scopedProject = useProject(scopedProjectId || "");

  const allSubtitles = useAppDataSlice("subtitleLanguages");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    scopedProjectId || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const effectiveProjectId = scopedProjectId || selectedProjectId;

  const subtitleLanguages = allSubtitles.filter((sub) => {
    if (effectiveProjectId && effectiveProjectId !== "all" && sub.projectId !== effectiveProjectId) {
      return false;
    }
    if (statusFilter !== "all" && sub.qcStatus !== statusFilter) {
      return false;
    }
    return true;
  });

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubtitleLanguage | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    language: "Hindi",
    languageCode: "hi",
    nativeName: "हिन्दी",
    totalLines: 1450,
    completedLines: 1200,
    qcStatus: "in-progress" as SubtitleLanguage["qcStatus"],
    translator: "",
    startDate: new Date().toISOString().slice(0, 10),
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    notes: "",
    fileSize: "160 KB",
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

  const totalLanguages = subtitleLanguages.length;
  const completedLanguages = subtitleLanguages.filter((l) => l.qcStatus === "approved").length;
  const avgCompletion =
    totalLanguages > 0
      ? Math.round(
          subtitleLanguages.reduce((sum, l) => sum + (l.totalLines > 0 ? (l.completedLines / l.totalLines) * 100 : 0), 0) /
            totalLanguages
        )
      : 0;

  const handleOpenAdd = () => {
    setFormData({
      language: "Malayalam",
      languageCode: "ml",
      nativeName: "മലയാളം",
      totalLines: 1450,
      completedLines: 0,
      qcStatus: "pending",
      translator: "Ananth Narayan",
      startDate: new Date().toISOString().slice(0, 10),
      deliveryDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
      notes: "Theatrical release subtitles",
      fileSize: "155 KB",
      projectId: effectiveProjectId || projects[0]?.id || "p1",
    });
    setIsAddOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.language.trim()) return;

    const inProgress = Math.max(0, formData.totalLines - formData.completedLines);

    const newSub: SubtitleLanguage = {
      id: `sub-${Date.now()}`,
      projectId: formData.projectId || effectiveProjectId || "p1",
      language: formData.language.trim(),
      languageCode: formData.languageCode.trim().toLowerCase(),
      nativeName: formData.nativeName.trim(),
      totalLines: Number(formData.totalLines),
      completedLines: Number(formData.completedLines),
      inProgressLines: inProgress,
      qcStatus: formData.qcStatus,
      translator: formData.translator.trim() || "Unassigned",
      startDate: formData.startDate,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes.trim() || undefined,
      fileSize: formData.fileSize || "150 KB",
    };

    updateAppDataSlice("subtitleLanguages", (cur) => [newSub, ...cur]);
    toast.success(`${newSub.language} subtitle track registered.`);
    setIsAddOpen(false);
  };

  const handleOpenEdit = (sub: SubtitleLanguage) => {
    setEditingSub(sub);
    setFormData({
      language: sub.language,
      languageCode: sub.languageCode,
      nativeName: sub.nativeName,
      totalLines: sub.totalLines,
      completedLines: sub.completedLines,
      qcStatus: sub.qcStatus,
      translator: sub.translator,
      startDate: sub.startDate,
      deliveryDate: sub.deliveryDate,
      notes: sub.notes || "",
      fileSize: sub.fileSize || "150 KB",
      projectId: sub.projectId,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub || !formData.language.trim()) return;

    const inProgress = Math.max(0, formData.totalLines - formData.completedLines);

    updateAppDataSlice("subtitleLanguages", (cur) =>
      cur.map((s) =>
        s.id === editingSub.id
          ? {
              ...s,
              language: formData.language.trim(),
              languageCode: formData.languageCode.trim().toLowerCase(),
              nativeName: formData.nativeName.trim(),
              totalLines: Number(formData.totalLines),
              completedLines: Number(formData.completedLines),
              inProgressLines: inProgress,
              qcStatus: formData.qcStatus,
              translator: formData.translator.trim(),
              startDate: formData.startDate,
              deliveryDate: formData.deliveryDate,
              notes: formData.notes.trim() || undefined,
              fileSize: formData.fileSize || s.fileSize,
              projectId: formData.projectId || s.projectId,
            }
          : s
      )
    );
    toast.success(`${formData.language} track updated.`);
    setEditingSub(null);
  };

  const handleDeleteSub = (id: string) => {
    if (confirm("Are you sure you want to delete this subtitle track?")) {
      updateAppDataSlice("subtitleLanguages", (cur) => cur.filter((s) => s.id !== id));
      toast.info("Subtitle track removed.");
      if (editingSub?.id === id) setEditingSub(null);
    }
  };

  const handleQuickApprove = (sub: SubtitleLanguage) => {
    updateAppDataSlice("subtitleLanguages", (cur) =>
      cur.map((s) =>
        s.id === sub.id
          ? { ...s, qcStatus: "approved" as const, completedLines: s.totalLines, inProgressLines: 0 }
          : s
      )
    );
    toast.success(`${sub.language} subtitles approved for master delivery.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {scopedProject ? `${scopedProject.title} · Subtitles` : "Subtitle Management"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopedProject
              ? `Multi-language subtitling, QC checkpoints, and delivery assets for ${scopedProject.title}`
              : "Multi-language subtitling, translation verification, timecode sync, and theatrical packages"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!scopedProjectId && (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleOpenAdd} className="gap-2 shrink-0 bg-primary font-semibold">
            <Plus className="w-4 h-4" />
            Add Language Track
          </Button>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Total Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLanguages}</div>
            <p className="text-xs text-muted-foreground mt-1">{completedLanguages} Certified & Approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Average Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletion}%</div>
            <p className="text-xs text-primary mt-1 font-medium">Across all language streams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              In QC & Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totalLanguages - completedLanguages}</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400 mt-1">Pending final signoff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Lines Translated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subtitleLanguages.reduce((sum, l) => sum + l.completedLines, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dialogue subtitle units</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Language Tracks & Quality Control
          </CardTitle>
          <CardDescription className="text-xs">
            Review timecode synchronization, translation accuracy, and delivery formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="languages" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="languages">Language Tracks ({subtitleLanguages.length})</TabsTrigger>
              <TabsTrigger value="qc">Quality Control & Checklist</TabsTrigger>
              <TabsTrigger value="delivery">Delivery Formats</TabsTrigger>
            </TabsList>

            {/* Languages Tab */}
            <TabsContent value="languages" className="space-y-3">
              {subtitleLanguages.length > 0 ? (
                <div className="space-y-3">
                  {subtitleLanguages.map((lang) => {
                    const proj = projects.find((p) => p.id === lang.projectId);
                    const progressPercent =
                      lang.totalLines > 0 ? Math.round((lang.completedLines / lang.totalLines) * 100) : 0;
                    return (
                      <div
                        key={lang.id}
                        className="border rounded-xl p-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-primary" />
                                {lang.language} ({lang.languageCode.toUpperCase()})
                              </h3>
                              <span className="text-xs text-muted-foreground font-medium">· {lang.nativeName}</span>
                              {proj && !scopedProjectId && (
                                <Badge variant="outline" className="text-[10px]">
                                  {proj.title}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Translator / Agency: <span className="font-medium text-foreground">{lang.translator}</span>
                              {lang.fileSize && ` · File: ${lang.fileSize}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(lang.qcStatus)}
                            <Badge className={`text-xs uppercase font-bold ${getStatusBadgeColor(lang.qcStatus)}`}>
                              {lang.qcStatus.replace("-", " ")}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs bg-muted/30 p-3 rounded-lg">
                          <div>
                            <span className="text-muted-foreground block">Total Dialogue Lines</span>
                            <span className="font-bold text-sm text-foreground">{lang.totalLines}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Completed</span>
                            <span className="font-bold text-sm text-emerald-500">{lang.completedLines}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">In Progress / Review</span>
                            <span className="font-bold text-sm text-blue-500">{lang.inProgressLines}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Target Delivery</span>
                            <span className="font-medium text-foreground">{lang.deliveryDate}</span>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Translation Progress</span>
                            <span className="font-bold text-foreground">{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {lang.notes && <p className="text-xs text-muted-foreground mt-2">📝 {lang.notes}</p>}

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t">
                          <div>
                            {lang.qcStatus !== "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => handleQuickApprove(lang)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve QC
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 gap-1"
                              onClick={() => handleOpenEdit(lang)}
                            >
                              <Edit2 className="w-3 h-3" /> Edit Track
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSub(lang.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No subtitle tracks found</p>
                  <Button size="sm" onClick={handleOpenAdd} className="mt-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Language Track
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* QC Tab */}
            <TabsContent value="qc" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Theatrical Subtitle Compliance Standard
                  </h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
                      <input type="checkbox" checked readOnly className="rounded" />
                      <span>Reading Speed: Under 17 characters per second</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
                      <input type="checkbox" checked readOnly className="rounded" />
                      <span>Line Limits: Max 37-40 characters per line (max 2 lines)</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
                      <input type="checkbox" checked readOnly className="rounded" />
                      <span>Shot Change Gapping: 2 frames minimum gap</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
                      <input type="checkbox" checked readOnly className="rounded" />
                      <span>Font Encoding: UTF-8 with BOM for Indian regional scripts</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Quality Checklist Verification
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b">
                      <span>Cultural & Idiomatic Localization</span>
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                        Verified
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b">
                      <span>SDH / Hearing Impaired Sound Cues</span>
                      <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                        Complete
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>DCP XML Subtitle Wrapper</span>
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                        DCI Certified
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Delivery Formats Tab */}
            <TabsContent value="delivery" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { format: "DCP SMPTE XML", status: "Ready", desc: "Digital Cinema Package Theatrical" },
                  { format: "SRT (SubRip)", status: "Ready", desc: "Universal streaming and web distribution" },
                  { format: "WebVTT (VTT)", status: "Ready", desc: "HTML5 OTT platforms and player preview" },
                  { format: "TTML / DFXP", status: "In-Progress", desc: "Broadcast and IMF delivery package" },
                ].map((fmt, idx) => (
                  <div key={idx} className="border rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{fmt.format}</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                        {fmt.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{fmt.desc}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Subtitle Track Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subtitle Language Track</DialogTitle>
            <DialogDescription>Register a new translation language stream and assign agency.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAdd} className="space-y-3 pt-2">
            {!scopedProjectId && (
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Project</label>
                <Select
                  value={formData.projectId}
                  onValueChange={(val) => setFormData({ ...formData, projectId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Language *</label>
                <Input
                  required
                  placeholder="e.g. Tamil"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">ISO Code *</label>
                <Input
                  required
                  placeholder="e.g. ta"
                  value={formData.languageCode}
                  onChange={(e) => setFormData({ ...formData, languageCode: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Native Script Name</label>
              <Input
                placeholder="e.g. தமிழ்"
                value={formData.nativeName}
                onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Total Lines</label>
                <Input
                  type="number"
                  value={formData.totalLines}
                  onChange={(e) => setFormData({ ...formData, totalLines: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Completed Lines</label>
                <Input
                  type="number"
                  value={formData.completedLines}
                  onChange={(e) => setFormData({ ...formData, completedLines: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">QC Status</label>
                <Select
                  value={formData.qcStatus}
                  onValueChange={(val: any) => setFormData({ ...formData, qcStatus: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Target Delivery</label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Translator / Agency</label>
              <Input
                placeholder="e.g. Prime Dubs Studio"
                value={formData.translator}
                onChange={(e) => setFormData({ ...formData, translator: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Notes</label>
              <Textarea
                rows={2}
                placeholder="Script notes, special font glyph requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Subtitle Track
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subtitle Track Modal */}
      <Dialog open={!!editingSub} onOpenChange={(open) => !open && setEditingSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subtitle Track</DialogTitle>
            <DialogDescription>Update translation progress and certification status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Language *</label>
                <Input
                  required
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">ISO Code</label>
                <Input
                  value={formData.languageCode}
                  onChange={(e) => setFormData({ ...formData, languageCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Total Lines</label>
                <Input
                  type="number"
                  value={formData.totalLines}
                  onChange={(e) => setFormData({ ...formData, totalLines: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Completed Lines</label>
                <Input
                  type="number"
                  value={formData.completedLines}
                  onChange={(e) => setFormData({ ...formData, completedLines: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">QC Status</label>
                <Select
                  value={formData.qcStatus}
                  onValueChange={(val: any) => setFormData({ ...formData, qcStatus: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Delivery Date</label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Translator / Agency</label>
              <Input
                value={formData.translator}
                onChange={(e) => setFormData({ ...formData, translator: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Notes</label>
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => editingSub && handleDeleteSub(editingSub.id)}
              >
                Delete Track
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingSub(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary">
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
