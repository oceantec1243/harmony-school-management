"use client"

import jsPDF from "jspdf"

type Subject = {
  id: string
  name: string
  code: string
  coefficient: number
  group_name: string
  teacher_name?: string
}

type BulletinData = {
  student: {
    id: string
    matricule: string
    first_name: string
    last_name: string
    date_of_birth?: string
    place_of_birth?: string
    gender?: string
    class?: {
      name: string
      level?: { name: string }
      section?: { name: string }
    }
  }
  period: {
    id: string
    name: string
    type: string
    academic_year: string
  }
  subjects: Subject[]
  grades: Record<string, { score: number; coefficient: number }>
  subjectRanks?: Record<string, { rank: number; classSize: number }>
  sequenceGrades?: {
    seq1: Record<string, number>
    seq2: Record<string, number>
  }
  groupAverages: Record<string, number>
  average: number
  rank: number
  classSize: number
  classAverage: number
  classMin?: number
  classMax?: number
  isUnranked?: boolean
}

type SchoolSettings = {
  school_name?: string
  school_slogan?: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  current_academic_year?: string
}

function safeNum(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return "-"
  return value.toFixed(decimals)
}

function numOrZero(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) return 0
  return value
}

function getGradeColor(grade: number | undefined): [number, number, number] {
  if (grade === undefined || isNaN(grade)) return [148, 163, 184]
  if (grade < 10) return [220, 38, 38]
  if (grade < 12) return [245, 158, 11]
  if (grade < 15) return [37, 99, 235]
  return [22, 163, 74]
}

function getAppreciation(score: number | undefined): string {
  if (score === undefined || isNaN(score)) return "-"
  if (score >= 18) return "Excellent"
  if (score >= 16) return "Très Bien"
  if (score >= 14) return "Bien"
  if (score >= 12) return "Assez Bien"
  if (score >= 10) return "Passable"
  if (score >= 8) return "Insuffisant"
  return "Très Insuffisant"
}

function getDistinction(average: number | undefined): string {
  if (average === undefined || isNaN(average)) return "-"
  if (average >= 16) return "Tableau d'Honneur"
  if (average >= 14) return "Tableau d'Encouragement"
  if (average >= 12) return "Félicitations"
  if (average >= 10) return "Admis"
  return "Doit redoubler d'efforts"
}

