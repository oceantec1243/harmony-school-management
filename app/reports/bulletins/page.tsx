"use client"

import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentAvatar } from "@/components/students/student-avatar"
import { Download, Search, Eye, Loader2, FileArchive, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { generateBulletinPDF, generateClassBulletinsPDF } from "@/lib/services/bulletin-pdf-generator"

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth: string | null
  gender: string
  class_id: string
  class?: { name: string }
  is_ranked?: boolean
  photo?: string | null
}

type ClassType = { id: string; name: string; level_id: string }
type AcademicPeriod = { id: string; name: string; type: string; academic_year: string; number?: number }

type Subject = {
  id: string
  name: string
  code: string
  coefficient: number
  group_name: string
  teacher_name?: string
}

type BulletinData = {
  student: any
  period: AcademicPeriod
  subjects: Subject[]
  grades: Record<string, { score: number; coefficient: number }>
  subjectRanks?: Record<string, { rank: number; classSize: number }>
  sequenceGrades?: {
    seq1: Record<string, number>
    seq2: Record<string, number>
  }
  groupAverages: Record<string, number>
  average: number
  rank: number
  classSize: number
  classAverage: number
  isUnranked?: boolean
  attendance?: any
  section?: string // Added for section
}

// Helper functions
function getGradeColor(score: number | undefined): string {
  if (score === undefined) return "text-gray-400"
  if (score < 10) return "text-red-600"
  if (score < 12) return "text-amber-600"
  if (score < 15) return "text-blue-600"
  return "text-green-600"
}

function getGradeBg(score: number | undefined): string {
  if (score === undefined) return "bg-gray-50"
  if (score < 10) return "bg-red-50"
  if (score < 12) return "bg-amber-50"
  if (score < 15) return "bg-blue-50"
  return "bg-green-50"
}

function getAppreciation(score: number): string {
  if (score >= 18) return "Excellent"
  if (score >= 16) return "Très Bien"
  if (score >= 14) return "Bien"
  if (score >= 12) return "Assez Bien"
  if (score >= 10) return "Passable"
  if (score >= 8) return "Insuffisant"
  return "Très Insuffisant"
}

function getDistinction(average: number): string {
  if (average >= 16) return "Tableau d'Honneur"
  if (average >= 14) return "Tableau d'Encouragement"
  if (average >= 12) return "Félicitations"
  if (average >= 10) return "Admis"
  return "Doit redoubler d'efforts"
}

