"use client";

import { AccountsWorkspace } from "@/components/accounts/accounts-workspace";

export default function AccountsPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets & Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Centralized financial overview across all projects — budgets, expenses, commitments and payments.
        </p>
      </div>
      <AccountsWorkspace />
    </div>
  );
}
