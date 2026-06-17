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
  classMin: number
  classMax: number
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

      const classId = student.class_id
      const levelId = student.class?.level_id
      const sectionId = student.class?.section_id

      // 1. FETCH ALL SUBJECTS (Level Core + Class Specialties)
      const [classSubjsRes, levelSubjsRes] = await Promise.all([
        supabase.from("class_subjects").select("subject_id, coefficient, teacher:teachers(first_name, last_name, gender), subject:subjects(id, name, code, subject_group:subject_groups(name))").eq("class_id", classId),
        levelId ? supabase.from("level_subjects").select("subject_id, coefficient, teacher:teachers(first_name, last_name, gender), subject:subjects(id, name, code, subject_group:subject_groups(name))").eq("level_id", levelId).eq("section_id", sectionId) : Promise.resolve({data: []})
      ])

      const subjectsMap = new Map<string, Subject>()
      
      const getTeacherName = (t: any, isEnglish: boolean) => {
        if (!t) return undefined
        const title = isEnglish 
          ? (t.gender === 'F' ? 'Mrs' : 'Mr') 
          : (t.gender === 'F' ? 'Mme' : 'M.')
        return `${title} ${t.last_name || ""}`.trim()
      }

      // Add level subjects first
      levelSubjsRes.data?.forEach((ls: any) => {
        if (ls.subject && ls.subject_id) {
          subjectsMap.set(ls.subject_id, {
            id: ls.subject_id,
            name: ls.subject.name,
            code: ls.subject.code,
            coefficient: ls.coefficient || 1,
            group_name: ls.subject.subject_group?.name || "Autres",
            teacher_name: getTeacherName(ls.teacher, isEnglish)
          })
        }
      })

      // Class subjects override
      classSubjsRes.data?.forEach((cs: any) => {
        if (cs.subject && cs.subject_id) {
          subjectsMap.set(cs.subject_id, {
            id: cs.subject_id,
            name: cs.subject.name,
            code: cs.subject.code,
            coefficient: cs.coefficient || 1,
            group_name: cs.subject.subject_group?.name || "Autres",
            teacher_name: getTeacherName(cs.teacher, isEnglish) || subjectsMap.get(cs.subject_id)?.teacher_name
          })
        }
      })

      const subjects = Array.from(subjectsMap.values()).sort((a, b) => a.group_name.localeCompare(b.group_name) || a.name.localeCompare(b.name))

      // 2. FETCH GRADES
      const grades: Record<string, { score: number; coefficient: number }> = {}
      let trimesterSummaries: any[] = []
      let promotion: any = undefined

      // Get all students in this class for ranking
      const classStudentIds = students.map(s => s.id)

      if (isAnnual) {
        const yearPeriods = periods.filter(p => p.academic_year === academicYear)
        const yearSeqs = yearPeriods.filter(p => p.type === "sequence")
        const yearTrims = yearPeriods.filter(p => p.type === "trimester").sort((a, b) => a.number - b.number)
        
        // Fetch ALL grades for ranking and display for ALL sequences of the year
        const { data: allClassGrades } = await supabase
          .from("grades")
          .select("student_id, subject_id, score, academic_period_id")
          .in("student_id", classStudentIds)
          .in("academic_period_id", yearSeqs.map(s => s.id))
        
        const myGrades = (allClassGrades || []).filter(g => g.student_id === studentId)

        subjects.forEach(s => {
          const sGrades = myGrades.filter(g => g.subject_id === s.id)
          const trimAvgs = yearTrims.map(trim => {
            // Trim 1: Seq 1,2 | Trim 2: Seq 3,4 | Trim 3: Seq 5,6
            const tSeqs = yearSeqs.filter(seq => 
              seq.parent_id === trim.id || 
              (trim.number === 1 && seq.number <= 2) || 
              (trim.number === 2 && seq.number >= 3 && seq.number <= 4) || 
              (trim.number === 3 && seq.number >= 5)
            )
            const tGrades = sGrades.filter(g => tSeqs.some(ts => ts.id === g.academic_period_id))
            if (tGrades.length === 0) return "NC"
            return Math.round((tGrades.reduce((sum, g) => sum + g.score, 0) / tGrades.length) * 100) / 100
          })
          const numericTrims = trimAvgs.filter(t => typeof t === 'number') as number[]
          const annualAvg = numericTrims.length > 0 ? Math.round((numericTrims.reduce((a, b) => a + b, 0) / numericTrims.length) * 100) / 100 : "NC"
          
          s.trimesters = trimAvgs
          s.annual = annualAvg
          if (typeof annualAvg === 'number') grades[s.id] = { score: annualAvg, coefficient: s.coefficient }

          // Calculate subject rank among CLASSMATES for the year
          const otherAvgs = students.filter(os => os.is_ranked !== false).map(os => {
            const osG = (allClassGrades || []).filter(g => g.student_id === os.id && g.subject_id === s.id)
            if (osG.length === 0) return null
            const osTrimAvgs = yearTrims.map(trim => {
              const tSeqs = yearSeqs.filter(seq => seq.parent_id === trim.id || (trim.number === 1 && seq.number <= 2) || (trim.number === 2 && seq.number >= 3 && seq.number <= 4) || (trim.number === 3 && seq.number >= 5))
              const tg = osG.filter(g => tSeqs.some(ts => ts.id === g.academic_period_id))
              return tg.length > 0 ? tg.reduce((sum, g) => sum + g.score, 0) / tg.length : null
            }).filter(v => v !== null) as number[]
            return osTrimAvgs.length > 0 ? osTrimAvgs.reduce((a, b) => a + b, 0) / osTrimAvgs.length : null
          }).filter(v => v !== null) as number[]
          
          if (typeof annualAvg === 'number' && otherAvgs.length > 0) {
            const sorted = otherAvgs.sort((a,b) => b-a)
            let r = 1
            for (const v of sorted) { if (v > annualAvg + 0.001) r++; }
            s.rank = `${r}/${sorted.length}`
          }
        })

        // Trimester overall summaries
        trimesterSummaries = yearTrims.map((trim, idx) => {
          const tSeqs = yearSeqs.filter(seq => seq.parent_id === trim.id || (trim.number === 1 && seq.number <= 2) || (trim.number === 2 && seq.number >= 3 && seq.number <= 4) || (trim.number === 3 && seq.number >= 5))
          
          const studentTrimAvgs = students.filter(os => os.is_ranked !== false).map(os => {
            const osG = (allClassGrades || []).filter(g => g.student_id === os.id && tSeqs.some(ts => ts.id === g.academic_period_id))
            let tw = 0, tc = 0
            subjects.forEach(subj => {
              const sg = osG.filter(g => g.subject_id === subj.id)
              if (sg.length > 0) { tw += (sg.reduce((sum, g) => sum + g.score, 0) / sg.length) * subj.coefficient; tc += subj.coefficient }
            })
            return tc > 0 ? tw / tc : null
          }).filter(v => v !== null) as number[]

          let myAvg: number | "NC" = "NC"
          let tw = 0, tc = 0
          subjects.forEach(s => { if (typeof s.trimesters?.[idx] === 'number') { tw += (s.trimesters[idx] as number) * s.coefficient; tc += s.coefficient } })
          if (tc > 0) myAvg = Math.round((tw / tc) * 100) / 100

          let r = "-"
          if (typeof myAvg === 'number' && studentTrimAvgs.length > 0) {
            const sorted = studentTrimAvgs.sort((a,b) => b-a)
            let rn = 1
            for (const v of sorted) { if (v > myAvg + 0.001) rn++; }
            r = `${rn}/${sorted.length}`
          }
          return { average: myAvg, rank: r }
        })

        const totalP = Object.values(grades).reduce((s, g) => s + g.score * g.coefficient, 0)
        const totalC = Object.values(grades).reduce((s, g) => s + g.coefficient, 0)
        const avg = totalC > 0 ? totalP / totalC : 0
        promotion = determinePromotion(avg, student.class?.name || "", student.class?.section?.name || "", student.is_ranked !== false, student.class?.min_promotion_average || 10, student.class?.min_rattrapage_average || 8, student.class?.min_honor_roll_average || 12, student.class?.next_class?.name || null)
      } else {
        const { data: gData } = await supabase.from("grades").select("*").eq("student_id", studentId).eq("academic_period_id", selectedPeriod)
        if (gData) gData.forEach(g => {
          const s = subjects.find(x => x.id === g.subject_id)
          if (s) grades[g.subject_id] = { score: g.score, coefficient: s.coefficient }
        })
      }

      // Group Averages
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

      // Overall Class Average, Rank, Min, Max (SCOPED TO CURRENT CLASS)
      let classAverage = 0, classMin = 0, classMax = 0
      let rank: number | string = "-"
      
      const { data: allStudentsGrades } = await supabase
        .from("grades")
        .select("student_id, score, coefficient")
        .in("student_id", classStudentIds)
        .in("academic_period_id", isAnnual ? periods.filter(p => p.academic_year === academicYear && p.type === "sequence").map(p => p.id) : [selectedPeriod])
      
      const studAvgsMap = new Map<string, {tw: number, tc: number}>()
      allStudentsGrades?.forEach(g => {
        const cur = studAvgsMap.get(g.student_id) || {tw: 0, tc: 0}
        studAvgsMap.set(g.student_id, {tw: cur.tw + g.score * g.coefficient, tc: cur.tc + g.coefficient})
      })
      
      const finalAvgs = Array.from(studAvgsMap.values()).map(v => v.tw / v.tc).sort((a,b) => b-a)
      if (finalAvgs.length > 0) {
        classAverage = Math.round((finalAvgs.reduce((s, a) => s + a, 0) / finalAvgs.length) * 100) / 100
        classMin = Math.min(...finalAvgs)
        classMax = Math.max(...finalAvgs)
        if (student.is_ranked !== false) {
          let r = 1
          for (const a of finalAvgs) { if (a > average + 0.001) r++; }
          rank = r
        }
      }

      return {
        student, period, subjects, grades, groupAverages, average, rank, classSize: students.length, classAverage,
        classMin, classMax,
        isUnranked: student.is_ranked === false, section: student.class?.section?.name, promotion, trimesterSummaries
      }
    } catch (e) { console.error(e); return null }
  }, [supabase, selectedPeriod, periods, students])

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
          trimesters: s.trimesters, annual: s.annual, group: s.group_name, rank: s.rank 
        })),
        average: bulletinData.average, rank: bulletinData.rank, 
        classSize: bulletinData.classSize, classAverage: bulletinData.classAverage, 
        classMin: bulletinData.classMin, classMax: bulletinData.classMax,
        promotion: bulletinData.promotion,
        trimesterSummaries: bulletinData.trimesterSummaries,
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
            subjects: d.subjects.map(s => ({ name: s.name, teacher: s.teacher_name, coefficient: s.coefficient, average: typeof s.annual === 'number' ? s.annual : d.grades[s.id]?.score, trimesters: s.trimesters, annual: s.annual, group: s.group_name, rank: s.rank })),
            average: d.average, rank: d.rank, classSize: d.classSize, classAverage: d.classAverage, promotion: d.promotion,
            trimesterSummaries: d.trimesterSummaries,
            classMin: d.classMin, classMax: d.classMax,
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
              <DialogTitle>Aperçu du Bulletin de {bulletinData?.student?.first_name} {bulletinData?.student?.last_name}</DialogTitle>
              <DialogDescription>Aperçu du document officiel conforme au modèle camerounais.</DialogDescription>
            </DialogHeader>
            {bulletinData && <BulletinDocument bulletinData={bulletinData as any} schoolSettings={schoolSettings} />}
            <div className="flex justify-end mt-4 gap-2"><Button variant="outline" onClick={() => setShowBulletin(false)}>Fermer</Button><Button onClick={handleDownload} disabled={downloading}>{downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Télécharger PDF</Button></div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
