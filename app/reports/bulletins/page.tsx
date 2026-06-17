"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Search, Eye, Loader2, Users, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { determinePromotion } from "@/lib/calculations"
import { generateBulletinPDF, generateMassBulletinsPDF, type BulletinData } from "@/lib/services/bulletin-pdf-generator"
import { BulletinDocument } from "@/components/reports/bulletin-document"

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  gender: string
  class_id: string
  status: string
  is_ranked?: boolean
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
  trimesters?: (number | "NC")[]
  annual?: number | "NC"
  rank?: string
}

type LocalBulletinData = {
  student: any
  period: AcademicPeriod
  subjects: Subject[]
  grades: Record<string, { score: number; coefficient: number }>
  groupAverages: Record<string, number>
  average: number
  rank: number | string
  classSize: number
  classAverage: number
  isUnranked: boolean
  section?: string
  promotion?: { promoted: boolean; nextClass: string | null; decision: string }
  trimesterSummaries?: Array<{ average: number | "NC"; rank: number | string }>
}

function getGradeColor(score: number | undefined | null): string {
  if (score === undefined || score === null) return "text-muted-foreground"
  if (score < 10) return "text-red-600 font-bold"
  if (score < 12) return "text-amber-600"
  if (score < 15) return "text-blue-600"
  return "text-green-600"
}

