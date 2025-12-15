"use client"
import type { SchoolSettings, Subject } from "./types" // Declare SchoolSettings and Subject types

type BulletinData = {
  student: {
    first_name: string
    last_name: string
    matricule: string
    date_of_birth: string
    place_of_birth: string
    gender?: string // Added gender field
  }
  class: {
    name: string
  }
  period: {
    name: string
    type: string
    academic_year?: string // Added academic_year field
  }
  attendance?: {
    total_hours: number
    justified_hours: number
    unjustified_hours: number
  }
  subjects: Array<{
    name: string
    teacher?: string
    coefficient: number
    score1?: number
    score2?: number
    average: number
    group: string
    rank?: number
    classSize?: number
  }>
  average: number
  rank: number | string
  classSize: number
  classAverage: number
  appreciation: string
  distinction: string
  schoolSettings: SchoolSettings
  section?: string
  schoolInfo?: {
    poBox?: string
    logo?: string
  }
}

let cachedLogo: HTMLImageElement | null = null
let cachedLogoUrl: string | null = null

async function loadLogo(logoUrl: string): Promise<HTMLImageElement | null> {
  if (!logoUrl) return null

  // Return cached logo if URL matches
  if (cachedLogoUrl === logoUrl && cachedLogo) {
    return cachedLogo
  }

  try {
    const img = new Image()
    img.crossOrigin = "anonymous"
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Failed to load logo"))
      // Add timeout to prevent hanging
      setTimeout(() => reject(new Error("Logo load timeout")), 3000)
      img.src = logoUrl
    })
    cachedLogo = img
    cachedLogoUrl = logoUrl
    return img
  } catch {
    return null
  }
}

function safeNum(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return "-"
  return value.toFixed(decimals)
}

function numOrZero(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) return 0
  return value
}

function getGradeColor(grade: number | undefined): [number, number, number] {
  if (grade === undefined || isNaN(grade)) return [148, 163, 184]
  if (grade < 10) return [220, 38, 38]
  if (grade < 12) return [245, 158, 11]
  if (grade < 15) return [37, 99, 235]
  return [22, 163, 74]
}

function getAppreciation(score: number, isAnglophone = false): string {
  if (score >= 18) return isAnglophone ? "Excellent" : "Excellent"
  if (score >= 16) return isAnglophone ? "Very Good" : "Très Bien"
  if (score >= 14) return isAnglophone ? "Good" : "Bien"
  if (score >= 12) return isAnglophone ? "Fairly Good" : "Assez Bien"
  if (score >= 10) return isAnglophone ? "Average" : "Passable"
  if (score >= 8) return isAnglophone ? "Insufficient" : "Insuffisant"
  if (score >= 5) return isAnglophone ? "Poor" : "Médiocre"
  return isAnglophone ? "Very Poor" : "Très Faible"
}

function getDistinction(average: number | undefined): string {
  if (average === undefined || isNaN(average)) return "-"
  if (average >= 16) return "Tableau d'Honneur"
  if (average >= 14) return "Tableau d'Encouragement"
  if (average >= 12) return "Félicitations"
  if (average >= 10) return "Admis"
  return "Doit redoubler d'efforts"
}

function generateIntelligentObservation(
  average: number,
  subjects: Array<{ name: string; average: number; coefficient: number }>,
  attendance?: { total_hours: number; justified_hours: number; unjustified_hours: number },
  isAnglophone = false,
): string {
  const observations: string[] = []

  if (isAnglophone) {
    // English version for Anglophone section
    if (average >= 16) {
      observations.push("Excellent work during this period.")
    } else if (average >= 14) {
      observations.push("Very good work. Serious and diligent student.")
    } else if (average >= 12) {
      observations.push("Good work overall.")
    } else if (average >= 10) {
      observations.push("Acceptable results but can be improved.")
    } else {
      observations.push("Insufficient results. More sustained effort required.")
    }

    const weakSubjects = subjects.filter((s) => s.average < 10).sort((a, b) => a.average - b.average)

    if (weakSubjects.length > 0) {
      const subjectNames = weakSubjects
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ")
      observations.push(`Must improve in: ${subjectNames}.`)
    } else if (average >= 12) {
      const improvableSubjects = subjects.filter((s) => s.average >= 10 && s.average < 12)
      if (improvableSubjects.length > 0) {
        const subjectNames = improvableSubjects
          .slice(0, 2)
          .map((s) => s.name)
          .join(", ")
        observations.push(`Can progress in: ${subjectNames}.`)
      }
    }

    if (attendance && attendance.unjustified_hours > 0) {
      if (attendance.unjustified_hours > 10) {
        observations.push(
          `WARNING: ${attendance.unjustified_hours}h of unjustified absences! Attendance is imperative.`,
        )
      } else if (attendance.unjustified_hours > 5) {
        observations.push(`${attendance.unjustified_hours}h of unjustified absences. More regularity needed.`)
      } else {
        observations.push(`${attendance.unjustified_hours}h of unjustified absences to reduce.`)
      }
    } else if (attendance && attendance.total_hours === 0) {
      observations.push("Exemplary attendance. Keep it up!")
    }

    if (average >= 14) {
      observations.push("Keep up the good work!")
    } else if (average >= 10) {
      observations.push("More rigor and concentration needed.")
    } else {
      observations.push("Regular and serious work is essential to progress.")
    }
  } else {
    // French version (existing code)
    if (average >= 16) {
      observations.push("Excellent travail durant cette période.")
    } else if (average >= 14) {
      observations.push("Très bon travail. Élève sérieux et appliqué.")
    } else if (average >= 12) {
      observations.push("Bon travail dans l'ensemble.")
    } else if (average >= 10) {
      observations.push("Résultats acceptables mais peuvent être améliorés.")
    } else {
      observations.push("Résultats insuffisants. Travail plus soutenu requis.")
    }

    const weakSubjects = subjects.filter((s) => s.average < 10).sort((a, b) => a.average - b.average)

    if (weakSubjects.length > 0) {
      const subjectNames = weakSubjects
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ")
      observations.push(`Doit s'améliorer en: ${subjectNames}.`)
    } else if (average >= 12) {
      const improvableSubjects = subjects.filter((s) => s.average >= 10 && s.average < 12)
      if (improvableSubjects.length > 0) {
        const subjectNames = improvableSubjects
          .slice(0, 2)
          .map((s) => s.name)
          .join(", ")
        observations.push(`Peut progresser en: ${subjectNames}.`)
      }
    }

    if (attendance && attendance.unjustified_hours > 0) {
      if (attendance.unjustified_hours > 10) {
        observations.push(
          `ATTENTION: ${attendance.unjustified_hours}h d'absences non justifiées! L'assiduité est impérative.`,
        )
      } else if (attendance.unjustified_hours > 5) {
        observations.push(`${attendance.unjustified_hours}h d'absences non justifiées. Plus de régularité nécessaire.`)
      } else {
        observations.push(`${attendance.unjustified_hours}h d'absences non justifiées à réduire.`)
      }
    } else if (attendance && attendance.total_hours === 0) {
      observations.push("Assiduité exemplaire. Continuez ainsi!")
    }

    if (average >= 14) {
      observations.push("Continuez sur cette lancée!")
    } else if (average >= 10) {
      observations.push("Plus de rigueur et de concentration nécessaires.")
    } else {
      observations.push("Un travail régulier et sérieux est indispensable pour progresser.")
    }
  }

  return observations.join(" ")
}

