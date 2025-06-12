import type * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number
  label: string
  icon?: React.ReactNode
  variant?: "default" | "primary" | "success" | "warning" | "info"
}

export function StatCard({ className, value, label, icon, variant = "default", ...props }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden card-hover", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p
              className={cn("text-2xl font-bold mt-1", {
                "text-foreground": variant === "default",
                "text-primary": variant === "primary",
                "text-success-foreground": variant === "success",
                "text-warning-foreground": variant === "warning",
                "text-info-foreground": variant === "info",
              })}
            >
              {value}
            </p>
          </div>
          {icon && (
            <div
              className={cn("p-2 rounded-full", {
                "bg-secondary": variant === "default",
                "bg-primary/10": variant === "primary",
                "bg-success-muted": variant === "success",
                "bg-warning-muted": variant === "warning",
                "bg-info-muted": variant === "info",
              })}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
