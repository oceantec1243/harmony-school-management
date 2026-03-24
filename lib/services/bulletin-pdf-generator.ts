import jsPDF from "jspdf"

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

export interface BulletinData {
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
  periodNumber?: number // 1, 2, or 3 for trimesters
  academicYear: string
  section: string
  subjects: BulletinSubject[]
  average: number
  rank: number | string
  classSize: number
  classAverage: number
  seq1Average?: number
  seq2Average?: number
  seq1Rank?: number
  seq2Rank?: number
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
    logo_url?: string
  }
}

// Format number safely
const safeNum = (val: number | undefined | null): string => {
  if (val === undefined || val === null) return "-"
  return val.toFixed(2)
}

// Get color based on score
const getGradeColor = (score: number | undefined | null): [number, number, number] => {
  if (score === undefined || score === null) return [100, 100, 100]
  if (score < 10) return [220, 38, 38] // Red
  if (score < 12) return [234, 179, 8] // Yellow
  if (score < 15) return [37, 99, 235] // Blue
  return [22, 163, 74] // Green
}

// Get appreciation
const getAppreciation = (score: number | undefined | null, isEnglish: boolean): string => {
  if (score === undefined || score === null) return "-"
  if (isEnglish) {
    if (score >= 18) return "Excellent"
    if (score >= 16) return "Very Good"
    if (score >= 14) return "Good"
    if (score >= 12) return "Fairly Good"
    if (score >= 10) return "Average"
    if (score >= 8) return "Insufficient"
    return "Very Weak"
  } else {
    if (score >= 18) return "Excellent"
    if (score >= 16) return "Très Bien"
    if (score >= 14) return "Bien"
    if (score >= 12) return "Assez Bien"
    if (score >= 10) return "Passable"
    if (score >= 8) return "Insuffisant"
    return "Très Faible"
  }
}

// Get decision based on average - NOT "redouble" for T1/T2
const getDecision = (average: number, isEnglish: boolean): string => {
  if (average >= 16) return isEnglish ? "Honor Roll" : "Tableau d'Honneur"
  if (average >= 14) return isEnglish ? "Congratulations" : "Félicitations"
  if (average >= 12) return isEnglish ? "Encouragements" : "Encouragements"
  if (average >= 10) return isEnglish ? "Keep working" : "Continuez vos efforts"
  if (average >= 8) return isEnglish ? "Must work harder" : "Travail insuffisant"
  return isEnglish ? "Warning" : "Avertissement"
}

// Generate observation based on grades and attendance
const generateObservation = (data: BulletinData, isEnglish: boolean): string => {
  const avg = data.average
  const weakSubjects = data.subjects.filter((s) => s.average !== undefined && s.average < 10).map((s) => s.name)
  const hasAbsences = data.attendance && data.attendance.total_hours > 0
  const unjustified = data.attendance ? data.attendance.total_hours - data.attendance.justified_hours : 0

  let obs = ""

  if (isEnglish) {
    if (avg >= 16) obs = "Excellent results! Keep up the outstanding work."
    else if (avg >= 14) obs = "Very good performance. Continue your efforts."
    else if (avg >= 12) obs = "Good results. Keep working hard to improve."
    else if (avg >= 10) obs = "Average results. More effort is needed."
    else obs = "Insufficient results. Significant improvement required."

    if (weakSubjects.length > 0 && weakSubjects.length <= 3) {
      obs += ` Improve in: ${weakSubjects.join(", ")}.`
    } else if (weakSubjects.length > 3) {
      obs += ` Must improve in several subjects.`
    }

    if (unjustified > 0) {
      obs += ` Warning: ${unjustified}h unjustified absences.`
    } else if (hasAbsences) {
      obs += ` ${data.attendance?.total_hours}h absences (justified).`
    }
  } else {
    if (avg >= 16) obs = "Excellents résultats ! Continuez ainsi."
    else if (avg >= 14) obs = "Très bon travail. Poursuivez vos efforts."
    else if (avg >= 12) obs = "Bons résultats. Continuez à travailler."
    else if (avg >= 10) obs = "Résultats moyens. Plus d'efforts nécessaires."
    else obs = "Résultats insuffisants. Redoublez d'efforts."

    if (weakSubjects.length > 0 && weakSubjects.length <= 3) {
      obs += ` À améliorer: ${weakSubjects.join(", ")}.`
    } else if (weakSubjects.length > 3) {
      obs += ` Plusieurs matières à améliorer.`
    }

    if (unjustified > 0) {
      obs += ` Attention: ${unjustified}h d'absences non justifiées.`
    } else if (hasAbsences) {
      obs += ` Absences: ${data.attendance?.total_hours}h (justifiées).`
    }
  }

  return obs
}

