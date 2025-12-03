"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ClipboardList, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

type Activity = {
  id: string
  type: "grade" | "student" | "class"
  message: string
  time: Date
  icon: any
  color: string
}

export function RecentActivity() {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true)
      try {
        const allActivities: Activity[] = []

        // Fetch recent grades
        const { data: recentGrades } = await supabase
          .from("grades")
          .select(`
            id, created_at,
            student:students(first_name, last_name, class:classes(name)),
            subject:subjects(name)
          `)
          .order("created_at", { ascending: false })
          .limit(3)

        if (recentGrades) {
          recentGrades.forEach((g: any) => {
            allActivities.push({
              id: `grade-${g.id}`,
              type: "grade",
              message: `Note de ${g.subject?.name || "matière"} saisie pour ${g.student?.first_name || ""} ${g.student?.last_name || ""} (${g.student?.class?.name || ""})`,
              time: new Date(g.created_at),
              icon: ClipboardList,
              color: "text-primary",
            })
          })
        }

        // Fetch recent students
        const { data: recentStudents } = await supabase
          .from("students")
          .select(`
            id, first_name, last_name, created_at,
            class:classes(name)
          `)
          .order("created_at", { ascending: false })
          .limit(2)

        if (recentStudents) {
          recentStudents.forEach((s: any) => {
            allActivities.push({
              id: `student-${s.id}`,
              type: "student",
              message: `${s.first_name} ${s.last_name} inscrit en ${s.class?.name || "classe"}`,
              time: new Date(s.created_at),
              icon: UserPlus,
              color: "text-emerald-500",
            })
          })
        }

        // Sort by time and take top 5
        allActivities.sort((a, b) => b.time.getTime() - a.time.getTime())
        setActivities(allActivities.slice(0, 5))
      } catch (error) {
        console.error("[v0] Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Aucune activité récente</div>
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl",
            "hover:bg-muted/50 transition-colors cursor-pointer",
            "animate-slide-up",
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              activity.type === "grade" && "bg-primary/10",
              activity.type === "student" && "bg-emerald-500/10",
              activity.type === "class" && "bg-secondary/10",
            )}
          >
            <activity.icon className={cn("w-5 h-5", activity.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-2">{activity.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(activity.time, { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