export default function BulletinsPage() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [bulletinType, setBulletinType] = useState<"sequence" | "trimester" | "year">("sequence")
  const [searchQuery, setSearchQuery] = useState("")
  const [showBulletin, setShowBulletin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [massGenerating, setMassGenerating] = useState(false)

  const [classes, setClasses] = useState<ClassType[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [bulletinData, setBulletinData] = useState<BulletinData | null>(null)
  const [schoolSettings, setSchoolSettings] = useState<any>(null)
  const [teachersMap, setTeachersMap] = useState<Record<string, string>>({})

  const supabase = createClient()

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
            school_name: "HARMONY School",
            school_slogan: "L'excellence au service de l'éducation",
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

  useEffect(() => {
    async function fetchStudentsAndTeachers() {
      if (!selectedClass) {
        setStudents([])
        setTeachersMap({})
        return
      }

      // Fetch students
      const { data: studentsData } = await supabase
        .from("students")
        .select(
          "id, matricule, first_name, last_name, date_of_birth, place_of_birth, gender, class_id, is_ranked, class:classes(*, level:levels(*), section:sections(*)), photo",
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
          if (cs.teacher && cs.subject_id) {
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

  const generateBulletinDataForStudent = useCallback(
    async (studentId: string, allClassGrades?: any[]): Promise<BulletinData | null> => {
      try {
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("*, class:classes(*, level:levels(*), section:sections(*))")
          .eq("id", studentId)
          .single()

        if (studentError || !student) throw new Error("Élève non trouvé")

        const { data: period } = await supabase.from("academic_periods").select("*").eq("id", selectedPeriod).single()

        if (!period) throw new Error("Période non trouvée")

        let attendanceData: any = undefined
        if (period.type === "trimester") {
          const { data: attendance } = await supabase
            .from("attendances")
            .select("*")
            .eq("student_id", studentId)
            .eq("academic_period_id", selectedPeriod)
            .maybeSingle()

          if (attendance) {
            attendanceData = {
              total_hours: attendance.total_hours || 0,
              justified_hours: attendance.justified_hours || 0,
              unjustified_hours: attendance.unjustified_hours || 0,
            }
          }
        }

        // Check if student is unranked for this period
        const { data: unrankedData } = await supabase
          .from("student_unranked_periods")
          .select("id")
          .eq("student_id", studentId)
          .eq("academic_period_id", selectedPeriod)
          .maybeSingle()

        const isUnranked = !!unrankedData || student.is_ranked === false

        const levelId = student.class?.level_id
        const classId = student.class_id
        const isTrimestriel = bulletinType === "trimester"

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
              "id, subject_id, coefficient, subject:subjects(id, name, code, subject_group:subject_groups(id, name))",
            )
            .eq("level_id", levelId)
          levelSubjectsData = data || []
        }

        // Combine subjects with teacher names
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
            subjectsMap.set(ls.subject_id, {
              id: ls.subject_id,
              name: subj.name || "",
              code: subj.code || "",
              coefficient: ls.coefficient || 1,
              group_name: subj.subject_group?.name || "Autres",
              teacher_name: teachersMap[ls.subject_id] || undefined,
            })
          }
        }

        const subjects = Array.from(subjectsMap.values()).sort(
          (a, b) => a.group_name.localeCompare(b.group_name) || a.name.localeCompare(b.name),
        )

        // Get all students in class for ranking
        const { data: classStudents } = await supabase
          .from("students")
          .select("id, is_ranked, photo")
          .eq("class_id", classId)
          .ilike("status", "active")

        // Filter out unranked students for ranking calculations
        const rankedStudentIds = (classStudents || []).filter((s) => s.is_ranked !== false).map((s) => s.id)

        const allStudentIds = (classStudents || []).map((s) => s.id)
        const subjectIds = subjects.map((s) => s.id)

        const grades: Record<string, { score: number; coefficient: number }> = {}
        let sequenceGrades: { seq1: Record<string, number>; seq2: Record<string, number> } | undefined

        // Use provided grades or fetch them
        let allGrades = allClassGrades

        if (isTrimestriel && period.number) {
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

          if (seq1Period) {
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

          if (seq2Period) {
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

          subjects.forEach((subject) => {
            const s1 = sequenceGrades!.seq1[subject.id]
            const s2 = sequenceGrades!.seq2[subject.id]
            if (s1 !== undefined || s2 !== undefined) {
              const avg = s1 !== undefined && s2 !== undefined ? (s1 + s2) / 2 : s1 || s2
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
          // Simple sequence
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

        // Calculate all students' averages for ranking
        const studentAverages = (classStudents || []).map((s) => {
          const sGrades = (allGrades || []).filter((g) => g.student_id === s.id)
          let tw = 0
          let tc = 0

          if (isTrimestriel) {
            subjects.forEach((subject) => {
              const subjectGrades = sGrades.filter((g) => g.subject_id === subject.id)
              if (subjectGrades.length > 0) {
                const avgScore = subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length
                tw += avgScore * subject.coefficient
                tc += subject.coefficient
              }
            })
          } else {
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

        // Only rank students who are ranked
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

        return {
          student,
          period,
          subjects,
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
          section: student.class?.section?.name, // Added section
        }
      } catch (error) {
        console.error("Error generating bulletin data:", error)
        return null
      }
    },
    [supabase, selectedPeriod, bulletinType, teachersMap],
  )

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
        } else {
          toast.error("Erreur lors de la génération du bulletin")
        }
      } catch (error) {
        console.error("Error generating bulletin:", error)
        toast.error("Erreur lors de la génération du bulletin")
      } finally {
        setGenerating(false)
      }
    },
    [generateBulletinDataForStudent, selectedPeriod],
  )

  const handleDownloadPDF = async () => {
    // Ensure we have bulletin data before proceeding
    if (!bulletinData) {
      toast.error("Aucune donnée de bulletin à télécharger.")
      return
    }

    setDownloading(true)
    try {
      const pdfData = {
        student: {
          first_name: bulletinData.student.first_name,
          last_name: bulletinData.student.last_name,
          matricule: bulletinData.student.matricule || "",
          date_of_birth: bulletinData.student.date_of_birth || "",
          place_of_birth: bulletinData.student.place_of_birth || "",
          gender: bulletinData.student.gender || "",
          photo: bulletinData.student.photo || "", // Added photo
          isRanked: !bulletinData.isUnranked, // Added isRanked
        },
        class: {
          name: bulletinData.student.class?.name || "",
        },
        period: {
          name: bulletinData.period?.name || "",
          type: bulletinData.period?.type || "sequence",
          academic_year: schoolSettings?.current_academic_year || "2024-2025",
        },
        attendance: bulletinData.attendance,
        subjects: bulletinData.subjects.map((s: any) => ({
          id: s.id, // Added subject ID
          name: s.name,
          teacher: s.teacher_name || "",
          coefficient: s.coefficient || 1,
          score1: bulletinData.sequenceGrades?.seq1?.[s.id],
          score2: bulletinData.sequenceGrades?.seq2?.[s.id],
          average: bulletinData.grades?.[s.id]?.score || 0,
          group: s.group_name || "",
          rank: bulletinData.subjectRanks?.[s.id]?.rank,
          classSize: bulletinData.subjectRanks?.[s.id]?.classSize,
        })),
        average: bulletinData.average || 0,
        rank: bulletinData.isUnranked ? "NC" : bulletinData.rank || 1,
        classSize: bulletinData.classSize || 1,
        classAverage: bulletinData.classAverage || 0,
        appreciation: getAppreciation(bulletinData.average || 0),
        distinction: getDistinction(bulletinData.average || 0),
        schoolSettings: {
          school_name: schoolSettings?.school_name || "HARMONY School",
          school_slogan: schoolSettings?.school_slogan || "",
          address: schoolSettings?.address || "",
          phone: schoolSettings?.phone || "",
          email: schoolSettings?.email || "",
          logo_url: schoolSettings?.logo_url || "",
          po_box: schoolSettings?.po_box || "",
          current_academic_year: schoolSettings?.current_academic_year || "2024-2025",
        },
        section: bulletinData.section || "", // Added section
        schoolInfo: {
          poBox: schoolSettings?.po_box || "",
          logo: schoolSettings?.logo_url || "",
        },
        // Added missing fields that might be expected by generateBulletinPDF
        className: bulletinData.student.class?.name || "",
        periodName: bulletinData.period.name,
        periodType: bulletinData.period.type,
        // Assuming 'periods' is an array of period objects, adjust if needed
        periods: [bulletinData.period], // Pass the current period in an array
      }

      await generateBulletinPDF(pdfData as any) // Cast to any to bypass potential type issues if pdfData is not perfectly typed
      toast.success("PDF téléchargé avec succès!")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Erreur lors du téléchargement")
    } finally {
      setDownloading(false)
    }
  }

  const handleMassGeneration = async () => {
    if (!selectedClass || !selectedPeriod) {
      toast.error("Veuillez sélectionner une classe et une période")
      return
    }

    setMassGenerating(true)
    toast.info("Génération des bulletins en cours...")

    try {
      const bulletinsData: any[] = []

      for (const student of students) {
        const data = await generateBulletinDataForStudent(student.id)
        if (data) {
          const pdfData = {
            schoolName: schoolSettings?.school_name || "HARMONY School",
            schoolSlogan: schoolSettings?.school_slogan || "L'excellence au service de l'éducation",
            schoolAddress: schoolSettings?.address || "",
            schoolPhone: schoolSettings?.phone || "",
            schoolEmail: schoolSettings?.email || "",
            logoUrl: schoolSettings?.logo_url || "",
            academicYear: schoolSettings?.current_academic_year || "2024-2025",
            className: data.student.class?.name || "",
            // Assuming section and level are available in schoolSettings or student data if needed
            // section: "Francophone",
            // level: "Moyenne",
            periodName: data.period.name,
            periodType: data.period.type,
            student: {
              id: data.student.id,
              firstName: data.student.first_name,
              lastName: data.student.last_name,
              matricule: data.student.matricule || "",
              dateOfBirth: data.student.date_of_birth || "",
              placeOfBirth: data.student.place_of_birth || "",
              gender: data.student.gender || "",
              photo: data.student.photo || "",
              isRanked: !data.isUnranked,
            },
            subjects: data.subjects.map((s) => ({
              id: s.id,
              name: s.name,
              teacher: s.teacher_name,
              coefficient: s.coefficient,
              score1: data.sequenceGrades?.seq1[s.id],
              score2: data.sequenceGrades?.seq2[s.id],
              average: data.grades[s.id]?.score || 0,
              group: s.group_name,
              rank: data.subjectRanks?.[s.id]?.rank,
              classSize: data.subjectRanks?.[s.id]?.classSize,
            })),
            average: data.average,
            rank: data.isUnranked ? "NC" : data.rank,
            classSize: data.classSize,
            classAverage: data.classAverage,
            appreciation: getAppreciation(data.average),
            distinction: getDistinction(data.average),
            attendance: data.attendance,
            periods: [data.period],
            section: data.section, // Added section
          }
          bulletinsData.push(pdfData)
        }
      }

      if (bulletinsData.length === 0) {
        toast.error("Aucun bulletin généré")
        return
      }

      const className = classes.find((c) => c.id === selectedClass)?.name || "Classe"
      const periodName = periods.find((p) => p.id === selectedPeriod)?.name || "Période"

      await generateClassBulletinsPDF(bulletinsData, className, periodName)
      toast.success(`${bulletinsData.length} bulletins générés avec succès!`)
    } catch (error) {
      console.error("Error mass generating bulletins:", error)
      toast.error("Erreur lors de la génération des bulletins")
    } finally {
      setMassGenerating(false)
    }
  }

  const filteredPeriods = periods.filter((p) => p.type === bulletinType)

  // Group subjects by group name for display
  const subjectsByGroup: Record<string, Subject[]> = {}
  if (bulletinData) {
    bulletinData.subjects.forEach((s) => {
      if (!subjectsByGroup[s.group_name]) subjectsByGroup[s.group_name] = []
      subjectsByGroup[s.group_name].push(s)
    })
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Génération de Bulletins" description="Chargement..." />
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Génération de Bulletins" description="Créez des bulletins scolaires individuels ou en masse">
        {selectedClass && selectedPeriod && (
          <Button variant="default" onClick={handleMassGeneration} disabled={massGenerating || students.length === 0}>
            {massGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4 mr-2" />
            )}
            {massGenerating ? "Génération..." : `Générer toute la classe (${students.length})`}
          </Button>
        )}
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Paramètres du Bulletin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Type de Bulletin</Label>
              <Select
                value={bulletinType}
                onValueChange={(v: any) => {
                  setBulletinType(v)
                  setSelectedPeriod("")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequence">Séquentiel</SelectItem>
                  <SelectItem value="trimester">Trimestriel</SelectItem>
                  <SelectItem value="year">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({period.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rechercher un élève</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Nom, prénom ou matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des élèves ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun élève trouvé dans cette classe</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      "hover:bg-accent hover:border-primary/50",
                      selectedStudent === student.id && generating && "bg-accent border-primary",
                    )}
                  >
                    <StudentAvatar
                      firstName={student.first_name}
                      lastName={student.last_name}
                      photoUrl={student.photo || undefined}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {student.last_name} {student.first_name}
                        {student.is_ranked === false && (
                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">NC</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{student.matricule}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => generateBulletin(student.id)}
                      disabled={generating || !selectedPeriod}
                    >
                      {generating && selectedStudent === student.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulletin Preview Dialog - Made wider */}
      <Dialog open={showBulletin} onOpenChange={setShowBulletin}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Bulletin de {bulletinData?.student?.last_name} {bulletinData?.student?.first_name}
                {bulletinData?.isUnranked && (
                  <span className="ml-2 text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded">Non Classé</span>
                )}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading}>
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Télécharger PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {bulletinData && (
            <div className="space-y-4 p-4 bg-white rounded-lg border">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold text-primary">{schoolSettings?.school_name || "HARMONY School"}</h2>
                <p className="text-sm text-muted-foreground">{schoolSettings?.school_slogan}</p>
                <div className="mt-2 inline-block bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  BULLETIN DE NOTES - {bulletinData.period.name}
                </div>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nom et Prénom</p>
                  <p className="font-semibold">
                    {bulletinData.student.last_name?.toUpperCase()} {bulletinData.student.first_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classe</p>
                  <p className="font-semibold">{bulletinData.student.class?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Matricule</p>
                  <p className="font-semibold">{bulletinData.student.matricule}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Effectif</p>
                  <p className="font-semibold">{bulletinData.classSize} élèves</p>
                </div>
                {bulletinData.section && ( // Display Section if available
                  <div>
                    <p className="text-sm text-muted-foreground">Section</p>
                    <p className="font-semibold">{bulletinData.section}</p>
                  </div>
                )}
              </div>

              {/* Grades Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="text-left p-2">Matière</th>
                      <th className="text-left p-2">Enseignant</th>
                      <th className="text-center p-2">Coef</th>
                      {bulletinData.period.type === "trimester" ? (
                        <>
                          <th className="text-center p-2">Séq 1</th>
                          <th className="text-center p-2">Séq 2</th>
                          <th className="text-center p-2">Moy</th>
                        </>
                      ) : (
                        <th className="text-center p-2">Note /20</th>
                      )}
                      <th className="text-center p-2">N x C</th>
                      <th className="text-center p-2">Rang</th>
                      <th className="text-left p-2">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(subjectsByGroup).map(([groupName, groupSubjects]) => (
                      <>
                        <tr key={groupName} className="bg-blue-50">
                          <td
                            colSpan={bulletinData.period.type === "trimester" ? 9 : 7}
                            className="p-2 font-bold text-primary"
                          >
                            {groupName}
                          </td>
                        </tr>
                        {groupSubjects.map((subject, idx) => {
                          const grade = bulletinData.grades[subject.id]
                          const score = grade?.score
                          const weighted = score !== undefined ? score * subject.coefficient : undefined
                          const subjectRank = bulletinData.subjectRanks?.[subject.id]

                          return (
                            <tr key={subject.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="p-2">{subject.name}</td>
                              <td className="p-2 text-muted-foreground text-xs">{subject.teacher_name || "-"}</td>
                              <td className="text-center p-2 font-medium">{subject.coefficient}</td>
                              {bulletinData.period.type === "trimester" && bulletinData.sequenceGrades ? (
                                <>
                                  <td
                                    className={cn(
                                      "text-center p-2",
                                      getGradeColor(bulletinData.sequenceGrades.seq1[subject.id]),
                                    )}
                                  >
                                    {bulletinData.sequenceGrades.seq1[subject.id]?.toFixed(2) || "-"}
                                  </td>
                                  <td
                                    className={cn(
                                      "text-center p-2",
                                      getGradeColor(bulletinData.sequenceGrades.seq2[subject.id]),
                                    )}
                                  >
                                    {bulletinData.sequenceGrades.seq2[subject.id]?.toFixed(2) || "-"}
                                  </td>
                                  <td
                                    className={cn("text-center p-2 font-bold", getGradeColor(score), getGradeBg(score))}
                                  >
                                    {score?.toFixed(2) || "-"}
                                  </td>
                                </>
                              ) : (
                                <td
                                  className={cn("text-center p-2 font-bold", getGradeColor(score), getGradeBg(score))}
                                >
                                  {score?.toFixed(2) || "-"}
                                </td>
                              )}
                              <td className="text-center p-2">{weighted?.toFixed(2) || "-"}</td>
                              <td
                                className={cn(
                                  "text-center p-2 font-medium",
                                  subjectRank && subjectRank.rank <= 3 ? "text-green-600" : "",
                                )}
                              >
                                {subjectRank ? `${subjectRank.rank}/${subjectRank.classSize}` : "-"}
                              </td>
                              <td className="p-2 text-muted-foreground text-xs italic">
                                {score !== undefined ? getAppreciation(score) : "-"}
                              </td>
                            </tr>
                          )
                        })}
                        <tr key={`summary-${groupName}`} className="bg-blue-100">
                          <td
                            colSpan={bulletinData.period.type === "trimester" ? 5 : 3}
                            className="p-2 text-right font-medium text-primary"
                          >
                            Moyenne {groupName}:
                          </td>
                          <td className="text-center p-2 font-bold text-primary">
                            {bulletinData.groupAverages[groupName]?.toFixed(2) || "-"}
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-primary text-white p-4 rounded-lg text-center">
                  <p className="text-xs opacity-80">Moyenne Générale</p>
                  <p className="text-2xl font-bold">{bulletinData.average.toFixed(2)}</p>
                  <p className="text-xs">/20</p>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-lg text-center text-white",
                    bulletinData.isUnranked ? "bg-gray-500" : "bg-purple-600",
                  )}
                >
                  <p className="text-xs opacity-80">Rang</p>
                  <p className="text-2xl font-bold">
                    {bulletinData.isUnranked ? "NC" : bulletinData.rank === 1 ? "1er" : `${bulletinData.rank}ème`}
                  </p>
                  <p className="text-xs">{bulletinData.isUnranked ? "Non Classé" : `sur ${bulletinData.classSize}`}</p>
                </div>
                <div className="bg-cyan-500 text-white p-4 rounded-lg text-center">
                  <p className="text-xs opacity-80">Moy. Classe</p>
                  <p className="text-2xl font-bold">{bulletinData.classAverage.toFixed(2)}</p>
                  <p className="text-xs">/20</p>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-lg text-center text-white",
                    bulletinData.average >= 16
                      ? "bg-amber-500"
                      : bulletinData.average >= 14
                        ? "bg-green-500"
                        : bulletinData.average >= 12
                          ? "bg-blue-500"
                          : bulletinData.average >= 10
                            ? "bg-gray-500"
                            : "bg-red-500",
                  )}
                >
                  <p className="text-xs opacity-80">Mention</p>
                  <p className="text-sm font-bold mt-2">{getDistinction(bulletinData.average)}</p>
                </div>
              </div>

              {/* Attendance Summary */}
              {bulletinData.period.type === "trimester" && bulletinData.attendance && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-green-500 text-white p-4 rounded-lg text-center">
                    <p className="text-xs opacity-80">Total Heures</p>
                    <p className="text-2xl font-bold">{bulletinData.attendance.total_hours}</p>
                  </div>
                  <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
                    <p className="text-xs opacity-80">Heures Justifiées</p>
                    <p className="text-2xl font-bold">{bulletinData.attendance.justified_hours}</p>
                  </div>
                  <div className="bg-red-500 text-white p-4 rounded-lg text-center">
                    <p className="text-xs opacity-80">Heures Non Justifiées</p>
                    <p className="text-2xl font-bold">{bulletinData.attendance.unjustified_hours}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
