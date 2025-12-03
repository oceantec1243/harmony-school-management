"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ArrowLeft, Save, School, AlertTriangle } from "lucide-react"
import Link from "next/link"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type Teacher = { id: string; first_name: string; last_name: string }

export default function NewClassPage() {
  const router = useRouter()
  const supabase = createClient()

  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    level_id: "",
    section_id: "",
    capacity: 50,
    class_teacher_id: "",
    academic_year: "2024-2025",
  })

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [sectionsRes, levelsRes, teachersRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("levels").select("*").order("order"),
        supabase.from("teachers").select("id, first_name, last_name").eq("status", "Active").order("last_name"),
      ])

      setSections(sectionsRes.data || [])
      setLevels(levelsRes.data || [])
      setTeachers(teachersRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setDataLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredLevels = formData.section_id ? levels.filter((l) => l.section_id === formData.section_id) : levels

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.level_id || !formData.section_id) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setLoading(true)
    try {
      // Find teacher name for class_teacher field
      const selectedTeacher = teachers.find((t) => t.id === formData.class_teacher_id)
      const teacherName = selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : null

      const { error } = await supabase.from("classes").insert({
        name: formData.name,
        level_id: formData.level_id,
        section_id: formData.section_id,
        capacity: formData.capacity,
        class_teacher: teacherName,
        academic_year: formData.academic_year,
      })

      if (error) throw error

      toast.success("Classe créée avec succès")
      router.push("/classes")
    } catch (error: any) {
      console.error("Error creating class:", error)
      toast.error(error.message || "Erreur lors de la création de la classe")
    } finally {
      setLoading(false)
    }
  }

  const hasNoBaseData = !dataLoading && (sections.length === 0 || levels.length === 0)

  return (
    <AppLayout>
      <PageHeader title="Nouvelle Classe" description="Créer une nouvelle classe">
        <Button variant="outline" asChild>
          <Link href="/classes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
      </PageHeader>

      {hasNoBaseData && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration requise</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Avant de créer des classes, vous devez configurer les données de base du système:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {sections.length === 0 && (
                <li>
                  Créez les sections (Francophone / Anglophone) dans{" "}
                  <Link href="/administration" className="underline font-medium">
                    Administration
                  </Link>
                </li>
              )}
              {levels.length === 0 && (
                <li>
                  Créez les niveaux (6ème, 5ème... / Form 1, Form 2...) dans{" "}
                  <Link href="/administration" className="underline font-medium">
                    Administration
                  </Link>
                </li>
              )}
            </ul>
            <p className="mt-3 text-sm">
              Ou exécutez le script SQL <code className="bg-muted px-1 rounded">007_complete_seed.sql</code> pour
              initialiser automatiquement.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Informations de la Classe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la Classe *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: 6ème A, 1ère Année..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section *</Label>
                <Select
                  value={formData.section_id}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, section_id: v, level_id: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={sections.length === 0 ? "Aucune section" : "Sélectionner"} />
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
                <Label>Niveau *</Label>
                <Select
                  value={formData.level_id}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, level_id: v }))}
                  disabled={!formData.section_id || filteredLevels.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredLevels.length === 0 ? "Aucun niveau" : "Sélectionner"} />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                  min={1}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academic_year">Année Académique</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData((prev) => ({ ...prev, academic_year: e.target.value }))}
                  placeholder="2024-2025"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Professeur Principal</Label>
              <Select
                value={formData.class_teacher_id}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, class_teacher_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={teachers.length === 0 ? "Aucun enseignant" : "Sélectionner un enseignant"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucun --</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/classes">Annuler</Link>
              </Button>
              <Button type="submit" disabled={loading || hasNoBaseData}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Création..." : "Créer la Classe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </AppLayout>
  )
}
