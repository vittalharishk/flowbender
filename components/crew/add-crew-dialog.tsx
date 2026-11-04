"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
import type { CrewDepartment } from "@/lib/types";
import { crewDepartmentLabels, createCrew } from "@/lib/crew-store";
import { useProjects } from "@/lib/project-store";
import { ImageUpload } from "@/components/images/image-upload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectTitle?: string;
  onCreated: () => void;
}

interface FormErrors { [key: string]: string; }

const rolePresets: Record<string, string[]> = {
  direction: ["Director", "1st Assistant Director", "2nd Assistant Director", "Script Supervisor"],
  production: ["Line Producer", "Production Manager", "Production Coordinator", "Production Assistant"],
  camera: ["Director of Photography", "Camera Operator", "1st Assistant Camera", "2nd Assistant Camera", "Steadicam Operator", "DIT"],
  art: ["Art Director", "Set Decorator", "Props Master", "Graphic Designer"],
  costume: ["Costume Designer", "Wardrobe Supervisor", "Costume Assistant"],
  makeup: ["Head of Makeup & Hair", "Makeup Artist", "Hair Stylist", "SFX Makeup Artist"],
  sound: ["Production Sound Mixer", "Boom Operator", "Sound Designer", "Sound Editor"],
  lighting: ["Gaffer", "Best Boy Electric", "Electrician", "Lighting Technician"],
  vfx: ["VFX Supervisor", "VFX Compositor", "CG Artist", "Roto Artist", "Motion Graphics Artist"],
  editing: ["Lead Editor", "Assistant Editor", "Colorist"],
  di: ["DI Colorist", "DI Supervisor", "DI Assistant"],
  dubbing: ["Dubbing Mixer", "Dubbing Editor", "Foley Artist", "ADR Recordist"],
  "production-design": ["Production Designer", "Set Designer", "Model Maker", "Scenic Artist"],
  transport: ["Transport Captain", "Driver", "Vehicle Coordinator"],
  accounts: ["Production Accountant", "Assistant Accountant", "Payroll Coordinator"],
  publicity: ["Unit Publicist", "Social Media Manager", "EPK Producer", "Photographer"],
};

export function AddCrewDialog({ open, onOpenChange, projectId, projectTitle, onCreated }: Props) {
  const projects = useProjects();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [name, setName] = useState("");
  const [department, setDepartment] = useState<CrewDepartment>("camera");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agency, setAgency] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [notes, setNotes] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  function reset() {
    setName(""); setDepartment("camera"); setRole(""); setCustomRole("");
    setSelectedProjectId(projectId ?? ""); setEmail(""); setPhone(""); setAgency("");
    setDayRate(""); setTotalDays(""); setNotes(""); setProfileImage(null); setErrors({});
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!(role === "__custom" ? customRole.trim() : role.trim())) e.role = "Role is required";
    if (!projects.some((project) => project.id === selectedProjectId)) e.project = "Select an existing project";
    if (!email.trim()) e.email = "Email is required";
    if (!Number.isFinite(Number(dayRate)) || Number(dayRate) < 0) e.rate = "Enter a non-negative day rate in INR";
    if (!Number.isSafeInteger(Number(totalDays)) || Number(totalDays) < 0) e.days = "Enter a non-negative whole number of days";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !validate()) return;

    setSaving(true);
    const proj = projects.find((p) => p.id === selectedProjectId);

    try {
      createCrew({
        name: name.trim(),
        initials: name.trim().split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        department,
        role: (role === "__custom" ? customRole.trim() : role) || customRole.trim(),
        projectId: selectedProjectId,
        projectTitle: proj?.title ?? projectTitle ?? "",
        email: email.trim(),
        phone: phone.trim(),
        agency: agency.trim() || undefined,
        dayRate: Number(dayRate) || 0,
        totalDays: Number(totalDays) || 0,
        daysWorked: 0,
        totalPaid: 0,
        contractStatus: "pending",
        paymentStatus: "pending",
        availability: "available",
        joinedDate: new Date().toISOString().slice(0, 10),
        notes: notes.trim(),
        profileImage,
      });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (cause) {
      setErrors({ submit: cause instanceof Error ? cause.message : "Unable to add crew member. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const currentRoles = rolePresets[department] ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Crew Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {errors.submit && <p role="alert" className="text-sm text-red-500">{errors.submit}</p>}
          {projects.length === 0 && <p className="text-sm">Create a project before adding crew. <Link className="text-primary underline" href="/dashboard/projects/new">Create project</Link></p>}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</h4>
            <ImageUpload value={profileImage} onChange={setProfileImage} label="Add Crew Photo" aspect="portrait" className="max-w-[180px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crew-name">Full Name *</Label>
                <Input id="crew-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Roberto Fiennes" className="mt-1" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="crew-email">Email *</Label>
                <Input id="crew-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@crew.com" className="mt-1" />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="crew-phone">Phone</Label>
                <Input id="crew-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (310) 555-0000" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="crew-agency">Agency / Guild</Label>
                <Input id="crew-agency" value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="e.g. IATSE Local 600" className="mt-1" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Department & Role</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Department *</Label>
                <Select value={department} onValueChange={(v) => { setDepartment(v as CrewDepartment); setRole(""); setCustomRole(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(crewDepartmentLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>
                    {currentRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                    <SelectItem value="__custom">Other (type below)</SelectItem>
                  </SelectContent>
                </Select>
                {role === "__custom" && (
                  <Input value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Enter custom role..." className="mt-2" />
                )}
                {errors.role && <p className="text-xs text-red-400 mt-1">{errors.role}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project & Compensation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Project *</Label>
                {projectId ? (
                  <Input value={projectTitle ?? ""} disabled className="mt-1" />
                ) : (
                  <>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
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
                <Label htmlFor="crew-rate">Day Rate (INR)</Label>
                <Input id="crew-rate" type="number" min={0} step="0.01" value={dayRate} onChange={(e) => setDayRate(e.target.value)} placeholder="0" className="mt-1" />
                {errors.rate && <p role="alert" className="text-xs text-red-400 mt-1">{errors.rate}</p>}
              </div>
              <div>
                <Label htmlFor="crew-days">Estimated Days</Label>
                <Input id="crew-days" type="number" min={0} value={totalDays} onChange={(e) => setTotalDays(e.target.value)} placeholder="0" className="mt-1" />
                {errors.days && <p role="alert" className="text-xs text-red-400 mt-1">{errors.days}</p>}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="crew-notes">Notes</Label>
            <Textarea id="crew-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Equipment preferences, scheduling notes, special requirements..." className="mt-1 min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={saving || projects.length === 0} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {saving ? "Adding..." : "Add Crew Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
