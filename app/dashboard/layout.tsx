"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/app/sidebar";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import { Header } from "@/components/app/header";
import { useAuth } from "@/components/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import "@/lib/persistence-bootstrap";
import { isDemoMode } from "@/lib/auth-client";

const COLLAPSED_KEY = "flowbender.sidebar.collapsed";

function WorkspaceSkeleton() {
  return (
    <div role="status" aria-label="Loading your workspace" className="flex min-h-screen bg-background">
      <div className="hidden w-[260px] shrink-0 border-r bg-sidebar lg:block" />
      <div className="flex-1">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="ml-auto h-9 w-56" />
        </div>
        <div className="mx-auto max-w-[1400px] space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
      <span className="sr-only">Loading your workspace...</span>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // storage unavailable; default to expanded
    }
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [loading, user, router]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable; preference just won't persist
      }
      return next;
    });
  };

  if (loading || !user) return <WorkspaceSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-amber-500"
      >
        Skip to main content
      </a>

      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className={cn("flex min-h-screen min-w-0 flex-col transition-[margin] duration-300", collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]")}>
        <Header
          onMobileMenuOpen={() => setMobileOpen(true)}
          onSidebarToggle={toggleCollapsed}
          sidebarCollapsed={collapsed}
        />
        <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col overflow-x-hidden focus:outline-none">
          {isDemoMode && (
            <div role="note" className="border-b bg-amber-500/5 px-4 py-2 text-xs text-muted-foreground sm:px-6">
              Demo workspace: sample planning data, not verified production records. Changes stay in this browser; no payments or messages are sent.
            </div>
          )}
          <div className="mx-auto w-full max-w-[1400px] flex-1 p-3 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
