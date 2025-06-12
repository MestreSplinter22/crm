import type * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "info" | "pending" | "default" | "canceled"
}

export function StatusBadge({ className, variant = "default", ...props }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        "status-badge",
        {
          "status-badge-success": variant === "success",
          "status-badge-warning": variant === "warning",
          "status-badge-info": variant === "info",
          "status-badge-pending": variant === "pending",
          "status-badge-canceled": variant === "canceled",
          "bg-secondary text-secondary-foreground": variant === "default",
        },
        className,
      )}
      {...props}
    />
  )
}
