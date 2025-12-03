"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ArrowLeft, Save, User, Users, MapPin } from "lucide-react"
import Link from "next/link"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type ClassType = { id: string; name: string; level_id: string; section_id: string }

export default function EditStudentPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")

  const [formData, setFormData] = useState({
    matricule: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    place_of_birth: "",
    gender: "" as "M" | "F" | "",
    class_id: "",
    father_name: "",
    father_phone: "",
    mother_name: "",
    mother_phone: "",
    guardian_name: "",
    guardian_phone: "",
    address: "",
    status: "Active" as "Active" | "Suspended" | "Graduated",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sectionsRes, levelsRes, classesRes, studentRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("levels").select("*").order("order"),
        supabase.from("classes").select("*").order("name"),
        supabase
          .from("students")
          .select(`
            *,
            class:classes(
              id, name, level_id, section_id,
              level:levels(id, name),
              section:sections(id, name)
            )
          `)
          .eq("id", id)
          .single(),
      ])

      setSections(sectionsRes.data || [])
      setLevels(levelsRes.data || [])
      setClasses(classesRes.data || [])

      if (studentRes.data) {
        const student = studentRes.data
        setFormData({
          matricule: student.matricule || "",
          first_name: student.first_name || "",
          last_name: student.last_name || "",
          date_of_birth: student.date_of_birth || "",
          place_of_birth: student.place_of_birth || "",
          gender: student.gender || "",
          class_id: student.class_id || "",
          father_name: student.father_name || "",
          father_phone: student.father_phone || "",
          mother_name: student.mother_name || "",
          mother_phone: student.mother_phone || "",
          guardian_name: student.guardian_name || "",
          guardian_phone: student.guardian_phone || "",
          address: student.address || "",
          status: student.status || "Active",
        })
        setSelectedSection(student.class?.section_id || "")
        setSelectedLevel(student.class?.level_id || "")
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }, [supabase, id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredLevels = selectedSection ? levels.filter((l) => l.section_id === selectedSection) : levels

  const filteredClasses = classes.filter((c) => {
    if (selectedSection && c.section_id !== selectedSection) return false
    if (selectedLevel && c.level_id !== selectedLevel) return false
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.date_of_birth ||
      !formData.gender ||
      !formData.class_id
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from("students")
        .update({
          matricule: formData.matricule,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          place_of_birth: formData.place_of_birth || null,
          gender: formData.gender,
          class_id: formData.class_id,
          father_name: formData.father_name || null,
          father_phone: formData.father_phone || null,
          mother_name: formData.mother_name || null,
          mother_phone: formData.mother_phone || null,
          guardian_name: formData.guardian_name || null,
          guardian_phone: formData.guardian_phone || null,
          address: formData.address || null,
          status: formData.status,
        })
        .eq("id", id)

      if (error) throw error

      toast.success("Élève modifié avec succès")
      router.push("/students")
    } catch (error: any) {
      console.error("[v0] Error updating student:", error)
      toast.error(error.message || "Erreur lors de la modification")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Modifier l'élève" description="Chargement..." />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Modifier l'élève" description={`${formData.first_name} ${formData.last_name}`}>
        <Button variant="outline" asChild>
          <Link href="/students">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input
                id="matricule"
                value={formData.matricule}
                onChange={(e) => setFormData((prev) => ({ ...prev, matricule: e.target.value }))}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date de Naissance *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place_of_birth">Lieu de Naissance</Label>
              <Input
                id="place_of_birth"
                value={formData.place_of_birth}
                onChange={(e) => setFormData((prev) => ({ ...prev, place_of_birth: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genre *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: "M" | "F") => setFormData((prev) => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Suspended" | "Graduated") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Actif</SelectItem>
                  <SelectItem value="Suspended">Suspendu</SelectItem>
                  <SelectItem value="Graduated">Diplômé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Affectation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Affectation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={selectedSection}
                onValueChange={(v) => {
                  setSelectedSection(v)
                  setSelectedLevel("")
                  setFormData((prev) => ({ ...prev, class_id: "" }))
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
                  setFormData((prev) => ({ ...prev, class_id: "" }))
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

            <div className="space-y-2">
              <Label htmlFor="class_id">Classe *</Label>
              <Select
                value={formData.class_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, class_id: value }))}
                disabled={!selectedLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
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
          </CardContent>
        </Card>

        {/* Informations familiales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informations Familiales
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="father_name">Nom du Père</Label>
              <Input
                id="father_name"
                value={formData.father_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, father_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="father_phone">Téléphone du Père</Label>
              <Input
                id="father_phone"
                value={formData.father_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, father_phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mother_name">Nom de la Mère</Label>
              <Input
                id="mother_name"
                value={formData.mother_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, mother_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mother_phone">Téléphone de la Mère</Label>
              <Input
                id="mother_phone"
                value={formData.mother_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, mother_phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardian_name">Nom du Tuteur</Label>
              <Input
                id="guardian_name"
                value={formData.guardian_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, guardian_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardian_phone">Téléphone du Tuteur</Label>
              <Input
                id="guardian_phone"
                value={formData.guardian_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, guardian_phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/students">Annuler</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </AppLayout>
  )
}
