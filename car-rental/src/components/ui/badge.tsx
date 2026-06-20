"use client";

import { cn, getStatusColor, getStatusLabel } from "@/lib/utils";

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
        getStatusColor(status)
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {getStatusLabel(status)}
    </span>
  );
}