function generateSingleBulletin(
  pdf: jsPDF,
  bulletinData: BulletinData,
  schoolSettings: SchoolSettings,
  isFirstPage = true,
): void {
  const pageWidth = 210
  const pageHeight = 297
  const margin = 8
  const contentWidth = pageWidth - margin * 2

  const {
    student = {} as BulletinData["student"],
    period = {} as BulletinData["period"],
    subjects = [],
    grades = {},
    subjectRanks = {},
    sequenceGrades,
    groupAverages = {},
    average = 0,
    rank = 0,
    classSize = 1,
    classAverage = 0,
    isUnranked = false,
  } = bulletinData || {}

  const safeAverage = numOrZero(average)
  const safeRank = numOrZero(rank) || 1
  const safeClassSize = numOrZero(classSize) || 1
  const safeClassAverage = numOrZero(classAverage)
  const isTrimestriel = period?.type === "trimester"

  if (!isFirstPage) {
    pdf.addPage()
  }

  // ===== WATERMARK =====
  pdf.setTextColor(235, 235, 235)
  pdf.setFontSize(45)
  pdf.setFont("helvetica", "bold")
  pdf.text(schoolSettings?.school_name || "HARMONY", pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  })

  // ===== HEADER =====
  let y = margin
  const headerHeight = 32

  pdf.setFillColor(252, 251, 248)
  pdf.rect(0, 0, pageWidth, headerHeight + margin, "F")

  const poBox = schoolSettings?.address || ".................."
  const tel = schoolSettings?.phone || ".................."

  const centerX = pageWidth / 2
  const leftColX = margin + 2
  const rightColX = pageWidth - margin - 45

  // Left column - French
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIQUE DU CAMEROUN", leftColX, y + 5)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "italic")
  pdf.text("Paix - Travail - Patrie", leftColX, y + 9)
  pdf.setFontSize(4)
  pdf.text("**********", leftColX, y + 12)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MINISTERE DES ENSEIGNEMENTS", leftColX, y + 16)
  pdf.text("SECONDAIRES", leftColX, y + 20)
  pdf.setFontSize(4)
  pdf.text("**********", leftColX, y + 23)
  pdf.setFontSize(4)
  pdf.setFont("helvetica", "normal")
  pdf.text(`BP: ${poBox}`, leftColX, y + 27)
  pdf.text(`Tél: ${tel}`, leftColX, y + 30)

  // Center - Logo
  pdf.setFillColor(30, 64, 175)
  pdf.circle(centerX, y + 15, 10, "F")
  pdf.setFillColor(255, 255, 255)
  pdf.circle(centerX, y + 15, 8.5, "F")
  pdf.setFillColor(30, 64, 175)
  pdf.circle(centerX, y + 15, 7, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  const initials = (schoolSettings?.school_name || "H")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 3)
  pdf.text(initials, centerX, y + 17, { align: "center" })

  // School name below logo
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.text(schoolSettings?.school_name || "COLLEGE", centerX, y + 28, { align: "center", maxWidth: 50 })
  pdf.setFontSize(4)
  pdf.setFont("helvetica", "italic")
  pdf.text(schoolSettings?.school_slogan || "", centerX, y + 32, { align: "center" })

  // Right column - English
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("REPUBLIC OF CAMEROON", rightColX, y + 5)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "italic")
  pdf.text("Peace - Work - Fatherland", rightColX, y + 9)
  pdf.setFontSize(4)
  pdf.text("**********", rightColX, y + 12)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MINISTRY OF SECONDARY", rightColX, y + 16)
  pdf.text("EDUCATION", rightColX, y + 20)
  pdf.setFontSize(4)
  pdf.text("**********", rightColX, y + 23)
  pdf.setFontSize(4)
  pdf.setFont("helvetica", "normal")
  pdf.text(`PO.BOX: ${poBox}`, rightColX, y + 27)
  pdf.text(`Tel: ${tel}`, rightColX, y + 30)

  // Academic year badge
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(pageWidth - margin - 22, y + 1, 20, 6, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text(period?.academic_year || "2024-2025", pageWidth - margin - 12, y + 5, { align: "center" })

  y += headerHeight + 2

  // TITLE
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(centerX - 28, y, 56, 8, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.text("BULLETIN DE NOTES", centerX, y + 5.5, { align: "center" })

  y += 10

  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(9)
  pdf.text(period?.name || "Période", centerX, y + 2, { align: "center" })

  y += 6

  // ===== STUDENT INFO =====
  const infoBoxHeight = 18
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(margin, y, contentWidth, infoBoxHeight, 1.5, 1.5, "FD")

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("NOM ET PRENOM:", margin + 3, y + 5)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(9)
  pdf.text(`${(student?.last_name || "").toUpperCase()} ${student?.first_name || ""}`, margin + 32, y + 5)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.text("MATRICULE:", margin + 3, y + 10)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.text(student?.matricule || "-", margin + 24, y + 10)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.text("NÉ(E) LE:", margin + 3, y + 15)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(7)
  const dob = student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("fr-FR") : "-"
  pdf.text(`${dob} à ${student?.place_of_birth || "-"}`, margin + 18, y + 15)

  const rightInfoX = margin + contentWidth / 2
  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("CLASSE:", rightInfoX, y + 5)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(9)
  pdf.text(student?.class?.name || "-", rightInfoX + 15, y + 5)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.text("EFFECTIF:", rightInfoX, y + 10)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(8)
  pdf.text(`${safeClassSize} élèves`, rightInfoX + 17, y + 10)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(6)
  pdf.text("SEXE:", rightInfoX, y + 15)
  pdf.setTextColor(30, 41, 59)
  pdf.setFontSize(7)
  pdf.text(student?.gender === "M" ? "Masculin" : student?.gender === "F" ? "Féminin" : "-", rightInfoX + 12, y + 15)

  y += infoBoxHeight + 3

  // ===== GRADES TABLE =====
  const subjectsByGroup: Record<string, Subject[]> = {}
  ;(subjects || []).forEach((s) => {
    const groupName = s?.group_name || "Autres"
    if (!subjectsByGroup[groupName]) subjectsByGroup[groupName] = []
    subjectsByGroup[groupName].push(s)
  })

  const groups = Object.keys(subjectsByGroup)
  const tableHeaderHeight = 6
  const rowHeight = 5
  const groupHeaderHeight = 5

  const col1Width = 42
  const col2Width = 28
  const col3Width = 8
  const col4Width = isTrimestriel ? 12 : 14
  const col5Width = isTrimestriel ? 12 : 0
  const col6Width = isTrimestriel ? 12 : 0
  const col7Width = 12
  const col8Width = 10
  const col9Width =
    contentWidth - col1Width - col2Width - col3Width - col4Width - col5Width - col6Width - col7Width - col8Width

  // Table header
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, tableHeaderHeight, "F")

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")

  let colX = margin
  pdf.text("MATIERES", colX + 2, y + 4)
  colX += col1Width

  pdf.text("ENSEIGNANT", colX + 2, y + 4)
  colX += col2Width

  pdf.text("Coef", colX + col3Width / 2, y + 4, { align: "center" })
  colX += col3Width

  if (isTrimestriel) {
    pdf.text("Séq 1", colX + col4Width / 2, y + 4, { align: "center" })
    colX += col4Width
    pdf.text("Séq 2", colX + col5Width / 2, y + 4, { align: "center" })
    colX += col5Width
    pdf.text("Moy", colX + col6Width / 2, y + 4, { align: "center" })
    colX += col6Width
  } else {
    pdf.text("Note /20", colX + col4Width / 2, y + 4, { align: "center" })
    colX += col4Width
  }

  pdf.text("N x C", colX + col7Width / 2, y + 4, { align: "center" })
  colX += col7Width

  pdf.text("Rang", colX + col8Width / 2, y + 4, { align: "center" })
  colX += col8Width

  pdf.text("Appréciation", colX + 2, y + 4)

  y += tableHeaderHeight

  let totalCoef = 0
  let totalPoints = 0

  groups.forEach((groupName) => {
    const groupSubjects = subjectsByGroup[groupName] || []

    pdf.setFillColor(219, 234, 254)
    pdf.rect(margin, y, contentWidth, groupHeaderHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")
    pdf.text((groupName || "").toUpperCase(), margin + 2, y + 3.5)
    y += groupHeaderHeight

    groupSubjects.forEach((subject, idx) => {
      if (!subject) return

      const grade = grades?.[subject.id]
      const score = grade?.score
      const coef = numOrZero(subject?.coefficient) || 1
      const weighted = score !== undefined && !isNaN(score) ? score * coef : undefined
      const subjectRank = subjectRanks?.[subject.id]

      if (score !== undefined && !isNaN(score)) {
        totalCoef += coef
        totalPoints += weighted || 0
      }

      const bgColor = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2])
      pdf.rect(margin, y, contentWidth, rowHeight, "F")

      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.1)
      pdf.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight)

      colX = margin
      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(5)
      pdf.setFont("helvetica", "normal")
      pdf.text((subject?.name || "-").substring(0, 22), colX + 1, y + 3.5)
      colX += col1Width

      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(4)
      pdf.text((subject?.teacher_name || "-").substring(0, 18), colX + 1, y + 3.5)
      colX += col2Width

      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(5)
      pdf.setFont("helvetica", "bold")
      pdf.text(String(coef), colX + col3Width / 2, y + 3.5, { align: "center" })
      colX += col3Width

      if (isTrimestriel && sequenceGrades) {
        const seq1 = sequenceGrades?.seq1?.[subject.id]
        const seq1Color = getGradeColor(seq1)
        pdf.setTextColor(seq1Color[0], seq1Color[1], seq1Color[2])
        pdf.setFontSize(5)
        pdf.text(safeNum(seq1), colX + col4Width / 2, y + 3.5, { align: "center" })
        colX += col4Width

        const seq2 = sequenceGrades?.seq2?.[subject.id]
        const seq2Color = getGradeColor(seq2)
        pdf.setTextColor(seq2Color[0], seq2Color[1], seq2Color[2])
        pdf.text(safeNum(seq2), colX + col5Width / 2, y + 3.5, { align: "center" })
        colX += col5Width

        const scoreColor = getGradeColor(score)
        pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(score), colX + col6Width / 2, y + 3.5, { align: "center" })
        colX += col6Width
      } else {
        const scoreColor = getGradeColor(score)
        pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(safeNum(score), colX + col4Width / 2, y + 3.5, { align: "center" })
        colX += col4Width
      }

      pdf.setTextColor(71, 85, 105)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(5)
      pdf.text(safeNum(weighted), colX + col7Width / 2, y + 3.5, { align: "center" })
      colX += col7Width

      if (subjectRank && subjectRank.rank && subjectRank.classSize) {
        const rankColor = subjectRank.rank <= 3 ? [22, 163, 74] : subjectRank.rank <= 5 ? [37, 99, 235] : [71, 85, 105]
        pdf.setTextColor(rankColor[0], rankColor[1], rankColor[2])
        pdf.setFont("helvetica", "bold")
        pdf.text(`${subjectRank.rank}/${subjectRank.classSize}`, colX + col8Width / 2, y + 3.5, { align: "center" })
      } else {
        pdf.setTextColor(148, 163, 184)
        pdf.text("-", colX + col8Width / 2, y + 3.5, { align: "center" })
      }
      colX += col8Width

      pdf.setTextColor(100, 116, 139)
      pdf.setFontSize(4)
      pdf.setFont("helvetica", "italic")
      pdf.text(getAppreciation(score), colX + 1, y + 3.5)

      y += rowHeight
    })

    const groupAvg = groupAverages?.[groupName]
    pdf.setFillColor(239, 246, 255)
    pdf.rect(margin, y, contentWidth, rowHeight, "F")
    pdf.setTextColor(30, 64, 175)
    pdf.setFontSize(5)
    pdf.setFont("helvetica", "bold")

    const avgLabelX = margin + col1Width + col2Width - 20
    pdf.text(`Moyenne ${groupName}:`, avgLabelX, y + 3.5, { align: "right" })

    const avgValueX = isTrimestriel
      ? margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width / 2
      : margin + col1Width + col2Width + col3Width + col4Width / 2
    pdf.text(safeNum(groupAvg), avgValueX, y + 3.5, { align: "center" })

    y += rowHeight
  })

  // Total row
  pdf.setFillColor(30, 64, 175)
  pdf.rect(margin, y, contentWidth, rowHeight + 1, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "bold")
  pdf.text("TOTAUX", margin + 2, y + 4)
  pdf.text(String(totalCoef || 0), margin + col1Width + col2Width + col3Width / 2, y + 4, { align: "center" })

  const totalPtsX = isTrimestriel
    ? margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + col7Width / 2
    : margin + col1Width + col2Width + col3Width + col4Width + col7Width / 2
  pdf.text(safeNum(totalPoints), totalPtsX, y + 4, { align: "center" })

  y += rowHeight + 3

  // ===== RESULTS SUMMARY =====
  const summaryBoxHeight = 18
  const boxWidth = (contentWidth - 9) / 4

  // Box 1: Moyenne
  pdf.setFillColor(30, 64, 175)
  pdf.roundedRect(margin, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MOYENNE GÉNÉRALE", margin + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(12)
  pdf.text(safeNum(safeAverage), margin + boxWidth / 2, y + 12, { align: "center" })
  pdf.setFontSize(6)
  pdf.text("/20", margin + boxWidth / 2, y + 16, { align: "center" })

  // Box 2: Rang
  const rankBoxColor = isUnranked ? [107, 114, 128] : [139, 92, 246]
  pdf.setFillColor(rankBoxColor[0], rankBoxColor[1], rankBoxColor[2])
  pdf.roundedRect(margin + boxWidth + 3, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("RANG", margin + boxWidth + 3 + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(12)
  const rankText = isUnranked ? "NC" : safeRank === 1 ? "1er" : `${safeRank}ème`
  pdf.text(rankText, margin + boxWidth + 3 + boxWidth / 2, y + 12, { align: "center" })
  pdf.setFontSize(6)
  pdf.text(isUnranked ? "Non Classé" : `sur ${safeClassSize}`, margin + boxWidth + 3 + boxWidth / 2, y + 16, {
    align: "center",
  })

  // Box 3: Moyenne classe
  pdf.setFillColor(6, 182, 212)
  pdf.roundedRect(margin + (boxWidth + 3) * 2, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MOY. CLASSE", margin + (boxWidth + 3) * 2 + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(12)
  pdf.text(safeNum(safeClassAverage), margin + (boxWidth + 3) * 2 + boxWidth / 2, y + 12, { align: "center" })
  pdf.setFontSize(6)
  pdf.text("/20", margin + (boxWidth + 3) * 2 + boxWidth / 2, y + 16, { align: "center" })

  // Box 4: Mention
  const mentionColor =
    safeAverage >= 16
      ? [245, 158, 11]
      : safeAverage >= 14
        ? [22, 163, 74]
        : safeAverage >= 12
          ? [37, 99, 235]
          : safeAverage >= 10
            ? [107, 114, 128]
            : [220, 38, 38]
  pdf.setFillColor(mentionColor[0], mentionColor[1], mentionColor[2])
  pdf.roundedRect(margin + (boxWidth + 3) * 3, y, boxWidth, summaryBoxHeight, 1.5, 1.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("MENTION", margin + (boxWidth + 3) * 3 + boxWidth / 2, y + 4, { align: "center" })
  pdf.setFontSize(7)
  const distinction = getDistinction(safeAverage)
  const distinctionLines = pdf.splitTextToSize(distinction, boxWidth - 4)
  pdf.text(distinctionLines, margin + (boxWidth + 3) * 3 + boxWidth / 2, y + 11, { align: "center" })

  y += summaryBoxHeight + 3

  // ===== OBSERVATIONS =====
  const obsHeight = 16
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(203, 213, 225)
  pdf.roundedRect(margin, y, contentWidth / 2 - 2, obsHeight, 1.5, 1.5, "FD")
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("OBSERVATION DU CONSEIL DE CLASSE", margin + 2, y + 4)
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "italic")
  const obs =
    safeAverage >= 16
      ? "Excellent travail. Continuez ainsi !"
      : safeAverage >= 14
        ? "Très bon trimestre. Élève sérieux."
        : safeAverage >= 12
          ? "Bon travail. Continuez vos efforts."
          : safeAverage >= 10
            ? "Résultats acceptables. Plus de rigueur nécessaire."
            : "Résultats insuffisants. Travail plus soutenu requis."
  pdf.text(obs, margin + 2, y + 10, { maxWidth: contentWidth / 2 - 6 })

  pdf.setFillColor(248, 250, 252)
  pdf.roundedRect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, obsHeight, 1.5, 1.5, "FD")
  pdf.setTextColor(30, 64, 175)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "bold")
  pdf.text("DÉCISION DU CONSEIL", margin + contentWidth / 2 + 4, y + 4)
  pdf.setTextColor(71, 85, 105)
  pdf.setFontSize(6)
  pdf.setFont("helvetica", "normal")
  pdf.text(distinction, margin + contentWidth / 2 + 4, y + 10)

  y += obsHeight + 3

  // ===== SIGNATURES =====
  const sigHeight = 16
  const sigWidth = contentWidth / 3 - 3

  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.2)

  pdf.setTextColor(100, 116, 139)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "normal")
  pdf.text("Le Directeur", margin + sigWidth / 2, y + 3, { align: "center" })
  pdf.line(margin + 4, y + sigHeight - 3, margin + sigWidth - 4, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text("Signature & Cachet", margin + sigWidth / 2, y + sigHeight, { align: "center" })

  pdf.setFontSize(5)
  pdf.text("Le Professeur Principal", margin + sigWidth + 4 + sigWidth / 2, y + 3, { align: "center" })
  pdf.line(margin + sigWidth + 8, y + sigHeight - 3, margin + sigWidth * 2, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text("Signature", margin + sigWidth + 4 + sigWidth / 2, y + sigHeight, { align: "center" })

  pdf.setFontSize(5)
  pdf.text("Le Parent", margin + (sigWidth + 4) * 2 + sigWidth / 2, y + 3, { align: "center" })
  pdf.line(margin + (sigWidth + 4) * 2 + 4, y + sigHeight - 3, margin + contentWidth - 4, y + sigHeight - 3)
  pdf.setFontSize(4)
  pdf.text("Signature", margin + (sigWidth + 4) * 2 + sigWidth / 2, y + sigHeight, { align: "center" })

  // ===== FOOTER =====
  const now = new Date()
  const dateStr = now.toLocaleDateString("fr-FR")
  const timeStr = now.toLocaleTimeString("fr-FR")

  pdf.setTextColor(148, 163, 184)
  pdf.setFontSize(5)
  pdf.setFont("helvetica", "normal")
  pdf.text(
    `Bulletin généré le ${dateStr} à ${timeStr} par HARMONY - Développé par OceanTechnologie`,
    centerX,
    pageHeight - 5,
    { align: "center" },
  )
}

export async function generateBulletinPDF(bulletinData: BulletinData, schoolSettings: SchoolSettings): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  generateSingleBulletin(pdf, bulletinData, schoolSettings, true)

  const studentName = `${bulletinData?.student?.last_name || "Eleve"}_${bulletinData?.student?.first_name || ""}`
  const periodName = bulletinData?.period?.name || "Periode"
  const fileName = `Bulletin_${studentName}_${periodName}.pdf`

  pdf.save(fileName)
}

export async function generateClassBulletinsPDF(
  bulletinsData: BulletinData[],
  schoolSettings: SchoolSettings,
  className: string,
  periodName: string,
): Promise<void> {
  if (!bulletinsData || bulletinsData.length === 0) {
    throw new Error("Aucun bulletin à générer")
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Sort by average (merit order) - highest first, NC students at the end
  const sortedBulletins = [...bulletinsData].sort((a, b) => {
    if (a?.isUnranked && !b?.isUnranked) return 1
    if (!a?.isUnranked && b?.isUnranked) return -1
    const avgA = numOrZero(a?.average)
    const avgB = numOrZero(b?.average)
    return avgB - avgA
  })

  sortedBulletins.forEach((bulletin, index) => {
    if (bulletin) {
      generateSingleBulletin(pdf, bulletin, schoolSettings, index === 0)
    }
  })

  const fileName = `Bulletins_${className || "Classe"}_${periodName || "Periode"}.pdf`
  pdf.save(fileName)
}

export type { BulletinData, SchoolSettings, Subject }
