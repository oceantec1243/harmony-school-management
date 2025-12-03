"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentAvatar } from "@/components/students/student-avatar"
import { StatusBadge } from "@/components/students/status-badge"
import { createClient } from "@/lib/supabase/client"
import { calculateAge, formatShortDate } from "@/lib/calculations"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2, User, Users, MapPin, Phone, Calendar, GraduationCap } from "lucide-react"

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth: string | null
  gender: "M" | "F"
  photo: string | null
  status: "Active" | "Suspended" | "Graduated"
  enrollment_date: string | null
  father_name: string | null
  father_phone: string | null
  mother_name: string | null
  mother_phone: string | null
  guardian_name: string | null
  guardian_phone: string | null
  address: string | null
  class: {
    id: string
    name: string
    level: { id: string; name: string } | null
    section: { id: string; name: string } | null
  } | null
}

export default function StudentDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id === "new") {
      router.replace("/students/new")
      return
    }
  }, [id, router])

  const fetchStudent = useCallback(async () => {
    if (id === "new") return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          class:classes(
            id, name,
            level:levels(id, name),
            section:sections(id, name)
          )
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      setStudent(data)
    } catch (error) {
      console.error("[v0] Error fetching student:", error)
      toast.error("Erreur lors du chargement de l'élève")
    } finally {
      setLoading(false)
    }
  }, [supabase, id])

  useEffect(() => {
    if (id && id !== "new") {
      fetchStudent()
    }
  }, [fetchStudent, id])

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) return

    try {
      const { error } = await supabase.from("students").delete().eq("id", id)
      if (error) throw error
      toast.success("Élève supprimé avec succès")
      router.push("/students")
    } catch (error) {
      console.error("[v0] Error deleting student:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Chargement..." description="" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    )
  }

  if (!student) {
    return (
      <AppLayout>
        <PageHeader title="Élève non trouvé" description="">
          <Button variant="outline" asChild>
            <Link href="/students">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
        </PageHeader>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title={`${student.first_name} ${student.last_name}`} description={student.matricule}>
        <Button variant="outline" asChild>
          <Link href="/students">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/students/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Link>
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </PageHeader>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <StudentAvatar
              firstName={student.first_name}
              lastName={student.last_name}
              photo={student.photo || undefined}
              size="lg"
            />
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {student.last_name} {student.first_name}
                </h2>
                <p className="text-muted-foreground font-mono">{student.matricule}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={student.status} />
                <Badge variant="outline">{student.gender === "M" ? "Masculin" : "Féminin"}</Badge>
                {student.class && (
                  <Badge variant="secondary">
                    {student.class.name} - {student.class.section?.name}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatShortDate(student.date_of_birth)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{calculateAge(student.date_of_birth)} ans</span>
                </div>
                {student.place_of_birth && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{student.place_of_birth}</span>
                  </div>
                )}
                {student.enrollment_date && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Inscrit le {formatShortDate(student.enrollment_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="family">
        <TabsList>
          <TabsTrigger value="family">Famille</TabsTrigger>
          <TabsTrigger value="grades">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informations Familiales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Père */}
                <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold">Père</h4>
                  <p>{student.father_name || "-"}</p>
                  {student.father_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {student.father_phone}
                    </div>
                  )}
                </div>

                {/* Mère */}
                <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold">Mère</h4>
                  <p>{student.mother_name || "-"}</p>
                  {student.mother_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {student.mother_phone}
                    </div>
                  )}
                </div>

                {/* Tuteur */}
                {(student.guardian_name || student.guardian_phone) && (
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold">Tuteur</h4>
                    <p>{student.guardian_name || "-"}</p>
                    {student.guardian_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {student.guardian_phone}
                      </div>
                    )}
                  </div>
                )}

                {/* Adresse */}
                {student.address && (
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold">Adresse</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p>{student.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes de l'élève</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Les notes seront affichées ici une fois saisies.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
