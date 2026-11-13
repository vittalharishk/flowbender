import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  neutral: "border-border bg-muted text-muted-foreground",
};

const statusTones: Record<string, StatusTone> = {
  active: "success", signed: "success", completed: "success", complete: "success", done: "success",
  approved: "success", paid: "success", delivered: "success", confirmed: "success", released: "success",
  present: "success", available: "success", settled: "success", final: "success", locked: "success",
  pending: "warning", negotiating: "warning", "in-progress": "warning", in_progress: "warning",
  "in progress": "warning", review: "warning", "in-review": "warning", partial: "warning",
  "partially-paid": "warning", scheduled: "warning", late: "warning", "on-hold": "warning", allocated: "warning",
  overdue: "error", terminated: "error", cancelled: "error", canceled: "error", rejected: "error",
  failed: "error", absent: "error", expired: "neutral", closed: "neutral", archived: "neutral",
  draft: "info", planned: "info", planning: "info", open: "info", new: "info", "not-started": "info",
};

export function getStatusTone(status: string): StatusTone {
  return statusTones[status.trim().toLowerCase()] ?? "neutral";
}

function formatStatus(status: string) {
  return status.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
  tone?: StatusTone;
  label?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, tone, label, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", toneClasses[tone ?? getStatusTone(status)], className)}>
      {label ?? formatStatus(status)}
    </Badge>
  );
}
