"use client"

// Types
interface BulletinSubject {
  name: string
  teacher?: string
  coefficient: number
  score1?: number
  score2?: number
  average?: number
  group: string
  rank?: number
  classSize?: number
}

interface BulletinData {
  student: {
    firstName: string
    lastName: string
    matricule: string
    dateOfBirth?: string
    placeOfBirth?: string
    gender?: string
    isRanked?: boolean
  }
  className: string
  periodName: string
  periodType: "sequence" | "trimester"
  academicYear: string
  section: string
  subjects: BulletinSubject[]
  average: number
  rank: number | string
  classSize: number
  classAverage: number
  attendance?: {
    total_hours: number
    justified_hours: number
    unjustified_hours: number
  }
  schoolSettings: {
    school_name: string
    school_slogan?: string
    address?: string
    phone?: string
    email?: string
    po_box?: string
    logo_url?: string
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

function getGradeColor(grade: number | undefined | null): [number, number, number] {
  if (grade === undefined || grade === null || isNaN(grade)) return [100, 100, 100] // Gris pour "-"
  if (grade < 10) return [220, 38, 38] // Rouge 0-9
  if (grade < 12) return [234, 179, 8] // Jaune 10-11
  if (grade < 15) return [37, 99, 235] // Bleu 12-14
  return [22, 163, 74] // Vert 15-20
}

function getAppreciation(score: number | undefined | null, isAnglophone: boolean): string {
  if (score === undefined || score === null || isNaN(score)) return "-"
  if (isAnglophone) {
    if (score >= 18) return "Excellent"
    if (score >= 16) return "Very Good"
    if (score >= 14) return "Good"
    if (score >= 12) return "Fairly Good"
    if (score >= 10) return "Average"
    if (score >= 8) return "Below Average"
    return "Poor"
  }
  if (score >= 18) return "Excellent"
  if (score >= 16) return "Très Bien"
  if (score >= 14) return "Bien"
  if (score >= 12) return "Assez Bien"
  if (score >= 10) return "Passable"
  if (score >= 8) return "Insuffisant"
  return "Faible"
}

function getDistinction(average: number, isAnglophone: boolean): string {
  if (isAnglophone) {
    if (average >= 16) return "Congratulations from the Council"
    if (average >= 14) return "Encouragement"
    if (average >= 12) return "Honorable Mention"
    if (average < 8) return "Warning"
    return ""
  }
  if (average >= 16) return "Félicitations du Conseil"
  if (average >= 14) return "Encouragements"
  if (average >= 12) return "Tableau d'Honneur"
  if (average < 8) return "Avertissement"
  return ""
}

function generateObservation(data: BulletinData, isAnglophone: boolean): string {
  const avg = data.average
  const weakSubjects = data.subjects
    .filter((s) => s.average !== undefined && s.average < 10)
    .slice(0, 3)
    .map((s) => s.name)

  const attendance = data.attendance
  let observation = ""

  if (isAnglophone) {
    if (avg >= 16) observation = "Excellent performance! Keep up the outstanding work."
    else if (avg >= 14) observation = "Very good results. Continue your efforts to reach excellence."
    else if (avg >= 12) observation = "Good work but you can still improve."
    else if (avg >= 10) observation = "Average performance. More effort is required."
    else observation = "Results below expectations. Serious effort needed to improve."

    if (weakSubjects.length > 0) {
      observation += ` Must improve in: ${weakSubjects.join(", ")}.`
    }
    if (attendance && attendance.total_hours > 10) {
      observation += ` Excessive absences (${attendance.total_hours}h). Attendance must improve.`
    }
  } else {
    if (avg >= 16) observation = "Excellente performance! Continuez ainsi."
    else if (avg >= 14) observation = "Très bons résultats. Poursuivez vos efforts vers l'excellence."
    else if (avg >= 12) observation = "Bon travail mais vous pouvez encore vous améliorer."
    else if (avg >= 10) observation = "Performance moyenne. Plus d'efforts sont nécessaires."
    else observation = "Résultats insuffisants. Un effort sérieux est nécessaire."

    if (weakSubjects.length > 0) {
      observation += ` À améliorer: ${weakSubjects.join(", ")}.`
    }
    if (attendance && attendance.total_hours > 10) {
      observation += ` Absences excessives (${attendance.total_hours}h). L'assiduité doit s'améliorer.`
    }
  }

  return observation
}

async function loadLogo(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// PDF Generation
export async function generateBulletinPDF(data: BulletinData): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const isAnglophone = data.section?.toLowerCase().includes("anglo")

  // Load logo if URL provided
  let logoData: string | null = null
  if (data.schoolSettings.logo_url) {
    logoData = await loadLogo(data.schoolSettings.logo_url)
  }

  await drawBulletinPage(pdf, data, isAnglophone, logoData)

  const fileName = `Bulletin_${data.student.lastName}_${data.student.firstName}_${data.periodName}.pdf`
  pdf.save(fileName)
}

// Mass PDF Generation
export async function generateMassBulletinsPDF(
  bulletins: BulletinData[],
  className: string,
  periodName: string,
): Promise<void> {
  if (bulletins.length === 0) return

  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  // Sort by average (ranked first, then NC)
  const sorted = [...bulletins].sort((a, b) => {
    const aRanked = a.student.isRanked !== false
    const bRanked = b.student.isRanked !== false
    if (aRanked && !bRanked) return -1
    if (!aRanked && bRanked) return 1
    return numOrZero(b.average) - numOrZero(a.average)
  })

  // Load logo once
  let logoData: string | null = null
  if (sorted[0]?.schoolSettings.logo_url) {
    logoData = await loadLogo(sorted[0].schoolSettings.logo_url)
  }

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) pdf.addPage()
    const isAnglophone = sorted[i].section?.toLowerCase().includes("anglo")
    await drawBulletinPage(pdf, sorted[i], isAnglophone, logoData)
  }

