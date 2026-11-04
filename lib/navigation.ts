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
    title: "Talent",
    items: [
      { label: "Cast", href: "/dashboard/cast", icon: Users, permission: "cast.view" },
      { label: "Crew", href: "/dashboard/crew", icon: UserCog, permission: "crew.view" },
    ],
  },
  {
    title: "Production",
    items: [
      { label: "Scripts", href: "/scripts", icon: FileText, permission: "scenes.view" },
      { label: "Schedule", href: "/dashboard/schedule", icon: CalendarDays, permission: "schedule.view" },
      { label: "Production", href: "/dashboard/production", icon: Clapperboard, permission: "production.view" },
      { label: "Attendance", href: "/dashboard/attendance", icon: CheckCircle, permission: "production.view" },
      { label: "Equipment", href: "/dashboard/equipment", icon: Wrench, permission: "production.view" },
      { label: "Media", href: "/dashboard/media", icon: HardDrive, permission: "production.view" },
      { label: "VFX", href: "/dashboard/vfx", icon: Zap, permission: "production.view" },
      { label: "Locations", href: "/dashboard/locations", icon: MapPin, permission: "production.view" },
      { label: "Call Sheets", href: "/call-sheets", icon: FileCheck2, permission: "call_sheet.view" },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Budgets & Accounts", href: "/dashboard/accounts", icon: Calculator, permission: "finance.view" },
      { label: "Finance", href: "/dashboard/finance", icon: IndianRupee, permission: "finance.view" },
      { label: "Post Production", href: "/dashboard/post-production", icon: Scissors, permission: "post_production.view" },
      { label: "Subtitles", href: "/dashboard/subtitles", icon: Globe, permission: "post_production.view" },
      { label: "Distribution", href: "/dashboard/distribution", icon: Megaphone, permission: "distribution.view" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3, permission: "reports.view" },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const allNavItems: NavItem[] = navigation.flatMap((g) => g.items);

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function getWorkspaceTitle(pathname: string): string {
  if (pathname === "/dashboard/projects/new") return "New Project";
  const projectModule = pathname.match(/^\/dashboard\/projects\/[^/]+\/([^/]+)/)?.[1];
  if (projectModule) {
    const titles: Record<string, string> = {
      script: "Script", scenes: "Scenes", schedule: "Schedule", "call-sheets": "Call Sheets",
      cast: "Cast", crew: "Crew", production: "Production", accounts: "Budgets & Accounts", finance: "Finance",
      "post-production": "Post Production", distribution: "Distribution",
      vfx: "VFX", locations: "Locations", media: "Media", attendance: "Attendance", subtitles: "Subtitles",
      equipment: "Equipment",
    };
    return titles[projectModule] ?? "Project";
  }
  return [...allNavItems].sort((a, b) => b.href.length - a.href.length)
    .find((item) => isNavItemActive(pathname, item.href))?.label ?? "Workspace";
}

export function getSafeWorkspacePath(value: string | null): string {
  if (!value || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "/dashboard";
  return /^\/(?:dashboard|scripts|call-sheets)(?:\/|\?|$)/.test(value) ? value : "/dashboard";
}
