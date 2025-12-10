"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, FileText, Printer, Loader2, Eye } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"
import { BordereauDocument } from "@/components/reports/bordereau-document"
import { generateBordereauPDF } from "@/lib/services/bordereau-pdf-generator"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type ClassType = { id: string; name: string; level_id: string; section_id: string; class_teacher: string | null }
type AcademicPeriod = { id: string; name: string; type: string; number: number; academic_year: string }

type Subject = {
  id: string
  subject_id: string
  name: string
  code: string
  coefficient: number
  group_name: string
}

type StudentReport = {
  student: {
    id: string
    matricule: string
    first_name: string
    last_name: string
    is_ranked?: boolean
  }
  grades: Record<string, number>
  average: number
  rank: number
}

type ReportData = {
  class: ClassType & { level?: { id: string; name: string }; section?: { name: string } }
  period: AcademicPeriod
  subjects: Subject[]
  students: StudentReport[]
  classAverage: number
  subjectAverages: Record<string, number>
}

export default function BordereauxPage() {
  const [mode, setMode] = useState<"class" | "level">("class")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [showReport, setShowReport] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loading, setLoading] = useState(true)

  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)

  const reportRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true)
      try {
        const [sectionsRes, levelsRes, classesRes, periodsRes, settingsRes] = await Promise.all([
          supabase.from("sections").select("*").order("name"),
          supabase.from("levels").select("*").order("order"),
          supabase.from("classes").select("*").order("name"),
          supabase.from("academic_periods").select("*").order("number"),
          supabase.from("school_settings").select("*").limit(1),
        ])

        setSections(sectionsRes.data || [])
        setLevels(levelsRes.data || [])
        setClasses(classesRes.data || [])
        setPeriods(periodsRes.data || [])
        setSchoolSettings(
          settingsRes.data?.[0] || {
            school_name: "HARMONY School",
            school_slogan: "L'excellence au service de l'éducation",
            current_academic_year: "2024-2025",
          },
        )
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  const generateReport = useCallback(async () => {
    setGenerating(true)
    setShowReport(false)

    try {
      let classId = selectedClass
      let classData: any = null

      if (mode === "class" && selectedClass) {
        const { data, error } = await supabase
          .from("classes")
          .select("id, name, level_id, section_id, class_teacher, level:levels(id, name), section:sections(name)")
          .eq("id", selectedClass)
          .single()

        if (error) throw error
        classData = data
      } else if (mode === "level" && selectedLevel && selectedSection) {
        const { data, error } = await supabase
          .from("classes")
          .select("id, name, level_id, section_id, class_teacher, level:levels(id, name), section:sections(name)")
          .eq("level_id", selectedLevel)
          .eq("section_id", selectedSection)
          .limit(1)

        if (error) throw error
        classData = data?.[0]
        classId = classData?.id
      }

      if (!classId || !classData) {
        toast.error("Classe non trouvée")
        setGenerating(false)
        return
      }

      const levelId = classData.level_id

      const { data: period, error: periodError } = await supabase
        .from("academic_periods")
        .select("*")
        .eq("id", selectedPeriod)
        .single()

      if (periodError) throw periodError

      const { data: classSubjectsData } = await supabase
        .from("class_subjects")
        .select("id, subject_id, coefficient, subject:subjects(id, name, code, subject_group:subject_groups(id, name))")
        .eq("class_id", classId)

      const { data: levelSubjectsData } = await supabase
        .from("level_subjects")
        .select("id, subject_id, coefficient, subject:subjects(id, name, code, subject_group:subject_groups(id, name))")
        .eq("level_id", levelId)

      const subjectsMap = new Map<string, Subject>()

      if (classSubjectsData) {
        for (const cs of classSubjectsData) {
          if (cs.subject && cs.subject_id) {
            const subj = cs.subject as any
            subjectsMap.set(cs.subject_id, {
              id: cs.id,
              subject_id: cs.subject_id,
              name: subj.name || "",
              code: subj.code || "",
              coefficient: cs.coefficient || 1,
              group_name: subj.subject_group?.name || "Autres",
            })
          }
        }
      }

      if (levelSubjectsData) {
        for (const ls of levelSubjectsData) {
          if (ls.subject && ls.subject_id && !subjectsMap.has(ls.subject_id)) {
            const subj = ls.subject as any
            subjectsMap.set(ls.subject_id, {
              id: ls.id,
              subject_id: ls.subject_id,
              name: subj.name || "",
              code: subj.code || "",
              coefficient: ls.coefficient || 1,
              group_name: subj.subject_group?.name || "Autres",
            })
          }
        }
      }

      const subjects = Array.from(subjectsMap.values()).sort(
        (a, b) => a.group_name.localeCompare(b.group_name) || a.name.localeCompare(b.name),
      )

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, matricule, first_name, last_name, is_ranked")
        .eq("class_id", classId)
        .ilike("status", "active")
        .order("last_name")

      if (studentsError) throw studentsError

      const studentIds = (students || []).map((s) => s.id)
      const subjectIds = subjects.map((s) => s.subject_id)

      let grades: any[] = []
      if (studentIds.length > 0 && subjectIds.length > 0) {
        const { data: gradesData } = await supabase
          .from("grades")
          .select("student_id, subject_id, score")
          .in("student_id", studentIds)
          .in("subject_id", subjectIds)
          .eq("academic_period_id", selectedPeriod)

        grades = gradesData || []
      }

      const studentReports: StudentReport[] = (students || []).map((student) => {
        const studentGrades = grades.filter((g) => g.student_id === student.id)
        const gradesMap: Record<string, number> = {}
        let totalWeighted = 0
        let totalCoef = 0

        subjects.forEach((subject) => {
          const grade = studentGrades.find((g) => g.subject_id === subject.subject_id)
          if (grade) {
            gradesMap[subject.subject_id] = grade.score
            totalWeighted += grade.score * subject.coefficient
            totalCoef += subject.coefficient
          }
        })

        return {
          student: {
            ...student,
            is_ranked: student.is_ranked !== false, // Par défaut true
          },
          grades: gradesMap,
          average: totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0,
          rank: 0,
        }
      })

      const rankedStudents = studentReports.filter((r) => r.student.is_ranked !== false)
      const unrankedStudents = studentReports.filter((r) => r.student.is_ranked === false)

      const sortedRanked = [...rankedStudents].sort((a, b) => b.average - a.average)
      let currentRank = 1
      sortedRanked.forEach((report, index) => {
        if (index > 0 && report.average < sortedRanked[index - 1].average) {
          currentRank = index + 1
        }
        report.rank = currentRank
      })

      // Les élèves non classés ont un rang de 0 (NC)
      unrankedStudents.forEach((report) => {
        report.rank = 0
      })

      // Combiner: élèves classés triés par rang, puis non classés à la fin
      const allStudents = [...sortedRanked, ...unrankedStudents]

      const classAverage =
        rankedStudents.length > 0
          ? Math.round((rankedStudents.reduce((sum, r) => sum + r.average, 0) / rankedStudents.length) * 100) / 100
          : 0

      const subjectAverages: Record<string, number> = {}
      subjects.forEach((subject) => {
        const rankedStudentIds = rankedStudents.map((r) => r.student.id)
        const subjectGrades = grades.filter(
          (g) => g.subject_id === subject.subject_id && rankedStudentIds.includes(g.student_id),
        )
        if (subjectGrades.length > 0) {
          subjectAverages[subject.subject_id] =
            Math.round((subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length) * 100) / 100
        }
      })

      setReportData({
        class: classData,
        period,
        subjects,
        students: allStudents,
        classAverage,
        subjectAverages,
      })

      setShowReport(true)
      toast.success("Bordereau généré avec succès")
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Erreur lors de la génération du bordereau")
    } finally {
      setGenerating(false)
    }
  }, [supabase, mode, selectedClass, selectedLevel, selectedSection, selectedPeriod])

  const handlePrint = () => window.print()

  const handleDownloadPDF = async () => {
    if (!reportData) return
    setDownloading(true)
    try {
      const subjectsByGroup = reportData.subjects.reduce(
        (acc, s) => {
          if (!acc[s.group_name]) acc[s.group_name] = []
          acc[s.group_name].push(s)
          return acc
        },
        {} as Record<string, Subject[]>,
      )

      await generateBordereauPDF(reportData, schoolSettings, subjectsByGroup)
      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Erreur lors du téléchargement")
    } finally {
      setDownloading(false)
    }
  }

  const filteredLevels = selectedSection ? levels.filter((l) => l.section_id === selectedSection) : levels

  const subjectsByGroup = reportData
    ? reportData.subjects.reduce(
        (acc, s) => {
          if (!acc[s.group_name]) acc[s.group_name] = []
          acc[s.group_name].push(s)
          return acc
        },
        {} as Record<string, Subject[]>,
      )
    : {}

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Génération de Bordereaux" description="Chargement..." />
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Génération de Bordereaux" description="Créez des bordereaux de notes par classe ou par niveau">
        {showReport && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Télécharger PDF
            </Button>
          </div>
        )}
      </PageHeader>

      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "class" | "level")
          setSelectedClass("")
          setSelectedLevel("")
          setSelectedSection("")
          setShowReport(false)
          setReportData(null)
        }}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="class">Par Classe</TabsTrigger>
          <TabsTrigger value="level">Par Niveau</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Paramètres du Bordereau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mode === "class" ? (
              <div className="space-y-2">
                <Label>Classe</Label>
                <Select
                  value={selectedClass}
                  onValueChange={(v) => {
                    setSelectedClass(v)
                    setShowReport(false)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={selectedSection}
                    onValueChange={(v) => {
                      setSelectedSection(v)
                      setSelectedLevel("")
                      setShowReport(false)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Select
                    value={selectedLevel}
                    onValueChange={(v) => {
                      setSelectedLevel(v)
                      setShowReport(false)
                    }}
                    disabled={!selectedSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Période</Label>
              <Select
                value={selectedPeriod}
                onValueChange={(v) => {
                  setSelectedPeriod(v)
                  setShowReport(false)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({period.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={
                  generating ||
                  !selectedPeriod ||
                  (mode === "class" && !selectedClass) ||
                  (mode === "level" && (!selectedLevel || !selectedSection))
                }
                className="w-full"
              >
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                {generating ? "Génération..." : "Générer le Bordereau"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showReport && reportData && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Aperçu du bordereau (le PDF sera généré directement sans cette prévisualisation)</span>
          </div>
          <BordereauDocument
            ref={reportRef}
            reportData={reportData}
            schoolSettings={schoolSettings}
            subjectsByGroup={subjectsByGroup}
          />
        </div>
      )}
    </AppLayout>
  )
}
