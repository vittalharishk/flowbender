import {
  LayoutDashboard,
  Film,
  Users,
  UserCog,
  FileText,
  CalendarDays,
  Clapperboard,
  Wrench,
  FileCheck2,
  IndianRupee,
  Scissors,
  Megaphone,
  BarChart3,
  Settings,
  Zap,
  MapPin,
  HardDrive,
  CheckCircle,
  Globe,
  Calculator,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  permission?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Projects", href: "/dashboard/projects", icon: Film },
    ],
  },
  {
    title: "Production",
    items: [
      { label: "Scripts", href: "/scripts", icon: FileText, permission: "scenes.view" },
      { label: "Schedule", href: "/dashboard/schedule", icon: CalendarDays, permission: "schedule.view" },
      { label: "Cast", href: "/dashboard/cast", icon: Users, permission: "cast.view" },
      { label: "Crew", href: "/dashboard/crew", icon: UserCog, permission: "crew.view" },
      { label: "Production", href: "/dashboard/production", icon: Clapperboard, permission: "production.view" },
      { label: "Call Sheets", href: "/call-sheets", icon: FileCheck2, permission: "call_sheet.view" },
      { label: "Attendance", href: "/dashboard/attendance", icon: CheckCircle, permission: "production.view" },
      { label: "Locations", href: "/dashboard/locations", icon: MapPin, permission: "production.view" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Equipment", href: "/dashboard/equipment", icon: Wrench, permission: "production.view" },
      { label: "Media", href: "/dashboard/media", icon: HardDrive, permission: "production.view" },
      { label: "VFX", href: "/dashboard/vfx", icon: Zap, permission: "production.view" },
      { label: "Post Production", href: "/dashboard/post-production", icon: Scissors, permission: "post_production.view" },
      { label: "Subtitles", href: "/dashboard/subtitles", icon: Globe, permission: "post_production.view" },
      { label: "Distribution", href: "/dashboard/distribution", icon: Megaphone, permission: "distribution.view" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Budgets & Accounts", href: "/dashboard/accounts", icon: Calculator, permission: "finance.view" },
      { label: "Finance", href: "/dashboard/finance", icon: IndianRupee, permission: "finance.view" },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
];

export const allNavItems: NavItem[] = navigation.flatMap((g) => g.items);

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

const projectModuleTitles: Record<string, string> = {
  script: "Script", scenes: "Scenes", schedule: "Schedule", "call-sheets": "Call Sheets",
  cast: "Cast", crew: "Crew", production: "Production", accounts: "Budgets & Accounts", finance: "Finance",
  "post-production": "Post Production", "pre-production": "Pre-Production", distribution: "Distribution",
  vfx: "VFX", locations: "Locations", media: "Media", attendance: "Attendance", subtitles: "Subtitles",
  equipment: "Equipment",
};

const detailLabels: Record<string, string> = {
  cast: "Cast Member", crew: "Crew Member", scenes: "Scene", schedule: "Shoot Day",
  scripts: "Script", "call-sheets": "Call Sheet",
};

export interface Breadcrumb {
  label: string;
  href?: string;
}

export function getBreadcrumbs(pathname: string, projectName?: (id: string) => string | undefined): Breadcrumb[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  const crumbs: Breadcrumb[] = [{ label: "Dashboard", href: "/dashboard" }];
  if (path === "/dashboard") return [{ label: "Dashboard" }];

  const segments = path.split("/").filter(Boolean);
  const inDashboard = segments[0] === "dashboard";
  const rest = inDashboard ? segments.slice(1) : segments;

  if (rest[0] === "projects") {
    crumbs.push({ label: "Projects", href: "/dashboard/projects" });
    const id = rest[1];
    if (id === "new") crumbs.push({ label: "New Project" });
    else if (id) {
      const base = `/dashboard/projects/${id}`;
      crumbs.push({ label: projectName?.(id) ?? "Project", href: base });
      const mod = rest[2];
      if (mod) {
        crumbs.push({ label: projectModuleTitles[mod] ?? "Project", href: `${base}/${mod}` });
        if (rest[3]) crumbs.push({ label: detailLabels[mod] ?? "Details" });
      }
    }
  } else {
    const href = inDashboard ? `/dashboard/${rest[0]}` : `/${rest[0]}`;
    const item = allNavItems.find((n) => n.href === href);
    crumbs.push({ label: item?.label ?? projectModuleTitles[rest[0]] ?? "Workspace", href });
    if (rest[1]) crumbs.push({ label: detailLabels[rest[0]] ?? "Details" });
  }

  const last = crumbs[crumbs.length - 1];
  crumbs[crumbs.length - 1] = { label: last.label };
  return crumbs;
}

export function getSafeWorkspacePath(value: string | null): string {
  if (!value || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/dashboard";
  return /^\/(?:dashboard|scripts|call-sheets)(?:\/|\?|$)/.test(value) ? value : "/dashboard";
}
