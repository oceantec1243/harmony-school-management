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
    birthDate?: string
    birthPlace?: string
  }
  className: string
  academicYear: string
  section: string
  studentCount: number
  subjects: Array<{
    name: string
    coefficient: number
    group: string
    teacherName?: string
    sequences: (number | "NC")[]
    trimesters: (number | "NC")[]
    annual: number | "NC"
    rank?: string
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

  // --- TOP BILINGUAL HEADER (Cameroon Style) ---
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  
  // Left side (French)
  pdf.text("RÉPUBLIQUE DU CAMEROUN", 20, 10)
  pdf.text("Paix - Travail - Patrie", 25, 14)
  pdf.text("**********", 30, 18)
  pdf.text("MINISTÈRE DES ENSEIGNEMENTS", 18, 22)
  pdf.text("SECONDAIRES", 28, 26)
  
  // Right side (English)
  pdf.text("REPUBLIC OF CAMEROON", pageWidth - 60, 10)
  pdf.text("Peace - Work - Fatherland", pageWidth - 58, 14)
  pdf.text("**********", pageWidth - 45, 18)
  pdf.text("MINISTRY OF SECONDARY", pageWidth - 58, 22)
  pdf.text("EDUCATION", pageWidth - 48, 26)

  // School Name (Center)
  pdf.setFontSize(12)
  pdf.setTextColor(30, 64, 175)
  pdf.text(data.schoolSettings.school_name.toUpperCase(), pageWidth / 2, 35, { align: "center" })
  
  pdf.setFontSize(8)
  pdf.setTextColor(100)
  pdf.text(data.schoolSettings.school_slogan || "", pageWidth / 2, 39, { align: "center" })
  pdf.text(`B.P.: ${data.schoolSettings.address || ""} | Tél.: ${data.schoolSettings.phone || ""}`, pageWidth / 2, 43, { align: "center" })

  pdf.setDrawColor(30, 64, 175)
  pdf.setLineWidth(0.5)
  pdf.line(20, 45, pageWidth - 20, 45)

  // Title
  pdf.setFontSize(14)
  pdf.setTextColor(0)
  pdf.setFont("helvetica", "bold")
  pdf.text("BULLETIN DE NOTES ANNUEL", pageWidth / 2, 53, { align: "center" })
  
  pdf.setFontSize(10)
  pdf.text(`Année Scolaire: ${data.academicYear}`, pageWidth / 2, 58, { align: "center" })

  // --- STUDENT INFO ---
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  
  const leftCol = 20
  const midCol = pageWidth / 2 - 30
  const rightCol = pageWidth - 90

  pdf.text(`Nom: ${data.student.lastName} ${data.student.firstName}`, leftCol, 68)
  pdf.text(`Matricule: ${data.student.matricule}`, leftCol, 73)
  pdf.text(`Né(e) le: ${data.student.birthDate || "-"} à ${data.student.birthPlace || "-"}`, leftCol, 78)

  pdf.text(`Classe: ${data.className}`, midCol, 68)
  pdf.text(`Effectif: ${data.studentCount}`, midCol, 73)
  pdf.text(`Section: ${data.section}`, midCol, 78)

  // --- GRADES TABLE ---
  const tableRows = data.subjects.map(s => [
    s.name,
    s.teacherName || "-",
    s.coefficient,
    ...s.sequences.map(v => typeof v === "number" ? v.toFixed(2) : v),
    ...s.trimesters.map(v => typeof v === "number" ? v.toFixed(2) : v),
    typeof s.annual === "number" ? s.annual.toFixed(2) : s.annual,
    s.rank || "-",
    getAppreciation(s.annual)
  ])

  pdf.autoTable({
    startY: 85,
    head: [
      [
        { content: "Matière", rowSpan: 2 },
        { content: "Enseignant", rowSpan: 2 },
        { content: "C", rowSpan: 2 },
        { content: "Séquences", colSpan: 6, halign: "center" },
        { content: "Trimestres", colSpan: 3, halign: "center" },
        { content: "Annuel", rowSpan: 2 },
        { content: "Rang", rowSpan: 2 },
        { content: "Appréciation", rowSpan: 2 }
      ],
      ["S1", "S2", "S3", "S4", "S5", "S6", "T1", "T2", "T3"]
    ],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 7, halign: "center", cellPadding: 1 },
    bodyStyles: { fontSize: 7, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { halign: "center", cellWidth: 7 },
      3: { halign: "center", cellWidth: 10 },
      4: { halign: "center", cellWidth: 10 },
      5: { halign: "center", cellWidth: 10 },
      6: { halign: "center", cellWidth: 10 },
      7: { halign: "center", cellWidth: 10 },
      8: { halign: "center", cellWidth: 10 },
      9: { halign: "center", cellWidth: 12 },
      10: { halign: "center", cellWidth: 12 },
      11: { halign: "center", cellWidth: 12 },
      12: { halign: "center", cellWidth: 15, fontStyle: "bold" },
      13: { halign: "center", cellWidth: 15 },
      14: { halign: "left" }
    },
    styles: { overflow: "linebreak" }
  })

  // --- SUMMARY TABLE ---
  const finalY = (pdf as any).lastAutoTable.finalY + 8
  
  const summaryHead = [
    "RÉSULTATS GÉNÉRAUX",
    "Seq 1", "Seq 2", "Seq 3", "Seq 4", "Seq 5", "Seq 6",
    "Trim 1", "Trim 2", "Trim 3",
    "MOYENNE ANNUELLE"
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

  // --- DECISION & OBSERVATION ---
  const footerY = (pdf as any).lastAutoTable.finalY + 10
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.text(`DÉCISION DU CONSEIL: ${data.summary.promotion.toUpperCase()}`, 20, footerY)
  
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  const observation = typeof data.summary.annualAverage === "number" && data.summary.annualAverage < 10 
    ? "Résultats en dessous de la moyenne. Travail insuffisant - Redoublement ou Rattrapage recommandé."
    : "Bon travail dans l'ensemble. Continuez ainsi."
  pdf.text(`OBSERVATION: ${observation}`, 20, footerY + 5)

  // --- SIGNATURES ---
  const signatureY = footerY + 20
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.text("Parent / Tuteur", 30, signatureY)
  pdf.text("Le Professeur Principal", pageWidth / 2, signatureY, { align: "center" })
  pdf.text("Le Chef d'Établissement", pageWidth - 60, signatureY)

  // Save the PDF
  pdf.save(`Bulletin_Annuel_${data.student.lastName}_${data.student.matricule}.pdf`)
}
