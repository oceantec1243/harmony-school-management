"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentAvatar } from "@/components/students/student-avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Trophy } from "lucide-react"

type TopStudent = {
  student: {
    id: string
    first_name: string
    last_name: string
    matricule: string
    class?: { name: string }
  }
  average: number
  rank: number
}

export function TopStudents() {
  const [loading, setLoading] = useState(true)
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])

  useEffect(() => {
    async function fetchTopStudents() {
      const supabase = createClient()
      setLoading(true)
      try {
        // Get most recent period
        const { data: period } = await supabase
          .from("academic_periods")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (!period) {
          setTopStudents([])
          return
        }

        // Get all grades for this period with student info
        const { data: grades } = await supabase
          .from("grades")
          .select(`
            student_id,
            score,
            coefficient,
            student:students(
              id,
              first_name,
              last_name,
              matricule,
              class:classes(name)
            )
          `)
          .eq("academic_period_id", period.id)

        if (!grades || grades.length === 0) {
          setTopStudents([])
          return
        }

        // Calculate average for each student
        const studentAverages: Record<string, { student: any; totalWeighted: number; totalCoef: number }> = {}

        grades.forEach((g: any) => {
          if (!g.student) return
          if (!studentAverages[g.student_id]) {
            studentAverages[g.student_id] = {
              student: g.student,
              totalWeighted: 0,
              totalCoef: 0,
            }
          }
          studentAverages[g.student_id].totalWeighted += g.score * g.coefficient
          studentAverages[g.student_id].totalCoef += g.coefficient
        })

        const results = Object.entries(studentAverages)
          .map(([id, data]) => ({
            student: data.student,
            average: data.totalCoef > 0 ? Math.round((data.totalWeighted / data.totalCoef) * 100) / 100 : 0,
            rank: 0,
          }))
          .sort((a, b) => b.average - a.average)
          .slice(0, 5)

        // Add ranks
        let currentRank = 1
        results.forEach((r, index) => {
          if (index > 0 && r.average < results[index - 1].average) {
            currentRank = index + 1
          }
          r.rank = currentRank
        })

        setTopStudents(results)
      } catch (error) {
        console.error("[v0] Error fetching top students:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTopStudents()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Meilleurs Élèves
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Meilleurs Élèves
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topStudents.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Aucune donnée disponible</p>
        ) : (
          topStudents.map((item) => (
            <div
              key={item.student.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                "hover:bg-muted/50",
                item.rank === 1 && "bg-gradient-to-r from-amber-50 to-transparent border border-amber-200",
                item.rank === 2 && "bg-gradient-to-r from-slate-50 to-transparent",
                item.rank === 3 && "bg-gradient-to-r from-orange-50 to-transparent",
              )}
            >
              <div className="w-8 h-8 flex items-center justify-center font-bold text-lg">
                {item.rank === 1 && <span className="text-2xl">🥇</span>}
                {item.rank === 2 && <span className="text-2xl">🥈</span>}
                {item.rank === 3 && <span className="text-2xl">🥉</span>}
                {item.rank > 3 && <span className="text-muted-foreground">{item.rank}</span>}
              </div>
              <StudentAvatar firstName={item.student.first_name} lastName={item.student.last_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {item.student.first_name} {item.student.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{item.student.class?.name || "N/A"}</p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "font-mono font-bold",
                  item.average >= 16 && "bg-emerald-100 text-emerald-700",
                  item.average >= 14 && item.average < 16 && "bg-blue-100 text-blue-700",
                  item.average >= 10 && item.average < 14 && "bg-amber-100 text-amber-700",
                )}
              >
                {item.average.toFixed(2)}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
