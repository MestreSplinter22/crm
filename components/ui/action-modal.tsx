"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ActionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function ActionModal({ isOpen, onClose, title, children, footer, size = "md" }: ActionModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 mt-0 animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className={`bg-background rounded-lg shadow-xl w-full ${sizeClasses[size]} animate-scale max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </div>

        {/* Footer */}
        {footer && <div className="flex justify-end p-6 border-t border-border gap-2 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  )
}
