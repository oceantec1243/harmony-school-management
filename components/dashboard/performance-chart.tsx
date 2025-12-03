"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp } from "lucide-react"

type ChartData = {
  name: string
  francophone: number
  anglophone: number
}

export function PerformanceChart() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Get periods
        const { data: periods } = await supabase
          .from("academic_periods")
          .select("id, name, type")
          .order("number")
          .limit(6)

        if (!periods || periods.length === 0) {
          setData([])
          return
        }

        // Get grades with section info
        const { data: grades } = await supabase.from("grades").select(`
            score,
            academic_period_id,
            student:students(
              class:classes(
                section:sections(name)
              )
            )
          `)

        if (!grades) {
          setData([])
          return
        }

        // Calculate averages per period per section
        const chartData: ChartData[] = periods.map((period) => {
          const periodGrades = grades.filter((g: any) => g.academic_period_id === period.id)

          const francoGrades = periodGrades.filter((g: any) => g.student?.class?.section?.name === "Francophone")
          const angloGrades = periodGrades.filter((g: any) => g.student?.class?.section?.name === "Anglophone")

          const francoAvg =
            francoGrades.length > 0
              ? Math.round(
                  (francoGrades.reduce((sum: number, g: any) => sum + g.score, 0) / francoGrades.length) * 100,
                ) / 100
              : 0

          const angloAvg =
            angloGrades.length > 0
              ? Math.round((angloGrades.reduce((sum: number, g: any) => sum + g.score, 0) / angloGrades.length) * 100) /
                100
              : 0

          return {
            name: period.name.replace("Séquence ", "Seq ").replace("Trimestre ", "Trim "),
            francophone: francoAvg,
            anglophone: angloAvg,
          }
        })

        setData(chartData)
      } catch (error) {
        console.error("[v0] Error fetching performance data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution des Moyennes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Évolution des Moyennes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune donnée disponible
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" tick={{ fill: "currentColor" }} />
                <YAxis domain={[0, 20]} className="text-xs fill-muted-foreground" tick={{ fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="francophone"
                  name="Francophone"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="anglophone"
                  name="Anglophone"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
