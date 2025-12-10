"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Save, BookOpen, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

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
  section_id: string
  level?: Level
}

interface Subject {
  id: string
  name: string
  code: string
  subject_group?: {
    id: string
    name: string
  }
}

interface CombinedSubject {
  id: string
  subject_id: string
  subject: Subject
  coefficient: number
  source: "class" | "level"
}

interface Student {
  id: string
  first_name: string
  last_name: string
  matricule: string
  class_id?: string
  class_name?: string
}

interface Sequence {
  id: string
  name: string
  number: number
}

interface Grade {
  id: string
  student_id: string
  subject_id: string
  period_id: string
  score: number
}

type GradeMode = "tronc_commun" | "specialite"

export default function GradesPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sequences, setSequences] = useState<Sequence[]>([])

  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSequences, setSelectedSequences] = useState<string[]>([])
  const [gradeMode, setGradeMode] = useState<GradeMode>("specialite")

  const [students, setStudents] = useState<Student[]>([])
  const [combinedSubjects, setCombinedSubjects] = useState<CombinedSubject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>("")

  const [grades, setGrades] = useState<Record<string, Record<string, Record<string, number | null>>>>({})
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const [sectionsRes, sequencesRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("academic_periods").select("*").eq("type", "sequence").order("number"),
      ])

      if (sectionsRes.data) setSections(sectionsRes.data)
      if (sequencesRes.data) setSequences(sequencesRes.data)
    }
    fetchData()
  }, [supabase])

  // Fetch levels when section changes
  useEffect(() => {
    if (selectedSection) {
      const fetchLevels = async () => {
        const { data } = await supabase.from("levels").select("*").eq("section_id", selectedSection).order("order")
        if (data) setLevels(data)
      }
      fetchLevels()
      setSelectedLevel("")
      setSelectedClass("")
      setClasses([])
      setCombinedSubjects([])
      setStudents([])
      setSelectedSubject("")
    }
  }, [selectedSection, supabase])

  // Fetch classes when level changes
  useEffect(() => {
    if (selectedLevel) {
      const fetchClasses = async () => {
        const { data } = await supabase.from("classes").select("*, level:levels(*)").eq("level_id", selectedLevel)
        if (data) setClasses(data)
      }
      fetchClasses()
      setSelectedClass("")
      setCombinedSubjects([])
      setStudents([])
      setSelectedSubject("")
    }
  }, [selectedLevel, supabase])

  const fetchLevelSubjects = useCallback(
    async (levelId: string) => {
      const { data, error } = await supabase
        .from("level_subjects")
        .select("*, subject:subjects(*, subject_group:subject_groups(*))")
        .eq("level_id", levelId)

      if (error) {
        console.error("[v0] Error fetching level subjects:", error)
        return
      }

      const levelSubjects: CombinedSubject[] = (data || []).map((ls: any) => ({
        id: ls.id,
        subject_id: ls.subject_id,
        subject: ls.subject,
        coefficient: ls.coefficient || 1,
        source: "level" as const,
      }))

      console.log(`[v0] Level subjects loaded: ${levelSubjects.length}`)
      setCombinedSubjects(levelSubjects)
    },
    [supabase],
  )

  const fetchLevelStudents = useCallback(
    async (levelId: string) => {
      // First get all classes in this level
      const { data: levelClasses } = await supabase.from("classes").select("id, name").eq("level_id", levelId)

      if (!levelClasses || levelClasses.length === 0) {
        setStudents([])
        return
      }

      const classIds = levelClasses.map((c) => c.id)
      const classMap = new Map(levelClasses.map((c) => [c.id, c.name]))

      // Fetch all students from these classes
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .in("class_id", classIds)
        .ilike("status", "active")
        .order("last_name")

      if (error) {
        console.error("[v0] Error fetching level students:", error)
        return
      }

      // Add class_name to each student
      const studentsWithClass: Student[] = (data || []).map((s: any) => ({
        ...s,
        class_name: classMap.get(s.class_id) || "N/A",
      }))

      console.log(`[v0] Level students loaded: ${studentsWithClass.length} from ${levelClasses.length} classes`)
      setStudents(studentsWithClass)
    },
    [supabase],
  )

  const fetchClassSubjects = useCallback(
    async (classId: string) => {
      const classData = classes.find((c) => c.id === classId)
      if (!classData) return

      const { data, error } = await supabase
        .from("class_subjects")
        .select("*, subject:subjects(*, subject_group:subject_groups(*))")
        .eq("class_id", classId)

      if (error) {
        console.error("[v0] Error fetching class subjects:", error)
        return
      }

      const classSubjects: CombinedSubject[] = (data || []).map((cs: any) => ({
        id: cs.id,
        subject_id: cs.subject_id,
        subject: cs.subject,
        coefficient: cs.coefficient || 1,
        source: "class" as const,
      }))

      console.log(`[v0] Class subjects loaded: ${classSubjects.length}`)
      setCombinedSubjects(classSubjects)
    },
    [classes, supabase],
  )

  useEffect(() => {
    setSelectedSubject("")
    setCombinedSubjects([])
    setStudents([])
    setGrades({})

    if (gradeMode === "tronc_commun" && selectedLevel) {
      fetchLevelSubjects(selectedLevel)
      fetchLevelStudents(selectedLevel)
    } else if (gradeMode === "specialite" && selectedClass) {
      fetchClassSubjects(selectedClass)
    }
  }, [gradeMode, selectedLevel, selectedClass, fetchLevelSubjects, fetchLevelStudents, fetchClassSubjects])

  // Fetch students when class changes (for specialite mode)
  useEffect(() => {
    if (gradeMode === "specialite" && selectedClass) {
      const fetchStudents = async () => {
        const { data } = await supabase
          .from("students")
          .select("*")
          .eq("class_id", selectedClass)
          .ilike("status", "active")
          .order("last_name")
        if (data) setStudents(data)
      }
      fetchStudents()
      fetchClassSubjects(selectedClass)
    }
  }, [selectedClass, supabase, fetchClassSubjects, gradeMode])

  // Fetch existing grades when subject or sequences change
  useEffect(() => {
    if (selectedSubject && selectedSequences.length > 0 && students.length > 0) {
      const fetchGrades = async () => {
        const { data } = await supabase
          .from("grades")
          .select("*")
          .eq("subject_id", selectedSubject)
          .in("period_id", selectedSequences)
          .in(
            "student_id",
            students.map((s) => s.id),
          )

        const gradesMap: Record<string, Record<string, Record<string, number | null>>> = {}

        students.forEach((student) => {
          gradesMap[student.id] = {}
          selectedSequences.forEach((seq) => {
            gradesMap[student.id][seq] = {}
            gradesMap[student.id][seq][selectedSubject] = null
          })
        })

        data?.forEach((grade: Grade) => {
          if (gradesMap[grade.student_id] && gradesMap[grade.student_id][grade.period_id]) {
            gradesMap[grade.student_id][grade.period_id][grade.subject_id] = grade.score
          }
        })

        setGrades(gradesMap)
      }
      fetchGrades()
    }
  }, [selectedSubject, selectedSequences, students, supabase])

  const handleGradeChange = (studentId: string, sequenceId: string, value: string) => {
    const numValue = value === "" ? null : Math.min(20, Math.max(0, Number.parseFloat(value) || 0))
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [sequenceId]: {
          ...prev[studentId]?.[sequenceId],
          [selectedSubject]: numValue,
        },
      },
    }))
  }

  const calculateAverage = (studentId: string): number | null => {
    if (!grades[studentId] || selectedSequences.length === 0) return null

    let total = 0
    let count = 0

    selectedSequences.forEach((seq) => {
      const grade = grades[studentId]?.[seq]?.[selectedSubject]
      if (grade !== null && grade !== undefined) {
        total += grade
        count++
      }
    })

    return count > 0 ? Math.round((total / count) * 100) / 100 : null
  }

  const handleSaveGrades = async () => {
    if (!selectedSubject || selectedSequences.length === 0) return

    setSaving(true)
    try {
      const gradesToSave: { student_id: string; subject_id: string; period_id: string; score: number }[] = []

      Object.entries(grades).forEach(([studentId, sequences]) => {
        Object.entries(sequences).forEach(([sequenceId, subjects]) => {
          const score = subjects[selectedSubject]
          if (score !== null && score !== undefined) {
            gradesToSave.push({
              student_id: studentId,
              subject_id: selectedSubject,
              period_id: sequenceId,
              score,
            })
          }
        })
      })

      let savedCount = 0
      for (const grade of gradesToSave) {
        await supabase.from("grades").upsert(grade, {
          onConflict: "student_id,subject_id,period_id",
        })
        savedCount++
        setProgress(Math.round((savedCount / gradesToSave.length) * 100))
      }

      toast.success(`${savedCount} notes enregistrées avec succès`)
    } catch (error) {
      console.error("Error saving grades:", error)
      toast.error("Erreur lors de l'enregistrement des notes")
    } finally {
      setSaving(false)
      setProgress(0)
    }
  }

  const filteredLevels = levels.filter((l) => l.section_id === selectedSection)
  const filteredClasses = classes.filter((c) => c.level_id === selectedLevel)
  const selectedSequencesList = sequences.filter((s) => selectedSequences.includes(s.id))

  const selectedLevelName = levels.find((l) => l.id === selectedLevel)?.name || ""

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Saisie des Notes" description="Saisissez les notes des élèves par classe et par matière" />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Sélection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mode de saisie</Label>
              <div className="flex gap-4">
                <Button
                  variant={gradeMode === "tronc_commun" ? "default" : "outline"}
                  onClick={() => setGradeMode("tronc_commun")}
                  className="flex-1"
                >
                  <Badge variant="secondary" className="mr-2">
                    TC
                  </Badge>
                  Tronc Commun (par niveau)
                </Button>
                <Button
                  variant={gradeMode === "specialite" ? "default" : "outline"}
                  onClick={() => setGradeMode("specialite")}
                  className="flex-1"
                >
                  <Badge variant="default" className="mr-2">
                    SP
                  </Badge>
                  Spécialités (par classe)
                </Button>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 gap-4 ${gradeMode === "tronc_commun" ? "md:grid-cols-2" : "md:grid-cols-3"}`}
            >
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une section" />
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
                <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!selectedSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un niveau" />
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

              {gradeMode === "specialite" && (
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {gradeMode === "tronc_commun" && selectedLevel && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Mode Tronc Commun:</strong> Vous allez saisir les notes pour tous les élèves du niveau{" "}
                  <strong>{selectedLevelName}</strong> ({students.length} élèves de {classes.length} classes).
                </p>
              </div>
            )}

            {/* Subject Selection */}
            {combinedSubjects.length > 0 && (
              <div className="space-y-2">
                <Label>Matière ({combinedSubjects.length} disponibles)</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {combinedSubjects.map((cs) => (
                      <SelectItem key={cs.subject_id} value={cs.subject_id}>
                        <div className="flex items-center gap-2">
                          <span>{cs.subject?.name}</span>
                          <Badge variant={cs.source === "level" ? "secondary" : "default"} className="text-xs">
                            {cs.source === "level" ? "TC" : "SP"}
                          </Badge>
                          <span className="text-muted-foreground text-xs">(Coef: {cs.coefficient})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sequence Selection */}
            {selectedSubject && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Séquences à remplir</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedSequences.length === sequences.length) {
                        setSelectedSequences([])
                      } else {
                        setSelectedSequences(sequences.map((s) => s.id))
                      }
                    }}
                  >
                    {selectedSequences.length === sequences.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sequences.map((seq) => (
                    <div key={seq.id} className="flex items-center gap-2">
                      <Checkbox
                        id={seq.id}
                        checked={selectedSequences.includes(seq.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSequences([...selectedSequences, seq.id])
                          } else {
                            setSelectedSequences(selectedSequences.filter((id) => id !== seq.id))
                          }
                        }}
                      />
                      <label htmlFor={seq.id} className="text-sm cursor-pointer">
                        {seq.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades Table */}
        {selectedSubject && selectedSequences.length > 0 && students.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Notes - {combinedSubjects.find((s) => s.subject_id === selectedSubject)?.subject?.name}
                  <Badge variant={gradeMode === "tronc_commun" ? "secondary" : "default"}>
                    {gradeMode === "tronc_commun" ? "Tronc Commun" : "Spécialité"}
                  </Badge>
                  {gradeMode === "tronc_commun" && (
                    <span className="text-sm text-muted-foreground font-normal">
                      ({students.length} élèves - {classes.length} classes)
                    </span>
                  )}
                </CardTitle>
                <Button onClick={handleSaveGrades} disabled={saving}>
                  {saving ? (
                    <>
                      <Progress value={progress} className="w-20 mr-2" />
                      {progress}%
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2 text-left">#</th>
                      <th className="border p-2 text-left">Matricule</th>
                      <th className="border p-2 text-left">Nom & Prénom</th>
                      {gradeMode === "tronc_commun" && <th className="border p-2 text-left">Classe</th>}
                      {selectedSequencesList.map((seq) => (
                        <th key={seq.id} className="border p-2 text-center min-w-[100px]">
                          {seq.name}
                        </th>
                      ))}
                      <th className="border p-2 text-center bg-primary/10">Moyenne Séq.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const avg = calculateAverage(student.id)
                      return (
                        <tr key={student.id} className="hover:bg-muted/30">
                          <td className="border p-2 text-center text-muted-foreground">{index + 1}</td>
                          <td className="border p-2 text-sm">{student.matricule}</td>
                          <td className="border p-2 font-medium">
                            {student.last_name} {student.first_name}
                          </td>
                          {gradeMode === "tronc_commun" && (
                            <td className="border p-2 text-sm">
                              <Badge variant="outline">{student.class_name}</Badge>
                            </td>
                          )}
                          {selectedSequencesList.map((seq) => (
                            <td key={seq.id} className="border p-1 text-center">
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                step="0.25"
                                value={grades[student.id]?.[seq.id]?.[selectedSubject] ?? ""}
                                onChange={(e) => handleGradeChange(student.id, seq.id, e.target.value)}
                                className={`w-20 mx-auto text-center ${
                                  (grades[student.id]?.[seq.id]?.[selectedSubject] ?? 0) < 10
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              />
                            </td>
                          ))}
                          <td className="border p-2 text-center font-bold bg-primary/5">
                            {avg !== null ? (
                              <span className={avg < 10 ? "text-red-600" : "text-green-600"}>{avg.toFixed(2)}</span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>
                    {
                      Object.values(grades).filter((seqs) =>
                        Object.values(seqs).some((subj) => subj[selectedSubject] !== null),
                      ).length
                    }{" "}
                    / {students.length} élèves avec notes
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>
                    {
                      Object.values(grades).filter((seqs) =>
                        Object.values(seqs).every((subj) => subj[selectedSubject] === null),
                      ).length
                    }{" "}
                    élèves sans notes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No students message */}
        {((gradeMode === "specialite" && selectedClass) || (gradeMode === "tronc_commun" && selectedLevel)) &&
          students.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun élève trouvé.</p>
                <p className="text-sm">
                  {gradeMode === "tronc_commun"
                    ? "Veuillez d'abord ajouter des élèves aux classes de ce niveau."
                    : "Veuillez d'abord ajouter des élèves à cette classe."}
                </p>
              </CardContent>
            </Card>
          )}

        {/* No subjects message */}
        {((gradeMode === "specialite" && selectedClass) || (gradeMode === "tronc_commun" && selectedLevel)) &&
          combinedSubjects.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune matière trouvée.</p>
                <p className="text-sm">
                  {gradeMode === "tronc_commun"
                    ? "Veuillez d'abord ajouter des matières tronc commun à ce niveau dans le centre d'attribution."
                    : "Veuillez d'abord ajouter des matières spécialités à cette classe dans le centre d'attribution."}
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </AppLayout>
  )
}
