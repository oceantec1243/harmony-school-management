import type {
  Section,
  Level,
  Class,
  Student,
  SubjectGroup,
  Subject,
  LevelSubject,
  ClassSubject,
  AcademicPeriod,
  Grade,
  User,
} from "./types"

// Sections
export const sections: Section[] = [
  {
    id: "section-fr",
    name: "Francophone",
    description: "Section francophone",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "section-en",
    name: "Anglophone",
    description: "Section anglophone",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

// Levels
export const levels: Level[] = [
  { id: "level-6eme", name: "6ème", sectionId: "section-fr", order: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: "level-5eme", name: "5ème", sectionId: "section-fr", order: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: "level-4eme", name: "4ème", sectionId: "section-fr", order: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: "level-3eme", name: "3ème", sectionId: "section-fr", order: 4, createdAt: new Date(), updatedAt: new Date() },
  { id: "level-2nde", name: "2nde", sectionId: "section-fr", order: 5, createdAt: new Date(), updatedAt: new Date() },
  { id: "level-1ere", name: "1ère", sectionId: "section-fr", order: 6, createdAt: new Date(), updatedAt: new Date() },
  {
    id: "level-tle",
    name: "Terminale",
    sectionId: "section-fr",
    order: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "level-form1",
    name: "Form 1",
    sectionId: "section-en",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "level-form2",
    name: "Form 2",
    sectionId: "section-en",
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "level-form3",
    name: "Form 3",
    sectionId: "section-en",
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "level-form4",
    name: "Form 4",
    sectionId: "section-en",
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "level-form5",
    name: "Form 5",
    sectionId: "section-en",
    order: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Classes
export const classes: Class[] = [
  {
    id: "class-6a",
    name: "6ème A",
    levelId: "level-6eme",
    sectionId: "section-fr",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "M. Dupont",
    studentCount: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-6b",
    name: "6ème B",
    levelId: "level-6eme",
    sectionId: "section-fr",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "Mme Martin",
    studentCount: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-6c",
    name: "6ème C",
    levelId: "level-6eme",
    sectionId: "section-fr",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "M. Bernard",
    studentCount: 38,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-5a",
    name: "5ème A",
    levelId: "level-5eme",
    sectionId: "section-fr",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "Mme Durand",
    studentCount: 41,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-5b",
    name: "5ème B",
    levelId: "level-5eme",
    sectionId: "section-fr",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "M. Petit",
    studentCount: 39,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-4a",
    name: "4ème A",
    levelId: "level-4eme",
    sectionId: "section-fr",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "Mme Moreau",
    studentCount: 43,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-3a",
    name: "3ème A",
    levelId: "level-3eme",
    sectionId: "section-fr",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "M. Laurent",
    studentCount: 37,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-2nda",
    name: "2nde A",
    levelId: "level-2nde",
    sectionId: "section-fr",
    capacity: 50,
    academicYear: "2024-2025",
    classTeacher: "Mme Simon",
    studentCount: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-1eres",
    name: "1ère S",
    levelId: "level-1ere",
    sectionId: "section-fr",
    capacity: 40,
    academicYear: "2024-2025",
    classTeacher: "M. Michel",
    studentCount: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-tles",
    name: "Tle S",
    levelId: "level-tle",
    sectionId: "section-fr",
    capacity: 40,
    academicYear: "2024-2025",
    classTeacher: "Mme Garcia",
    studentCount: 32,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-f1a",
    name: "Form 1 A",
    levelId: "level-form1",
    sectionId: "section-en",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "Mr. Johnson",
    studentCount: 38,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "class-f2a",
    name: "Form 2 A",
    levelId: "level-form2",
    sectionId: "section-en",
    capacity: 45,
    academicYear: "2024-2025",
    classTeacher: "Mrs. Williams",
    studentCount: 36,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Subject Groups
export const subjectGroups: SubjectGroup[] = [
  { id: "group-1", name: "Groupe I - Langues", order: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: "group-2", name: "Groupe II - Sciences", order: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: "group-3", name: "Groupe III - Humanités", order: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: "group-4", name: "Groupe IV - Arts & Sports", order: 4, createdAt: new Date(), updatedAt: new Date() },
]

// Subjects
export const subjects: Subject[] = [
  {
    id: "subj-fr",
    name: "Français",
    code: "FR",
    subjectGroupId: "group-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-en",
    name: "Anglais",
    code: "EN",
    subjectGroupId: "group-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-de",
    name: "Allemand",
    code: "DE",
    subjectGroupId: "group-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-es",
    name: "Espagnol",
    code: "ES",
    subjectGroupId: "group-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-math",
    name: "Mathématiques",
    code: "MATH",
    subjectGroupId: "group-2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-phys",
    name: "Physique",
    code: "PHYS",
    subjectGroupId: "group-2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-chim",
    name: "Chimie",
    code: "CHIM",
    subjectGroupId: "group-2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { id: "subj-svt", name: "SVT", code: "SVT", subjectGroupId: "group-2", createdAt: new Date(), updatedAt: new Date() },
  {
    id: "subj-info",
    name: "Informatique",
    code: "INFO",
    subjectGroupId: "group-2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-hist",
    name: "Histoire",
    code: "HIST",
    subjectGroupId: "group-3",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-geo",
    name: "Géographie",
    code: "GEO",
    subjectGroupId: "group-3",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { id: "subj-emc", name: "EMC", code: "EMC", subjectGroupId: "group-3", createdAt: new Date(), updatedAt: new Date() },
  {
    id: "subj-philo",
    name: "Philosophie",
    code: "PHILO",
    subjectGroupId: "group-3",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { id: "subj-eps", name: "EPS", code: "EPS", subjectGroupId: "group-4", createdAt: new Date(), updatedAt: new Date() },
  {
    id: "subj-arts",
    name: "Arts Plastiques",
    code: "ARTS",
    subjectGroupId: "group-4",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subj-music",
    name: "Musique",
    code: "MUS",
    subjectGroupId: "group-4",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Academic Periods
export const academicPeriods: AcademicPeriod[] = [
  {
    id: "period-seq1",
    academicYear: "2024-2025",
    type: "sequence",
    name: "Séquence 1",
    number: 1,
    startDate: new Date("2024-09-02"),
    endDate: new Date("2024-10-18"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-seq2",
    academicYear: "2024-2025",
    type: "sequence",
    name: "Séquence 2",
    number: 2,
    startDate: new Date("2024-10-21"),
    endDate: new Date("2024-12-13"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-trim1",
    academicYear: "2024-2025",
    type: "trimester",
    name: "Trimestre 1",
    number: 1,
    startDate: new Date("2024-09-02"),
    endDate: new Date("2024-12-13"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-seq3",
    academicYear: "2024-2025",
    type: "sequence",
    name: "Séquence 3",
    number: 3,
    startDate: new Date("2025-01-06"),
    endDate: new Date("2025-02-21"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-seq4",
    academicYear: "2024-2025",
    type: "sequence",
    name: "Séquence 4",
    number: 4,
    startDate: new Date("2025-02-24"),
    endDate: new Date("2025-04-11"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-trim2",
    academicYear: "2024-2025",
    type: "trimester",
    name: "Trimestre 2",
    number: 2,
    startDate: new Date("2025-01-06"),
    endDate: new Date("2025-04-11"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-seq5",
    academicYear: "2024-2025",
    type: "sequence",
    name: "Séquence 5",
    number: 5,
    startDate: new Date("2025-04-28"),
    endDate: new Date("2025-05-30"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-seq6",
    academicYear: "2024-2025",
    type: "sequence",
    name: "Séquence 6",
    number: 6,
    startDate: new Date("2025-06-02"),
    endDate: new Date("2025-06-27"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-trim3",
    academicYear: "2024-2025",
    type: "trimester",
    name: "Trimestre 3",
    number: 3,
    startDate: new Date("2025-04-28"),
    endDate: new Date("2025-06-27"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "period-year",
    academicYear: "2024-2025",
    type: "year",
    name: "Année 2024-2025",
    number: 1,
    startDate: new Date("2024-09-02"),
    endDate: new Date("2025-06-27"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Generate Students
const firstNames = [
  "Jean",
  "Marie",
  "Paul",
  "Sophie",
  "Pierre",
  "Emma",
  "Louis",
  "Chloé",
  "Lucas",
  "Léa",
  "Hugo",
  "Camille",
  "Nathan",
  "Sarah",
  "Thomas",
  "Julie",
  "Maxime",
  "Laura",
  "Antoine",
  "Manon",
  "Alexandre",
  "Clara",
  "Raphaël",
  "Inès",
  "Nicolas",
  "Zoé",
  "Gabriel",
  "Alice",
  "Adam",
  "Lola",
]
const lastNames = [
  "Martin",
  "Bernard",
  "Dubois",
  "Thomas",
  "Robert",
  "Richard",
  "Petit",
  "Durand",
  "Leroy",
  "Moreau",
  "Simon",
  "Laurent",
  "Lefebvre",
  "Michel",
  "Garcia",
  "David",
  "Bertrand",
  "Roux",
  "Vincent",
  "Fournier",
  "Morel",
  "Girard",
  "André",
  "Mercier",
  "Dupont",
  "Lambert",
  "Bonnet",
  "François",
  "Martinez",
  "Legrand",
]
const places = [
  "Yaoundé",
  "Douala",
  "Bafoussam",
  "Garoua",
  "Bamenda",
  "Maroua",
  "Ngaoundéré",
  "Bertoua",
  "Ebolowa",
  "Kribi",
]

function generateStudents(): Student[] {
  const students: Student[] = []
  let studentIndex = 1

  classes.forEach((cls) => {
    const section = sections.find((s) => s.id === cls.sectionId)
    const sectionCode = section?.name === "Francophone" ? "FR" : "EN"
    const count = cls.studentCount || 35

    for (let i = 0; i < count; i++) {
      const gender = Math.random() > 0.5 ? "M" : "F"
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const birthYear = 2008 + Math.floor(Math.random() * 6)
      const birthMonth = Math.floor(Math.random() * 12) + 1
      const birthDay = Math.floor(Math.random() * 28) + 1

      students.push({
        id: `student-${studentIndex}`,
        matricule: `2024-${sectionCode}-${String(studentIndex).padStart(3, "0")}`,
        firstName,
        lastName,
        dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
        placeOfBirth: places[Math.floor(Math.random() * places.length)],
        gender,
        classId: cls.id,
        fatherName: `M. ${lastName}`,
        fatherPhone: `+237 6${Math.floor(Math.random() * 90000000 + 10000000)}`,
        motherName: `Mme ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        motherPhone: `+237 6${Math.floor(Math.random() * 90000000 + 10000000)}`,
        address: `Quartier ${places[Math.floor(Math.random() * places.length)]}`,
        status: "Active",
        enrollmentDate: new Date("2024-09-02"),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      studentIndex++
    }
  })

  return students
}

export const students = generateStudents()

// Level Subjects (Tronc commun)
export const levelSubjects: LevelSubject[] = [
  // 6ème
  {
    id: "ls-6-fr",
    subjectId: "subj-fr",
    levelId: "level-6eme",
    sectionId: "section-fr",
    coefficient: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ls-6-en",
    subjectId: "subj-en",
    levelId: "level-6eme",
    sectionId: "section-fr",
    coefficient: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ls-6-math",
    subjectId: "subj-math",
    levelId: "level-6eme",
    sectionId: "section-fr",
    coefficient: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ls-6-svt",
    subjectId: "subj-svt",
    levelId: "level-6eme",
    sectionId: "section-fr",
    coefficient: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ls-6-hist",
    subjectId: "subj-hist",
    levelId: "level-6eme",
    sectionId: "section-fr",
    coefficient: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ls-6-geo",
    subjectId: "subj-geo",
    levelId: "level-6eme",
    sectionId: "section-fr",
    coefficient: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ls-6-eps",
    subjectId: "subj-eps",
    levelId: "level-6eme",
    sectionId: "section-fr",
    coefficient: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more as needed
]

// Class Subjects (Specialties)
export const classSubjects: ClassSubject[] = [
  {
    id: "cs-6a-info",
    subjectId: "subj-info",
    classId: "class-6a",
    coefficient: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cs-6a-arts",
    subjectId: "subj-arts",
    classId: "class-6a",
    coefficient: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Generate Grades
function generateGrades(): Grade[] {
  const grades: Grade[] = []
  let gradeIndex = 1

  students.slice(0, 200).forEach((student) => {
    const cls = classes.find((c) => c.id === student.classId)
    if (!cls) return

    // Get subjects for this class
    const relevantLevelSubjects = levelSubjects.filter(
      (ls) => ls.levelId === cls.levelId && ls.sectionId === cls.sectionId,
    )

    // Generate grades for sequence 1
    relevantLevelSubjects.forEach((ls) => {
      const baseScore = 8 + Math.random() * 10 // 8-18
      grades.push({
        id: `grade-${gradeIndex}`,
        studentId: student.id,
        subjectId: ls.subjectId,
        levelSubjectId: ls.id,
        academicPeriodId: "period-seq1",
        score: Math.round(baseScore * 100) / 100,
        coefficient: ls.coefficient,
        enteredBy: "user-admin",
        enteredAt: new Date(),
        updatedAt: new Date(),
      })
      gradeIndex++
    })
  })

  return grades
}

export const grades = generateGrades()

// Users
export const users: User[] = [
  {
    id: "user-admin",
    email: "admin@harmony.edu",
    firstName: "Admin",
    lastName: "Principal",
    role: "admin",
    phone: "+237 699000001",
    status: "active",
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user-teacher1",
    email: "dupont@harmony.edu",
    firstName: "Jean",
    lastName: "Dupont",
    role: "teacher",
    phone: "+237 699000002",
    status: "active",
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user-teacher2",
    email: "martin@harmony.edu",
    firstName: "Marie",
    lastName: "Martin",
    role: "teacher",
    phone: "+237 699000003",
    status: "active",
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Statistics helpers
export function getStatistics() {
  const totalStudents = students.length
  const totalClasses = classes.length
  const totalSubjects = subjects.length
  const totalTeachers = users.filter((u) => u.role === "teacher").length

  const activeStudents = students.filter((s) => s.status === "Active").length

  const francophoneStudents = students.filter((s) => {
    const cls = classes.find((c) => c.id === s.classId)
    return cls?.sectionId === "section-fr"
  }).length

  const anglophoneStudents = totalStudents - francophoneStudents

  // Calculate average
  const studentAverages: number[] = []
  const studentIds = [...new Set(grades.map((g) => g.studentId))]

  studentIds.forEach((studentId) => {
    const studentGrades = grades.filter((g) => g.studentId === studentId)
    if (studentGrades.length === 0) return

    let totalWeighted = 0
    let totalCoef = 0

    studentGrades.forEach((g) => {
      totalWeighted += g.score * g.coefficient
      totalCoef += g.coefficient
    })

    if (totalCoef > 0) {
      studentAverages.push(totalWeighted / totalCoef)
    }
  })

  const schoolAverage =
    studentAverages.length > 0 ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length : 0

  const passRate = (studentAverages.filter((avg) => avg >= 10).length / studentAverages.length) * 100

  return {
    totalStudents,
    totalClasses,
    totalSubjects,
    totalTeachers,
    activeStudents,
    francophoneStudents,
    anglophoneStudents,
    schoolAverage: Math.round(schoolAverage * 100) / 100,
    passRate: Math.round(passRate * 10) / 10,
  }
}

// Get students by class
export function getStudentsByClass(classId: string) {
  return students.filter((s) => s.classId === classId)
}

// Get class subjects (merged from level and class)
export function getClassSubjects(classId: string) {
  const cls = classes.find((c) => c.id === classId)
  if (!cls) return []

  const clsSubjects = classSubjects.filter((cs) => cs.classId === classId)
  const lvlSubjects = levelSubjects.filter((ls) => ls.levelId === cls.levelId && ls.sectionId === cls.sectionId)

  const classSubjectIds = new Set(clsSubjects.map((cs) => cs.subjectId))
  const uniqueLevelSubjects = lvlSubjects.filter((ls) => !classSubjectIds.has(ls.subjectId))

  const result = [
    ...clsSubjects.map((cs) => ({
      ...cs,
      subject: subjects.find((s) => s.id === cs.subjectId),
      source: "class" as const,
    })),
    ...uniqueLevelSubjects.map((ls) => ({
      ...ls,
      subject: subjects.find((s) => s.id === ls.subjectId),
      source: "level" as const,
    })),
  ]

  return result.sort((a, b) => {
    const groupA = subjectGroups.find((g) => g.id === a.subject?.subjectGroupId)?.order || 0
    const groupB = subjectGroups.find((g) => g.id === b.subject?.subjectGroupId)?.order || 0
    return groupA - groupB
  })
}
