"use client";

import { useState, useEffect } from "react";
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
import type { CrewMember, CrewDepartment, CrewAvailability, ContractStatus, PaymentStatus } from "@/lib/types";
import { crewDepartmentLabels, availabilityLabels, updateCrew } from "@/lib/crew-store";
import { ImageUpload } from "@/components/images/image-upload";

interface Props {
  member: CrewMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditCrewDialog({ member, open, onOpenChange, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(member.name);
  const [department, setDepartment] = useState<CrewDepartment>(member.department);
  const [role, setRole] = useState(member.role);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone);
  const [agency, setAgency] = useState(member.agency ?? "");
  const [contractStatus, setContractStatus] = useState<ContractStatus>(member.contractStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(member.paymentStatus);
  const [availability, setAvailability] = useState<CrewAvailability>(member.availability);
  const [dayRate, setDayRate] = useState(String(member.dayRate));
  const [totalDays, setTotalDays] = useState(String(member.totalDays));
  const [daysWorked, setDaysWorked] = useState(String(member.daysWorked));
  const [totalPaid, setTotalPaid] = useState(String(member.totalPaid));
  const [notes, setNotes] = useState(member.notes);
  const [profileImage, setProfileImage] = useState<string | null>(member.profileImage ?? null);

  useEffect(() => {
    if (open) {
      setError("");
      setDaysWorked(String(member.daysWorked)); setTotalPaid(String(member.totalPaid));
      setName(member.name); setDepartment(member.department); setRole(member.role);
      setEmail(member.email); setPhone(member.phone); setAgency(member.agency ?? "");
      setContractStatus(member.contractStatus); setPaymentStatus(member.paymentStatus);
      setAvailability(member.availability); setDayRate(String(member.dayRate));
      setTotalDays(String(member.totalDays)); setNotes(member.notes); setProfileImage(member.profileImage ?? null);
    }
  }, [open, member]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim() || !role.trim() || !email.trim()) {
      setError("Name, role and email are required.");
      return;
    }
    const rate = Number(dayRate), days = Number(totalDays), worked = Number(daysWorked), paid = Number(totalPaid);
    const owed = rate * days;
    if (!Number.isFinite(rate) || rate < 0 || !Number.isFinite(paid) || paid < 0 || !Number.isFinite(owed) || paid > owed) {
      setError("Rate and paid amount must be non-negative. Paid amount cannot exceed rate × total days.");
      return;
    }
    if (!Number.isSafeInteger(days) || !Number.isSafeInteger(worked) || days < 0 || worked < 0 || worked > days) {
      setError("Days must be non-negative whole numbers. Days worked cannot exceed total days.");
      return;
    }
    if ((paymentStatus === "paid" && paid !== owed) || (paymentStatus === "partial" && (paid <= 0 || paid >= owed)) || (paymentStatus === "pending" && paid > 0) || (paymentStatus === "overdue" && paid >= owed)) {
      setError("Payment status must match the paid amount and outstanding balance.");
      return;
    }

    setSaving(true);
    const nameParts = name.trim().split(/\s+/);
    const initials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    try {
      const updated = updateCrew(member.id, {
        name: name.trim(), initials, department, role: role.trim(),
        email: email.trim(), phone: phone.trim(), agency: agency.trim() || undefined,
        contractStatus, paymentStatus, availability,
        dayRate: rate, totalDays: days, daysWorked: worked, totalPaid: paid,
        notes: notes.trim(),
        profileImage,
      });
      if (!updated) throw new Error("This crew member no longer exists.");
      onOpenChange(false);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Crew Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</h4>
            <ImageUpload value={profileImage} onChange={setProfileImage} label="Profile Photo" aspect="portrait" className="max-w-[180px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-crew-name">Full Name</Label>
                <Input id="edit-crew-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-crew-email">Email</Label>
                <Input id="edit-crew-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-crew-phone">Phone</Label>
                <Input id="edit-crew-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-crew-agency">Agency / Guild</Label>
                <Input id="edit-crew-agency" value={agency} onChange={(e) => setAgency(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Department & Role</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Select value={department} onValueChange={(v) => setDepartment(v as CrewDepartment)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(crewDepartmentLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-crew-role">Role</Label>
                <Input id="edit-crew-role" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status & Compensation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Contract Status</Label>
                <Select value={contractStatus} onValueChange={(v) => setContractStatus(v as ContractStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Availability</Label>
                <Select value={availability} onValueChange={(v) => setAvailability(v as CrewAvailability)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(availabilityLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-crew-rate">Day Rate (INR)</Label>
                <Input id="edit-crew-rate" type="number" min={0} step="0.01" value={dayRate} onChange={(e) => setDayRate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-crew-days">Total Days</Label>
                <Input id="edit-crew-days" type="number" min={0} value={totalDays} onChange={(e) => setTotalDays(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-crew-worked">Days Worked</Label>
                <Input id="edit-crew-worked" type="number" min={0} max={Number(totalDays)} value={daysWorked} onChange={(e) => setDaysWorked(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-crew-paid">Paid Amount (INR)</Label>
                <Input id="edit-crew-paid" type="number" min={0} step="0.01" max={Number(dayRate) * Number(totalDays)} value={totalPaid} onChange={(e) => {
                  setTotalPaid(e.target.value);
                  const paid = Number(e.target.value), owed = Number(dayRate) * Number(totalDays);
                  setPaymentStatus(paid >= owed && owed > 0 ? "paid" : paid > 0 ? "partial" : "pending");
                }} className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-crew-notes">Notes</Label>
            <Textarea id="edit-crew-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
