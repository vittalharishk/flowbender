"use client";

import { Calculator } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { AccountsWorkspace } from "@/components/accounts/accounts-workspace";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        as="h1"
        icon={Calculator}
        title="Budgets & Accounts"
        description="Centralized financial overview across all projects — budgets, expenses, commitments and payments."
      />
      <AccountsWorkspace />
    </div>
  );
}
