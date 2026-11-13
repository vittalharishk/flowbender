"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  Search,
  LogOut,
  User,
  Command as CommandIcon,
  ArrowRight,
  Film as FilmIcon,
  Clapperboard,
  Sun,
  Moon,
  PlusCircle,
  FileText,
  FileCheck2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Fragment } from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { allNavItems, getBreadcrumbs } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProjects } from "@/lib/project-store";
import { currentUser } from "@/lib/mock-data";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsDropdown } from "./notifications-dropdown";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DigitalClapperboardModal } from "@/components/production/digital-clapperboard-modal";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

interface HeaderProps {
  onMobileMenuOpen: () => void;
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onMobileMenuOpen, onSidebarToggle, sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [slateOpen, setSlateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const projects = useProjects();
  const breadcrumbs = getBreadcrumbs(pathname, (id) => projects.find((p) => p.id === id)?.title);

  // Active project context for the clapperboard slate
  const projectMatch = pathname.match(/\/dashboard\/projects\/([^\/]+)/);
  const activeProjectId = projectMatch ? projectMatch[1] : undefined;
  const activeProject = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K: Spotlight Command Palette
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      // Alt + S: Open Clapperboard Slate
      if (event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setSlateOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-3 backdrop-blur-lg sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 lg:hidden"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-9 w-9 shrink-0 lg:inline-flex"
          onClick={onSidebarToggle}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${i}`}>
                  {i > 0 && <BreadcrumbSeparator className={cn(!isLast && i < breadcrumbs.length - 2 && "hidden md:block")} />}
                  <BreadcrumbItem className={cn("min-w-0", !isLast && "hidden md:inline-flex", i === breadcrumbs.length - 2 && "sm:inline-flex")}>
                    {crumb.href && !isLast ? (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href} className="max-w-[160px] truncate">{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="truncate text-base font-semibold sm:text-lg">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Spotlight Command Palette trigger */}
        <Button
          variant="outline"
          className="hidden h-9 w-[220px] justify-between text-muted-foreground sm:flex shadow-sm hover:border-primary/40 transition-colors"
          onClick={() => setCommandOpen(true)}
        >
          <span className="flex items-center gap-2 text-xs">
            <Search className="h-3.5 w-3.5 text-primary" /> Search flowbender...
          </span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </Button>

        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search flowbender"
          className="h-9 w-9 sm:hidden"
          onClick={() => setCommandOpen(true)}
        >
          <CommandIcon className="h-[18px] w-[18px]" />
        </Button>

        {/* DIGITAL CLAPPERBOARD LAUNCH BUTTON */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSlateOpen(true)}
          className="hidden h-9 gap-1.5 border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-600 shadow-sm transition-all active:scale-95 hover:border-amber-500/60 hover:bg-amber-500/20 dark:text-amber-400 sm:inline-flex sm:px-3"
          title="Open Digital Clapperboard Cinema Slate (Alt+S)"
        >
          <Clapperboard className="h-4 w-4 text-amber-500 animate-pulse" />
          <span className="hidden md:inline">Slate</span>
        </Button>

        <ThemeToggle />

        <NotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" aria-label="Account menu" className="h-9 gap-2 pl-2 pr-3 ml-1">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-medium">
                  {getInitials(user?.full_name ?? currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{user?.full_name ?? currentUser.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.full_name ?? currentUser.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email ?? currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-400" onClick={() => void logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* SPOTLIGHT COMMAND PALETTE */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogTitle className="sr-only">Spotlight command palette</DialogTitle>
        <CommandInput placeholder="Type a command, project, or department..." />
        <CommandList className="max-h-[380px] p-1">
          <CommandEmpty>No matching command or project found.</CommandEmpty>

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            <CommandItem
              value="open digital clapperboard cinema slate mark take"
              onSelect={() => {
                setCommandOpen(false);
                setSlateOpen(true);
              }}
              className="cursor-pointer py-2.5 font-medium"
            >
              <Clapperboard className="mr-2 h-4 w-4 text-amber-500" />
              <span>Open Digital Clapperboard Slate</span>
              <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-amber-500">
                Alt+S
              </kbd>
            </CommandItem>

            <CommandItem
              value="toggle dark light theme mode appearance"
              onSelect={() => {
                setCommandOpen(false);
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }}
              className="cursor-pointer py-2"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="mr-2 h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="mr-2 h-4 w-4 text-indigo-400" />
              )}
              <span>Toggle Dark / Light Theme</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {resolvedTheme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </span>
            </CommandItem>

            <CommandItem
              value="create new film project add"
              onSelect={() => {
                setCommandOpen(false);
                router.push("/dashboard/projects/new");
              }}
              className="cursor-pointer py-2"
            >
              <PlusCircle className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Create New Film Project</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </CommandItem>

            <CommandItem
              value="screenplay scripts reader dialogue breakdown fdx fountain"
              onSelect={() => {
                setCommandOpen(false);
                router.push("/scripts");
              }}
              className="cursor-pointer py-2"
            >
              <FileText className="mr-2 h-4 w-4 text-blue-400" />
              <span>Screenplay Ingest & Dialogue Analyzer</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </CommandItem>

            <CommandItem
              value="call sheets dispatch dpr schedule"
              onSelect={() => {
                setCommandOpen(false);
                router.push("/call-sheets");
              }}
              className="cursor-pointer py-2"
            >
              <FileCheck2 className="mr-2 h-4 w-4 text-purple-400" />
              <span>Production Call Sheets</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </CommandItem>
          </CommandGroup>

          {/* Active Film Projects */}
          <CommandGroup heading="Projects">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={`project ${project.title} ${project.director} ${project.status}`}
                onSelect={() => {
                  setCommandOpen(false);
                  router.push(`/dashboard/projects/${project.id}`);
                }}
                className="cursor-pointer py-2"
              >
                <FilmIcon className="mr-2 h-4 w-4 text-amber-500" />
                <span className="font-semibold">{project.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">({project.director})</span>
                <span className="ml-auto text-[11px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {project.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Department Workspaces */}
          <CommandGroup heading="Workspaces">
            {allNavItems
              .filter((item) => !item.permission || hasPermission(item.permission))
              .map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  onSelect={() => {
                    setCommandOpen(false);
                    router.push(item.href);
                  }}
                  className="cursor-pointer py-2"
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* DIGITAL CLAPPERBOARD MODAL */}
      <DigitalClapperboardModal
        open={slateOpen}
        onOpenChange={setSlateOpen}
        defaultProjectId={activeProjectId}
        defaultProjectTitle={activeProject?.title}
        defaultDirector={activeProject?.director}
      />

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your profile</DialogTitle>
            <DialogDescription>
              Your current workspace account. Contact your administrator to change account details.
            </DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{user?.full_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Roles</dt>
              <dd>{user?.roles.map((role) => role.name).join(", ") || "No roles assigned"}</dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
    </header>
  );
}
