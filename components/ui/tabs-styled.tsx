import type * as React from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface StyledTabsProps extends React.ComponentProps<typeof Tabs> {
  tabStyle?: "pills" | "underline" | "minimal"
  size?: "sm" | "md" | "lg"
}

export function StyledTabs({ className, tabStyle = "pills", size = "md", ...props }: StyledTabsProps) {
  return <Tabs className={cn("w-full", className)} {...props} />
}

export interface StyledTabsListProps extends React.ComponentProps<typeof TabsList> {
  tabStyle?: "pills" | "underline" | "minimal"
  size?: "sm" | "md" | "lg"
}

export function StyledTabsList({ className, tabStyle = "pills", size = "md", ...props }: StyledTabsListProps) {
  return (
    <TabsList
      className={cn(
        "tab-transition",
        {
          // Pills style
          "bg-transparent p-1 gap-2": tabStyle === "pills",
          // Underline style
          "bg-transparent border-b border-border w-full justify-start gap-4": tabStyle === "underline",
          // Minimal style
          "bg-transparent p-0 gap-4": tabStyle === "minimal",
        },
        {
          // Size variants
          "h-9": size === "sm",
          "h-10": size === "md",
          "h-11": size === "lg",
        },
        className,
      )}
      {...props}
    />
  )
}

export interface StyledTabsTriggerProps extends React.ComponentProps<typeof TabsTrigger> {
  tabStyle?: "pills" | "underline" | "minimal"
  size?: "sm" | "md" | "lg"
  icon?: React.ReactNode
  count?: number
}

export function StyledTabsTrigger({
  className,
  tabStyle = "pills",
  size = "md",
  icon,
  count,
  children,
  ...props
}: StyledTabsTriggerProps) {
  return (
    <TabsTrigger
      className={cn(
        "tab-transition flex items-center gap-2",
        {
          // Pills style
          "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md": tabStyle === "pills",
          // Underline style
          "rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 data-[state=active]:border-primary data-[state=active]:text-primary":
            tabStyle === "underline",
          // Minimal style
          "rounded-md bg-transparent hover:bg-secondary/50 data-[state=active]:bg-secondary data-[state=active]:text-foreground":
            tabStyle === "minimal",
        },
        {
          // Size variants
          "text-xs px-2.5": size === "sm",
          "text-sm px-3": size === "md",
          "text-base px-4": size === "lg",
        },
        className,
      )}
      {...props}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={cn("inline-flex items-center justify-center rounded-full text-xs", {
            "bg-primary/10 text-primary px-1.5 min-w-[1.25rem]":
              tabStyle !== "pills" || props["data-state"] !== "active",
            "bg-primary-foreground/20 text-primary-foreground px-1.5 min-w-[1.25rem]":
              tabStyle === "pills" && props["data-state"] === "active",
          })}
        >
          {count}
        </span>
      )}
    </TabsTrigger>
  )
}

export { TabsContent }
