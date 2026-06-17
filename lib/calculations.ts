// HARMONY Calculation Utilities

// Calculate weighted average
export function calculateWeightedAverage(grades: { score: number; coefficient: number }[]): number {
  if (grades.length === 0) return 0

  let totalWeighted = 0
  let totalCoef = 0

  grades.forEach((g) => {
    totalWeighted += g.score * g.coefficient
    totalCoef += g.coefficient
  })

  return totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : 0
}

// Get appreciation based on score
export function getAppreciation(score: number): string {
  if (score >= 18) return "Excellent"
  if (score >= 16) return "Très bien"
  if (score >= 14) return "Bien"
  if (score >= 12) return "Assez bien"
  if (score >= 10) return "Passable"
  if (score >= 8) return "Insuffisant"
  return "Très insuffisant"
}

// Get short appreciation
export function getShortAppreciation(score: number): string {
  if (score >= 18) return "Exc"
  if (score >= 16) return "TB"
  if (score >= 14) return "B"
  if (score >= 12) return "AB"
  if (score >= 10) return "P"
  if (score >= 8) return "Ins"
  return "TI"
}

// Get distinction based on average
export function getDistinction(average: number): string {
  if (average >= 16) return "Tableau d'excellence"
  if (average >= 14) return "Tableau d'honneur"
  if (average >= 12) return "Encouragements"
  if (average >= 10) return "Passable"
  return "Doit redoubler ses efforts"
}

// Get appreciation color
export function getAppreciationColor(score: number): string {
  if (score >= 16) return "text-emerald-600"
  if (score >= 14) return "text-green-600"
  if (score >= 12) return "text-blue-600"
  if (score >= 10) return "text-amber-600"
  return "text-red-600"
}

// Get appreciation background color
export function getAppreciationBgColor(score: number): string {
  if (score >= 16) return "bg-emerald-50"
  if (score >= 14) return "bg-green-50"
  if (score >= 12) return "bg-blue-50"
  if (score >= 10) return "bg-amber-50"
  return "bg-red-50"
}

// Calculate ranks with ties
export function calculateRanks<T extends { average: number }>(items: T[]): (T & { rank: number })[] {
  const sorted = [...items].sort((a, b) => b.average - a.average)

  let currentRank = 1
  return sorted.map((item, index) => {
    if (index > 0 && item.average < sorted[index - 1].average) {
      currentRank = index + 1
    }
    return { ...item, rank: currentRank }
  })
}

// Format rank
export function formatRank(rank: number): string {
  if (rank === 1) return "1er"
  return `${rank}ème`
}

// Format rank with suffix
export function formatRankWithSuffix(rank: number, total: number): string {
  return `${formatRank(rank)} / ${total}`
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: Date | string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Format date to French locale
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

// Format short date
export function formatShortDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Generate initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Get color from string (for avatars)
export function getColorFromString(str: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-emerald-500",
  ]

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Trimester calculation from sequences
export function calculateTrimesterAverage(seq1: number | null, seq2: number | null): number | null {
  if (seq1 === null && seq2 === null) return null
  if (seq1 === null) return seq2
  if (seq2 === null) return seq1
  return Math.round(((seq1 + seq2) / 2) * 100) / 100
}

// Annual average from trimesters
export function calculateAnnualAverage(
  trim1: number | null,
  trim2: number | null,
  trim3: number | null,
): number | null {
  const trimesters = [trim1, trim2, trim3].filter((t) => t !== null) as number[]
  if (trimesters.length === 0) return null
  return Math.round((trimesters.reduce((a, b) => a + b, 0) / trimesters.length) * 100) / 100
}

// Get pass/fail status
export function getPassStatus(average: number): { passed: boolean; message: string } {
  if (average >= 10) {
    return { passed: true, message: "Admis(e)" }
  }
  return { passed: false, message: "Ajourné(e)" }
}

// Class progression map
const CLASS_PROGRESSIONS: Record<string, Record<string, string>> = {
  francophone: {
    "6ème": "5ème",
    "5ème": "4ème",
    "4ème": "3ème",
    "3ème": "Seconde",
    "Seconde": "Première",
    "Première": "Terminale",
  },
  anglophone: {
    "Form 1": "Form 2",
    "Form 2": "Form 3",
    "Form 3": "Form 4",
    "Form 4": "Form 5",
    "Form 5": "Upper 6",
  },
}

// Get next class based on current level and section
export function getNextClass(currentClass: string, section: string): string | null {
  const sectionKey = section?.toLowerCase().includes("anglophone") ? "anglophone" : "francophone"
  const progressions = CLASS_PROGRESSIONS[sectionKey]

  if (!progressions) return null

  // Try to find exact match or similar match
  const cleanedClass = currentClass.trim()
  
  for (const [key, value] of Object.entries(progressions)) {
    if (cleanedClass === key || cleanedClass.toLowerCase() === key.toLowerCase()) {
      return value
    }
  }

  // If no match found, return null (already at terminal level)
  return null
}

export interface PromotionResult {
  promoted: boolean
  nextClass: string | null
  decision: string
}

// Determine promotion decision
export function determinePromotion(
  average: number,
  currentClass: string,
  section: string,
  isRanked: boolean,
  minPromotionAvg: number = 10,
  minRattrapageAvg: number = 8,
  targetClassName: string | null = null
): PromotionResult {
  // Must be ranked to be promoted
  if (!isRanked) {
    return { promoted: false, nextClass: null, decision: "Non Classé - Redoublement" }
  }

  if (average >= minPromotionAvg) {
    const nextClass = targetClassName || getNextClass(currentClass, section)
    return { promoted: true, nextClass, decision: nextClass ? `Promu(e) en ${nextClass}` : "Admis(e) - Fin de cycle" }
  }

  if (average >= minRattrapageAvg) {
    return { promoted: false, nextClass: null, decision: "Admis(e) au Rattrapage" }
  }

  return { promoted: false, nextClass: null, decision: "Redouble la classe" }
}
