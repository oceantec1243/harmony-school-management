"use server"

import { createClient } from "@/lib/supabase/server"

// ========================================
// SECTIONS
// ========================================
export async function getSections() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("sections").select("*").order("name")

  if (error) throw error
  return data
}

// ========================================
// LEVELS
// ========================================
export async function getLevels(sectionId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("levels")
    .select(`
      *,
      section:sections(*)
    `)
    .order("order")

  if (sectionId) {
    query = query.eq("section_id", sectionId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// ========================================
// CLASSES
// ========================================
export async function getClasses(levelId?: string, sectionId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("classes")
    .select(`
      *,
      level:levels(*),
      section:sections(*)
    `)
    .order("name")

  if (levelId) {
    query = query.eq("level_id", levelId)
  }
  if (sectionId) {
    query = query.eq("section_id", sectionId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getClassById(classId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      level:levels(*),
      section:sections(*)
    `)
    .eq("id", classId)
    .single()

  if (error) throw error
  return data
}

export async function getClassStudentCount(classId: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("status", "Active")

  if (error) throw error
  return count || 0
}

export async function createClass(data: {
  name: string
  level_id: string
  section_id: string
  capacity: number
  class_teacher?: string
  academic_year: string
}) {
  const supabase = await createClient()
  const { data: newClass, error } = await supabase.from("classes").insert(data).select().single()

  if (error) throw error
  return newClass
}

export async function updateClass(
  id: string,
  data: Partial<{
    name: string
    level_id: string
    section_id: string
    capacity: number
    class_teacher: string
  }>,
) {
  const supabase = await createClient()
  const { data: updated, error } = await supabase.from("classes").update(data).eq("id", id).select().single()

  if (error) throw error
  return updated
}

export async function deleteClass(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("classes").delete().eq("id", id)

  if (error) throw error
}

// ========================================
// STUDENTS
// ========================================
export async function getStudents(filters?: {
  classId?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  let query = supabase
    .from("students")
    .select(
      `
      *,
      class:classes(
        *,
        level:levels(*),
        section:sections(*)
      )
    `,
      { count: "exact" },
    )
    .order("last_name")
    .order("first_name")

  if (filters?.classId) {
    query = query.eq("class_id", filters.classId)
  }
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,matricule.ilike.%${filters.search}%`,
    )
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data, count }
}

export async function getStudentById(studentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
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

  if (error) throw error
  return data
}

export async function createStudent(data: {
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string
  place_of_birth?: string
  gender: "M" | "F"
  class_id: string
  father_name?: string
  father_phone?: string
  mother_name?: string
  mother_phone?: string
  guardian_name?: string
  guardian_phone?: string
  address?: string
}) {
  const supabase = await createClient()
  const { data: newStudent, error } = await supabase.from("students").insert(data).select().single()

  if (error) throw error
  return newStudent
}

export async function updateStudent(
  id: string,
  data: Partial<{
    first_name: string
    last_name: string
    date_of_birth: string
    place_of_birth: string
    gender: "M" | "F"
    photo: string
    class_id: string
    father_name: string
    father_phone: string
    mother_name: string
    mother_phone: string
    guardian_name: string
    guardian_phone: string
    address: string
    status: "Active" | "Suspended" | "Graduated"
  }>,
) {
  const supabase = await createClient()
  const { data: updated, error } = await supabase.from("students").update(data).eq("id", id).select().single()

  if (error) throw error
  return updated
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) throw error
}

export async function generateMatricule(sectionId: string, academicYear: string) {
  const supabase = await createClient()

  // Get section code
  const { data: section } = await supabase.from("sections").select("name").eq("id", sectionId).single()

  const sectionCode = section?.name === "Francophone" ? "FR" : "EN"
  const year = academicYear.split("-")[0]

  // Count existing students with this prefix
  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .ilike("matricule", `${year}-${sectionCode}-%`)

  const number = String((count || 0) + 1).padStart(3, "0")
  return `${year}-${sectionCode}-${number}`
}

// ========================================
// SUBJECT GROUPS
// ========================================
export async function getSubjectGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("subject_groups").select("*").order("order")

  if (error) throw error
  return data
}

// ========================================
// SUBJECTS
// ========================================
export async function getSubjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("subjects")
    .select(`
      *,
      subject_group:subject_groups(*)
    `)
    .order("name")

  if (error) throw error
  return data
}

export async function createSubject(data: {
  name: string
  code: string
  subject_group_id: string
  description?: string
}) {
  const supabase = await createClient()
  const { data: newSubject, error } = await supabase.from("subjects").insert(data).select().single()

  if (error) throw error
  return newSubject
}

// ========================================
// CLASS SUBJECTS (with teacher assignment)
// ========================================
export async function getClassSubjects(classId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_subjects")
    .select(`
      *,
      subject:subjects(
        *,
        subject_group:subject_groups(*)
      ),
      teacher:teachers(*)
    `)
    .eq("class_id", classId)
    .order("coefficient", { ascending: false })

  if (error) throw error
  return data
}

export async function assignTeacherToSubject(classSubjectId: string, teacherId: string | null) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_subjects")
    .update({ teacher_id: teacherId })
    .eq("id", classSubjectId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClassSubjectCoefficient(classSubjectId: string, coefficient: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_subjects")
    .update({ coefficient })
    .eq("id", classSubjectId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addSubjectToClass(classId: string, subjectId: string, coefficient: number, teacherId?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("class_subjects")
    .insert({
      class_id: classId,
      subject_id: subjectId,
      coefficient,
      teacher_id: teacherId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeSubjectFromClass(classSubjectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("class_subjects").delete().eq("id", classSubjectId)

  if (error) throw error
}

// ========================================
// TEACHERS
// ========================================
export async function getTeachers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("teachers").select("*").eq("status", "active").order("last_name")

  if (error) throw error
  return data
}

export async function createTeacher(data: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  specialization?: string
}) {
  const supabase = await createClient()
  const { data: newTeacher, error } = await supabase.from("teachers").insert(data).select().single()

  if (error) throw error
  return newTeacher
}

// ========================================
// ACADEMIC PERIODS
// ========================================
export async function getAcademicPeriods(academicYear?: string, type?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("academic_periods")
    .select(`
      *,
      parent:academic_periods(*)
    `)
    .order("number")

  if (academicYear) {
    query = query.eq("academic_year", academicYear)
  }
  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getSequencesForTrimester(trimesterId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("academic_periods")
    .select("*")
    .eq("parent_id", trimesterId)
    .eq("type", "sequence")
    .order("number")

  if (error) throw error
  return data
}

// ========================================
// GRADES
// ========================================
export async function getGrades(filters: {
  classId?: string
  studentId?: string
  subjectId?: string
  periodId?: string
}) {
  const supabase = await createClient()
  let query = supabase.from("grades").select(`
      *,
      student:students(*),
      subject:subjects(
        *,
        subject_group:subject_groups(*)
      ),
      academic_period:academic_periods(*)
    `)

  if (filters.studentId) {
    query = query.eq("student_id", filters.studentId)
  }
  if (filters.subjectId) {
    query = query.eq("subject_id", filters.subjectId)
  }
  if (filters.periodId) {
    query = query.eq("academic_period_id", filters.periodId)
  }
  if (filters.classId) {
    // Need to join through students
    const { data: students } = await supabase.from("students").select("id").eq("class_id", filters.classId)

    if (students) {
      const studentIds = students.map((s) => s.id)
      query = query.in("student_id", studentIds)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function saveGrade(data: {
  student_id: string
  subject_id: string
  academic_period_id: string
  score: number
  coefficient: number
  class_subject_id?: string
}) {
  const supabase = await createClient()

  // Use upsert to handle both insert and update
  const { data: grade, error } = await supabase
    .from("grades")
    .upsert(
      {
        student_id: data.student_id,
        subject_id: data.subject_id,
        academic_period_id: data.academic_period_id,
        score: data.score,
        coefficient: data.coefficient,
        class_subject_id: data.class_subject_id,
      },
      {
        onConflict: "student_id,subject_id,academic_period_id",
      },
    )
    .select()
    .single()

  if (error) throw error
  return grade
}

export async function saveGradesBulk(
  grades: Array<{
    student_id: string
    subject_id: string
    academic_period_id: string
    score: number
    coefficient: number
    class_subject_id?: string
  }>,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("grades")
    .upsert(grades, {
      onConflict: "student_id,subject_id,academic_period_id",
    })
    .select()

  if (error) throw error
  return data
}

// ========================================
// SCHOOL SETTINGS
// ========================================
export async function getSchoolSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("school_settings").select("*").single()

  if (error && error.code !== "PGRST116") throw error
  return data
}

export async function updateSchoolSettings(
  data: Partial<{
    school_name: string
    school_slogan: string
    logo_url: string
    watermark_url: string
    address: string
    phone: string
    email: string
    website: string
    current_academic_year: string
    grading_scale: number
  }>,
) {
  const supabase = await createClient()

  // First check if settings exist
  const { data: existing } = await supabase.from("school_settings").select("id").single()

  if (existing) {
    const { data: updated, error } = await supabase
      .from("school_settings")
      .update(data)
      .eq("id", existing.id)
      .select()
      .single()

    if (error) throw error
    return updated
  } else {
    const { data: created, error } = await supabase.from("school_settings").insert(data).select().single()

    if (error) throw error
    return created
  }
}

// ========================================
// STATISTICS
// ========================================
export async function getDashboardStats() {
  const supabase = await createClient()

  // Get counts
  const [studentsResult, classesResult, subjectsResult, teachersResult] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "Active"),
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase.from("subjects").select("*", { count: "exact", head: true }),
    supabase.from("teachers").select("*", { count: "exact", head: true }).eq("status", "active"),
  ])

  // Get grade statistics for current year
  const { data: grades } = await supabase.from("grades").select("score")

  let passRate = 0
  let schoolAverage = 0

  if (grades && grades.length > 0) {
    const passing = grades.filter((g) => g.score >= 10).length
    passRate = Math.round((passing / grades.length) * 100)
    schoolAverage = grades.reduce((sum, g) => sum + g.score, 0) / grades.length
  }

  return {
    totalStudents: studentsResult.count || 0,
    totalClasses: classesResult.count || 0,
    totalSubjects: subjectsResult.count || 0,
    totalTeachers: teachersResult.count || 0,
    passRate,
    schoolAverage: Math.round(schoolAverage * 100) / 100,
  }
}

export async function getStudentsBySection() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      class:classes(
        section:sections(name)
      )
    `)
    .eq("status", "Active")

  if (error) throw error

  const francophone = data?.filter((s) => s.class?.section?.name === "Francophone").length || 0
  const anglophone = data?.filter((s) => s.class?.section?.name === "Anglophone").length || 0

  return [
    { name: "Francophone", value: francophone, color: "#1E40AF" },
    { name: "Anglophone", value: anglophone, color: "#7C3AED" },
  ]
}

export async function getTopStudents(periodId: string, limit = 10) {
  const supabase = await createClient()

  // Get all grades for the period
  const { data: grades, error } = await supabase
    .from("grades")
    .select(`
      student_id,
      score,
      coefficient,
      student:students(
        id,
        first_name,
        last_name,
        matricule,
        class:classes(name)
      )
    `)
    .eq("academic_period_id", periodId)

  if (error) throw error
  if (!grades) return []

  // Calculate average for each student
  const studentAverages: Record<
    string,
    {
      student: any
      totalWeighted: number
      totalCoef: number
    }
  > = {}

  grades.forEach((g) => {
    if (!studentAverages[g.student_id]) {
      studentAverages[g.student_id] = {
        student: g.student,
        totalWeighted: 0,
        totalCoef: 0,
      }
    }
    studentAverages[g.student_id].totalWeighted += g.score * g.coefficient
    studentAverages[g.student_id].totalCoef += g.coefficient
  })

  const results = Object.entries(studentAverages)
    .map(([id, data]) => ({
      student: data.student,
      average: data.totalCoef > 0 ? data.totalWeighted / data.totalCoef : 0,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, limit)

  // Add ranks
  let currentRank = 1
  return results.map((r, index) => {
    if (index > 0 && r.average < results[index - 1].average) {
      currentRank = index + 1
    }
    return { ...r, rank: currentRank }
  })
}