// Helper function to draw fallback logo
function drawFallbackLogo(pdf: any, centerX: number, y: number, schoolSettings: any) {
  pdf.setFillColor(30, 64, 175)
  pdf.circle(centerX, y + 14, 12, "F")
  pdf.setFillColor(255, 255, 255)
  pdf.circle(centerX, y + 14, 10.5, "F")
  pdf.setFillColor(30, 64, 175)
  pdf.circle(centerX, y + 14, 9, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  const initials = (schoolSettings?.school_name || "H")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .substring(0, 4)
  pdf.text(initials, centerX, y + 16, { align: "center" })
}

function generateSingleBulletin(
  pdf: any,
  bulletinData: any,
  schoolSettings: any,
  isFirstPage = false,
  preloadedLogo: HTMLImageElement | null = null,
): void {
  if (!isFirstPage) {
    pdf.addPage()
  }

  const isAnglophone = bulletinData.isAnglophone || bulletinData.section?.toLowerCase().includes("anglo")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - margin * 2

  const {
    student = {} as BulletinData["student"],
    period = {} as BulletinData["period"],
    subjects = [],
    attendance,
    average = 0,
    rank = 0,
    classSize = 1,
    classAverage = 0,
    appreciation = "",
    distinction = "",
  } = bulletinData || {}

  const safeNum = (val: any): number => {
    const n = Number(val)
    return isNaN(n) ? 0 : n
  }

  const numOrZero = (val: any): number => safeNum(val)

  // Watermark
  pdf.setTextColor(200, 200, 200)
  pdf.setFontSize(50)
  pdf.setFont("helvetica", "bold")
  const watermarkText = schoolSettings?.school_name || "HARMONY"
  pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  })

  // Header
  let y = margin
  pdf.setFillColor(252, 251, 248)
  pdf.rect(margin, y, contentWidth, 35, "F")
  pdf.setDrawColor(30, 64, 175)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, 35, "S")

  const leftColX = margin + 3
  const rightColX = pageWidth - margin - 55
  const centerX = pageWidth / 2

  // Left column - French
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIQUE DU CAMEROUN", leftColX, y + 4)
  pdf.setFont("helvetica", "italic")
  pdf.text("Paix - Travail - Patrie", leftColX, y + 7)
  pdf.text("**********", leftColX, y + 10)
  pdf.setFont("helvetica", "bold")
  pdf.text("MINISTERE DES ENSEIGNEMENTS", leftColX, y + 13)
  pdf.text("SECONDAIRES", leftColX, y + 16)
  pdf.text("**********", leftColX, y + 19)
  pdf.setFontSize(5)
  pdf.text(schoolSettings?.school_name || "HARMONY School", leftColX, y + 22)
  pdf.text("**********", leftColX, y + 25)

  const poBox = schoolSettings?.po_box || "BP: ..."
  const tel = schoolSettings?.phone || "Tél: ..."
  pdf.setFont("helvetica", "normal")
  pdf.text(`BP: ${poBox}`, leftColX, y + 28)
  pdf.text(`Tél: ${tel}`, leftColX, y + 31)

  // Center - Logo (use pre-loaded logo if available)
  if (preloadedLogo) {
    try {
      pdf.addImage(preloadedLogo, "PNG", centerX - 12, y + 2, 24, 24)
    } catch {
      drawFallbackLogo(pdf, centerX, y, schoolSettings)
    }
  } else {
    drawFallbackLogo(pdf, centerX, y, schoolSettings)
  }

  // Right column - English
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIC OF CAMEROON", rightColX, y + 4)
  pdf.setFont("helvetica", "italic")
  pdf.text("Peace - Work - Fatherland", rightColX, y + 7)
  pdf.text("**********", rightColX, y + 10)
  pdf.setFont("helvetica", "bold")
  pdf.text("MINISTRY OF SECONDARY", rightColX, y + 13)
  pdf.text("EDUCATION", rightColX, y + 16)
  pdf.text("**********", rightColX, y + 19)
  pdf.setFontSize(5)
  pdf.text(schoolSettings?.school_name || "HARMONY School", rightColX, y + 22)
  pdf.text("**********", rightColX, y + 25)
  pdf.setFont("helvetica", "normal")
  pdf.text(`PO.BOX: ${poBox}`, rightColX, y + 28)
  pdf.text(`Tel: ${tel}`, rightColX, y + 31)

  y += 38

  // Title
  const bulletinTitle = isAnglophone ? "REPORT CARD" : "BULLETIN DE NOTES"
  const periodLabel = period?.name || ""
  const yearLabel = schoolSettings?.current_academic_year || "2024-2025"

  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(margin + 30, y, contentWidth - 60, 8, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.text(`${bulletinTitle} - ${periodLabel} - ${yearLabel}`, pageWidth / 2, y + 5.5, { align: "center" })

  y += 12

  // Student info section
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, y, contentWidth, 18, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.rect(margin, y, contentWidth, 18, "S")

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")

  const nameLabel = isAnglophone ? "Name:" : "Nom:"
  const matriculeLabel = isAnglophone ? "Reg. No:" : "Matricule:"
  const classLabel = isAnglophone ? "Class:" : "Classe:"
  const bornLabel = isAnglophone ? "Born on:" : "Né(e) le:"
  const atLabel = isAnglophone ? "at" : "à"
  const genderLabel = isAnglophone ? "Gender:" : "Sexe:"
  const totalLabel = isAnglophone ? "Total:" : "Effectif:"

  const studentName = `${student.lastName || ""} ${student.firstName || ""}`.toUpperCase()
  pdf.text(`${nameLabel} ${studentName}`, margin + 3, y + 5)
  pdf.text(`${matriculeLabel} ${student.matricule || "N/A"}`, margin + 3, y + 10)
  pdf.text(`${classLabel} ${bulletinData.className || ""}`, margin + 3, y + 15)

  pdf.text(
    `${bornLabel} ${student.dateOfBirth || "N/A"} ${atLabel} ${student.placeOfBirth || "N/A"}`,
    margin + 100,
    y + 5,
  )
  pdf.text(
    `${genderLabel} ${student.gender === "M" ? (isAnglophone ? "Male" : "Masculin") : isAnglophone ? "Female" : "Féminin"}`,
    margin + 100,
    y + 10,
  )
  pdf.text(`${totalLabel} ${numOrZero(classSize)}`, margin + 100, y + 15)

  y += 22

  // Determine if trimester (show seq1, seq2, avg columns)
  const isTrimester = period?.type === "trimester"
  const rowHeight = 5
  const headerHeight = 6

  // Table headers
  const cols = isTrimester
    ? [
        { label: isAnglophone ? "Subject" : "Matière", width: 45 },
        { label: isAnglophone ? "Teacher" : "Enseignant", width: 30 },
        { label: "Coef", width: 10 },
        { label: "Seq 1", width: 12 },
        { label: "Seq 2", width: 12 },
        { label: isAnglophone ? "Avg" : "Moy", width: 12 },
        { label: "/20", width: 12 },
        { label: isAnglophone ? "Rank" : "Rang", width: 15 },
        { label: isAnglophone ? "Remark" : "Appréciation", width: 46 },
      ]
    : [
        { label: isAnglophone ? "Subject" : "Matière", width: 50 },
        { label: isAnglophone ? "Teacher" : "Enseignant", width: 35 },
        { label: "Coef", width: 12 },
        { label: isAnglophone ? "Score" : "Note", width: 15 },
        { label: "/20", width: 15 },
        { label: isAnglophone ? "Rank" : "Rang", width: 18 },
        { label: isAnglophone ? "Remark" : "Appréciation", width: 49 },
      ]

  // Draw header
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, headerHeight, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")

  let xPos = margin
  cols.forEach((col) => {
    pdf.text(col.label, xPos + col.width / 2, y + 4, { align: "center" })
    xPos += col.width
  })

  y += headerHeight

  // Group subjects
  const groupedSubjects: { [key: string]: any[] } = {}
  ;(subjects || []).forEach((subject: any) => {
    const groupName = subject.group || (isAnglophone ? "Other" : "Autres")
    if (!groupedSubjects[groupName]) {
      groupedSubjects[groupName] = []
    }
    groupedSubjects[groupName].push(subject)
  })

  const getScoreColor = (score: number) => {
    if (score < 10) return [220, 38, 38] // Red
    if (score < 12) return [234, 179, 8] // Yellow
    if (score < 15) return [59, 130, 246] // Blue
    return [34, 197, 94] // Green
  }

  const getAppreciationText = (score: number, isEng: boolean) => {
    if (score >= 18) return isEng ? "Excellent" : "Excellent"
    if (score >= 16) return isEng ? "Very Good" : "Très Bien"
    if (score >= 14) return isEng ? "Good" : "Bien"
    if (score >= 12) return isEng ? "Fairly Good" : "Assez Bien"
    if (score >= 10) return isEng ? "Average" : "Passable"
    if (score >= 8) return isEng ? "Below Average" : "Insuffisant"
    return isEng ? "Poor" : "Faible"
  }

  let totalCoef = 0
  let totalPoints = 0

  Object.entries(groupedSubjects).forEach(([groupName, groupSubjects]) => {
    // Group header
    pdf.setFillColor(230, 230, 250)
    pdf.rect(margin, y, contentWidth, rowHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "bold")
    pdf.text(groupName, margin + 2, y + 3.5)
    y += rowHeight

    let groupCoef = 0
    let groupPoints = 0

    groupSubjects.forEach((subject, idx) => {
      const bgColor = idx % 2 === 0 ? [255, 255, 255] : [248, 248, 248]
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2])
      pdf.rect(margin, y, contentWidth, rowHeight, "F")

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(5)
      pdf.setFont("helvetica", "normal")

      const coef = numOrZero(subject.coefficient)
      const avg = numOrZero(subject.average)
      const scoreColor = getScoreColor(avg)

      xPos = margin

      if (isTrimester) {
        // Subject name
        pdf.text((subject.name || "").substring(0, 25), xPos + 1, y + 3.5)
        xPos += 45
        // Teacher
        pdf.text((subject.teacher || "-").substring(0, 18), xPos + 1, y + 3.5)
        xPos += 30
        // Coef
        pdf.text(coef.toString(), xPos + 5, y + 3.5, { align: "center" })
        xPos += 10
        // Seq 1
        const seq1 = numOrZero(subject.score1)
        pdf.setTextColor(getScoreColor(seq1)[0], getScoreColor(seq1)[1], getScoreColor(seq1)[2])
        pdf.text(seq1 > 0 ? seq1.toFixed(2) : "-", xPos + 6, y + 3.5, { align: "center" })
        xPos += 12
        // Seq 2
        const seq2 = numOrZero(subject.score2)
        pdf.setTextColor(getScoreColor(seq2)[0], getScoreColor(seq2)[1], getScoreColor(seq2)[2])
        pdf.text(seq2 > 0 ? seq2.toFixed(2) : "-", xPos + 6, y + 3.5, { align: "center" })
        xPos += 12
        // Average
        pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(avg.toFixed(2), xPos + 6, y + 3.5, { align: "center" })
        xPos += 12
        // /20
        pdf.setTextColor(0, 0, 0)
        pdf.setFont("helvetica", "normal")
        pdf.text((coef * avg).toFixed(2), xPos + 6, y + 3.5, { align: "center" })
        xPos += 12
        // Rank
        const rankText = subject.rank ? `${subject.rank}/${subject.classSize || classSize}` : "-"
        pdf.text(rankText, xPos + 7.5, y + 3.5, { align: "center" })
        xPos += 15
        // Appreciation
        pdf.text(getAppreciationText(avg, isAnglophone), xPos + 1, y + 3.5)
      } else {
        // Subject name
        pdf.text((subject.name || "").substring(0, 28), xPos + 1, y + 3.5)
        xPos += 50
        // Teacher
        pdf.text((subject.teacher || "-").substring(0, 20), xPos + 1, y + 3.5)
        xPos += 35
        // Coef
        pdf.text(coef.toString(), xPos + 6, y + 3.5, { align: "center" })
        xPos += 12
        // Score
        pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(avg.toFixed(2), xPos + 7.5, y + 3.5, { align: "center" })
        xPos += 15
        // /20
        pdf.setTextColor(0, 0, 0)
        pdf.setFont("helvetica", "normal")
        pdf.text((coef * avg).toFixed(2), xPos + 7.5, y + 3.5, { align: "center" })
        xPos += 15
        // Rank
        const rankText = subject.rank ? `${subject.rank}/${subject.classSize || classSize}` : "-"
        pdf.text(rankText, xPos + 9, y + 3.5, { align: "center" })
        xPos += 18
        // Appreciation
        pdf.text(getAppreciationText(avg, isAnglophone), xPos + 1, y + 3.5)
      }

      groupCoef += coef
      groupPoints += coef * avg
      y += rowHeight
    })

    // Group total
    pdf.setFillColor(220, 220, 240)
    pdf.rect(margin, y, contentWidth, rowHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")
    const groupAvg = groupCoef > 0 ? groupPoints / groupCoef : 0
    const totalGroupLabel = isAnglophone
      ? `Group Total: Coef ${groupCoef} | Avg: ${groupAvg.toFixed(2)}`
      : `Total Groupe: Coef ${groupCoef} | Moy: ${groupAvg.toFixed(2)}`
    pdf.text(totalGroupLabel, margin + 2, y + 3.5)
    y += rowHeight

    totalCoef += groupCoef
    totalPoints += groupPoints
  })

  // Final average
  const finalAvg = totalCoef > 0 ? totalPoints / totalCoef : 0
  y += 2

  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, 8, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")

  const avgLabel = isAnglophone ? "GENERAL AVERAGE:" : "MOYENNE GENERALE:"
  const rankLabel = isAnglophone ? "RANK:" : "RANG:"
  const classAvgLabel = isAnglophone ? "Class Avg:" : "Moy. Classe:"

  pdf.text(`${avgLabel} ${numOrZero(average).toFixed(2)}/20`, margin + 5, y + 5.5)
  pdf.text(`${rankLabel} ${rank}/${numOrZero(classSize)}`, margin + 80, y + 5.5)
  pdf.text(`${classAvgLabel} ${numOrZero(classAverage).toFixed(2)}`, margin + 130, y + 5.5)

  y += 12

  // Attendance section
  if (attendance) {
    pdf.setFillColor(255, 250, 230)
    pdf.rect(margin, y, contentWidth, 8, "F")
    pdf.setDrawColor(200, 180, 100)
    pdf.rect(margin, y, contentWidth, 8, "S")
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")

    const absLabel = isAnglophone ? "ABSENCES:" : "ABSENCES:"
    const totalAbsLabel = isAnglophone ? "Total:" : "Total:"
    const justifiedLabel = isAnglophone ? "Justified:" : "Justifiées:"
    const unjustifiedLabel = isAnglophone ? "Unjustified:" : "Non Justifiées:"

    const totalAbs = numOrZero(attendance.total_hours)
    const justifiedAbs = numOrZero(attendance.justified_hours)
    const unjustifiedAbs = totalAbs - justifiedAbs

    pdf.text(
      `${absLabel} ${totalAbsLabel} ${totalAbs}h | ${justifiedLabel} ${justifiedAbs}h | ${unjustifiedLabel} ${unjustifiedAbs}h`,
      margin + 5,
      y + 5.5,
    )

    y += 10
  }

  // Appreciation and distinction
  pdf.setFillColor(240, 255, 240)
  pdf.rect(margin, y, contentWidth, 12, "F")
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(7)

  const appreciationLabel = isAnglophone ? "APPRECIATION:" : "APPRECIATION:"
  const distinctionLabel = isAnglophone ? "DISTINCTION:" : "DISTINCTION:"

  pdf.setFont("helvetica", "bold")
  pdf.text(appreciationLabel, margin + 3, y + 4)
  pdf.setFont("helvetica", "normal")
  pdf.text(appreciation || "-", margin + 35, y + 4)

  pdf.setFont("helvetica", "bold")
  pdf.text(distinctionLabel, margin + 3, y + 9)
  pdf.setFont("helvetica", "normal")
  pdf.text(distinction || "-", margin + 35, y + 9)

  y += 15

  // Signatures
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.2)

  const sigWidth = (contentWidth - 10) / 3
  const parentLabel = isAnglophone ? "Parent Signature" : "Signature Parent"
  const principalLabel = isAnglophone ? "Principal" : "Le Principal"
  const teacherLabel = isAnglophone ? "Class Teacher" : "Prof. Principal"

  pdf.line(margin, y + 10, margin + sigWidth - 5, y + 10)
  pdf.line(margin + sigWidth + 2.5, y + 10, margin + sigWidth * 2 - 2.5, y + 10)
  pdf.line(margin + sigWidth * 2 + 5, y + 10, margin + contentWidth, y + 10)

  pdf.setFontSize(6)
  pdf.text(parentLabel, margin + (sigWidth - 5) / 2, y + 14, { align: "center" })
  pdf.text(principalLabel, margin + sigWidth + 2.5 + (sigWidth - 5) / 2, y + 14, { align: "center" })
  pdf.text(teacherLabel, margin + sigWidth * 2 + 5 + (sigWidth - 5) / 2, y + 14, { align: "center" })

  // Footer - OceanTechnologie
  const footerY = pageHeight - 8
  pdf.setFillColor(30, 64, 175)
  pdf.rect(0, footerY - 2, pageWidth, 10, "F")

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("courier", "normal")

  const now = new Date()
  const dateStr = now.toLocaleDateString("fr-FR")
  const timeStr = now.toLocaleTimeString("fr-FR")

  const footerText1 = `Bulletin généré le ${dateStr} à ${timeStr} par HARMONY - Développé par OceanTechnologie`
  const footerText2 = `Email: oceantechnologie6@gmail.com | Site: oceantechnologie6.netlify.app | Tél: +237 679-122-367 / +237 653-517-605`
  const footerText3 = `"Where ideas turn into reality"`

  pdf.text(footerText1, pageWidth / 2, footerY, { align: "center" })
  pdf.text(footerText2, pageWidth / 2, footerY + 2.5, { align: "center" })
  pdf.setFont("courier", "italic")
  pdf.text(footerText3, pageWidth / 2, footerY + 5, { align: "center" })
}

