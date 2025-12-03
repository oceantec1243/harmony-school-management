"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentAvatar } from "@/components/students/student-avatar"
import { Download, Search, Eye, Loader2, Printer, FileArchive } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BulletinDocument } from "@/components/reports/bulletin-document"
import { generatePDF } from "@/lib/services/pdf-service"

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth: string | null
  gender: string
  class_id: string
  class?: { name: string }
}

type ClassType = { id: string; name: string }
type AcademicPeriod = { id: string; name: string; type: string; academic_year: string }

export default function BulletinsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [bulletinType, setBulletinType] = useState<"sequence" | "trimester" | "year">("sequence")
  const [searchQuery, setSearchQuery] = useState("")
  const [showBulletin, setShowBulletin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const [classes, setClasses] = useState<ClassType[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [bulletinData, setBulletinData] = useState<any>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)

  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true)
      try {
        const [classesRes, periodsRes, settingsRes] = await Promise.all([
          supabase.from("classes").select("id, name").order("name"),
          supabase.from("academic_periods").select("*").order("number"),
          supabase.from("school_settings").select("*").maybeSingle(),
        ])

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

  // Fetch students when class changes
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClass) {
        setStudents([])
        return
      }

      const { data } = await supabase
        .from("students")
        .select(`
          id, matricule, first_name, last_name, date_of_birth, place_of_birth, gender, class_id,
          class:classes(name)
        `)
        .eq("class_id", selectedClass)
        .eq("status", "Active")
        .order("last_name")

      setStudents(data || [])
    }
    fetchStudents()
  }, [supabase, selectedClass])

  // Filter students based on search
  const filteredStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const generateBulletin = async (studentId: string) => {
    if (!selectedPeriod) {
      toast.error("Veuillez sélectionner une période")
      return
    }

    setGenerating(true)
    setSelectedStudent(studentId)

    try {
      // Get student data
      const { data: student } = await supabase
        .from("students")
        .select(`
          *,
          class:classes(
            *,
            level:levels(*),
            section:sections(*)
          )
        `)
        .eq("id", studentId)
        .single()

      if (!student) throw new Error("Élève non trouvé")

      // Get period
      const { data: period } = await supabase.from("academic_periods").select("*").eq("id", selectedPeriod).single()

      // Get class subjects
      const { data: classSubjects } = await supabase
        .from("class_subjects")
        .select(`
          id, subject_id, coefficient,
          subject:subjects(id, name, code, subject_group:subject_groups(id, name, order))
        `)
        .eq("class_id", student.class_id)

      // Get all students in class for ranking
      const { data: classStudents } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", student.class_id)
        .eq("status", "Active")

      // Get grades for all students
      const studentIds = (classStudents || []).map((s) => s.id)
      const { data: allGrades } = await supabase
        .from("grades")
        .select("student_id, subject_id, score, coefficient")
        .in("student_id", studentIds)
        .eq("academic_period_id", selectedPeriod)

      // Format subjects
      const subjects = (classSubjects || [])
        .filter((cs) => cs.subject)
        .map((cs) => ({
          id: cs.subject_id,
          name: cs.subject?.name || "",
          code: cs.subject?.code || "",
          coefficient: cs.coefficient,
          group_id: cs.subject?.subject_group?.id || "",
          group_name: cs.subject?.subject_group?.name || "",
          group_order: cs.subject?.subject_group?.order || 0,
        }))
        .sort((a, b) => a.group_order - b.group_order || a.name.localeCompare(b.name))

      // Get student's grades
      const studentGrades = (allGrades || []).filter((g) => g.student_id === studentId)
      const grades: Record<string, { score: number; coefficient: number }> = {}

      subjects.forEach((subject) => {
        const grade = studentGrades.find((g) => g.subject_id === subject.id)
        if (grade) {
          grades[subject.id] = {
            score: grade.score,
            coefficient: subject.coefficient,
          }
        }
      })

      // Calculate group averages
      const groupAverages: Record<string, number> = {}
      const groups = [...new Set(subjects.map((s) => s.group_name))]

      groups.forEach((groupName) => {
        const groupSubjects = subjects.filter((s) => s.group_name === groupName)
        let totalWeighted = 0
        let totalCoef = 0

        groupSubjects.forEach((subject) => {
          const grade = grades[subject.id]
          if (grade) {
            totalWeighted += grade.score * grade.coefficient
            totalCoef += grade.coefficient
          }
        })

        if (totalCoef > 0) {
          groupAverages[groupName] = Math.round((totalWeighted / totalCoef) * 100) / 100
        }
      })

      // Calculate all students' averages for ranking
      const studentAverages = (classStudents || []).map((s) => {
        const sGrades = (allGrades || []).filter((g) => g.student_id === s.id)
        let totalWeighted = 0
        let totalCoef = 0

        subjects.forEach((subject) => {
          const grade = sGrades.find((g) => g.subject_id === subject.id)
          if (grade) {
            totalWeighted += grade.score * subject.coefficient
            totalCoef += subject.coefficient
          }
        })

        return {
          studentId: s.id,
          average: totalCoef > 0 ? totalWeighted / totalCoef : 0,
        }
      })

      // Sort and find rank
      studentAverages.sort((a, b) => b.average - a.average)
      let rank = 1
      for (let i = 0; i < studentAverages.length; i++) {
        if (i > 0 && studentAverages[i].average < studentAverages[i - 1].average) {
          rank = i + 1
        }
        if (studentAverages[i].studentId === studentId) {
          break
        }
      }

      const thisStudentData = studentAverages.find((s) => s.studentId === studentId)
      const average = thisStudentData ? Math.round(thisStudentData.average * 100) / 100 : 0

      const classAverage =
        studentAverages.length > 0
          ? Math.round((studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length) * 100) / 100
          : 0

      setBulletinData({
        student,
        class: student.class,
        period,
        subjects,
        grades,
        groupAverages,
        average,
        rank,
        classSize: (classStudents || []).length,
        classAverage,
      })

      setShowBulletin(true)
    } catch (error) {
      console.error("[v0] Error generating bulletin:", error)
      toast.error("Erreur lors de la génération du bulletin")
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!bulletinData) return
    setDownloading(true)
    try {
      const filename = `Bulletin_${bulletinData.student.last_name}_${bulletinData.student.first_name}_${bulletinData.period.name}.pdf`
      await generatePDF("bulletin-document", filename, "portrait")
      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error("[v0] Error downloading PDF:", error)
      toast.error("Erreur lors du téléchargement")
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const filteredPeriods = periods.filter((p) => p.type === bulletinType)

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Génération de Bulletins" description="Chargement..." />
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Génération de Bulletins" description="Créez des bulletins scolaires individuels ou en masse">
        {selectedClass && selectedPeriod && (
          <Button variant="outline" onClick={() => toast.info("Génération en masse en cours...")}>
            <FileArchive className="h-4 w-4 mr-2" />
            Génération en masse
          </Button>
        )}
      </PageHeader>

      {/* Selection Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Paramètres du Bulletin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Type de Bulletin</Label>
              <Select
                value={bulletinType}
                onValueChange={(v: any) => {
                  setBulletinType(v)
                  setSelectedPeriod("")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequence">Séquentiel</SelectItem>
                  <SelectItem value="trimester">Trimestriel</SelectItem>
                  <SelectItem value="year">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({period.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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

            <div className="space-y-2">
              <Label>Rechercher un élève</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, prénom ou matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Sélectionner un élève ({filteredStudents.length} résultats)</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedClass ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => generateBulletin(student.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer",
                    "hover:bg-muted/50 hover:border-primary/50 transition-all",
                    selectedStudent === student.id && generating && "border-primary bg-primary/5",
                  )}
                >
                  <StudentAvatar firstName={student.first_name} lastName={student.last_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {student.last_name} {student.first_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.class?.name} - {student.matricule}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    disabled={generating && selectedStudent === student.id}
                  >
                    {generating && selectedStudent === student.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">Aucun élève trouvé</div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Sélectionnez une classe pour voir les élèves</div>
          )}
        </CardContent>
      </Card>

      {/* Bulletin Preview Dialog */}
      <Dialog open={showBulletin} onOpenChange={setShowBulletin}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Aperçu du Bulletin</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
                <Button size="sm" onClick={handleDownloadPDF} disabled={downloading}>
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {bulletinData && <BulletinDocument bulletinData={bulletinData} schoolSettings={schoolSettings} />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
