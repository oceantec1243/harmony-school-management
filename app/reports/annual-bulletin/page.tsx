"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts"
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  BarChart3,
  Calendar,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Medal,
  FileText,
  Printer,
  Filter,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// Types
interface Student {
  id: string
  first_name: string
  last_name: string
  matricule: string
  gender: string
  class_id: string
  class?: {
    id: string
    name: string
    level?: { name: string }
    section?: { name: string }
  }
}

interface Grade {
  id: string
  score: number
  coefficient: number
  student_id: string
  subject_id: string
  academic_period_id: string
  subject?: { name: string; subject_group?: { name: string } }
}

interface AcademicPeriod {
  id: string
  name: string
  type: string
  number: number
  academic_year: string
}

interface SequenceData {
  sequence: AcademicPeriod
  students: Map<string, { average: number; grades: Record<string, number> }>
  overall: { average: number; passRate: number; excellenceRate: number }
}

interface AnnualStudentSummary {
  student: Student
  sequenceAverages: number[]
  annualAverage: number
  annualMention: string
  bestSequence: number
  worstSequence: number
  trend: "improving" | "stable" | "declining"
}

// Colors and constants
const COLORS = {
  primary: "#1E40AF",
  success: "#16A34A",
  warning: "#EAB308",
  danger: "#DC2626",
  excellence: "#8B5CF6",
  honor: "#F59E0B",
}

