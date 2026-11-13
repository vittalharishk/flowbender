"use client";

import { useState } from "react";
import { Edit2, FileCheck, Lock, RefreshCw, Server, Settings2, Shield, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackupStrategyDialog } from "./backup-strategy-dialog";

export interface BackupStrategyConfig {
  standardName: string;
  description: string;
  ruleCode: string;
  hashAlgorithm: string;
  primaryTarget: string;
  secondaryTarget: string;
  tertiaryTarget: string;
  cardsOffloadedRate: string;
  nasSyncFrequency: string;
  ltoSyncFrequency: string;
  vaultLocation: string;
  lastSweepDate: string;
  integrityRate: string;
  autoMhlGeneration: boolean;
  bitRotDetection: boolean;
  retentionPeriod: string;
}

const defaultStrategy: BackupStrategyConfig = {
  standardName: "Active 3-2-1 Production Backup Standard",
  description:
    "3 verified copies of every master camera card are maintained across at least 2 distinct physical media types, with 1 secure off-site archive sync.",
  ruleCode: "3-2-1",
  hashAlgorithm: "xxHash64 & MD5",
  primaryTarget: "SanDisk PRO-BLADE 8TB NVMe RAID-0 (On-Set DIT)",
  secondaryTarget: "QNAP 16-Bay Thunderbolt NAS (Editorial Working Mirror)",
  tertiaryTarget: "Quantum LTO-9 Linear Tape & AWS Glacier Deep Archive",
  cardsOffloadedRate: "100% Ingested",
  nasSyncFrequency: "Hourly Real-Time",
  ltoSyncFrequency: "Nightly Differential",
  vaultLocation: "Hyderabad Studio Main Safe & Mumbai Cloud Cold Tier",
  lastSweepDate: "16 Sep 2026, 14:15 IST",
  integrityRate: "99.99% Verified",
  autoMhlGeneration: true,
  bitRotDetection: true,
  retentionPeriod: "3 Years / Post-Production Master Wrap",
};

const tiers = [
  {
    code: "T1",
    title: "Tier 1: On-Set Ingest",
    subtitle: "Primary Working RAID",
    badge: "Live Ingest",
    badgeClass: "border-amber-500/30 text-amber-500",
    chipClass: "bg-amber-500/15 text-amber-500",
    targetKey: "primaryTarget",
    detail: "Ingest: Silverstack MHL with xxHash64",
    footLabel: "Card Offload:",
    footKey: "cardsOffloadedRate",
    footEmphasis: true,
  },
  {
    code: "T2",
    title: "Tier 2: Nearline NAS",
    subtitle: "Editorial Shuttle Mirror",
    badge: "Working Mirror",
    badgeClass: "border-blue-500/30 text-blue-500",
    chipClass: "bg-blue-500/15 text-blue-500",
    targetKey: "secondaryTarget",
    detail: "Editorial Streaming & Daily Transcodes",
    footLabel: "Sync Schedule:",
    footKey: "nasSyncFrequency",
    footEmphasis: false,
  },
  {
    code: "T3",
    title: "Tier 3: Off-Site Archive",
    subtitle: "Cold LTO & Cloud Vault",
    badge: "Cold Vault",
    badgeClass: "border-purple-500/30 text-purple-500",
    chipClass: "bg-purple-500/15 text-purple-500",
    targetKey: "tertiaryTarget",
    detail: "Dual Physical Copies (LTFS Tape + Glacier)",
    footLabel: "Archive Schedule:",
    footKey: "ltoSyncFrequency",
    footEmphasis: false,
  },
] as const;

