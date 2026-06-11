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
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChartIcon,
  Activity,
  FileText,
  Printer,
  Filter,
  ChevronDown,
  ChevronUp,
  Medal,
  Star,
  AlertCircle,
  Clock,
  Minus,
  FileSpreadsheet,
  Eye,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  exportStudentsList,
  exportClassSummary,
  exportSubjectPerformance,
  getMentionLabel,
  getStatusLabel,
  printReport,
} from "@/lib/export-utils"
import { StudentProfileModal } from "@/components/analysis/student-profile-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  student?: Student
}

interface AcademicPeriod {
  id: string
  name: string
  type: string
  number: number
  academic_year: string
}

interface ClassData {
  id: string
  name: string
  level?: { name: string }
  section?: { name: string }
}

interface StudentAnalysis {
  student: Student
  average: number
  rank: number
  grades: Record<string, number>
  groupAverages: Record<string, number>
  evolution?: number
  previousAverage?: number
  attendanceHours?: number
  isAtRisk: boolean
  isExcellent: boolean
  weakSubjects: string[]
  strongSubjects: string[]
}

interface ClassAnalysis {
  classData: ClassData
  students: StudentAnalysis[]
  average: number
  passRate: number
  excellenceRate: number
  failureRate: number
  bestStudent?: StudentAnalysis
  worstStudent?: StudentAnalysis
  distribution: { range: string; count: number; color: string }[]
}

// Color palette
const COLORS = {
  primary: "#1E40AF",
  secondary: "#7C3AED",
  success: "#16A34A",
  warning: "#EAB308",
  danger: "#DC2626",
  info: "#0EA5E9",
  excellence: "#8B5CF6",
  honor: "#F59E0B",
  passing: "#22C55E",
  failing: "#EF4444",
}

