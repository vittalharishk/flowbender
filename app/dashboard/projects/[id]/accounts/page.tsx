"use client";

import { AccountsWorkspace } from "@/components/accounts/accounts-workspace";

export default function ProjectAccountsPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Project Budgets & Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Financial overview for this project — budget, department allocations, expenses and payments.
        </p>
      </div>
      <AccountsWorkspace projectId={id} />
    </div>
  );
}
