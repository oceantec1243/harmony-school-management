"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, BookOpen, Users, CheckCircle2, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React from "react"

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
  classSubjectId?: string
  levelSubjectId?: string
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
  academic_period_id: string
  score: number
  coefficient: number
  class_subject_id: string | null
  level_subject_id: string | null
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
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<{ count: number; subject: string; coefficient: number }>({
    count: 0,
    subject: "",
    coefficient: 1,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

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

  const fetchLevelSubjects = async (levelId: string) => {
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
      levelSubjectId: ls.id,
    }))

    console.log(`[v0] Level subjects loaded: ${levelSubjects.length}`)
    setCombinedSubjects(levelSubjects)
  }

  const fetchLevelStudents = async (levelId: string) => {
    const { data: levelClasses } = await supabase.from("classes").select("id, name").eq("level_id", levelId)

    if (!levelClasses || levelClasses.length === 0) {
      setStudents([])
      return
    }

    const classIds = levelClasses.map((c) => c.id)
    const classMap = new Map(levelClasses.map((c) => [c.id, c.name]))

    const { data } = await supabase
      .from("students")
      .select("*")
      .in("class_id", classIds)
      .ilike("status", "active")
      .order("last_name")

    if (data) {
      const studentsWithClass: Student[] = data.map((s: any) => ({
        ...s,
        class_name: classMap.get(s.class_id) || "N/A",
      }))
      console.log(`[v0] Level students loaded: ${studentsWithClass.length} from ${levelClasses.length} classes`)
      setStudents(studentsWithClass)
    }
  }

  const fetchClassSubjects = async (classId: string) => {
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
      classSubjectId: cs.id,
    }))

    console.log(`[v0] Class subjects loaded: ${classSubjects.length}`)
    setCombinedSubjects(classSubjects)
  }

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
  }, [gradeMode, selectedLevel, selectedClass])

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
    }
  }, [selectedClass, supabase])

  useEffect(() => {
    if (selectedSubject && selectedSequences.length > 0 && students.length > 0) {
      const fetchGrades = async () => {
        const { data, error } = await supabase
          .from("grades")
          .select("*")
          .eq("subject_id", selectedSubject)
          .in("academic_period_id", selectedSequences)
          .in(
            "student_id",
            students.map((s) => s.id),
          )

        if (error) {
          console.log("[v0] Error fetching grades:", error.message)
          return
        }

        const gradesMap: Record<string, Record<string, Record<string, number | null>>> = {}

        students.forEach((student) => {
          gradesMap[student.id] = {}
          selectedSequences.forEach((seq) => {
            gradesMap[student.id][seq] = {}
            gradesMap[student.id][seq][selectedSubject] = null
          })
        })

        data?.forEach((grade: any) => {
          if (gradesMap[grade.student_id] && gradesMap[grade.student_id][grade.academic_period_id]) {
            gradesMap[grade.student_id][grade.academic_period_id][grade.subject_id] = grade.score
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
    if (!selectedSubject || selectedSequences.length === 0) {
      toast.error("Veuillez sélectionner une matière et au moins une séquence")
      return
    }

    setSaving(true)
    setProgress(0)

    try {
      const currentSubject = combinedSubjects.find((s) => s.id === selectedSubject)
      const coefficient = currentSubject?.coefficient || 1

      const gradesToSave: {
        student_id: string
        subject_id: string
        academic_period_id: string
        score: number
        coefficient: number
        class_subject_id: string | null
        level_subject_id: string | null
        entered_at: string
        updated_at: string
      }[] = []

      const now = new Date().toISOString()

      Object.entries(grades).forEach(([studentId, sequences]) => {
        Object.entries(sequences).forEach(([sequenceId, subjects]) => {
          const score = subjects[selectedSubject]
          if (score !== null && score !== undefined && !isNaN(score)) {
            gradesToSave.push({
              student_id: studentId,
              subject_id: selectedSubject,
              academic_period_id: sequenceId,
              score: Number(score),
              coefficient: coefficient,
              class_subject_id: currentSubject?.source === "class" ? currentSubject.classSubjectId || null : null,
              level_subject_id: currentSubject?.source === "level" ? currentSubject.levelSubjectId || null : null,
              entered_at: now,
              updated_at: now,
            })
          }
        })
      })

      if (gradesToSave.length === 0) {
        toast.warning("Aucune note à enregistrer. Veuillez saisir au moins une note.")
        setSaving(false)
        return
      }

      setProgress(30)

      const { error, data } = await supabase
        .from("grades")
        .upsert(gradesToSave, {
          onConflict: "student_id,subject_id,academic_period_id",
          ignoreDuplicates: false,
        })
        .select()

      setProgress(90)

      if (error) {
        console.error("[v0] Batch upsert error:", error)
        toast.error("Erreur lors de l'enregistrement: " + error.message)
        setSaving(false)
        return
      }

      const savedCount = data?.length || gradesToSave.length

      setProgress(100)

      setSuccessModalData({
        count: savedCount,
        subject: currentSubject?.name || "",
        coefficient: coefficient,
      })
      setShowSuccessModal(true)
    } catch (error) {
      console.error("[v0] Error saving grades:", error)
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

  const groupedStudents = useMemo(() => {
    if (gradeMode !== "tronc_commun" || students.length === 0) {
      return null
    }

    const groups: { [className: string]: Student[] } = {}

    students.forEach((student) => {
      const className = student.class_name || "Sans classe"
      if (!groups[className]) {
        groups[className] = []
      }
      groups[className].push(student)
    })

    Object.keys(groups).forEach((className) => {
      groups[className].sort((a, b) => {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })
    })

    const sortedClassNames = Object.keys(groups).sort((a, b) => a.localeCompare(b))

    return { groups, sortedClassNames }
  }, [students, gradeMode])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#dcfce7" }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: "#16a34a" }} />
            </div>
            <DialogTitle className="text-center text-xl">Enregistrement réussi!</DialogTitle>
            <DialogDescription asChild>
              <div className="text-center space-y-2 pt-2">
                <div className="text-lg font-medium" style={{ color: "#0f172a" }}>
                  {successModalData.count} note{successModalData.count > 1 ? "s" : ""} enregistrée
                  {successModalData.count > 1 ? "s" : ""}
                </div>
                <div className="text-sm" style={{ color: "#64748b" }}>
                  Matière: <span className="font-medium">{successModalData.subject}</span>
                </div>
                <div className="text-sm" style={{ color: "#64748b" }}>
                  Coefficient: <span className="font-medium">{successModalData.coefficient}</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => setShowSuccessModal(false)} style={{ backgroundColor: "#16a34a", color: "white" }}>
              Continuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Saisie des Notes</h1>
          <p className="text-sm text-muted-foreground">Saisissez les notes des élèves par classe et par matière</p>
        </div>

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
                      <div className="w-20 mr-2 h-4 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                      </div>
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
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="bg-muted/50">
                      <th className="border p-2 text-left">#</th>
                      <th className="border p-2 text-left">Matricule</th>
                      <th className="border p-2 text-left">Nom & Prénom</th>
                      {selectedSequencesList.map((seq) => (
                        <th key={seq.id} className="border p-2 text-center min-w-[100px]">
                          {seq.name}
                        </th>
                      ))}
                      <th className="border p-2 text-center bg-primary/10">Moyenne Séq.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeMode === "tronc_commun" && groupedStudents ? (
                      <>
                        {groupedStudents.sortedClassNames.map((className) => {
                          const classStudents = groupedStudents.groups[className]
                          return (
                            <React.Fragment key={className}>
                              <tr className="bg-primary/20">
                                <td
                                  colSpan={4 + selectedSequencesList.length}
                                  className="border p-3 font-bold text-primary"
                                >
                                  <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <span>{className}</span>
                                    <Badge variant="secondary" className="ml-2">
                                      {classStudents.length} élèves
                                    </Badge>
                                  </div>
                                </td>
                              </tr>
                              {classStudents.map((student, index) => {
                                const avg = calculateAverage(student.id)
                                return (
                                  <tr key={student.id} className="hover:bg-muted/30">
                                    <td className="border p-2 text-center text-muted-foreground">{index + 1}</td>
                                    <td className="border p-2 text-sm">{student.matricule}</td>
                                    <td className="border p-2 font-medium">
                                      {student.last_name} {student.first_name}
                                    </td>
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
                                        <span className={avg < 10 ? "text-red-600" : "text-green-600"}>
                                          {avg.toFixed(2)}
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </React.Fragment>
                          )
                        })}
                      </>
                    ) : (
                      students.map((student, index) => {
                        const avg = calculateAverage(student.id)
                        return (
                          <tr key={student.id} className="hover:bg-muted/30">
                            <td className="border p-2 text-center text-muted-foreground">{index + 1}</td>
                            <td className="border p-2 text-sm">{student.matricule}</td>
                            <td className="border p-2 font-medium">
                              {student.last_name} {student.first_name}
                            </td>
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
                      })
                    )}
                  </tbody>
                </table>
              </div>

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
                  <X className="h-4 w-4 text-amber-600" />
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
    </div>
  )
}
