import jsPDF from "jspdf"
import "jspdf-autotable"

// Extending jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface AnnualBulletinData {
  student: {
    firstName: string
    lastName: string
    matricule: string
    gender?: string
  }
  className: string
  academicYear: string
  section: string
  subjects: Array<{
    name: string
    coefficient: number
    group: string
    sequences: (number | "NC")[]
    trimesters: (number | "NC")[]
    annual: number | "NC"
  }>
  summary: {
    sequenceAverages: (number | "NC")[]
    sequenceRankings: (number | "-")[]
    trimesterAverages: (number | "NC")[]
    trimesterRankings: (number | "-")[]
    annualAverage: number | "NC"
    annualRank: number | "-"
    promotion: string
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

const getAppreciation = (score: number | "NC"): string => {
  if (score === "NC") return "Non Classé"
  if (score >= 18) return "Excellent"
  if (score >= 16) return "Très Bien"
  if (score >= 14) return "Bien"
  if (score >= 12) return "Assez Bien"
  if (score >= 10) return "Passable"
  if (score >= 8) return "Insuffisant"
  return "Très Faible"
}

export async function generateAnnualBulletinPDF(data: AnnualBulletinData) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Header
  pdf.setFontSize(18)
  pdf.setTextColor(30, 64, 175) // blue-800
  pdf.text(data.schoolSettings.school_name.toUpperCase(), pageWidth / 2, 15, { align: "center" })
  
  pdf.setFontSize(10)
  pdf.setTextColor(100)
  pdf.text(data.schoolSettings.school_slogan || "", pageWidth / 2, 20, { align: "center" })
  pdf.text(`${data.schoolSettings.address || ""} | ${data.schoolSettings.phone || ""}`, pageWidth / 2, 25, { align: "center" })

  pdf.setDrawColor(30, 64, 175)
  pdf.setLineWidth(0.5)
  pdf.line(20, 28, pageWidth - 20, 28)

  // Title
  pdf.setFontSize(16)
  pdf.setTextColor(0)
  pdf.setFont("helvetica", "bold")
  pdf.text("BULLETIN ANNUEL DE NOTES", pageWidth / 2, 38, { align: "center" })
  
  pdf.setFontSize(11)
  pdf.text(`Année Académique: ${data.academicYear}`, pageWidth / 2, 44, { align: "center" })

  // Student Info
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  
  const leftCol = 25
  const midCol = pageWidth / 2 - 20
  const rightCol = pageWidth - 80

  pdf.text(`Nom: ${data.student.lastName}`, leftCol, 55)
  pdf.text(`Prénom: ${data.student.firstName}`, leftCol, 61)
  pdf.text(`Matricule: ${data.student.matricule}`, leftCol, 67)

  pdf.text(`Classe: ${data.className}`, midCol, 55)
  pdf.text(`Section: ${data.section}`, midCol, 61)
  pdf.text(`Sexe: ${data.student.gender || "M"}`, midCol, 67)

  // Grades Table
  const tableRows = data.subjects.map(s => [
    s.name,
    s.coefficient,
    ...s.sequences.map(v => typeof v === "number" ? v.toFixed(2) : v),
    ...s.trimesters.map(v => typeof v === "number" ? v.toFixed(2) : v),
    typeof s.annual === "number" ? s.annual.toFixed(2) : s.annual,
    getAppreciation(s.annual)
  ])

  pdf.autoTable({
    startY: 75,
    head: [
      [
        { content: "Matière", rowSpan: 2 },
        { content: "Coef", rowSpan: 2 },
        { content: "Séquences", colSpan: 6, halign: "center" },
        { content: "Trimestres", colSpan: 3, halign: "center" },
        { content: "Annuel", rowSpan: 2 },
        { content: "Appréciation", rowSpan: 2 }
      ],
      ["S1", "S2", "S3", "S4", "S5", "S6", "T1", "T2", "T3"]
    ],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { halign: "center", cellWidth: 10 },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
      7: { halign: "center" },
      8: { halign: "center" },
      9: { halign: "center" },
      10: { halign: "center" },
      11: { halign: "center", fontStyle: "bold" },
      12: { halign: "left" }
    },
    styles: { overflow: "linebreak", cellPadding: 1 }
  })

  // Summary Table
  const finalY = (pdf as any).lastAutoTable.finalY + 10
  
  const summaryHead = [
    "RÉSULTATS",
    "Seq 1", "Seq 2", "Seq 3", "Seq 4", "Seq 5", "Seq 6",
    "Trim 1", "Trim 2", "Trim 3",
    "ANNUEL"
  ]

  const summaryBody = [
    [
      "Moyennes",
      ...data.summary.sequenceAverages.map(v => typeof v === "number" ? v.toFixed(2) : v),
      ...data.summary.trimesterAverages.map(v => typeof v === "number" ? v.toFixed(2) : v),
      typeof data.summary.annualAverage === "number" ? data.summary.annualAverage.toFixed(2) : data.summary.annualAverage
    ],
    [
      "Rangs",
      ...data.summary.sequenceRankings.map(v => v.toString()),
      ...data.summary.trimesterRankings.map(v => v.toString()),
      data.summary.annualRank.toString()
    ]
  ]

  pdf.autoTable({
    startY: finalY,
    head: [summaryHead],
    body: summaryBody,
    theme: "grid",
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 8, halign: "center" },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 45 }
    }
  })

  // Decision & Footer
  const footerY = (pdf as any).lastAutoTable.finalY + 10
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  pdf.text(`DÉCISION DU CONSEIL: ${data.summary.promotion.toUpperCase()}`, 25, footerY)

  // Signatures
  const signatureY = footerY + 15
  pdf.setFontSize(10)
  pdf.text("Le Parent", 40, signatureY)
  pdf.text("Le Professeur Principal", pageWidth / 2, signatureY, { align: "center" })
  pdf.text("Le Chef d'Établissement", pageWidth - 60, signatureY)

  // Save the PDF
  pdf.save(`Bulletin_Annuel_${data.student.lastName}_${data.student.matricule}.pdf`)
}
