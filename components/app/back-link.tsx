import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href = "/dashboard", label = "Back to Dashboard" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