export default function BulletinsPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [showBulletin, setShowBulletin] = useState(false)
  const [bulletinData, setBulletinData] = useState<LocalBulletinData | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  
  const [generating, setGenerating] = useState(false)
  const [massGenerating, setMassGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [cRes, pRes, sRes] = await Promise.all([
        supabase.from("classes").select("id, name, level_id").order("name"),
        supabase.from("academic_periods").select("*").order("academic_year", { ascending: false }).order("number"),
        supabase.from("school_settings").select("*").maybeSingle()
      ])
      setClasses(cRes.data || [])
      setPeriods((pRes.data || []) as AcademicPeriod[])
      setSchoolSettings(sRes.data)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedClass) { setStudents([]); return }
    async function loadStudents() {
      const { data } = await supabase.from("students").select("id, matricule, first_name, last_name, gender, class_id, status, is_ranked").eq("class_id", selectedClass).ilike("status", "active").order("last_name")
      setStudents(data || [])
    }
    loadStudents()
  }, [selectedClass])

  const generateData = useCallback(async (studentId: string): Promise<LocalBulletinData | null> => {
    try {
      // 1. Fetch Student with full class info
      const { data: student } = await supabase.from("students").select("*, class:classes(*, level:levels(*), section:sections(*), next_class:classes!next_class_id(name))").eq("id", studentId).single()
      if (!student) return null

      const isEnglish = student.class?.section?.name?.toLowerCase().includes("anglophone")
      const isAnnual = selectedPeriod.startsWith("annual_")
      const academicYear = isAnnual ? selectedPeriod.split("_")[1] : ""
      
      let period: AcademicPeriod
      if (isAnnual) {
        period = { id: selectedPeriod, name: isEnglish ? "Full Year" : "Année Complète", type: "year", academic_year: academicYear, number: 0 } as any
      } else {
        period = periods.find(p => p.id === selectedPeriod)!
      }

      // 2. Fetch ALL Subjects for the class/level
      const { data: classSubjs } = await supabase.from("class_subjects").select("subject_id, coefficient, teacher:teachers(first_name, last_name), subject:subjects(id, name, code, subject_group:subject_groups(name))").eq("class_id", student.class_id)
      
      const subjects: Subject[] = (classSubjs || []).map((cs: any) => ({
        id: cs.subject_id,
        name: cs.subject?.name || "Sans nom",
        code: cs.subject?.code || "",
        coefficient: cs.coefficient || 1,
        group_name: cs.subject?.subject_group?.name || "Autres",
        teacher_name: cs.teacher ? `${cs.teacher.first_name || ""} ${cs.teacher.last_name || ""}`.trim() : undefined
      }))

      // 3. Fetch Grades
      const grades: Record<string, { score: number; coefficient: number }> = {}
      let trimesterSummaries: any[] = []
      let promotion: any = undefined

      if (isAnnual) {
        const yearPeriods = periods.filter(p => p.academic_year === academicYear)
        const yearSeqs = yearPeriods.filter(p => p.type === "sequence")
        const yearTrims = yearPeriods.filter(p => p.type === "trimester")
        const { data: yearGrades } = await supabase.from("grades").select("*").eq("student_id", studentId).in("academic_period_id", yearSeqs.map(s => s.id))

        subjects.forEach(s => {
          const sGrades = (yearGrades || []).filter(g => g.subject_id === s.id)
          const trimAvgs = yearTrims.map(trim => {
            const tSeqs = yearSeqs.filter(seq => seq.parent_id === trim.id || (trim.number === 1 && seq.number <= 2) || (trim.number === 2 && seq.number >= 3 && seq.number <= 4) || (trim.number === 3 && seq.number >= 5))
            const tGrades = sGrades.filter(g => tSeqs.some(ts => ts.id === g.academic_period_id))
            if (tGrades.length === 0) return "NC"
            return Math.round((tGrades.reduce((sum, g) => sum + g.score, 0) / tGrades.length) * 100) / 100
          })
          const numericTrims = trimAvgs.filter(t => typeof t === 'number') as number[]
          const annualAvg = numericTrims.length > 0 ? Math.round((numericTrims.reduce((a, b) => a + b, 0) / numericTrims.length) * 100) / 100 : "NC"
          s.trimesters = trimAvgs
          s.annual = annualAvg
          if (typeof annualAvg === 'number') grades[s.id] = { score: annualAvg, coefficient: s.coefficient }
        })

        // Trimester overall averages
        trimesterSummaries = yearTrims.map((trim, idx) => {
          let tw = 0, tc = 0
          subjects.forEach(s => {
            const tVal = s.trimesters?.[idx]
            if (typeof tVal === 'number') { tw += tVal * s.coefficient; tc += s.coefficient }
          })
          return { average: tc > 0 ? Math.round((tw / tc) * 100) / 100 : "NC", rank: "-" }
        })

        const totalP = Object.values(grades).reduce((s, g) => s + g.score * g.coefficient, 0)
        const totalC = Object.values(grades).reduce((s, g) => s + g.coefficient, 0)
        const avg = totalC > 0 ? totalP / totalC : 0
        promotion = determinePromotion(avg, student.class?.name || "", student.class?.section?.name || "", student.is_ranked !== false, student.class?.min_promotion_average || 10, student.class?.min_rattrapage_average || 8, student.class?.next_class?.name || null)
      } else {
        const { data: gData } = await supabase.from("grades").select("*").eq("student_id", studentId).eq("academic_period_id", selectedPeriod)
        if (gData) gData.forEach(g => {
          const s = subjects.find(x => x.id === g.subject_id)
          if (s) grades[g.subject_id] = { score: g.score, coefficient: s.coefficient }
        })
      }

      // 4. Group Averages
      const groupAverages: Record<string, number> = {}
      const groups = [...new Set(subjects.map(s => s.group_name))]
      groups.forEach(gn => {
        const gSubjs = subjects.filter(s => s.group_name === gn)
        let tw = 0, tc = 0
        gSubjs.forEach(s => { const g = grades[s.id]; if (g) { tw += g.score * g.coefficient; tc += g.coefficient } })
        if (tc > 0) groupAverages[gn] = Math.round((tw / tc) * 100) / 100
      })

      const totalP = Object.values(grades).reduce((s, g) => s + g.score * g.coefficient, 0)
      const totalC = Object.values(grades).reduce((s, g) => s + g.coefficient, 0)
      const average = totalC > 0 ? Math.round((totalP / totalC) * 100) / 100 : 0

      return {
        student, period, subjects, grades, groupAverages, average, rank: "-", classSize: students.length, classAverage: 0,
        isUnranked: student.is_ranked === false, section: student.class?.section?.name, promotion, trimesterSummaries
      }
    } catch (e) { console.error(e); return null }
  }, [supabase, selectedPeriod, periods, students.length])

  const viewBulletin = async (sid: string) => {
    setSelectedStudentId(sid); setGenerating(true)
    const data = await generateData(sid)
    if (data) { setBulletinData(data); setShowBulletin(true) }
    setGenerating(false)
  }

  const handleDownload = async () => {
    if (!bulletinData) return
    setDownloading(true)
    try {
      const pdfData: BulletinData = {
        student: { firstName: bulletinData.student.first_name, lastName: bulletinData.student.last_name, matricule: bulletinData.student.matricule, isRanked: !bulletinData.isUnranked },
        className: bulletinData.student.class?.name || "", periodName: bulletinData.period.name, periodType: bulletinData.period.type as any,
        academicYear: bulletinData.period.academic_year, section: bulletinData.section || "",
        subjects: bulletinData.subjects.map(s => ({ 
          name: s.name, teacher: s.teacher_name, coefficient: s.coefficient, 
          average: typeof s.annual === 'number' ? s.annual : bulletinData.grades[s.id]?.score, 
          trimesters: s.trimesters, annual: s.annual, group: s.group_name 
        })),
        average: bulletinData.average, rank: bulletinData.rank, classSize: bulletinData.classSize, classAverage: bulletinData.classAverage, promotion: bulletinData.promotion,
        schoolSettings: { school_name: schoolSettings?.school_name, school_slogan: schoolSettings?.school_slogan, address: schoolSettings?.address, phone: schoolSettings?.phone, logo_url: schoolSettings?.logo_url }
      }
      await generateBulletinPDF(pdfData)
    } catch (e) { console.error(e) }
    setDownloading(false)
  }

  const handleMassGen = async () => {
    if (!selectedClass || !selectedPeriod || students.length === 0) return
    setMassGenerating(true)
    try {
      const all: BulletinData[] = []
      for (const s of students) {
        const d = await generateData(s.id)
        if (d) {
          all.push({
            student: { firstName: d.student.first_name, lastName: d.student.last_name, matricule: d.student.matricule, isRanked: !d.isUnranked },
            className: d.student.class?.name || "", periodName: d.period.name, periodType: d.period.type as any,
            academicYear: d.period.academic_year, section: d.section || "",
            subjects: d.subjects.map(s => ({ name: s.name, teacher: s.teacher_name, coefficient: s.coefficient, average: typeof s.annual === 'number' ? s.annual : d.grades[s.id]?.score, trimesters: s.trimesters, annual: s.annual, group: s.group_name })),
            average: d.average, rank: d.rank, classSize: d.classSize, classAverage: d.classAverage, promotion: d.promotion,
            schoolSettings: { school_name: schoolSettings?.school_name, school_slogan: schoolSettings?.school_slogan, address: schoolSettings?.address, phone: schoolSettings?.phone, logo_url: schoolSettings?.logo_url }
          })
        }
      }
      const cName = classes.find(c => c.id === selectedClass)?.name || "Classe"
      await generateMassBulletinsPDF(all, `Bulletins_${cName}`)
      toast.success(`${all.length} bulletins générés`)
    } catch (e) { console.error(e) }
    setMassGenerating(false)
  }

  const filtered = students.filter(s => `${s.first_name} ${s.last_name} ${s.matricule}`.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="w-8 h-8" /> Bulletins de Notes</h1>
        
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
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Nom ou matricule..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" /></div>
          </div>
        </CardContent></Card>

        {selectedClass && selectedPeriod && (
          <div className="flex justify-end"><Button onClick={handleMassGen} disabled={massGenerating || students.length === 0}>{massGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />} Générer Tous ({students.length})</Button></div>
        )}

        <div className="grid gap-2">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all bg-card">
              <div><p className="font-bold">{s.last_name} {s.first_name}</p><p className="text-sm text-muted-foreground">{s.matricule}</p></div>
              <Button variant="outline" size="sm" onClick={() => viewBulletin(s.id)} disabled={generating || !selectedPeriod}>{generating && selectedStudentId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />} Voir</Button>
            </div>
          ))}
        </div>

        <Dialog open={showBulletin} onOpenChange={setShowBulletin}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aperçu du Bulletin de {bulletinData?.student?.first_name}</DialogTitle>
              <DialogDescription>Aperçu du document officiel avant téléchargement.</DialogDescription>
            </DialogHeader>
            {bulletinData && <BulletinDocument bulletinData={bulletinData as any} schoolSettings={schoolSettings} />}
            <div className="flex justify-end mt-4 gap-2"><Button variant="outline" onClick={() => setShowBulletin(false)}>Fermer</Button><Button onClick={handleDownload} disabled={downloading}>{downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Télécharger PDF</Button></div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
