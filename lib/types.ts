// HARMONY Type Definitions

export type Section = {
  id: string
  name: "Francophone" | "Anglophone"
  description: string
  createdAt: Date
  updatedAt: Date
}

export type Level = {
  id: string
  name: string
  sectionId: string
  section?: Section
  order: number
  createdAt: Date
  updatedAt: Date
}

export type Class = {
  id: string
  name: string
  levelId: string
  level?: Level
  sectionId: string
  section?: Section
  capacity: number
  academicYear: string
  classTeacher: string
  studentCount?: number
  createdAt: Date
  updatedAt: Date
}

export type StudentStatus = "Active" | "Suspended" | "Graduated"
export type Gender = "M" | "F"

export type Student = {
  id: string
  matricule: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  placeOfBirth: string
  gender: Gender
  photo?: string
  classId: string
  class?: Class
  fatherName: string
  fatherPhone: string
  motherName: string
  motherPhone: string
  guardianName?: string
  guardianPhone?: string
  address: string
  status: StudentStatus
  enrollmentDate: Date
  createdAt: Date
  updatedAt: Date
}

export type SubjectGroup = {
  id: string
  name: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export type Subject = {
  id: string
  name: string
  code: string
  subjectGroupId: string
  subjectGroup?: SubjectGroup
  description?: string
  createdAt: Date
  updatedAt: Date
}

export type LevelSubject = {
  id: string
  subjectId: string
  subject?: Subject
  levelId: string
  level?: Level
  sectionId: string
  section?: Section
  coefficient: number
  createdAt: Date
  updatedAt: Date
}

export type ClassSubject = {
  id: string
  subjectId: string
  subject?: Subject
  classId: string
  class?: Class
  coefficient: number
  teacherId?: string
  createdAt: Date
  updatedAt: Date
}

export type PeriodType = "sequence" | "trimester" | "year"

export type AcademicPeriod = {
  id: string
  academicYear: string
  type: PeriodType
  name: string
  number: number
  startDate: Date
  endDate: Date
  parentId?: string
  parent?: AcademicPeriod
  createdAt: Date
  updatedAt: Date
}

export type Grade = {
  id: string
  studentId: string
  student?: Student
  subjectId: string
  subject?: Subject
  classSubjectId?: string
  levelSubjectId?: string
  academicPeriodId: string
  academicPeriod?: AcademicPeriod
  score: number
  coefficient: number
  enteredBy: string
  enteredAt: Date
  updatedAt: Date
}

export type UserRole = "admin" | "teacher" | "staff"
export type UserStatus = "active" | "inactive"

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  photo?: string
  status: UserStatus
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export type CommentType = "conduct" | "council" | "subject"

export type Comment = {
  id: string
  studentId: string
  student?: Student
  academicPeriodId: string
  academicPeriod?: AcademicPeriod
  type: CommentType
  subjectId?: string
  subject?: Subject
  content: string
  authorId: string
  author?: User
  createdAt: Date
  updatedAt: Date
}

// Calculated types for reports
export type StudentGradeReport = {
  student: Student
  grades: Record<string, number> // subjectId -> score
  average: number
  rank: number
  totalCoefficient: number
}

export type ClassReport = {
  class: Class
  period: AcademicPeriod
  subjects: (Subject & { coefficient: number; source: "level" | "class" })[]
  students: StudentGradeReport[]
  classAverage: number
  subjectAverages: Record<string, number>
}
