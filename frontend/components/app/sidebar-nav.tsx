"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation, isNavItemActive, type NavGroup, type NavItem } from "@/lib/navigation";
import { useAuth } from "@/components/auth-provider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const GROUPS_KEY = "flowbender.sidebar.closedGroups";

function readClosedGroups(): string[] {
  try {
    const raw = window.localStorage.getItem(GROUPS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeClosedGroups(groups: string[]) {
  try {
    window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    // storage unavailable; collapse state just won't persist
  }
}

export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="flowbender dashboard"
      className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20">
        <Clapperboard className="h-[18px] w-[18px] text-white" aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-lg font-bold lowercase tracking-tight text-sidebar-accent-foreground">flowbender</span>
          <span className="text-xs text-sidebar-muted">Production ERP</span>
        </span>
      )}
    </Link>
  );
}

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [closedGroups, setClosedGroups] = useState<string[]>([]);

  useEffect(() => setClosedGroups(readClosedGroups()), []);

  const toggleGroup = (title: string, open: boolean) => {
    setClosedGroups((prev) => {
      const next = open ? prev.filter((g) => g !== title) : [...prev, title];
      writeClosedGroups(next);
      return next;
    });
  };

  const groups = navigation
    .map((group) => ({ ...group, items: group.items.filter((i) => !i.permission || hasPermission(i.permission)) }))
    .filter((group) => group.items.length > 0);

  const activeHref = groups
    .flatMap((g) => g.items)
    .filter((item) => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Main navigation" className={cn("px-3", collapsed ? "space-y-2" : "space-y-4")}>
      {groups.map((group, index) =>
        collapsed ? (
          <div key={group.title} className={cn("space-y-1", index > 0 && "border-t border-sidebar-border pt-2")}>
            <ul className="space-y-1" aria-label={group.title}>
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} collapsed active={item.href === activeHref} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <NavGroupSection
            key={group.title}
            group={group}
            activeHref={activeHref}
            open={!closedGroups.includes(group.title) || group.items.some((i) => i.href === activeHref)}
            onOpenChange={(open) => toggleGroup(group.title, open)}
            onNavigate={onNavigate}
          />
        )
      )}
    </nav>
  );
}

function NavGroupSection({
  group,
  activeHref,
  open,
  onOpenChange,
  onNavigate,
}: {
  group: NavGroup;
  activeHref?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-muted transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
        {group.title}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=closed]:-rotate-90" aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-1 space-y-0.5">
          {group.items.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={item.href === activeHref} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavLink({
  item,
  active,
  collapsed = false,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        collapsed && "justify-center px-0",
        active
          ? "bg-amber-500/15 text-amber-400 before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-amber-500"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-amber-400")} aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
