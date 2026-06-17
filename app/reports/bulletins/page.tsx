"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Search, Eye, Loader2, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { determinePromotion } from "@/lib/calculations"
import { generateBulletinPDF, generateMassBulletinsPDF, type BulletinData } from "@/lib/services/bulletin-pdf-generator"

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth: string | null
  gender: string
  class_id: string
  class?: { 
    id: string; 
    name: string; 
    level?: { name: string }; 
    section?: { name: string };
    min_promotion_average?: number;
    min_rattrapage_average?: number;
    next_class?: { name: string };
  }
  is_ranked?: boolean
  photo?: string | null
}

type ClassType = { id: string; name: string; level_id: string }
type AcademicPeriod = { id: string; name: string; type: string; academic_year: string; number: number; parent_id?: string }

type Subject = {
  id: string
  name: string
  code: string
  coefficient: number
  group_name: string
  teacher_name?: string
}

type LocalBulletinData = {
  student: any
  period: AcademicPeriod
  subjects: Array<Subject & { trimesters?: (number | "NC")[]; annual?: number | "NC"; rank?: string }>
  grades: Record<string, { score: number; coefficient: number }>
  subjectRanks?: Record<string, { rank: number; classSize: number }>
  sequenceGrades?: {
    seq1: Record<string, number>
    seq2: Record<string, number>
  }
  groupAverages: Record<string, number>
  average: number
  rank: number | string
  classSize: number
  classAverage: number
  isUnranked?: boolean
  attendance?: any
  section?: string
  seq1Average?: number
  seq2Average?: number
  generalObservation?: string
  promotion?: {
    promoted: boolean
    nextClass: string | null
    decision: string
  }
}

function getGradeColor(score: number | undefined): string {
  if (score === undefined) return "text-muted-foreground"
  if (score < 10) return "text-red-600"
  if (score < 12) return "text-amber-600"
  if (score < 15) return "text-blue-600"
  return "text-green-600"
}

function getAppreciation(score: number, isEnglish: boolean): string {
  if (isEnglish) {
    if (score >= 18) return "Excellent"
    if (score >= 16) return "Very Good"
    if (score >= 14) return "Good"
    if (score >= 12) return "Fairly Good"
    if (score >= 10) return "Average"
    if (score >= 8) return "Below Average"
    return "Poor"
  }
  if (score >= 18) return "Excellent"
  if (score >= 16) return "Très Bien"
  if (score >= 14) return "Bien"
  if (score >= 12) return "Assez Bien"
  if (score >= 10) return "Passable"
  if (score >= 8) return "Insuffisant"
  return "Très Insuffisant"
}

function getSubjectAppreciation(score: number, isEnglish: boolean): string {
  if (isEnglish) {
    if (score >= 18) return "Excellent work, keep it up!"
    if (score >= 16) return "Very good performance"
    if (score >= 14) return "Good effort, continue"
    if (score >= 12) return "Satisfactory, can improve"
    if (score >= 10) return "Average, more effort needed"
    if (score >= 8) return "Needs improvement"
    if (score >= 5) return "Serious difficulties"
    return "Critical, urgent remediation needed"
  }
  if (score >= 18) return "Excellent travail, continue ainsi!"
  if (score >= 16) return "Très bonne performance"
  if (score >= 14) return "Bon travail, continue"
  if (score >= 12) return "Satisfaisant, peut mieux faire"
  if (score >= 10) return "Passable, plus d'efforts requis"
  if (score >= 8) return "Insuffisant, à améliorer"
  if (score >= 5) return "Difficultés sérieuses"
  return "Critique, remédiation urgente"
}

function generateGeneralObservation(
  subjects: Array<Subject & { trimesters?: (number | "NC")[]; annual?: number | "NC" }>,
  grades: Record<string, { score: number; coefficient: number }>,
  average: number,
  attendance: any,
  isEnglish: boolean,
): string {
  const strongSubjects: string[] = []
  const weakSubjects: string[] = []

  subjects.forEach((subject) => {
    const grade = grades[subject.id]
    if (grade) {
      if (grade.score >= 14) strongSubjects.push(subject.name)
      else if (grade.score < 10) weakSubjects.push(subject.name)
    }
  })

  let observation = ""
  if (isEnglish) {
    if (average >= 16) observation = "Excellent results! Congratulations."
    else if (average >= 14) observation = "Very good results. Keep up the good work."
    else if (average >= 12) observation = "Good results. Continue your efforts."
    else if (average >= 10) observation = "Acceptable results but can do better."
    else observation = "Insufficient results. Urgent improvement needed."
  } else {
    if (average >= 16) observation = "Excellents résultats ! Félicitations."
    else if (average >= 14) observation = "Très bons résultats. Continuez ainsi."
    else if (average >= 12) observation = "Bons résultats. Poursuivez vos efforts."
    else if (average >= 10) observation = "Résultats passables, peut mieux faire."
    else observation = "Résultats insuffisants. Amélioration urgente requise."
  }
  return observation
}

