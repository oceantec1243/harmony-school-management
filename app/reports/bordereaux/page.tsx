"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, FileText, Printer, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { BordereauDocument } from "@/components/reports/bordereau-document"
import { generatePDF } from "@/lib/services/pdf-service"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type ClassType = { id: string; name: string; level_id: string; section_id: string; class_teacher: string | null }
type AcademicPeriod = {
  id: string
  name: string
  type: string
  number: number
  academic_year: string
  parent_id: string | null
}

type StudentReport = {
  student: {
    id: string
    matricule: string
    first_name: string
    last_name: string
  }
  grades: Record<string, number>
  average: number
  rank: number
}

type Subject = {
  id: string
  subject_id: string
  name: string
  code: string
  coefficient: number
  group_name: string
  group_order: number
}

type ReportData = {
  class: ClassType & { level?: { name: string }; section?: { name: string } }
  period: AcademicPeriod
  subjects: Subject[]
  students: StudentReport[]
  classAverage: number
  subjectAverages: Record<string, number>
}

export default function BordereauxPage() {
  const [mode, setMode] = useState<"class" | "level">("class")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
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
  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true)
      try {
        const [sectionsRes, levelsRes, classesRes, periodsRes, settingsRes] = await Promise.all([
          supabase.from("sections").select("*").order("name"),
          supabase.from("levels").select("*").order("order"),
          supabase.from("classes").select("*").order("name"),
          supabase.from("academic_periods").select("*").order("number"),
          supabase.from("school_settings").select("*").maybeSingle(),
        ])

        setSections(sectionsRes.data || [])
        setLevels(levelsRes.data || [])
        setClasses(classesRes.data || [])
        setPeriods(periodsRes.data || [])
        setSchoolSettings(
          settingsRes.data || {
            school_name: "HARMONY School",
            school_slogan: "L'harmonie entre technologie et éducation",
            current_academic_year: "2024-2025",
          },
        )
      } catch (error) {
        console.error("[v0] Error fetching initial data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [supabase])

  const generateReport = async () => {
    setGenerating(true)
    try {
      let classId = selectedClass
      let classData: any = null

      if (mode === "class" && selectedClass) {
        const { data } = await supabase
          .from("classes")
          .select(`*, level:levels(name), section:sections(name)`)
          .eq("id", selectedClass)
          .single()
        classData = data
      } else if (mode === "level" && selectedLevel && selectedSection) {
        const { data: cls } = await supabase
          .from("classes")
          .select(`*, level:levels(name), section:sections(name)`)
          .eq("level_id", selectedLevel)
          .eq("section_id", selectedSection)
          .limit(1)
          .single()
        classId = cls?.id
        classData = cls
      }

      if (!classId || !classData) {
        toast.error("Classe non trouvée")
        return
      }

      // Get period
      const { data: period } = await supabase.from("academic_periods").select("*").eq("id", selectedPeriod).single()

      // Get class subjects
      const { data: classSubjects } = await supabase
        .from("class_subjects")
        .select(`
          id, subject_id, coefficient,
          subject:subjects(id, name, code, subject_group:subject_groups(name, order))
        `)
        .eq("class_id", classId)

      const subjects: Subject[] = (classSubjects || [])
        .filter((cs) => cs.subject)
        .map((cs) => ({
          id: cs.id,
          subject_id: cs.subject_id,
          name: cs.subject?.name || "",
          code: cs.subject?.code || "",
          coefficient: cs.coefficient,
          group_name: cs.subject?.subject_group?.name || "",
          group_order: cs.subject?.subject_group?.order || 0,
        }))
        .sort((a, b) => a.group_order - b.group_order || a.name.localeCompare(b.name))

      // Get students
      const { data: students } = await supabase
        .from("students")
        .select("id, matricule, first_name, last_name")
        .eq("class_id", classId)
        .eq("status", "Active")
        .order("last_name")

      // Get grades
      const studentIds = (students || []).map((s) => s.id)
      const { data: grades } = await supabase
        .from("grades")
        .select("student_id, subject_id, score, coefficient")
        .in("student_id", studentIds)
        .eq("academic_period_id", selectedPeriod)

      // Calculate student reports
      const studentReports: StudentReport[] = (students || []).map((student) => {
        const studentGrades = (grades || []).filter((g) => g.student_id === student.id)
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

        const average = totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0

        return {
          student,
          grades: gradesMap,
          average,
          rank: 0,
        }
      })

      // Calculate ranks
      const sorted = [...studentReports].sort((a, b) => b.average - a.average)
      let currentRank = 1
      sorted.forEach((report, index) => {
        if (index > 0 && report.average < sorted[index - 1].average) {
          currentRank = index + 1
        }
        report.rank = currentRank
      })

      // Calculate class average
      const classAverage =
        studentReports.length > 0
          ? Math.round((studentReports.reduce((sum, r) => sum + r.average, 0) / studentReports.length) * 100) / 100
          : 0

      // Calculate subject averages
      const subjectAverages: Record<string, number> = {}
      subjects.forEach((subject) => {
        const subjectGrades = (grades || []).filter((g) => g.subject_id === subject.subject_id)
        if (subjectGrades.length > 0) {
          subjectAverages[subject.subject_id] =
            Math.round((subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length) * 100) / 100
        }
      })

      setReportData({
        class: classData,
        period: period!,
        subjects,
        students: sorted,
        classAverage,
        subjectAverages,
      })

      setShowReport(true)
      toast.success("Bordereau généré avec succès")
    } catch (error) {
      console.error("[v0] Error generating report:", error)
      toast.error("Erreur lors de la génération du bordereau")
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!reportData) return
    setDownloading(true)
    try {
      const filename = `Bordereau_${reportData.class.name}_${reportData.period.name}.pdf`
      await generatePDF("bordereau-document", filename, "landscape")
      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error("[v0] Error downloading PDF:", error)
      toast.error("Erreur lors du téléchargement")
    } finally {
      setDownloading(false)
    }
  }

  const filteredLevels = selectedSection ? levels.filter((l) => l.section_id === selectedSection) : levels
  const filteredClasses = classes.filter((c) => {
    if (selectedSection && c.section_id !== selectedSection) return false
    if (selectedLevel && c.level_id !== selectedLevel) return false
    return true
  })

  // Group subjects by group
  const subjectsByGroup = useMemo(() => {
    if (!reportData) return {}
    const groups: Record<string, Subject[]> = {}
    reportData.subjects.forEach((s) => {
      if (!groups[s.group_name]) groups[s.group_name] = []
      groups[s.group_name].push(s)
    })
    return groups
  }, [reportData])

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

      {/* Mode Selection */}
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

      {/* Selection Form */}
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

      {/* Report Preview */}
      {showReport && reportData && (
        <BordereauDocument
          ref={reportRef}
          reportData={reportData}
          schoolSettings={schoolSettings}
          subjectsByGroup={subjectsByGroup}
        />
      )}
    </AppLayout>
  )
}
