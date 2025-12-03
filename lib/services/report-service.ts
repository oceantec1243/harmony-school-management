"use server"

import { createClient } from "@/lib/supabase/server"
import { calculateRanks, getAppreciation, getDistinction } from "@/lib/calculations"

export type StudentReportData = {
  student: {
    id: string
    matricule: string
    first_name: string
    last_name: string
    date_of_birth: string
    place_of_birth: string | null
    gender: string
  }
  grades: Record<string, number>
  average: number
  rank: number
  totalCoefficient: number
}

export type ClassReportData = {
  class: {
    id: string
    name: string
    class_teacher: string | null
    level: { name: string }
    section: { name: string }
  }
  period: {
    id: string
    name: string
    academic_year: string
    type: string
  }
  subjects: Array<{
    id: string
    subject_id: string
    name: string
    code: string
    coefficient: number
    group_name: string
    group_order: number
    teacher_name?: string
  }>
  students: StudentReportData[]
  classAverage: number
  subjectAverages: Record<string, number>
  effectif: number
}

export async function generateBordereauData(classId: string, periodId: string): Promise<ClassReportData | null> {
  const supabase = await createClient()

  // Get class info
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      class_teacher,
      level:levels(name),
      section:sections(name)
    `)
    .eq("id", classId)
    .single()

  if (classError || !classData) return null

  // Get period info
  const { data: periodData, error: periodError } = await supabase
    .from("academic_periods")
    .select("*")
    .eq("id", periodId)
    .single()

  if (periodError || !periodData) return null

  // Get class subjects with teachers
  const { data: classSubjects, error: subjectsError } = await supabase
    .from("class_subjects")
    .select(`
      id,
      subject_id,
      coefficient,
      subject:subjects(
        id,
        name,
        code,
        subject_group:subject_groups(name, order)
      ),
      teacher:teachers(first_name, last_name)
    `)
    .eq("class_id", classId)

  if (subjectsError || !classSubjects) return null

  // Get students in class
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, matricule, first_name, last_name, date_of_birth, place_of_birth, gender")
    .eq("class_id", classId)
    .eq("status", "Active")
    .order("last_name")

  if (studentsError || !students) return null

  // Get all grades for these students in this period
  const studentIds = students.map((s) => s.id)
  const { data: grades, error: gradesError } = await supabase
    .from("grades")
    .select("student_id, subject_id, score, coefficient")
    .in("student_id", studentIds)
    .eq("academic_period_id", periodId)

  if (gradesError) return null

  // Format subjects
  const subjects = classSubjects
    .filter((cs) => cs.subject)
    .map((cs) => ({
      id: cs.id,
      subject_id: cs.subject_id,
      name: cs.subject?.name || "",
      code: cs.subject?.code || "",
      coefficient: cs.coefficient,
      group_name: cs.subject?.subject_group?.name || "",
      group_order: cs.subject?.subject_group?.order || 0,
      teacher_name: cs.teacher ? `${cs.teacher.first_name} ${cs.teacher.last_name}` : undefined,
    }))
    .sort((a, b) => a.group_order - b.group_order || a.name.localeCompare(b.name))

  // Calculate student reports
  const studentReports: StudentReportData[] = students.map((student) => {
    const studentGrades = grades?.filter((g) => g.student_id === student.id) || []
    const gradesMap: Record<string, number> = {}

    let totalWeighted = 0
    let totalCoef = 0

    subjects.forEach((subject) => {
      const grade = studentGrades.find((g) => g.subject_id === subject.subject_id)
      if (grade) {
        gradesMap[subject.subject_id] = grade.score
        totalWeighted += grade.score * subject.coefficient
        totalCoef += subject.coefficient
      }
    })

    const average = totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0

    return {
      student,
      grades: gradesMap,
      average,
      rank: 0,
      totalCoefficient: totalCoef,
    }
  })

  // Calculate ranks
  const rankedReports = calculateRanks(studentReports)

  // Calculate class average
  const classAverage =
    rankedReports.length > 0
      ? Math.round((rankedReports.reduce((sum, r) => sum + r.average, 0) / rankedReports.length) * 100) / 100
      : 0

  // Calculate subject averages
  const subjectAverages: Record<string, number> = {}
  subjects.forEach((subject) => {
    const subjectGrades = grades?.filter((g) => g.subject_id === subject.subject_id) || []
    if (subjectGrades.length > 0) {
      subjectAverages[subject.subject_id] =
        Math.round((subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length) * 100) / 100
    }
  })

  return {
    class: classData as any,
    period: periodData,
    subjects,
    students: rankedReports,
    classAverage,
    subjectAverages,
    effectif: students.length,
  }
}

export async function generateBulletinData(
  studentId: string,
  periodId: string,
): Promise<{
  student: any
  class: any
  period: any
  subjects: any[]
  grades: Record<string, { score: number; coefficient: number; appreciation: string }>
  groupAverages: Record<string, number>
  average: number
  rank: number
  classSize: number
  classAverage: number
  distinction: string
  councilComment?: string
} | null> {
  const supabase = await createClient()

  // Get student info
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select(`
      *,
      class:classes(
        *,
        level:levels(*),
        section:sections(*)
      )
    `)
    .eq("id", studentId)
    .single()

  if (studentError || !student) return null

  // Get period info
  const { data: period, error: periodError } = await supabase
    .from("academic_periods")
    .select("*")
    .eq("id", periodId)
    .single()

  if (periodError || !period) return null

  // Get class subjects
  const { data: classSubjects } = await supabase
    .from("class_subjects")
    .select(`
      id,
      subject_id,
      coefficient,
      subject:subjects(
        id,
        name,
        code,
        subject_group:subject_groups(id, name, order)
      )
    `)
    .eq("class_id", student.class_id)

  if (!classSubjects) return null

  // Get all students in class for ranking
  const { data: classStudents } = await supabase
    .from("students")
    .select("id")
    .eq("class_id", student.class_id)
    .eq("status", "Active")

  if (!classStudents) return null

  // Get grades for all students in the period
  const studentIds = classStudents.map((s) => s.id)
  const { data: allGrades } = await supabase
    .from("grades")
    .select("student_id, subject_id, score, coefficient")
    .in("student_id", studentIds)
    .eq("academic_period_id", periodId)

  if (!allGrades) return null

  // Format subjects grouped
  const subjects = classSubjects
    .filter((cs) => cs.subject)
    .map((cs) => ({
      id: cs.subject_id,
      name: cs.subject?.name || "",
      code: cs.subject?.code || "",
      coefficient: cs.coefficient,
      group_id: cs.subject?.subject_group?.id || "",
      group_name: cs.subject?.subject_group?.name || "",
      group_order: cs.subject?.subject_group?.order || 0,
    }))
    .sort((a, b) => a.group_order - b.group_order || a.name.localeCompare(b.name))

  // Get student's grades with appreciation
  const studentGrades = allGrades.filter((g) => g.student_id === studentId)
  const grades: Record<string, { score: number; coefficient: number; appreciation: string }> = {}

  subjects.forEach((subject) => {
    const grade = studentGrades.find((g) => g.subject_id === subject.id)
    if (grade) {
      grades[subject.id] = {
        score: grade.score,
        coefficient: subject.coefficient,
        appreciation: getAppreciation(grade.score),
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

  // Calculate all students' averages for ranking
  const studentAverages = classStudents.map((s) => {
    const sGrades = allGrades.filter((g) => g.student_id === s.id)
    let totalWeighted = 0
    let totalCoef = 0

    subjects.forEach((subject) => {
      const grade = sGrades.find((g) => g.subject_id === subject.id)
      if (grade) {
        totalWeighted += grade.score * subject.coefficient
        totalCoef += subject.coefficient
      }
    })

    return {
      studentId: s.id,
      average: totalCoef > 0 ? totalWeighted / totalCoef : 0,
    }
  })

  // Sort and find rank
  studentAverages.sort((a, b) => b.average - a.average)
  let rank = 1
  for (let i = 0; i < studentAverages.length; i++) {
    if (i > 0 && studentAverages[i].average < studentAverages[i - 1].average) {
      rank = i + 1
    }
    if (studentAverages[i].studentId === studentId) {
      break
    }
  }

  // Calculate student's average
  const thisStudentData = studentAverages.find((s) => s.studentId === studentId)
  const average = thisStudentData ? Math.round(thisStudentData.average * 100) / 100 : 0

  // Calculate class average
  const classAverage =
    studentAverages.length > 0
      ? Math.round((studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length) * 100) / 100
      : 0

  // Get council comment if exists
  const { data: comment } = await supabase
    .from("comments")
    .select("content")
    .eq("student_id", studentId)
    .eq("academic_period_id", periodId)
    .eq("type", "council")
    .single()

  return {
    student,
    class: student.class,
    period,
    subjects,
    grades,
    groupAverages,
    average,
    rank,
    classSize: classStudents.length,
    classAverage,
    distinction: getDistinction(average),
    councilComment: comment?.content,
  }
}

export async function generateLevelBordereauData(
  levelId: string,
  sectionId: string,
  periodId: string,
): Promise<{
  level: any
  section: any
  period: any
  classes: ClassReportData[]
} | null> {
  const supabase = await createClient()

  // Get level info
  const { data: level } = await supabase.from("levels").select("*").eq("id", levelId).single()

  // Get section info
  const { data: section } = await supabase.from("sections").select("*").eq("id", sectionId).single()

  // Get period info
  const { data: period } = await supabase.from("academic_periods").select("*").eq("id", periodId).single()

  if (!level || !section || !period) return null

  // Get all classes in this level and section
  const { data: classes } = await supabase
    .from("classes")
    .select("id")
    .eq("level_id", levelId)
    .eq("section_id", sectionId)

  if (!classes) return null

  // Generate bordereau for each class
  const classReports: ClassReportData[] = []
  for (const cls of classes) {
    const report = await generateBordereauData(cls.id, periodId)
    if (report) {
      classReports.push(report)
    }
  }

  return {
    level,
    section,
    period,
    classes: classReports,
  }
}