export async function generateBulletinPDF(bulletinData: any) {
  const { jsPDF } = await import("jspdf")

  const isAnglophone = bulletinData.isAnglophone || bulletinData.section?.toLowerCase().includes("anglo")
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - margin * 2

  const {
    student = {},
    period = {},
    subjects = [],
    attendance,
    average = 0,
    rank = 0,
    classSize = 1,
    classAverage = 0,
    appreciation = "",
    distinction = "",
    schoolSettings = {},
  } = bulletinData || {}

  const safeAverage = numOrZero(average)
  const safeRank = typeof rank === "string" ? rank : numOrZero(rank) || 1
  const safeClassSize = numOrZero(classSize) || 1
  const safeClassAverage = numOrZero(classAverage)
  const isTrimestriel = period?.type === "trimester"

  // ===== WATERMARK =====
  pdf.setTextColor(240, 240, 240)
  pdf.setFontSize(50)
  pdf.setFont("helvetica", "bold")
  pdf.text(schoolSettings?.school_name || "HARMONY", pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  })

  // ===== HEADER =====
  let y = margin
  const headerHeight = 32

  pdf.setFillColor(252, 251, 248)
  pdf.rect(0, 0, pageWidth, headerHeight + margin, "F")

  const poBox = schoolSettings?.po_box || schoolSettings?.address || ".................."
  const tel = schoolSettings?.phone || ".................."

  const centerX = pageWidth / 2
  const leftColX = margin + 2
  const rightColX = pageWidth - margin - 45

  // Left column - French
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIQUE DU CAMEROUN", leftColX, y + 5)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "italic")
  pdf.text("Paix - Travail - Patrie", leftColX, y + 9)
  pdf.setFontSize(4)
  pdf.text("**********", leftColX, y + 12)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MINISTERE DES ENSEIGNEMENTS", leftColX, y + 16)
  pdf.text("SECONDAIRES", leftColX, y + 20)
  pdf.setFontSize(4)
  pdf.text("**********", leftColX, y + 23)
  pdf.setFontSize(4)
  pdf.setFont("helvetica", "normal")
  pdf.text(`BP: ${poBox}`, leftColX, y + 27)
  pdf.text(`Tél: ${tel}`, leftColX, y + 30)

  // Center - Logo (using school logo URL if available)
  if (schoolSettings?.logo_url) {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = schoolSettings.logo_url
      })
      pdf.addImage(img, "PNG", centerX - 10, y + 3, 20, 20)
    } catch {
      // Fallback to circle with initials
      pdf.setFillColor(30, 64, 175)
      pdf.circle(centerX, y + 13, 10, "F")
      pdf.setFillColor(255, 255, 255)
      pdf.circle(centerX, y + 13, 8.5, "F")
      pdf.setFillColor(30, 64, 175)
      pdf.circle(centerX, y + 13, 7, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(6)
      pdf.setFont("helvetica", "bold")
      const initials = (schoolSettings?.school_name || "H")
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 3)
      pdf.text(initials, centerX, y + 15, { align: "center" })
    }
  } else {
    // Circle with initials
    pdf.setFillColor(30, 64, 175)
    pdf.circle(centerX, y + 13, 10, "F")
    pdf.setFillColor(255, 255, 255)
    pdf.circle(centerX, y + 13, 8.5, "F")
    pdf.setFillColor(30, 64, 175)
    pdf.circle(centerX, y + 13, 7, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "bold")
    const initials = (schoolSettings?.school_name || "H")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 3)
    pdf.text(initials, centerX, y + 15, { align: "center" })
  }

  // School name below logo
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text(schoolSettings?.school_name || "COLLEGE", centerX, y + 26, { align: "center", maxWidth: 50 })
  pdf.setFontSize(4)
  pdf.setFont("helvetica", "italic")
  pdf.text(schoolSettings?.school_slogan || "", centerX, y + 30, { align: "center" })

  // Right column - English
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIC OF CAMEROON", rightColX, y + 5)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "italic")
  pdf.text("Peace - Work - Fatherland", rightColX, y + 9)
  pdf.setFontSize(4)
  pdf.text("**********", rightColX, y + 12)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MINISTRY OF SECONDARY", rightColX, y + 16)
  pdf.text("EDUCATION", rightColX, y + 20)
  pdf.setFontSize(4)
  pdf.text("**********", rightColX, y + 23)
  pdf.setFontSize(4)
  pdf.setFont("helvetica", "normal")
  pdf.text(`PO.BOX: ${poBox}`, rightColX, y + 27)
  pdf.text(`Tel: ${tel}`, rightColX, y + 30)

  // Academic year badge
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(pageWidth - margin - 22, y + 1, 20, 6, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(period?.academic_year || "2024-2025", pageWidth - margin - 12, y + 5, { align: "center" })

  y += headerHeight + 2

  // TITLE
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(centerX - 28, y, 56, 8, 1.5, 1.5, "FD")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  const titleText = isAnglophone ? "REPORT CARD" : "BULLETIN DE NOTES"
  pdf.text(titleText, centerX, y + 5.5, { align: "center" })

  y += 10

  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(9)
  pdf.text(period?.name || (isAnglophone ? "Period" : "Période"), centerX, y + 2, { align: "center" })

  y += 6

  // ===== STUDENT INFO =====
  const infoBoxHeight = 18
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(margin, y, contentWidth, infoBoxHeight, 1.5, 1.5, "FD")

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "FULL NAME:" : "NOM ET PRENOM:", margin + 3, y + 5)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(9)
  pdf.text(`${(student?.last_name || "").toUpperCase()} ${student?.first_name || ""}`, margin + 32, y + 5)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "REG. NO:" : "MATRICULE:", margin + 3, y + 10)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.text(student?.matricule || "-", margin + 24, y + 10)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "BORN ON:" : "NÉ(E) LE:", margin + 3, y + 15)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(7)
  const dob = student?.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString(isAnglophone ? "en-GB" : "fr-FR")
    : "-"
  pdf.text(`${dob} ${isAnglophone ? "at" : "à"} ${student?.place_of_birth || "-"}`, margin + 18, y + 15)

  const rightInfoX = margin + contentWidth / 2
  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "CLASS:" : "CLASSE:", rightInfoX, y + 5)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(9)
  pdf.text(bulletinData?.class?.name || "-", rightInfoX + 15, y + 5)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "CLASS SIZE:" : "EFFECTIF:", rightInfoX, y + 10)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.text(`${safeClassSize} ${isAnglophone ? "students" : "élèves"}`, rightInfoX + 17, y + 10)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "GENDER:" : "SEXE:", rightInfoX, y + 15)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(7)
  const genderText = isAnglophone
    ? student?.gender === "M"
      ? "Male"
      : student?.gender === "F"
        ? "Female"
        : "-"
    : student?.gender === "M"
      ? "Masculin"
      : student?.gender === "F"
        ? "Féminin"
        : "-"
  pdf.text(genderText, rightInfoX + 12, y + 15)

  y += infoBoxHeight + 3

  if (
    attendance &&
    (attendance.total_hours > 0 || attendance.justified_hours > 0 || attendance.unjustified_hours > 0)
  ) {
    const attHeight = 10
    pdf.setFillColor(254, 243, 199)
    pdf.setDrawColor(251, 191, 36)
    pdf.roundedRect(margin, y, contentWidth, attHeight, 1.5, 1.5, "FD")

    pdf.setTextColor(146, 64, 14)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "bold")
    pdf.text(isAnglophone ? "ATTENDANCE" : "ABSENCES", margin + 3, y + 4)

    pdf.setTextColor(120, 53, 15)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "normal")
    const total = numOrZero(attendance.total_hours)
    const justified = numOrZero(attendance.justified_hours)
    const unjustified = numOrZero(attendance.unjustified_hours)

    pdf.text(`Total: ${total}h`, margin + 40, y + 4)
    pdf.text(isAnglophone ? `Justified: ${justified}h` : `Justifiées: ${justified}h`, margin + 70, y + 4)
    pdf.setTextColor(185, 28, 28)
    pdf.text(isAnglophone ? `Unjustified: ${unjustified}h` : `Non Justifiées: ${unjustified}h`, margin + 110, y + 4)

    y += attHeight + 2
  }

  // ===== GRADES TABLE =====
  const subjectsByGroup: Record<string, any[]> = {}
  ;(subjects || []).forEach((s: any) => {
    const groupName = s?.group || "Autres"
    if (!subjectsByGroup[groupName]) subjectsByGroup[groupName] = []
    subjectsByGroup[groupName].push(s)
  })

  const groups = Object.keys(subjectsByGroup)
  const tableHeaderHeight = 6
  const rowHeight = 5
  const groupHeaderHeight = 5

  const col1Width = 40
  const col2Width = 26
  const col3Width = 8
  const col4Width = isTrimestriel ? 12 : 14
  const col5Width = isTrimestriel ? 12 : 0
  const col6Width = isTrimestriel ? 12 : 0
  const col7Width = 12
  const col8Width = 12
  const col9Width =
    contentWidth - col1Width - col2Width - col3Width - col4Width - col5Width - col6Width - col7Width - col8Width

  // Table header
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, tableHeaderHeight, "F")

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")

  let colX = margin
  pdf.text(isAnglophone ? "SUBJECTS" : "MATIERES", colX + 2, y + 4)
  colX += col1Width

  pdf.text(isAnglophone ? "TEACHER" : "ENSEIGNANT", colX + 2, y + 4)
  colX += col2Width

  pdf.text("Coef", colX + col3Width / 2, y + 4, { align: "center" })
  colX += col3Width

  if (isTrimestriel) {
    pdf.text("Seq 1", colX + col4Width / 2, y + 4, { align: "center" })
    colX += col4Width
    pdf.text("Seq 2", colX + col5Width / 2, y + 4, { align: "center" })
    colX += col5Width
    pdf.text(isAnglophone ? "Avg" : "Moy", colX + col6Width / 2, y + 4, { align: "center" })
    colX += col6Width
  } else {
    pdf.text(isAnglophone ? "Mark /20" : "Note /20", colX + col4Width / 2, y + 4, { align: "center" })
    colX += col4Width
  }

  pdf.text("N x C", colX + col7Width / 2, y + 4, { align: "center" })
  colX += col7Width

  pdf.text(isAnglophone ? "Rank" : "Rang", colX + col8Width / 2, y + 4, { align: "center" })
  colX += col8Width

  pdf.text(isAnglophone ? "Remark" : "Appréciation", colX + 2, y + 4)

  y += tableHeaderHeight

  let totalCoef = 0
  let totalPoints = 0
  const groupAverages: Record<string, number> = {}
  const groupPoints: Record<string, number> = {}
  const groupCoefs: Record<string, number> = {}

  groups.forEach((groupName) => {
    const groupSubjects = subjectsByGroup[groupName] || []

    pdf.setFillColor(219, 234, 254)
    pdf.rect(margin, y, contentWidth, groupHeaderHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")
    pdf.text((groupName || "").toUpperCase(), margin + 2, y + 3.5)
    y += groupHeaderHeight

    groupSubjects.forEach((subject: any, idx: number) => {
      if (!subject) return

      const score1 = numOrZero(subject?.score1)
      const score2 = numOrZero(subject?.score2)
      const averageScore = numOrZero(subject?.average)
      const coef = numOrZero(subject?.coefficient) || 1
      const weighted = averageScore !== undefined && !isNaN(averageScore) ? averageScore * coef : 0
      const subjectRank = subject?.rank
      const subjectClassSize = subject?.classSize

      if (averageScore !== undefined && !isNaN(averageScore) && averageScore > 0) {
        totalCoef += coef
        totalPoints += weighted

        if (!groupPoints[groupName]) {
          groupPoints[groupName] = 0
          groupCoefs[groupName] = 0
        }
        groupPoints[groupName] += weighted
        groupCoefs[groupName] += coef
      }

      const bgColor = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2])
      pdf.rect(margin, y, contentWidth, rowHeight, "F")

      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.1)
      pdf.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight)

      colX = margin
      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(5)
      pdf.setFont("helvetica", "normal")
      pdf.text((subject?.name || "-").substring(0, 22), colX + 1, y + 3.5)
      colX += col1Width

      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(4)
      pdf.text((subject?.teacher || "-").substring(0, 16), colX + 1, y + 3.5)
      colX += col2Width

      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(5)
      pdf.setFont("helvetica", "bold")
      pdf.text(String(coef), colX + col3Width / 2, y + 3.5, { align: "center" })
      colX += col3Width

      if (isTrimestriel) {
        // Sequence 1
        const score1Color = getGradeColor(score1)
        pdf.setTextColor(score1Color[0], score1Color[1], score1Color[2])
        pdf.setFontSize(5)
        pdf.text(score1 > 0 ? safeNum(score1) : "-", colX + col4Width / 2, y + 3.5, { align: "center" })
        colX += col4Width

        // Sequence 2
        const score2Color = getGradeColor(score2)
        pdf.setTextColor(score2Color[0], score2Color[1], score2Color[2])
        pdf.text(score2 > 0 ? safeNum(score2) : "-", colX + col5Width / 2, y + 3.5, { align: "center" })
        colX += col5Width

        // Average
        const averageColor = getGradeColor(averageScore)
        pdf.setTextColor(averageColor[0], averageColor[1], averageColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(averageScore > 0 ? safeNum(averageScore) : "-", colX + col6Width / 2, y + 3.5, { align: "center" })
        colX += col6Width
      } else {
        const averageColor = getGradeColor(averageScore)
        pdf.setTextColor(averageColor[0], averageColor[1], averageColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(averageScore > 0 ? safeNum(averageScore) : "-", colX + col4Width / 2, y + 3.5, { align: "center" })
        colX += col4Width
      }

      pdf.setTextColor(71, 85, 105)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(5)
      pdf.text(weighted > 0 ? safeNum(weighted) : "-", colX + col7Width / 2, y + 3.5, { align: "center" })
      colX += col7Width

      if (subjectRank && subjectClassSize) {
        const rankColor = subjectRank <= 3 ? [22, 163, 74] : subjectRank <= 5 ? [37, 99, 235] : [71, 85, 105]
        pdf.setTextColor(rankColor[0], rankColor[1], rankColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(`${subjectRank}/${subjectClassSize}`, colX + col8Width / 2, y + 3.5, { align: "center" })
      } else {
        pdf.setTextColor(148, 163, 184)
        pdf.text("-", colX + col8Width / 2, y + 3.5, { align: "center" })
      }
      colX += col8Width

      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(4)
      pdf.setFont("helvetica", "italic")
      pdf.text(getAppreciation(averageScore, isAnglophone), colX + 1, y + 3.5)

      y += rowHeight
    })

    // Group average row
    if (groupCoefs[groupName] > 0) {
      groupAverages[groupName] = groupPoints[groupName] / groupCoefs[groupName]
    }

    const groupAvg = groupAverages[groupName]
    pdf.setFillColor(239, 246, 255)
    pdf.rect(margin, y, contentWidth, rowHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")

    const avgLabelX = margin + col1Width + col2Width - 20
    pdf.text(`${isAnglophone ? "Average" : "Moyenne"} ${groupName}:`, avgLabelX, y + 3.5, { align: "right" })

    const avgValueX = isTrimestriel
      ? margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width / 2
      : margin + col1Width + col2Width + col3Width + col4Width / 2
    pdf.text(groupAvg ? safeNum(groupAvg) : "-", avgValueX, y + 3.5, { align: "center" })

    y += rowHeight
  })

  // Total row
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, rowHeight + 1, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "TOTALS" : "TOTAUX", margin + 2, y + 4)
  pdf.text(String(totalCoef || 0), margin + col1Width + col2Width + col3Width / 2, y + 4, { align: "center" })

  const totalPtsX = isTrimestriel
    ? margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + col7Width / 2
    : margin + col1Width + col2Width + col3Width + col4Width + col7Width / 2
  pdf.text(safeNum(totalPoints), totalPtsX, y + 4, { align: "center" })

  y += rowHeight + 3

  // ===== RESULTS SUMMARY =====
  const summaryBoxHeight = 18
  const boxWidth = (contentWidth - 9) / 4

  // Box 1: Moyenne
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(margin, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "AVERAGE" : "MOYENNE GÉNÉRALE", margin + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(12)
  pdf.text(safeNum(safeAverage), margin + boxWidth / 2, y + 12, { align: "center" })
  pdf.setFontSize(6)
  pdf.text("/20", margin + boxWidth / 2, y + 16, { align: "center" })

  // Box 2: Rang
  const rankBoxColor = typeof rank === "string" ? [107, 114, 128] : [139, 92, 246]
  pdf.setFillColor(rankBoxColor[0], rankBoxColor[1], rankBoxColor[2])
  pdf.roundedRect(margin + boxWidth + 3, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "RANK" : "RANG", margin + boxWidth + 3 + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(12)
  const rankText = typeof rank === "string" ? rank : safeRank === 1 ? "1st" : `${safeRank}th`
  pdf.text(rankText, margin + boxWidth + 3 + boxWidth / 2, y + 12, { align: "center" })
  pdf.setFontSize(6)
  pdf.text(
    typeof rank === "string" ? "Unranked" : `of ${safeClassSize}`,
    margin + boxWidth + 3 + boxWidth / 2,
    y + 16,
    {
      align: "center",
    },
  )

  // Box 3: Moyenne classe
  pdf.setFillColor(6, 182, 212)
  pdf.roundedRect(margin + (boxWidth + 3) * 2, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "CLASS AVG" : "MOY. CLASSE", margin + (boxWidth + 3) * 2 + boxWidth / 2, y + 4, {
    align: "center",
  })
  pdf.setFontSize(12)
  pdf.text(safeNum(safeClassAverage), margin + (boxWidth + 3) * 2 + boxWidth / 2, y + 12, { align: "center" })
  pdf.setFontSize(6)
  pdf.text("/20", margin + (boxWidth + 3) * 2 + boxWidth / 2, y + 16, { align: "center" })

  // Box 4: Mention
  const mentionColor =
    safeAverage >= 16
      ? [245, 158, 11]
      : safeAverage >= 14
        ? [22, 163, 74]
        : safeAverage >= 12
          ? [37, 99, 235]
          : safeAverage >= 10
            ? [107, 114, 128]
            : [220, 38, 38]
  pdf.setFillColor(mentionColor[0], mentionColor[1], mentionColor[2])
  pdf.roundedRect(margin + (boxWidth + 3) * 3, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "HONORS" : "MENTION", margin + (boxWidth + 3) * 3 + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(7)
  const distinctionText = distinction
  const distinctionLines = pdf.splitTextToSize(distinctionText, boxWidth - 4)
  pdf.text(distinctionLines, margin + (boxWidth + 3) * 3 + boxWidth / 2, y + 11, { align: "center" })

  y += summaryBoxHeight + 3

  // ===== OBSERVATIONS =====
  const obsHeight = 18
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(203, 213, 225)
  pdf.roundedRect(margin, y, contentWidth / 2 - 2, obsHeight, 1.5, 1.5, "FD")
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "TEACHER'S REMARK" : "OBSERVATION DU CONSEIL DE CLASSE", margin + 2, y + 4)
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(4.5)
  pdf.setFont("helvetica", "italic")

  const obs = generateIntelligentObservation(safeAverage, subjects || [], attendance, isAnglophone)
  pdf.text(obs, margin + 2, y + 8, { maxWidth: contentWidth / 2 - 6 })

  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(203, 213, 225)
  pdf.roundedRect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, obsHeight, 1.5, 1.5, "FD")
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "COUNCIL DECISION" : "DÉCISION DU CONSEIL", margin + contentWidth / 2 + 4, y + 4)
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "normal")
  pdf.text(distinctionText, margin + contentWidth / 2 + 4, y + 10)

  y += obsHeight + 3

  // ===== SIGNATURES =====
  const sigHeight = 16
  const sigWidth = contentWidth / 3 - 3

  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.2)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "normal")
  pdf.text(isAnglophone ? "The Director" : "Le Directeur", margin + sigWidth / 2, y + 3, { align: "center" })
  pdf.line(margin + 4, y + sigHeight - 3, margin + sigWidth - 4, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text(isAnglophone ? "Signature & Stamp" : "Signature & Cachet", margin + sigWidth / 2, y + sigHeight, {
    align: "center",
  })

  pdf.setFontSize(5)
  pdf.text(
    isAnglophone ? "The Principal Teacher" : "Le Professeur Principal",
    margin + sigWidth + 4 + sigWidth / 2,
    y + 3,
    { align: "center" },
  )
  pdf.line(margin + sigWidth + 8, y + sigHeight - 3, margin + sigWidth * 2, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text(isAnglophone ? "Signature" : "Signature", margin + sigWidth + 4 + sigWidth / 2, y + sigHeight, {
    align: "center",
  })

  pdf.setFontSize(5)
  pdf.text(isAnglophone ? "The Parent" : "Le Parent", margin + (sigWidth + 4) * 2 + sigWidth / 2, y + 3, {
    align: "center",
  })
  pdf.line(margin + (sigWidth + 4) * 2 + 4, y + sigHeight - 3, margin + contentWidth - 4, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text(isAnglophone ? "Signature" : "Signature", margin + (sigWidth + 4) * 2 + sigWidth / 2, y + sigHeight, {
    align: "center",
  })

  // ===== FOOTER =====
  const now = new Date()
  const dateStr = now.toLocaleDateString(isAnglophone ? "en-GB" : "fr-FR")
  const timeStr = now.toLocaleTimeString(isAnglophone ? "en-GB" : "fr-FR")

  const footerStartY = pageHeight - 15
  pdf.setFillColor(15, 23, 42) // Dark blue background
  pdf.rect(0, footerStartY, pageWidth, 15, "F")

  // Main footer text
  pdf.setTextColor(226, 232, 240)
  pdf.setFontSize(4.5)
  pdf.setFont("courier", "normal") // Robotic font
  pdf.text(
    isAnglophone
      ? `Report generated on ${dateStr} at ${timeStr} by HARMONY`
      : `Bulletin généré le ${dateStr} à ${timeStr} par HARMONY`,
    pageWidth / 2,
    footerStartY + 3,
    {
      align: "center",
    },
  )

  // Company info
  pdf.setTextColor(148, 163, 184)
  pdf.setFontSize(4)
  pdf.text(
    "Developed by OceanTechnologie | oceantechnologie6@gmail.com | oceantechnologie6.netlify.app",
    pageWidth / 2,
    footerStartY + 7,
    { align: "center" },
  )

  pdf.setFontSize(3.5)
  pdf.text("Tel: +237 679-122-367 / +237 653-517-605", pageWidth / 2, footerStartY + 10, { align: "center" })

  // Slogan
  pdf.setTextColor(96, 165, 250)
  pdf.setFontSize(4)
  pdf.setFont("courier", "italic")
  pdf.text('"Where ideas turn into reality"', pageWidth / 2, footerStartY + 13, { align: "center" })
}

export async function generateClassBulletinsPDF(
  bulletinsData: any[],
  className: string,
  periodName: string,
): Promise<void> {
  if (!bulletinsData || bulletinsData.length === 0) {
    throw new Error("Aucun bulletin à générer")
  }

  const { jsPDF } = await import("jspdf")

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Pre-load logo once for all bulletins
  const logoUrl = bulletinsData[0]?.schoolSettings?.logo_url || bulletinsData[0]?.logoUrl
  const preloadedLogo = logoUrl ? await loadLogo(logoUrl) : null

  // Sort by average (merit order) - highest first, NC students at the end
  const sortedBulletins = [...bulletinsData].sort((a, b) => {
    const rankA = a.rank
    const rankB = b.rank
    if (rankA === "NC" && rankB !== "NC") return 1
    if (rankA !== "NC" && rankB === "NC") return -1
    const avgA = Number(a?.average) || 0
    const avgB = Number(b?.average) || 0
    return avgB - avgA
  })

  sortedBulletins.forEach((bulletin, index) => {
    if (bulletin) {
      generateSingleBulletin(pdf, bulletin, bulletin.schoolSettings, index === 0, preloadedLogo)
    }
  })

  const fileName = `Bulletins_${className || "Classe"}_${periodName || "Periode"}.pdf`
  pdf.save(fileName)
}

export type { BulletinData, SchoolSettings, Subject }
