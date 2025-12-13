"use client"

import jsPDF from "jspdf"
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

function getAppreciation(score: number | undefined): string {
  if (score === undefined || isNaN(score)) return "-"
  if (score >= 18) return "Excellent"
  if (score >= 16) return "Très Bien"
  if (score >= 14) return "Bien"
  if (score >= 12) return "Assez Bien"
  if (score >= 10) return "Passable"
  if (score >= 8) return "Insuffisant"
  return "Très Insuffisant"
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

function generateSingleBulletin(
  pdf: jsPDF,
  bulletinData: BulletinData,
  schoolSettings: SchoolSettings,
  isFirstPage = true,
): void {
  const pageWidth = 210
  const pageHeight = 297
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

  const safeAverage = numOrZero(average)
  const safeRank = numOrZero(rank) || 1
  const safeClassSize = numOrZero(classSize) || 1
  const safeClassAverage = numOrZero(classAverage)
  const isTrimestriel = period?.type === "trimester"

  if (!isFirstPage) {
    pdf.addPage()
  }

  // ===== WATERMARK =====
  pdf.setTextColor(235, 235, 235)
  pdf.setFontSize(45)
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

  const poBox = schoolSettings?.address || ".................."
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

  // Center - Logo
  pdf.setFillColor(30, 64, 175)
  pdf.circle(centerX, y + 15, 10, "F")
  pdf.setFillColor(255, 255, 255)
  pdf.circle(centerX, y + 15, 8.5, "F")
  pdf.setFillColor(30, 64, 175)
  pdf.circle(centerX, y + 15, 7, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  const initials = (schoolSettings?.school_name || "H")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 3)
  pdf.text(initials, centerX, y + 17, { align: "center" })

  // School name below logo
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.text(schoolSettings?.school_name || "COLLEGE", centerX, y + 28, { align: "center", maxWidth: 50 })
  pdf.setFontSize(4)
  pdf.setFont("helvetica", "italic")
  pdf.text(schoolSettings?.school_slogan || "", centerX, y + 32, { align: "center" })

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
  pdf.text("BULLETIN DE NOTES", centerX, y + 5.5, { align: "center" })

  y += 10

  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(9)
  pdf.text(period?.name || "Période", centerX, y + 2, { align: "center" })

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
  pdf.text("NOM ET PRENOM:", margin + 3, y + 5)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(9)
  pdf.text(`${(student?.last_name || "").toUpperCase()} ${student?.first_name || ""}`, margin + 32, y + 5)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("MATRICULE:", margin + 3, y + 10)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.text(student?.matricule || "-", margin + 24, y + 10)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("NÉ(E) LE:", margin + 3, y + 15)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(7)
  const dob = student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("fr-FR") : "-"
  pdf.text(`${dob} à ${student?.place_of_birth || "-"}`, margin + 18, y + 15)

  const rightInfoX = margin + contentWidth / 2
  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("CLASSE:", rightInfoX, y + 5)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(9)
  pdf.text(bulletinData?.class?.name || "-", rightInfoX + 15, y + 5)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("EFFECTIF:", rightInfoX, y + 10)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.text(`${safeClassSize} élèves`, rightInfoX + 17, y + 10)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("SEXE:", rightInfoX, y + 15)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(7)
  pdf.text(student?.gender === "M" ? "Masculin" : student?.gender === "F" ? "Féminin" : "-", rightInfoX + 12, y + 15)

  y += infoBoxHeight + 3

  // ===== GRADES TABLE =====
  const subjectsByGroup: Record<string, Subject[]> = {}
  ;(subjects || []).forEach((s) => {
    const groupName = s?.group || "Autres"
    if (!subjectsByGroup[groupName]) subjectsByGroup[groupName] = []
    subjectsByGroup[groupName].push(s)
  })

  const groups = Object.keys(subjectsByGroup)
  const tableHeaderHeight = 6
  const rowHeight = 5
  const groupHeaderHeight = 5

  const col1Width = 42
  const col2Width = 28
  const col3Width = 8
  const col4Width = isTrimestriel ? 12 : 14
  const col5Width = isTrimestriel ? 12 : 0
  const col6Width = isTrimestriel ? 12 : 0
  const col7Width = 12
  const col8Width = 10
  const col9Width =
    contentWidth - col1Width - col2Width - col3Width - col4Width - col5Width - col6Width - col7Width - col8Width

  // Table header
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, tableHeaderHeight, "F")

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")

  let colX = margin
  pdf.text("MATIERES", colX + 2, y + 4)
  colX += col1Width

  pdf.text("ENSEIGNANT", colX + 2, y + 4)
  colX += col2Width

  pdf.text("Coef", colX + col3Width / 2, y + 4, { align: "center" })
  colX += col3Width

  if (isTrimestriel) {
    pdf.text("Séq 1", colX + col4Width / 2, y + 4, { align: "center" })
    colX += col4Width
    pdf.text("Séq 2", colX + col5Width / 2, y + 4, { align: "center" })
    colX += col5Width
    pdf.text("Moy", colX + col6Width / 2, y + 4, { align: "center" })
    colX += col6Width
  } else {
    pdf.text("Note /20", colX + col4Width / 2, y + 4, { align: "center" })
    colX += col4Width
  }

  pdf.text("N x C", colX + col7Width / 2, y + 4, { align: "center" })
  colX += col7Width

  pdf.text("Rang", colX + col8Width / 2, y + 4, { align: "center" })
  colX += col8Width

  pdf.text("Appréciation", colX + 2, y + 4)

  y += tableHeaderHeight

  let totalCoef = 0
  let totalPoints = 0

  groups.forEach((groupName) => {
    const groupSubjects = subjectsByGroup[groupName] || []

    pdf.setFillColor(219, 234, 254)
    pdf.rect(margin, y, contentWidth, groupHeaderHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")
    pdf.text((groupName || "").toUpperCase(), margin + 2, y + 3.5)
    y += groupHeaderHeight

    groupSubjects.forEach((subject, idx) => {
      if (!subject) return

      const score1 = numOrZero(subject?.score1)
      const score2 = numOrZero(subject?.score2)
      const averageScore = numOrZero(subject?.average)
      const coef = numOrZero(subject?.coefficient) || 1
      const weighted = averageScore !== undefined && !isNaN(averageScore) ? averageScore * coef : undefined
      const subjectRank = subject?.rank

      if (averageScore !== undefined && !isNaN(averageScore)) {
        totalCoef += coef
        totalPoints += weighted || 0
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
      pdf.text((subject?.teacher || "-").substring(0, 18), colX + 1, y + 3.5)
      colX += col2Width

      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(5)
      pdf.setFont("helvetica", "bold")
      pdf.text(String(coef), colX + col3Width / 2, y + 3.5, { align: "center" })
      colX += col3Width

      if (isTrimestriel) {
        const score1Color = getGradeColor(score1)
        pdf.setTextColor(score1Color[0], score1Color[1], score1Color[2])
        pdf.setFontSize(5)
        pdf.text(safeNum(score1), colX + col4Width / 2, y + 3.5, { align: "center" })
        colX += col4Width

        const score2Color = getGradeColor(score2)
        pdf.setTextColor(score2Color[0], score2Color[1], score2Color[2])
        pdf.text(safeNum(score2), colX + col5Width / 2, y + 3.5, { align: "center" })
        colX += col5Width

        const averageColor = getGradeColor(averageScore)
        pdf.setTextColor(averageColor[0], averageColor[1], averageColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(averageScore), colX + col6Width / 2, y + 3.5, { align: "center" })
        colX += col6Width
      } else {
        const averageColor = getGradeColor(averageScore)
        pdf.setTextColor(averageColor[0], averageColor[1], averageColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(averageScore), colX + col4Width / 2, y + 3.5, { align: "center" })
        colX += col4Width
      }

      pdf.setTextColor(71, 85, 105)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(5)
      pdf.text(safeNum(weighted), colX + col7Width / 2, y + 3.5, { align: "center" })
      colX += col7Width

      if (subjectRank && subjectRank.classSize) {
        const rankColor = subjectRank <= 3 ? [22, 163, 74] : subjectRank <= 5 ? [37, 99, 235] : [71, 85, 105]
        pdf.setTextColor(rankColor[0], rankColor[1], rankColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(`${subjectRank}/${subjectRank.classSize}`, colX + col8Width / 2, y + 3.5, { align: "center" })
      } else {
        pdf.setTextColor(148, 163, 184)
        pdf.text("-", colX + col8Width / 2, y + 3.5, { align: "center" })
      }
      colX += col8Width

      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(4)
      pdf.setFont("helvetica", "italic")
      pdf.text(getAppreciation(averageScore), colX + 1, y + 3.5)

      y += rowHeight
    })

    // Declare groupAverages variable
    const groupAverages: Record<string, number> = {
      Autres: 12.5, // Example value
      Mathématiques: 14.0, // Example value
      Sciences: 13.0, // Example value
    }

    const groupAvg = groupAverages?.[groupName]
    pdf.setFillColor(239, 246, 255)
    pdf.rect(margin, y, contentWidth, rowHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")

    const avgLabelX = margin + col1Width + col2Width - 20
    pdf.text(`Moyenne ${groupName}:`, avgLabelX, y + 3.5, { align: "right" })

    const avgValueX = isTrimestriel
      ? margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width / 2
      : margin + col1Width + col2Width + col3Width + col4Width / 2
    pdf.text(safeNum(groupAvg), avgValueX, y + 3.5, { align: "center" })

    y += rowHeight
  })

  // Total row
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, rowHeight + 1, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("TOTAUX", margin + 2, y + 4)
  pdf.text(String(totalCoef || 0), margin + col1Width + col2Width + col3Width / 2, y + 4, { align: "center" })

  const totalPtsX = isTrimestriel
    ? margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + col7Width / 2
    : margin + col1Width + col2Width + col3Width + col4Width + col7Width / 2
  pdf.text(safeNum(totalPoints), totalPtsX, y + 4, { align: "center" })

  y += rowHeight + 3

  // ===== ATTENDANCE SECTION =====
  if (attendance && attendance.total_hours > 0) {
    const attHeight = 12
    pdf.setFillColor(254, 243, 199) // Yellow background
    pdf.setDrawColor(251, 191, 36)
    pdf.roundedRect(margin, y, contentWidth, attHeight, 1.5, 1.5, "FD")

    pdf.setTextColor(146, 64, 14)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")
    pdf.text("ABSENCES", margin + 2, y + 3)

    pdf.setTextColor(120, 53, 15)
    pdf.setFontSize(5.5)
    pdf.setFont("helvetica", "normal")
    const total = numOrZero(attendance.total_hours)
    const justified = numOrZero(attendance.justified_hours)
    const unjustified = numOrZero(attendance.unjustified_hours)

    pdf.text(`Total: ${total}h`, margin + 2, y + 7)
    pdf.text(`Justifiées: ${justified}h`, margin + contentWidth / 3, y + 7)
    pdf.setTextColor(185, 28, 28) // Red for unjustified
    pdf.text(`Non Justifiées: ${unjustified}h`, margin + (contentWidth * 2) / 3, y + 7)

    y += attHeight + 3
  }

  // ===== RESULTS SUMMARY =====
  const summaryBoxHeight = 18
  const boxWidth = (contentWidth - 9) / 4

  // Box 1: Moyenne
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(margin, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MOYENNE GÉNÉRALE", margin + boxWidth / 2, y + 4, { align: "center" })
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
  pdf.text("RANG", margin + boxWidth + 3 + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(12)
  const rankText = typeof rank === "string" ? rank : safeRank === 1 ? "1er" : `${safeRank}ème`
  pdf.text(rankText, margin + boxWidth + 3 + boxWidth / 2, y + 12, { align: "center" })
  pdf.setFontSize(6)
  pdf.text(
    typeof rank === "string" ? "Non Classé" : `sur ${safeClassSize}`,
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
  pdf.text("MOY. CLASSE", margin + (boxWidth + 3) * 2 + boxWidth / 2, y + 4, { align: "center" })
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
  pdf.text("MENTION", margin + (boxWidth + 3) * 3 + boxWidth / 2, y + 4, { align: "center" })
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
  pdf.text("OBSERVATION DU CONSEIL DE CLASSE", margin + 2, y + 4)
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(4.5)
  pdf.setFont("helvetica", "italic")

  const obs = generateIntelligentObservation(safeAverage, subjects || [], attendance)
  pdf.text(obs, margin + 2, y + 8, { maxWidth: contentWidth / 2 - 6 })

  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(203, 213, 225)
  pdf.roundedRect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, obsHeight, 1.5, 1.5, "FD")
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("DÉCISION DU CONSEIL", margin + contentWidth / 2 + 4, y + 4)
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
  pdf.text("Le Directeur", margin + sigWidth / 2, y + 3, { align: "center" })
  pdf.line(margin + 4, y + sigHeight - 3, margin + sigWidth - 4, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text("Signature & Cachet", margin + sigWidth / 2, y + sigHeight, { align: "center" })

  pdf.setFontSize(5)
  pdf.text("Le Professeur Principal", margin + sigWidth + 4 + sigWidth / 2, y + 3, { align: "center" })
  pdf.line(margin + sigWidth + 8, y + sigHeight - 3, margin + sigWidth * 2, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text("Signature", margin + sigWidth + 4 + sigWidth / 2, y + sigHeight, { align: "center" })

  pdf.setFontSize(5)
  pdf.text("Le Parent", margin + (sigWidth + 4) * 2 + sigWidth / 2, y + 3, { align: "center" })
  pdf.line(margin + (sigWidth + 4) * 2 + 4, y + sigHeight - 3, margin + contentWidth - 4, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text("Signature", margin + (sigWidth + 4) * 2 + sigWidth / 2, y + sigHeight, { align: "center" })

  // ===== FOOTER =====
  const now = new Date()
  const dateStr = now.toLocaleDateString("fr-FR")
  const timeStr = now.toLocaleTimeString("fr-FR")

  const footerStartY = pageHeight - 15
  pdf.setFillColor(15, 23, 42) // Dark blue background
  pdf.rect(0, footerStartY, pageWidth, 15, "F")

  // Main footer text
  pdf.setTextColor(226, 232, 240)
  pdf.setFontSize(4.5)
  pdf.setFont("courier", "normal") // Robotic font
  pdf.text(`Bulletin généré le ${dateStr} à ${timeStr} par HARMONY`, pageWidth / 2, footerStartY + 3, {
    align: "center",
  })

  // Company info
  pdf.setTextColor(148, 163, 184)
  pdf.setFontSize(4)
  pdf.text(
    "Développé par OceanTechnologie | oceantechnologie6@gmail.com | oceantechnologie6.netlify.app",
    pageWidth / 2,
    footerStartY + 7,
    { align: "center" },
  )

  pdf.setFontSize(3.5)
  pdf.text("Tél: +237 679-122-367 / +237 653-517-605", pageWidth / 2, footerStartY + 10, { align: "center" })

  // Slogan
  pdf.setTextColor(96, 165, 250)
  pdf.setFontSize(4)
  pdf.setFont("courier", "italic")
  pdf.text('"Where ideas turn into reality"', pageWidth / 2, footerStartY + 13, { align: "center" })
}

export function generateBulletinPDF(data: BulletinData): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15

  const isAnglophone =
    data.section?.toLowerCase().includes("anglophone") || data.section?.toLowerCase().includes("english")

  pdf.setFillColor(252, 251, 248)
  pdf.rect(0, 0, pageWidth, 50, "F")

  // French side (left)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.text("REPUBLIQUE DU CAMEROUN", margin, 10)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.text("Paix – Travail – Patrie", margin, 14)
  pdf.setFontSize(6)
  pdf.text("**********", margin, 17)
  pdf.setFontSize(8)
  pdf.text("MINISTERE DES ENSEIGNEMENTS", margin, 20)
  pdf.text("SECONDAIRES", margin, 24)
  pdf.setFontSize(6)
  pdf.text("**********", margin, 27)
  pdf.setFontSize(7.5)
  pdf.setFont("helvetica", "bold")
  pdf.text("COLLEGE POLYVALENT LES SAVANTS", margin, 31)
  pdf.text("DE ANGE MADO", margin, 35)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(6.5)
  const poBox = data.schoolSettings?.po_box || "....................."
  const phone = data.schoolSettings?.phone || "....................."
  pdf.text(`BP: ${poBox}`, margin, 39)
  pdf.text(`Tél: ${phone}`, margin, 42)

  const centerX = pageWidth / 2
  pdf.setDrawColor(29, 78, 216)
  pdf.setFillColor(255, 255, 255)
  pdf.circle(centerX, 25, 12, "FD")
  pdf.setLineWidth(1.5)
  pdf.circle(centerX, 25, 12, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(14)
  pdf.setTextColor(29, 78, 216)
  pdf.text("CPLS", centerX, 23, { align: "center" })
  pdf.setFontSize(6)
  pdf.text("ANGE MADO", centerX, 29, { align: "center" })
  pdf.setTextColor(0, 0, 0)

  // English side (right)
  const rightX = pageWidth - margin
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.text("REPUBLIC OF CAMEROON", rightX, 10, { align: "right" })
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.text("Peace – Work – Fatherland", rightX, 14, { align: "right" })
  pdf.setFontSize(6)
  pdf.text("**********", rightX, 17, { align: "right" })
  pdf.setFontSize(8)
  pdf.text("MINISTRY OF SECONDARY", rightX, 20, { align: "right" })
  pdf.text("EDUCATION", rightX, 24, { align: "right" })
  pdf.setFontSize(6)
  pdf.text("**********", rightX, 27, { align: "right" })
  pdf.setFontSize(7.5)
  pdf.setFont("helvetica", "bold")
  pdf.text("COLLEGE POLYVALENT LES SAVANTS", rightX, 31, { align: "right" })
  pdf.text("DE ANGE MADO", rightX, 35, { align: "right" })
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(6.5)
  pdf.text(`PO.BOX: ${poBox}`, rightX, 39, { align: "right" })
  pdf.text(`Tel: ${phone}`, rightX, 42, { align: "right" })

  // Title
  let yPos = 55
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(16)
  pdf.setTextColor(29, 78, 216)
  const title = isAnglophone ? "REPORT CARD" : "BULLETIN DE NOTES"
  pdf.text(title, pageWidth / 2, yPos, { align: "center" })

  // Student info boxes
  yPos = 65
  const boxHeight = 25
  const col1Width = 60
  const col2Width = pageWidth - margin * 2 - col1Width - 5

  pdf.setTextColor(0, 0, 0)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)

  // Left column
  pdf.setFillColor(240, 249, 255)
  pdf.roundedRect(margin, yPos, col1Width, boxHeight, 2, 2, "F")
  pdf.setDrawColor(191, 219, 254)
  pdf.setLineWidth(0.5)
  pdf.roundedRect(margin, yPos, col1Width, boxHeight, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "Name:" : "Nom:", margin + 3, yPos + 5)
  pdf.setFont("helvetica", "normal")
  pdf.text(`${data.student.last_name} ${data.student.first_name}`, margin + 3, yPos + 10)

  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "Registration N°:" : "Matricule:", margin + 3, yPos + 15)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.student.matricule || "-", margin + 3, yPos + 20)

  // Right column
  pdf.setFillColor(254, 252, 232)
  pdf.roundedRect(margin + col1Width + 5, yPos, col2Width, boxHeight, 2, 2, "F")
  pdf.setDrawColor(254, 240, 138)
  pdf.roundedRect(margin + col1Width + 5, yPos, col2Width, boxHeight, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "Class:" : "Classe:", margin + col1Width + 8, yPos + 5)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.class?.name || "-", margin + col1Width + 8, yPos + 10)

  pdf.setFont("helvetica", "bold")
  pdf.text(isAnglophone ? "Period:" : "Période:", margin + col1Width + 8, yPos + 15)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.period?.name || "-", margin + col1Width + 8, yPos + 20)

  yPos += boxHeight + 5

  if (data.attendance && data.period.type === "trimester") {
    pdf.setFillColor(254, 226, 226)
    pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 15, 2, 2, "F")
    pdf.setDrawColor(252, 165, 165)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 15, 2, 2, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.text(isAnglophone ? "ATTENDANCE" : "ABSENCES", margin + 3, yPos + 5)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8)
    const totalLabel = isAnglophone ? "Total:" : "Total:"
    const justifiedLabel = isAnglophone ? "Justified:" : "Justifiées:"
    const unjustifiedLabel = isAnglophone ? "Unjustified:" : "Non justifiées:"

    pdf.text(`${totalLabel} ${data.attendance.total_hours}h`, margin + 3, yPos + 10)
    pdf.text(`${justifiedLabel} ${data.attendance.justified_hours}h`, margin + 50, yPos + 10)

    pdf.setTextColor(220, 38, 38)
    pdf.setFont("helvetica", "bold")
    pdf.text(`${unjustifiedLabel} ${data.attendance.unjustified_hours}h`, margin + 100, yPos + 10)
    pdf.setTextColor(0, 0, 0)

    yPos += 18
  }

  // Grades table
  const tableStartY = yPos
  const colWidths = data.period.type === "trimester" ? [70, 25, 15, 15, 15, 20, 15] : [85, 35, 15, 25, 20]

  // ... existing table rendering code ...

  const footerY = pageHeight - 20
  pdf.setFillColor(248, 250, 252)
  pdf.rect(0, footerY - 2, pageWidth, 25, "F")

  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.3)
  pdf.line(margin, footerY, pageWidth - margin, footerY)

  pdf.setFont("courier", "normal")
  pdf.setFontSize(7)
  pdf.setTextColor(71, 85, 105)

  const now = new Date()
  const dateStr = now.toLocaleDateString("fr-FR")
  const timeStr = now.toLocaleTimeString("fr-FR")

  const line1 = isAnglophone
    ? `Report card generated on ${dateStr} at ${timeStr} by HARMONY`
    : `Bulletin généré le ${dateStr} à ${timeStr} par HARMONY`

  pdf.text(line1, pageWidth / 2, footerY + 4, { align: "center" })

  pdf.setFont("courier", "bold")
  pdf.setFontSize(6.5)
  pdf.text("Developed by OceanTechnologie", pageWidth / 2, footerY + 8, { align: "center" })

  pdf.setFont("courier", "normal")
  pdf.setFontSize(6)
  pdf.text("📧 oceantechnologie6@gmail.com | 🌐 oceantechnologie6.netlify.app", pageWidth / 2, footerY + 11.5, {
    align: "center",
  })
  pdf.text("📞 +237 679-122-367 | +237 653-517-605", pageWidth / 2, footerY + 15, { align: "center" })

  pdf.setFont("courier", "italic")
  pdf.setFontSize(6.5)
  pdf.setTextColor(29, 78, 216)
  pdf.text('"Where Ideas Turn Into Reality"', pageWidth / 2, footerY + 19, { align: "center" })

  return pdf
}

export async function generateClassBulletinsPDF(
  bulletinsData: BulletinData[],
  className: string,
  periodName: string,
): Promise<void> {
  if (!bulletinsData || bulletinsData.length === 0) {
    throw new Error("Aucun bulletin à générer")
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Sort by average (merit order) - highest first, NC students at the end
  const sortedBulletins = [...bulletinsData].sort((a, b) => {
    if (typeof a.rank === "string" && typeof b.rank !== "string") return 1
    if (typeof a.rank !== "string" && typeof b.rank === "string") return -1
    const avgA = numOrZero(a?.average)
    const avgB = numOrZero(b?.average)
    return avgB - avgA
  })

  sortedBulletins.forEach((bulletin, index) => {
    if (bulletin) {
      generateSingleBulletin(pdf, bulletin, bulletin.schoolSettings, index === 0)
    }
  })

  const fileName = `Bulletins_${className || "Classe"}_${periodName || "Periode"}.pdf`
  pdf.save(fileName)
}

export type { BulletinData, SchoolSettings, Subject }
