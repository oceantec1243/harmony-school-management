"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentAvatar } from "@/components/students/student-avatar"
import { StatusBadge } from "@/components/students/status-badge"
import { ArrowLeft, Users, BookOpen, UserCog, Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type ClassSubject = {
  id: string
  subject_id: string
  coefficient: number
  subject: {
    id: string
    name: string
    code: string
    subject_group: { name: string }
  }
  teacher: { id: string; first_name: string; last_name: string } | null
}

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  gender: string
  status: string
  photo: string | null
}

type Teacher = {
  id: string
  first_name: string
  last_name: string
  specialization: string | null
}

type Subject = {
  id: string
  name: string
  code: string
}

export default function ClassDetailPage() {
  const params = useParams()
  const classId = params.id as string

  const [classData, setClassData] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)
  const [newSubjectData, setNewSubjectData] = useState({ subject_id: "", coefficient: 1, teacher_id: "" })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (classId === "new") return

    setLoading(true)
    try {
      // Fetch class details
      const { data: cls, error: clsError } = await supabase
        .from("classes")
        .select(`
          *,
          level:levels(name),
          section:sections(name)
        `)
        .eq("id", classId)
        .single()

      if (clsError) throw clsError
      setClassData(cls)

      // Fetch students
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, matricule, first_name, last_name, gender, status, photo")
        .eq("class_id", classId)
        .eq("status", "Active")
        .order("last_name")

      setStudents(studentsData || [])

      // Fetch class subjects with teacher
      const { data: subjectsData } = await supabase
        .from("class_subjects")
        .select(`
          *,
          subject:subjects(id, name, code, subject_group:subject_groups(name)),
          teacher:teachers(id, first_name, last_name)
        `)
        .eq("class_id", classId)
        .order("coefficient", { ascending: false })

      setClassSubjects(subjectsData || [])

      // Fetch all teachers
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, specialization")
        .eq("status", "active")
        .order("last_name")

      setTeachers(teachersData || [])

      // Fetch all subjects
      const { data: allSubjectsData } = await supabase.from("subjects").select("id, name, code").order("name")

      setAllSubjects(allSubjectsData || [])
    } catch (error) {
      console.error("[v0] Error fetching class data:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [supabase, classId])

  useEffect(() => {
    if (classId === "new") {
      window.location.href = "/classes/new"
      return
    }
    fetchData()
  }, [fetchData, classId])

  const handleAssignTeacher = async (classSubjectId: string, teacherId: string | null) => {
    try {
      const { error } = await supabase
        .from("class_subjects")
        .update({ teacher_id: teacherId === "none" ? null : teacherId })
        .eq("id", classSubjectId)

      if (error) throw error
      toast.success("Enseignant assigné avec succès")
      fetchData()
    } catch (error) {
      console.error("[v0] Error assigning teacher:", error)
      toast.error("Erreur lors de l'assignation")
    }
  }

  const handleAddSubject = async () => {
    if (!newSubjectData.subject_id) {
      toast.error("Veuillez sélectionner une matière")
      return
    }

    try {
      const { error } = await supabase.from("class_subjects").insert({
        class_id: classId,
        subject_id: newSubjectData.subject_id,
        coefficient: newSubjectData.coefficient,
        teacher_id: newSubjectData.teacher_id || null,
      })

      if (error) throw error
      toast.success("Matière ajoutée avec succès")
      setIsAddSubjectOpen(false)
      setNewSubjectData({ subject_id: "", coefficient: 1, teacher_id: "" })
      fetchData()
    } catch (error) {
      console.error("[v0] Error adding subject:", error)
      toast.error("Erreur lors de l'ajout de la matière")
    }
  }

  const handleRemoveSubject = async (classSubjectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cette matière ?")) return

    try {
      const { error } = await supabase.from("class_subjects").delete().eq("id", classSubjectId)

      if (error) throw error
      toast.success("Matière retirée")
      fetchData()
    } catch (error) {
      console.error("[v0] Error removing subject:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  // Get subjects not yet assigned to this class
  const availableSubjects = allSubjects.filter((s) => !classSubjects.some((cs) => cs.subject_id === s.id))

  if (loading) {
    return (
      <AppLayout>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    )
  }

  if (!classData) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Classe non trouvée</p>
          <Button asChild className="mt-4">
            <Link href="/classes">Retour aux classes</Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/classes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux classes
          </Link>
        </Button>
      </div>

      <PageHeader
        title={classData.name}
        description={`${classData.level?.name} - ${classData.section?.name} | Année ${classData.academic_year}`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Élèves inscrits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classSubjects.length}</p>
                <p className="text-sm text-muted-foreground">Matières</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <UserCog className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-lg font-medium">{classData.class_teacher || "Non assigné"}</p>
                <p className="text-sm text-muted-foreground">Professeur principal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Élèves ({students.length})</TabsTrigger>
          <TabsTrigger value="subjects">Matières & Enseignants ({classSubjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Élèves</CardTitle>
              <CardDescription>Élèves inscrits dans cette classe</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">N°</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <StudentAvatar
                            firstName={student.first_name}
                            lastName={student.last_name}
                            photo={student.photo || undefined}
                            size="sm"
                          />
                          <Link href={`/students/${student.id}`} className="font-medium hover:text-primary">
                            {student.last_name} {student.first_name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                      <TableCell>{student.gender === "M" ? "Masculin" : "Féminin"}</TableCell>
                      <TableCell>
                        <StatusBadge status={student.status as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucun élève dans cette classe
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Matières et Enseignants</CardTitle>
                <CardDescription>Gérez les matières et assignez les enseignants</CardDescription>
              </div>
              <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une matière
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une matière</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Matière</Label>
                      <Select
                        value={newSubjectData.subject_id}
                        onValueChange={(v) => setNewSubjectData((prev) => ({ ...prev, subject_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une matière" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} ({s.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Coefficient</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newSubjectData.coefficient}
                        onChange={(e) =>
                          setNewSubjectData((prev) => ({ ...prev, coefficient: Number.parseInt(e.target.value) || 1 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Enseignant (optionnel)</Label>
                      <Select
                        value={newSubjectData.teacher_id}
                        onValueChange={(v) => setNewSubjectData((prev) => ({ ...prev, teacher_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un enseignant" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.first_name} {t.last_name} {t.specialization && `(${t.specialization})`}
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
                    <Button onClick={handleAddSubject}>Ajouter</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead className="text-center">Coefficient</TableHead>
                    <TableHead>Enseignant</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSubjects.map((cs) => (
                    <TableRow key={cs.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cs.subject?.name}</p>
                          <p className="text-sm text-muted-foreground">{cs.subject?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cs.subject?.subject_group?.name}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge>{cs.coefficient}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={cs.teacher?.id || "none"} onValueChange={(v) => handleAssignTeacher(cs.id, v)}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Assigner un enseignant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Non assigné</SelectItem>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.first_name} {t.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveSubject(cs.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classSubjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucune matière assignée à cette classe
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