export default function BulletinsPage() {
  const [classes, setClasses] = useState<ClassType[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [massGenerating, setMassGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showBulletin, setShowBulletin] = useState(false)
  const [bulletinData, setBulletinData] = useState<LocalBulletinData | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)
  const [teachersMap, setTeachersMap] = useState<Record<string, string>>({})

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: classData } = await supabase.from("classes").select("*").order("name")
      const { data: periodData } = await supabase.from("academic_periods").select("*").order("academic_year", { ascending: false }).order("number")
      const { data: settingsData } = await supabase.from("school_settings").select("*").maybeSingle()

      setClasses(classData || [])
      setPeriods((periodData || []) as AcademicPeriod[])
      setSchoolSettings(settingsData)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    async function fetchStudentsAndTeachers() {
      const { data: studentData } = await supabase.from("students").select("*").eq("class_id", selectedClass).ilike("status", "active").order("last_name")
      setStudents(studentData || [])

      const { data: classSubjs } = await supabase.from("class_subjects").select("subject_id, teacher:teachers(first_name, last_name)").eq("class_id", selectedClass)
      const tMap: Record<string, string> = {}
      if (classSubjs) {
        classSubjs.forEach((cs: any) => {
          if (cs.subject_id && cs.teacher) {
            tMap[cs.subject_id] = `${cs.teacher.first_name || ""} ${cs.teacher.last_name || ""}`.trim()
          }
        })
      }
      setTeachersMap(tMap)
    }
    fetchStudentsAndTeachers()
  }, [selectedClass])

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name} ${s.matricule}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const generateBulletinDataForStudent = useCallback(async (studentId: string, allClassGrades?: any[]): Promise<LocalBulletinData | null> => {
    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*, class:classes(*, level:levels(*), section:sections(*), next_class:classes!next_class_id(name))")
        .eq("id", studentId)
        .single()

      if (studentError || !student) throw new Error("Élève non trouvé")

      const isEnglish = student.class?.section?.name?.toLowerCase().includes("anglophone")
      let period = periods.find(p => p.id === selectedPeriod)
      let isAnnualPeriod = false
      let academicYear = ""

      if (!period && selectedPeriod.startsWith("annual_")) {
        academicYear = selectedPeriod.split("_")[1]
        isAnnualPeriod = true
        period = { id: selectedPeriod, name: isEnglish ? "Full Year" : "Année Complète", type: "year", academic_year: academicYear, number: 0 } as any
      }
      if (!period) throw new Error("Période non trouvée")

      const classId = student.class_id
      const { data: classSubjs } = await supabase.from("class_subjects").select("subject_id, coefficient, subject:subjects(id, name, code, subject_group:subject_groups(name))").eq("class_id", classId)
      
      const subjects: Subject[] = (classSubjs || []).map((cs: any) => ({
        id: cs.subject_id,
        name: cs.subject?.name || "",
        code: cs.subject?.code || "",
        coefficient: cs.coefficient || 1,
        group_name: cs.subject?.subject_group?.name || "Autres",
        teacher_name: teachersMap[cs.subject_id]
      }))

      let annualSubjectsData: any[] = []
      let promotionDecision: any = undefined
      const grades: Record<string, { score: number; coefficient: number }> = {}

      if (isAnnualPeriod) {
        const { data: allYearPeriods } = await supabase.from("academic_periods").select("*").eq("academic_year", academicYear).order("number")
        const yearSeqs = (allYearPeriods || []).filter(p => p.type === "sequence")
        const yearTrims = (allYearPeriods || []).filter(p => p.type === "trimester")
        const { data: yearGrades } = await supabase.from("grades").select("*").eq("student_id", studentId).in("academic_period_id", (allYearPeriods || []).map(p => p.id))

        annualSubjectsData = subjects.map(subj => {
          const subjGrades = (yearGrades || []).filter(g => g.subject_id === subj.id)
          const trimAverages = yearTrims.map(trim => {
            const trimSeqs = yearSeqs.filter(s => s.parent_id === trim.id)
            const trimGrades = subjGrades.filter(g => trimSeqs.some(s => s.id === g.academic_period_id))
            if (trimGrades.length === 0) return "NC"
            return Math.round((trimGrades.reduce((sum, g) => sum + g.score, 0) / trimGrades.length) * 100) / 100
          })

          const numericTrims = trimAverages.filter(t => typeof t === 'number') as number[]
          const annualAvg = numericTrims.length > 0 ? Math.round((numericTrims.reduce((a, b) => a + b, 0) / numericTrims.length) * 100) / 100 : "NC"

          if (typeof annualAvg === 'number') grades[subj.id] = { score: annualAvg, coefficient: subj.coefficient }
          return { ...subj, trimesters: trimAverages, annual: annualAvg }
        })

        const totalPoints = Object.values(grades).reduce((sum, g) => sum + g.score * g.coefficient, 0)
        const totalCoef = Object.values(grades).reduce((sum, g) => sum + g.coefficient, 0)
        const avg = totalCoef > 0 ? totalPoints / totalCoef : 0

        promotionDecision = determinePromotion(
          avg, student.class?.name || "", student.class?.section?.name || "", student.is_ranked !== false,
          student.class?.min_promotion_average || 10, student.class?.min_rattrapage_average || 8, student.class?.next_class?.name || null
        )
      } else {
        const { data: gData } = await supabase.from("grades").select("*").eq("student_id", studentId).eq("academic_period_id", selectedPeriod)
        if (gData) gData.forEach(g => {
          const s = subjects.find(x => x.id === g.subject_id)
          if (s) grades[g.subject_id] = { score: g.score, coefficient: s.coefficient }
        })
      }

      const totalP = Object.values(grades).reduce((sum, g) => sum + g.score * g.coefficient, 0)
      const totalC = Object.values(grades).reduce((sum, g) => sum + g.coefficient, 0)
      const average = totalC > 0 ? Math.round((totalP / totalC) * 100) / 100 : 0

      return {
        student, period, subjects: isAnnualPeriod ? annualSubjectsData : subjects, grades,
        average, rank: "-", classSize: students.length, classAverage: 0,
        isUnranked: student.is_ranked === false, section: student.class?.section?.name,
        promotion: promotionDecision,
        groupAverages: {}
      }
    } catch (e) { console.error(e); return null }
  }, [supabase, selectedPeriod, periods, teachersMap, students.length])

  const generateBulletin = async (studentId: string) => {
    setGenerating(true); setSelectedStudent(studentId)
    const data = await generateBulletinDataForStudent(studentId)
    if (data) { setBulletinData(data); setShowBulletin(true) }
    setGenerating(false)
  }

  const handleDownloadPDF = async () => {
    if (!bulletinData) return
    setDownloading(true)
    const isAnnual = bulletinData.period.type === "year"
    const pdfData: BulletinData = {
      student: { firstName: bulletinData.student.first_name, lastName: bulletinData.student.last_name, matricule: bulletinData.student.matricule, isRanked: !bulletinData.isUnranked },
      className: bulletinData.student.class?.name || "", periodName: bulletinData.period.name, periodType: bulletinData.period.type as any,
      academicYear: bulletinData.period.academic_year, section: bulletinData.section || "",
      subjects: bulletinData.subjects.map(s => ({ name: s.name, teacher: s.teacher_name, coefficient: s.coefficient, average: typeof s.annual === 'number' ? s.annual : bulletinData.grades[s.id]?.score, trimesters: s.trimesters, annual: s.annual, group: s.group_name })),
      average: bulletinData.average, rank: bulletinData.rank, classSize: bulletinData.classSize, classAverage: bulletinData.classAverage, promotion: bulletinData.promotion,
      schoolSettings: { school_name: schoolSettings?.school_name, school_slogan: schoolSettings?.school_slogan, address: schoolSettings?.address, phone: schoolSettings?.phone, logo_url: schoolSettings?.logo_url }
    }
    await generateBulletinPDF(pdfData)
    setDownloading(false)
  }

  const isAnnualPeriod = selectedPeriod.startsWith("annual_")

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Bulletins de Notes</h1>
        <Card><CardContent className="pt-6 grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label>Classe</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Période</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une période" /></SelectTrigger>
              <SelectContent>
                {Array.from(new Set(periods.map(p => p.academic_year))).map(y => <SelectItem key={`annual_${y}`} value={`annual_${y}`}>Année Complète ({y})</SelectItem>)}
                {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Recherche</Label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardContent></Card>

        <div className="space-y-2">
          {filteredStudents.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div><p className="font-medium">{s.last_name} {s.first_name}</p><p className="text-sm text-muted-foreground">{s.matricule}</p></div>
              <Button variant="outline" size="sm" onClick={() => generateBulletin(s.id)} disabled={generating || !selectedPeriod}>
                {generating && selectedStudent === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />} Voir
              </Button>
            </div>
          ))}
        </div>

        <Dialog open={showBulletin} onOpenChange={setShowBulletin}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {bulletinData && <BulletinDocument bulletinData={bulletinData as any} schoolSettings={schoolSettings} />}
            <div className="flex justify-end mt-4"><Button onClick={handleDownloadPDF} disabled={downloading}>{downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Télécharger PDF</Button></div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
