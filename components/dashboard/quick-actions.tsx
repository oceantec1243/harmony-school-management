"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { ClipboardList, FileText, UserPlus, BarChart3, ArrowRight } from "lucide-react"

const actions = [
  {
    title: "Saisir des notes",
    description: "Entrer les notes des élèves",
    href: "/grades",
    icon: ClipboardList,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Générer un bordereau",
    description: "Créer un bordereau de notes",
    href: "/reports/bordereaux",
    icon: FileText,
    color: "bg-secondary/10 text-secondary",
  },
  {
    title: "Ajouter un élève",
    description: "Inscrire un nouvel élève",
    href: "/students/new",
    icon: UserPlus,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Voir les statistiques",
    description: "Analyser les performances",
    href: "/statistics",
    icon: BarChart3,
    color: "bg-success/10 text-success",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <Link
          key={action.title}
          href={action.href}
          className={cn(
            "group flex items-center gap-4 p-4 rounded-xl border border-border/50",
            "bg-card hover:bg-muted/50 transition-all duration-200",
            "hover:shadow-md hover:-translate-y-0.5",
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", action.color)}>
            <action.icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{action.description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      ))}
    </div>
  )
}
