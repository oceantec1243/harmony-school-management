"use client"

import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Award,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  TrendingUp,
  Award,
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  iconName: string
  iconColor?: string
  delay?: number
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  iconName,
  iconColor = "text-primary",
  delay = 0,
}: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  const Icon = iconMap[iconName] || Users

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-5 border border-border/50 shadow-sm",
        "hover:shadow-md hover:-translate-y-1 transition-all duration-300",
        "animate-slide-up",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground animate-count-up">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive && (
                <div className="flex items-center text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4 mr-0.5" />+{change}%
                </div>
              )}
              {isNegative && (
                <div className="flex items-center text-destructive text-sm font-medium">
                  <TrendingDown className="w-4 h-4 mr-0.5" />
                  {change}%
                </div>
              )}
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", "bg-primary/10")}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
    </div>
  )
}
