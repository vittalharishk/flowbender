"use client";

import { useState, useEffect } from "react";
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
import type { CastMember, CastCategory, ContractStatus, PaymentStatus } from "@/lib/types";
import { castCategoryLabels, updateCast } from "@/lib/cast-store";
import { ImageUpload } from "@/components/images/image-upload";

interface Props {
  member: CastMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const languagePresets = [
  "English", "Hindi", "Spanish", "French", "Mandarin", "Japanese",
  "Korean", "Tamil", "Telugu", "Marathi", "Bengali", "Portuguese",
  "German", "Italian", "Arabic", "Russian",
];

export function EditCastDialog({ member, open, onOpenChange, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(member.name);
  const [character, setCharacter] = useState(member.character);
  const [characterDescription, setCharacterDescription] = useState(member.characterDescription);
  const [category, setCategory] = useState<CastCategory>(member.category);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone);
  const [agency, setAgency] = useState(member.agency ?? "");
  const [languages, setLanguages] = useState<string[]>([...member.languages]);
  const [langInput, setLangInput] = useState("");
  const [contractStatus, setContractStatus] = useState<ContractStatus>(member.contractStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(member.paymentStatus);
  const [totalFee, setTotalFee] = useState(String(member.totalFee));
  const [paidAmount, setPaidAmount] = useState(String(member.paidAmount));
  const [notes, setNotes] = useState(member.notes);
  const [profileImage, setProfileImage] = useState<string | null>(member.profileImage ?? null);

  useEffect(() => {
    if (open) {
      setError("");
      setLangInput("");
      setName(member.name);
      setCharacter(member.character);
      setCharacterDescription(member.characterDescription);
      setCategory(member.category);
      setEmail(member.email);
      setPhone(member.phone);
      setAgency(member.agency ?? "");
      setLanguages([...member.languages]);
      setContractStatus(member.contractStatus);
      setPaymentStatus(member.paymentStatus);
      setTotalFee(String(member.totalFee));
      setPaidAmount(String(member.paidAmount));
      setNotes(member.notes);
      setProfileImage(member.profileImage ?? null);
    }
  }, [open, member]);

  function addLanguage(lang: string) {
    const trimmed = lang.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
    }
    setLangInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim() || !character.trim() || !email.trim()) {
      setError("Name, character and email are required.");
      return;
    }
    const fee = Number(totalFee);
    const paid = Number(paidAmount);
    if (!Number.isFinite(fee) || !Number.isFinite(paid) || fee < 0 || paid < 0 || paid > fee) {
      setError("Fee and paid amount must be non-negative. Paid amount cannot exceed the total fee.");
      return;
    }
    if ((paymentStatus === "paid" && paid !== fee) || (paymentStatus === "partial" && (paid <= 0 || paid >= fee)) || (paymentStatus === "pending" && paid > 0) || (paymentStatus === "overdue" && paid >= fee)) {
      setError("Payment status must match the amounts: paid in full, partially paid, unpaid/pending, or an outstanding overdue balance.");
      return;
    }

    setSaving(true);

    const nameParts = name.trim().split(/\s+/);
    const initials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    try {
      const updated = updateCast(member.id, {
        name: name.trim(),
        character: character.trim(),
        characterDescription: characterDescription.trim(),
        category,
        initials,
        email: email.trim(),
        phone: phone.trim(),
        agency: agency.trim() || undefined,
        languages,
        contractStatus,
        paymentStatus,
        totalFee: fee,
        paidAmount: paid,
        notes: notes.trim(),
        profileImage,
      });
      if (!updated) throw new Error("This cast member no longer exists.");
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
          <DialogTitle>Edit Cast Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          {/* Personal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</h4>
            <ImageUpload value={profileImage} onChange={setProfileImage} label="Profile Photo" aspect="portrait" className="max-w-[180px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-agency">Agency</Label>
                <Input id="edit-agency" value={agency} onChange={(e) => setAgency(e.target.value)} className="mt-1" />
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

          {/* Character */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Character Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-character">Character Name</Label>
                <Input id="edit-character" value={character} onChange={(e) => setCharacter(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as CastCategory)}>
                  <SelectTrigger id="edit-category" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(castCategoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-char-desc">Character Description</Label>
              <Textarea id="edit-char-desc" value={characterDescription} onChange={(e) => setCharacterDescription(e.target.value)} className="mt-1 min-h-[80px]" />
            </div>
          </div>

          {/* Contract & Payment */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contract & Payment</h4>
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
                <Label htmlFor="edit-fee">Total Fee (INR)</Label>
                <Input id="edit-fee" type="number" min={0} step="0.01" value={totalFee} onChange={(e) => setTotalFee(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-paid">Paid Amount (INR)</Label>
                <Input id="edit-paid" type="number" min={0} max={Number(totalFee)} step="0.01" value={paidAmount} onChange={(e) => {
                  setPaidAmount(e.target.value);
                  const paid = Number(e.target.value);
                  setPaymentStatus(paid >= Number(totalFee) && Number(totalFee) > 0 ? "paid" : paid > 0 ? "partial" : "pending");
                }} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-[60px]" />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