const GRADE_RANGES = [
  { range: "0-5", min: 0, max: 5, color: "#DC2626", label: "Très faible" },
  { range: "5-8", min: 5, max: 8, color: "#F97316", label: "Faible" },
  { range: "8-10", min: 8, max: 10, color: "#EAB308", label: "Insuffisant" },
  { range: "10-12", min: 10, max: 12, color: "#84CC16", label: "Passable" },
  { range: "12-14", min: 12, max: 14, color: "#22C55E", label: "Assez Bien" },
  { range: "14-16", min: 14, max: 16, color: "#06B6D4", label: "Bien" },
  { range: "16-18", min: 16, max: 18, color: "#3B82F6", label: "Très Bien" },
  { range: "18-20", min: 18, max: 20, color: "#8B5CF6", label: "Excellent" },
]

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])
  const [sections, setSections] = useState<{ id: string; name: string }[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSection, setSelectedSection] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalysis | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Analysis data
  const [schoolStats, setSchoolStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    schoolAverage: 0,
    passRate: 0,
    excellenceRate: 0,
    failureRate: 0,
    honorCount: 0,
    excellenceCount: 0,
    atRiskCount: 0,
  })
  const [classAnalyses, setClassAnalyses] = useState<ClassAnalysis[]>([])
  const [allStudents, setAllStudents] = useState<StudentAnalysis[]>([])
  const [subjectPerformance, setSubjectPerformance] = useState<
    { subject: string; average: number; passRate: number; count: number; group: string }[]
  >([])
  const [groupPerformance, setGroupPerformance] = useState<
    { group: string; average: number; passRate: number }[]
  >([])
  const [evolutionData, setEvolutionData] = useState<
    { period: string; average: number; passRate: number }[]
  >([])
  const [comparisonData, setComparisonData] = useState<
    { class: string; average: number; passRate: number; count: number }[]
  >([])

  const supabase = createClient()

  // Track all active students for effectif calculation
  const [allActiveStudents, setAllActiveStudents] = useState<{ classId: string; count: number }[]>([])

  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      const [periodsRes, classesRes, sectionsRes] = await Promise.all([
        supabase
          .from("academic_periods")
          .select("*")
          .order("academic_year", { ascending: false })
          .order("number", { ascending: true }),
        supabase.from("classes").select("*, level:levels(name), section:sections(name)"),
        supabase.from("sections").select("id, name"),
      ])

      setPeriods(periodsRes.data || [])
      setClasses(classesRes.data || [])
      setSections(sectionsRes.data || [])

      // Fetch count of active students per class
      const { data: classStudentCounts } = await supabase
        .from("students")
        .select("class_id")
        .ilike("status", "active")

      const countByClass = new Map<string, number>()
      if (classStudentCounts) {
        for (const student of classStudentCounts) {
          countByClass.set(student.class_id, (countByClass.get(student.class_id) || 0) + 1)
        }
      }
      setAllActiveStudents(Array.from(countByClass.entries()).map(([classId, count]) => ({ classId, count })))

      // Set default period (latest trimester)
      const trimesters = (periodsRes.data || []).filter((p) => p.type === "trimester")
      if (trimesters.length > 0) {
        setSelectedPeriod(trimesters[0].id)
      } else if (periodsRes.data && periodsRes.data.length > 0) {
        setSelectedPeriod(periodsRes.data[0].id)
      }
    }
    fetchInitialData()
  }, [])

  // Fetch analysis data when period changes
  useEffect(() => {
    if (!selectedPeriod) return

    async function fetchAnalysisData() {
      setLoading(true)
      try {
        let periodIds: string[] = []
        let sequencePeriods: { id: string; number: number }[] = []
        let period = periods.find((p) => p.id === selectedPeriod)
        let isPeriodAnnual = false
        let academicYear = ""

        // Check if it's an annual period pseudo-ID
        if (selectedPeriod.startsWith("annual_")) {
          academicYear = selectedPeriod.split("_")[1]
          isPeriodAnnual = true
          
          // For annual analysis, get all sequences for the year
          const { data: seqPeriods } = await supabase
            .from("academic_periods")
            .select("id, number")
            .eq("type", "sequence")
            .eq("academic_year", academicYear)
            .order("number", { ascending: true })
          
          if (seqPeriods && seqPeriods.length > 0) {
            periodIds = seqPeriods.map((p) => p.id)
            sequencePeriods = seqPeriods
          }
        } else if (period) {
          academicYear = period.academic_year
          isPeriodAnnual = period.type === "year"
          
          if (isPeriodAnnual) {
            // For annual analysis, get all sequences for the year
            const { data: seqPeriods } = await supabase
              .from("academic_periods")
              .select("id, number")
              .eq("type", "sequence")
              .eq("academic_year", period.academic_year)
              .order("number", { ascending: true })
            
            if (seqPeriods && seqPeriods.length > 0) {
              periodIds = seqPeriods.map((p) => p.id)
              sequencePeriods = seqPeriods
            }
          }
        } else {
          return
        }

        if (!isPeriodAnnual && period && period.type === "trimester" && period.number) {
          // For trimesters, get the two sequence periods
          const seq1Num = (period.number - 1) * 2 + 1
          const seq2Num = (period.number - 1) * 2 + 2
          
          const { data: seqPeriods } = await supabase
            .from("academic_periods")
            .select("id, number")
            .eq("type", "sequence")
            .eq("academic_year", period.academic_year)
            .in("number", [seq1Num, seq2Num])
          
          if (seqPeriods && seqPeriods.length > 0) {
            periodIds = seqPeriods.map((p) => p.id)
            sequencePeriods = seqPeriods
          }
        }

        // Fetch all grades for the period(s) with level_subject for correct coefficients
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

        const grades = (gradesData || []) as unknown as (Grade & { 
          level_subject?: { coefficient: number } 
          student?: Student & { is_ranked?: boolean; class?: { level_id?: string } }
        })[]

        // Fetch all level_subjects for coefficient lookup
        const { data: levelSubjectsData } = await supabase
          .from("level_subjects")
          .select("id, level_id, subject_id, coefficient")

        const levelSubjectsMap = new Map<string, number>()
        ;(levelSubjectsData || []).forEach((ls) => {
          // Key: level_id + subject_id
          levelSubjectsMap.set(`${ls.level_id}_${ls.subject_id}`, ls.coefficient)
        })

        // Fetch unranked periods for students
        const { data: unrankedPeriodsData } = await supabase
          .from("student_unranked_periods")
          .select("student_id, academic_period_id")
          .in("academic_period_id", periodIds)

        const unrankedMap = new Map<string, Set<string>>()
        ;(unrankedPeriodsData || []).forEach((up) => {
          if (!unrankedMap.has(up.student_id)) {
            unrankedMap.set(up.student_id, new Set())
          }
          unrankedMap.get(up.student_id)!.add(up.academic_period_id)
        })

        // Fetch attendance data
        const { data: attendanceData } = await supabase
          .from("student_attendances")
          .select("student_id, total_hours")
          .eq("academic_period_id", selectedPeriod)

        const attendanceMap = new Map(
          (attendanceData || []).map((a) => [a.student_id, a.total_hours])
        )

        // Process students - group grades by student
        const studentGradesMap = new Map<string, typeof grades>()
        grades.forEach((g) => {
          if (!g.student) return
          const existing = studentGradesMap.get(g.student_id) || []
          existing.push(g)
          studentGradesMap.set(g.student_id, existing)
        })

        // Calculate student analyses using coefficients from level_subjects
        const studentAnalyses: StudentAnalysis[] = []
        const processedStudents = new Set<string>()

        grades.forEach((g) => {
          if (!g.student || processedStudents.has(g.student_id)) return
          processedStudents.add(g.student_id)

          const studentGrades = studentGradesMap.get(g.student_id) || []
          const levelId = g.student.class?.level_id
          
          // Check if student is ranked for this period
          const studentUnrankedPeriods = unrankedMap.get(g.student_id)
          const isUnrankedForPeriod = studentUnrankedPeriods && 
            periodIds.some(pid => studentUnrankedPeriods.has(pid))
          
          // Group grades by subject
          const subjectGrades = new Map<string, { 
            scores: { score: number; periodId: string }[]
            coef: number 
            subjectId: string
          }>()
          
          studentGrades.forEach((grade) => {
            const subjectName = grade.subject?.name || "Inconnu"
            const subjectId = grade.subject_id
            
            // Get coefficient from level_subjects (priority) or grade itself
            let coef = 1
            if (levelId && subjectId) {
              const levelSubjectCoef = levelSubjectsMap.get(`${levelId}_${subjectId}`)
              if (levelSubjectCoef !== undefined) {
                coef = levelSubjectCoef
              } else if (grade.level_subject?.coefficient) {
                coef = grade.level_subject.coefficient
              } else if (grade.coefficient) {
                coef = grade.coefficient
              }
            } else if (grade.level_subject?.coefficient) {
              coef = grade.level_subject.coefficient
            } else if (grade.coefficient) {
              coef = grade.coefficient
            }
            
            const existing = subjectGrades.get(subjectName) || { 
              scores: [], 
              coef, 
              subjectId 
            }
            existing.scores.push({ score: grade.score, periodId: grade.academic_period_id })
            subjectGrades.set(subjectName, existing)
          })

          // Calculate average per subject
          // For trimester: average of both sequences
          // For sequence: single score
          const gradesRecord: Record<string, number> = {}
          let totalWeighted = 0
          let totalCoef = 0

          subjectGrades.forEach((data, subject) => {
            let subjectAverage: number
            
            if (period.type === "trimester" && data.scores.length >= 1) {
              // For trimester: average of available sequence scores
              const sum = data.scores.reduce((acc, s) => acc + s.score, 0)
              subjectAverage = sum / data.scores.length
            } else {
              // For sequence: just the score
              subjectAverage = data.scores[0]?.score || 0
            }
            
            gradesRecord[subject] = Math.round(subjectAverage * 100) / 100
            totalWeighted += subjectAverage * data.coef
            totalCoef += data.coef
          })

          const average = totalCoef > 0 ? totalWeighted / totalCoef : 0

          // Group averages using correct coefficients
          const groupAverages: Record<string, { totalWeighted: number; totalCoef: number }> = {}
          
          subjectGrades.forEach((data, subject) => {
            const grade = studentGrades.find(sg => sg.subject?.name === subject)
            const groupName = grade?.subject?.subject_group?.name || "Autres"
            
            if (!groupAverages[groupName]) {
              groupAverages[groupName] = { totalWeighted: 0, totalCoef: 0 }
            }
            
            // Calculate subject average for this group
            const sum = data.scores.reduce((acc, s) => acc + s.score, 0)
            const subjectAvg = sum / data.scores.length
            
            groupAverages[groupName].totalWeighted += subjectAvg * data.coef
            groupAverages[groupName].totalCoef += data.coef
          })

          const groupAvgRecord: Record<string, number> = {}
          Object.entries(groupAverages).forEach(([group, data]) => {
            groupAvgRecord[group] = data.totalCoef > 0 
              ? Math.round((data.totalWeighted / data.totalCoef) * 100) / 100 
              : 0
          })

          // Identify weak and strong subjects
          const weakSubjects = Object.entries(gradesRecord)
            .filter(([_, score]) => score < 10)
            .map(([name]) => name)
          const strongSubjects = Object.entries(gradesRecord)
            .filter(([_, score]) => score >= 14)
            .map(([name]) => name)

          // Only include ranked students in analysis (unless they're all unranked)
          const isRanked = g.student.is_ranked !== false && !isUnrankedForPeriod

          studentAnalyses.push({
            student: g.student,
            average: Math.round(average * 100) / 100,
            rank: 0,
            grades: gradesRecord,
            groupAverages: groupAvgRecord,
            attendanceHours: attendanceMap.get(g.student_id) || 0,
            isAtRisk: average < 8,
            isExcellent: average >= 16,
            weakSubjects,
            strongSubjects,
          })
        })

        // Sort and rank students (only ranked students get a numeric rank)
        studentAnalyses.sort((a, b) => b.average - a.average)
        let currentRank = 0
        let lastAverage = -1
        studentAnalyses.forEach((s, i) => {
          if (s.average !== lastAverage) {
            currentRank = i + 1
            lastAverage = s.average
          }
          s.rank = currentRank
        })

        setAllStudents(studentAnalyses)

        // Calculate class analyses
        const classMap = new Map<string, StudentAnalysis[]>()
        studentAnalyses.forEach((s) => {
          const classId = s.student.class_id
          const existing = classMap.get(classId) || []
          existing.push(s)
          classMap.set(classId, existing)
        })

        const classAnalysesData: ClassAnalysis[] = []
        classMap.forEach((students, classId) => {
          const classData = classes.find((c) => c.id === classId)
          if (!classData) return

          // Rank students within class (handle ties)
          const sortedStudents = [...students].sort((a, b) => b.average - a.average)
          let classRank = 0
          let lastClassAvg = -1
          sortedStudents.forEach((s, i) => {
            if (s.average !== lastClassAvg) {
              classRank = i + 1
              lastClassAvg = s.average
            }
            s.rank = classRank
          })

          const totalStudents = students.length
          const passing = students.filter((s) => s.average >= 10).length
          const excellent = students.filter((s) => s.average >= 16).length
          const failing = students.filter((s) => s.average < 8).length
          const classAverage = totalStudents > 0 
            ? students.reduce((sum, s) => sum + s.average, 0) / totalStudents 
            : 0

          // Distribution
          const distribution = GRADE_RANGES.map((r) => ({
            ...r,
            count: students.filter((s) => s.average >= r.min && s.average < r.max).length,
          }))

          classAnalysesData.push({
            classData,
            students: sortedStudents,
            average: Math.round(classAverage * 100) / 100,
            passRate: totalStudents > 0 ? Math.round((passing / totalStudents) * 100) : 0,
            excellenceRate: totalStudents > 0 ? Math.round((excellent / totalStudents) * 100) : 0,
            failureRate: totalStudents > 0 ? Math.round((failing / totalStudents) * 100) : 0,
            bestStudent: sortedStudents[0],
            worstStudent: sortedStudents[sortedStudents.length - 1],
            distribution,
          })
        })

        classAnalysesData.sort((a, b) => b.average - a.average)
        setClassAnalyses(classAnalysesData)

        console.log("[v0] Analysis data loaded successfully:", {
          selectedPeriod,
          isAnnual: isPeriodAnnual,
          academicYear,
          periodIds: periodIds.length,
          totalStudents: studentAnalyses.length,
          totalClasses: classAnalysesData.length,
          totalGrades: grades.length,
          subjectCount: subjectPerfData.length,
          groupCount: Array.from(groupMap.entries()).length,
          comparisonDataCount: classAnalysesData.length,
        })

        // School-wide stats
        const totalStudentsCount = studentAnalyses.length
        const schoolAvg = totalStudentsCount > 0
          ? studentAnalyses.reduce((sum, s) => sum + s.average, 0) / totalStudentsCount
          : 0
        const passingCount = studentAnalyses.filter((s) => s.average >= 10).length
        const excellentCount = studentAnalyses.filter((s) => s.average >= 16).length
        const honorCount = studentAnalyses.filter((s) => s.average >= 14 && s.average < 16).length
        const atRiskCount = studentAnalyses.filter((s) => s.average < 8).length
        const failingCount = studentAnalyses.filter((s) => s.average < 10).length

        setSchoolStats({
          totalStudents: totalStudentsCount,
          totalClasses: classAnalysesData.length,
          schoolAverage: Math.round(schoolAvg * 100) / 100,
          passRate: totalStudentsCount > 0 ? Math.round((passingCount / totalStudentsCount) * 100) : 0,
          excellenceRate: totalStudentsCount > 0 ? Math.round((excellentCount / totalStudentsCount) * 100) : 0,
          failureRate: totalStudentsCount > 0 ? Math.round((failingCount / totalStudentsCount) * 100) : 0,
          honorCount,
          excellenceCount: excellentCount,
          atRiskCount,
        })

        // Subject performance - calculate using correct coefficients
        const subjectMap = new Map<string, { 
          totalWeighted: number
          totalCoef: number
          totalScores: number
          passing: number
          group: string 
        }>()
        
        // Process each grade for subject performance
        grades.forEach((g) => {
          const name = g.subject?.name || "Inconnu"
          const group = g.subject?.subject_group?.name || "Autres"
          const levelId = g.student?.class?.level_id
          
          // Get coefficient
          let coef = 1
          if (levelId && g.subject_id) {
            const levelSubjectCoef = levelSubjectsMap.get(`${levelId}_${g.subject_id}`)
            if (levelSubjectCoef !== undefined) coef = levelSubjectCoef
            else if (g.level_subject?.coefficient) coef = g.level_subject.coefficient
            else if (g.coefficient) coef = g.coefficient
          } else if (g.level_subject?.coefficient) {
            coef = g.level_subject.coefficient
          } else if (g.coefficient) {
            coef = g.coefficient
          }
          
          const existing = subjectMap.get(name) || { 
            totalWeighted: 0, 
            totalCoef: 0, 
            totalScores: 0, 
            passing: 0, 
            group 
          }
          existing.totalWeighted += g.score * coef
          existing.totalCoef += coef
          existing.totalScores++
          if (g.score >= 10) existing.passing++
          subjectMap.set(name, existing)
        })

        const subjectPerfData = Array.from(subjectMap.entries())
          .map(([subject, data]) => ({
            subject,
            average: data.totalCoef > 0 
              ? Math.round((data.totalWeighted / data.totalCoef) * 100) / 100 
              : 0,
            passRate: data.totalScores > 0 
              ? Math.round((data.passing / data.totalScores) * 100) 
              : 0,
            count: data.totalScores,
            group: data.group,
          }))
          .sort((a, b) => b.average - a.average)

        setSubjectPerformance(subjectPerfData)

        // Group performance
        const groupMap = new Map<string, { totalWeighted: number; totalCoef: number; totalScores: number; passing: number }>()
        grades.forEach((g) => {
          const group = g.subject?.subject_group?.name || "Autres"
          const levelId = g.student?.class?.level_id
          
          // Get coefficient
          let coef = 1
          if (levelId && g.subject_id) {
            const levelSubjectCoef = levelSubjectsMap.get(`${levelId}_${g.subject_id}`)
            if (levelSubjectCoef !== undefined) coef = levelSubjectCoef
            else if (g.level_subject?.coefficient) coef = g.level_subject.coefficient
            else if (g.coefficient) coef = g.coefficient
          } else if (g.level_subject?.coefficient) {
            coef = g.level_subject.coefficient
          } else if (g.coefficient) {
            coef = g.coefficient
          }
          
          const existing = groupMap.get(group) || { totalWeighted: 0, totalCoef: 0, totalScores: 0, passing: 0 }
          existing.totalWeighted += g.score * coef
          existing.totalCoef += coef
          existing.totalScores++
          if (g.score >= 10) existing.passing++
          groupMap.set(group, existing)
        })

        setGroupPerformance(
          Array.from(groupMap.entries()).map(([group, data]) => ({
            group,
            average: data.totalCoef > 0 
              ? Math.round((data.totalWeighted / data.totalCoef) * 100) / 100 
              : 0,
            passRate: data.totalScores > 0 
              ? Math.round((data.passing / data.totalScores) * 100) 
              : 0,
          }))
        )

        // Comparison data
        setComparisonData(
          classAnalysesData.map((c) => ({
            class: c.classData.name,
            average: c.average,
            passRate: c.passRate,
            count: c.students.length,
          }))
        )
      } catch (error) {
        console.error("[v0] Error fetching analysis data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysisData()
  }, [selectedPeriod, periods, classes])

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    let result = allStudents

    if (selectedClass !== "all") {
      result = result.filter((s) => s.student.class_id === selectedClass)
    }

    if (selectedSection !== "all") {
      result = result.filter((s) => s.student.class?.section?.name === selectedSection)
    }

    // Re-rank after filtering
    result = [...result].sort((a, b) => b.average - a.average)
    result.forEach((s, i) => {
      s.rank = i + 1
    })

    return result
  }, [allStudents, selectedClass, selectedSection])

  // Filter class analyses
  const filteredClassAnalyses = useMemo(() => {
    let result = classAnalyses

    if (selectedSection !== "all") {
      result = result.filter((c) => c.classData.section?.name === selectedSection)
    }

    if (selectedClass !== "all") {
      result = result.filter((c) => c.classData.id === selectedClass)
    }

    return result
  }, [classAnalyses, selectedSection, selectedClass])

  // Grade distribution for filtered students
  const gradeDistribution = useMemo(() => {
    return GRADE_RANGES.map((r) => ({
      ...r,
      count: filteredStudents.filter((s) => s.average >= r.min && s.average < r.max).length,
    }))
  }, [filteredStudents])

  // Students at risk
  const studentsAtRisk = useMemo(() => {
    return filteredStudents.filter((s) => s.isAtRisk).slice(0, 20)
  }, [filteredStudents])

  // Top students
  const topStudents = useMemo(() => {
    return filteredStudents.slice(0, 10)
  }, [filteredStudents])

  // Mentions distribution
  const mentionsData = useMemo(() => {
    const excellent = filteredStudents.filter((s) => s.average >= 16).length
    const tresBien = filteredStudents.filter((s) => s.average >= 14 && s.average < 16).length
    const bien = filteredStudents.filter((s) => s.average >= 12 && s.average < 14).length
    const assezBien = filteredStudents.filter((s) => s.average >= 10 && s.average < 12).length
    const insuffisant = filteredStudents.filter((s) => s.average < 10).length

    return [
      { name: "Excellent (16+)", value: excellent, color: "#8B5CF6" },
      { name: "Très Bien (14-16)", value: tresBien, color: "#3B82F6" },
      { name: "Bien (12-14)", value: bien, color: "#22C55E" },
      { name: "Assez Bien (10-12)", value: assezBien, color: "#84CC16" },
      { name: "Insuffisant (<10)", value: insuffisant, color: "#EF4444" },
    ]
  }, [filteredStudents])

  if (loading && !selectedPeriod) {
    return (
      <AppLayout>
        <PageHeader title="Analyse Scolaire" description="Chargement..." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AppLayout>
    )
  }

  const selectedPeriodData = periods.find((p) => p.id === selectedPeriod)

  return (
    <AppLayout>
      <PageHeader
        title="Analyse Scolaire Complète"
        description="Évaluation détaillée pour l'assemblée générale"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const periodName = selectedPeriodData?.name || "Période"
              const stats = {
                totalStudents: filteredStudents.length,
                schoolAverage: filteredStudents.reduce((sum, s) => sum + s.average, 0) / (filteredStudents.length || 1),
                passRate: Math.round((filteredStudents.filter((s) => s.average >= 10).length / (filteredStudents.length || 1)) * 100),
                excellenceRate: Math.round((filteredStudents.filter((s) => s.average >= 16).length / (filteredStudents.length || 1)) * 100),
              }
              const classesExport = filteredClassAnalyses.map((c) => ({
                name: c.classData.name,
                level: c.classData.level?.name || "",
                section: c.classData.section?.name || "",
                studentCount: c.students.length,
                average: c.average,
                passRate: c.passRate,
                excellenceRate: c.excellenceRate,
                failureRate: c.failureRate,
                bestStudentName: c.bestStudent ? `${c.bestStudent.student.last_name} ${c.bestStudent.student.first_name}` : "",
                bestStudentAverage: c.bestStudent?.average || 0,
              }))
              const topStudentsExport = filteredStudents.slice(0, 10).map((s) => ({
                rank: s.rank,
                matricule: s.student.matricule,
                lastName: s.student.last_name,
                firstName: s.student.first_name,
                gender: s.student.gender,
                className: s.student.class?.name || "",
                average: s.average,
                mention: getMentionLabel(s.average),
                status: getStatusLabel(s.average, s.isAtRisk),
                strongSubjects: s.strongSubjects,
                weakSubjects: s.weakSubjects,
              }))
              printReport("Rapport d'Analyse Scolaire", periodName, stats, classesExport, topStudentsExport)
            }}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Exporter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const periodName = selectedPeriodData?.name || "Période"
                  const studentsExport = filteredStudents.map((s) => ({
                    rank: s.rank,
                    matricule: s.student.matricule,
                    lastName: s.student.last_name,
                    firstName: s.student.first_name,
                    gender: s.student.gender,
                    className: s.student.class?.name || "",
                    average: s.average,
                    mention: getMentionLabel(s.average),
                    status: getStatusLabel(s.average, s.isAtRisk),
                    strongSubjects: s.strongSubjects,
                    weakSubjects: s.weakSubjects,
                  }))
                  exportStudentsList(studentsExport, periodName, selectedClass !== "all" ? classes.find(c => c.id === selectedClass)?.name : undefined)
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Liste des élèves (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const periodName = selectedPeriodData?.name || "Période"
                  const classesExport = filteredClassAnalyses.map((c) => ({
                    name: c.classData.name,
                    level: c.classData.level?.name || "",
                    section: c.classData.section?.name || "",
                    studentCount: c.students.length,
                    average: c.average,
                    passRate: c.passRate,
                    excellenceRate: c.excellenceRate,
                    failureRate: c.failureRate,
                    bestStudentName: c.bestStudent ? `${c.bestStudent.student.last_name} ${c.bestStudent.student.first_name}` : "",
                    bestStudentAverage: c.bestStudent?.average || 0,
                  }))
                  exportClassSummary(classesExport, periodName)
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Résumé par classe (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const periodName = selectedPeriodData?.name || "Période"
                  const subjectsExport = subjectPerformance.map((s) => ({
                    name: s.subject,
                    group: s.group,
                    average: s.average,
                    passRate: s.passRate,
                    noteCount: s.count,
                  }))
                  exportSubjectPerformance(subjectsExport, periodName)
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Performance matières (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  {/* Group periods by year and add annual option */}
                  {Array.from(new Set(periods.map((p) => p.academic_year))).map((year) => (
                    <div key={year}>
                      <SelectItem value={`annual_${year}`} className="font-bold">
                        📊 Année complète {year}
                      </SelectItem>
                      {periods
                        .filter((p) => p.academic_year === year)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.academic_year})
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Classe</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes
                    .filter((c) => selectedSection === "all" || c.section?.name === selectedSection)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Effectif</p>
                    <p className="text-2xl font-bold text-primary">
                      {selectedClass === "all"
                        ? selectedSection === "all"
                          ? allActiveStudents.reduce((sum, c) => sum + c.count, 0)
                          : allActiveStudents.reduce((sum, c) => {
                              const classData = classes.find((cl) => cl.id === c.classId)
                              return classData?.section?.name === selectedSection ? sum + c.count : sum
                            }, 0)
                        : allActiveStudents.find((c) => c.classId === selectedClass)?.count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Moyenne</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(filteredStudents.reduce((sum, s) => sum + s.average, 0) / (filteredStudents.length || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taux Réussite</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {Math.round((filteredStudents.filter((s) => s.average >= 10).length / (filteredStudents.length || 1)) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Star className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Excellence</p>
                    <p className="text-2xl font-bold text-violet-600">
                      {filteredStudents.filter((s) => s.average >= 16).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Medal className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tb. Honneur</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {filteredStudents.filter((s) => s.average >= 14 && s.average < 16).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">En Danger</p>
                    <p className="text-2xl font-bold text-red-600">
                      {filteredStudents.filter((s) => s.average < 8).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="distribution" className="gap-2">
                <PieChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Distribution</span>
              </TabsTrigger>
              <TabsTrigger value="classes" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Par Classe</span>
              </TabsTrigger>
              <TabsTrigger value="subjects" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Par Matière</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Alertes</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution Histogram */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Distribution des Moyennes
                    </CardTitle>
                    <CardDescription>Répartition des élèves par tranche de moyenne</CardDescription>
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
                            formatter={(value: number, name: string) => [value, "Élèves"]}
                          />
                          <Bar dataKey="count" name="Nombre d'élèves" radius={[4, 4, 0, 0]}>
                            {gradeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Mentions Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Répartition des Mentions
                    </CardTitle>
                    <CardDescription>Distribution des élèves par catégorie de mention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ minHeight: 300, height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mentionsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) =>
                              percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                            }
                          >
                            {mentionsData.map((entry, index) => (
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
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top 10 Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Medal className="h-5 w-5 text-amber-500" />
                      Palmarès - Top 10
                    </CardTitle>
                    <CardDescription>Les meilleurs élèves de la sélection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[320px]">
                      <div className="space-y-2">
                        {topStudents.map((student, index) => (
                          <div
                            key={student.student.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg",
                              index === 0
                                ? "bg-amber-500/10 border border-amber-500/30"
                                : index === 1
                                  ? "bg-slate-300/20 border border-slate-400/30"
                                  : index === 2
                                    ? "bg-orange-500/10 border border-orange-500/30"
                                    : "bg-muted/50"
                            )}
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                index === 0
                                  ? "bg-amber-500 text-white"
                                  : index === 1
                                    ? "bg-slate-400 text-white"
                                    : index === 2
                                      ? "bg-orange-500 text-white"
                                      : "bg-primary/20 text-primary"
                              )}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {student.student.last_name} {student.student.first_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.student.class?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-lg font-bold",
                                  student.average >= 16
                                    ? "text-violet-600"
                                    : student.average >= 14
                                      ? "text-blue-600"
                                      : "text-emerald-600"
                                )}
                              >
                                {student.average.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">/20</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Group Performance Radar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Performance par Groupe de Matières
                    </CardTitle>
                    <CardDescription>Comparaison des moyennes par groupe</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ minHeight: 320, height: 320, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={groupPerformance}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="group" className="text-xs" />
                          <PolarRadiusAxis domain={[0, 20]} />
                          <Radar
                            name="Moyenne"
                            dataKey="average"
                            stroke={COLORS.primary}
                            fill={COLORS.primary}
                            fillOpacity={0.5}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques Descriptives</CardTitle>
                    <CardDescription>Analyse statistique détaillée des moyennes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        const averages = filteredStudents.map((s) => s.average).sort((a, b) => a - b)
                        const n = averages.length
                        if (n === 0) return <p className="text-muted-foreground">Aucune donnée</p>

                        const mean = averages.reduce((a, b) => a + b, 0) / n
                        const median = n % 2 === 0
                          ? (averages[n / 2 - 1] + averages[n / 2]) / 2
                          : averages[Math.floor(n / 2)]
                        const min = averages[0]
                        const max = averages[n - 1]
                        const q1 = averages[Math.floor(n * 0.25)]
                        const q3 = averages[Math.floor(n * 0.75)]
                        const variance = averages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
                        const stdDev = Math.sqrt(variance)
                        const cv = (stdDev / mean) * 100

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Moyenne</p>
                                <p className="text-2xl font-bold">{mean.toFixed(2)}</p>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Médiane</p>
                                <p className="text-2xl font-bold">{median.toFixed(2)}</p>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Écart-type</p>
                                <p className="text-2xl font-bold">{stdDev.toFixed(2)}</p>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Coef. Variation</p>
                                <p className="text-2xl font-bold">{cv.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Distribution (Min - Q1 - Med - Q3 - Max)</p>
                              <div className="flex items-center gap-2 text-sm font-mono">
                                <span className="text-red-500">{min.toFixed(1)}</span>
                                <Minus className="h-3 w-3" />
                                <span>{q1.toFixed(1)}</span>
                                <Minus className="h-3 w-3" />
                                <span className="text-primary font-bold">{median.toFixed(1)}</span>
                                <Minus className="h-3 w-3" />
                                <span>{q3.toFixed(1)}</span>
                                <Minus className="h-3 w-3" />
                                <span className="text-emerald-500">{max.toFixed(1)}</span>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Cumulative Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution Cumulative</CardTitle>
                    <CardDescription>Pourcentage d'élèves sous chaque seuil</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ minHeight: 300, height: 300, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={(() => {
                            const thresholds = [5, 8, 10, 12, 14, 16, 18, 20]
                            const n = filteredStudents.length || 1
                            return thresholds.map((threshold) => ({
                              threshold: `${threshold}/20`,
                              percentage: Math.round(
                                (filteredStudents.filter((s) => s.average <= threshold).length / n) * 100
                              ),
                            }))
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="threshold" className="text-xs" />
                          <YAxis domain={[0, 100]} className="text-xs" unit="%" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value}%`, "Élèves"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="percentage"
                            stroke={COLORS.primary}
                            fill={COLORS.primary}
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full Student List */}
              <Card>
                <CardHeader>
                  <CardTitle>Liste Complète des Élèves</CardTitle>
                  <CardDescription>
                    {filteredStudents.length} élève(s) - Triés par moyenne décroissante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rang</TableHead>
                          <TableHead>Nom & Prénom</TableHead>
                          <TableHead>Classe</TableHead>
                          <TableHead className="text-center">Moyenne</TableHead>
                          <TableHead className="text-center">Mention</TableHead>
                          <TableHead className="text-center">Statut</TableHead>
                          <TableHead className="w-20 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.student.id}>
                            <TableCell className="font-medium">{student.rank}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {student.student.last_name} {student.student.first_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.student.matricule}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{student.student.class?.name}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "font-bold",
                                  student.average >= 16
                                    ? "text-violet-600"
                                    : student.average >= 14
                                      ? "text-blue-600"
                                      : student.average >= 10
                                        ? "text-emerald-600"
                                        : student.average >= 8
                                          ? "text-amber-600"
                                          : "text-red-600"
                                )}
                              >
                                {student.average.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  student.average >= 16
                                    ? "border-violet-500 text-violet-600 bg-violet-50"
                                    : student.average >= 14
                                      ? "border-blue-500 text-blue-600 bg-blue-50"
                                      : student.average >= 12
                                        ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                                        : student.average >= 10
                                          ? "border-lime-500 text-lime-600 bg-lime-50"
                                          : "border-red-500 text-red-600 bg-red-50"
                                )}
                              >
                                {student.average >= 16
                                  ? "Excellent"
                                  : student.average >= 14
                                    ? "Très Bien"
                                    : student.average >= 12
                                      ? "Bien"
                                      : student.average >= 10
                                        ? "Passable"
                                        : "Insuffisant"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {student.isExcellent ? (
                                <Badge className="bg-violet-500">Excellence</Badge>
                              ) : student.average >= 14 ? (
                                <Badge className="bg-amber-500">Tb. Honneur</Badge>
                              ) : student.average >= 10 ? (
                                <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                                  Admis
                                </Badge>
                              ) : student.isAtRisk ? (
                                <Badge variant="destructive">En danger</Badge>
                              ) : (
                                <Badge variant="outline" className="border-red-500 text-red-600">
                                  Ajourné
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setProfileModalOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Classes Tab */}
            <TabsContent value="classes" className="space-y-6">
              {/* Class Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparaison Inter-Classes</CardTitle>
                  <CardDescription>Performance moyenne et taux de réussite par classe</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="class" className="text-xs" angle={-45} textAnchor="end" height={80} />
                        <YAxis yAxisId="left" domain={[0, 20]} className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} className="text-xs" unit="%" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="average" name="Moyenne" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="passRate" name="Taux réussite (%)" stroke={COLORS.success} strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Class Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClassAnalyses.map((classAnalysis) => (
                  <Card key={classAnalysis.classData.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>{classAnalysis.classData.name}</span>
                        <Badge variant="outline">{classAnalysis.students.length} élèves</Badge>
                      </CardTitle>
                      <CardDescription>
                        {classAnalysis.classData.level?.name} - {classAnalysis.classData.section?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Moyenne</p>
                          <p className={cn(
                            "text-lg font-bold",
                            classAnalysis.average >= 12 ? "text-emerald-600" :
                            classAnalysis.average >= 10 ? "text-amber-600" : "text-red-600"
                          )}>
                            {classAnalysis.average.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Réussite</p>
                          <p className="text-lg font-bold text-emerald-600">{classAnalysis.passRate}%</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Excellence</p>
                          <p className="text-lg font-bold text-violet-600">{classAnalysis.excellenceRate}%</p>
                        </div>
                      </div>

                      {/* Best/Worst Student */}
                      <div className="space-y-2">
                        {classAnalysis.bestStudent && (
                          <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                            <Medal className="h-4 w-4 text-amber-500" />
                            <span className="text-sm flex-1 truncate">
                              {classAnalysis.bestStudent.student.last_name} {classAnalysis.bestStudent.student.first_name}
                            </span>
                            <span className="text-sm font-bold text-emerald-600">
                              {classAnalysis.bestStudent.average.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {classAnalysis.failureRate > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm">
                              {classAnalysis.students.filter((s) => s.average < 10).length} élève(s) en échec
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mini Distribution */}
                      <div className="flex gap-1">
                        {classAnalysis.distribution.map((d, i) => (
                          <div
                            key={i}
                            className="flex-1 h-2 rounded-full"
                            style={{
                              backgroundColor: d.color,
                              opacity: d.count > 0 ? 1 : 0.2,
                            }}
                            title={`${d.range}: ${d.count} élève(s)`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="space-y-6">
              {/* Subject Performance Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance par Matière</CardTitle>
                  <CardDescription>Moyenne et taux de réussite par matière</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPerformance.slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 20]} className="text-xs" />
                        <YAxis type="category" dataKey="subject" width={120} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="average" name="Moyenne" radius={[0, 4, 4, 0]}>
                          {subjectPerformance.slice(0, 15).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.average >= 14
                                  ? COLORS.success
                                  : entry.average >= 10
                                    ? COLORS.primary
                                    : entry.average >= 8
                                      ? COLORS.warning
                                      : COLORS.danger
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Subject Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Détail par Matière</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matière</TableHead>
                          <TableHead>Groupe</TableHead>
                          <TableHead className="text-center">Moyenne</TableHead>
                          <TableHead className="text-center">Taux Réussite</TableHead>
                          <TableHead className="text-center">Notes</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectPerformance.map((subject) => (
                          <TableRow key={subject.subject}>
                            <TableCell className="font-medium">{subject.subject}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{subject.group}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "font-bold",
                                  subject.average >= 14
                                    ? "text-emerald-600"
                                    : subject.average >= 10
                                      ? "text-primary"
                                      : "text-red-600"
                                )}
                              >
                                {subject.average.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  "font-medium",
                                  subject.passRate >= 70
                                    ? "text-emerald-600"
                                    : subject.passRate >= 50
                                      ? "text-amber-600"
                                      : "text-red-600"
                                )}
                              >
                                {subject.passRate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {subject.count}
                            </TableCell>
                            <TableCell>
                              <Progress
                                value={(subject.average / 20) * 100}
                                className={cn(
                                  "h-2",
                                  subject.average >= 14
                                    ? "[&>div]:bg-emerald-500"
                                    : subject.average >= 10
                                      ? "[&>div]:bg-primary"
                                      : "[&>div]:bg-red-500"
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students at Risk */}
                <Card className="border-red-200">
                  <CardHeader className="bg-red-50">
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Élèves en Danger ({studentsAtRisk.length})
                    </CardTitle>
                    <CardDescription>Élèves avec une moyenne inférieure à 8/20</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[350px]">
                      {studentsAtRisk.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mb-2 text-emerald-500" />
                          <p>Aucun élève en danger critique</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {studentsAtRisk.map((student) => (
                            <div
                              key={student.student.id}
                              className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                            >
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {student.student.last_name} {student.student.first_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.student.class?.name} - Mat: {student.student.matricule}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-red-600">
                                  {student.average.toFixed(2)}
                                </p>
                                <p className="text-xs text-red-500">
                                  {student.weakSubjects.length} matière(s) faible(s)
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Subjects with High Failure Rate */}
                <Card className="border-amber-200">
                  <CardHeader className="bg-amber-50">
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <BookOpen className="h-5 w-5" />
                      Matières Critiques
                    </CardTitle>
                    <CardDescription>Matières avec un taux d'échec supérieur à 50%</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[350px]">
                      {(() => {
                        const criticalSubjects = subjectPerformance.filter((s) => s.passRate < 50)
                        if (criticalSubjects.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                              <CheckCircle className="h-12 w-12 mb-2 text-emerald-500" />
                              <p>Aucune matière critique</p>
                            </div>
                          )
                        }
                        return (
                          <div className="space-y-2">
                            {criticalSubjects.map((subject) => (
                              <div
                                key={subject.subject}
                                className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                              >
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                  <XCircle className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{subject.subject}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Groupe: {subject.group}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-amber-600">
                                    {subject.average.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-amber-500">
                                    {100 - subject.passRate}% d'échec
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Résumé des Alertes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-red-600">
                          {filteredStudents.filter((s) => s.average < 8).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Élèves en danger critique</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                        <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-amber-600">
                          {filteredStudents.filter((s) => s.average >= 8 && s.average < 10).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Élèves à surveiller</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
                        <BookOpen className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-orange-600">
                          {subjectPerformance.filter((s) => s.passRate < 50).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Matières critiques</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-600">
                          {Math.round((filteredStudents.filter((s) => s.average >= 10).length / (filteredStudents.length || 1)) * 100)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Taux de réussite global</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        student={selectedStudent}
        totalStudents={filteredStudents.length}
      />
    </AppLayout>
  )
}
