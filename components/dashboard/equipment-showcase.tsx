"use client";

import Link from "next/link";
import { Camera, CheckCircle2, HardHat, Mic2, MoreHorizontal, Wrench } from "lucide-react";
import { useAppDataSlice } from "@/lib/app-data-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEquipmentImage, getEquipmentFallback } from "@/lib/equipment-image-references";

const categoryIcons: Record<string, typeof Camera> = {
  camera: Camera,
  sound: Mic2,
  lighting: HardHat,
  default: MoreHorizontal,
};

const statusLabels: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  "in-use": "In use",
  maintenance: "Maintenance",
};

const statusBadgeStyles: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  reserved: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  "in-use": "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  maintenance: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
};

export function EquipmentShowcase() {
  const equipment = useAppDataSlice("equipmentInventory");
  const totalUnits = equipment.reduce((sum, item) => sum + item.quantity, 0);
  const availableUnits = equipment
    .filter((item) => item.status === "available")
    .reduce((sum, item) => sum + item.quantity, 0);
  const categoryCounts = equipment.reduce<Record<string, number>>((counts, item) => {
    counts[item.category] = (counts[item.category] ?? 0) + item.quantity;
    return counts;
  }, {});
  const statusCounts = equipment.reduce<Record<string, number>>((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + item.quantity;
    return counts;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-primary" /> Equipment at a glance
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Track what the production house owns, rents, and has ready for set.
          </p>
        </div>
        <Link
          href="/dashboard/equipment"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Open inventory →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Summary label="Total units" value={totalUnits} />
          <Summary
            label="Available"
            value={availableUnits}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <Summary
            label="In use"
            value={statusCounts["in-use"] ?? 0}
            tone="text-blue-600 dark:text-blue-400"
          />
          <Summary
            label="Maintenance"
            value={statusCounts.maintenance ?? 0}
            tone="text-amber-600 dark:text-amber-400"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(categoryCounts).map(([category, count]) => {
            const Icon = categoryIcons[category] ?? categoryIcons.default;
            return (
              <div
                key={category}
                className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3"
              >
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {category}
                  </p>
                  <p className="text-lg font-semibold">
                    {count}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      units
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="divide-y rounded-xl border overflow-hidden">
          {equipment.slice(0, 6).map((item) => {
            const imageUrl = getEquipmentImage(item);
            const fallbackUrl = getEquipmentFallback(item.category);
            const badgeStyle =
              statusBadgeStyles[item.status] ?? statusBadgeStyles.available;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={imageUrl}
                    alt={item.name}
                    onError={(e) => {
                      if (e.currentTarget.dataset.fallbackApplied) return;
                      e.currentTarget.dataset.fallbackApplied = "true";
                      e.currentTarget.src = fallbackUrl;
                    }}
                    className="h-10 w-12 rounded object-cover border shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.quantity === 1 ? "unit" : "units"} ·{" "}
                      <span className="capitalize">{item.category}</span>
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle}`}
                >
                  {statusLabels[item.status] ?? item.status}
                </span>
              </div>
            );
          })}
          {!equipment.length && (
            <p className="p-4 text-sm text-muted-foreground">
              No equipment has been added yet.
            </p>
          )}
        </div>

        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Inventory figures
          are workspace planning data. Click &quot;Open inventory&quot; to browse all {equipment.length} items.
        </p>
      </CardContent>
    </Card>
  );
}

function Summary({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
