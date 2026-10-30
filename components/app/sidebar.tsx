"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation, isNavItemActive, type NavGroup, type NavItem } from "@/lib/navigation";
import { currentUser } from "@/lib/mock-data";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const displayName = user?.full_name ?? currentUser.name;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Clapperboard className="w-[18px] h-[18px] text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-accent-foreground tracking-tight whitespace-nowrap lowercase">
              harish
            </span>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-5 px-3">
            {navigation.map((group) => (
              <NavGroupSection
                key={group.title}
                group={group}
                collapsed={collapsed}
                pathname={pathname}
                canAccess={hasPermission}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
                <p className="text-xs text-sidebar-muted truncate">{user?.roles.map((role) => role.name).join(", ") || "Workspace member"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}

function NavGroupSection({
  group,
  collapsed,
  pathname,
  canAccess,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  canAccess: (permission: string) => boolean;
}) {
  const items = group.items.filter((item) => !item.permission || canAccess(item.permission));
  if (!items.length) return null;
  return (
    <div>
      {!collapsed && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted mb-2 px-2">
          {group.title}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} active={isNavItemActive(pathname, item.href)} />
        ))}
      </div>
    </div>
  );
}

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        collapsed && "justify-center px-2",
        active
          ? "bg-gradient-to-r from-amber-500/15 to-orange-600/10 text-amber-400"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("w-[18px] h-[18px] shrink-0", active && "text-amber-400")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
