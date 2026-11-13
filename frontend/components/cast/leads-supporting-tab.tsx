"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { useCastMembers } from "@/lib/cast-store";
import { castCategoryLabels, castCategoryColors } from "@/lib/cast-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import type { CastMember, CastCategory } from "@/lib/types";

const CATEGORY_ORDER: CastCategory[] = ["lead", "supporting", "character-artist", "guest", "child-artist"];

export function LeadsSupportingTab({ projectId }: { projectId?: string }) {
  const allMembers = useCastMembers();

  const members = useMemo(
    () => (projectId ? allMembers.filter((m) => m.projectId === projectId) : allMembers),
    [allMembers, projectId]
  );

  const grouped = useMemo(() => {
    const map = new Map<CastCategory, CastMember[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const m of members) {
      const list = map.get(m.category);
      if (list) list.push(m);
      else {
        const existing = map.get("guest") || [];
        existing.push(m);
        map.set("guest", existing);
      }
    }
    return map;
  }, [members]);

  if (members.length === 0) {
    return <EmptyState title="No cast members" description="Add cast members to see the classification." icon={Users} />;
  }

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((cat) => {
        const list = grouped.get(cat) || [];
        if (list.length === 0) return null;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-semibold">{castCategoryLabels[cat]}</p>
              <Badge variant="outline" className="text-xs">{list.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {m.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.character}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge className={`text-[10px] px-1.5 py-0 ${castCategoryColors[m.category] || ""}`}>
                            {castCategoryLabels[m.category]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{m.projectTitle}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
