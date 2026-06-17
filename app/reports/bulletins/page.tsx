"use client"

import { useState, useEffect, useCallback } from "react"
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
  class?: { name: string; level?: { name: string }; section?: { name: string } }
  is_ranked?: boolean
  photo?: string | null
}

type ClassType = { id: string; name: string; level_id: string }
type AcademicPeriod = { id: string; name: string; type: string; academic_year: string; number: number }

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
  const averageSubjects: string[] = []
  const weakSubjects: string[] = []
  const criticalSubjects: string[] = []

  subjects.forEach((subject) => {
    const grade = grades[subject.id]
    if (grade) {
      if (grade.score >= 14) strongSubjects.push(subject.name)
      else if (grade.score >= 10) averageSubjects.push(subject.name)
      else if (grade.score >= 7) weakSubjects.push(subject.name)
      else criticalSubjects.push(subject.name)
    }
  })

  let observation = ""

  if (isEnglish) {
    // Congratulations based on average
    if (average >= 16) {
      observation = "Excellent results! Congratulations for this outstanding performance. "
    } else if (average >= 14) {
      observation = "Very good results. Keep up this excellent work. "
    } else if (average >= 12) {
      observation = "Good results overall. Continue your efforts. "
    } else if (average >= 10) {
      observation = "Acceptable results but can do better. "
    } else {
      observation = "Insufficient results. Urgent improvement needed. "
    }

    // Strong points
    if (strongSubjects.length > 0) {
      observation += `Strong points in: ${strongSubjects.slice(0, 3).join(", ")}${strongSubjects.length > 3 ? "..." : ""}. `
    }

    // Subjects to improve
    if (weakSubjects.length > 0) {
      observation += `Must improve in: ${weakSubjects.join(", ")}. `
    }

    // Critical subjects
    if (criticalSubjects.length > 0) {
      observation += `Critical attention needed in: ${criticalSubjects.join(", ")}. `
    }

    // Attendance comment
    if (attendance) {
      const total = attendance.total_hours || 0
      const unjustified = total - (attendance.justified_hours || 0)
      if (total === 0) {
        observation += "Perfect attendance."
      } else if (unjustified > 10) {
        observation += `Excessive absences (${unjustified}h unjustified). This affects academic performance.`
      } else if (total > 5) {
        observation += `Absences noted (${total}h). Please be more regular.`
      }
    }
  } else {
    // Félicitations basées sur la moyenne
    if (average >= 16) {
      observation = "Excellents résultats! Félicitations pour cette performance remarquable. "
    } else if (average >= 14) {
      observation = "Très bons résultats. Continue ce travail exemplaire. "
    } else if (average >= 12) {
      observation = "Bons résultats dans l'ensemble. Poursuis tes efforts. "
    } else if (average >= 10) {
      observation = "Résultats acceptables mais peut mieux faire. "
    } else {
      observation = "Résultats insuffisants. Amélioration urgente requise. "
    }

    // Points forts
    if (strongSubjects.length > 0) {
      observation += `Points forts en: ${strongSubjects.slice(0, 3).join(", ")}${strongSubjects.length > 3 ? "..." : ""}. `
    }

    // Matières à améliorer
    if (weakSubjects.length > 0) {
      observation += `Doit s'améliorer en: ${weakSubjects.join(", ")}. `
    }

    // Matières critiques
    if (criticalSubjects.length > 0) {
      observation += `Attention critique requise en: ${criticalSubjects.join(", ")}. `
    }

    // Commentaire sur les absences
    if (attendance) {
      const total = attendance.total_hours || 0
      const unjustified = total - (attendance.justified_hours || 0)
      if (total === 0) {
        observation += "Assiduité parfaite."
      } else if (unjustified > 10) {
        observation += `Absences excessives (${unjustified}h non justifiées). Cela affecte les performances scolaires.`
      } else if (total > 5) {
        observation += `Absences constatées (${total}h). Veuillez être plus régulier.`
      }
    }
  }

  return observation
}

