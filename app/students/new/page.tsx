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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ArrowLeft, Save, User, Users, MapPin, AlertTriangle } from "lucide-react"
import Link from "next/link"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type Class = { id: string; name: string; level_id: string; section_id: string }

export default function NewStudentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

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
  })

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [sectionsRes, levelsRes, classesRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("levels").select("*").order("order"),
        supabase.from("classes").select("*").order("name"),
      ])

      setSections(sectionsRes.data || [])
      setLevels(levelsRes.data || [])
      setClasses(classesRes.data || [])
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

  const generateMatricule = async (sectionId: string) => {
    if (!sectionId) return

    setGenerating(true)
    try {
      const section = sections.find((s) => s.id === sectionId)
      const sectionCode = section?.name === "Francophone" ? "FR" : "EN"
      const year = new Date().getFullYear()

      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .ilike("matricule", `${year}-${sectionCode}-%`)

      const number = String((count || 0) + 1).padStart(3, "0")
      setFormData((prev) => ({ ...prev, matricule: `${year}-${sectionCode}-${number}` }))
    } catch (error) {
      console.error("Error generating matricule:", error)
    } finally {
      setGenerating(false)
    }
  }

  const filteredLevels = selectedSection ? levels.filter((l) => l.section_id === selectedSection) : levels

  const filteredClasses = classes.filter((c) => {
    if (selectedSection && c.section_id !== selectedSection) return false
    if (selectedLevel && c.level_id !== selectedLevel) return false
    return true
  })

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId)
    setSelectedLevel("")
    setFormData((prev) => ({ ...prev, class_id: "" }))
    generateMatricule(sectionId)
  }

  const handleLevelChange = (levelId: string) => {
    setSelectedLevel(levelId)
    setFormData((prev) => ({ ...prev, class_id: "" }))
  }

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

    setLoading(true)
    try {
      const { error } = await supabase.from("students").insert({
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
        status: "Active",
        enrollment_date: new Date().toISOString().split("T")[0],
      })

      if (error) throw error

      toast.success("Élève créé avec succès")
      router.push("/students")
    } catch (error: any) {
      console.error("Error creating student:", error)
      toast.error(error.message || "Erreur lors de la création de l'élève")
    } finally {
      setLoading(false)
    }
  }

  const hasNoBaseData = !dataLoading && (sections.length === 0 || levels.length === 0 || classes.length === 0)

  return (
    <AppLayout>
      <PageHeader title="Nouvel Élève" description="Ajouter un nouvel élève dans le système">
        <Button variant="outline" asChild>
          <Link href="/students">
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
            <p>Avant de créer des élèves, vous devez configurer les données de base du système:</p>
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
              {classes.length === 0 && (
                <li>
                  Créez les classes dans{" "}
                  <Link href="/assignments" className="underline font-medium">
                    Centre d'Attribution
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
                placeholder={generating ? "Génération..." : "Auto-généré"}
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
              <Label>Section *</Label>
              <Select value={selectedSection} onValueChange={handleSectionChange}>
                <SelectTrigger>
                  <SelectValue placeholder={sections.length === 0 ? "Aucune section" : "Sélectionner une section"} />
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
                value={selectedLevel}
                onValueChange={handleLevelChange}
                disabled={!selectedSection || filteredLevels.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filteredLevels.length === 0 ? "Aucun niveau" : "Sélectionner un niveau"} />
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
                disabled={!selectedLevel || filteredClasses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={filteredClasses.length === 0 ? "Aucune classe" : "Sélectionner une classe"}
                  />
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
          <Button type="submit" disabled={loading || hasNoBaseData}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </AppLayout>
  )
}
