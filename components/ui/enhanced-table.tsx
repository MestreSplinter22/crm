"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface EnhancedTableProps {
  children: ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  className?: string
}

export function EnhancedTable({
  children,
  searchable = false,
  searchPlaceholder = "Buscar...",
  onSearch,
  className,
}: EnhancedTableProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">{children}</div>
    </div>
  )
}
