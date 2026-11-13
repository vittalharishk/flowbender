"use client";

import { Calculator } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { AccountsWorkspace } from "@/components/accounts/accounts-workspace";

export default function ProjectAccountsPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calculator}
        title="Project Budgets & Accounts"
        description="Financial overview for this project — budget, department allocations, expenses and payments."
      />
      <AccountsWorkspace projectId={id} />
    </div>
  );
}
