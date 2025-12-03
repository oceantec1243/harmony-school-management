"use client"

import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentAvatar } from "@/components/students/student-avatar"
import { Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  class_id: string
  class?: { name: string }
}

type ClassSubject = {
  id: string
  subject_id: string
  coefficient: number
  subject: {
    id: string
    name: string
    code: string
    subject_group: { id: string; name: string }
  }
  teacher?: { first_name: string; last_name: string } | null
}

type AcademicPeriod = {
  id: string
  name: string
  type: string
  number: number
  academic_year: string
}

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type ClassType = { id: string; name: string; level_id: string; section_id: string }

export default function GradesPage() {
  const [mode, setMode] = useState<"class" | "level">("class")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [students, setStudents] = useState<Student[]>([])

  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true)
      try {
        const [sectionsRes, levelsRes, classesRes, periodsRes] = await Promise.all([
          supabase.from("sections").select("*").order("name"),
          supabase.from("levels").select("*").order("order"),
          supabase.from("classes").select("*").order("name"),
          supabase.from("academic_periods").select("*").eq("type", "sequence").order("number"),
        ])

        setSections(sectionsRes.data || [])
        setLevels(levelsRes.data || [])
        setClasses(classesRes.data || [])
        setPeriods(periodsRes.data || [])

        // Set default period
        if (periodsRes.data && periodsRes.data.length > 0) {
          setSelectedPeriod(periodsRes.data[0].id)
        }
      } catch (error) {
        console.error("[v0] Error fetching initial data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [supabase])

  // Fetch class subjects when class is selected
  const fetchClassSubjects = useCallback(
    async (classId: string) => {
      try {
        const { data, error } = await supabase
          .from("class_subjects")
          .select(`
          *,
          subject:subjects(
            id,
            name,
            code,
            subject_group:subject_groups(id, name)
          ),
          teacher:teachers(first_name, last_name)
        `)
          .eq("class_id", classId)
          .order("coefficient", { ascending: false })

        if (error) throw error
        setClassSubjects(data || [])
      } catch (error) {
        console.error("[v0] Error fetching class subjects:", error)
      }
    },
    [supabase],
  )

  // Fetch students when selection changes
  const fetchStudents = useCallback(async () => {
    if (mode === "class" && selectedClass) {
      const { data } = await supabase
        .from("students")
        .select("id, matricule, first_name, last_name, class_id")
        .eq("class_id", selectedClass)
        .eq("status", "Active")
        .order("last_name")
      setStudents(data || [])
    } else if (mode === "level" && selectedLevel && selectedSection) {
      const levelClasses = classes.filter((c) => c.level_id === selectedLevel && c.section_id === selectedSection)
      const classIds = levelClasses.map((c) => c.id)
      if (classIds.length > 0) {
        const { data } = await supabase
          .from("students")
          .select(`
            id, matricule, first_name, last_name, class_id,
            class:classes(name)
          `)
          .in("class_id", classIds)
          .eq("status", "Active")
          .order("last_name")
        setStudents(data || [])
      }
    } else {
      setStudents([])
    }
  }, [supabase, mode, selectedClass, selectedLevel, selectedSection, classes])

  // Fetch existing grades
  const fetchExistingGrades = useCallback(async () => {
    if (!selectedSubject || !selectedPeriod || students.length === 0) return

    const studentIds = students.map((s) => s.id)
    const { data } = await supabase
      .from("grades")
      .select("student_id, score")
      .in("student_id", studentIds)
      .eq("subject_id", selectedSubject)
      .eq("academic_period_id", selectedPeriod)

    const gradesMap: Record<string, string> = {}
    data?.forEach((g) => {
      gradesMap[g.student_id] = g.score.toString()
    })
    setGrades(gradesMap)
  }, [supabase, selectedSubject, selectedPeriod, students])

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects(selectedClass)
      fetchStudents()
    }
  }, [selectedClass, fetchClassSubjects, fetchStudents])

  useEffect(() => {
    if (mode === "level" && selectedLevel && selectedSection) {
      // For level mode, get subjects from the first class
      const levelClasses = classes.filter((c) => c.level_id === selectedLevel && c.section_id === selectedSection)
      if (levelClasses.length > 0) {
        fetchClassSubjects(levelClasses[0].id)
      }
      fetchStudents()
    }
  }, [mode, selectedLevel, selectedSection, classes, fetchClassSubjects, fetchStudents])

  useEffect(() => {
    fetchExistingGrades()
  }, [fetchExistingGrades])

  const handleGradeChange = (studentId: string, value: string) => {
    const num = Number.parseFloat(value)
    if (value === "" || (num >= 0 && num <= 20)) {
      setGrades((prev) => ({ ...prev, [studentId]: value }))
    }
  }

  const handleSave = async () => {
    if (!selectedSubject || !selectedPeriod) {
      toast.error("Veuillez sélectionner une matière et une période")
      return
    }

    setIsSaving(true)
    try {
      const classSubject = classSubjects.find((cs) => cs.subject_id === selectedSubject)
      const coefficient = classSubject?.coefficient || 1

      const gradesToSave = Object.entries(grades)
        .filter(([, score]) => score !== "")
        .map(([studentId, score]) => ({
          student_id: studentId,
          subject_id: selectedSubject,
          academic_period_id: selectedPeriod,
          score: Number.parseFloat(score),
          coefficient,
          class_subject_id: classSubject?.id,
        }))

      if (gradesToSave.length === 0) {
        toast.error("Aucune note à enregistrer")
        return
      }

      const { error } = await supabase.from("grades").upsert(gradesToSave, {
        onConflict: "student_id,subject_id,academic_period_id",
      })

      if (error) throw error

      toast.success(`${gradesToSave.length} notes enregistrées avec succès!`)
    } catch (error) {
      console.error("[v0] Error saving grades:", error)
      toast.error("Erreur lors de l'enregistrement des notes")
    } finally {
      setIsSaving(false)
    }
  }

  const gradedCount = Object.values(grades).filter((g) => g !== "").length
  const totalStudents = students.length
  const progress = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0

  const filteredLevels = selectedSection ? levels.filter((l) => l.section_id === selectedSection) : levels
  const filteredClasses = classes.filter((c) => {
    if (selectedSection && c.section_id !== selectedSection) return false
    if (selectedLevel && c.level_id !== selectedLevel) return false
    return true
  })

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Saisie des Notes" description="Chargement..." />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Saisie des Notes" description="Entrez les notes des élèves par classe ou par niveau">
        {students.length > 0 && selectedSubject && (
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
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
          setSelectedSubject("")
          setGrades({})
          setStudents([])
        }}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="class">Par Classe</TabsTrigger>
          <TabsTrigger value="level">Par Niveau</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Selection Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Sélection</CardTitle>
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
                    setSelectedSubject("")
                    setGrades({})
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
                      setSelectedSubject("")
                      setGrades({})
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
                      setSelectedSubject("")
                      setGrades({})
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
              <Label>Matière</Label>
              <Select
                value={selectedSubject}
                onValueChange={(v) => {
                  setSelectedSubject(v)
                  setGrades({})
                }}
                disabled={classSubjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects.map((cs) => (
                    <SelectItem key={cs.id} value={cs.subject_id}>
                      {cs.subject?.name} (Coef. {cs.coefficient})
                      {cs.teacher && ` - ${cs.teacher.first_name} ${cs.teacher.last_name}`}
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
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {students.length > 0 && selectedSubject && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {progress === 100 ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning" />
                )}
                <span className="font-medium">Progression</span>
              </div>
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {gradedCount} / {totalStudents} notes saisies
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  progress === 100 ? "bg-success" : "bg-primary",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades Table */}
      {students.length > 0 && selectedSubject ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Saisie des Notes - {classSubjects.find((cs) => cs.subject_id === selectedSubject)?.subject?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">N°</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Matricule</TableHead>
                    {mode === "level" && <TableHead>Classe</TableHead>}
                    <TableHead className="w-32 text-center">Note /20</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    const gradeValue = grades[student.id] || ""
                    const numGrade = Number.parseFloat(gradeValue)
                    const isValid = gradeValue === "" || (numGrade >= 0 && numGrade <= 20)

                    return (
                      <TableRow key={student.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <StudentAvatar firstName={student.first_name} lastName={student.last_name} size="sm" />
                            <span className="font-medium">
                              {student.last_name} {student.first_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{student.matricule}</TableCell>
                        {mode === "level" && <TableCell>{(student as any).class?.name}</TableCell>}
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            value={gradeValue}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className={cn(
                              "w-24 text-center mx-auto",
                              !isValid && "border-destructive focus-visible:ring-destructive",
                            )}
                            placeholder="-"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Sélectionnez une classe et une matière</p>
              <p className="text-sm">pour commencer la saisie des notes</p>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  )
}
