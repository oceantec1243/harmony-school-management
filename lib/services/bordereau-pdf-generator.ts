"use client"

import jsPDF from "jspdf"

type Subject = {
  id: string
  subject_id: string
  name: string
  code: string
  coefficient: number
  group_name: string
}

type StudentReport = {
  student: {
    id: string
    matricule: string
    first_name: string
    last_name: string
    class_name?: string
    is_ranked?: boolean
  }
  grades: Record<string, number>
  average: number
  rank: number
}

type ReportData = {
  class: {
    name: string
    class_teacher: string | null
    level?: { name: string }
    section?: { name: string }
  }
  period: {
    name: string
    academic_year: string
  }
  subjects: Subject[]
  students: StudentReport[]
  classAverage: number
  subjectAverages: Record<string, number>
}

type SchoolSettings = {
  school_name?: string
  school_slogan?: string
  address?: string
  phone?: string
  logo_url?: string
  current_academic_year?: string
}

// Color functions
function getGradeColor(grade: number | undefined): [number, number, number] {
  if (grade === undefined) return [148, 163, 184] // gray
  if (grade < 10) return [220, 38, 38] // red: 0-9
  if (grade < 12) return [245, 158, 11] // yellow/orange: 10-11
  if (grade < 15) return [37, 99, 235] // blue: 12-14
  return [22, 163, 74] // green: 15-20
}

function getGradeBgColor(grade: number | undefined): [number, number, number] {
  if (grade === undefined) return [248, 250, 252]
  if (grade < 10) return [254, 242, 242] // red bg
  if (grade < 12) return [255, 251, 235] // yellow bg
  if (grade < 15) return [239, 246, 255] // blue bg
  return [240, 253, 244] // green bg
}

function getRankBgColor(rank: number, isNC = false): [number, number, number] {
  if (isNC) return [255, 237, 213] // orange bg for NC
  if (rank === 1) return [254, 243, 199] // gold
  if (rank === 2) return [229, 231, 235] // silver
  if (rank === 3) return [254, 215, 170] // bronze
  if (rank <= 5) return [219, 234, 254] // blue top 5
  return [248, 250, 252] // default
}

function getRankTextColor(rank: number, isNC = false): [number, number, number] {
  if (isNC) return [194, 65, 12] // orange text for NC
  if (rank === 1) return [146, 64, 14] // gold text
  if (rank === 2) return [55, 65, 81] // silver text
  if (rank === 3) return [154, 52, 18] // bronze text
  if (rank <= 5) return [30, 64, 175] // blue text
  return [100, 116, 139] // default
}

