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

const getAppreciation = (score: any): string => {
  if (score === undefined || score === null || score === "NC") return "-"
  const s = typeof score === 'string' ? parseFloat(score) : score
  if (s >= 18) return "Excellent"
  if (s >= 16) return "Très Bien"
  if (s >= 14) return "Bien"
  if (s >= 12) return "Assez Bien"
  if (s >= 10) return "Passable"
  if (s >= 8) return "Insuffisant"
  return "Très Faible"
}

const drawBulletinPage = (pdf: jsPDF, data: BulletinData) => {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const isAnnual = data.periodType === "year" || data.periodName.toLowerCase().includes("annuel")

  // --- OFFICIAL BILINGUAL HEADER ---
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text("RÉPUBLIQUE DU CAMEROUN", 15, 10)
  pdf.text("Paix - Travail - Patrie", 18, 13)
  pdf.text("**********", 22, 16)
  pdf.text("MINISTÈRE DES ENSEIGNEMENTS", 14, 19)
  pdf.text("SECONDAIRES", 22, 22)

  pdf.text("REPUBLIC OF CAMEROON", pageWidth - 55, 10)
  pdf.text("Peace - Work - Fatherland", pageWidth - 55, 13)
  pdf.text("**********", pageWidth - 42, 16)
  pdf.text("MINISTRY OF SECONDARY", pageWidth - 55, 19)
  pdf.text("EDUCATION", pageWidth - 48, 22)

  // School Info
  pdf.setFontSize(12)
  pdf.setTextColor(30, 64, 175)
  pdf.text(data.schoolSettings.school_name.toUpperCase(), pageWidth / 2, 32, { align: "center" })
  
  pdf.setFontSize(8)
  pdf.setTextColor(100)
  pdf.text(data.schoolSettings.school_slogan || "", pageWidth / 2, 36, { align: "center" })
  pdf.text(`B.P.: ${data.schoolSettings.address || ""} | Tél.: ${data.schoolSettings.phone || ""}`, pageWidth / 2, 40, { align: "center" })

  pdf.setDrawColor(0)
  pdf.setLineWidth(0.5)
  pdf.line(15, 42, pageWidth - 15, 42)

  // Title
  pdf.setFontSize(14)
  pdf.setTextColor(0)
  pdf.setFont("helvetica", "bold")
  pdf.text(isAnnual ? "BULLETIN DE NOTES ANNUEL" : "BULLETIN DE NOTES SÉQUENTIEL", pageWidth / 2, 50, { align: "center" })
  pdf.setFontSize(10)
  pdf.text(`Année Scolaire: ${data.academicYear}`, pageWidth / 2, 55, { align: "center" })

  // Student Info
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Nom: ${data.student.lastName} ${data.student.firstName}`, 15, 65)
  pdf.text(`Matricule: ${data.student.matricule}`, 15, 70)
  pdf.text(`Classe: ${data.className}`, pageWidth / 2 + 5, 65)
  pdf.text(`Effectif: ${data.classSize}`, pageWidth / 2 + 5, 70)

  // --- SUBJECTS TABLE ---
  const groups = [...new Set(data.subjects.map(s => s.group))].sort()
  const tableRows: any[] = []

  groups.forEach(groupName => {
    tableRows.push([{ content: groupName, colSpan: isAnnual ? 9 : 6, styles: { fillColor: [240, 240, 240], fontStyle: "bold" } }])
    
    const groupSubjs = data.subjects.filter(s => s.group === groupName)
    let gWeighted = 0, gCoef = 0
    
    groupSubjs.forEach(s => {
      const row = [
        s.name,
        s.teacher || "-",
        s.coefficient,
      ]
      if (isAnnual) {
        row.push(safeNum(s.trimesters?.[0]))
        row.push(safeNum(s.trimesters?.[1]))
        row.push(safeNum(s.trimesters?.[2]))
        row.push(safeNum(s.annual))
      } else {
        row.push(safeNum(s.average))
      }
      row.push(s.rank || "-")
      row.push(getAppreciation(isAnnual ? s.annual : s.average))
      tableRows.push(row)

      const score = isAnnual ? s.annual : s.average
      if (typeof score === 'number') {
        gWeighted += score * s.coefficient
        gCoef += s.coefficient
      }
    })

    if (gCoef > 0) {
      tableRows.push([
        { content: `MOYENNE ${groupName}`, colSpan: 2, styles: { halign: "right", fontStyle: "italic", fontSize: 6.5 } },
        gCoef,
        { content: (gWeighted / gCoef).toFixed(2), colSpan: isAnnual ? 4 : 1, styles: { halign: "center", fontStyle: "bold", textColor: [30, 64, 175] } },
        "", ""
      ])
    }
  })

  autoTable(pdf, {
    startY: 75,
    head: [
      isAnnual 
        ? ["Matière", "Enseignant", "C", "T1", "T2", "T3", "An", "Rang", "Appréciation"]
        : ["Matière", "Enseignant", "C", "Note", "Rang", "Appréciation"]
    ],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { halign: "center", cellWidth: 7 },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
      7: { halign: "center" },
      8: { halign: "center" }
    }
  })

  // --- FOOTER SUMMARY ---
  let finalY = (pdf as any).lastAutoTable.finalY + 8
  if (finalY > pageHeight - 65) { pdf.addPage(); finalY = 20 }

  // Trimester Summary Table
  if (isAnnual && data.trimesterSummaries) {
    autoTable(pdf, {
      startY: finalY,
      head: [["PÉRIODE", "MOYENNE", "RANG"]],
      body: [
        ...data.trimesterSummaries.map((ts, i) => [`TRIMESTRE ${i+1}`, safeNum(ts.average), String(ts.rank)]),
        [{ content: "ANNUEL", styles: { fontStyle: "bold", fillColor: [240, 248, 255] } }, { content: data.average.toFixed(2), styles: { fontStyle: "bold", halign: "center" } }, { content: String(data.rank), styles: { fontStyle: "bold", halign: "center" } }]
      ],
      theme: "grid",
      margin: { left: 15 },
      tableWidth: 70,
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [51, 65, 85] }
    })
  }

  const resultX = isAnnual ? 100 : 15
  const resultY = finalY
  
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  pdf.setTextColor(0)
  pdf.text(`MOYENNE GÉNÉRALE: ${data.average.toFixed(2)} / 20`, resultX, resultY + 5)
  pdf.text(`RANG GLOBAL: ${data.rank} sur ${data.classSize}`, resultX, resultY + 12)
  pdf.text(`DÉCISION: ${isAnnual && data.promotion ? data.promotion.decision.toUpperCase() : "TRAVAIL PASSABLE"}`, resultX, resultY + 19)

  // Signatures
  const sigY = pageHeight - 20
  pdf.setFontSize(8)
  pdf.text("Le Parent", 25, sigY)
  pdf.text("Le Principal", pageWidth / 2, sigY, { align: "center" })
  pdf.text("Le Prof. Principal", pageWidth - 50, sigY)
}

export const generateBulletinPDF = async (data: BulletinData) => {
  const pdf = new jsPDF()
  drawBulletinPage(pdf, data)
  pdf.save(`Bulletin_${data.student.lastName}.pdf`)
}

export const generateMassBulletinsPDF = async (dataList: BulletinData[], filename: string) => {
  const pdf = new jsPDF()
  for (let i = 0; i < dataList.length; i++) {
    if (i > 0) pdf.addPage()
    drawBulletinPage(pdf, dataList[i])
  }
  pdf.save(`${filename}.pdf`)
}
