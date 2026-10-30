"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CastCategory } from "@/lib/types";
import { castCategoryLabels, createCast } from "@/lib/cast-store";
import { useProjects } from "@/lib/project-store";
import { ImageUpload } from "@/components/images/image-upload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectTitle?: string;
  onCreated: () => void;
}

interface FormErrors {
  [key: string]: string;
}

const languagePresets = [
  "English", "Hindi", "Spanish", "French", "Mandarin", "Japanese",
  "Korean", "Tamil", "Telugu", "Marathi", "Bengali", "Portuguese",
  "German", "Italian", "Arabic", "Russian",
];

export function AddCastDialog({ open, onOpenChange, projectId, projectTitle, onCreated }: Props) {
  const projects = useProjects();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [name, setName] = useState("");
  const [character, setCharacter] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [category, setCategory] = useState<CastCategory>("supporting");
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agency, setAgency] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [notes, setNotes] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  function reset() {
    setName(""); setCharacter(""); setCharacterDescription(""); setCategory("supporting");
    setSelectedProjectId(projectId ?? ""); setEmail(""); setPhone(""); setAgency("");
    setLanguages([]); setLangInput(""); setTotalFee(""); setNotes(""); setProfileImage(null); setErrors({});
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!character.trim()) e.character = "Character name is required";
    if (!projects.some((project) => project.id === selectedProjectId)) e.project = "Select an existing project";
    if (!email.trim()) e.email = "Email is required";
    if (!Number.isFinite(Number(totalFee)) || Number(totalFee) < 0) e.fee = "Fee must be a non-negative amount in INR";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addLanguage(lang: string) {
    const trimmed = lang.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
    }
    setLangInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !validate()) return;

    setSaving(true);
    const proj = projects.find((p) => p.id === selectedProjectId);

    try {
      createCast({
        name: name.trim(),
        character: character.trim(),
        characterDescription: characterDescription.trim(),
        category,
        projectId: selectedProjectId,
        projectTitle: proj?.title ?? projectTitle ?? "",
        email: email.trim(),
        phone: phone.trim(),
        agency: agency.trim() || undefined,
        languages,
        totalFee: Number(totalFee) || 0,
        notes: notes.trim(),
        profileImage,
      });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (cause) {
      setErrors({ submit: cause instanceof Error ? cause.message : "Unable to add cast member. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Cast Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {errors.submit && <p role="alert" className="text-sm text-red-500">{errors.submit}</p>}
          {projects.length === 0 && <p className="text-sm">Create a project before adding cast. <Link className="text-primary underline" href="/dashboard/projects/new">Create project</Link></p>}
          {/* Personal Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</h4>
            <ImageUpload value={profileImage} onChange={setProfileImage} label="Add Cast Photo" aspect="portrait" className="max-w-[180px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cast-name">Full Name *</Label>
                <Input id="cast-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Elena Vasquez" className="mt-1" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="cast-email">Email *</Label>
                <Input id="cast-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="talent@agency.com" className="mt-1" />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="cast-phone">Phone</Label>
                <Input id="cast-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (310) 555-0000" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cast-agency">Agency / Management</Label>
                <Input id="cast-agency" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. Creative Artists Agency" className="mt-1" />
              </div>
            </div>
            {/* Languages */}
            <div>
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                {languages.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                    {l}
                    <button type="button" aria-label={`Remove ${l}`} onClick={() => setLanguages(languages.filter((x) => x !== l))} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value="" onValueChange={(v) => addLanguage(v)}>
                  <SelectTrigger className="w-[180px] h-9 text-xs">
                    <SelectValue placeholder="Add language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {languagePresets.filter((l) => !languages.includes(l)).map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLanguage(langInput); } }}
                    placeholder="Or type custom..."
                    className="h-9 text-xs w-36"
                  />
                  <Button type="button" aria-label="Add custom language" variant="outline" size="sm" className="h-9 px-2" onClick={() => addLanguage(langInput)}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Character Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Character Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cast-character">Character Name *</Label>
                <Input id="cast-character" value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="e.g. Commander Aria Song" className="mt-1" />
                {errors.character && <p className="text-xs text-red-400 mt-1">{errors.character}</p>}
              </div>
              <div>
                <Label htmlFor="cast-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CastCategory)}>
                  <SelectTrigger id="cast-category" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(castCategoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="cast-char-desc">Character Description</Label>
              <Textarea
                id="cast-char-desc"
                value={characterDescription}
                onChange={(e) => setCharacterDescription(e.target.value)}
                placeholder="Brief description of the character, their arc, and key traits..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          {/* Project & Contract */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project & Contract</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cast-project">Project *</Label>
                {projectId ? (
                  <Input value={projectTitle ?? ""} disabled className="mt-1" />
                ) : (
                  <>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger id="cast-project" className="mt-1">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.project && <p className="text-xs text-red-400 mt-1">{errors.project}</p>}
                  </>
                )}
              </div>
              <div>
                <Label htmlFor="cast-fee">Total Fee (INR)</Label>
                <Input
                  id="cast-fee"
                  type="number"
                  min={0}
                  step="0.01"
                  value={totalFee}
                  onChange={(e) => setTotalFee(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
                {errors.fee && <p role="alert" className="text-xs text-red-400 mt-1">{errors.fee}</p>}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="cast-notes">Notes</Label>
            <Textarea
              id="cast-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Scheduling notes, special requirements, allergies, stunt restrictions..."
              className="mt-1 min-h-[60px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || projects.length === 0}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {saving ? "Adding..." : "Add Cast Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
