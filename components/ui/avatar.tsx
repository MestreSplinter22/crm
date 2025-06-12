import type * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  initials?: string
}

export function Avatar({ className, size = "md", initials, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  return (
    <div className={cn("avatar", sizeClasses[size], className)} {...props}>
      {initials}
    </div>
  )
}
