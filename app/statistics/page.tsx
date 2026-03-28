"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Download, TrendingUp, Users, Award, Target, GraduationCap, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState("2024-2025")
  const [selectedSection, setSelectedSection] = useState("all")

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalTeachers: 0,
    passRate: 0,
    schoolAverage: 0,
    excellenceCount: 0,
    honorCount: 0,
  })

  const [sectionData, setSectionData] = useState<Array<{ name: string; value: number; color: string }>>([])
  const [genderData, setGenderData] = useState<Array<{ name: string; value: number; color: string }>>([])
  const [levelPerformance, setLevelPerformance] = useState<
    Array<{ level: string; average: number; passRate: number; count: number }>
  >([])
  const [gradeDistribution, setGradeDistribution] = useState<Array<{ range: string; count: number; color: string }>>([])
  const [subjectPerformance, setSubjectPerformance] = useState<
    Array<{ subject: string; average: number; count: number }>
  >([])

  useEffect(() => {
    async function fetchStatistics() {
      const supabase = createClient()
      setLoading(true)
      try {
        // Fetch counts
        const [studentsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
          supabase
            .from("students")
            .select("id, gender, class_id, class:classes(level:levels(name), section:sections(name))", {
              count: "exact",
            })
            .eq("status", "Active"),
          supabase.from("classes").select("*", { count: "exact" }),
          supabase.from("subjects").select("*", { count: "exact" }),
          supabase.from("teachers").select("*", { count: "exact" }).eq("status", "active"),
        ])

        const students = studentsRes.data || []

        // Calculate section distribution
        const francophone = students.filter((s: any) => s.class?.section?.name === "Francophone").length
        const anglophone = students.filter((s: any) => s.class?.section?.name === "Anglophone").length
        setSectionData([
          { name: "Francophone", value: francophone, color: "#1E40AF" },
          { name: "Anglophone", value: anglophone, color: "#7C3AED" },
        ])

        // Calculate gender distribution
        const males = students.filter((s: any) => s.gender === "M").length
        const females = students.filter((s: any) => s.gender === "F").length
        setGenderData([
          { name: "Garçons", value: males, color: "#06B6D4" },
          { name: "Filles", value: females, color: "#EC4899" },
        ])

        // Fetch grades for statistics
        const { data: grades } = await supabase.from("grades").select(`
          score, coefficient, student_id,
          student:students(id, class:classes(level:levels(name)))
        `)

        let passRate = 0
        let schoolAverage = 0
        let excellenceCount = 0
        let honorCount = 0

        if (grades && grades.length > 0) {
          const passing = grades.filter((g) => g.score >= 10).length
          passRate = Math.round((passing / grades.length) * 100)
          schoolAverage = grades.reduce((sum, g) => sum + g.score, 0) / grades.length
          excellenceCount = grades.filter((g) => g.score >= 16).length
          honorCount = grades.filter((g) => g.score >= 14 && g.score < 16).length

          // Grade distribution
          const ranges = [
            { range: "0-5", min: 0, max: 5, color: "#DC2626" },
            { range: "5-8", min: 5, max: 8, color: "#F97316" },
            { range: "8-10", min: 8, max: 10, color: "#EAB308" },
            { range: "10-12", min: 10, max: 12, color: "#22C55E" },
            { range: "12-14", min: 12, max: 14, color: "#06B6D4" },
            { range: "14-16", min: 14, max: 16, color: "#3B82F6" },
            { range: "16-18", min: 16, max: 18, color: "#8B5CF6" },
            { range: "18-20", min: 18, max: 20, color: "#EC4899" },
          ]
          setGradeDistribution(
            ranges.map((r) => ({
              ...r,
              count: grades.filter((g) => g.score >= r.min && g.score < r.max).length,
            })),
          )

          // Level performance
          const levelMap: Record<string, { total: number; count: number; passing: number }> = {}
          grades.forEach((g: any) => {
            const levelName = g.student?.class?.level?.name || "Inconnu"
            if (!levelMap[levelName]) levelMap[levelName] = { total: 0, count: 0, passing: 0 }
            levelMap[levelName].total += g.score
            levelMap[levelName].count++
            if (g.score >= 10) levelMap[levelName].passing++
          })
          setLevelPerformance(
            Object.entries(levelMap).map(([level, data]) => ({
              level,
              average: Math.round((data.total / data.count) * 100) / 100,
              passRate: Math.round((data.passing / data.count) * 100),
              count: data.count,
            })),
          )
        }

        // Subject performance
        const { data: subjectGrades } = await supabase.from("grades").select(`
          score, subject:subjects(name)
        `)

        if (subjectGrades) {
          const subjectMap: Record<string, { total: number; count: number }> = {}
          subjectGrades.forEach((g: any) => {
            const name = g.subject?.name || "Inconnu"
            if (!subjectMap[name]) subjectMap[name] = { total: 0, count: 0 }
            subjectMap[name].total += g.score
            subjectMap[name].count++
          })
          setSubjectPerformance(
            Object.entries(subjectMap)
              .map(([subject, data]) => ({
                subject,
                average: Math.round((data.total / data.count) * 100) / 100,
                count: data.count,
              }))
              .sort((a, b) => b.average - a.average)
              .slice(0, 10),
          )
        }

        setStats({
          totalStudents: studentsRes.count || 0,
          totalClasses: classesRes.count || 0,
          totalSubjects: subjectsRes.count || 0,
          totalTeachers: teachersRes.count || 0,
          passRate,
          schoolAverage: Math.round(schoolAverage * 100) / 100,
          excellenceCount,
          honorCount,
        })
      } catch (error) {
        console.error("[v0] Error fetching statistics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStatistics()
  }, [selectedYear, selectedSection])

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Statistiques & Analyses" description="Chargement..." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Statistiques & Analyses"
        description="Visualisez les performances et tendances de votre établissement"
      >
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter le rapport
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-2025">2024-2025</SelectItem>
            <SelectItem value="2023-2024">2023-2024</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sections</SelectItem>
            <SelectItem value="francophone">Francophone</SelectItem>
            <SelectItem value="anglophone">Anglophone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne Générale</p>
                <p className="text-3xl font-bold text-primary">{stats.schoolAverage.toFixed(2)}</p>
                <div className="flex items-center text-emerald-600 text-sm mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +0.8 vs trimestre précédent
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Award className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Réussite</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.passRate}%</p>
                <div className="flex items-center text-emerald-600 text-sm mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +3.5% vs année précédente
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="h-7 w-7 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Effectif Total</p>
                <p className="text-3xl font-bold text-secondary">{stats.totalStudents}</p>
                <div className="flex items-center text-emerald-600 text-sm mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +52 nouveaux élèves
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <Users className="h-7 w-7 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tableaux d'Honneur</p>
                <p className="text-3xl font-bold text-amber-600">{stats.honorCount}</p>
                <div className="flex items-center text-emerald-600 text-sm mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />+{stats.excellenceCount} excellences
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Award className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Distribution des Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ minHeight: 300, height: 300, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="range" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" name="Nombre de notes" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Répartition par Section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ minHeight: 300, height: 300, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Répartition par Genre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ minHeight: 250, height: 250, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par Matière (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectPerformance.slice(0, 8).map((subject) => (
                <div key={subject.subject} className="flex items-center gap-3">
                  <div className="w-28 text-sm font-medium truncate">{subject.subject}</div>
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          subject.average >= 14
                            ? "bg-emerald-500"
                            : subject.average >= 12
                              ? "bg-primary"
                              : subject.average >= 10
                                ? "bg-amber-500"
                                : "bg-red-500",
                        )}
                        style={{ width: `${(subject.average / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-14 text-right font-mono text-sm font-semibold">{subject.average.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ minHeight: 300, height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="level" className="text-xs" />
                <YAxis domain={[0, 20]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="average" name="Moyenne" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
