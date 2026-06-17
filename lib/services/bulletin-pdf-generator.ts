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

const safeNum = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null) return "-"
  if (typeof val === 'string') return val
  return val.toFixed(2)
}

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

const getDecision = (average: number, isEnglish: boolean): string => {
  if (average >= 16) return isEnglish ? "Honor Roll" : "Tableau d'Honneur"
  if (average >= 14) return isEnglish ? "Congratulations" : "Félicitations"
  if (average >= 12) return isEnglish ? "Encouragements" : "Encouragements"
  if (average >= 10) return isEnglish ? "Keep working" : "Continuez vos efforts"
  if (average >= 8) return isEnglish ? "Must work harder" : "Travail insuffisant"
  return isEnglish ? "Warning" : "Avertissement"
}

const drawBulletinPage = (pdf: jsPDF, data: BulletinData, logoBase64: string | null) => {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - 2 * margin

  const isEnglish = data.section?.toLowerCase().includes("anglo")
  const isTrimester = data.periodType === "trimester"
  const isAnnual = data.periodType === "year" || data.periodName.toLowerCase().includes("annuelle")

  let y = margin

  // Official Header (Cameroon Style)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  pdf.text("RÉPUBLIQUE DU CAMEROUN", margin, y + 5)
  pdf.text("Paix - Travail - Patrie", margin + 5, y + 9)
  pdf.text("**********", margin + 15, y + 13)
  pdf.text("MINISTÈRE DES ENSEIGNEMENTS", margin, y + 17)
  pdf.text("SECONDAIRES", margin + 10, y + 21)

  pdf.text("REPUBLIC OF CAMEROON", pageWidth - margin, y + 5, { align: "right" })
  pdf.text("Peace - Work - Fatherland", pageWidth - margin - 5, y + 9, { align: "right" })
  pdf.text("**********", pageWidth - margin - 15, y + 13, { align: "right" })
  pdf.text("MINISTRY OF SECONDARY", pageWidth - margin, y + 17, { align: "right" })
  pdf.text("EDUCATION", pageWidth - margin - 10, y + 21, { align: "right" })

  if (logoBase64) {
    try { pdf.addImage(logoBase64, "PNG", pageWidth / 2 - 12, y + 2, 24, 24) } catch (e) {}
  }

  y += 28
  pdf.setFontSize(12)
  pdf.setTextColor(30, 64, 175)
  pdf.text(data.schoolSettings.school_name.toUpperCase(), pageWidth / 2, y, { align: "center" })
  
  y += 5
  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)
  const title = isAnnual ? "BULLETIN DE NOTES ANNUEL" : isTrimester ? "BULLETIN DE NOTES TRIMESTRIEL" : "BULLETIN DE NOTES SÉQUENTIEL"
  pdf.text(title, pageWidth / 2, y, { align: "center" })
  
  y += 5
  pdf.text(`Année Scolaire: ${data.academicYear}`, pageWidth / 2, y, { align: "center" })

  y += 10
  pdf.setFontSize(9)
  pdf.text(`Nom: ${data.student.lastName} ${data.student.firstName}`, margin, y)
  pdf.text(`Classe: ${data.className}`, pageWidth / 2 + 10, y)
  
  y += 5
  pdf.text(`Matricule: ${data.student.matricule}`, margin, y)
  pdf.text(`Effectif: ${data.classSize}`, pageWidth / 2 + 10, y)

  y += 10
  // Table
  const colWidths = isAnnual ? [40, 25, 6, 12, 12, 12, 15, 12, 28, 25] : [55, 35, 8, 18, 18, 28, 25]
  const headers = isAnnual 
    ? ["Matière", "Enseignant", "C", "T1", "T2", "T3", "Annuel", "Rang", "Appréciation", "Observation"]
    : ["Matière", "Enseignant", "C", "Note", "Rang", "Appréciation", "Observation"]

  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, 7, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7.5)
  
  let curX = margin
  headers.forEach((h, i) => {
    pdf.text(h, curX + 2, y + 5)
    curX += colWidths[i] || 0
  })

  y += 7
  pdf.setTextColor(0, 0, 0)
  pdf.setFont("helvetica", "normal")
  data.subjects.forEach(s => {
    if (y > pageHeight - 35) { pdf.addPage(); y = 20 }
    let rx = margin
    pdf.setFontSize(7)
    pdf.text(s.name.substring(0, 25), rx + 2, y + 4.5)
    rx += colWidths[0]
    pdf.setFontSize(6)
    pdf.text((s.teacher || "-").substring(0, 20), rx + 2, y + 4.5)
    rx += colWidths[1]
    pdf.setFontSize(7)
    pdf.text(String(s.coefficient), rx + 3, y + 4.5)
    rx += colWidths[2]

    if (isAnnual) {
      pdf.text(safeNum(s.trimesters?.[0]), rx + 2, y + 4.5)
      rx += colWidths[3]
      pdf.text(safeNum(s.trimesters?.[1]), rx + 2, y + 4.5)
      rx += colWidths[4]
      pdf.text(safeNum(s.trimesters?.[2]), rx + 2, y + 4.5)
      rx += colWidths[5]
      pdf.setFont("helvetica", "bold")
      pdf.text(safeNum(s.annual), rx + 2, y + 4.5)
      rx += colWidths[6]
      pdf.setFont("helvetica", "normal")
      pdf.text(String(s.rank || "-"), rx + 2, y + 4.5)
      rx += colWidths[7]
      pdf.text(getAppreciation(s.annual, false), rx + 2, y + 4.5)
      rx += colWidths[8]
      pdf.text("", rx + 2, y + 4.5)
    } else {
      pdf.text(safeNum(s.average), rx + 2, y + 4.5)
      rx += colWidths[3]
      pdf.text(String(s.rank || "-"), rx + 2, y + 4.5)
      rx += colWidths[4]
      pdf.text(getAppreciation(s.average, false), rx + 2, y + 4.5)
      rx += colWidths[5]
      pdf.text("", rx + 2, y + 4.5)
    }
    y += 5.5
  })

  y += 10
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  pdf.text(`Moyenne Générale: ${data.average.toFixed(2)}/20`, margin, y)
  pdf.text(`Rang: ${data.rank} / ${data.classSize}`, pageWidth / 2 + 10, y)
  
  y += 7
  const decision = isAnnual && data.promotion ? data.promotion.decision : getDecision(data.average, false)
  pdf.text(`Décision du Conseil: ${decision.toUpperCase()}`, margin, y)

  y += 15
  pdf.setFontSize(9)
  pdf.text("Le Parent", margin + 15, y)
  pdf.text("Le Principal", pageWidth / 2, y, { align: "center" })
  pdf.text("Le Prof. Principal", pageWidth - margin - 35, y)
}

export const generateBulletinPDF = async (data: BulletinData) => {
  const pdf = new jsPDF()
  const logo = await loadLogo(data.schoolSettings.logo_url || "")
  drawBulletinPage(pdf, data, logo)
  pdf.save(`Bulletin_${data.student.lastName}_${data.student.matricule}.pdf`)
}

export const generateMassBulletinsPDF = async (dataList: BulletinData[], filename: string) => {
  const pdf = new jsPDF()
  const logo = await loadLogo(dataList[0]?.schoolSettings.logo_url || "")
  for (let i = 0; i < dataList.length; i++) {
    if (i > 0) pdf.addPage()
    drawBulletinPage(pdf, dataList[i], logo)
  }
  pdf.save(`${filename}.pdf`)
}

const loadLogo = async (url: string): Promise<string | null> => {
  if (!url) return null
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
