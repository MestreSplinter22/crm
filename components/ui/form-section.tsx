"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h4 className="text-sm font-medium text-white">{title}</h4>}
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