// Load logo
const loadLogo = async (url: string): Promise<string | null> => {
  if (!url) return null
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
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

// Draw bulletin page
const drawBulletinPage = (pdf: jsPDF, data: BulletinData, logoBase64: string | null) => {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - 2 * margin

  const isEnglish = data.section?.toLowerCase().includes("anglo")
  const isTrimester = data.periodType === "trimester"

  let y = margin

  // === WATERMARK LOGO (center, 100mm ~ 410px) ===
  if (logoBase64) {
    try {
      const watermarkSize = 100
      const centerX = (pageWidth - watermarkSize) / 2
      const centerY = (pageHeight - watermarkSize) / 2
      pdf.saveGraphicsState()
      // @ts-ignore
      pdf.setGState(new pdf.GState({ opacity: 0.06 }))
      pdf.addImage(logoBase64, "PNG", centerX, centerY, watermarkSize, watermarkSize)
      pdf.restoreGraphicsState()
    } catch (e) {
      // Ignore watermark errors
    }
  }

  // === OFFICIAL BILINGUAL HEADER ===
  const headerHeight = 38
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, y, contentWidth, headerHeight, "S")

  // Left side - French
  const leftX = margin + 4
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(0, 0, 0)
  pdf.text("RÉPUBLIQUE DU CAMEROUN", leftX, y + 6)
  pdf.setFont("helvetica", "italic")
  pdf.setFontSize(8)
  pdf.text("Paix - Travail - Patrie", leftX, y + 11)
  pdf.setFontSize(7)
  pdf.text("**********", leftX, y + 15)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.text("MINISTÈRE DES ENSEIGNEMENTS", leftX, y + 20)
  pdf.text("SECONDAIRES", leftX, y + 25)
  pdf.setFontSize(7)
  pdf.text("**********", leftX, y + 29)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  const schoolName = data.schoolSettings.school_name || "COLLEGE POLYVALENT LES SAVANTS"
  pdf.text(schoolName, leftX, y + 34, { maxWidth: 55 })

  // Center - Logo
  const logoSize = 28
  const logoX = pageWidth / 2 - logoSize / 2
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, "PNG", logoX, y + 5, logoSize, logoSize)
    } catch (e) {
      pdf.setFillColor(30, 64, 175)
      pdf.circle(pageWidth / 2, y + 19, logoSize / 2, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(12)
      const initials = schoolName.split(" ").map((w) => w[0]).join("").substring(0, 4)
      pdf.text(initials, pageWidth / 2, y + 21, { align: "center" })
    }
  } else {
    pdf.setFillColor(30, 64, 175)
    pdf.circle(pageWidth / 2, y + 19, logoSize / 2, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    const initials = schoolName.split(" ").map((w) => w[0]).join("").substring(0, 4)
    pdf.text(initials, pageWidth / 2, y + 21, { align: "center" })
  }

  // Right side - English
  const rightX = pageWidth - margin - 4
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIC OF CAMEROON", rightX, y + 6, { align: "right" })
  pdf.setFont("helvetica", "italic")
  pdf.setFontSize(8)
  pdf.text("Peace - Work - Fatherland", rightX, y + 11, { align: "right" })
  pdf.setFontSize(7)
  pdf.text("**********", rightX, y + 15, { align: "right" })
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.text("MINISTRY OF SECONDARY", rightX, y + 20, { align: "right" })
  pdf.text("EDUCATION", rightX, y + 25, { align: "right" })
  pdf.setFontSize(7)
  pdf.text("**********", rightX, y + 29, { align: "right" })
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.text(schoolName, rightX, y + 34, { align: "right", maxWidth: 55 })

  y += headerHeight + 2

  // Contact info
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "normal")
  const contactInfo = `B.P.: ${data.schoolSettings.address || "..."} | Tél.: ${data.schoolSettings.phone || "+237674670774"}`
  pdf.text(contactInfo, pageWidth / 2, y, { align: "center" })
  y += 5

  // === BULLETIN TITLE ===
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin + 20, y, contentWidth - 40, 9, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  const title = isEnglish
    ? `REPORT CARD - ${isTrimester ? "TRIMESTER" : "SEQUENCE"}: ${data.periodName}`
    : `BULLETIN DE NOTES - ${isTrimester ? "TRIMESTRE" : "SÉQUENCE"}: ${data.periodName}`
  pdf.text(title, pageWidth / 2, y + 6.5, { align: "center" })
  y += 11

  // Academic year
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(9)
  pdf.text(`${isEnglish ? "Academic Year" : "Année Scolaire"}: ${data.academicYear}`, pageWidth / 2, y, {
    align: "center",
  })
  y += 6

  // === STUDENT INFO BOX ===
  pdf.setFillColor(245, 247, 250)
  pdf.rect(margin, y, contentWidth, 18, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.3)
  pdf.rect(margin, y, contentWidth, 18, "S")

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(8)
  const col1 = margin + 4
  const col2 = pageWidth / 2 + 8

  pdf.setFont("helvetica", "bold")
  pdf.text(isEnglish ? "Name:" : "Nom:", col1, y + 5)
  pdf.setFont("helvetica", "normal")
  pdf.text(`${data.student.lastName.toUpperCase()} ${data.student.firstName}`, col1 + 18, y + 5)

  pdf.setFont("helvetica", "bold")
  pdf.text(isEnglish ? "Reg. No:" : "Matricule:", col1, y + 10)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.student.matricule || "-", col1 + 22, y + 10)

  pdf.setFont("helvetica", "bold")
  pdf.text(isEnglish ? "Born:" : "Né(e) le:", col1, y + 15)
  pdf.setFont("helvetica", "normal")
  const birthInfo = `${data.student.dateOfBirth || "-"} ${isEnglish ? "at" : "à"} ${data.student.placeOfBirth || "-"}`
  pdf.text(birthInfo, col1 + 22, y + 15)

  pdf.setFont("helvetica", "bold")
  pdf.text(isEnglish ? "Class:" : "Classe:", col2, y + 5)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.className, col2 + 18, y + 5)

  pdf.setFont("helvetica", "bold")
  pdf.text(isEnglish ? "Enrollment:" : "Effectif:", col2, y + 10)
  pdf.setFont("helvetica", "normal")
  pdf.text(String(data.classSize), col2 + 20, y + 10)

  pdf.setFont("helvetica", "bold")
  pdf.text("Section:", col2, y + 15)
  pdf.setFont("helvetica", "normal")
  pdf.text(data.section || "-", col2 + 18, y + 15)

  y += 21

  // === GRADES TABLE ===
  // Optimized columns to fill the page nicely - increased for better readability
  const colWidths = isTrimester 
    ? [44, 30, 9, 13, 13, 13, 18, 28, 26] 
    : [54, 36, 10, 18, 22, 30, 24]

  // Calculate actual sequence numbers for trimester labels
  const trimNum = data.periodNumber || 1
  const seqLabel1 = `S${(trimNum - 1) * 2 + 1}`
  const seqLabel2 = `S${(trimNum - 1) * 2 + 2}`

  const headers = isTrimester
    ? [
        isEnglish ? "Subject" : "Matière",
        isEnglish ? "Teacher" : "Enseignant",
        "C",
        seqLabel1,
        seqLabel2,
        isEnglish ? "Avg" : "Moy",
        isEnglish ? "Rank" : "Rang",
        isEnglish ? "Apprec." : "Appréciation",
        isEnglish ? "Obs." : "Observation",
      ]
    : [
        isEnglish ? "Subject" : "Matière",
        isEnglish ? "Teacher" : "Enseignant",
        "C",
        isEnglish ? "Grade" : "Note",
        isEnglish ? "Rank" : "Rang",
        isEnglish ? "Apprec." : "Appréciation",
        isEnglish ? "Obs." : "Observation",
      ]

  // Table header - taller for bigger text
  pdf.setFillColor(30, 64, 175)
  const totalWidth = colWidths.reduce((a, b) => a + b, 0)
  const startX = margin + (contentWidth - totalWidth) / 2
  const tableHeaderHeight = 7
  pdf.rect(startX, y, totalWidth, tableHeaderHeight, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7.5)
  pdf.setFont("helvetica", "bold")

  let colX = startX
  for (let i = 0; i < headers.length; i++) {
    pdf.text(headers[i], colX + colWidths[i] / 2, y + 5, { align: "center" })
    colX += colWidths[i]
  }
  y += tableHeaderHeight

  // Group subjects
  const groups: Record<string, BulletinSubject[]> = {}
  for (const subj of data.subjects) {
    const g = subj.group || "Autres"
    if (!groups[g]) groups[g] = []
    groups[g].push(subj)
  }

  const rowHeight = 6
  let rowIdx = 0

  for (const [groupName, subjects] of Object.entries(groups)) {
    // Group header
    pdf.setFillColor(235, 240, 255)
    pdf.rect(startX, y, totalWidth, 5.5, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    pdf.text(groupName.toUpperCase(), startX + 2, y + 4)
    y += 5.5

    // Subjects
    for (const subj of subjects) {
      if (rowIdx % 2 === 1) {
        pdf.setFillColor(248, 250, 255)
        pdf.rect(startX, y, totalWidth, rowHeight, "F")
      }

      pdf.setDrawColor(230, 230, 240)
      pdf.setLineWidth(0.15)
      pdf.line(startX, y + rowHeight, startX + totalWidth, y + rowHeight)

      colX = startX
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(0, 0, 0)

      const textY = y + 4.2

      if (isTrimester) {
        // Subject name
        pdf.text((subj.name || "").substring(0, 22), colX + 1, textY)
        colX += colWidths[0]

        // Teacher
        pdf.setFontSize(6)
        pdf.text((subj.teacher || "-").substring(0, 16), colX + 1, textY)
        pdf.setFontSize(7)
        colX += colWidths[1]

        // Coefficient
        pdf.text(String(subj.coefficient || 1), colX + colWidths[2] / 2, textY, { align: "center" })
        colX += colWidths[2]

        // Score 1
        const c1 = getGradeColor(subj.score1)
        pdf.setTextColor(c1[0], c1[1], c1[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(subj.score1), colX + colWidths[3] / 2, textY, { align: "center" })
        colX += colWidths[3]

        // Score 2
        const c2 = getGradeColor(subj.score2)
        pdf.setTextColor(c2[0], c2[1], c2[2])
        pdf.text(safeNum(subj.score2), colX + colWidths[4] / 2, textY, { align: "center" })
        colX += colWidths[4]

        // Average
        const cAvg = getGradeColor(subj.average)
        pdf.setTextColor(cAvg[0], cAvg[1], cAvg[2])
        pdf.text(safeNum(subj.average), colX + colWidths[5] / 2, textY, { align: "center" })
        colX += colWidths[5]

        // Rank
        pdf.setTextColor(0, 0, 0)
        pdf.setFont("helvetica", "normal")
        const rankTxt = subj.rank ? `${subj.rank}/${subj.classSize || "-"}` : "-"
        pdf.text(rankTxt, colX + colWidths[6] / 2, textY, { align: "center" })
        colX += colWidths[6]

        // Appreciation
        pdf.setTextColor(60, 60, 60)
        pdf.setFontSize(6)
        pdf.text(getAppreciation(subj.average, isEnglish), colX + colWidths[7] / 2, textY, { align: "center" })
        colX += colWidths[7]

        // Observation (empty)
        pdf.text("", colX + 1, textY)
      } else {
        // Subject name
        pdf.text((subj.name || "").substring(0, 28), colX + 1, textY)
        colX += colWidths[0]

        // Teacher
        pdf.setFontSize(6)
        pdf.text((subj.teacher || "-").substring(0, 19), colX + 1, textY)
        pdf.setFontSize(7)
        colX += colWidths[1]

        // Coefficient
        pdf.text(String(subj.coefficient || 1), colX + colWidths[2] / 2, textY, { align: "center" })
        colX += colWidths[2]

        // Grade/Average
        const cAvg = getGradeColor(subj.average)
        pdf.setTextColor(cAvg[0], cAvg[1], cAvg[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(subj.average), colX + colWidths[3] / 2, textY, { align: "center" })
        colX += colWidths[3]

        // Rank
        pdf.setTextColor(0, 0, 0)
        pdf.setFont("helvetica", "normal")
        const rankTxt = subj.rank ? `${subj.rank}/${subj.classSize || "-"}` : "-"
        pdf.text(rankTxt, colX + colWidths[4] / 2, textY, { align: "center" })
        colX += colWidths[4]

        // Appreciation
        pdf.setTextColor(60, 60, 60)
        pdf.setFontSize(6)
        pdf.text(getAppreciation(subj.average, isEnglish), colX + colWidths[5] / 2, textY, { align: "center" })
        colX += colWidths[5]

        // Observation (empty)
        pdf.text("", colX + 1, textY)
      }

      y += rowHeight
      rowIdx++
    }
  }

  y += 3

  // === ATTENDANCE (for trimester) ===
  if (isTrimester && data.attendance) {
    const unjustified = data.attendance.total_hours - data.attendance.justified_hours
    pdf.setFillColor(255, 250, 230)
    pdf.rect(margin, y, contentWidth / 2, 12, "F")
    pdf.setDrawColor(200, 180, 100)
    pdf.setLineWidth(0.5)
    pdf.rect(margin, y, contentWidth / 2, 12, "S")

    pdf.setTextColor(100, 80, 0)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text(isEnglish ? "ABSENCES" : "ABSENCES", margin + 3, y + 5)

    pdf.setFontSize(7)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${isEnglish ? "Total" : "Total"}: ${data.attendance.total_hours}h`, margin + 32, y + 5)
    pdf.text(`${isEnglish ? "Justified" : "Justifiées"}: ${data.attendance.justified_hours}h`, margin + 55, y + 5)
    pdf.setTextColor(180, 0, 0)
    pdf.setFont("helvetica", "bold")
    pdf.text(`${isEnglish ? "Unjustified" : "Non Just."}: ${unjustified}h`, margin + 32, y + 10)

    y += 14
  }

  // === SEQUENCE SUMMARY (for trimester) ===
  if (isTrimester) {
    pdf.setFillColor(240, 245, 255)
    pdf.rect(margin, y, contentWidth, 14, "F")
    pdf.setDrawColor(30, 64, 175)
    pdf.setLineWidth(0.4)
    pdf.rect(margin, y, contentWidth, 14, "S")

    const boxW = contentWidth / 5
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(7)

    // Seq 1 (use actual sequence numbers)
    const seqNum1 = (trimNum - 1) * 2 + 1
    const seqNum2 = (trimNum - 1) * 2 + 2
    
    pdf.setFont("helvetica", "bold")
    pdf.text(isEnglish ? `Seq ${seqNum1} Avg:` : `Moy Séq ${seqNum1}:`, margin + 2, y + 4)
    const c1 = getGradeColor(data.seq1Average)
    pdf.setTextColor(c1[0], c1[1], c1[2])
    pdf.setFontSize(8)
    pdf.text(safeNum(data.seq1Average), margin + 28, y + 4)
    pdf.setTextColor(80, 80, 80)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${isEnglish ? "Rank" : "Rang"}: ${data.seq1Rank || "-"}`, margin + 2, y + 10)

    // Seq 2
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    pdf.text(isEnglish ? `Seq ${seqNum2} Avg:` : `Moy Séq ${seqNum2}:`, margin + boxW + 2, y + 4)
    const c2 = getGradeColor(data.seq2Average)
    pdf.setTextColor(c2[0], c2[1], c2[2])
    pdf.setFontSize(8)
    pdf.text(safeNum(data.seq2Average), margin + boxW + 28, y + 4)
    pdf.setTextColor(80, 80, 80)
    pdf.setFontSize(6)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${isEnglish ? "Rank" : "Rang"}: ${data.seq2Rank || "-"}`, margin + boxW + 2, y + 10)

    // Evolution
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    pdf.text(isEnglish ? "Evolution:" : "Évolution:", margin + boxW * 2 + 2, y + 4)
    if (data.seq1Average && data.seq2Average && data.seq1Average > 0) {
      const evo = ((data.seq2Average - data.seq1Average) / data.seq1Average) * 100
      const positive = evo >= 0
      pdf.setTextColor(positive ? 22 : 220, positive ? 163 : 38, positive ? 74 : 38)
      pdf.setFontSize(9)
      pdf.text(`${positive ? "+" : ""}${evo.toFixed(1)}%`, margin + boxW * 2 + 22, y + 4)
    } else {
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(9)
      pdf.text("-", margin + boxW * 2 + 22, y + 4)
    }

    // Trimester avg
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    pdf.text(isEnglish ? "Trim. Avg:" : "Moy Trim:", margin + boxW * 3 + 2, y + 4)
    const cAvg = getGradeColor(data.average)
    pdf.setTextColor(cAvg[0], cAvg[1], cAvg[2])
    pdf.setFontSize(10)
    pdf.text(`${safeNum(data.average)}/20`, margin + boxW * 3 + 24, y + 4)

    // Rank
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    pdf.text(isEnglish ? "Rank:" : "Rang:", margin + boxW * 4 + 2, y + 4)
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    const rankStr = data.rank === "NC" ? "NC" : `${data.rank}/${data.classSize}`
    pdf.text(rankStr, margin + boxW * 4 + 14, y + 4)

    y += 12
  }

  // === SUMMARY BOX ===
  pdf.setFillColor(245, 248, 255)
  pdf.rect(margin, y, contentWidth, 11, "F")
  pdf.setDrawColor(30, 64, 175)
  pdf.setLineWidth(0.4)
  pdf.rect(margin, y, contentWidth, 11, "S")

  const sumBoxW = contentWidth / 4

  // General Average
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5.5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isEnglish ? "General Average" : "Moyenne Générale", margin + sumBoxW / 2, y + 3, { align: "center" })
  const avgC = getGradeColor(data.average)
  pdf.setTextColor(avgC[0], avgC[1], avgC[2])
  pdf.setFontSize(9)
  pdf.text(`${safeNum(data.average)}/20`, margin + sumBoxW / 2, y + 8, { align: "center" })

  // Rank
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5.5)
  pdf.text(isEnglish ? "Rank" : "Rang", margin + sumBoxW * 1.5, y + 3, { align: "center" })
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(9)
  const finalRank = data.rank === "NC" ? "NC" : `${data.rank}/${data.classSize}`
  pdf.text(finalRank, margin + sumBoxW * 1.5, y + 8, { align: "center" })

  // Class Average
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5.5)
  pdf.text(isEnglish ? "Class Average" : "Moy. Classe", margin + sumBoxW * 2.5, y + 3, { align: "center" })
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(9)
  pdf.text(`${safeNum(data.classAverage)}/20`, margin + sumBoxW * 2.5, y + 8, { align: "center" })

  // Decision
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5.5)
  pdf.text(isEnglish ? "Decision" : "Décision", margin + sumBoxW * 3.5, y + 3, { align: "center" })
  const decision = getDecision(data.average, isEnglish)
  const decColor = data.average >= 10 ? [22, 163, 74] : [220, 38, 38]
  pdf.setTextColor(decColor[0], decColor[1], decColor[2])
  pdf.setFontSize(6.5)
  pdf.setFont("helvetica", "bold")
  pdf.text(decision, margin + sumBoxW * 3.5, y + 8, { align: "center" })

  y += 13

  // === OBSERVATION ===
  pdf.setFillColor(252, 252, 252)
  pdf.rect(margin, y, contentWidth, 11, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.3)
  pdf.rect(margin, y, contentWidth, 11, "S")

  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5.5)
  pdf.setFont("helvetica", "bold")
  pdf.text(isEnglish ? "OBSERVATION:" : "OBSERVATION:", margin + 2, y + 4)
  pdf.setTextColor(40, 40, 40)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(5)
  const obs = generateObservation(data, isEnglish)
  pdf.text(obs.substring(0, 160), margin + 28, y + 4)
  if (obs.length > 160) {
    pdf.text(obs.substring(160, 320), margin + 2, y + 8)
  }

  y += 13

  // === SIGNATURES ===
  const sigWidth = contentWidth / 3
  const sigLabels = isEnglish
    ? ["Parent/Guardian", "The Principal", "Class Teacher"]
    : ["Parent/Tuteur", "Le Principal", "Prof. Principal"]

  pdf.setTextColor(60, 60, 60)
  pdf.setFontSize(5.5)
  pdf.setFont("helvetica", "bold")

  for (let i = 0; i < 3; i++) {
    const sigX = margin + i * sigWidth
    pdf.text(sigLabels[i], sigX + sigWidth / 2, y + 2, { align: "center" })
    pdf.setDrawColor(180, 180, 180)
    pdf.setLineWidth(0.15)
    pdf.line(sigX + 8, y + 10, sigX + sigWidth - 8, y + 10)
  }

  // === FOOTER - OceanTechnologie ===
  const footerY = pageHeight - 10
  pdf.setFillColor(30, 64, 175)
  pdf.rect(0, footerY, pageWidth, 10, "F")

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(4.5)
  pdf.setFont("courier", "normal")

  const now = new Date()
  const dateStr = now.toLocaleDateString("fr-FR")
  const timeStr = now.toLocaleTimeString("fr-FR")

  pdf.text(`Bulletin généré le ${dateStr} à ${timeStr} par HARMONY`, margin, footerY + 3)
  pdf.text("Développé par OceanTechnologie", margin, footerY + 5.5)
  pdf.text("oceantechnologie6@gmail.com | oceantechnologie6.netlify.app", margin, footerY + 8)

  pdf.text("Tel: +237 679-122-367 / +237 653-517-605", pageWidth - margin, footerY + 3, { align: "right" })
  pdf.setFont("courier", "italic")
  pdf.text('"Where ideas turn into reality"', pageWidth - margin, footerY + 6, { align: "right" })
}

// Generate single bulletin PDF
export const generateBulletinPDF = async (data: BulletinData): Promise<void> => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  // Load logo
  let logoBase64: string | null = null
  if (data.schoolSettings.logo_url) {
    logoBase64 = await loadLogo(data.schoolSettings.logo_url)
  }

  drawBulletinPage(pdf, data, logoBase64)
  pdf.save(`Bulletin_${data.student.lastName}_${data.student.firstName}_${data.periodName}.pdf`)
}

// Generate mass bulletins PDF
export const generateMassBulletinsPDF = async (dataList: BulletinData[], filename: string): Promise<void> => {
  if (dataList.length === 0) return

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  // Load logo once
  let logoBase64: string | null = null
  if (dataList[0].schoolSettings.logo_url) {
    logoBase64 = await loadLogo(dataList[0].schoolSettings.logo_url)
  }

  for (let i = 0; i < dataList.length; i++) {
    if (i > 0) pdf.addPage()
    drawBulletinPage(pdf, dataList[i], logoBase64)
  }

  pdf.save(`${filename}.pdf`)
}
