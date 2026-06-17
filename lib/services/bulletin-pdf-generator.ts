import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface BulletinSubject {
  name: string
  teacher?: string
  coefficient: number
  trimesters?: (number | "NC")[]
  annual?: number | "NC"
  average?: number
  group: string
  rank?: number | string
}

export interface BulletinData {
  student: {
    firstName: string
    lastName: string
    matricule: string
    isRanked?: boolean
    dateOfBirth?: string
    placeOfBirth?: string
  }
  className: string
  periodName: string
  periodType: "sequence" | "trimester" | "year"
  academicYear: string
  section: string
  subjects: BulletinSubject[]
  average: number
  rank: number | string
  classSize: number
  classAverage: number
  classMin?: number
  classMax?: number
  promotion?: { promoted: boolean; nextClass: string | null; decision: string }
  trimesterSummaries?: Array<{ average: number | "NC"; rank: number | string }>
  schoolSettings: {
    school_name: string
    school_slogan?: string
    address?: string
    phone?: string
    logo_url?: string
  }
}

const safeNum = (val: any): string => {
  if (val === undefined || val === null || val === "NC") return "-"
  return typeof val === 'number' ? val.toFixed(2) : String(val)
}

const getAppreciation = (score: any, isEnglish: boolean): string => {
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

const drawBulletinPage = async (pdf: jsPDF, data: BulletinData, logoBase64: string | null) => {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const isEnglish = data.section?.toLowerCase().includes("anglo")
  const isAnnual = data.periodType === "year" || data.periodName.toLowerCase().includes("annuel") || data.periodName.toLowerCase().includes("full")

  const t = {
    rep: isEnglish ? "REPUBLIC OF CAMEROON" : "RÉPUBLIQUE DU CAMEROUN",
    motto: isEnglish ? "Peace - Work - Fatherland" : "Paix - Travail - Patrie",
    min: isEnglish ? "MINISTRY OF SECONDARY EDUCATION" : "MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES",
    title: isAnnual ? (isEnglish ? "ANNUAL REPORT CARD" : "BULLETIN DE NOTES ANNUEL") : (isEnglish ? "PROGRESS REPORT" : "BULLETIN DE NOTES SÉQUENTIEL"),
    year: isEnglish ? "Academic Year" : "Année Scolaire",
    name: isEnglish ? "Name" : "Nom",
    mat: isEnglish ? "Matricule" : "Matricule",
    class: isEnglish ? "Class" : "Classe",
    eff: isEnglish ? "Roll" : "Effectif",
    subj: isEnglish ? "Subject" : "Matière",
    teacher: isEnglish ? "Teacher" : "Enseignant",
    coef: isEnglish ? "Coef" : "Coef",
    rank: isEnglish ? "Rank" : "Rang",
    appr: isEnglish ? "Appreciation" : "Appréciation",
    genAvg: isEnglish ? "General Average" : "Moyenne Générale",
    dec: isEnglish ? "Council Decision" : "Décision du Conseil",
    parent: isEnglish ? "Parent" : "Le Parent",
    principal: isEnglish ? "Principal" : "Le Principal",
    pTeacher: isEnglish ? "Class Teacher" : "Le Prof. Principal",
    classAvg: isEnglish ? "Class Avg" : "Moy. Classe",
    min: isEnglish ? "Class Min" : "Moy. Min",
    max: isEnglish ? "Class Max" : "Moy. Max"
  }

  // --- WATERMARK ---
  if (logoBase64) {
    pdf.saveGraphicsState()
    pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }))
    pdf.addImage(logoBase64, "PNG", pageWidth / 2 - 50, pageHeight / 2 - 50, 100, 100)
    pdf.restoreGraphicsState()
  }

  // --- HEADER ---
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("RÉPUBLIQUE DU CAMEROUN", 15, 10)
  pdf.text("Paix - Travail - Patrie", 18, 13)
  pdf.text("**********", 22, 16)
  pdf.text("MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES", 11, 19)

  pdf.text("REPUBLIC OF CAMEROON", pageWidth - 15, 10, { align: "right" })
  pdf.text("Peace - Work - Fatherland", pageWidth - 15, 13, { align: "right" })
  pdf.text("**********", pageWidth - 42, 16, { align: "right" })
  pdf.text("MINISTRY OF SECONDARY EDUCATION", pageWidth - 15, 19, { align: "right" })

  if (logoBase64) {
    pdf.addImage(logoBase64, "PNG", pageWidth / 2 - 12, 8, 24, 24)
  }

  pdf.setFontSize(11)
  pdf.setTextColor(30, 64, 175)
  pdf.text(data.schoolSettings.school_name.toUpperCase(), pageWidth / 2, 36, { align: "center" })
  
  pdf.setFontSize(7)
  pdf.setTextColor(100)
  pdf.text(data.schoolSettings.school_slogan || "", pageWidth / 2, 40, { align: "center" })

  pdf.setDrawColor(0)
  pdf.setLineWidth(0.5)
  pdf.line(15, 42, pageWidth - 15, 42)

  // Title
  pdf.setFontSize(13)
  pdf.setTextColor(0)
  pdf.setFont("helvetica", "bold")
  pdf.text(t.title, pageWidth / 2, 50, { align: "center" })
  pdf.setFontSize(9)
  pdf.text(`${t.year}: ${data.academicYear}`, pageWidth / 2, 55, { align: "center" })

  // Student Info
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(`${t.name}: ${data.student.lastName} ${data.student.firstName}`, 15, 64)
  pdf.text(`${t.mat}: ${data.student.matricule}`, 15, 69)
  pdf.text(`${t.class}: ${data.className}`, pageWidth / 2 + 5, 64)
  pdf.text(`${t.eff}: ${data.classSize}`, pageWidth / 2 + 5, 69)

  // --- SUBJECTS TABLE ---
  const groups = [...new Set(data.subjects.map(s => s.group))].sort()
  const tableRows: any[] = []

  groups.forEach(groupName => {
    tableRows.push([{ content: groupName, colSpan: isAnnual ? 9 : 6, styles: { fillColor: [240, 240, 240], fontStyle: "bold", fontSize: 7.5 } }])
    
    const groupSubjs = data.subjects.filter(s => s.group === groupName)
    let gW = 0, gC = 0
    
    groupSubjs.forEach(s => {
      const row = [s.name, s.teacher || "-", s.coefficient]
      if (isAnnual) {
        row.push(safeNum(s.trimesters?.[0]))
        row.push(safeNum(s.trimesters?.[1]))
        row.push(safeNum(s.trimesters?.[2]))
        row.push(safeNum(s.annual))
      } else {
        row.push(safeNum(s.average))
      }
      row.push(s.rank || "-")
      row.push(getAppreciation(isAnnual ? s.annual : s.average, isEnglish))
      tableRows.push(row)

      const sc = isAnnual ? s.annual : s.average
      if (typeof sc === 'number') { gW += sc * s.coefficient; gC += s.coefficient }
    })

    if (gC > 0) {
      tableRows.push([
        { content: `${isEnglish ? "AVG" : "MOYENNE"} ${groupName}`, colSpan: 2, styles: { halign: "right", fontStyle: "italic", fontSize: 6.5 } },
        gC,
        { content: (gW / gC).toFixed(2), colSpan: isAnnual ? 4 : 1, styles: { halign: "center", fontStyle: "bold", textColor: [30, 64, 175] } },
        "", ""
      ])
    }
  })

  autoTable(pdf, {
    startY: 74,
    head: [
      isAnnual 
        ? [t.subj, t.teacher, "C", "T1", "T2", "T3", "An", t.rank, t.appr]
        : [t.subj, t.teacher, "C", isEnglish ? "Mark" : "Note", t.rank, t.appr]
    ],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 7, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 28 },
      2: { halign: "center", cellWidth: 7 },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
      7: { halign: "center", cellWidth: 12 },
      8: { halign: "center", cellWidth: 18 }
    }
  })

  // --- FOOTER SUMMARY ---
  let finalY = (pdf as any).lastAutoTable.finalY + 5
  if (finalY > pageHeight - 65) { pdf.addPage(); finalY = 20 }

  // Trimester Summary Table (Left)
  if (isAnnual && data.trimesterSummaries) {
    autoTable(pdf, {
      startY: finalY,
      head: [[isEnglish ? "PERIOD" : "PÉRIODE", isEnglish ? "AVERAGE" : "MOYENNE", t.rank]],
      body: [
        ...data.trimesterSummaries.map((ts, i) => [`${isEnglish ? "TERM" : "TRIMESTRE"} ${i+1}`, safeNum(ts.average), String(ts.rank)]),
        [{ content: isEnglish ? "ANNUAL" : "ANNUEL", styles: { fontStyle: "bold", fillColor: [240, 248, 255] } }, { content: data.average.toFixed(2), styles: { fontStyle: "bold", halign: "center" } }, { content: String(data.rank), styles: { fontStyle: "bold", halign: "center" } }]
      ],
      theme: "grid",
      margin: { left: 15 },
      tableWidth: 65,
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [51, 65, 85] }
    })
  }

  // Results Table (Right)
  autoTable(pdf, {
    startY: finalY,
    head: [[{ content: isEnglish ? "CLASS COUNCIL SUMMARY" : "RÉCAPITULATIF DU CONSEIL", colSpan: 2 }]],
    body: [
      [t.genAvg, `${data.average.toFixed(2)}/20`],
      [t.rank, `${data.rank} ${isEnglish ? "out of" : "sur"} ${data.classSize}`],
      [t.classAvg, data.classAverage.toFixed(2)],
      [t.max, data.classMax?.toFixed(2) || "---"],
      [t.min, data.classMin?.toFixed(2) || "---"],
      [{ content: `${t.dec}: ${isAnnual && data.promotion ? data.promotion.decision.toUpperCase() : "---"}`, colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }]
    ],
    theme: "grid",
    margin: { left: isAnnual ? 100 : 15 },
    tableWidth: 85,
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fillColor: [51, 65, 85] }
  })

  // Signatures
  const sigY = pageHeight - 18
  pdf.setFontSize(8)
  pdf.setTextColor(0)
  pdf.text(t.parent, 25, sigY)
  pdf.text(t.principal, pageWidth / 2, sigY, { align: "center" })
  pdf.text(t.pTeacher, pageWidth - 50, sigY)

  // Footer Notice
  pdf.setFontSize(6)
  pdf.setTextColor(150)
  pdf.text("généré par Harmony by OceanTechnologie", pageWidth / 2, pageHeight - 5, { align: "center" })
}

export const generateBulletinPDF = async (data: BulletinData) => {
  const pdf = new jsPDF()
  const logo = data.schoolSettings.logo_url ? await loadLogo(data.schoolSettings.logo_url) : null
  await drawBulletinPage(pdf, data, logo)
  pdf.save(`Bulletin_${data.student.lastName}.pdf`)
}

export const generateMassBulletinsPDF = async (dataList: BulletinData[], filename: string) => {
  const pdf = new jsPDF()
  const logo = dataList[0]?.schoolSettings.logo_url ? await loadLogo(dataList[0].schoolSettings.logo_url) : null
  for (let i = 0; i < dataList.length; i++) {
    if (i > 0) pdf.addPage()
    await drawBulletinPage(pdf, dataList[i], logo)
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