export async function generateBordereauPDF(
  reportData: ReportData,
  schoolSettings: SchoolSettings,
  subjectsByGroup: Record<string, Subject[]>,
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = 297
  const pageHeight = 210
  const margin = 8
  const contentWidth = pageWidth - margin * 2

  const rankedStudents = reportData.students.filter((s) => s.student.is_ranked !== false)
  const unrankedStudents = reportData.students.filter((s) => s.student.is_ranked === false)

  // Trier les élèves classés par rang, puis ajouter les non classés à la fin
  const sortedRankedStudents = [...rankedStudents].sort((a, b) => a.rank - b.rank)
  const allStudents = [...sortedRankedStudents, ...unrankedStudents]

  const subjects = reportData.subjects
  const numSubjects = subjects.length
  const numStudents = allStudents.length

  // Dynamic sizing
  const headerHeight = 42
  const infoHeight = 18
  const tableHeaderHeight = 12
  const footerHeight = 12
  const availableTableHeight = pageHeight - headerHeight - infoHeight - tableHeaderHeight - footerHeight - margin * 2
  const rowHeight = Math.min(8, Math.max(5, availableTableHeight / Math.max(numStudents + 1, 1)))

  // Column widths
  const rankColWidth = 10
  const numColWidth = 8
  const nameColWidth = 45
  const matriculeColWidth = 22
  const avgColWidth = 14
  const finalRankColWidth = 12
  const fixedColsWidth = rankColWidth + numColWidth + nameColWidth + matriculeColWidth + avgColWidth + finalRankColWidth
  const availableForSubjects = contentWidth - fixedColsWidth
  const subjectColWidth = Math.max(10, Math.min(18, availableForSubjects / Math.max(numSubjects, 1)))

  let y = margin

  // ===== WATERMARK =====
  pdf.setTextColor(220, 220, 220)
  pdf.setFontSize(60)
  pdf.setFont("helvetica", "bold")
  const watermarkText = schoolSettings.school_name || "HARMONY"
  pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  })
  pdf.setTextColor(0, 0, 0)

  // ===== HEADER - Official Cameroon Format =====
  pdf.setFillColor(252, 251, 248)
  pdf.rect(margin, y, contentWidth, headerHeight, "F")

  // Border bottom
  pdf.setDrawColor(30, 64, 175)
  pdf.setLineWidth(1)
  pdf.line(margin, y + headerHeight, margin + contentWidth, y + headerHeight)

  const leftColX = margin + 5
  const rightColX = pageWidth - margin - 70
  const centerX = pageWidth / 2

  // Extract BP and Tel from settings
  const poBox = schoolSettings.address?.match(/BP[:\s]*([^\s,]+)/i)?.[1] || ".................."
  const tel = schoolSettings.phone || ".................."

  // === LEFT SIDE: REPUBLIQUE DU CAMEROUN ===
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIQUE DU CAMEROUN", leftColX, y + 6)

  pdf.setFontSize(7)
  pdf.setFont("helvetica", "italic")
  pdf.text("Paix – Travail – Patrie", leftColX, y + 10)

  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("**********", leftColX, y + 14)

  pdf.setFontSize(7)
  pdf.text("MINISTERE DES ENSEIGNEMENTS", leftColX, y + 18)
  pdf.text("SECONDAIRES", leftColX, y + 22)

  pdf.setFontSize(6)
  pdf.text("**********", leftColX, y + 26)

  // School name on left
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text(schoolSettings.school_name || "COLLEGE", leftColX, y + 30, { maxWidth: 60 })

  // BP and Tel on left
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "normal")
  pdf.text(`BP.: ${poBox}`, leftColX, y + 36)
  pdf.text(`Tél.: ${tel}`, leftColX, y + 40)

  // === CENTER: LOGO ===
  const logoRadius = 15
  const logoCenterX = centerX
  const logoCenterY = y + headerHeight / 2

  // Logo circle background
  pdf.setFillColor(30, 64, 175)
  pdf.circle(logoCenterX, logoCenterY, logoRadius, "F")

  // Inner circle
  pdf.setFillColor(255, 255, 255)
  pdf.circle(logoCenterX, logoCenterY, logoRadius - 2, "F")

  // Another inner circle
  pdf.setFillColor(30, 64, 175)
  pdf.circle(logoCenterX, logoCenterY, logoRadius - 4, "F")

  // School initials in center
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  const schoolInitials = (schoolSettings.school_name || "HARMONY")
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .substring(0, 4)
  pdf.text(schoolInitials, logoCenterX, logoCenterY + 4, { align: "center" })

  // === RIGHT SIDE: REPUBLIC OF CAMEROON ===
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIC OF CAMEROON", rightColX, y + 6)

  pdf.setFontSize(7)
  pdf.setFont("helvetica", "italic")
  pdf.text("Peace – Work – Fatherland", rightColX, y + 10)

  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("**********", rightColX, y + 14)

  pdf.setFontSize(7)
  pdf.text("MINISTRY OF SECONDARY", rightColX, y + 18)
  pdf.text("EDUCATION", rightColX, y + 22)

  pdf.setFontSize(6)
  pdf.text("**********", rightColX, y + 26)

  // School name on right
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text(schoolSettings.school_name || "COLLEGE", rightColX, y + 30, { maxWidth: 60 })

  // PO.BOX and Tel on right
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "normal")
  pdf.text(`PO.BOX: ${poBox}`, rightColX, y + 36)
  pdf.text(`Tel: ${tel}`, rightColX, y + 40)

  // Academic year badge (top right corner)
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(pageWidth - margin - 32, y + 2, 28, 9, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.text(
    reportData.period.academic_year || schoolSettings.current_academic_year || "2024-2025",
    pageWidth - margin - 18,
    y + 8,
    { align: "center" },
  )

  y += headerHeight + 2

  // ===== TITLE: BORDEREAU DE NOTES =====
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(pageWidth / 2 - 40, y, 80, 9, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text("BORDEREAU DE NOTES", pageWidth / 2, y + 6.5, { align: "center" })

  y += 12

  // ===== INFO BOXES =====
  const boxWidth = (contentWidth - 9) / 4
  const boxHeight = 14
  const boxY = y

  // Box 1: CLASSE
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(37, 99, 235)
  pdf.setLineWidth(0.5)
  pdf.roundedRect(margin, boxY, boxWidth, boxHeight, 2, 2, "FD")
  pdf.setTextColor(37, 99, 235)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("CLASSE", margin + boxWidth / 2, boxY + 4, { align: "center" })
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(11)
  pdf.text(reportData.class.name, margin + boxWidth / 2, boxY + 11, { align: "center" })

  // Box 2: NIVEAU
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(34, 197, 94)
  pdf.roundedRect(margin + boxWidth + 3, boxY, boxWidth, boxHeight, 2, 2, "FD")
  pdf.setTextColor(34, 197, 94)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("NIVEAU", margin + boxWidth + 3 + boxWidth / 2, boxY + 4, { align: "center" })
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(11)
  pdf.text(reportData.class.level?.name || "-", margin + boxWidth + 3 + boxWidth / 2, boxY + 11, { align: "center" })

  // Box 3: SECTION
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(236, 72, 153)
  pdf.roundedRect(margin + (boxWidth + 3) * 2, boxY, boxWidth, boxHeight, 2, 2, "FD")
  pdf.setTextColor(236, 72, 153)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("SECTION", margin + (boxWidth + 3) * 2 + boxWidth / 2, boxY + 4, { align: "center" })
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(11)
  pdf.text(reportData.class.section?.name || "-", margin + (boxWidth + 3) * 2 + boxWidth / 2, boxY + 11, {
    align: "center",
  })

  // Box 4: PERIODE
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(margin + (boxWidth + 3) * 3, boxY, boxWidth, boxHeight, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("PÉRIODE", margin + (boxWidth + 3) * 3 + boxWidth / 2, boxY + 4, { align: "center" })
  pdf.setFontSize(11)
  pdf.text(reportData.period.name, margin + (boxWidth + 3) * 3 + boxWidth / 2, boxY + 11, { align: "center" })

  y += boxHeight + 3

  // ===== STATISTICS =====
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(71, 85, 105)
  const passingStudents = rankedStudents.filter((s) => s.average >= 10).length
  const passRate = rankedStudents.length > 0 ? Math.round((passingStudents / rankedStudents.length) * 100) : 0
  pdf.text(`Effectif: ${allStudents.length} élèves (${unrankedStudents.length} NC)`, margin, y + 3)
  pdf.text(`Taux de réussite: ${passRate}%`, margin + 55, y + 3)
  pdf.text(`Prof. Principal: ${reportData.class.class_teacher || "Non assigné"}`, margin + 110, y + 3)

  y += 6

  // ===== TABLE =====
  const tableX = margin
  let tableY = y
  const tableWidth = contentWidth

  // Table header background
  pdf.setFillColor(30, 64, 175)
  pdf.rect(tableX, tableY, tableWidth, tableHeaderHeight, "F")

  // Header text
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")

  let colX = tableX

  // Rg column
  pdf.text("Rg", colX + rankColWidth / 2, tableY + 7, { align: "center" })
  colX += rankColWidth

  // N° column
  pdf.text("N°", colX + numColWidth / 2, tableY + 7, { align: "center" })
  colX += numColWidth

  // Nom & Prénom column
  pdf.text("Nom & Prénom", colX + 3, tableY + 7)
  colX += nameColWidth

  // Subject columns
  const fontSize = numSubjects > 12 ? 5 : numSubjects > 8 ? 6 : 7
  pdf.setFontSize(fontSize)
  subjects.forEach((subject) => {
    const name = subject.code || subject.name.substring(0, 4)
    pdf.text(name, colX + subjectColWidth / 2, tableY + 5, { align: "center" })
    pdf.setFontSize(5)
    pdf.text(`(${subject.coefficient})`, colX + subjectColWidth / 2, tableY + 9, { align: "center" })
    pdf.setFontSize(fontSize)
    colX += subjectColWidth
  })

  // Matricule
  pdf.setFontSize(7)
  pdf.text("Matricule", colX + matriculeColWidth / 2, tableY + 7, { align: "center" })
  colX += matriculeColWidth

  // Moy column
  pdf.setFillColor(22, 163, 74)
  pdf.rect(colX, tableY, avgColWidth, tableHeaderHeight, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.text("Moy", colX + avgColWidth / 2, tableY + 7, { align: "center" })
  colX += avgColWidth

  // Rg final column
  pdf.setFillColor(245, 158, 11)
  pdf.rect(colX, tableY, finalRankColWidth, tableHeaderHeight, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.text("Rg", colX + finalRankColWidth / 2, tableY + 7, { align: "center" })

  tableY += tableHeaderHeight

  // ===== TABLE ROWS =====
  let displayIndex = 0
  allStudents.forEach((studentReport, index) => {
    const isNC = studentReport.student.is_ranked === false
    const isEven = index % 2 === 0

    if (isNC && index > 0 && allStudents[index - 1].student.is_ranked !== false) {
      // Dessiner une ligne de séparation
      pdf.setFillColor(255, 237, 213)
      pdf.rect(tableX, tableY, tableWidth, 4, "F")
      pdf.setTextColor(194, 65, 12)
      pdf.setFontSize(6)
      pdf.setFont("helvetica", "bold")
      pdf.text("--- ÉLÈVES NON CLASSÉS (NC) ---", pageWidth / 2, tableY + 3, { align: "center" })
      tableY += 4
      displayIndex = 0
    }

    // Row background
    if (isNC) {
      pdf.setFillColor(255, 251, 235) // orange très clair pour NC
    } else if (isEven) {
      pdf.setFillColor(248, 250, 252)
    } else {
      pdf.setFillColor(255, 255, 255)
    }
    pdf.rect(tableX, tableY, tableWidth, rowHeight, "F")

    colX = tableX
    pdf.setFontSize(8)

    // Rank cell with color
    const rankBg = getRankBgColor(studentReport.rank, isNC)
    const rankText = getRankTextColor(studentReport.rank, isNC)
    pdf.setFillColor(rankBg[0], rankBg[1], rankBg[2])
    pdf.rect(colX, tableY, rankColWidth, rowHeight, "F")
    pdf.setTextColor(rankText[0], rankText[1], rankText[2])
    pdf.setFont("helvetica", "bold")

    if (isNC) {
      pdf.text("NC", colX + rankColWidth / 2, tableY + rowHeight / 2 + 2, { align: "center" })
    } else {
      pdf.text(
        studentReport.rank <= 3
          ? `${studentReport.rank}${studentReport.rank === 1 ? "er" : "e"}`
          : String(studentReport.rank),
        colX + rankColWidth / 2,
        tableY + rowHeight / 2 + 2,
        { align: "center" },
      )
    }
    colX += rankColWidth

    // N° column
    displayIndex++
    pdf.setTextColor(100, 116, 139)
    pdf.setFont("helvetica", "normal")
    pdf.text(String(displayIndex), colX + numColWidth / 2, tableY + rowHeight / 2 + 2, { align: "center" })
    colX += numColWidth

    // Name column
    pdf.setTextColor(30, 41, 59)
    pdf.setFont("helvetica", "bold")
    const fullName = `${studentReport.student.last_name.toUpperCase()} ${studentReport.student.first_name}`
    pdf.text(fullName.substring(0, 28), colX + 2, tableY + rowHeight / 2 + 2)
    colX += nameColWidth

    // Grade columns
    pdf.setFont("helvetica", "normal")
    subjects.forEach((subject) => {
      const grade = studentReport.grades[subject.subject_id]
      const gradeBg = getGradeBgColor(grade)
      const gradeColor = getGradeColor(grade)

      pdf.setFillColor(gradeBg[0], gradeBg[1], gradeBg[2])
      pdf.rect(colX, tableY, subjectColWidth, rowHeight, "F")

      pdf.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2])
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "bold")
      pdf.text(grade !== undefined ? grade.toFixed(2) : "-", colX + subjectColWidth / 2, tableY + rowHeight / 2 + 2, {
        align: "center",
      })

      colX += subjectColWidth
    })

    // Matricule
    pdf.setTextColor(100, 116, 139)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "normal")
    pdf.text(studentReport.student.matricule || "-", colX + matriculeColWidth / 2, tableY + rowHeight / 2 + 2, {
      align: "center",
    })
    colX += matriculeColWidth

    // Average
    const avgBg = getGradeBgColor(studentReport.average)
    const avgColor = getGradeColor(studentReport.average)
    pdf.setFillColor(avgBg[0], avgBg[1], avgBg[2])
    pdf.rect(colX, tableY, avgColWidth, rowHeight, "F")
    pdf.setTextColor(avgColor[0], avgColor[1], avgColor[2])
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text(studentReport.average.toFixed(2), colX + avgColWidth / 2, tableY + rowHeight / 2 + 2, { align: "center" })
    colX += avgColWidth

    // Final rank
    const finalRankBg = getRankBgColor(studentReport.rank, isNC)
    const finalRankText = getRankTextColor(studentReport.rank, isNC)
    pdf.setFillColor(finalRankBg[0], finalRankBg[1], finalRankBg[2])
    pdf.rect(colX, tableY, finalRankColWidth, rowHeight, "F")
    pdf.setTextColor(finalRankText[0], finalRankText[1], finalRankText[2])
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")

    if (isNC) {
      pdf.text("NC", colX + finalRankColWidth / 2, tableY + rowHeight / 2 + 2, { align: "center" })
    } else {
      pdf.text(
        studentReport.rank <= 3
          ? `${studentReport.rank}${studentReport.rank === 1 ? "er" : "e"}`
          : String(studentReport.rank),
        colX + finalRankColWidth / 2,
        tableY + rowHeight / 2 + 2,
        { align: "center" },
      )
    }

    tableY += rowHeight
  })

  // ===== AVERAGES ROW =====
  pdf.setFillColor(219, 234, 254)
  pdf.rect(tableX, tableY, tableWidth, rowHeight, "F")

  colX = tableX
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")

  colX += rankColWidth + numColWidth
  pdf.text("MOYENNES:", colX + 2, tableY + rowHeight / 2 + 2)
  colX += nameColWidth

  // Subject averages
  subjects.forEach((subject) => {
    const avg = reportData.subjectAverages[subject.subject_id]
    if (avg !== undefined) {
      const color = getGradeColor(avg)
      pdf.setTextColor(color[0], color[1], color[2])
      pdf.text(avg.toFixed(2), colX + subjectColWidth / 2, tableY + rowHeight / 2 + 2, { align: "center" })
    }
    colX += subjectColWidth
  })

  colX += matriculeColWidth

  // Class average
  const classAvgColor = getGradeColor(reportData.classAverage)
  pdf.setTextColor(classAvgColor[0], classAvgColor[1], classAvgColor[2])
  pdf.setFontSize(10)
  pdf.text(reportData.classAverage.toFixed(2), colX + avgColWidth / 2, tableY + rowHeight / 2 + 2, { align: "center" })

  // ===== FOOTER =====
  const now = new Date()
  const day = now.getDate().toString().padStart(2, "0")
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const year = now.getFullYear()
  const hours = now.getHours().toString().padStart(2, "0")
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const seconds = now.getSeconds().toString().padStart(2, "0")

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "normal")
  const footerText = `Bordereau généré le ${day}/${month}/${year} à ${hours}:${minutes}:${seconds} par HARMONY - Développé par OceanTechnologie`
  pdf.text(footerText, pageWidth / 2, pageHeight - 5, { align: "center" })

  // ===== LEGEND =====
  const legendY = pageHeight - 12
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(100, 116, 139)
  pdf.text("Légende: ", margin, legendY)

  // Color legend
  let legendX = margin + 15
  pdf.setFillColor(254, 242, 242)
  pdf.rect(legendX, legendY - 3, 4, 4, "F")
  pdf.setTextColor(220, 38, 38)
  pdf.text("0-9", legendX + 5, legendY)

  legendX += 15
  pdf.setFillColor(255, 251, 235)
  pdf.rect(legendX, legendY - 3, 4, 4, "F")
  pdf.setTextColor(245, 158, 11)
  pdf.text("10-11", legendX + 5, legendY)

  legendX += 15
  pdf.setFillColor(239, 246, 255)
  pdf.rect(legendX, legendY - 3, 4, 4, "F")
  pdf.setTextColor(37, 99, 235)
  pdf.text("12-14", legendX + 5, legendY)

  legendX += 15
  pdf.setFillColor(240, 253, 244)
  pdf.rect(legendX, legendY - 3, 4, 4, "F")
  pdf.setTextColor(22, 163, 74)
  pdf.text("15-20", legendX + 5, legendY)

  legendX += 18
  pdf.setFillColor(255, 237, 213)
  pdf.rect(legendX, legendY - 3, 4, 4, "F")
  pdf.setTextColor(194, 65, 12)
  pdf.text("NC = Non Classé", legendX + 5, legendY)

  // Save PDF
  const filename = `Bordereau_${reportData.class.name}_${reportData.period.name}.pdf`
  pdf.save(filename)
}