  const fileName = `Bulletins_${className}_${periodName}.pdf`
  pdf.save(fileName)
}

async function drawBulletinPage(
  pdf: any,
  data: BulletinData,
  isAnglophone: boolean,
  logoData: string | null,
): Promise<void> {
  const pageWidth = 210
  const pageHeight = 297
  const margin = 8
  const contentWidth = pageWidth - 2 * margin
  let y = 8

  // Textes bilingues
  const texts = isAnglophone
    ? {
        reportCard: "REPORT CARD",
        name: "Name",
        matricule: "Reg. No",
        dob: "Date of Birth",
        pob: "Place of Birth",
        gender: "Gender",
        class: "Class",
        enrollment: "Enrollment",
        period: "Period",
        year: "Academic Year",
        subject: "Subject",
        teacher: "Teacher",
        coef: "Coef",
        seq1: "Seq 1",
        seq2: "Seq 2",
        avg: "Avg",
        rank: "Rank",
        appreciation: "Appreciation",
        average: "Average",
        classAvg: "Class Avg",
        classRank: "Rank",
        distinction: "Distinction",
        observation: "Council Observation",
        absences: "ABSENCES",
        totalHours: "Total",
        justified: "Justified",
        unjustified: "Unjustified",
        generatedBy: "Report card generated on",
        classTeacher: "Class Teacher",
        parent: "Parent/Guardian",
        principal: "Principal",
      }
    : {
        reportCard: "BULLETIN DE NOTES",
        name: "Nom & Prénom",
        matricule: "Matricule",
        dob: "Date de Naissance",
        pob: "Lieu de Naissance",
        gender: "Sexe",
        class: "Classe",
        enrollment: "Effectif",
        period: "Période",
        year: "Année Scolaire",
        subject: "Matière",
        teacher: "Enseignant",
        coef: "Coef",
        seq1: "Séq 1",
        seq2: "Séq 2",
        avg: "Moy",
        rank: "Rang",
        appreciation: "Appréciation",
        average: "Moyenne",
        classAvg: "Moy. Classe",
        classRank: "Rang",
        distinction: "Distinction",
        observation: "Observation du Conseil",
        absences: "ABSENCES",
        totalHours: "Total",
        justified: "Justifiées",
        unjustified: "Non Justifiées",
        generatedBy: "Bulletin généré le",
        classTeacher: "Prof. Principal",
        parent: "Parent/Tuteur",
        principal: "Le Proviseur",
      }

  if (logoData) {
    pdf.setGState(new pdf.GState({ opacity: 0.08 }))
    const watermarkSize = 100 // ~100mm for 410px equivalent
    const watermarkX = (pageWidth - watermarkSize) / 2
    const watermarkY = (pageHeight - watermarkSize) / 2
    try {
      pdf.addImage(logoData, "PNG", watermarkX, watermarkY, watermarkSize, watermarkSize)
    } catch (e) {
      // Fallback: draw circle with initials
    }
    pdf.setGState(new pdf.GState({ opacity: 1 }))
  } else {
    // Fallback watermark with initials
    pdf.setGState(new pdf.GState({ opacity: 0.06 }))
    pdf.setFillColor(30, 64, 175)
    pdf.circle(pageWidth / 2, pageHeight / 2, 50, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(40)
    pdf.setFont("helvetica", "bold")
    const initials = (data.schoolSettings.school_name || "CPLS")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 4)
    pdf.text(initials, pageWidth / 2, pageHeight / 2 + 10, { align: "center" })
    pdf.setGState(new pdf.GState({ opacity: 1 }))
  }

  // === HEADER ===
  pdf.setFillColor(252, 251, 248)
  pdf.rect(0, 0, pageWidth, 42, "F")

  const logoX = pageWidth / 2
  const logoY = 16
  const logoRadius = 10

  if (logoData) {
    try {
      pdf.addImage(logoData, "PNG", logoX - logoRadius, logoY - logoRadius, logoRadius * 2, logoRadius * 2)
    } catch (e) {
      // Fallback circle
      pdf.setFillColor(30, 64, 175)
      pdf.circle(logoX, logoY, logoRadius, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      const initials = (data.schoolSettings.school_name || "CPLS")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 4)
      pdf.text(initials, logoX, logoY + 2, { align: "center" })
    }
  } else {
    pdf.setFillColor(30, 64, 175)
    pdf.circle(logoX, logoY, logoRadius, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    const initials = (data.schoolSettings.school_name || "CPLS")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 4)
    pdf.text(initials, logoX, logoY + 2, { align: "center" })
  }

  // Left side (French)
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIQUE DU CAMEROUN", margin + 28, 7, { align: "center" })
  pdf.setFont("helvetica", "italic")
  pdf.setFontSize(6)
  pdf.text("Paix - Travail - Patrie", margin + 28, 11, { align: "center" })
  pdf.text("***********", margin + 28, 14, { align: "center" })
  pdf.setFont("helvetica", "normal")
  pdf.text("MINISTERE DES ENSEIGNEMENTS", margin + 28, 18, { align: "center" })
  pdf.text("SECONDAIRES", margin + 28, 21, { align: "center" })
  pdf.text("***********", margin + 28, 24, { align: "center" })
  pdf.setFontSize(5)
  pdf.text(data.schoolSettings.school_name || "", margin + 28, 28, { align: "center" })
  if (data.schoolSettings.po_box) pdf.text(`B.P: ${data.schoolSettings.po_box}`, margin + 28, 32, { align: "center" })
  if (data.schoolSettings.phone) pdf.text(`Tél: ${data.schoolSettings.phone}`, margin + 28, 36, { align: "center" })

  // Right side (English)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIC OF CAMEROON", pageWidth - margin - 28, 7, { align: "center" })
  pdf.setFont("helvetica", "italic")
  pdf.setFontSize(6)
  pdf.text("Peace - Work - Fatherland", pageWidth - margin - 28, 11, { align: "center" })
  pdf.text("***********", pageWidth - margin - 28, 14, { align: "center" })
  pdf.setFont("helvetica", "normal")
  pdf.text("MINISTRY OF SECONDARY", pageWidth - margin - 28, 18, { align: "center" })
  pdf.text("EDUCATION", pageWidth - margin - 28, 21, { align: "center" })
  pdf.text("***********", pageWidth - margin - 28, 24, { align: "center" })
  pdf.setFontSize(5)
  pdf.text(data.schoolSettings.school_name || "", pageWidth - margin - 28, 28, { align: "center" })
  if (data.schoolSettings.po_box)
    pdf.text(`P.O.Box: ${data.schoolSettings.po_box}`, pageWidth - margin - 28, 32, { align: "center" })
  if (data.schoolSettings.phone)
    pdf.text(`Tel: ${data.schoolSettings.phone}`, pageWidth - margin - 28, 36, { align: "center" })

  y = 44

  // === TITLE ===
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(pageWidth / 2 - 35, y, 70, 8, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.text(texts.reportCard, pageWidth / 2, y + 6, { align: "center" })

  y += 12

  // === STUDENT INFO ===
  pdf.setTextColor(0, 0, 0)
  pdf.setDrawColor(200, 200, 220)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, "S")
  pdf.setFontSize(7)

  const col1 = margin + 3
  const col2 = margin + contentWidth / 2 + 3
  let infoY = y + 4

  // Column 1
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.name}:`, col1, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text(`${data.student.lastName.toUpperCase()} ${data.student.firstName}`, col1 + 25, infoY)

  infoY += 4.5
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.matricule}:`, col1, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.student.matricule || "-", col1 + 25, infoY)

  infoY += 4.5
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.dob}:`, col1, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.student.dateOfBirth || "-", col1 + 25, infoY)

  infoY += 4.5
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.pob}:`, col1, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text((data.student.placeOfBirth || "-").substring(0, 25), col1 + 25, infoY)

  // Column 2
  infoY = y + 4
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.class}:`, col2, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.className || "-", col2 + 22, infoY)

  infoY += 4.5
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.enrollment}:`, col2, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text(String(data.classSize || 0), col2 + 22, infoY)

  infoY += 4.5
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.period}:`, col2, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.periodName || "-", col2 + 22, infoY)

  infoY += 4.5
  pdf.setFont("helvetica", "bold")
  pdf.text(`${texts.year}:`, col2, infoY)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.academicYear || "-", col2 + 22, infoY)

  y += 25

  // === GRADES TABLE ===
  const isTrimester = data.periodType === "trimester"

  let cols: { label: string; width: number; align: string }[]
  if (isTrimester) {
    cols = [
      { label: texts.subject, width: 42, align: "left" },
      { label: texts.teacher, width: 28, align: "left" },
      { label: texts.coef, width: 10, align: "center" },
      { label: texts.seq1, width: 14, align: "center" },
      { label: texts.seq2, width: 14, align: "center" },
      { label: texts.avg, width: 14, align: "center" },
      { label: texts.rank, width: 16, align: "center" },
      { label: texts.appreciation, width: 56, align: "center" },
    ]
  } else {
    cols = [
      { label: texts.subject, width: 50, align: "left" },
      { label: texts.teacher, width: 32, align: "left" },
      { label: texts.coef, width: 12, align: "center" },
      { label: texts.avg, width: 18, align: "center" },
      { label: texts.rank, width: 18, align: "center" },
      { label: texts.appreciation, width: 64, align: "center" },
    ]
  }

  // Table header
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, 6, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")

  let colX = margin
  for (const col of cols) {
    const textX = col.align === "center" ? colX + col.width / 2 : colX + 1
    pdf.text(col.label, textX, y + 4, { align: col.align === "center" ? "center" : "left" })
    colX += col.width
  }

  y += 6

  // Group subjects
  const groups: Record<string, BulletinSubject[]> = {}
  for (const subj of data.subjects) {
    const g = subj.group || "Autres"
    if (!groups[g]) groups[g] = []
    groups[g].push(subj)
  }

  pdf.setFontSize(6)
  let rowIndex = 0

  for (const [groupName, subjects] of Object.entries(groups)) {
    // Group header
    pdf.setFillColor(235, 235, 250)
    pdf.rect(margin, y, contentWidth, 4.5, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFont("helvetica", "bold")
    pdf.text(groupName.toUpperCase(), margin + 2, y + 3)
    y += 4.5

    // Subjects
    for (const subj of subjects) {
      // Alternate row colors - very light
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(250, 250, 255)
        pdf.rect(margin, y, contentWidth, 4.5, "F")
      }

      // Draw grid lines
      pdf.setDrawColor(220, 220, 230)
      pdf.setLineWidth(0.1)
      pdf.line(margin, y + 4.5, margin + contentWidth, y + 4.5)

      pdf.setFont("helvetica", "normal")

      colX = margin
      if (isTrimester) {
        // Subject
        pdf.setTextColor(0, 0, 0)
        pdf.text((subj.name || "").substring(0, 20), colX + 1, y + 3)
        colX += 42
        // Teacher
        pdf.text((subj.teacher || "-").substring(0, 14), colX + 1, y + 3)
        colX += 28
        // Coef
        pdf.text(String(subj.coefficient || 1), colX + 5, y + 3, { align: "center" })
        colX += 10
        // Seq 1 - colored text only
        const c1 = getGradeColor(subj.score1)
        pdf.setTextColor(c1[0], c1[1], c1[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(subj.score1), colX + 7, y + 3, { align: "center" })
        colX += 14
        // Seq 2 - colored text only
        const c2 = getGradeColor(subj.score2)
        pdf.setTextColor(c2[0], c2[1], c2[2])
        pdf.text(safeNum(subj.score2), colX + 7, y + 3, { align: "center" })
        colX += 14
        // Average - colored text only
        const cAvg = getGradeColor(subj.average)
        pdf.setTextColor(cAvg[0], cAvg[1], cAvg[2])
        pdf.text(safeNum(subj.average), colX + 7, y + 3, { align: "center" })
        colX += 14
        // Rank
        pdf.setTextColor(0, 0, 0)
        pdf.setFont("helvetica", "normal")
        const rankText = subj.rank ? `${subj.rank}/${subj.classSize || "-"}` : "-"
        pdf.text(rankText, colX + 8, y + 3, { align: "center" })
        colX += 16
        // Appreciation
        pdf.text(getAppreciation(subj.average, isAnglophone), colX + 28, y + 3, { align: "center" })
      } else {
        // Subject
        pdf.setTextColor(0, 0, 0)
        pdf.text((subj.name || "").substring(0, 25), colX + 1, y + 3)
        colX += 50
        // Teacher
        pdf.text((subj.teacher || "-").substring(0, 16), colX + 1, y + 3)
        colX += 32
        // Coef
        pdf.text(String(subj.coefficient || 1), colX + 6, y + 3, { align: "center" })
        colX += 12
        // Grade - colored text only
        const cAvg = getGradeColor(subj.average)
        pdf.setTextColor(cAvg[0], cAvg[1], cAvg[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(subj.average), colX + 9, y + 3, { align: "center" })
        colX += 18
        // Rank
        pdf.setTextColor(0, 0, 0)
        pdf.setFont("helvetica", "normal")
        const rankText = subj.rank ? `${subj.rank}/${subj.classSize || "-"}` : "-"
        pdf.text(rankText, colX + 9, y + 3, { align: "center" })
        colX += 18
        // Appreciation
        pdf.text(getAppreciation(subj.average, isAnglophone), colX + 32, y + 3, { align: "center" })
      }

      y += 4.5
      rowIndex++
    }

    // Group average
    const groupAvg =
      subjects.reduce((sum, s) => sum + numOrZero(s.average) * (s.coefficient || 1), 0) /
      subjects.reduce((sum, s) => sum + (s.coefficient || 1), 0)

    pdf.setFillColor(245, 247, 255)
    pdf.rect(margin, y, contentWidth, 4, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(5.5)
    const groupAvgLabel = isAnglophone ? "Group Average" : "Moyenne du Groupe"
    pdf.text(`${groupAvgLabel}: ${safeNum(groupAvg)}`, margin + contentWidth - 40, y + 2.8)
    y += 4.5
    pdf.setFontSize(6)
  }

  // === GENERAL RESULTS ===
  y += 2
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")

  const resCol1 = margin + contentWidth / 4
  const resCol2 = margin + contentWidth / 2
  const resCol3 = margin + (3 * contentWidth) / 4

  pdf.text(`${texts.average}: ${safeNum(data.average)}`, resCol1, y + 5, { align: "center" })
  pdf.text(`${texts.classAvg}: ${safeNum(data.classAverage)}`, resCol2, y + 5, { align: "center" })
  const rankDisplay = data.student.isRanked === false ? "NC" : `${data.rank}/${data.classSize}`
  pdf.text(`${texts.classRank}: ${rankDisplay}`, resCol3, y + 5, { align: "center" })

  const distinction = getDistinction(data.average, isAnglophone)
  if (distinction) {
    pdf.setFontSize(7)
    pdf.text(`${texts.distinction}: ${distinction}`, pageWidth / 2, y + 11, { align: "center" })
  }

  y += 17

  // === ABSENCES & OBSERVATION TABLE ===
  pdf.setDrawColor(200, 200, 220)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, "S")

  // Absences section (only for trimester)
  if (data.periodType === "trimester" && data.attendance) {
    pdf.setFillColor(255, 250, 235)
    pdf.roundedRect(margin + 1, y + 1, contentWidth / 3 - 2, 20, 1, 1, "F")

    pdf.setTextColor(180, 130, 0)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    pdf.text(texts.absences, margin + 4, y + 5)

    pdf.setTextColor(0, 0, 0)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(6)
    pdf.text(`${texts.totalHours}: ${data.attendance.total_hours || 0}h`, margin + 4, y + 10)
    pdf.text(`${texts.justified}: ${data.attendance.justified_hours || 0}h`, margin + 4, y + 14)
    pdf.text(`${texts.unjustified}: ${data.attendance.unjustified_hours || 0}h`, margin + 4, y + 18)
  }

  // Observation
  const obsX = data.periodType === "trimester" && data.attendance ? margin + contentWidth / 3 + 2 : margin + 2
  const obsWidth = data.periodType === "trimester" && data.attendance ? (2 * contentWidth) / 3 - 4 : contentWidth - 4

  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text(texts.observation, obsX + 2, y + 5)

  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(6)
  const observation = generateObservation(data, isAnglophone)
  const obsLines = pdf.splitTextToSize(observation, obsWidth - 4)
  pdf.text(obsLines.slice(0, 3), obsX + 2, y + 10)

  y += 25

  // === SIGNATURES ===
  pdf.setFontSize(7)
  pdf.setTextColor(0, 0, 0)
  pdf.setFont("helvetica", "bold")

  pdf.text(texts.classTeacher, margin + 22, y + 2, { align: "center" })
  pdf.text(texts.parent, pageWidth / 2, y + 2, { align: "center" })
  pdf.text(texts.principal, pageWidth - margin - 22, y + 2, { align: "center" })

  pdf.setLineWidth(0.2)
  pdf.line(margin + 5, y + 10, margin + 40, y + 10)
  pdf.line(pageWidth / 2 - 18, y + 10, pageWidth / 2 + 18, y + 10)
  pdf.line(pageWidth - margin - 40, y + 10, pageWidth - margin - 5, y + 10)

  // === FOOTER ===
  const footerY = 285
  pdf.setFillColor(30, 64, 175)
  pdf.rect(0, footerY - 3, pageWidth, 15, "F")

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("courier", "normal")

  const now = new Date()
  const dateStr = now.toLocaleDateString("fr-FR")
  const timeStr = now.toLocaleTimeString("fr-FR")

  pdf.text(
    `${texts.generatedBy} ${dateStr} à ${timeStr} par HARMONY - Développé par OceanTechnologie`,
    pageWidth / 2,
    footerY,
    { align: "center" },
  )
  pdf.text(
    "oceantechnologie6@gmail.com | oceantechnologie6.netlify.app | +237 679-122-367 | +237 653-517-605",
    pageWidth / 2,
    footerY + 4,
    { align: "center" },
  )
  pdf.setFont("courier", "italic")
  pdf.text("Where ideas turn into reality", pageWidth / 2, footerY + 8, { align: "center" })
}

export type { BulletinData, BulletinSubject }
