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
} from "recharts"
import {
  Download,
  Users,
  Award,
  Target,
  FileText,
  Printer,
  CheckCircle,
  GraduationCap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { determinePromotion, calculateRanks } from "@/lib/calculations"
import { generateAnnualBulletinPDF, AnnualBulletinData } from "@/lib/services/annual-bulletin-pdf-generator"

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
    min_promotion_average?: number
    min_rattrapage_average?: number
    unranked_coef_threshold?: number
    next_class_id?: string
    next_class?: { name: string }
    level_id: string
    level?: { id: string; name: string }
    section?: { id: string; name: string }
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
  level_subject?: { coefficient: number }
}

interface AcademicPeriod {
  id: string
  name: string
  type: string
  number: number
  academic_year: string
  parent_id?: string
}

interface SequenceData {
  sequence: AcademicPeriod
  students: Map<string, { average: number | "NC"; grades: Record<string, number> }>
  overall: { average: number; passRate: number; excellenceRate: number }
}

interface SubjectSummary {
  name: string
  coefficient: number
  group: string
  sequences: (number | "NC")[]
  trimesters: (number | "NC")[]
  annual: number | "NC"
}

interface AnnualStudentSummary {
  student: Student
  subjects: SubjectSummary[]
  sequenceAverages: (number | "NC")[]
  sequenceRankings: (number | "-")[]
  trimesterAverages: { 
    t1: number | "NC" | null; 
    t2: number | "NC" | null; 
    t3: number | "NC" | null 
  }
  trimesterRankings: { 
    t1: number | "-"; 
    t2: number | "-"; 
    t3: number | "-" 
  }
  annualAverage: number | "NC"
  annualRank: number | "-"
  annualMention: string
  bestSequence: number | null
  worstSequence: number | null
  trend: "improving" | "stable" | "declining"
  promotion?: {
    promoted: boolean
    nextClass: string | null
    decision: string
  }
}

