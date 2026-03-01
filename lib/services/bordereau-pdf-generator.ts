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
  if (grade === undefined) return [148, 163, 184]
  if (grade < 10) return [220, 38, 38]
  if (grade < 12) return [245, 158, 11]
  if (grade < 15) return [37, 99, 235]
  return [22, 163, 74]
}

function getGradeBgColor(grade: number | undefined): [number, number, number] {
  if (grade === undefined) return [248, 250, 252]
  if (grade < 10) return [254, 242, 242]
  if (grade < 12) return [255, 251, 235]
  if (grade < 15) return [239, 246, 255]
  return [240, 253, 244]
}

function getRankBgColor(rank: number, isNC = false): [number, number, number] {
  if (isNC) return [255, 237, 213]
  if (rank === 1) return [254, 243, 199]
  if (rank === 2) return [229, 231, 235]
  if (rank === 3) return [254, 215, 170]
  if (rank <= 5) return [219, 234, 254]
  return [248, 250, 252]
}

function getRankTextColor(rank: number, isNC = false): [number, number, number] {
  if (isNC) return [194, 65, 12]
  if (rank === 1) return [146, 64, 14]
  if (rank === 2) return [55, 65, 81]
  if (rank === 3) return [154, 52, 18]
  if (rank <= 5) return [30, 64, 175]
  return [100, 116, 139]
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
  const sortedRankedStudents = [...rankedStudents].sort((a, b) => a.rank - b.rank)
  const allStudents = [...sortedRankedStudents, ...unrankedStudents]

  const subjects = reportData.subjects
  const numSubjects = subjects.length

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

  const rowHeight = 7
  const tableHeaderHeight = 12
  const headerHeight = 42
  const footerHeight = 15

  // Calculate rows per page
  const tableStartY = margin + headerHeight + 22 + tableHeaderHeight
  const availableHeight = pageHeight - tableStartY - footerHeight - 10
  const rowsPerPage = Math.floor(availableHeight / rowHeight)

  // Helper to draw header on each page
  const drawHeader = (pageNum: number, totalPages: number) => {
    let y = margin

    // Watermark
    pdf.setTextColor(230, 230, 230)
    pdf.setFontSize(50)
    pdf.setFont("helvetica", "bold")
    pdf.text(schoolSettings.school_name || "HARMONY", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 })
    pdf.setTextColor(0, 0, 0)

    // Header background
    pdf.setFillColor(252, 251, 248)
    pdf.rect(margin, y, contentWidth, headerHeight, "F")
    pdf.setDrawColor(30, 64, 175)
    pdf.setLineWidth(1)
    pdf.line(margin, y + headerHeight, margin + contentWidth, y + headerHeight)

    const leftColX = margin + 5
    const rightColX = pageWidth - margin - 70
    const centerX = pageWidth / 2

    const poBox = schoolSettings.address?.match(/BP[:\s]*([^\s,]+)/i)?.[1] || "..."
    const tel = schoolSettings.phone || "..."

    // Left: French
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
    pdf.setFontSize(7)
    pdf.text(schoolSettings.school_name || "COLLEGE", leftColX, y + 30, { maxWidth: 60 })
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "normal")
    pdf.text(`BP.: ${poBox}`, leftColX, y + 36)
    pdf.text(`Tél.: ${tel}`, leftColX, y + 40)

    // Center: Logo
    const logoRadius = 15
    pdf.setFillColor(30, 64, 175)
    pdf.circle(centerX, y + headerHeight / 2, logoRadius, "F")
    pdf.setFillColor(255, 255, 255)
    pdf.circle(centerX, y + headerHeight / 2, logoRadius - 2, "F")
    pdf.setFillColor(30, 64, 175)
    pdf.circle(centerX, y + headerHeight / 2, logoRadius - 4, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    const schoolInitials = (schoolSettings.school_name || "H").split(" ").map((w) => w.charAt(0)).join("").substring(0, 4)
    pdf.text(schoolInitials, centerX, y + headerHeight / 2 + 4, { align: "center" })

    // Right: English
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
    pdf.setFontSize(7)
    pdf.text(schoolSettings.school_name || "COLLEGE", rightColX, y + 30, { maxWidth: 60 })
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "normal")
    pdf.text(`PO.BOX: ${poBox}`, rightColX, y + 36)
    pdf.text(`Tel: ${tel}`, rightColX, y + 40)

    // Year badge
    pdf.setFillColor(30, 64, 175)
    pdf.roundedRect(pageWidth - margin - 32, y + 2, 28, 9, 2, 2, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text(reportData.period.academic_year || "2024-2025", pageWidth - margin - 18, y + 8, { align: "center" })

    y += headerHeight + 2

    // Title
    pdf.setFillColor(30, 64, 175)
    pdf.roundedRect(pageWidth / 2 - 45, y, 90, 9, 2, 2, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    const titleText = totalPages > 1 ? `BORDEREAU DE NOTES (${pageNum}/${totalPages})` : "BORDEREAU DE NOTES"
    pdf.text(titleText, pageWidth / 2, y + 6.5, { align: "center" })

    y += 12

    // Info boxes
    const boxWidth = (contentWidth - 9) / 4
    const boxHeight = 7

    pdf.setFillColor(248, 250, 252)
    pdf.setDrawColor(37, 99, 235)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(margin, y, boxWidth, boxHeight, 1, 1, "FD")
    pdf.setTextColor(30, 41, 59)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text(`Classe: ${reportData.class.name}`, margin + 3, y + 5)

    pdf.setDrawColor(34, 197, 94)
    pdf.roundedRect(margin + boxWidth + 3, y, boxWidth, boxHeight, 1, 1, "FD")
    pdf.text(`Niveau: ${reportData.class.level?.name || "-"}`, margin + boxWidth + 6, y + 5)

    pdf.setDrawColor(236, 72, 153)
    pdf.roundedRect(margin + (boxWidth + 3) * 2, y, boxWidth, boxHeight, 1, 1, "FD")
    pdf.text(`Section: ${reportData.class.section?.name || "-"}`, margin + (boxWidth + 3) * 2 + 3, y + 5)

    pdf.setFillColor(30, 64, 175)
    pdf.roundedRect(margin + (boxWidth + 3) * 3, y, boxWidth, boxHeight, 1, 1, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.text(`Période: ${reportData.period.name}`, margin + (boxWidth + 3) * 3 + 3, y + 5)

    return y + boxHeight + 3
  }

  // Helper to draw table header
  const drawTableHeader = (y: number): number => {
    const tableX = margin
    pdf.setFillColor(30, 64, 175)
    pdf.rect(tableX, y, contentWidth, tableHeaderHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")

    let colX = tableX
    pdf.text("Rg", colX + rankColWidth / 2, y + 7, { align: "center" })
    colX += rankColWidth
    pdf.text("N°", colX + numColWidth / 2, y + 7, { align: "center" })
    colX += numColWidth
    pdf.text("Nom & Prénom", colX + 3, y + 7)
    colX += nameColWidth

    const fontSize = numSubjects > 12 ? 5 : numSubjects > 8 ? 6 : 7
    pdf.setFontSize(fontSize)
    subjects.forEach((subject) => {
      pdf.text(subject.code || subject.name.substring(0, 4), colX + subjectColWidth / 2, y + 5, { align: "center" })
      pdf.setFontSize(5)
      pdf.text(`(${subject.coefficient})`, colX + subjectColWidth / 2, y + 9, { align: "center" })
      pdf.setFontSize(fontSize)
      colX += subjectColWidth
    })

    pdf.setFontSize(7)
    pdf.text("Matricule", colX + matriculeColWidth / 2, y + 7, { align: "center" })
    colX += matriculeColWidth

    pdf.setFillColor(22, 163, 74)
    pdf.rect(colX, y, avgColWidth, tableHeaderHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.text("Moy", colX + avgColWidth / 2, y + 7, { align: "center" })
    colX += avgColWidth

    pdf.setFillColor(245, 158, 11)
    pdf.rect(colX, y, finalRankColWidth, tableHeaderHeight, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.text("Rg", colX + finalRankColWidth / 2, y + 7, { align: "center" })

    return y + tableHeaderHeight
  }

  // Helper to draw student row
  const drawStudentRow = (y: number, studentReport: StudentReport, displayIndex: number, isEven: boolean) => {
    const tableX = margin
    const isNC = studentReport.student.is_ranked === false

    if (isNC) {
      pdf.setFillColor(255, 251, 235)
    } else if (isEven) {
      pdf.setFillColor(248, 250, 252)
    } else {
      pdf.setFillColor(255, 255, 255)
    }
    pdf.rect(tableX, y, contentWidth, rowHeight, "F")

    let colX = tableX

    // Rank
    const rankBg = getRankBgColor(studentReport.rank, isNC)
    const rankText = getRankTextColor(studentReport.rank, isNC)
    pdf.setFillColor(rankBg[0], rankBg[1], rankBg[2])
    pdf.rect(colX, y, rankColWidth, rowHeight, "F")
    pdf.setTextColor(rankText[0], rankText[1], rankText[2])
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)
    pdf.text(isNC ? "NC" : String(studentReport.rank), colX + rankColWidth / 2, y + 5, { align: "center" })
    colX += rankColWidth

    // N°
    pdf.setTextColor(100, 116, 139)
    pdf.setFont("helvetica", "normal")
    pdf.text(String(displayIndex), colX + numColWidth / 2, y + 5, { align: "center" })
    colX += numColWidth

    // Name
    pdf.setTextColor(30, 41, 59)
    pdf.setFont("helvetica", "bold")
    const fullName = `${studentReport.student.last_name.toUpperCase()} ${studentReport.student.first_name}`
    pdf.text(fullName.substring(0, 28), colX + 2, y + 5)
    colX += nameColWidth

    // Grades
    pdf.setFont("helvetica", "normal")
    subjects.forEach((subject) => {
      const grade = studentReport.grades[subject.subject_id]
      const gradeBg = getGradeBgColor(grade)
      const gradeColor = getGradeColor(grade)
      pdf.setFillColor(gradeBg[0], gradeBg[1], gradeBg[2])
      pdf.rect(colX, y, subjectColWidth, rowHeight, "F")
      pdf.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2])
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "bold")
      pdf.text(grade !== undefined ? grade.toFixed(2) : "-", colX + subjectColWidth / 2, y + 5, { align: "center" })
      colX += subjectColWidth
    })

    // Matricule
    pdf.setTextColor(100, 116, 139)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "normal")
    pdf.text(studentReport.student.matricule || "-", colX + matriculeColWidth / 2, y + 5, { align: "center" })
    colX += matriculeColWidth

    // Average
    const avgBg = getGradeBgColor(studentReport.average)
    const avgColor = getGradeColor(studentReport.average)
    pdf.setFillColor(avgBg[0], avgBg[1], avgBg[2])
    pdf.rect(colX, y, avgColWidth, rowHeight, "F")
    pdf.setTextColor(avgColor[0], avgColor[1], avgColor[2])
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text(studentReport.average.toFixed(2), colX + avgColWidth / 2, y + 5, { align: "center" })
    colX += avgColWidth

    // Final rank
    const finalRankBg = getRankBgColor(studentReport.rank, isNC)
    const finalRankText = getRankTextColor(studentReport.rank, isNC)
    pdf.setFillColor(finalRankBg[0], finalRankBg[1], finalRankBg[2])
    pdf.rect(colX, y, finalRankColWidth, rowHeight, "F")
    pdf.setTextColor(finalRankText[0], finalRankText[1], finalRankText[2])
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "bold")
    pdf.text(isNC ? "NC" : String(studentReport.rank), colX + finalRankColWidth / 2, y + 5, { align: "center" })
  }

  // Helper to draw footer
  const drawFooter = () => {
    const now = new Date()
    const dateStr = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`

    pdf.setFillColor(15, 23, 42)
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F")

    pdf.setTextColor(226, 232, 240)
    pdf.setFontSize(6)
    pdf.setFont("courier", "normal")
    pdf.text(`Bordereau généré le ${dateStr} à ${timeStr} par HARMONY`, pageWidth / 2, pageHeight - 11, { align: "center" })

    pdf.setTextColor(148, 163, 184)
    pdf.setFontSize(5)
    pdf.text("Développé par OceanTechnologie | oceantechnologie6@gmail.com | oceantechnologie6.netlify.app", pageWidth / 2, pageHeight - 7, { align: "center" })
    pdf.text("Tél: +237 679-122-367 / +237 653-517-605", pageWidth / 2, pageHeight - 4, { align: "center" })

    pdf.setTextColor(96, 165, 250)
    pdf.setFont("courier", "italic")
    pdf.text("Where ideas turn into reality", pageWidth - margin - 5, pageHeight - 4, { align: "right" })
  }

  // Calculate total pages
  const totalStudents = allStudents.length
  const totalPages = Math.ceil(totalStudents / rowsPerPage)

  // Generate pages
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage()

    const startY = drawHeader(page + 1, totalPages)
    let tableY = drawTableHeader(startY)

    const startIdx = page * rowsPerPage
    const endIdx = Math.min(startIdx + rowsPerPage, totalStudents)
    let displayIndex = startIdx + 1

    for (let i = startIdx; i < endIdx; i++) {
      const studentReport = allStudents[i]
      const isEven = (i - startIdx) % 2 === 0

      // NC separator
      if (studentReport.student.is_ranked === false && i > 0 && allStudents[i - 1].student.is_ranked !== false) {
        pdf.setFillColor(255, 237, 213)
        pdf.rect(margin, tableY, contentWidth, 4, "F")
        pdf.setTextColor(194, 65, 12)
        pdf.setFontSize(6)
        pdf.setFont("helvetica", "bold")
        pdf.text("--- ÉLÈVES NON CLASSÉS (NC) ---", pageWidth / 2, tableY + 3, { align: "center" })
        tableY += 4
        displayIndex = 1
      }

      drawStudentRow(tableY, studentReport, displayIndex, isEven)
      tableY += rowHeight
      displayIndex++
    }

    // Averages row on last page
    if (page === totalPages - 1) {
      pdf.setFillColor(219, 234, 254)
      pdf.rect(margin, tableY, contentWidth, rowHeight, "F")
      let colX = margin + rankColWidth + numColWidth
      pdf.setTextColor(30, 64, 175)
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      pdf.text("MOYENNES:", colX + 2, tableY + 5)
      colX += nameColWidth

      subjects.forEach((subject) => {
        const avg = reportData.subjectAverages[subject.subject_id]
        if (avg !== undefined) {
          const color = getGradeColor(avg)
          pdf.setTextColor(color[0], color[1], color[2])
          pdf.text(avg.toFixed(2), colX + subjectColWidth / 2, tableY + 5, { align: "center" })
        }
        colX += subjectColWidth
      })

      colX += matriculeColWidth
      const classAvgColor = getGradeColor(reportData.classAverage)
      pdf.setTextColor(classAvgColor[0], classAvgColor[1], classAvgColor[2])
      pdf.setFontSize(10)
      pdf.text(reportData.classAverage.toFixed(2), colX + avgColWidth / 2, tableY + 5, { align: "center" })
    }

    drawFooter()
  }

  // Download
  const fileName = `Bordereau_${reportData.class.name}_${reportData.period.name}.pdf`.replace(/\s+/g, "_")
  pdf.save(fileName)
}
