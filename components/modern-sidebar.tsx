"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- MUDANÇA 1: Adicionar a propriedade 'clinicName' ---
interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  onSettingsClick?: () => void
  clinicName?: string // Adicionamos a nova propriedade aqui
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "schedule", label: "Agenda", icon: Calendar },
  { id: "funnel", label: "Funil", icon: TrendingUp },
  { id: "financial", label: "Financeiro", icon: DollarSign },
]

// --- MUDANÇA 2: Receber e usar a nova propriedade 'clinicName' ---
export function Sidebar({ activeView, onViewChange, onSettingsClick, clinicName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{clinicName || "Gennius Solutions"}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("ml-auto", collapsed && "mx-auto")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", collapsed ? "px-2" : "px-3", isActive && "font-medium")}
                onClick={() => {
                  onViewChange(item.id)
                  if (mobileOpen) setMobileOpen(false)
                }}
              >
                <Icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-3")} />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className={cn("w-full justify-start", collapsed ? "px-2" : "px-3")}
            onClick={onSettingsClick}
          >
            <Settings className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-3")} />
            {!collapsed && <span>Configurações</span>}
          </Button>
        </div>
      </div>

      {/* Content margin */}
      <div className={cn("transition-all duration-300 ease-in-out", collapsed ? "md:ml-16" : "md:ml-64")} />
    </>
  )
}