const SEQUENCE_COLORS = ["#3B82F6", "#06B6D4", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"]

export default function AnnualBulletinPage() {
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<"fr" | "en">("fr")
  const [academicYear, setAcademicYear] = useState<string>("")
  const [years, setYears] = useState<string[]>([])
  const [sections, setSections] = useState<{ id: string; name: string }[]>([])
  const [selectedSection, setSelectedSection] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("overview")

  // Data state
  const [sequenceData, setSequenceData] = useState<SequenceData[]>([])
  const [annualStudents, setAnnualStudents] = useState<AnnualStudentSummary[]>([])
  const [schoolStats, setSchoolStats] = useState({
    totalStudents: 0,
    annualAverage: 0,
    passRate: 0,
    excellenceRate: 0,
    honorCount: 0,
    excellenceCount: 0,
    atRiskCount: 0,
  })

  const supabase = createClient()

  // Detect browser language
  useEffect(() => {
    const browserLang = navigator.language?.startsWith("en") ? "en" : "fr"
    setLanguage(browserLang)
  }, [])

  // Fetch years and initial data
  useEffect(() => {
    async function fetchInitialData() {
      const { data: periodsRes } = await supabase
        .from("academic_periods")
        .select("academic_year")
        .order("academic_year", { ascending: false })
        .distinct()

      const uniqueYears = [...new Set((periodsRes || []).map((p) => p.academic_year))]
      setYears(uniqueYears)

      if (uniqueYears.length > 0) {
        setAcademicYear(uniqueYears[0])
      }

      const { data: sectionsRes } = await supabase.from("sections").select("id, name")
      setSections(sectionsRes || [])
    }

    fetchInitialData()
  }, [])

  // Fetch annual data
  useEffect(() => {
    if (!academicYear) return

    async function fetchAnnualData() {
      setLoading(true)
      try {
        // Fetch all sequences for the year
        const { data: periodsData } = await supabase
          .from("academic_periods")
          .select("*")
          .eq("type", "sequence")
          .eq("academic_year", academicYear)
          .order("number", { ascending: true })

        const periods = (periodsData || []) as AcademicPeriod[]
        const periodIds = periods.map((p) => p.id)

        if (periodIds.length === 0) {
          setSequenceData([])
          setAnnualStudents([])
          setLoading(false)
          return
        }

        // Fetch all grades for all sequences
        const { data: gradesData } = await supabase
          .from("grades")
          .select(`
            id, score, coefficient, student_id, subject_id, academic_period_id, level_subject_id,
            subject:subjects(id, name, subject_group:subject_groups(name)),
            student:students(
              id, first_name, last_name, matricule, gender, class_id, is_ranked,
              class:classes(id, name, level_id, level:levels(id, name), section:sections(id, name))
            ),
            level_subject:level_subjects(coefficient)
          `)
          .in("academic_period_id", periodIds)

        const grades = (gradesData || []) as any[]

        // Fetch level_subjects for coefficient lookup
        const { data: levelSubjectsData } = await supabase
          .from("level_subjects")
          .select("id, level_id, subject_id, coefficient")

        const levelSubjectsMap = new Map<string, number>()
        ;(levelSubjectsData || []).forEach((ls) => {
          levelSubjectsMap.set(`${ls.level_id}_${ls.subject_id}`, ls.coefficient)
        })

        // Process data for each sequence
        const sequencesData: SequenceData[] = []

        for (const period of periods) {
          const periodGrades = grades.filter((g) => g.academic_period_id === period.id)

          // Group by student
          const studentGradesMap = new Map<string, typeof periodGrades>()
          periodGrades.forEach((g) => {
            if (!g.student) return
            const existing = studentGradesMap.get(g.student_id) || []
            existing.push(g)
            studentGradesMap.set(g.student_id, existing)
          })

          // Calculate student averages for this sequence
          const studentAverages = new Map<string, number>()
          const studentGradesRecord = new Map<string, Record<string, number>>()

          studentGradesMap.forEach((studentGrades, studentId) => {
            const student = studentGrades[0]?.student
            if (!student) return

            // Filter by section if needed
            if (
              selectedSection !== "all" &&
              student.class?.section?.id !== selectedSection
            ) {
              return
            }

            const levelId = student.class?.level_id
            const subjectGrades = new Map<string, { scores: number[]; coef: number }>()

            studentGrades.forEach((grade) => {
              const subjectName = grade.subject?.name || "Unknown"
              let coef = 1

              if (levelId && grade.subject_id) {
                const levelSubjectCoef = levelSubjectsMap.get(`${levelId}_${grade.subject_id}`)
                if (levelSubjectCoef !== undefined) coef = levelSubjectCoef
                else if (grade.level_subject?.coefficient) coef = grade.level_subject.coefficient
                else if (grade.coefficient) coef = grade.coefficient
              } else if (grade.level_subject?.coefficient) coef = grade.level_subject.coefficient
              else if (grade.coefficient) coef = grade.coefficient

              const existing = subjectGrades.get(subjectName) || { scores: [], coef }
              existing.scores.push(grade.score)
              subjectGrades.set(subjectName, existing)
            })

            // Calculate weighted average
            let totalWeighted = 0
            let totalCoef = 0
            const gradesRecord: Record<string, number> = {}

            subjectGrades.forEach((data, subject) => {
              const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
              gradesRecord[subject] = Math.round(avg * 100) / 100
              totalWeighted += avg * data.coef
              totalCoef += data.coef
            })

            const average = totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0
            studentAverages.set(studentId, average)
            studentGradesRecord.set(studentId, gradesRecord)
          })

          // Calculate overall stats
          const allAverages = Array.from(studentAverages.values())
          const overallAverage =
            allAverages.length > 0
              ? Math.round(
                  (allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100
                ) / 100
              : 0
          const passRate =
            allAverages.length > 0
              ? Math.round(
                  ((allAverages.filter((a) => a >= 10).length / allAverages.length) * 100)
                )
              : 0
          const excellenceRate =
            allAverages.length > 0
              ? Math.round(
                  ((allAverages.filter((a) => a >= 16).length / allAverages.length) * 100)
                )
              : 0

          sequencesData.push({
            sequence: period,
            students: new Map(
              Array.from(studentGradesMap.keys())
                .filter(
                  (id) =>
                    selectedSection === "all" ||
                    studentGradesMap.get(id)?.[0]?.student?.class?.section?.id === selectedSection
                )
                .map((id) => [
                  id,
                  {
                    average: studentAverages.get(id) || 0,
                    grades: studentGradesRecord.get(id) || {},
                  },
                ])
            ),
            overall: { average: overallAverage, passRate, excellenceRate },
          })
        }

        setSequenceData(sequencesData)

        // Calculate annual summaries for each student
        const allStudentIds = new Set<string>()
        sequencesData.forEach((seq) => {
          seq.students.forEach((_, studentId) => {
            allStudentIds.add(studentId)
          })
        })

        const annualSummaries: AnnualStudentSummary[] = []

        allStudentIds.forEach((studentId) => {
          const student = grades.find((g) => g.student_id === studentId)?.student
          if (!student) return

          const sequenceAverages = sequencesData.map((seq) => seq.students.get(studentId)?.average || 0)
          const annualAverage =
            sequenceAverages.length > 0
              ? Math.round(
                  (sequenceAverages.reduce((a, b) => a + b, 0) / sequenceAverages.length) * 100
                ) / 100
              : 0

          const bestSequence = Math.max(...sequenceAverages)
          const worstSequence = Math.min(...sequenceAverages)
          const trend =
            sequenceAverages.length >= 2
              ? sequenceAverages[sequenceAverages.length - 1] > sequenceAverages[0]
                ? "improving"
                : sequenceAverages[sequenceAverages.length - 1] < sequenceAverages[0]
                  ? "declining"
                  : "stable"
              : "stable"

          annualSummaries.push({
            student,
            sequenceAverages,
            annualAverage,
            annualMention: "", // Will be set dynamically based on language
            bestSequence,
            worstSequence,
            trend,
          })
        })

        // Sort by annual average
        annualSummaries.sort((a, b) => b.annualAverage - a.annualAverage)
        setAnnualStudents(annualSummaries)

        // Calculate school stats
        const totalStudents = annualSummaries.length
        const schoolAvg =
          totalStudents > 0
            ? Math.round(
                (annualSummaries.reduce((sum, s) => sum + s.annualAverage, 0) / totalStudents) *
                  100
              ) / 100
            : 0

        setSchoolStats({
          totalStudents,
          annualAverage: schoolAvg,
          passRate: totalStudents > 0 
            ? Math.round(((annualSummaries.filter((s) => s.annualAverage >= 10).length / totalStudents) * 100))
            : 0,
          excellenceRate: totalStudents > 0
            ? Math.round(((annualSummaries.filter((s) => s.annualAverage >= 16).length / totalStudents) * 100))
            : 0,
          honorCount: annualSummaries.filter((s) => s.annualAverage >= 14 && s.annualAverage < 16).length,
          excellenceCount: annualSummaries.filter((s) => s.annualAverage >= 16).length,
          atRiskCount: annualSummaries.filter((s) => s.annualAverage < 8).length,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching annual data:", error)
        setLoading(false)
      }
    }

    fetchAnnualData()
  }, [academicYear, selectedSection])

  // Prepare chart data
  const sequenceChartData = useMemo(() => {
    return sequenceData.map((seq, idx) => ({
      name: `${language === "fr" ? "Séquence" : "Sequence"} ${seq.sequence.number}`,
      average: seq.overall.average,
      passRate: seq.overall.passRate,
      fill: SEQUENCE_COLORS[idx % SEQUENCE_COLORS.length],
    }))
  }, [sequenceData, language])

  const studentTrendData = useMemo(() => {
    if (annualStudents.length === 0) return []
    // Show top 10 students' trends
    return annualStudents.slice(0, 10).map((student) => ({
      name: `${student.student.first_name} ${student.student.last_name}`,
      ...Object.fromEntries(
        student.sequenceAverages.map((avg, idx) => [
          `${language === "fr" ? "Seq" : "Seq"} ${idx + 1}`,
          avg,
        ])
      ),
    }))
  }, [annualStudents, language])

  const translations = {
    fr: {
      title: "BULLETIN ANNUEL",
      subtitle: "Récapitulatif complet de l'année académique",
      academicYear: "Année académique",
      section: "Section",
      allSections: "Toutes les sections",
      loading: "Chargement...",
      overview: "Vue d'ensemble",
      sequences: "Séquences",
      students: "Élèves",
      analysis: "Analyse",
      totalStudents: "Élèves total",
      annualAverage: "Moyenne annuelle",
      passRate: "Taux de réussite",
      excellenceRate: "Taux d'excellence",
      honorCount: "Tableau d'honneur",
      excellenceCount: "Excellence",
      atRisk: "En danger",
      sequencePerformance: "Performance par séquence",
      top10Students: "Top 10 Élèves",
      studentName: "Nom de l'élève",
      class: "Classe",
      sequenceAverages: "Moyennes par séquence",
      annualMention: "Mention annuelle",
      trend: "Tendance",
      improving: "En amélioration",
      stable: "Stable",
      declining: "En baisse",
      print: "Imprimer",
      download: "Télécharger",
      noData: "Aucune donnée disponible",
      rank: "Rang",
      excellent: "Excellent",
      veryGood: "Très Bien",
      good: "Bien",
      fairlyGood: "Assez Bien",
      insufficient: "Insuffisant",
      statisticalAnalysis: "Analyse statistique annuelle",
      sequenceDistribution: "Distribution par séquence",
      studentsRanking: "Classement des élèves",
      annualEvolution: "Évolution annuelle",
      excellence: "Excellence",
      passRateLabel: "Taux de réussite (≥ 10/20)",
      failureRateLabel: "Taux d'échec (< 8/20)",
      atRiskLabel: "Élèves en danger",
    },
    en: {
      title: "ANNUAL REPORT",
      subtitle: "Complete academic year summary",
      academicYear: "Academic Year",
      section: "Section",
      allSections: "All Sections",
      loading: "Loading...",
      overview: "Overview",
      sequences: "Sequences",
      students: "Students",
      analysis: "Analysis",
      totalStudents: "Total Students",
      annualAverage: "Annual Average",
      passRate: "Pass Rate",
      excellenceRate: "Excellence Rate",
      honorCount: "Honor Roll",
      excellenceCount: "Excellence",
      atRisk: "At Risk",
      sequencePerformance: "Performance by Sequence",
      top10Students: "Top 10 Students",
      studentName: "Student Name",
      class: "Class",
      sequenceAverages: "Averages by Sequence",
      annualMention: "Annual Mention",
      trend: "Trend",
      improving: "Improving",
      stable: "Stable",
      declining: "Declining",
      print: "Print",
      download: "Download",
      noData: "No data available",
      rank: "Rank",
      excellent: "Excellent",
      veryGood: "Very Good",
      good: "Good",
      fairlyGood: "Fairly Good",
      insufficient: "Insufficient",
      statisticalAnalysis: "Annual Statistical Analysis",
      sequenceDistribution: "Distribution by Sequence",
      studentsRanking: "Students Ranking",
      annualEvolution: "Annual Evolution",
      excellence: "Excellence",
      passRateLabel: "Pass Rate (≥ 10/20)",
      failureRateLabel: "Failure Rate (< 8/20)",
      atRiskLabel: "Students at Risk",
    },
  }

  const getMentionLabel = (avg: number, lang: "fr" | "en") => {
    if (avg >= 16) return lang === "fr" ? translations.fr.excellent : translations.en.excellent
    if (avg >= 14) return lang === "fr" ? translations.fr.veryGood : translations.en.veryGood
    if (avg >= 12) return lang === "fr" ? translations.fr.good : translations.en.good
    if (avg >= 10) return lang === "fr" ? translations.fr.fairlyGood : translations.en.fairlyGood
    return lang === "fr" ? translations.fr.insufficient : translations.en.insufficient
  }

  const t = translations[language]

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <PageHeader
              title={t.title}
              description={t.subtitle}
              icon={FileText}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              {t.print}
            </Button>
            <Button
              variant={language === "fr" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("fr")}
            >
              FR
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
            >
              EN
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t.academicYear} />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t.section} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allSections}</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.totalStudents}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schoolStats.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t.annualAverage}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schoolStats.annualAverage.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {t.passRate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schoolStats.passRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {t.excellenceRate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schoolStats.excellenceRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="sequences">{t.sequences}</TabsTrigger>
            <TabsTrigger value="students">{t.students}</TabsTrigger>
            <TabsTrigger value="analysis">{t.analysis}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <Skeleton className="h-96" />
            ) : (
              <>
                {/* Sequence Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.sequencePerformance}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sequenceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sequenceChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 20]} />
                          <Tooltip />
                          <Bar dataKey="average" fill="#3B82F6" name={t.annualAverage} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">{t.noData}</div>
                    )}
                  </CardContent>
                </Card>

                {/* Top 10 Students Trend */}
                {studentTrendData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.top10Students}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={studentTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis domain={[0, 20]} />
                          <Tooltip />
                          <Legend />
                          {Object.keys(studentTrendData[0] || {})
                            .filter((key) => key.startsWith("Seq"))
                            .map((key, idx) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={SEQUENCE_COLORS[idx % SEQUENCE_COLORS.length]}
                              />
                            ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Sequences Tab */}
          <TabsContent value="sequences" className="space-y-4">
            {loading ? (
              <Skeleton className="h-96" />
            ) : sequenceData.length > 0 ? (
              sequenceData.map((seq, idx) => (
                <Card key={seq.sequence.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: SEQUENCE_COLORS[idx % SEQUENCE_COLORS.length] }}
                      />
                      <CardTitle>
                        {language === "fr" ? "Séquence" : "Sequence"} {seq.sequence.number} - {seq.sequence.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.annualAverage}</p>
                        <p className="text-2xl font-bold">{seq.overall.average.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.passRate}</p>
                        <p className="text-2xl font-bold">{seq.overall.passRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.excellenceRate}</p>
                        <p className="text-2xl font-bold">{seq.overall.excellenceRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">{t.noData}</CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            {loading ? (
              <Skeleton className="h-96" />
            ) : annualStudents.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-screen">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">{t.rank}</TableHead>
                          <TableHead>{t.studentName}</TableHead>
                          <TableHead>{t.class}</TableHead>
                          {sequenceData.map((seq, idx) => (
                            <TableHead key={seq.sequence.id} className="text-center">
                              {language === "fr" ? "Seq" : "Seq"} {seq.sequence.number}
                            </TableHead>
                          ))}
                          <TableHead className="text-right font-bold">{t.annualAverage}</TableHead>
                          <TableHead>{t.annualMention}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {annualStudents.map((student, idx) => (
                          <TableRow key={student.student.id}>
                            <TableCell className="font-bold">
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.student.first_name} {student.student.last_name}
                            </TableCell>
                            <TableCell className="text-sm">{student.student.class?.name}</TableCell>
                            {student.sequenceAverages.map((avg, sidx) => (
                              <TableCell key={sidx} className="text-center">
                                <Badge variant="outline">{avg.toFixed(2)}</Badge>
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-bold">
                              {student.annualAverage.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  student.annualAverage >= 16
                                    ? "bg-purple-100 text-purple-800"
                                    : student.annualAverage >= 14
                                      ? "bg-blue-100 text-blue-800"
                                      : student.annualAverage >= 12
                                        ? "bg-green-100 text-green-800"
                                        : student.annualAverage >= 10
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                )}
                              >
                                {getMentionLabel(student.annualAverage, language)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">{t.noData}</CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {loading ? (
              <Skeleton className="h-96" />
            ) : annualStudents.length > 0 ? (
              <>
                {/* Mention Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "fr" ? "Distribution des mentions" : "Mention Distribution"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {[
                        { label: t.excellent, min: 16, color: "bg-purple-100 text-purple-800" },
                        { label: t.veryGood, min: 14, max: 15.99, color: "bg-blue-100 text-blue-800" },
                        { label: t.good, min: 12, max: 13.99, color: "bg-green-100 text-green-800" },
                        { label: t.fairlyGood, min: 10, max: 11.99, color: "bg-yellow-100 text-yellow-800" },
                        { label: t.insufficient, max: 9.99, color: "bg-red-100 text-red-800" },
                      ].map((mention, idx) => {
                        const count = annualStudents.filter((s) => {
                          if (mention.max === undefined) return s.annualAverage >= mention.min
                          return s.annualAverage >= mention.min && s.annualAverage < mention.max + 0.01
                        }).length
                        const percentage = annualStudents.length > 0 
                          ? Math.round((count / annualStudents.length) * 100)
                          : 0
                        
                        return (
                          <div key={idx} className={cn("p-4 rounded-lg text-center", mention.color)}>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm font-medium">{mention.label}</div>
                            <div className="text-xs">{percentage}%</div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Statistic Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t.passRateLabel}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {schoolStats.passRate}%
                      </div>
                      <Progress 
                        value={schoolStats.passRate} 
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {annualStudents.filter((s) => s.annualAverage >= 10).length} / {annualStudents.length}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t.excellenceRate}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {schoolStats.excellenceRate}%
                      </div>
                      <Progress 
                        value={schoolStats.excellenceRate} 
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {schoolStats.excellenceCount} {language === "fr" ? "élèves" : "students"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t.atRiskLabel}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {schoolStats.atRiskCount}
                      </div>
                      <Progress 
                        value={schoolStats.atRiskCount > 0 ? (schoolStats.atRiskCount / annualStudents.length) * 100 : 0}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {annualStudents.length > 0 ? Math.round((schoolStats.atRiskCount / annualStudents.length) * 100) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison by Sequence */}
                {sequenceChartData.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === "fr" ? "Comparaison des séquences" : "Sequences Comparison"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={sequenceChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 20]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="average" fill="#3B82F6" name={t.annualAverage} />
                          <Bar dataKey="passRate" fill="#10B981" name={t.passRate} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">{t.noData}</CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