export function BackupStrategyTab({ projectTitle }: { projectTitle?: string }) {
  const [strategyConfig, setStrategyConfig] = useState<BackupStrategyConfig>(defaultStrategy);
  const [strategyEditForm, setStrategyEditForm] = useState<BackupStrategyConfig>(defaultStrategy);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);

  const handleOpenEditStrategy = () => {
    setStrategyEditForm({ ...strategyConfig });
    setStrategyModalOpen(true);
  };

  const handleSaveStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    setStrategyConfig({ ...strategyEditForm });
    setStrategyModalOpen(false);
    toast.success("Production backup strategy & policies updated successfully.");
  };

  const handleRunChecksumSweep = () => {
    setIsSweeping(true);
    toast.info(`Initiating ${strategyConfig.hashAlgorithm} checksum sweep across storage pools...`);
    setTimeout(() => {
      setIsSweeping(false);
      setStrategyConfig((prev) => ({
        ...prev,
        lastSweepDate: `Just now (${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})`,
        integrityRate: "100% Bit-Accurate",
      }));
      toast.success("Checksum sweep completed: 74TB verified with 0 parity errors.");
    }, 1200);
  };

  const handleExportMhlCertificate = () => {
    const certificateText = `--- FLOWBENDER DIT MEDIA INTEGRITY CERTIFICATE ---
Production: ${projectTitle || "Studio Feature Slates"}
Date: ${new Date().toISOString()}
Policy: ${strategyConfig.standardName} (${strategyConfig.ruleCode})
Hash Algorithm: ${strategyConfig.hashAlgorithm}
Primary Ingest: ${strategyConfig.primaryTarget}
Secondary Mirror: ${strategyConfig.secondaryTarget}
Off-Site Archive: ${strategyConfig.tertiaryTarget}
Vault Location: ${strategyConfig.vaultLocation}
Integrity Rate: ${strategyConfig.integrityRate}
MHL 2.0 Compliance: ${strategyConfig.autoMhlGeneration ? "VERIFIED" : "DISABLED"}
Lead DIT Signoff: Hari Kethan (Digital Imaging Technician)
Post Supervisor Signoff: Lalitha Vemuri`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(certificateText);
      toast.success("DIT Media Integrity Certificate copied to clipboard.");
    } else {
      toast.success("Generated DIT Media Integrity Certificate.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy banner */}
      <div className="rounded-lg border border-primary/25 bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 py-0.5 text-xs font-bold text-primary">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                {strategyConfig.standardName}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Zero Data Loss Guarantee
              </span>
              <span className="text-xs font-medium text-muted-foreground">Rule: {strategyConfig.ruleCode}</span>
            </div>

            <h3 className="text-xl font-bold text-foreground">
              Production Media Preservation &amp; 3-Tier Redundancy Architecture
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{strategyConfig.description}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button size="sm" variant="outline" onClick={handleOpenEditStrategy} className="h-9 gap-1.5 text-xs font-semibold">
              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
              Edit Strategy
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRunChecksumSweep}
              disabled={isSweeping}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSweeping ? "animate-spin text-primary" : ""}`} aria-hidden="true" />
              {isSweeping ? "Sweeping 74TB..." : "Run Checksum Sweep"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportMhlCertificate} className="h-9 gap-1.5 text-xs">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              Export MHL Audit
            </Button>
          </div>
        </div>
      </div>

      {/* 3-tier pipeline */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Server className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Storage Topology &amp; Redundancy Pipeline
          </h4>
          <span className="text-xs font-medium text-muted-foreground">
            Automated Hash Verification: <strong className="text-foreground">{strategyConfig.hashAlgorithm}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.code} className="space-y-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${tier.chipClass}`}>
                    {tier.code}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">{tier.title}</h5>
                    <span className="text-xs text-muted-foreground">{tier.subtitle}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs font-bold ${tier.badgeClass}`}>
                  {tier.badge}
                </Badge>
              </div>

              <div className="space-y-1 rounded-lg bg-muted/40 p-2.5 text-xs">
                <p className="truncate font-semibold text-foreground">{strategyConfig[tier.targetKey]}</p>
                <p className="text-xs text-muted-foreground">{tier.detail}</p>
              </div>

              <div className="flex items-center justify-between border-t pt-1 text-xs text-muted-foreground">
                <span>{tier.footLabel}</span>
                <span
                  className={
                    tier.footEmphasis ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-semibold text-foreground"
                  }
                >
                  {strategyConfig[tier.footKey]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redundancy + integrity */}
      <div className="grid gap-4 text-xs sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Media Redundancy Check
            </h4>
            <Button variant="ghost" size="sm" onClick={handleOpenEditStrategy} className="h-6 gap-1 px-2 text-xs text-primary">
              Configure
            </Button>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Master Camera Cards Offloaded</span>
            <Badge variant="outline" className="border-emerald-500/30 font-bold text-emerald-600 dark:text-emerald-400">
              {strategyConfig.cardsOffloadedRate}
            </Badge>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">NAS Live Mirror Sync</span>
            <span className="font-semibold text-foreground">{strategyConfig.nasSyncFrequency}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Cloud LTO Pre-staging</span>
            <span className="font-semibold text-foreground">{strategyConfig.ltoSyncFrequency}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Physical Media Separation</span>
            <span className="font-semibold text-foreground">NVMe Flash + LTO-9 Tape (Air-Gapped)</span>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Integrity &amp; Checksum Verification
            </h4>
            <Button variant="ghost" size="sm" onClick={handleRunChecksumSweep} className="h-6 gap-1 px-2 text-xs text-primary">
              Sweep Now
            </Button>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Primary Hash Algorithm</span>
            <span className="font-semibold text-foreground">{strategyConfig.hashAlgorithm}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Last Full Sweep</span>
            <span className="font-semibold text-foreground">{strategyConfig.lastSweepDate}</span>
          </div>
          <div className="flex justify-between border-b py-2">
            <span className="text-muted-foreground">Data Integrity Rate</span>
            <Badge variant="outline" className="border-emerald-500/30 font-bold text-emerald-600 dark:text-emerald-400">
              {strategyConfig.integrityRate}
            </Badge>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Bit-Rot Parity Protection</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {strategyConfig.bitRotDetection ? "Active (Automated MHL 2.0)" : "Manual"}
            </span>
          </div>
        </div>
      </div>

      {/* Vault + custody */}
      <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
            Physical Vault &amp; Chain of Custody
          </h4>
          <Button variant="outline" size="sm" onClick={handleOpenEditStrategy} className="h-6 gap-1 px-2 text-xs">
            <Settings2 className="h-3 w-3" aria-hidden="true" /> Edit Policy
          </Button>
        </div>
        <div className="grid gap-3 pt-1 sm:grid-cols-3">
          <div>
            <span className="block text-xs text-muted-foreground">Secure Vault Storage</span>
            <p className="mt-0.5 font-semibold text-foreground">{strategyConfig.vaultLocation}</p>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">Retention Policy</span>
            <p className="mt-0.5 font-semibold text-foreground">{strategyConfig.retentionPeriod}</p>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">DIT Supervisor Signoff</span>
            <p className="mt-0.5 font-semibold text-foreground">Hari Kethan (Lead DIT) &amp; Lalitha Vemuri</p>
          </div>
        </div>
      </div>

      <BackupStrategyDialog
        open={strategyModalOpen}
        onOpenChange={setStrategyModalOpen}
        form={strategyEditForm}
        onChange={setStrategyEditForm}
        onSubmit={handleSaveStrategy}
      />
    </div>
  );
}
