"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ArrowLeft, Save, User, Users, MapPin, AlertTriangle } from "lucide-react"
import Link from "next/link"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type ClassType = { id: string; name: string; level_id: string; section_id: string }
type AcademicPeriod = { id: string; name: string; type: string; number: number; academic_year: string }

export default function EditStudentPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const hasFetched = useRef(false)

  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")

  const [unrankedPeriods, setUnrankedPeriods] = useState<string[]>([])

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

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    async function fetchData() {
      const client = createClient()
      setLoading(true)
      try {
        const [sectionsRes, levelsRes, classesRes, periodsRes, studentRes, unrankedRes] = await Promise.all([
          client.from("sections").select("*").order("name"),
          client.from("levels").select("*").order("order"),
          client.from("classes").select("*").order("name"),
          client.from("academic_periods").select("*").eq("type", "sequence").order("number"),
          client
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
          client.from("student_unranked_periods").select("academic_period_id").eq("student_id", id),
        ])

        setSections(sectionsRes.data || [])
        setLevels(levelsRes.data || [])
        setClasses(classesRes.data || [])
        setPeriods(periodsRes.data || [])

        if (unrankedRes.data) {
          setUnrankedPeriods(
            unrankedRes.data
              .filter((up) => up.academic_period_id != null)
              .map((up) => up.academic_period_id)
          )
        }

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
    }
    
    fetchData()
  }, [id])

  const filteredLevels = selectedSection ? levels.filter((l) => l.section_id === selectedSection) : levels

  const filteredClasses = classes.filter((c) => {
    if (selectedSection && c.section_id !== selectedSection) return false
    if (selectedLevel && c.level_id !== selectedLevel) return false
    return true
  })

  const toggleUnrankedPeriod = (periodId: string) => {
    if (!periodId) return
    setUnrankedPeriods((prev) => {
      if (prev.includes(periodId)) {
        return prev.filter((id) => id !== periodId)
      }
      return [...prev, periodId]
    })
  }

  const toggleAllPeriods = () => {
    if (unrankedPeriods.length === periods.length) {
      setUnrankedPeriods([])
    } else {
      setUnrankedPeriods(periods.map((p) => p.id))
    }
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

    setSaving(true)
    const supabase = createClient()
    try {
      // Update student basic info
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
          is_ranked: unrankedPeriods.length === 0,
        })
        .eq("id", id)

      if (error) throw error

      // First, delete all existing entries for this student
      await supabase.from("student_unranked_periods").delete().eq("student_id", id)

      // Then insert new entries if any
      if (unrankedPeriods.length > 0) {
        // Filter out any invalid period IDs
        const validPeriodIds = unrankedPeriods.filter((periodId) => 
          periodId && periods.some((p) => p.id === periodId)
        )
        
        if (validPeriodIds.length > 0) {
          const insertData = validPeriodIds.map((periodId) => ({
            student_id: id,
            academic_period_id: periodId,
          }))
          const { error: insertError } = await supabase.from("student_unranked_periods").insert(insertData)
          if (insertError) {
            console.error("[v0] Error inserting unranked periods:", insertError)
            // Don't throw - the student was updated successfully
          }
        }
      }

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

        <Card className={unrankedPeriods.length > 0 ? "border-orange-200" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Non Classé (NC)
              {unrankedPeriods.length > 0 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 ml-2">
                  {unrankedPeriods.length} séquence(s)
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Sélectionnez les séquences où cet élève ne doit pas être classé. Ses notes seront calculées mais il
              n'influencera pas le classement de la classe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune séquence trouvée. Créez des périodes académiques dans Administration.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Séquences Non Classé</Label>
                  <Button type="button" variant="outline" size="sm" onClick={toggleAllPeriods}>
                    {unrankedPeriods.length === periods.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {periods.map((period) => {
                    const isUnranked = unrankedPeriods.includes(period.id)
                    return (
                      <button
                        type="button"
                        key={period.id}
                        onClick={() => toggleUnrankedPeriod(period.id)}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-left
                          ${
                            isUnranked
                              ? "border-orange-400 bg-orange-50"
                              : "border-muted hover:border-primary/50 hover:bg-muted/50"
                          }
                        `}
                      >
                        <div
                          className={`
                            w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                            ${isUnranked ? "border-orange-500 bg-orange-500" : "border-input"}
                          `}
                        >
                          {isUnranked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isUnranked ? "text-orange-700" : ""}`}>
                            {period.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{period.academic_year}</p>
                        </div>
                        {isUnranked && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                            NC
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>

                {unrankedPeriods.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-orange-700">
                        <p className="font-medium">
                          Cet élève sera Non Classé pour {unrankedPeriods.length} séquence(s)
                        </p>
                        <p className="text-xs mt-1">
                          Séquences NC:{" "}
                          {periods
                            .filter((p) => unrankedPeriods.includes(p.id))
                            .map((p) => p.name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
