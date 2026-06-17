import jsPDF from "jspdf"

interface BulletinSubject {
  name: string
  teacher?: string
  coefficient: number
  score1?: number
  score2?: number
  trimesters?: (number | "NC")[]
  annual?: number | "NC"
  average?: number
  group: string
  rank?: number | string
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
  periodType: "sequence" | "trimester" | "year"
  periodNumber?: number // 1, 2, or 3 for trimesters
  academicYear: string
  section: string
  subjects: BulletinSubject[]
  average: number
  rank: number | string
  classSize: number
  classAverage: number
  promotion?: {
    promoted: boolean
    nextClass: string | null
    decision: string
  }
  seq1Average?: number
  seq2Average?: number
  seq1Rank?: number
  seq2Rank?: number
  // Historical data for progress graph
  history?: {
    periodName: string
    average: number
    classAverage?: number
  }[]
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
const safeNum = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null) return "-"
  if (typeof val === 'string') return val
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
const getAppreciation = (score: number | string | undefined | null, isEnglish: boolean): string => {
  if (score === undefined || score === null || score === "NC") return "-"
  const s = typeof score === 'string' ? parseFloat(score) : score
  if (isEnglish) {
    if (s >= 18) return "Excellent"
    if (s >= 16) return "Very Good"
    if (s >= 14) return "Good"
    if (s >= 12) return "Fairly Good"
    if (s >= 10) return "Average"
    if (s >= 8) return "Insufficient"
    return "Very Weak"
  } else {
    if (s >= 18) return "Excellent"
    if (s >= 16) return "Très Bien"
    if (s >= 14) return "Bien"
    if (s >= 12) return "Assez Bien"
    if (s >= 10) return "Passable"
    if (s >= 8) return "Insuffisant"
    return "Très Faible"
  }
}

// Get decision based on average
const getDecision = (average: number, isEnglish: boolean): string => {
  if (average >= 16) return isEnglish ? "Honor Roll" : "Tableau d'Honneur"
  if (average >= 14) return isEnglish ? "Congratulations" : "Félicitations"
  if (average >= 12) return isEnglish ? "Encouragements" : "Encouragements"
  if (average >= 10) return isEnglish ? "Keep working" : "Continuez vos efforts"
  if (average >= 8) return isEnglish ? "Must work harder" : "Travail insuffisant"
  return isEnglish ? "Warning" : "Avertissement"
}

// Generate observation
const generateObservation = (data: BulletinData, isEnglish: boolean): string => {
  const avg = data.average
  const isAnnual = data.periodType === "year" || data.periodName.toLowerCase().includes("annuelle")
  
  if (isAnnual && data.promotion) return data.promotion.decision

  const weakSubjects = data.subjects.filter((s) => s.average !== undefined && s.average < 10).map((s) => s.name)
  const strongSubjects = data.subjects.filter((s) => s.average !== undefined && s.average >= 16).map((s) => s.name)
  
  let obs = ""
  if (isEnglish) {
    if (avg >= 16) obs = "Excellent results. Keep up the outstanding work."
    else if (avg >= 14) obs = "Very good performance. Continue your efforts."
    else if (avg >= 12) obs = "Good results. Keep working hard."
    else if (avg >= 10) obs = "Average results. More effort needed."
    else obs = "Insufficient results. Urgent improvement required."
  } else {
    if (avg >= 16) obs = "Excellents résultats. Continuez ainsi."
    else if (avg >= 14) obs = "Très bon travail. Poursuivez vos efforts."
    else if (avg >= 12) obs = "Bons résultats. Continuez à travailler."
    else if (avg >= 10) obs = "Résultats moyens. Plus d'efforts nécessaires."
    else obs = "Résultats insuffisants. Amélioration urgente requise."
  }
  return obs
}