export default function BulletinsPage() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showBulletin, setShowBulletin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [massGenerating, setMassGenerating] = useState(false)

  const [classes, setClasses] = useState<ClassType[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [bulletinData, setBulletinData] = useState<LocalBulletinData | null>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)
  const [teachersMap, setTeachersMap] = useState<Record<string, string>>({})

  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true)
      try {
        const [classesRes, periodsRes, settingsRes] = await Promise.all([
          supabase.from("classes").select("id, name, level_id").order("name"),
          supabase.from("academic_periods").select("*").order("number"),
          supabase.from("school_settings").select("*").limit(1),
        ])

        setClasses(classesRes.data || [])
        setPeriods(periodsRes.data || [])
        setSchoolSettings(
          settingsRes.data?.[0] || {
            school_name: "COLLEGE POLYVALENT LES SAVANTS DE ANGE MADO",
            current_academic_year: "2024-2025",
          },
        )
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // Fetch students and teachers when class changes
  useEffect(() => {
    async function fetchStudentsAndTeachers() {
      if (!selectedClass) {
        setStudents([])
        setTeachersMap({})
        return
      }

      const { data: studentsData } = await supabase
        .from("students")
        .select(
          "id, matricule, first_name, last_name, date_of_birth, place_of_birth, gender, class_id, is_ranked, class:classes(name, level:levels(id, name), section:sections(id, name)), photo",
        )
        .eq("class_id", selectedClass)
        .ilike("status", "active")
        .order("last_name")

      setStudents(studentsData || [])

      const { data: classSubjectsWithTeachers } = await supabase
        .from("class_subjects")
        .select("subject_id, teacher:teachers(first_name, last_name)")
        .eq("class_id", selectedClass)

      const tMap: Record<string, string> = {}
      if (classSubjectsWithTeachers) {
        for (const cs of classSubjectsWithTeachers) {
          if (cs.subject_id) {
            const t = cs.teacher as any
            tMap[cs.subject_id] = `${t.first_name || ""} ${t.last_name || ""}`.trim()
          }
        }
      }
      setTeachersMap(tMap)
    }
    fetchStudentsAndTeachers()
  }, [selectedClass])

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Generate bulletin data for a student - MAIN FUNCTION
  const generateBulletinDataForStudent = useCallback(
    async (studentId: string, allClassGrades?: any[]): Promise<LocalBulletinData | null> => {
      try {
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select(`
            *, 
            class:classes(
              *, 
              level:levels(*), 
              section:sections(*),
              next_class:classes!next_class_id(name)
            )
          `)
          .eq("id", studentId)
          .single()

        if (studentError || !student) throw new Error("Élève non trouvé")

        // Determine language first
        const isEnglish = student.class?.section?.name?.toLowerCase().includes("anglophone") || false

        // Handle annual period pseudo-IDs
        let period = periods.find((p) => p.id === selectedPeriod)
        let isAnnualPeriod = false
        let academicYear = ""

        if (!period && selectedPeriod.startsWith("annual_")) {
          // Create synthetic period for annual view
          academicYear = selectedPeriod.split("_")[1]
          isAnnualPeriod = true
          period = {
            id: selectedPeriod,
            name: isEnglish ? "Full Year" : "Année Complète",
            type: "year",
            academic_year: academicYear,
            number: 0,
          } as any
        }

        if (!period) throw new Error("Période non trouvée")

        const classId = student.class_id
        const levelId = student.class?.level_id

        // --- SUBJECT FETCHING (Moved here to fix ReferenceError) ---
        const { data: classSubjectsData } = await supabase
          .from("class_subjects")
          .select(
            "id, subject_id, coefficient, teacher:teachers(first_name, last_name), subject:subjects(id, name, code, subject_group:subject_groups(id, name))",
          )
          .eq("class_id", classId)

        let levelSubjectsData: any[] = []
        if (levelId) {
          const { data } = await supabase
            .from("level_subjects")
            .select(
              "id, subject_id, coefficient, teacher_id, teacher:teachers(first_name, last_name), subject:subjects(id, name, code, subject_group:subject_groups(id, name))",
            )
            .eq("level_id", levelId)
          levelSubjectsData = data || []
        }

        const subjectsMap = new Map<string, Subject>()
        if (classSubjectsData) {
          for (const cs of classSubjectsData) {
            if (cs.subject && cs.subject_id) {
              const subj = cs.subject as any
              const teacher = cs.teacher as any
              subjectsMap.set(cs.subject_id, {
                id: cs.subject_id,
                name: subj.name || "",
                code: subj.code || "",
                coefficient: cs.coefficient || 1,
                group_name: subj.subject_group?.name || "Autres",
                teacher_name: teacher ? `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() : undefined,
              })
            }
          }
        }

        for (const ls of levelSubjectsData) {
          if (ls.subject && ls.subject_id && !subjectsMap.has(ls.subject_id)) {
            const subj = ls.subject as any
            const teacher = ls.teacher as any
            subjectsMap.set(ls.subject_id, {
              id: ls.subject_id,
              name: subj.name || "",
              code: subj.code || "",
              coefficient: ls.coefficient || 1,
              group_name: subj.subject_group?.name || "Autres",
              teacher_name: teacher ? `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() : undefined,
            })
          }
        }

        const subjects = Array.from(subjectsMap.values()).sort(
          (a, b) => a.group_name.localeCompare(b.group_name) || a.name.localeCompare(b.name),
        )
        // --- END SUBJECT FETCHING ---

        // Fetch annual summary data if needed
        let annualSubjectsData: any[] = []
        let promotionDecision: any = undefined

        if (isAnnualPeriod) {
          // Fetch all periods of the year
          const { data: allYearPeriods } = await supabase
            .from("academic_periods")
            .select("*")
            .eq("academic_year", academicYear)
            .order("number", { ascending: true })

          const yearSeqs = (allYearPeriods || []).filter(p => p.type === "sequence")
          const yearTrims = (allYearPeriods || []).filter(p => p.type === "trimester")
          
          // Fetch all grades for this student for the year
          const { data: yearGrades } = await supabase
            .from("grades")
            .select("*")
            .eq("student_id", studentId)
            .in("academic_period_id", (allYearPeriods || []).map(p => p.id))

          // Process subjects matrix
          annualSubjectsData = subjects.map(subj => {
            const subjGrades = yearGrades?.filter(g => g.subject_id === subj.id) || []
            
            const trimAverages = yearTrims.map(trim => {
              // Map by parent_id or by number fallback
              const trimSeqs = yearSeqs.filter(s => s.parent_id === trim.id || (trim.number === 1 && s.number <= 2) || (trim.number === 2 && s.number >= 3 && s.number <= 4) || (trim.number === 3 && s.number >= 5))
              const trimGrades = subjGrades.filter(g => trimSeqs.some(s => s.id === g.academic_period_id))
              if (trimGrades.length === 0) return "NC"
              return Math.round((trimGrades.reduce((sum, g) => sum + g.score, 0) / trimGrades.length) * 100) / 100
            })

            const numericTrims = trimAverages.filter(t => typeof t === 'number') as number[]
            const annualAvg = numericTrims.length > 0 
              ? Math.round((numericTrims.reduce((a, b) => a + b, 0) / numericTrims.length) * 100) / 100
              : "NC"

            return {
              ...subj,
              trimesters: trimAverages,
              annual: annualAvg
            }
          })

          // Calculate total average for promotion
          const numericAnnualAvgs = annualSubjectsData
            .filter(s => typeof s.annual === 'number')
            .map(s => ({ score: s.annual as number, coefficient: s.coefficient }))
          
          const totalWeighted = numericAnnualAvgs.reduce((sum, s) => sum + s.score * s.coefficient, 0)
          const totalCoef = numericAnnualAvgs.reduce((sum, s) => sum + s.coefficient, 0)
          const annualTotalAverage = totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0

          // Determine promotion
          promotionDecision = determinePromotion(
            annualTotalAverage,
            student.class?.name || "",
            student.class?.section?.name || "",
            student.is_ranked !== false,
            student.class?.min_promotion_average || 10,
            student.class?.min_rattrapage_average || 8,
            student.class?.next_class?.name || null
          )
        }

        // Fetch attendance for trimester (not for annual)
        let attendanceData: any = undefined
        if (period.type === "trimester") {
          const { data: attendance } = await supabase
            .from("student_attendances")
            .select("*")
            .eq("student_id", studentId)
            .eq("academic_period_id", selectedPeriod)
            .maybeSingle()

          if (attendance) {
            attendanceData = {
              total_hours: attendance.total_hours || 0,
              justified_hours: attendance.justified_hours || 0,
              unjustified_hours: (attendance.total_hours || 0) - (attendance.justified_hours || 0),
            }
          }
        }

        // Check if student is NC
        let isUnranked = student.is_ranked === false
        if (!isAnnualPeriod) {
          const { data: unrankedData } = await supabase
            .from("student_unranked_periods")
            .select("id")
            .eq("student_id", studentId)
            .eq("academic_period_id", selectedPeriod)
            .maybeSingle()

          isUnranked = !!unrankedData || isUnranked
        }

        const levelId = student.class?.level_id
        const classId = student.class_id
        const isTrimestriel = period.type === "trimester"

        // Fetch class subjects with teachers
        const { data: classSubjectsData } = await supabase
          .from("class_subjects")
          .select(
            "id, subject_id, coefficient, teacher:teachers(first_name, last_name), subject:subjects(id, name, code, subject_group:subject_groups(id, name))",
          )
          .eq("class_id", classId)

        // Fetch level subjects
        let levelSubjectsData: any[] = []
        if (levelId) {
          const { data } = await supabase
            .from("level_subjects")
            .select(
              "id, subject_id, coefficient, teacher_id, teacher:teachers(first_name, last_name), subject:subjects(id, name, code, subject_group:subject_groups(id, name))",
            )
            .eq("level_id", levelId)
          levelSubjectsData = data || []
        }

        // Combine subjects
        const subjectsMap = new Map<string, Subject>()

        if (classSubjectsData) {
          for (const cs of classSubjectsData) {
            if (cs.subject && cs.subject_id) {
              const subj = cs.subject as any
              const teacher = cs.teacher as any
              subjectsMap.set(cs.subject_id, {
                id: cs.subject_id,
                name: subj.name || "",
                code: subj.code || "",
                coefficient: cs.coefficient || 1,
                group_name: subj.subject_group?.name || "Autres",
                teacher_name: teacher ? `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() : undefined,
              })
            }
          }
        }

        for (const ls of levelSubjectsData) {
          if (ls.subject && ls.subject_id && !subjectsMap.has(ls.subject_id)) {
            const subj = ls.subject as any
            const teacher = ls.teacher as any
            subjectsMap.set(ls.subject_id, {
              id: ls.subject_id,
              name: subj.name || "",
              code: subj.code || "",
              coefficient: ls.coefficient || 1,
              group_name: subj.subject_group?.name || "Autres",
              teacher_name: teacher ? `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() : undefined,
            })
          }
        }

        const subjects = Array.from(subjectsMap.values()).sort(
          (a, b) => a.group_name.localeCompare(b.group_name) || a.name.localeCompare(b.name),
        )

        // Get all students in class for ranking
        const { data: classStudents } = await supabase
          .from("students")
          .select("id, is_ranked")
          .eq("class_id", classId)
          .ilike("status", "active")

        const rankedStudentIds = (classStudents || []).filter((s) => s.is_ranked !== false).map((s) => s.id)
        const allStudentIds = (classStudents || []).map((s) => s.id)
        const subjectIds = subjects.map((s) => s.id)

        const grades: Record<string, { score: number; coefficient: number }> = {}
        let sequenceGrades: { seq1: Record<string, number>; seq2: Record<string, number> } | undefined

        let allGrades = allClassGrades

        if (isAnnualPeriod) {
          // For annual period, fetch all 6 sequences and calculate weighted average
          const { data: allSequences } = await supabase
            .from("academic_periods")
            .select("id, number")
            .eq("type", "sequence")
            .eq("academic_year", academicYear)
            .order("number", { ascending: true })

          const sequenceGradesMap = new Map<string, Record<string, number>>()

          // Fetch grades for all sequences
          if (allSequences && allSequences.length > 0 && subjectIds.length > 0) {
            for (const seq of allSequences) {
              const { data: seqGrades } = await supabase
                .from("grades")
                .select("student_id, subject_id, score")
                .eq("student_id", studentId)
                .in("subject_id", subjectIds)
                .eq("academic_period_id", seq.id)

              const seqGradeMap: Record<string, number> = {}
              for (const g of seqGrades || []) {
                seqGradeMap[g.subject_id] = g.score
              }
              sequenceGradesMap.set(seq.id, seqGradeMap)
            }

            // Calculate average across all sequences
            subjects.forEach((subject) => {
              let totalScore = 0
              let count = 0

              for (const seqGradeMap of sequenceGradesMap.values()) {
                if (seqGradeMap[subject.id] !== undefined) {
                  totalScore += seqGradeMap[subject.id]
                  count++
                }
              }

              if (count > 0) {
                const avgScore = totalScore / count
                grades[subject.id] = { score: Math.round(avgScore * 100) / 100, coefficient: subject.coefficient }
              }
            })
          }

          // Fetch all grades for ranking (all sequences, all students)
          if (!allGrades && allSequences && allSequences.length > 0) {
            const periodIds = allSequences.map((p) => p.id)
            if (allStudentIds.length > 0 && subjectIds.length > 0) {
              const { data } = await supabase
                .from("grades")
                .select("student_id, subject_id, score, academic_period_id")
                .in("student_id", allStudentIds)
                .in("subject_id", subjectIds)
                .in("academic_period_id", periodIds)
              allGrades = data || []
            }
          }
        } else if (isTrimestriel && period.number) {
          // Calculate sequence numbers from trimester number
          const seq1Num = (period.number - 1) * 2 + 1
          const seq2Num = (period.number - 1) * 2 + 2

          const { data: seqPeriods } = await supabase
            .from("academic_periods")
            .select("id, number")
            .eq("type", "sequence")
            .eq("academic_year", period.academic_year)
            .in("number", [seq1Num, seq2Num])

          const seq1Period = seqPeriods?.find((p) => p.number === seq1Num)
          const seq2Period = seqPeriods?.find((p) => p.number === seq2Num)

          sequenceGrades = { seq1: {}, seq2: {} }

          // Fetch sequence 1 grades
          if (seq1Period && subjectIds.length > 0) {
            const { data: seq1Grades } = await supabase
              .from("grades")
              .select("student_id, subject_id, score")
              .eq("student_id", studentId)
              .in("subject_id", subjectIds)
              .eq("academic_period_id", seq1Period.id)

            for (const g of seq1Grades || []) {
              sequenceGrades.seq1[g.subject_id] = g.score
            }
          }

          // Fetch sequence 2 grades
          if (seq2Period && subjectIds.length > 0) {
            const { data: seq2Grades } = await supabase
              .from("grades")
              .select("student_id, subject_id, score")
              .eq("student_id", studentId)
              .in("subject_id", subjectIds)
              .eq("academic_period_id", seq2Period.id)

            for (const g of seq2Grades || []) {
              sequenceGrades.seq2[g.subject_id] = g.score
            }
          }

          // Calculate trimester average from both sequences
          subjects.forEach((subject) => {
            const s1 = sequenceGrades!.seq1[subject.id]
            const s2 = sequenceGrades!.seq2[subject.id]
            if (s1 !== undefined || s2 !== undefined) {
              const avg = s1 !== undefined && s2 !== undefined ? (s1 + s2) / 2 : (s1 ?? s2)!
              grades[subject.id] = { score: avg, coefficient: subject.coefficient }
            }
          })

          // Fetch all grades for ranking
          if (!allGrades) {
            const periodIds = (seqPeriods || []).map((p) => p.id)
            if (periodIds.length > 0 && allStudentIds.length > 0 && subjectIds.length > 0) {
              const { data } = await supabase
                .from("grades")
                .select("student_id, subject_id, score, academic_period_id")
                .in("student_id", allStudentIds)
                .in("subject_id", subjectIds)
                .in("academic_period_id", periodIds)
              allGrades = data || []
            }
          }
        } else {
          // Simple sequence - fetch grades directly
          if (subjectIds.length > 0) {
            const { data: gradesData } = await supabase
              .from("grades")
              .select("student_id, subject_id, score")
              .eq("student_id", studentId)
              .in("subject_id", subjectIds)
              .eq("academic_period_id", selectedPeriod)

            for (const g of gradesData || []) {
              const subject = subjects.find((s) => s.id === g.subject_id)
              if (subject) {
                grades[g.subject_id] = { score: g.score, coefficient: subject.coefficient }
              }
            }
          }

          // Fetch all grades for ranking
          if (!allGrades && allStudentIds.length > 0 && subjectIds.length > 0) {
            const { data } = await supabase
              .from("grades")
              .select("student_id, subject_id, score")
              .in("student_id", allStudentIds)
              .in("subject_id", subjectIds)
              .eq("academic_period_id", selectedPeriod)
            allGrades = data || []
          }
        }

        // Calculate subject ranks
        const subjectRanks: Record<string, { rank: number; classSize: number }> = {}
        subjects.forEach((subject) => {
          const subjectGrades = (allGrades || [])
            .filter((g) => g.subject_id === subject.id && rankedStudentIds.includes(g.student_id))
            .map((g) => ({ studentId: g.student_id, score: g.score }))
            .sort((a, b) => b.score - a.score)

          const studentGrade = subjectGrades.find((g) => g.studentId === studentId)
          if (studentGrade && !isUnranked) {
            let rank = 1
            for (let i = 0; i < subjectGrades.length; i++) {
              if (i > 0 && subjectGrades[i].score < subjectGrades[i - 1].score) {
                rank = i + 1
              }
              if (subjectGrades[i].studentId === studentId) {
                subjectRanks[subject.id] = { rank, classSize: subjectGrades.length }
                break
              }
            }
          }
        })

        // Calculate group averages
        const groupAverages: Record<string, number> = {}
        const groups = [...new Set(subjects.map((s) => s.group_name))]

        groups.forEach((groupName) => {
          const groupSubjects = subjects.filter((s) => s.group_name === groupName)
          let totalWeighted = 0
          let totalCoef = 0

          groupSubjects.forEach((subject) => {
            const grade = grades[subject.id]
            if (grade) {
              totalWeighted += grade.score * grade.coefficient
              totalCoef += grade.coefficient
            }
          })

          if (totalCoef > 0) {
            groupAverages[groupName] = Math.round((totalWeighted / totalCoef) * 100) / 100
          }
        })

        // Calculate student average
        let totalWeighted = 0
        let totalCoef = 0
        Object.values(grades).forEach((g) => {
          totalWeighted += g.score * g.coefficient
          totalCoef += g.coefficient
        })
        const average = totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0

        // Calculate sequence averages for trimester
        let seq1Average = 0
        let seq2Average = 0
        if (isTrimestriel && sequenceGrades) {
          let tw1 = 0,
            tc1 = 0,
            tw2 = 0,
            tc2 = 0
          subjects.forEach((subject) => {
            if (sequenceGrades!.seq1[subject.id] !== undefined) {
              tw1 += sequenceGrades!.seq1[subject.id] * subject.coefficient
              tc1 += subject.coefficient
            }
            if (sequenceGrades!.seq2[subject.id] !== undefined) {
              tw2 += sequenceGrades!.seq2[subject.id] * subject.coefficient
              tc2 += subject.coefficient
            }
          })
          seq1Average = tc1 > 0 ? Math.round((tw1 / tc1) * 100) / 100 : 0
          seq2Average = tc2 > 0 ? Math.round((tw2 / tc2) * 100) / 100 : 0
        }

        // Calculate all students' averages for ranking
        const studentAverages = (classStudents || []).map((s) => {
          const sGrades = (allGrades || []).filter((g) => g.student_id === s.id)
          let tw = 0
          let tc = 0

          if (isAnnualPeriod || isTrimestriel) {
            // For annual and trimester: average of all grades per subject
            subjects.forEach((subject) => {
              const subjectGrades = sGrades.filter((g) => g.subject_id === subject.id)
              if (subjectGrades.length > 0) {
                const avgScore = subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length
                tw += avgScore * subject.coefficient
                tc += subject.coefficient
              }
            })
          } else {
            // For single sequence: direct grade
            subjects.forEach((subject) => {
              const grade = sGrades.find((g) => g.subject_id === subject.id)
              if (grade) {
                tw += grade.score * subject.coefficient
                tc += subject.coefficient
              }
            })
          }

          return { studentId: s.id, average: tc > 0 ? tw / tc : 0, isRanked: s.is_ranked !== false }
        })

        const rankedAverages = studentAverages.filter((s) => s.isRanked).sort((a, b) => b.average - a.average)

        let rank = 0
        if (!isUnranked) {
          for (let i = 0; i < rankedAverages.length; i++) {
            if (i > 0 && rankedAverages[i].average < rankedAverages[i - 1].average) {
              rank = i + 1
            } else if (i === 0) {
              rank = 1
            }
            if (rankedAverages[i].studentId === studentId) break
          }
        }

        const classAverage =
          rankedAverages.length > 0
            ? Math.round((rankedAverages.reduce((sum, s) => sum + s.average, 0) / rankedAverages.length) * 100) / 100
            : 0

        // Generate general observation
        const generalObservation = generateGeneralObservation(subjects, grades, average, attendanceData, !!isEnglish)

        return {
          student,
          period,
          subjects: isAnnualPeriod ? annualSubjectsData : subjects,
          grades,
          subjectRanks,
          sequenceGrades,
          groupAverages,
          average,
          rank,
          classSize: rankedAverages.length,
          classAverage,
          isUnranked,
          attendance: attendanceData,
          section: student.class?.section?.name,
          seq1Average,
          seq2Average,
          generalObservation,
          promotion: promotionDecision,
        }
      } catch (error) {
        console.error("Error generating bulletin data:", error)
        return null
      }
    },
    [supabase, selectedPeriod, periods],
  )

  // Generate bulletin for selected student
  const generateBulletin = useCallback(
    async (studentId: string) => {
      if (!selectedPeriod) {
        toast.error("Veuillez sélectionner une période")
        return
      }

      setGenerating(true)
      setSelectedStudent(studentId)

      try {
        const data = await generateBulletinDataForStudent(studentId)
        if (data) {
          setBulletinData(data)
          setShowBulletin(true)
        }
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors de la génération du bulletin")
      } finally {
        setGenerating(false)
      }
    },
    [selectedPeriod, generateBulletinDataForStudent],
  )

  // Create PDF data from bulletin data
  const createPdfData = (data: LocalBulletinData): BulletinData => {
    const isEnglish = data.section?.toLowerCase().includes("anglophone")
    const isTrimester = data.period.type === "trimester"

    return {
      student: {
        firstName: data.student.first_name,
        lastName: data.student.last_name,
        matricule: data.student.matricule || "",
        dateOfBirth: data.student.date_of_birth || "",
        placeOfBirth: data.student.place_of_birth || "",
        gender: data.student.gender || "",
        isRanked: !data.isUnranked,
      },
      className: data.student.class?.name || "",
      periodName: data.period.name || "",
      periodType: data.period.type as "sequence" | "trimester",
      periodNumber: data.period.number,
      academicYear: data.period.academic_year || schoolSettings?.current_academic_year || "",
      section: data.section || "",
      subjects: data.subjects.map((s) => {
        const grade = data.grades[s.id]
        const seq1 = data.sequenceGrades?.seq1[s.id]
        const seq2 = data.sequenceGrades?.seq2[s.id]
        const subjectRank = data.subjectRanks?.[s.id]

        return {
          name: s.name,
          teacher: s.teacher_name || "",
          coefficient: s.coefficient,
          score1: isTrimester ? seq1 : undefined,
          score2: isTrimester ? seq2 : undefined,
          average: grade?.score,
          rank: subjectRank?.rank,
          classSize: subjectRank?.classSize,
          group: s.group_name,
          trimesters: s.trimesters,
          annual: s.annual
        }
      }),
      average: data.average,
      rank: data.isUnranked ? "NC" : data.rank,
      classSize: data.classSize,
      classAverage: data.classAverage,
      promotion: data.promotion,
      attendance: data.attendance,
      seq1Average: data.seq1Average,
      seq2Average: data.seq2Average,
      generalObservation: data.generalObservation, // Include general observation in PDF data
      schoolSettings: {
        school_name: schoolSettings?.school_name || "",
        school_slogan: schoolSettings?.school_slogan || "",
        address: schoolSettings?.address || "",
        phone: schoolSettings?.phone || "",
        email: schoolSettings?.email || "",
        logo_url: schoolSettings?.logo_url || "",
      },
    }
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!bulletinData) return

    setDownloading(true)
    try {
      const pdfData = createPdfData(bulletinData)
      await generateBulletinPDF(pdfData)
      toast.success("PDF téléchargé avec succès")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Erreur lors du téléchargement")
    } finally {
      setDownloading(false)
    }
  }

  // Generate mass bulletins
  const handleMassGeneration = async () => {
    if (!selectedClass || !selectedPeriod || students.length === 0) {
      toast.error("Veuillez sélectionner une classe et une période")
      return
    }

    setMassGenerating(true)
    try {
      // Generate all bulletins
      const allBulletinsData: BulletinData[] = []

      for (const student of students) {
        const data = await generateBulletinDataForStudent(student.id)
        if (data) {
          allBulletinsData.push(createPdfData(data))
        }
      }

      // Sort by average (descending)
      allBulletinsData.sort((a, b) => {
        if (a.rank === "NC" && b.rank !== "NC") return 1
        if (a.rank !== "NC" && b.rank === "NC") return -1
        return (b.average || 0) - (a.average || 0)
      })

      // Generate PDF
      const className = classes.find((c) => c.id === selectedClass)?.name || "Classe"
      let periodName = periods.find((p) => p.id === selectedPeriod)?.name || "Période"
      
      // Handle annual period pseudo-IDs
      if (selectedPeriod.startsWith("annual_")) {
        const year = selectedPeriod.split("_")[1]
        periodName = `Année Complète ${year}`
      }

      await generateMassBulletinsPDF(allBulletinsData, `${className} - ${periodName}`)
      toast.success(`${allBulletinsData.length} bulletins générés avec succès`)
    } catch (error) {
      console.error("Error generating mass bulletins:", error)
      toast.error("Erreur lors de la génération")
    } finally {
      setMassGenerating(false)
    }
  }

  const isEnglish = bulletinData?.section?.toLowerCase().includes("anglophone")

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isEnglish ? "Report Cards" : "Bulletins de Notes"}</h1>
            <p className="text-muted-foreground">
              {isEnglish
                ? "Generate and download student report cards"
                : "Générez et téléchargez les bulletins des élèves"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{isEnglish ? "Filters" : "Filtres"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{isEnglish ? "Class" : "Classe"}</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder={isEnglish ? "Select a class" : "Sélectionner une classe"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isEnglish ? "Period" : "Période"}</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder={isEnglish ? "Select a period" : "Sélectionner une période"} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Add "Full Year" option for each academic year */}
                    {Array.from(new Set(periods.map((p) => p.academic_year))).map((year) => (
                      <SelectItem key={`annual_${year}`} value={`annual_${year}`}>
                        {isEnglish ? "Full Year" : "Année Complète"} ({year})
                      </SelectItem>
                    ))}
                    
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (
                        {p.type === "trimester"
                          ? isEnglish
                            ? "Term"
                            : "Trimestre"
                          : isEnglish
                            ? "Sequence"
                            : "Séquence"}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isEnglish ? "Search" : "Rechercher"}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isEnglish ? "Search student..." : "Rechercher un élève..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {selectedClass && selectedPeriod && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleMassGeneration} disabled={massGenerating || students.length === 0}>
                  {massGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="mr-2 h-4 w-4" />
                  )}
                  {isEnglish ? `Generate All (${students.length})` : `Générer Tous (${students.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEnglish ? "Students" : "Élèves"} ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {selectedClass
                  ? isEnglish
                    ? "No students found"
                    : "Aucun élève trouvé"
                  : isEnglish
                    ? "Select a class to view students"
                    : "Sélectionnez une classe pour voir les élèves"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {student.last_name} {student.first_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{student.matricule}</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateBulletin(student.id)}
                      disabled={generating || !selectedPeriod}
                    >
                      {generating && selectedStudent === student.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {isEnglish ? "View" : "Voir"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulletin Preview Dialog */}
        <Dialog open={showBulletin} onOpenChange={setShowBulletin}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEnglish ? "Report Card Preview" : "Aperçu du Bulletin"}</DialogTitle>
            </DialogHeader>

            {bulletinData && (
              <div className="space-y-4">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">{schoolSettings?.school_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {bulletinData.period.type === "trimester"
                      ? isEnglish
                        ? "TERM REPORT CARD"
                        : "BULLETIN TRIMESTRIEL"
                      : isEnglish
                        ? "SEQUENCE REPORT CARD"
                        : "BULLETIN SÉQUENTIEL"}
                  </p>
                  <p className="text-sm">
                    {bulletinData.period.name} - {bulletinData.period.academic_year}
                  </p>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>{isEnglish ? "Name:" : "Nom:"}</strong> {bulletinData.student.last_name}{" "}
                      {bulletinData.student.first_name}
                    </p>
                    <p>
                      <strong>{isEnglish ? "Registration:" : "Matricule:"}</strong> {bulletinData.student.matricule}
                    </p>
                    <p>
                      <strong>{isEnglish ? "Class:" : "Classe:"}</strong> {bulletinData.student.class?.name}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>{isEnglish ? "Date of Birth:" : "Date de Naissance:"}</strong>{" "}
                      {bulletinData.student.date_of_birth || "-"}
                    </p>
                    <p>
                      <strong>{isEnglish ? "Gender:" : "Sexe:"}</strong>{" "}
                      {bulletinData.student.gender === "M"
                        ? isEnglish
                          ? "Male"
                          : "Masculin"
                        : isEnglish
                          ? "Female"
                          : "Féminin"}
                    </p>
                  </div>
                </div>

                {/* Grades Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 border-r">{isEnglish ? "Subject" : "Matière"}</th>
                        <th className="p-2 border-r w-12">{isEnglish ? "Coef" : "Coef"}</th>
                        {bulletinData.period.type === "trimester" && (
                          <>
                            <th className="p-2 border-r w-16">Séq 1</th>
                            <th className="p-2 border-r w-16">Séq 2</th>
                          </>
                        )}
                        <th className="p-2 border-r w-16">{isEnglish ? "Avg" : "Moy"}</th>
                        <th className="p-2 w-20">{isEnglish ? "Rank" : "Rang"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const groups = [...new Set(bulletinData.subjects.map((s) => s.group_name))]
                        return groups.map((group) => (
                          <>
                            <tr key={`group-${group}`} className="bg-muted/50">
                              <td
                                colSpan={bulletinData.period.type === "trimester" ? 6 : 4}
                                className="p-2 font-semibold"
                              >
                                {group}
                              </td>
                            </tr>
                            {bulletinData.subjects
                              .filter((s) => s.group_name === group)
                              .map((subject) => {
                                const grade = bulletinData.grades[subject.id]
                                const seq1 = bulletinData.sequenceGrades?.seq1[subject.id]
                                const seq2 = bulletinData.sequenceGrades?.seq2[subject.id]
                                const subjectRank = bulletinData.subjectRanks?.[subject.id]

                                return (
                                  <tr key={subject.id} className="border-t">
                                    <td className="p-2 border-r">
                                      <div>
                                        {subject.name}
                                        {subject.teacher_name && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            ({subject.teacher_name})
                                          </span>
                                        )}
                                      </div>
                                      {grade?.score !== undefined && (
                                        <div className="text-xs italic text-muted-foreground mt-0.5">
                                          {getSubjectAppreciation(grade.score, !!isEnglish)}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2 border-r text-center">{subject.coefficient}</td>
                                    {bulletinData.period.type === "trimester" && (
                                      <>
                                        <td className={cn("p-2 border-r text-center font-medium", getGradeColor(seq1))}>
                                          {seq1 !== undefined ? seq1.toFixed(2) : "-"}
                                        </td>
                                        <td className={cn("p-2 border-r text-center font-medium", getGradeColor(seq2))}>
                                          {seq2 !== undefined ? seq2.toFixed(2) : "-"}
                                        </td>
                                      </>
                                    )}
                                    <td
                                      className={cn("p-2 border-r text-center font-bold", getGradeColor(grade?.score))}
                                    >
                                      {grade?.score !== undefined ? grade.score.toFixed(2) : "-"}
                                    </td>
                                    <td className="p-2 text-center">
                                      {subjectRank ? `${subjectRank.rank}/${subjectRank.classSize}` : "-"}
                                    </td>
                                  </tr>
                                )
                              })}
                            {bulletinData.groupAverages[group] !== undefined && (
                              <tr className="bg-muted/30 font-semibold">
                                <td
                                  className="p-2 border-r text-right"
                                  colSpan={bulletinData.period.type === "trimester" ? 4 : 2}
                                >
                                  {isEnglish ? "Group Average:" : "Moyenne du Groupe:"}
                                </td>
                                <td
                                  className={cn(
                                    "p-2 border-r text-center",
                                    getGradeColor(bulletinData.groupAverages[group]),
                                  )}
                                >
                                  {bulletinData.groupAverages[group].toFixed(2)}
                                </td>
                                <td className="p-2"></td>
                              </tr>
                            )}
                          </>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{isEnglish ? "Average" : "Moyenne"}</p>
                    <p className={cn("text-2xl font-bold", getGradeColor(bulletinData.average))}>
                      {bulletinData.average.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{isEnglish ? "Rank" : "Rang"}</p>
                    <p className="text-2xl font-bold">
                      {bulletinData.isUnranked ? "NC" : `${bulletinData.rank}/${bulletinData.classSize}`}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{isEnglish ? "Class Average" : "Moy. Classe"}</p>
                    <p className="text-2xl font-bold">{bulletinData.classAverage.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{isEnglish ? "Appreciation" : "Appréciation"}</p>
                    <p className="text-lg font-bold">{getAppreciation(bulletinData.average, !!isEnglish)}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    {isEnglish ? "General Observation" : "Observation Générale"}
                  </h4>
                  <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                    {generateGeneralObservation(
                      bulletinData.subjects,
                      bulletinData.grades,
                      bulletinData.average,
                      bulletinData.attendance,
                      !!isEnglish,
                    )}
                  </p>
                </div>

                {/* Attendance (for trimester) */}
                {bulletinData.attendance && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="font-semibold mb-2">{isEnglish ? "Attendance" : "Absences"}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <p>
                        <strong>Total:</strong> {bulletinData.attendance.total_hours}h
                      </p>
                      <p>
                        <strong>{isEnglish ? "Justified:" : "Justifiées:"}</strong>{" "}
                        {bulletinData.attendance.justified_hours}h
                      </p>
                      <p>
                        <strong>{isEnglish ? "Unjustified:" : "Non Justifiées:"}</strong>{" "}
                        {bulletinData.attendance.unjustified_hours}h
                      </p>
                    </div>
                  </div>
                )}

                {/* Sequence Averages (for trimester) */}
                {bulletinData.period.type === "trimester" && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold mb-2">
                      {isEnglish ? "Sequence Summary" : "Récapitulatif des Séquences"}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <p>
                        <strong>Séq 1:</strong> {bulletinData.seq1Average?.toFixed(2) || "-"}
                      </p>
                      <p>
                        <strong>Séq 2:</strong> {bulletinData.seq2Average?.toFixed(2) || "-"}
                      </p>
                      <p>
                        <strong>{isEnglish ? "Evolution:" : "Évolution:"}</strong>{" "}
                        {bulletinData.seq1Average && bulletinData.seq2Average
                          ? `${(((bulletinData.seq2Average - bulletinData.seq1Average) / bulletinData.seq1Average) * 100).toFixed(1)}%`
                          : "-"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <div className="flex justify-end">
                  <Button onClick={handleDownloadPDF} disabled={downloading}>
                    {downloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {isEnglish ? "Download PDF" : "Télécharger PDF"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
