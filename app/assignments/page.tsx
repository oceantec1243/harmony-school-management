"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Users, BookOpen, GraduationCap, Trash2, UserCheck, Building, Layers, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string; order: number }
type Teacher = { id: string; first_name: string; last_name: string; specialization: string | null }
type Subject = { id: string; name: string; code: string; subject_group_id: string }
type SubjectGroup = { id: string; name: string; section_id: string | null }
type Class = {
  id: string
  name: string
  level_id: string
  section_id: string
  capacity: number
  class_teacher: string | null
  academic_year: string
  level?: Level
  section?: Section
}
type ClassSubject = {
  id: string
  class_id: string
  subject_id: string
  coefficient: number
  teacher_id: string | null
  subject?: Subject
  teacher?: Teacher
}
type LevelSubject = {
  id: string
  level_id: string
  section_id: string
  subject_id: string
  coefficient: number
  teacher_id: string | null
  subject?: Subject
  teacher?: Teacher
}

export default function AssignmentsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [levelSubjects, setLevelSubjects] = useState<LevelSubject[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedSection, setSelectedSection] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("")

  // Dialogs
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [assignSubjectsDialogOpen, setAssignSubjectsDialogOpen] = useState(false)
  const [assignTeacherDialogOpen, setAssignTeacherDialogOpen] = useState(false)
  const [levelSubjectsDialogOpen, setLevelSubjectsDialogOpen] = useState(false)

  const [levelTeacherAssignment, setLevelTeacherAssignment] = useState({
    level_subject_id: "",
    teacher_id: "",
  })
  const [assignLevelTeacherDialogOpen, setAssignLevelTeacherDialogOpen] = useState(false)

  // Forms
  const [classForm, setClassForm] = useState({
    name: "",
    level_id: "",
    section_id: "",
    capacity: 50,
    class_teacher: "",
    academic_year: "2024-2025",
  })

  const [selectedSubjectsForAssign, setSelectedSubjectsForAssign] = useState<
    { subject_id: string; coefficient: number }[]
  >([])

  const [teacherAssignment, setTeacherAssignment] = useState({
    class_subject_id: "",
    teacher_id: "",
  })

  // Local state for filtered level subjects
  const [currentLevelSubjects, setCurrentLevelSubjects] = useState<LevelSubject[]>([])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        sectionsRes,
        levelsRes,
        classesRes,
        teachersRes,
        subjectsRes,
        subjectGroupsRes,
        classSubjectsRes,
        levelSubjectsRes,
      ] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("levels").select("*").order("order"),
        supabase.from("classes").select("*, level:levels(*), section:sections(*)").order("name"),
        supabase.from("teachers").select("*").eq("status", "active").order("last_name"),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("subject_groups").select("*").order("order"),
        supabase.from("class_subjects").select("*, subject:subjects(*), teacher:teachers(*)"),
        supabase.from("level_subjects").select("*, subject:subjects(*), teacher:teachers(*)"),
      ])

      setSections(sectionsRes.data || [])
      setLevels(levelsRes.data || [])
      setClasses(classesRes.data || [])
      setTeachers(teachersRes.data || [])
      setSubjects(subjectsRes.data || [])
      setSubjectGroups(subjectGroupsRes.data || [])
      setClassSubjects(classSubjectsRes.data || [])
      setLevelSubjects(levelSubjectsRes.data || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered data
  const filteredLevels = selectedSection ? levels.filter((l) => l.section_id === selectedSection) : levels

  const filteredClasses = classes.filter((c) => {
    if (selectedSection && c.section_id !== selectedSection) return false
    if (selectedLevel && c.level_id !== selectedLevel) return false
    return true
  })

  const currentClassSubjects = selectedClass ? classSubjects.filter((cs) => cs.class_id === selectedClass) : []

  // Update currentLevelSubjects based on selected section and level
  useEffect(() => {
    if (selectedSection && selectedSection !== "all" && selectedLevel && selectedLevel !== "all") {
      const filtered = levelSubjects.filter((ls) => ls.section_id === selectedSection && ls.level_id === selectedLevel)
      console.log("[v0] Filtering level subjects:", {
        selectedSection,
        selectedLevel,
        totalLevelSubjects: levelSubjects.length,
        filteredCount: filtered.length,
      })
      setCurrentLevelSubjects(filtered)
    } else {
      setCurrentLevelSubjects([])
    }
  }, [selectedSection, selectedLevel, levelSubjects])

  // Get subjects for the selected section
  const sectionSubjects = subjects.filter((s) => {
    const group = subjectGroups.find((g) => g.id === s.subject_group_id)
    return group?.section_id === selectedSection || !group?.section_id
  })

  // Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classForm.name || !classForm.level_id || !classForm.section_id) {
      toast.error("Remplissez tous les champs obligatoires")
      return
    }

    try {
      const { error } = await supabase.from("classes").insert({
        name: classForm.name,
        level_id: classForm.level_id,
        section_id: classForm.section_id,
        capacity: classForm.capacity,
        class_teacher: classForm.class_teacher || null,
        academic_year: classForm.academic_year,
      })

      if (error) throw error
      toast.success("Classe créée avec succès")
      setClassDialogOpen(false)
      setClassForm({
        name: "",
        level_id: "",
        section_id: "",
        capacity: 50,
        class_teacher: "",
        academic_year: "2024-2025",
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création")
    }
  }

  // Assign subjects to class
  const handleAssignSubjectsToClass = async () => {
    if (!selectedClass || selectedSubjectsForAssign.length === 0) {
      toast.error("Sélectionnez des matières")
      return
    }

    try {
      const inserts = selectedSubjectsForAssign.map((s) => ({
        class_id: selectedClass,
        subject_id: s.subject_id,
        coefficient: s.coefficient,
      }))

      const { error } = await supabase.from("class_subjects").insert(inserts)
      if (error) throw error

      toast.success("Matières assignées à la classe")
      setAssignSubjectsDialogOpen(false)
      setSelectedSubjectsForAssign([])
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  // Assign teacher to class subject
  const handleAssignTeacher = async () => {
    if (!teacherAssignment.class_subject_id || !teacherAssignment.teacher_id) {
      toast.error("Sélectionnez un enseignant")
      return
    }

    try {
      const { error } = await supabase
        .from("class_subjects")
        .update({ teacher_id: teacherAssignment.teacher_id })
        .eq("id", teacherAssignment.class_subject_id)

      if (error) throw error
      toast.success("Enseignant assigné")
      setAssignTeacherDialogOpen(false)
      setTeacherAssignment({ class_subject_id: "", teacher_id: "" })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  // Remove class subject
  const handleRemoveClassSubject = async (id: string) => {
    if (!confirm("Retirer cette matière de la classe ?")) return
    try {
      const { error } = await supabase.from("class_subjects").delete().eq("id", id)
      if (error) throw error
      toast.success("Matière retirée")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  // Assign subjects to level (tronc commun)
  const handleAssignSubjectsToLevel = async () => {
    if (!selectedLevel || !selectedSection || selectedSubjectsForAssign.length === 0) {
      toast.error("Sélectionnez des matières")
      return
    }

    try {
      const inserts = selectedSubjectsForAssign.map((s) => ({
        level_id: selectedLevel,
        section_id: selectedSection,
        subject_id: s.subject_id,
        coefficient: s.coefficient,
      }))

      const { error } = await supabase.from("level_subjects").insert(inserts)
      if (error) throw error

      toast.success("Matières du tronc commun assignées")
      setLevelSubjectsDialogOpen(false)
      setSelectedSubjectsForAssign([])
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  // Remove level subject
  const handleRemoveLevelSubject = async (id: string) => {
    if (!confirm("Retirer cette matière du tronc commun ?")) return
    try {
      const { error } = await supabase.from("level_subjects").delete().eq("id", id)
      if (error) throw error
      toast.success("Matière retirée du tronc commun")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  // Delete class
  const handleDeleteClass = async (id: string) => {
    if (!confirm("Supprimer cette classe ? Tous les élèves et matières associées seront affectés.")) return
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id)
      if (error) throw error
      toast.success("Classe supprimée")
      setSelectedClass("")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  // Update class teacher
  const handleUpdateClassTeacher = async (classId: string, teacherName: string) => {
    try {
      const { error } = await supabase
        .from("classes")
        .update({ class_teacher: teacherName || null })
        .eq("id", classId)

      if (error) throw error
      toast.success("Professeur principal mis à jour")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  const handleAssignLevelTeacher = async () => {
    if (!levelTeacherAssignment.level_subject_id || !levelTeacherAssignment.teacher_id) {
      toast.error("Sélectionnez un enseignant")
      return
    }

    try {
      const { error } = await supabase
        .from("level_subjects")
        .update({ teacher_id: levelTeacherAssignment.teacher_id })
        .eq("id", levelTeacherAssignment.level_subject_id)

      if (error) throw error
      toast.success("Enseignant assigné au tronc commun")
      setAssignLevelTeacherDialogOpen(false)
      setLevelTeacherAssignment({ level_subject_id: "", teacher_id: "" })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Centre d'Attribution" description="Chargement..." />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Centre d'Attribution" description="Gérer les classes, matières et enseignants" />

      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-3">
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="level-subjects" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Tronc Commun
          </TabsTrigger>
          <TabsTrigger value="class-subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Matières par Classe
          </TabsTrigger>
        </TabsList>

        {/* CLASSES TAB */}
        <TabsContent value="classes" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 min-w-[200px]">
                  <Label>Section</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sections</SelectItem>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-[200px]">
                  <Label>Niveau</Label>
                  <Select
                    value={selectedLevel}
                    onValueChange={setSelectedLevel}
                    disabled={!selectedSection || selectedSection === "all"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      {filteredLevels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                  <Button onClick={() => setClassDialogOpen(true)} disabled={sections.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Classe
                  </Button>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Créer une Classe</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateClass} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Section *</Label>
                        <Select
                          value={classForm.section_id}
                          onValueChange={(v) => {
                            setClassForm((prev) => ({ ...prev, section_id: v, level_id: "" }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
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
                        <Label>Niveau *</Label>
                        <Select
                          value={classForm.level_id}
                          onValueChange={(v) => setClassForm((prev) => ({ ...prev, level_id: v }))}
                          disabled={!classForm.section_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {levels
                              .filter((l) => l.section_id === classForm.section_id)
                              .map((l) => (
                                <SelectItem key={l.id} value={l.id}>
                                  {l.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class-name">Nom de la Classe *</Label>
                        <Input
                          id="class-name"
                          value={classForm.name}
                          onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: 6ème A, Form 1 B"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="capacity">Capacité</Label>
                          <Input
                            id="capacity"
                            type="number"
                            min={1}
                            value={classForm.capacity}
                            onChange={(e) =>
                              setClassForm((prev) => ({
                                ...prev,
                                capacity: Number.parseInt(e.target.value) || 50,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="year">Année</Label>
                          <Input
                            id="year"
                            value={classForm.academic_year}
                            onChange={(e) => setClassForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Professeur Principal</Label>
                        <Select
                          value={classForm.class_teacher || "none"}
                          onValueChange={(v) =>
                            setClassForm((prev) => ({ ...prev, class_teacher: v === "none" ? "" : v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner (optionnel)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={`${t.first_name} ${t.last_name}`}>
                                {t.first_name} {t.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Annuler
                          </Button>
                        </DialogClose>
                        <Button type="submit">Créer</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Classes Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClasses.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune classe trouvée</p>
                  {sections.length === 0 && (
                    <p className="text-sm mt-2">Créez d'abord des sections et niveaux dans Administration</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredClasses.map((cls) => {
                const studentCount = 0 // Would need to fetch this
                const subjectCount = classSubjects.filter((cs) => cs.class_id === cls.id).length
                const levelSubjectCount = levelSubjects.filter(
                  (ls) => ls.level_id === cls.level_id && ls.section_id === cls.section_id,
                ).length

                return (
                  <Card
                    key={cls.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedClass === cls.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedClass(cls.id === selectedClass ? "" : cls.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="outline">{cls.section?.name}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{cls.level?.name}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {subjectCount + levelSubjectCount} matières
                        </Badge>
                        {cls.class_teacher && (
                          <Badge variant="secondary">
                            <UserCheck className="h-3 w-3 mr-1" />
                            PP
                          </Badge>
                        )}
                      </div>
                      {cls.class_teacher && (
                        <p className="text-xs text-muted-foreground mt-2">PP: {cls.class_teacher}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Selected Class Details */}
          {selectedClass && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{filteredClasses.find((c) => c.id === selectedClass)?.name}</CardTitle>
                  <CardDescription>Détails et gestion de la classe</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(selectedClass)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label>Professeur Principal:</Label>
                    <Select
                      value={filteredClasses.find((c) => c.id === selectedClass)?.class_teacher || "none"}
                      onValueChange={(v) => handleUpdateClassTeacher(selectedClass, v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Aucun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={`${t.first_name} ${t.last_name}`}>
                            {t.first_name} {t.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* LEVEL SUBJECTS (TRONC COMMUN) TAB */}
        <TabsContent value="level-subjects" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 min-w-[200px]">
                  <Label>Section *</Label>
                  <Select
                    value={selectedSection}
                    onValueChange={(v) => {
                      setSelectedSection(v)
                      setSelectedLevel("all")
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
                <div className="space-y-2 min-w-[200px]">
                  <Label>Niveau *</Label>
                  <Select
                    value={selectedLevel}
                    onValueChange={setSelectedLevel}
                    disabled={!selectedSection || selectedSection === "all"}
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
                <Button
                  onClick={() => {
                    setSelectedSubjectsForAssign([])
                    setLevelSubjectsDialogOpen(true)
                  }}
                  disabled={!selectedSection || !selectedLevel || selectedLevel === "all"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Matières
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedLevel !== "all" && selectedSection !== "all" && (
            <Card>
              <CardHeader>
                <CardTitle>Matières du Tronc Commun - {levels.find((l) => l.id === selectedLevel)?.name}</CardTitle>
                <CardDescription>
                  Ces matières sont automatiquement assignées à toutes les classes de ce niveau
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentLevelSubjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Aucune matière de tronc commun</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matière</TableHead>
                        <TableHead>Coefficient</TableHead>
                        <TableHead>Enseignant</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentLevelSubjects.map((ls) => (
                        <TableRow key={ls.id}>
                          <TableCell className="font-medium">{ls.subject?.name}</TableCell>
                          <TableCell>{ls.coefficient}</TableCell>
                          <TableCell>
                            {ls.teacher ? (
                              <span className="text-sm">
                                {ls.teacher.first_name} {ls.teacher.last_name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">Non assigné</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setLevelTeacherAssignment({
                                  level_subject_id: ls.id,
                                  teacher_id: ls.teacher_id || "",
                                })
                                setAssignLevelTeacherDialogOpen(true)
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              {ls.teacher ? "Changer" : "Assigner"}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRemoveLevelSubject(ls.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dialog for assigning level subjects */}
          <Dialog open={levelSubjectsDialogOpen} onOpenChange={setLevelSubjectsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Ajouter des matières au tronc commun</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="space-y-3">
                  {sectionSubjects
                    .filter((s) => !currentLevelSubjects.find((ls) => ls.subject_id === s.id))
                    .map((subject) => {
                      const isSelected = selectedSubjectsForAssign.find((ss) => ss.subject_id === subject.id)
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={!!isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjectsForAssign((prev) => [
                                    ...prev,
                                    { subject_id: subject.id, coefficient: 1 },
                                  ])
                                } else {
                                  setSelectedSubjectsForAssign((prev) =>
                                    prev.filter((s) => s.subject_id !== subject.id),
                                  )
                                }
                              }}
                            />
                            <div>
                              <p className="font-medium">{subject.name}</p>
                              <p className="text-xs text-muted-foreground">{subject.code}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Coef:</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={isSelected.coefficient}
                                onChange={(e) => {
                                  setSelectedSubjectsForAssign((prev) =>
                                    prev.map((s) =>
                                      s.subject_id === subject.id
                                        ? { ...s, coefficient: Number.parseInt(e.target.value) || 1 }
                                        : s,
                                    ),
                                  )
                                }}
                                className="w-16 h-8"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={handleAssignSubjectsToLevel} disabled={selectedSubjectsForAssign.length === 0}>
                  Ajouter ({selectedSubjectsForAssign.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* CLASS SUBJECTS TAB */}
        <TabsContent value="class-subjects" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 min-w-[200px]">
                  <Label>Section</Label>
                  <Select
                    value={selectedSection}
                    onValueChange={(v) => {
                      setSelectedSection(v)
                      setSelectedLevel("all")
                      setSelectedClass("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les sections" />
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
                <div className="space-y-2 min-w-[200px]">
                  <Label>Classe *</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                    disabled={!selectedSection || selectedSection === "all"}
                  >
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
                <Button
                  onClick={() => {
                    setSelectedSubjectsForAssign([])
                    setAssignSubjectsDialogOpen(true)
                  }}
                  disabled={!selectedClass}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Matières
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedClass && (
            <Card>
              <CardHeader>
                <CardTitle>Matières de {filteredClasses.find((c) => c.id === selectedClass)?.name}</CardTitle>
                <CardDescription>Matières spécifiques à cette classe (en plus du tronc commun)</CardDescription>
              </CardHeader>
              <CardContent>
                {currentClassSubjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Aucune matière spécifique à cette classe</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matière</TableHead>
                        <TableHead>Coefficient</TableHead>
                        <TableHead>Enseignant</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentClassSubjects.map((cs) => (
                        <TableRow key={cs.id}>
                          <TableCell className="font-medium">{cs.subject?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cs.coefficient}</Badge>
                          </TableCell>
                          <TableCell>
                            {cs.teacher ? (
                              <span>
                                {cs.teacher.first_name} {cs.teacher.last_name}
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTeacherAssignment({
                                    class_subject_id: cs.id,
                                    teacher_id: "",
                                  })
                                  setAssignTeacherDialogOpen(true)
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Assigner
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {cs.teacher && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setTeacherAssignment({
                                      class_subject_id: cs.id,
                                      teacher_id: cs.teacher_id || "",
                                    })
                                    setAssignTeacherDialogOpen(true)
                                  }}
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveClassSubject(cs.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dialog for assigning class subjects */}
          <Dialog open={assignSubjectsDialogOpen} onOpenChange={setAssignSubjectsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Ajouter des matières à la classe</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[50vh] pr-4">
                <div className="space-y-3">
                  {sectionSubjects
                    .filter((s) => !currentClassSubjects.find((cs) => cs.subject_id === s.id))
                    .map((subject) => {
                      const isSelected = selectedSubjectsForAssign.find((ss) => ss.subject_id === subject.id)
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={!!isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubjectsForAssign((prev) => [
                                    ...prev,
                                    { subject_id: subject.id, coefficient: 1 },
                                  ])
                                } else {
                                  setSelectedSubjectsForAssign((prev) =>
                                    prev.filter((s) => s.subject_id !== subject.id),
                                  )
                                }
                              }}
                            />
                            <div>
                              <p className="font-medium">{subject.name}</p>
                              <p className="text-xs text-muted-foreground">{subject.code}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Coef:</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={isSelected.coefficient}
                                onChange={(e) => {
                                  setSelectedSubjectsForAssign((prev) =>
                                    prev.map((s) =>
                                      s.subject_id === subject.id
                                        ? { ...s, coefficient: Number.parseInt(e.target.value) || 1 }
                                        : s,
                                    ),
                                  )
                                }}
                                className="w-16 h-8"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={handleAssignSubjectsToClass} disabled={selectedSubjectsForAssign.length === 0}>
                  Ajouter ({selectedSubjectsForAssign.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for assigning teacher */}
          <Dialog open={assignTeacherDialogOpen} onOpenChange={setAssignTeacherDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner un Enseignant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Enseignant</Label>
                  <Select
                    value={teacherAssignment.teacher_id}
                    onValueChange={(v) => setTeacherAssignment((prev) => ({ ...prev, teacher_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un enseignant" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                          {t.specialization && ` - ${t.specialization}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={handleAssignTeacher}>Assigner</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <Dialog open={assignLevelTeacherDialogOpen} onOpenChange={setAssignLevelTeacherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un enseignant (Tronc Commun)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Enseignant</Label>
              <Select
                value={levelTeacherAssignment.teacher_id}
                onValueChange={(value) => setLevelTeacherAssignment({ ...levelTeacherAssignment, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                      {t.specialization && ` - ${t.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignLevelTeacher} className="w-full">
              Assigner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
