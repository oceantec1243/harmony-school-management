"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Download, Users, Eye, FileText } from "lucide-react"
import { toast } from "sonner"
import { generateBulletinPDF, generateMassBulletinsPDF, type BulletinData } from "@/lib/services/bulletin-pdf-generator"

interface Section {
  id: string
  name: string
}

interface Level {
  id: string
  name: string
  section_id: string
}

interface Class {
  id: string
  name: string
  level_id: string
}

interface Period {
  id: string
  name: string
  type: string
  trimester_id?: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  matricule: string
  date_of_birth?: string
  place_of_birth?: string
  gender?: string
  class?: { name: string }
}

interface SchoolSettings {
  school_name: string
  school_slogan?: string
  address?: string
  phone?: string
  email?: string
  po_box?: string
  current_academic_year?: string
  logo_url?: string
}

interface PreviewStudent {
  student: Student
  average: number
  rank: number | string
  isUnranked: boolean
}

export default function BulletinsPage() {
  const supabase = createClient()

  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)

  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [massGenerating, setMassGenerating] = useState(false)

  const [bulletinData, setBulletinData] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [classPreviewOpen, setClassPreviewOpen] = useState(false)
  const [classPreviewData, setClassPreviewData] = useState<PreviewStudent[]>([])
  const [loadingClassPreview, setLoadingClassPreview] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const [sectionsRes, periodsRes, settingsRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("academic_periods").select("*").order("name"),
        supabase.from("school_settings").select("*").single(),
      ])

      if (sectionsRes.data) setSections(sectionsRes.data)
      if (periodsRes.data) setPeriods(periodsRes.data)
      if (settingsRes.data) setSchoolSettings(settingsRes.data)
    }
    fetchData()
  }, [])

  // Fetch levels when section changes
  useEffect(() => {
    if (!selectedSection) {
      setLevels([])
      setSelectedLevel("")
      return
    }
    const fetchLevels = async () => {
      const { data } = await supabase.from("levels").select("*").eq("section_id", selectedSection).order("name")
      if (data) setLevels(data)
    }
    fetchLevels()
  }, [selectedSection])

  // Fetch classes when level changes
  useEffect(() => {
    if (!selectedLevel) {
      setClasses([])
      setSelectedClass("")
      return
    }
    const fetchClasses = async () => {
      const { data } = await supabase.from("classes").select("*").eq("level_id", selectedLevel).order("name")
      if (data) setClasses(data)
    }
    fetchClasses()
  }, [selectedLevel])

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([])
      setSelectedStudent("")
      return
    }
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("students")
        .select("*, class:classes(name)")
        .eq("class_id", selectedClass)
        .ilike("status", "active")
        .order("last_name")
      if (data) setStudents(data)
    }
    fetchStudents()
  }, [selectedClass])

  // Generate bulletin data for a student
  const generateBulletinData = useCallback(
    async (studentId: string) => {
      if (!selectedClass || !selectedPeriod) return null

      const student = students.find((s) => s.id === studentId)
      if (!student) return null

      const period = periods.find((p) => p.id === selectedPeriod)
      if (!period) return null

      // Check if student is unranked for this period
      const { data: unrankedData } = await supabase
        .from("student_unranked_periods")
        .select("id")
        .eq("student_id", studentId)
        .eq("academic_period_id", selectedPeriod)
        .single()

      const isUnranked = !!unrankedData

      // Fetch subjects
      const [classSubjectsRes, levelSubjectsRes] = await Promise.all([
        supabase
          .from("class_subjects")
          .select(
            "*, subject:subjects(id, name, subject_group:subject_groups(name)), teacher:teachers(first_name, last_name)",
          )
          .eq("class_id", selectedClass),
        supabase
          .from("level_subjects")
          .select(
            "*, subject:subjects(id, name, subject_group:subject_groups(name)), teacher:teachers(first_name, last_name)",
          )
          .eq("level_id", selectedLevel),
      ])

      const allSubjects: any[] = []

      if (classSubjectsRes.data) {
        for (const cs of classSubjectsRes.data) {
          allSubjects.push({
            id: cs.subject?.id,
            name: cs.subject?.name,
            coefficient: cs.coefficient || 1,
            group_name: cs.subject?.subject_group?.name || "Autres",
            teacher_name: cs.teacher ? `${cs.teacher.first_name} ${cs.teacher.last_name}` : "",
          })
        }
      }

      if (levelSubjectsRes.data) {
        for (const ls of levelSubjectsRes.data) {
          if (!allSubjects.some((s) => s.id === ls.subject?.id)) {
            allSubjects.push({
              id: ls.subject?.id,
              name: ls.subject?.name,
              coefficient: ls.coefficient || 1,
              group_name: ls.subject?.subject_group?.name || "Autres",
              teacher_name: ls.teacher ? `${ls.teacher.first_name} ${ls.teacher.last_name}` : "",
            })
          }
        }
      }

      // Fetch grades
      const { data: gradesData } = await supabase
        .from("grades")
        .select("subject_id, score")
        .eq("student_id", studentId)
        .eq("academic_period_id", selectedPeriod)

      const grades: Record<string, { score: number | undefined }> = {}
      if (gradesData) {
        for (const g of gradesData) {
          grades[g.subject_id] = { score: g.score }
        }
      }

      // For trimester: fetch sequence grades
      const sequenceGrades: { seq1: Record<string, number | undefined>; seq2: Record<string, number | undefined> } = {
        seq1: {},
        seq2: {},
      }

      if (period.type === "trimester") {
        const { data: seqPeriods } = await supabase
          .from("academic_periods")
          .select("id, name")
          .eq("trimester_id", selectedPeriod)
          .eq("type", "sequence")
          .order("name")

        if (seqPeriods && seqPeriods.length >= 2) {
          const [seq1Grades, seq2Grades] = await Promise.all([
            supabase
              .from("grades")
              .select("subject_id, score")
              .eq("student_id", studentId)
              .eq("academic_period_id", seqPeriods[0].id),
            supabase
              .from("grades")
              .select("subject_id, score")
              .eq("student_id", studentId)
              .eq("academic_period_id", seqPeriods[1].id),
          ])

          if (seq1Grades.data) {
            for (const g of seq1Grades.data) sequenceGrades.seq1[g.subject_id] = g.score
          }
          if (seq2Grades.data) {
            for (const g of seq2Grades.data) sequenceGrades.seq2[g.subject_id] = g.score
          }
        }
      }

      // Fetch attendance (only for trimesters)
      let attendance = null
      if (period.type === "trimester") {
        const { data: attendanceData } = await supabase
          .from("attendances")
          .select("*")
          .eq("student_id", studentId)
          .eq("trimester_id", selectedPeriod)
          .single()

        if (attendanceData) {
          attendance = {
            total_hours: attendanceData.total_hours || 0,
            justified_hours: attendanceData.justified_hours || 0,
            unjustified_hours: (attendanceData.total_hours || 0) - (attendanceData.justified_hours || 0),
          }
        }
      }

      // Calculate average
      let totalWeighted = 0
      let totalCoef = 0
      for (const subj of allSubjects) {
        const score = grades[subj.id]?.score
        if (score !== undefined && score !== null) {
          totalWeighted += score * subj.coefficient
          totalCoef += subj.coefficient
        }
      }
      const average = totalCoef > 0 ? totalWeighted / totalCoef : 0

      // Calculate class stats
      const allStudentAverages: { studentId: string; average: number; isRanked: boolean }[] = []

      for (const s of students) {
        const { data: sGrades } = await supabase
          .from("grades")
          .select("subject_id, score")
          .eq("student_id", s.id)
          .eq("academic_period_id", selectedPeriod)

        const { data: sUnranked } = await supabase
          .from("student_unranked_periods")
          .select("id")
          .eq("student_id", s.id)
          .eq("academic_period_id", selectedPeriod)
          .single()

        let tw = 0
        let tc = 0
        if (sGrades) {
          for (const sg of sGrades) {
            const subj = allSubjects.find((sub) => sub.id === sg.subject_id)
            if (subj && sg.score !== null && sg.score !== undefined) {
              tw += sg.score * subj.coefficient
              tc += subj.coefficient
            }
          }
        }
        allStudentAverages.push({
          studentId: s.id,
          average: tc > 0 ? tw / tc : 0,
          isRanked: !sUnranked,
        })
      }

      const rankedStudents = allStudentAverages.filter((s) => s.isRanked).sort((a, b) => b.average - a.average)
      const classAverage =
        rankedStudents.length > 0 ? rankedStudents.reduce((sum, s) => sum + s.average, 0) / rankedStudents.length : 0

      let rank = 0
      if (!isUnranked) {
        rank = rankedStudents.findIndex((s) => s.studentId === studentId) + 1
      }

      // Calculate subject ranks
      const subjectRanks: Record<string, { rank: number; classSize: number }> = {}
      for (const subj of allSubjects) {
        const subjectScores: { studentId: string; score: number }[] = []

        for (const s of students) {
          const sData = allStudentAverages.find((sa) => sa.studentId === s.id)
          if (sData?.isRanked) {
            const { data: sg } = await supabase
              .from("grades")
              .select("score")
              .eq("student_id", s.id)
              .eq("subject_id", subj.id)
              .eq("academic_period_id", selectedPeriod)
              .single()

            if (sg?.score !== undefined && sg?.score !== null) {
              subjectScores.push({ studentId: s.id, score: sg.score })
            }
          }
        }

        subjectScores.sort((a, b) => b.score - a.score)

        const studentScore = grades[subj.id]?.score
        if (studentScore !== undefined && !isUnranked) {
          const subjRank = subjectScores.findIndex((s) => s.studentId === studentId) + 1
          subjectRanks[subj.id] = { rank: subjRank, classSize: subjectScores.length }
        }
      }

      return {
        student,
        subjects: allSubjects,
        grades,
        sequenceGrades,
        average,
        rank,
        classSize: rankedStudents.length,
        classAverage,
        isUnranked,
        attendance,
        subjectRanks,
        section: sections.find((s) => s.id === selectedSection)?.name || "",
      }
    },
    [selectedClass, selectedPeriod, selectedLevel, selectedSection, periods, students, sections, supabase],
  )

  // Handle student selection and generate preview
  const handleStudentSelect = async (studentId: string) => {
    setSelectedStudent(studentId)
    if (!studentId) {
      setBulletinData(null)
      return
    }

    setGenerating(true)
    try {
      const data = await generateBulletinData(studentId)
      setBulletinData(data)
    } catch (error) {
      console.error("Error generating bulletin:", error)
      toast.error("Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }

  const createPdfData = (data: any): BulletinData => {
    const period = periods.find((p) => p.id === selectedPeriod)
    const section = sections.find((s) => s.id === selectedSection)
    const currentClass = classes.find((c) => c.id === selectedClass)

    return {
      student: {
        firstName: data.student.first_name,
        lastName: data.student.last_name,
        matricule: data.student.matricule || "",
        dateOfBirth: data.student.date_of_birth || "",
        placeOfBirth: data.student.place_of_birth || "",
        gender: data.student.gender || "",
        isRanked: !data.isUnranked,
      },
      className: data.student.class?.name || currentClass?.name || "",
      periodName: period?.name || "",
      periodType: (period?.type as "sequence" | "trimester") || "sequence",
      academicYear: schoolSettings?.current_academic_year || "2024-2025",
      section: section?.name || "",
      subjects: data.subjects.map((s: any) => {
        const score = data.grades?.[s.id]?.score
        return {
          name: s.name,
          teacher: s.teacher_name || "",
          coefficient: s.coefficient || 1,
          score1: data.sequenceGrades?.seq1?.[s.id],
          score2: data.sequenceGrades?.seq2?.[s.id],
          average: score, // Don't default to 0, keep undefined if no score
          group: s.group_name || "",
          rank: data.subjectRanks?.[s.id]?.rank,
          classSize: data.subjectRanks?.[s.id]?.classSize,
        }
      }),
      average: data.average || 0,
      rank: data.isUnranked ? "NC" : data.rank,
      classSize: data.classSize || 1,
      classAverage: data.classAverage || 0,
      attendance: data.attendance,
      schoolSettings: {
        school_name: schoolSettings?.school_name || "HARMONY School",
        school_slogan: schoolSettings?.school_slogan || "",
        address: schoolSettings?.address || "",
        phone: schoolSettings?.phone || "",
        email: schoolSettings?.email || "",
        po_box: schoolSettings?.po_box || "",
        logo_url: schoolSettings?.logo_url || "", // Add logo_url
      },
    }
  }

  // Download individual PDF
  const handleDownloadPDF = async () => {
    if (!bulletinData) return

    setDownloading(true)
    try {
      const pdfData = createPdfData(bulletinData)
      await generateBulletinPDF(pdfData)
      toast.success("PDF téléchargé avec succès!")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Erreur lors du téléchargement")
    } finally {
      setDownloading(false)
    }
  }

  const loadClassPreview = async () => {
    if (!selectedClass || !selectedPeriod) {
      toast.error("Veuillez sélectionner une classe et une période")
      return
    }

    setLoadingClassPreview(true)
    setClassPreviewOpen(true)

    try {
      const previewData: PreviewStudent[] = []

      for (const student of students) {
        const data = await generateBulletinData(student.id)
        if (data) {
          previewData.push({
            student,
            average: data.average,
            rank: data.isUnranked ? "NC" : data.rank,
            isUnranked: data.isUnranked,
          })
        }
      }

      // Sort by average (ranked first, then NC)
      previewData.sort((a, b) => {
        if (!a.isUnranked && b.isUnranked) return -1
        if (a.isUnranked && !b.isUnranked) return 1
        return b.average - a.average
      })

      setClassPreviewData(previewData)
    } catch (error) {
      console.error("Error loading preview:", error)
      toast.error("Erreur lors du chargement de l'aperçu")
    } finally {
      setLoadingClassPreview(false)
    }
  }

  // Mass generation
  const handleMassGeneration = async () => {
    if (!selectedClass || !selectedPeriod) {
      toast.error("Veuillez sélectionner une classe et une période")
      return
    }

    setMassGenerating(true)
    toast.info("Génération des bulletins en cours...")

    try {
      const period = periods.find((p) => p.id === selectedPeriod)
      const currentClass = classes.find((c) => c.id === selectedClass)

      const bulletinsData: BulletinData[] = []

      for (const student of students) {
        const data = await generateBulletinData(student.id)
        if (data) {
          bulletinsData.push(createPdfData(data))
        }
      }

      if (bulletinsData.length === 0) {
        toast.error("Aucun bulletin à générer")
        return
      }

      await generateMassBulletinsPDF(bulletinsData, currentClass?.name || "", period?.name || "")
      toast.success(`${bulletinsData.length} bulletins générés avec succès!`)
    } catch (error) {
      console.error("Error mass generating:", error)
      toast.error("Erreur lors de la génération de masse")
    } finally {
      setMassGenerating(false)
    }
  }

  // Get grade color class
  const getGradeColorClass = (grade: number | undefined) => {
    if (grade === undefined) return "text-gray-400"
    if (grade < 10) return "text-red-600 font-bold"
    if (grade < 12) return "text-yellow-600 font-bold"
    if (grade < 15) return "text-blue-600 font-bold"
    return "text-green-600 font-bold"
  }

  const filteredLevels = levels.filter((l) => l.section_id === selectedSection)
  const filteredClasses = classes.filter((c) => c.level_id === selectedLevel)

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bulletins de Notes</h1>
            <p className="text-muted-foreground">Générez et téléchargez les bulletins des élèves</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Selection Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Sélection</CardTitle>
              <CardDescription>Choisissez les paramètres du bulletin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={selectedSection}
                  onValueChange={(v) => {
                    setSelectedSection(v)
                    setSelectedLevel("")
                    setSelectedClass("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
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
                    setSelectedClass("")
                  }}
                  disabled={!selectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLevels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Classe</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
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
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.type === "trimester" ? "Trimestre" : "Séquence"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Élève</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={handleStudentSelect}
                  disabled={!selectedClass || !selectedPeriod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un élève" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.last_name} {s.first_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => setPreviewOpen(true)}
                  disabled={!bulletinData || generating}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Aperçu individuel
                </Button>

                <Button onClick={handleDownloadPDF} disabled={!bulletinData || downloading} className="w-full">
                  {downloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Télécharger PDF
                </Button>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Actions de masse</p>

                  <Button
                    onClick={loadClassPreview}
                    disabled={!selectedClass || !selectedPeriod || loadingClassPreview}
                    className="w-full mb-2 bg-transparent"
                    variant="outline"
                  >
                    {loadingClassPreview ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Aperçu toute la classe
                  </Button>

                  <Button
                    onClick={handleMassGeneration}
                    disabled={!selectedClass || !selectedPeriod || massGenerating}
                    className="w-full"
                    variant="secondary"
                  >
                    {massGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    Générer toute la classe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
              <CardDescription>
                {bulletinData
                  ? `Bulletin de ${bulletinData.student.last_name} ${bulletinData.student.first_name}`
                  : "Sélectionnez un élève pour voir l'aperçu"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : bulletinData ? (
                <div className="space-y-4">
                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Nom</p>
                      <p className="font-medium">
                        {bulletinData.student.last_name} {bulletinData.student.first_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Classe</p>
                      <p className="font-medium">{bulletinData.student.class?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Moyenne</p>
                      <p className={`font-bold text-lg ${getGradeColorClass(bulletinData.average)}`}>
                        {bulletinData.average.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rang</p>
                      <p className="font-bold text-lg">
                        {bulletinData.isUnranked ? "NC" : `${bulletinData.rank}/${bulletinData.classSize}`}
                      </p>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-primary text-primary-foreground">
                        <tr>
                          <th className="text-left p-2">Matière</th>
                          <th className="text-center p-2">Coef</th>
                          <th className="text-center p-2">Note</th>
                          <th className="text-center p-2">Rang</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulletinData.subjects.map((subj: any, idx: number) => {
                          const score = bulletinData.grades?.[subj.id]?.score
                          const subjRank = bulletinData.subjectRanks?.[subj.id]
                          return (
                            <tr key={subj.id} className={idx % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                              <td className="p-2">{subj.name}</td>
                              <td className="text-center p-2">{subj.coefficient}</td>
                              <td className={`text-center p-2 ${getGradeColorClass(score)}`}>
                                {score !== undefined ? score.toFixed(2) : "-"}
                              </td>
                              <td className="text-center p-2">
                                {subjRank ? `${subjRank.rank}/${subjRank.classSize}` : "-"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p>Sélectionnez un élève pour générer son bulletin</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Individual Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Aperçu du Bulletin</DialogTitle>
            </DialogHeader>
            {bulletinData && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">{schoolSettings?.school_name || "HARMONY School"}</h2>
                  <p className="text-muted-foreground">{schoolSettings?.school_slogan}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Nom:</strong> {bulletinData.student.last_name} {bulletinData.student.first_name}
                    </p>
                    <p>
                      <strong>Matricule:</strong> {bulletinData.student.matricule || "-"}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Classe:</strong> {bulletinData.student.class?.name}
                    </p>
                    <p>
                      <strong>Période:</strong> {periods.find((p) => p.id === selectedPeriod)?.name}
                    </p>
                  </div>
                </div>

                <table className="w-full border text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="border p-2 text-left">Matière</th>
                      <th className="border p-2">Enseignant</th>
                      <th className="border p-2">Coef</th>
                      {periods.find((p) => p.id === selectedPeriod)?.type === "trimester" && (
                        <>
                          <th className="border p-2">Séq 1</th>
                          <th className="border p-2">Séq 2</th>
                        </>
                      )}
                      <th className="border p-2">Moy</th>
                      <th className="border p-2">Rang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulletinData.subjects.map((subj: any) => {
                      const score = bulletinData.grades?.[subj.id]?.score
                      const seq1 = bulletinData.sequenceGrades?.seq1?.[subj.id]
                      const seq2 = bulletinData.sequenceGrades?.seq2?.[subj.id]
                      const subjRank = bulletinData.subjectRanks?.[subj.id]
                      const isTrimester = periods.find((p) => p.id === selectedPeriod)?.type === "trimester"

                      return (
                        <tr key={subj.id}>
                          <td className="border p-2">{subj.name}</td>
                          <td className="border p-2 text-center">{subj.teacher_name || "-"}</td>
                          <td className="border p-2 text-center">{subj.coefficient}</td>
                          {isTrimester && (
                            <>
                              <td className={`border p-2 text-center ${getGradeColorClass(seq1)}`}>
                                {seq1 !== undefined ? seq1.toFixed(2) : "-"}
                              </td>
                              <td className={`border p-2 text-center ${getGradeColorClass(seq2)}`}>
                                {seq2 !== undefined ? seq2.toFixed(2) : "-"}
                              </td>
                            </>
                          )}
                          <td className={`border p-2 text-center ${getGradeColorClass(score)}`}>
                            {score !== undefined ? score.toFixed(2) : "-"}
                          </td>
                          <td className="border p-2 text-center">
                            {subjRank ? `${subjRank.rank}/${subjRank.classSize}` : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-primary/10">
                    <tr>
                      <td
                        colSpan={periods.find((p) => p.id === selectedPeriod)?.type === "trimester" ? 5 : 3}
                        className="border p-2 font-bold"
                      >
                        Résultats
                      </td>
                      <td className={`border p-2 text-center font-bold ${getGradeColorClass(bulletinData.average)}`}>
                        {bulletinData.average.toFixed(2)}
                      </td>
                      <td className="border p-2 text-center font-bold">
                        {bulletinData.isUnranked ? "NC" : `${bulletinData.rank}/${bulletinData.classSize}`}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-end">
                  <Button onClick={handleDownloadPDF} disabled={downloading}>
                    {downloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Télécharger PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={classPreviewOpen} onOpenChange={setClassPreviewOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                Aperçu des bulletins - {classes.find((c) => c.id === selectedClass)?.name} -{" "}
                {periods.find((p) => p.id === selectedPeriod)?.name}
              </DialogTitle>
            </DialogHeader>

            {loadingClassPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Chargement des données...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="text-center p-3 w-16">Rang</th>
                        <th className="text-left p-3">Nom & Prénom</th>
                        <th className="text-center p-3">Matricule</th>
                        <th className="text-center p-3">Moyenne</th>
                        <th className="text-center p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classPreviewData.map((item, idx) => (
                        <tr key={item.student.id} className={idx % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                          <td className="text-center p-3 font-bold">
                            {item.isUnranked ? (
                              <span className="text-orange-500">NC</span>
                            ) : (
                              <span className={item.rank <= 3 ? "text-green-600" : ""}>{item.rank}</span>
                            )}
                          </td>
                          <td className="p-3 font-medium">
                            {item.student.last_name.toUpperCase()} {item.student.first_name}
                          </td>
                          <td className="text-center p-3">{item.student.matricule || "-"}</td>
                          <td className={`text-center p-3 font-bold ${getGradeColorClass(item.average)}`}>
                            {item.average.toFixed(2)}
                          </td>
                          <td className="text-center p-3">
                            {item.isUnranked ? (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                Non Classé
                              </span>
                            ) : item.average >= 10 ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Admis</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Non Admis</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Total: {classPreviewData.length} élèves | Admis:{" "}
                    {classPreviewData.filter((s) => !s.isUnranked && s.average >= 10).length} | Non Admis:{" "}
                    {classPreviewData.filter((s) => !s.isUnranked && s.average < 10).length} | NC:{" "}
                    {classPreviewData.filter((s) => s.isUnranked).length}
                  </div>
                  <Button onClick={handleMassGeneration} disabled={massGenerating}>
                    {massGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Générer tous les PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
