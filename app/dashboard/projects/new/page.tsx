"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createProject, type CreateProjectInput } from "@/lib/project-store";
import {
  genreOptions,
  languageOptions,
} from "@/lib/mock-data";
import type { ProjectType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/images/image-upload";

const typeOptions: { value: ProjectType; label: string }[] = [
  { value: "feature-film", label: "Feature Film" },
  { value: "series", label: "TV / OTT Series" },
  { value: "short-film", label: "Short Film" },
  { value: "music-video", label: "Music Video" },
  { value: "documentary", label: "Documentary" },
  { value: "commercial", label: "Commercial" },
];

interface FormErrors {
  [key: string]: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ProjectType>("feature-film");
  const [language, setLanguage] = useState("");
  const [genre, setGenre] = useState("");
  const [productionHouse, setProductionHouse] = useState("");
  const [director, setDirector] = useState("");
  const [producer, setProducer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalShootDays, setTotalShootDays] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!title.trim()) e.title = "Project title is required";
    if (!language) e.language = "Language is required";
    if (!genre) e.genre = "Genre is required";
    if (!director.trim()) e.director = "Director is required";
    if (!producer.trim()) e.producer = "Producer is required";
    if (!startDate) e.startDate = "Start date is required";
    if (!endDate) e.endDate = "Expected release date is required";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      e.endDate = "Release date must be after start date";
    }
    if (!Number.isSafeInteger(Number(totalShootDays)) || Number(totalShootDays) <= 0) e.totalShootDays = "Enter a positive whole number of shoot days";
    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) e.budget = "Enter a positive budget in INR";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !validate()) return;

    setSaving(true);

    const input: CreateProjectInput = {
      title: title.trim(),
      type,
      language,
      genre,
      productionHouse: productionHouse.trim(),
      director: director.trim(),
      producer: producer.trim(),
      startDate,
      endDate,
      totalShootDays: Number(totalShootDays),
      budget: Number(budget),
      description: description.trim(),
      posterImage,
      thumbnailImage,
      bannerImage,
    };

    try {
      const project = createProject(input);
      router.push(`/dashboard/projects/${project.id}`);
    } catch (cause) {
      setErrors({ submit: cause instanceof Error ? cause.message : "Unable to create project. Please try again." });
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Back to projects">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Create New Project</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Set up a new film or series production
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.submit && <p role="alert" className="text-sm text-red-500">{errors.submit}</p>}
        {/* Basic Info */}
        <section className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-semibold text-base">Basic Information</h3>

          <FormField label="Project Title" error={errors.title} required>
            <Input
              id="project-title"
              placeholder="e.g. Mana Hyderabad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Project Type" required>
              <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
                <SelectTrigger id="project-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Primary Language" error={errors.language} required>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="primary-language" className="h-10">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Genre" error={errors.genre} required>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger id="genre" className="h-10">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {genreOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Production House">
              <Input
                id="production-house"
                placeholder="e.g. Apex Cinema Group"
                value={productionHouse}
                onChange={(e) => setProductionHouse(e.target.value)}
                className="h-10"
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-semibold text-base">Project Images</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <ImageUpload value={posterImage} onChange={setPosterImage} label="Upload Poster" aspect="portrait" />
            <ImageUpload value={thumbnailImage} onChange={setThumbnailImage} label="Upload Thumbnail" aspect="video" />
            <ImageUpload value={bannerImage} onChange={setBannerImage} label="Upload Banner" aspect="video" />
          </div>
        </section>

        {/* Team */}
        <section className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-semibold text-base">Key Personnel</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Director" error={errors.director} required>
              <Input
                id="director"
                placeholder="Director's full name"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="h-10"
              />
            </FormField>

            <FormField label="Producer" error={errors.producer} required>
              <Input
                id="producer"
                placeholder="Producer's full name"
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
                className="h-10"
              />
            </FormField>
          </div>
        </section>

        {/* Schedule + Budget */}
        <section className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-semibold text-base">Schedule & Budget</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Start Date" error={errors.startDate} required>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10"
              />
            </FormField>

            <FormField label="Expected Release Date" error={errors.endDate} required>
              <Input
                id="expected-release-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Estimated Shoot Days" error={errors.totalShootDays} required>
              <Input
                id="estimated-shoot-days"
                type="number"
                min={1}
                placeholder="e.g. 45"
                value={totalShootDays}
                onChange={(e) => setTotalShootDays(e.target.value)}
                className="h-10"
              />
            </FormField>

            <FormField label="Estimated Budget (INR)" error={errors.budget} required>
              <Input
                id="estimated-budget-inr"
                type="number"
                min={0.01}
                step="0.01"
                placeholder="e.g. 12000000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="h-10"
              />
            </FormField>
          </div>
        </section>

        {/* Description */}
        <section className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-semibold text-base">Description</h3>

          <FormField label="Project Description">
            <Textarea
              id="project-description"
              placeholder="Provide a synopsis or overview of the project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </FormField>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/dashboard/projects">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/20 gap-2 min-w-[140px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const id = label.toLowerCase().replace(/[()]/g, "").replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