const SEQUENCE_COLORS = ["#3B82F6", "#06B6D4", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"]

export default function AnnualBulletinPage() {
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<"fr" | "en">("fr")
  const [academicYear, setAcademicYear] = useState<string>("")
  const [years, setYears] = useState<string[]>([])
  const [sections, setSections] = useState<{ id: string; name: string }[]>([])
  const [selectedSection, setSelectedSection] = useState<string>("all")
  const [selectedTrimester, setSelectedTrimester] = useState<string>("all")
  const [trimesters, setTrimesters] = useState<AcademicPeriod[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  // Data state
  const [sequenceData, setSequenceData] = useState<SequenceData[]>([])
  const [annualStudents, setAnnualStudents] = useState<AnnualStudentSummary[]>([])
  const [schoolSettings, setSchoolSettings] = useState<any>(null)
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

  useEffect(() => {
    const browserLang = navigator.language?.startsWith("en") ? "en" : "fr"
    setLanguage(browserLang)
  }, [])

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const { data: periodsRes } = await supabase
          .from("academic_periods")
          .select("academic_year")
          .order("academic_year", { ascending: false })
          .distinct()

        const uniqueYears = [...new Set((periodsRes || []).map((p) => p.academic_year))]
        setYears(uniqueYears)

        if (uniqueYears.length > 0) {
          setAcademicYear(uniqueYears[0])
        } else {
          setLoading(false)
        }

        const { data: sectionsRes } = await supabase.from("sections").select("id, name")
        setSections(sectionsRes || [])

        const { data: settingsRes } = await supabase.from("school_settings").select("*").maybeSingle()
        setSchoolSettings(settingsRes)
      } catch (error) {
        console.error("[v0] Error fetching initial data:", error)
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    if (!academicYear) return

    async function loadTrimesters() {
      try {
        const { data: trimestersRes } = await supabase
          .from("academic_periods")
          .select("*")
          .eq("type", "trimester")
          .eq("academic_year", academicYear)
          .order("number", { ascending: true })
        
        setTrimesters((trimestersRes || []) as AcademicPeriod[])
        setSelectedTrimester("all")
      } catch (error) {
        console.error("[v0] Error loading trimesters:", error)
      }
    }

    loadTrimesters()
  }, [academicYear])

  useEffect(() => {
    if (!academicYear) {
      setLoading(false)
      return
    }

    async function fetchAnnualData() {
      setLoading(true)
      try {
        let periods: AcademicPeriod[] = []
        let periodIds: string[] = []

        if (selectedTrimester === "all") {
          const { data: periodsData } = await supabase
            .from("academic_periods")
            .select("*")
            .eq("type", "sequence")
            .eq("academic_year", academicYear)
            .order("number", { ascending: true })

          periods = (periodsData || []) as AcademicPeriod[]
          periodIds = periods.map((p) => p.id)
        } else {
          const { data: periodsData } = await supabase
            .from("academic_periods")
            .select("*")
            .eq("type", "sequence")
            .eq("parent_id", selectedTrimester)
            .order("number", { ascending: true })

          periods = (periodsData || []) as AcademicPeriod[]
          periodIds = periods.map((p) => p.id)
        }

        if (periodIds.length === 0) {
          setSequenceData([])
          setAnnualStudents([])
          setLoading(false)
          return
        }

        const { data: gradesData } = await supabase
          .from("grades")
          .select(`
            id, score, coefficient, student_id, subject_id, academic_period_id, level_subject_id,
            subject:subjects(id, name, subject_group:subject_groups(name)),
            student:students(
              id, first_name, last_name, matricule, gender, class_id, is_ranked,
              class:classes(
                id, name, level_id, min_promotion_average, min_rattrapage_average, unranked_coef_threshold,
                next_class:classes!next_class_id(name),
                level:levels(id, name), 
                section:sections(id, name)
              )
            ),
            level_subject:level_subjects(coefficient)
          `)
          .in("academic_period_id", periodIds)

        const grades = (gradesData || []) as any[]

        const { data: allSubjectsData } = await supabase
          .from("subjects")
          .select("id, name, subject_group:subject_groups(name)")
        const subjectsMap = new Map<string, any>()
        ;(allSubjectsData || []).forEach(s => subjectsMap.set(s.id, s))

        const classIds = [...new Set(grades.map(g => g.student?.class_id).filter(Boolean))] as string[]
        const { data: classSubjectsData } = await supabase
          .from("class_subjects")
          .select("class_id, subject_id, coefficient")
          .in("class_id", classIds)

        const classSubjectsMap = new Map<string, Array<{subject_id: string, coefficient: number}>>()
        ;(classSubjectsData || []).forEach(cs => {
          const existing = classSubjectsMap.get(cs.class_id) || []
          existing.push({ subject_id: cs.subject_id, coefficient: cs.coefficient })
          classSubjectsMap.set(cs.class_id, existing)
        })

        const { data: levelSubjectsData } = await supabase
          .from("level_subjects")
          .select("id, level_id, subject_id, coefficient")
        const levelSubjectsMap = new Map<string, number>()
        ;(levelSubjectsData || []).forEach((ls) => {
          levelSubjectsMap.set(`${ls.level_id}_${ls.subject_id}`, ls.coefficient)
        })

        const sequencesData: SequenceData[] = []

        for (const period of periods) {
          const periodGrades = grades.filter((g) => g.academic_period_id === period.id)
          const studentGradesMap = new Map<string, typeof periodGrades>()
          periodGrades.forEach((g) => {
            if (!g.student) return
            const existing = studentGradesMap.get(g.student_id) || []
            existing.push(g)
            studentGradesMap.set(g.student_id, existing)
          })

          const studentAverages = new Map<string, number | "NC">()
          const studentGradesRecord = new Map<string, Record<string, number>>()

          studentGradesMap.forEach((studentGrades, studentId) => {
            const student = studentGrades[0]?.student
            if (!student) return
            if (selectedSection !== "all" && student.class?.section?.id !== selectedSection) return

            const classId = student.class?.id
            const unrankedThreshold = student.class?.unranked_coef_threshold || 0
            const expectedSubjects = classSubjectsMap.get(classId) || []
            const levelId = student.class?.level_id
            const subjectGrades = new Map<string, { scores: number[]; coef: number; subject_id: string }>()

            studentGrades.forEach((grade) => {
              const subjectName = grade.subject?.name || "Unknown"
              let coef = 1
              if (levelId && grade.subject_id) {
                const lsCoef = levelSubjectsMap.get(`${levelId}_${grade.subject_id}`)
                coef = lsCoef !== undefined ? lsCoef : (grade.level_subject?.coefficient || grade.coefficient || 1)
              } else {
                coef = grade.level_subject?.coefficient || grade.coefficient || 1
              }

              const existing = subjectGrades.get(subjectName) || { scores: [], coef, subject_id: grade.subject_id }
              existing.scores.push(grade.score)
              subjectGrades.set(subjectName, existing)
            })

            if (unrankedThreshold > 0 && expectedSubjects.length > 0) {
              let missingCoefSum = 0
              const composedSubjectIds = new Set(Array.from(subjectGrades.values()).map(sg => sg.subject_id))
              expectedSubjects.forEach(es => {
                if (!composedSubjectIds.has(es.subject_id)) missingCoefSum += es.coefficient
              })
              if (missingCoefSum >= unrankedThreshold) {
                studentAverages.set(studentId, "NC")
                studentGradesRecord.set(studentId, {})
                return
              }
            }

            let totalWeighted = 0, totalCoef = 0
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

          const allAverages = Array.from(studentAverages.values()).filter(a => typeof a === "number") as number[]
          sequencesData.push({
            sequence: period,
            students: new Map(
              Array.from(studentGradesMap.keys())
                .filter(id => selectedSection === "all" || studentGradesMap.get(id)?.[0]?.student?.class?.section?.id === selectedSection)
                .map(id => [id, { average: studentAverages.get(id) ?? 0, grades: studentGradesRecord.get(id) || {} }])
            ),
            overall: { 
              average: allAverages.length > 0 ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100) / 100 : 0,
              passRate: allAverages.length > 0 ? Math.round((allAverages.filter(a => a >= 10).length / allAverages.length) * 100) : 0,
              excellenceRate: allAverages.length > 0 ? Math.round((allAverages.filter(a => a >= 16).length / allAverages.length) * 100) : 0
            },
          })
        }

        setSequenceData(sequencesData)

        const allStudentIds = new Set<string>()
        sequencesData.forEach(seq => seq.students.forEach((_, id) => allStudentIds.add(id)))

        const sequenceRankingsMap = new Map<string, Map<string, number>>()
        sequencesData.forEach(seq => {
          const studentAvgs: {id: string, average: number}[] = []
          seq.students.forEach((data, id) => { if (typeof data.average === "number") studentAvgs.push({ id, average: data.average }) })
          const ranked = calculateRanks(studentAvgs)
          const rankMap = new Map<string, number>()
          ranked.forEach(r => rankMap.set(r.id, r.rank))
          sequenceRankingsMap.set(seq.sequence.id, rankMap)
        })

        const annualSummaries: AnnualStudentSummary[] = []

        allStudentIds.forEach((studentId) => {
          const student = grades.find(g => g.student_id === studentId)?.student
          if (!student) return

          const sequenceAvgs = sequencesData.map(seq => seq.students.get(studentId)?.average ?? "NC")
          const seqRankings = sequencesData.map(seq => sequenceRankingsMap.get(seq.sequence.id)?.get(studentId) ?? "-")

          const studentClassSubjects = classSubjectsMap.get(student.class?.id || "") || []
          const subjectSummaries: SubjectSummary[] = studentClassSubjects.map(cs => {
            const subjectInfo = subjectsMap.get(cs.subject_id)
            const subjectName = subjectInfo?.name
            const subjectGrades = sequencesData.map(seq => {
              const studentSeqData = seq.students.get(studentId)
              if (!studentSeqData || studentSeqData.average === "NC") return "NC"
              return subjectName ? (studentSeqData.grades[subjectName] ?? "NC") : "NC"
            })

            const calcTrimScore = (scores: (number | "NC")[]) => {
              const numeric = scores.filter(s => typeof s === "number") as number[]
              return numeric.length === 0 ? "NC" : Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 100) / 100
            }

            const t1_s = calcTrimScore([subjectGrades[0], subjectGrades[1]])
            const t2_s = calcTrimScore([subjectGrades[2], subjectGrades[3]])
            const t3_s = calcTrimScore([subjectGrades[4], subjectGrades[5]])

            const annual_scores = [t1_s, t2_s, t3_s].filter(s => typeof s === "number") as number[]
            const annual_s = annual_scores.length > 0 ? Math.round((annual_scores.reduce((a, b) => a + b, 0) / annual_scores.length) * 100) / 100 : "NC"

            return {
              name: subjectName || "Unknown",
              coefficient: cs.coefficient,
              group: subjectInfo?.subject_group?.name || "Groupe I",
              sequences: subjectGrades,
              trimesters: [t1_s, t2_s, t3_s],
              annual: annual_s
            }
          })

          const calcTrimAvg = (trimIdx: number) => {
            const trimId = trimesters[trimIdx]?.id
            if (!trimId) return null
            const seqs = sequencesData.filter(s => s.sequence.parent_id === trimId)
            if (seqs.length === 0) return null
            const avgs = seqs.map(s => s.students.get(studentId)?.average).filter(a => a !== undefined)
            if (avgs.some(a => a === "NC")) return "NC"
            const numeric = avgs.filter(a => typeof a === "number") as number[]
            return numeric.length === 0 ? "NC" : Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 100) / 100
          }

          const t1_avg = calcTrimAvg(0), t2_avg = calcTrimAvg(1), t3_avg = calcTrimAvg(2)
          const trimesterAvgs = [t1_avg, t2_avg, t3_avg].filter(a => a !== null)
          let annualAvg: number | "NC" = "NC"
          if (trimesterAvgs.length > 0) {
            if (trimesterAvgs.some(a => a === "NC")) annualAvg = "NC"
            else {
              const numeric = trimesterAvgs.filter(a => typeof a === "number") as number[]
              annualAvg = numeric.length > 0 ? Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 100) / 100 : "NC"
            }
          }

          const numericSeqAvgs = sequenceAvgs.filter(a => typeof a === "number") as number[]
          annualSummaries.push({
            student,
            subjects: subjectSummaries,
            sequenceAverages: sequenceAvgs,
            sequenceRankings: seqRankings,
            trimesterAverages: { t1: t1_avg, t2: t2_avg, t3: t3_avg },
            trimesterRankings: { t1: "-", t2: "-", t3: "-" },
            annualAverage: annualAvg,
            annualRank: "-",
            annualMention: "",
            bestSequence: numericSeqAvgs.length > 0 ? Math.max(...numericSeqAvgs) : null,
            worstSequence: numericSeqAvgs.length > 0 ? Math.min(...numericSeqAvgs) : null,
            trend: numericSeqAvgs.length >= 2 ? (numericSeqAvgs[numericSeqAvgs.length-1] > numericSeqAvgs[0] ? "improving" : numericSeqAvgs[numericSeqAvgs.length-1] < numericSeqAvgs[0] ? "declining" : "stable") : "stable",
          })
        })

        const setTrimRankings = (key: "t1" | "t2" | "t3") => {
          const avgs: {id: string, average: number}[] = []
          annualSummaries.forEach(s => { if (typeof s.trimesterAverages[key] === "number") avgs.push({ id: s.student.id, average: s.trimesterAverages[key] as number }) })
          const ranked = calculateRanks(avgs)
          ranked.forEach(r => { const s = annualSummaries.find(x => x.student.id === r.id); if (s) s.trimesterRankings[key] = r.rank })
        }
        setTrimRankings("t1"); setTrimRankings("t2"); setTrimRankings("t3")

        const annualNumeric = annualSummaries.filter(s => typeof s.annualAverage === "number").map(s => ({ id: s.student.id, average: s.annualAverage as number }))
        const rankedAnnual = calculateRanks(annualNumeric)
        rankedAnnual.forEach(r => { const s = annualSummaries.find(x => x.student.id === r.id); if (s) s.annualRank = r.rank })

        annualSummaries.forEach(s => {
          if (typeof s.annualAverage === "number") {
            const minProm = s.student.class?.min_promotion_average || 10
            const minRattrapage = s.student.class?.min_rattrapage_average || 8
            const nextClassName = s.student.class?.next_class?.name || null
            
            const decision = determinePromotion(
              s.annualAverage, 
              s.student.class?.name || "", 
              s.student.class?.section?.name || "", 
              true,
              minProm,
              minRattrapage,
              nextClassName
            )
            s.promotion = decision
          } else {
            s.promotion = { promoted: false, nextClass: null, decision: "Non Classé - Redoublement" }
          }
        })

        annualSummaries.sort((a, b) => (a.annualRank === "-" ? 1 : b.annualRank === "-" ? -1 : (a.annualRank as number) - (b.annualRank as number)))
        setAnnualStudents(annualSummaries)

        const numericAnnual = annualSummaries.map(s => s.annualAverage).filter(a => typeof a === "number") as number[]
        setSchoolStats({
          totalStudents: annualSummaries.length,
          annualAverage: numericAnnual.length > 0 ? Math.round((numericAnnual.reduce((a, b) => a + b, 0) / numericAnnual.length) * 100) / 100 : 0,
          passRate: numericAnnual.length > 0 ? Math.round((numericAnnual.filter(a => a >= 10).length / numericAnnual.length) * 100) : 0,
          excellenceRate: numericAnnual.length > 0 ? Math.round((numericAnnual.filter(a => a >= 16).length / numericAnnual.length) * 100) : 0,
          honorCount: numericAnnual.filter(a => a >= 14 && a < 16).length,
          excellenceCount: numericAnnual.filter(a => a >= 16).length,
          atRiskCount: numericAnnual.filter(a => a < 8).length,
        })
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching annual data:", error)
        setLoading(false)
      }
    }
    fetchAnnualData()
  }, [academicYear, selectedSection, selectedTrimester, trimesters])

  const sequenceChartData = useMemo(() => sequenceData.map((seq, idx) => ({
    name: `${language === "fr" ? "Séquence" : "Sequence"} ${seq.sequence.number}`,
    average: seq.overall.average,
    passRate: seq.overall.passRate,
    fill: SEQUENCE_COLORS[idx % SEQUENCE_COLORS.length],
  })), [sequenceData, language])

  const studentTrendData = useMemo(() => annualStudents.slice(0, 10).map((s) => ({
    name: `${s.student.first_name} ${s.student.last_name}`,
    ...Object.fromEntries(s.sequenceAverages.map((avg, idx) => [`${language === "fr" ? "Seq" : "Seq"} ${idx + 1}`, avg === "NC" ? 0 : avg]))
  })), [annualStudents, language])

  const translations = {
    fr: {
      title: "BULLETIN ANNUEL", subtitle: "Récapitulatif complet de l'année académique", academicYear: "Année académique", section: "Section", allSections: "Toutes les sections", loading: "Chargement...", overview: "Vue d'ensemble", sequences: "Séquences", students: "Élèves", analysis: "Analyse", totalStudents: "Élèves total", annualAverage: "Moyenne annuelle", passRate: "Taux de réussite", excellenceRate: "Taux d'excellence", honorCount: "Tableau d'honneur", excellenceCount: "Excellence", atRisk: "En danger", sequencePerformance: "Performance par séquence", top10Students: "Top 10 Élèves", studentName: "Nom de l'élève", class: "Classe", sequenceAverages: "Moyennes par séquence", annualMention: "Mention annuelle", trend: "Tendance", improving: "En amélioration", stable: "Stable", declining: "En baisse", print: "Imprimer", download: "Télécharger", noData: "Aucune donnée disponible", rank: "Rang", excellent: "Excellent", veryGood: "Très Bien", good: "Bien", fairlyGood: "Assez Bien", insufficient: "Insuffisant", statisticalAnalysis: "Analyse statistique annuelle", sequenceDistribution: "Distribution par séquence", studentsRanking: "Classement des élèves", annualEvolution: "Évolution annuelle", excellence: "Excellence", passRateLabel: "Taux de réussite (≥ 10/20)", failureRateLabel: "Taux d'échec (< 8/20)", atRiskLabel: "Élèves en danger",
    },
    en: {
      title: "ANNUAL REPORT", subtitle: "Complete academic year summary", academicYear: "Academic Year", section: "Section", allSections: "All Sections", loading: "Loading...", overview: "Overview", sequences: "Sequences", students: "Students", analysis: "Analysis", totalStudents: "Total Students", annualAverage: "Annual Average", passRate: "Pass Rate", excellenceRate: "Excellence Rate", honorCount: "Honor Roll", excellenceCount: "Excellence", atRisk: "At Risk", sequencePerformance: "Performance by Sequence", top10Students: "Top 10 Students", studentName: "Student Name", class: "Class", sequenceAverages: "Averages by Sequence", annualMention: "Annual Mention", trend: "Trend", improving: "Improving", stable: "Stable", declining: "Declining", print: "Print", download: "Download", noData: "No data available", rank: "Rank", excellent: "Excellent", veryGood: "Very Good", good: "Good", fairlyGood: "Fairly Good", insufficient: "Insufficient", statisticalAnalysis: "Annual Statistical Analysis", sequenceDistribution: "Distribution by Sequence", studentsRanking: "Students Ranking", annualEvolution: "Annual Evolution", excellence: "Excellence", passRateLabel: "Pass Rate (≥ 10/20)", failureRateLabel: "Failure Rate (< 8/20)", atRiskLabel: "Students at Risk",
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <PageHeader title={t.title} description={t.subtitle} icon={FileText} />
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" />{t.print}</Button>
            <Button variant={language === "fr" ? "default" : "outline"} size="sm" onClick={() => setLanguage("fr")}>FR</Button>
            <Button variant={language === "en" ? "default" : "outline"} size="sm" onClick={() => setLanguage("en")}>EN</Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder={t.academicYear} /></SelectTrigger>
            <SelectContent>{years.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder={t.section} /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t.allSections}</SelectItem>{sections.map((section) => (<SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={selectedTrimester} onValueChange={setSelectedTrimester}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Période" /></SelectTrigger>
            <SelectContent><SelectItem value="all">{language === "fr" ? "Toute l'année" : "Full Year"}</SelectItem>{trimesters.map((tr) => (<SelectItem key={tr.id} value={tr.id}>{language === "fr" ? `${tr.number}${tr.number === 1 ? "er" : "e"} trimestre` : `Term ${tr.number}`}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        {loading ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-24" />))}</div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />{t.totalStudents}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{schoolStats.totalStudents}</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Target className="w-4 h-4" />{t.annualAverage}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{schoolStats.annualAverage.toFixed(2)}</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle className="w-4 h-4" />{t.passRate}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{schoolStats.passRate}%</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Award className="w-4 h-4" />{t.excellenceRate}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{schoolStats.excellenceRate}%</div></CardContent></Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="sequences">{t.sequences}</TabsTrigger>
            <TabsTrigger value="students">{t.students}</TabsTrigger>
            <TabsTrigger value="analysis">{t.analysis}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {loading ? <Skeleton className="h-96" /> : (
              <>
                <Card><CardHeader><CardTitle>{t.sequencePerformance}</CardTitle></CardHeader><CardContent>{sequenceChartData.length > 0 ? (<ResponsiveContainer width="100%" height={300}><BarChart data={sequenceChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 20]} /><Tooltip /><Bar dataKey="average" fill="#3B82F6" name={t.annualAverage} /></BarChart></ResponsiveContainer>) : (<div className="text-center py-8 text-muted-foreground">{t.noData}</div>)}</CardContent></Card>
                {studentTrendData.length > 0 && (<Card><CardHeader><CardTitle>{t.top10Students}</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={studentTrendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-45} textAnchor="end" height={80} /><YAxis domain={[0, 20]} /><Tooltip /><Legend />{Object.keys(studentTrendData[0] || {}).filter(k => k.startsWith("Seq")).map((k, i) => (<Line key={k} type="monotone" dataKey={k} stroke={SEQUENCE_COLORS[i % SEQUENCE_COLORS.length]} />))}</LineChart></ResponsiveContainer></CardContent></Card>)}
              </>
            )}
          </TabsContent>

          <TabsContent value="sequences" className="space-y-4">
            {loading ? <Skeleton className="h-96" /> : sequenceData.length > 0 ? sequenceData.map((seq, i) => (
              <Card key={seq.sequence.id}><CardHeader><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: SEQUENCE_COLORS[i % SEQUENCE_COLORS.length] }} /><CardTitle>{language === "fr" ? "Séquence" : "Sequence"} {seq.sequence.number} - {seq.sequence.name}</CardTitle></div></CardHeader><CardContent><div className="grid grid-cols-3 gap-4 mb-6"><div><p className="text-sm text-muted-foreground">{t.annualAverage}</p><p className="text-2xl font-bold">{seq.overall.average.toFixed(2)}</p></div><div><p className="text-sm text-muted-foreground">{t.passRate}</p><p className="text-2xl font-bold">{seq.overall.passRate}%</p></div><div><p className="text-sm text-muted-foreground">{t.excellenceRate}</p><p className="text-2xl font-bold">{seq.overall.excellenceRate}%</p></div></div></CardContent></Card>
            )) : <Card><CardContent className="pt-6 text-center text-muted-foreground">{t.noData}</CardContent></Card>}
          </TabsContent>

          <TabsContent value="students">
            {loading ? <Skeleton className="h-96" /> : annualStudents.length > 0 ? (
              <Card><CardContent className="pt-6"><ScrollArea className="h-screen"><Table>
                <TableHeader><TableRow><TableHead className="w-12">{t.rank}</TableHead><TableHead>{t.studentName}</TableHead>{sequenceData.map((seq) => (<TableHead key={seq.sequence.id} className="text-center">S{seq.sequence.number}</TableHead>))}<TableHead className="text-center font-bold bg-muted/30">T1</TableHead><TableHead className="text-center font-bold bg-muted/30">T2</TableHead><TableHead className="text-center font-bold bg-muted/30">T3</TableHead><TableHead className="text-right font-bold">{t.annualAverage}</TableHead><TableHead>{t.annualMention}</TableHead><TableHead className="text-right w-16">PDF</TableHead></TableRow></TableHeader>
                <TableBody>{annualStudents.map((s) => (
                  <TableRow key={s.student.id}>
                    <TableCell className="font-bold">{s.annualRank === 1 ? "🥇" : s.annualRank === 2 ? "🥈" : s.annualRank === 3 ? "🥉" : s.annualRank}</TableCell>
                    <TableCell><div className="font-medium">{s.student.last_name} {s.student.first_name}</div><div className="text-xs text-muted-foreground">{s.student.matricule}</div></TableCell>
                    {s.sequenceAverages.map((avg, si) => (<TableCell key={si} className="text-center"><div className="flex flex-col items-center"><Badge variant={avg === "NC" ? "destructive" : "outline"} className="text-[10px] px-1 h-4">{typeof avg === "number" ? avg.toFixed(2) : avg}</Badge><span className="text-[9px] text-muted-foreground">R:{s.sequenceRankings[si]}</span></div></TableCell>))}
                    <TableCell className="text-center bg-muted/10"><div className="flex flex-col items-center"><span className="font-bold">{typeof s.trimesterAverages.t1 === "number" ? s.trimesterAverages.t1.toFixed(2) : s.trimesterAverages.t1 || "-"}</span><span className="text-[9px] text-muted-foreground">R:{s.trimesterRankings.t1}</span></div></TableCell>
                    <TableCell className="text-center bg-muted/10"><div className="flex flex-col items-center"><span className="font-bold">{typeof s.trimesterAverages.t2 === "number" ? s.trimesterAverages.t2.toFixed(2) : s.trimesterAverages.t2 || "-"}</span><span className="text-[9px] text-muted-foreground">R:{s.trimesterRankings.t2}</span></div></TableCell>
                    <TableCell className="text-center bg-muted/10"><div className="flex flex-col items-center"><span className="font-bold">{typeof s.trimesterAverages.t3 === "number" ? s.trimesterAverages.t3.toFixed(2) : s.trimesterAverages.t3 || "-"}</span><span className="text-[9px] text-muted-foreground">R:{s.trimesterRankings.t3}</span></div></TableCell>
                    <TableCell className="text-right font-bold">{typeof s.annualAverage === "number" ? s.annualAverage.toFixed(2) : s.annualAverage}</TableCell>
                    <TableCell><Badge className={cn(typeof s.annualAverage === "number" ? (s.annualAverage >= 16 ? "bg-purple-100 text-purple-800" : s.annualAverage >= 14 ? "bg-blue-100 text-blue-800" : s.annualAverage >= 12 ? "bg-green-100 text-green-800" : s.annualAverage >= 10 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800") : "bg-gray-100 text-gray-800")}>{typeof s.annualAverage === "number" ? getMentionLabel(s.annualAverage, language) : "Non Classé"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const pdfData: AnnualBulletinData = {
                            student: {
                              firstName: s.student.first_name,
                              lastName: s.student.last_name,
                              matricule: s.student.matricule,
                              gender: s.student.gender
                            },
                            className: s.student.class?.name || "",
                            academicYear: academicYear,
                            section: s.student.class?.section?.name || "",
                            studentCount: annualStudents.length,
                            subjects: s.subjects.map(subj => ({
                              ...subj,
                              teacherName: "-" // Placeholder or fetch if available
                            })),
                            summary: {
                              sequenceAverages: s.sequenceAverages,
                              sequenceRankings: s.sequenceRankings,
                              trimesterAverages: [s.trimesterAverages.t1, s.trimesterAverages.t2, s.trimesterAverages.t3].filter(a => a !== null) as (number | "NC")[],
                              trimesterRankings: [s.trimesterRankings.t1, s.trimesterRankings.t2, s.trimesterRankings.t3].filter(r => r !== "-") as (number | "-")[],
                              annualAverage: s.annualAverage,
                              annualRank: s.annualRank,
                              promotion: s.promotion?.decision || ""
                            },
                            schoolSettings: schoolSettings || { school_name: "HARMONY" }
                          }
                          generateAnnualBulletinPDF(pdfData)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table></ScrollArea></CardContent></Card>
            ) : <Card><CardContent className="pt-6 text-center text-muted-foreground">{t.noData}</CardContent></Card>}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {loading ? <Skeleton className="h-96" /> : annualStudents.length > 0 ? (
              <>
                <Card><CardHeader><CardTitle>{language === "fr" ? "Distribution des mentions" : "Mention Distribution"}</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-5 gap-4">{[
                  { label: t.excellent, min: 16, color: "bg-purple-100 text-purple-800" }, { label: t.veryGood, min: 14, max: 15.99, color: "bg-blue-100 text-blue-800" }, { label: t.good, min: 12, max: 13.99, color: "bg-green-100 text-green-800" }, { label: t.fairlyGood, min: 10, max: 11.99, color: "bg-yellow-100 text-yellow-800" }, { label: t.insufficient, max: 9.99, color: "bg-red-100 text-red-800" },
                ].map((m, i) => {
                  const count = annualStudents.filter(s => typeof s.annualAverage === "number" && (m.max === undefined ? s.annualAverage >= m.min : s.annualAverage >= m.min && s.annualAverage < m.max + 0.01)).length
                  const pct = annualStudents.length > 0 ? Math.round((count / annualStudents.length) * 100) : 0
                  return (<div key={i} className={cn("p-4 rounded-lg text-center", m.color)}><div className="text-2xl font-bold">{count}</div><div className="text-sm font-medium">{m.label}</div><div className="text-xs">{pct}%</div></div>)
                })}</div></CardContent></Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{t.passRateLabel}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{schoolStats.passRate}%</div><Progress value={schoolStats.passRate} className="mt-2" /><p className="text-xs text-muted-foreground mt-2">{annualStudents.filter(s => typeof s.annualAverage === "number" && s.annualAverage >= 10).length} / {annualStudents.length}</p></CardContent></Card>
                  <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{t.excellenceRate}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-purple-600">{schoolStats.excellenceRate}%</div><Progress value={schoolStats.excellenceRate} className="mt-2" /><p className="text-xs text-muted-foreground mt-2">{schoolStats.excellenceCount} {language === "fr" ? "élèves" : "students"}</p></CardContent></Card>
                  <Card><CardHeader className="pb-3"><CardTitle className="text-sm">{t.atRiskLabel}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-600">{schoolStats.atRiskCount}</div><Progress value={schoolStats.atRiskCount > 0 ? (schoolStats.atRiskCount / annualStudents.length) * 100 : 0} className="mt-2" /><p className="text-xs text-muted-foreground mt-2">{annualStudents.length > 0 ? Math.round((schoolStats.atRiskCount / annualStudents.length) * 100) : 0}%</p></CardContent></Card>
                </div>
              </>
            ) : <Card><CardContent className="pt-6 text-center text-muted-foreground">{t.noData}</CardContent></Card>}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