// Draw bulletin page
const drawBulletinPage = (pdf: jsPDF, data: BulletinData, logoBase64: string | null) => {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - 2 * margin

  const isEnglish = data.section?.toLowerCase().includes("anglo")
  const isTrimester = data.periodType === "trimester"
  const isAnnual = data.periodType === "year" || data.periodName.toLowerCase().includes("annuelle")

  let y = margin

  // Official Header
  const headerHeight = 35
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.4)
  pdf.rect(margin, y, contentWidth, headerHeight, "S")

  // Left - French
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  pdf.text("RÉPUBLIQUE DU CAMEROUN", margin + 4, y + 6)
  pdf.setFontSize(7)
  pdf.text("Paix - Travail - Patrie", margin + 10, y + 10)
  pdf.text("**********", margin + 15, y + 14)
  pdf.text("MINISTÈRE DES ENSEIGNEMENTS", margin + 4, y + 18)
  pdf.text("SECONDAIRES", margin + 12, y + 22)

  // Center - Logo
  if (logoBase64) {
    pdf.addImage(logoBase64, "PNG", pageWidth / 2 - 12, y + 5, 24, 24)
  } else {
    pdf.setFontSize(14)
    pdf.text("H", pageWidth / 2, y + 18, { align: "center" })
  }

  // Right - English
  pdf.setFontSize(8)
  pdf.text("REPUBLIC OF CAMEROON", pageWidth - margin - 4, y + 6, { align: "right" })
  pdf.setFontSize(7)
  pdf.text("Peace - Work - Fatherland", pageWidth - margin - 10, y + 10, { align: "right" })
  pdf.text("**********", pageWidth - margin - 15, y + 14, { align: "right" })
  pdf.text("MINISTRY OF SECONDARY", pageWidth - margin - 4, y + 18, { align: "right" })
  pdf.text("EDUCATION", pageWidth - margin - 10, y + 22, { align: "right" })

  y += headerHeight + 5

  // Title
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin + 20, y, contentWidth - 40, 8, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  const title = isEnglish
    ? `${isAnnual ? "ANNUAL REPORT CARD" : isTrimester ? "TRIMESTER REPORT CARD" : "SEQUENCE REPORT CARD"}`
    : `${isAnnual ? "BULLETIN DE NOTES ANNUEL" : isTrimester ? "BULLETIN DE NOTES TRIMESTRIEL" : "BULLETIN DE NOTES SÉQUENTIEL"}`
  pdf.text(title, pageWidth / 2, y + 5.5, { align: "center" })
  y += 12

  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(8)
  pdf.text(`${isEnglish ? "Academic Year" : "Année Scolaire"}: ${data.academicYear}`, pageWidth / 2, y, { align: "center" })
  y += 6

  // Student Info
  pdf.setFillColor(245, 247, 250)
  pdf.rect(margin, y, contentWidth, 15, "F")
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.rect(margin, y, contentWidth, 15, "S")

  pdf.setFont("helvetica", "bold")
  pdf.text(`${isEnglish ? "Name" : "Nom"}: ${data.student.lastName} ${data.student.firstName}`, margin + 5, y + 6)
  pdf.text(`${isEnglish ? "Matricule" : "Matricule"}: ${data.student.matricule}`, margin + 5, y + 11)
  pdf.text(`${isEnglish ? "Class" : "Classe"}: ${data.className}`, pageWidth / 2 + 10, y + 6)
  pdf.text(`${isEnglish ? "Enrollment" : "Effectif"}: ${data.classSize}`, pageWidth / 2 + 10, y + 11)

  y += 20

  // Grades Table
  const colWidths = isAnnual 
    ? [40, 26, 7, 10, 10, 10, 15, 12, 25, 25]
    : isTrimester 
      ? [44, 30, 9, 13, 13, 13, 18, 28, 26] 
      : [54, 36, 10, 18, 22, 30, 24]

  const trimNum = data.periodNumber || 1
  const seqLabel1 = `S${(trimNum - 1) * 2 + 1}`
  const seqLabel2 = `S${(trimNum - 1) * 2 + 2}`

  const headers = isAnnual
    ? [isEnglish ? "Subject" : "Matière", isEnglish ? "Teacher" : "Enseignant", "C", "T1", "T2", "T3", isEnglish ? "Annual" : "Annuel", isEnglish ? "Rank" : "Rang", "Apprec.", "Obs."]
    : isTrimester
      ? [isEnglish ? "Subject" : "Matière", isEnglish ? "Teacher" : "Enseignant", "C", seqLabel1, seqLabel2, isEnglish ? "Avg" : "Moy", isEnglish ? "Rank" : "Rang", "Apprec.", "Obs."]
      : [isEnglish ? "Subject" : "Matière", isEnglish ? "Teacher" : "Enseignant", "C", isEnglish ? "Grade" : "Note", isEnglish ? "Rank" : "Rang", "Apprec.", "Obs."]

  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, 6, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7)
  
  let currentX = margin
  headers.forEach((h, i) => {
    pdf.text(h, currentX + colWidths[i] / 2, y + 4.5, { align: "center" })
    currentX += colWidths[i]
  })
  y += 6

  pdf.setTextColor(0, 0, 0)
  data.subjects.forEach((subj) => {
    let rowX = margin
    pdf.setFont("helvetica", "normal")
    pdf.text(subj.name.substring(0, 20), rowX + 2, y + 4.5)
    rowX += colWidths[0]
    pdf.text((subj.teacher || "-").substring(0, 12), rowX + 2, y + 4.5)
    rowX += colWidths[1]
    pdf.text(String(subj.coefficient), rowX + colWidths[2] / 2, y + 4.5, { align: "center" })
    rowX += colWidths[2]

    if (isAnnual) {
      pdf.text(safeNum(subj.trimesters?.[0]), rowX + colWidths[3] / 2, y + 4.5, { align: "center" })
      rowX += colWidths[3]
      pdf.text(safeNum(subj.trimesters?.[1]), rowX + colWidths[4] / 2, y + 4.5, { align: "center" })
      rowX += colWidths[4]
      pdf.text(safeNum(subj.trimesters?.[2]), rowX + colWidths[5] / 2, y + 4.5, { align: "center" })
      rowX += colWidths[5]
      pdf.setFont("helvetica", "bold")
      pdf.text(safeNum(subj.annual), rowX + colWidths[6] / 2, y + 4.5, { align: "center" })
      rowX += colWidths[6]
      pdf.setFont("helvetica", "normal")
      pdf.text(String(subj.rank || "-"), rowX + colWidths[7] / 2, y + 4.5, { align: "center" })
      rowX += colWidths[7]
      pdf.text(getAppreciation(subj.annual, isEnglish), rowX + colWidths[8] / 2, y + 4.5, { align: "center" })
    } else {
      // Logic for single sequence or trimester...
    }
    y += 6
  })

  y += 5
  // Decision
  pdf.setFont("helvetica", "bold")
  const decision = isAnnual && data.promotion ? data.promotion.decision : getDecision(data.average, isEnglish)
  pdf.text(`${isEnglish ? "Decision" : "Décision"}: ${decision}`, margin + 5, y + 5)
  
  pdf.save(`Bulletin_${data.student.lastName}_${data.periodName}.pdf`)
}

export const generateBulletinPDF = async (data: BulletinData) => {
  const pdf = new jsPDF()
  const logo = data.schoolSettings.logo_url ? await loadLogo(data.schoolSettings.logo_url) : null
  drawBulletinPage(pdf, data, logo)
}

export const generateMassBulletinsPDF = async (dataList: BulletinData[], filename: string) => {
  const pdf = new jsPDF()
  const logo = dataList[0]?.schoolSettings.logo_url ? await loadLogo(dataList[0].schoolSettings.logo_url) : null
  dataList.forEach((data, i) => {
    if (i > 0) pdf.addPage()
    drawBulletinPage(pdf, data, logo)
  })
  pdf.save(`${filename}.pdf`)
}

const loadLogo = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}
