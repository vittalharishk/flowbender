"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { saveCompanyProfile } from "@/lib/auth-client";

const COMPANY_TYPES = [
  "Production House",
  "Studio",
  "Distribution Company",
  "Post-Production Studio",
  "Independent Producer",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState(COMPANY_TYPES[0]);
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <Clapperboard className="w-12 h-12 text-orange-500 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Enter your company name.");
      return;
    }
    setSaving(true);
    try {
      saveCompanyProfile(user!.id, {
        companyName: companyName.trim(),
        companyType,
        country: country.trim(),
        city: city.trim() || undefined,
        website: website.trim() || undefined,
      });
      router.replace("/dashboard/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the company profile.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 backdrop-blur">
          <div className="flex items-center justify-center mb-2">
            <Building2 className="w-8 h-8 text-orange-500 mr-3" />
            <h1 className="text-2xl font-bold text-white">Set up your company</h1>
          </div>
          <p className="text-center text-sm text-slate-400 mb-6">
            Welcome, {user.full_name}! Tell us about your production company — then you can start creating projects.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="company-name" className="text-slate-300">Company name *</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Mythri Movie Makers"
                className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label htmlFor="company-type" className="text-slate-300">Company type</Label>
              <select
                id="company-type"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="mt-2 w-full h-10 rounded-md bg-slate-800 border border-slate-700 text-white text-sm px-3"
              >
                {COMPANY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="country" className="text-slate-300">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)}
                  className="mt-2 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label htmlFor="city" className="text-slate-300">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Optional"
                  className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
              </div>
            </div>
            <div>
              <Label htmlFor="website" className="text-slate-300">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Optional"
                className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
            </div>

            <Button type="submit" disabled={saving || !companyName.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-2">
              {saving ? "Saving..." : "Continue to flowbender"}
            </Button>
            <button
              type="button"
              onClick={() => { saveCompanyProfile(user!.id, { companyName: user!.full_name, companyType: "Other", country: "" }); router.replace("/dashboard/projects"); }}
              className="w-full text-xs text-slate-500 hover:text-slate-400 mt-1"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
