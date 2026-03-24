"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Save, Clock } from "lucide-react"

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type Student = {
  id: string
  first_name: string
  last_name: string
  matricule: string
  class: { name: string }
}
type AcademicPeriod = { id: string; name: string; type: string }
type Attendance = {
  student_id: string
  academic_period_id: string
  total_hours: number
  justified_hours: number
}

export default function AttendancePage() {
  const supabase = createClient()
  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])

  const [selectedSection, setSelectedSection] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")

  const [attendances, setAttendances] = useState<Map<string, Attendance>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedLevel && selectedPeriod) {
      fetchStudents()
    }
  }, [selectedLevel, selectedPeriod])

  const fetchInitialData = async () => {
    const [sectionsRes, periodsRes] = await Promise.all([
      supabase.from("sections").select("*").order("name"),
      supabase.from("academic_periods").select("*").in("type", ["trimester", "sequence"]).order("number"),
    ])

    setSections(sectionsRes.data || [])
    setPeriods(periodsRes.data || [])
  }

  useEffect(() => {
    if (selectedSection) {
      supabase
        .from("levels")
        .select("*")
        .eq("section_id", selectedSection)
        .order("order")
        .then(({ data }) => setLevels(data || []))
    }
  }, [selectedSection])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id")
        .eq("level_id", selectedLevel)

      if (classesError) throw classesError

      const classIds = classesData?.map((c) => c.id) || []

      if (classIds.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, matricule, class:classes!inner(name)")
        .ilike("status", "active")
        .in("class_id", classIds)
        .order("last_name")

      if (studentsError) throw studentsError

      console.log("[v0] Fetched students:", studentsData?.length)
      setStudents(studentsData || [])

      // Load existing attendance records
      const { data: attendanceData } = await supabase
        .from("student_attendances")
        .select("*")
        .eq("academic_period_id", selectedPeriod)
        .in("student_id", studentsData?.map((s) => s.id) || [])

      const attendanceMap = new Map<string, Attendance>()
      attendanceData?.forEach((att) => {
        attendanceMap.set(att.student_id, att)
      })
      setAttendances(attendanceMap)
    } catch (error: any) {
      console.error("[v0] Error fetching students:", error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = (studentId: string, field: "total_hours" | "justified_hours", value: string) => {
    const numValue = Number.parseFloat(value) || 0
    const existing = attendances.get(studentId) || {
      student_id: studentId,
      academic_period_id: selectedPeriod,
      total_hours: 0,
      justified_hours: 0,
    }

    const updated = { ...existing, [field]: numValue }
    setAttendances(new Map(attendances.set(studentId, updated)))
  }

  const handleSave = async () => {
    if (!selectedPeriod) {
      toast.error("Sélectionnez une période")
      return
    }

    setSaving(true)
    try {
      const records = Array.from(attendances.values()).map((att) => ({
        student_id: att.student_id,
        academic_period_id: att.academic_period_id,
        total_hours: att.total_hours,
        justified_hours: att.justified_hours,
      }))

      const { error } = await supabase.from("student_attendances").upsert(records, {
        onConflict: "student_id,academic_period_id",
      })

      if (error) throw error

      toast.success(`${records.length} absences enregistrées avec succès`)
      fetchStudents()
    } catch (error: any) {
      console.error("[v0] Error saving attendances:", error)
      toast.error(error.message || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const filteredLevels = levels.filter((l) => l.section_id === selectedSection)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Absences</h1>
          <p className="text-muted-foreground">Saisissez les heures d'absence par niveau et période</p>
        </div>
        <Clock className="h-12 w-12 text-primary" />
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
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

          <div>
            <Label>Niveau</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!selectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
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

          <div>
            <Label>Période (Trimestre)</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {periods
                  .filter((p) => p.type === "trimester")
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Chargement des élèves...</p>
        </Card>
      ) : students.length > 0 ? (
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Liste des élèves ({students.length})</h3>
              <p className="text-sm text-muted-foreground">Saisissez les heures d'absence pour chaque élève</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">N°</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom & Prénom</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead className="text-center">Absences Totales (h)</TableHead>
                  <TableHead className="text-center">Absences Justifiées (h)</TableHead>
                  <TableHead className="text-center bg-red-50">Absences Non Justifiées (h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => {
                  const att = attendances.get(student.id) || {
                    student_id: student.id,
                    academic_period_id: selectedPeriod,
                    total_hours: 0,
                    justified_hours: 0,
                  }
                  const unjustified = att.total_hours - att.justified_hours

                  return (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                      <TableCell className="font-medium">
                        {student.last_name} {student.first_name}
                      </TableCell>
                      <TableCell>{student.class?.name}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={att.total_hours}
                          onChange={(e) => updateAttendance(student.id, "total_hours", e.target.value)}
                          className="w-20 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          max={att.total_hours}
                          value={att.justified_hours}
                          onChange={(e) => updateAttendance(student.id, "justified_hours", e.target.value)}
                          className="w-20 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`font-semibold ${
                            unjustified > 10 ? "text-red-600" : unjustified > 5 ? "text-orange-600" : "text-green-600"
                          }`}
                        >
                          {unjustified.toFixed(1)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        selectedLevel &&
        selectedPeriod && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Aucun élève trouvé pour ce niveau</p>
          </Card>
        )
      )}
    </div>
  )
}
