// Export utilities for analysis reports

interface StudentExportData {
  rank: number
  matricule: string
  lastName: string
  firstName: string
  gender: string
  className: string
  average: number
  mention: string
  status: string
  strongSubjects: string[]
  weakSubjects: string[]
}

interface ClassExportData {
  name: string
  level: string
  section: string
  studentCount: number
  average: number
  passRate: number
  excellenceRate: number
  failureRate: number
  bestStudentName: string
  bestStudentAverage: number
}

interface SubjectExportData {
  name: string
  group: string
  average: number
  passRate: number
  noteCount: number
}

// Convert data to CSV format
export function exportToCSV(data: any[], filename: string, headers: Record<string, string>) {
  const headerRow = Object.values(headers).join(";")
  const dataRows = data.map((item) =>
    Object.keys(headers)
      .map((key) => {
        const value = item[key]
        if (Array.isArray(value)) {
          return `"${value.join(", ")}"`
        }
        if (typeof value === "string" && (value.includes(";") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ""
      })
      .join(";")
  )

  const csvContent = [headerRow, ...dataRows].join("\n")
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, `${filename}.csv`)
}

// Download blob as file
function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export students list
export function exportStudentsList(
  students: StudentExportData[],
  periodName: string,
  className?: string
) {
  const headers = {
    rank: "Rang",
    matricule: "Matricule",
    lastName: "Nom",
    firstName: "Prénom",
    gender: "Genre",
    className: "Classe",
    average: "Moyenne",
    mention: "Mention",
    status: "Statut",
    strongSubjects: "Matières fortes",
    weakSubjects: "Matières faibles",
  }

  const filename = className
    ? `Liste_Eleves_${className}_${periodName}`
    : `Liste_Eleves_${periodName}`

  exportToCSV(students, filename, headers)
}

// Export class summary
export function exportClassSummary(classes: ClassExportData[], periodName: string) {
  const headers = {
    name: "Classe",
    level: "Niveau",
    section: "Section",
    studentCount: "Effectif",
    average: "Moyenne",
    passRate: "Taux Réussite (%)",
    excellenceRate: "Taux Excellence (%)",
    failureRate: "Taux Échec (%)",
    bestStudentName: "Meilleur Élève",
    bestStudentAverage: "Meilleure Moyenne",
  }

  exportToCSV(classes, `Resume_Classes_${periodName}`, headers)
}

// Export subject performance
export function exportSubjectPerformance(subjects: SubjectExportData[], periodName: string) {
  const headers = {
    name: "Matière",
    group: "Groupe",
    average: "Moyenne",
    passRate: "Taux Réussite (%)",
    noteCount: "Nombre de notes",
  }

  exportToCSV(subjects, `Performance_Matieres_${periodName}`, headers)
}

// Get mention from average
export function getMentionLabel(average: number): string {
  if (average >= 16) return "Excellent"
  if (average >= 14) return "Très Bien"
  if (average >= 12) return "Bien"
  if (average >= 10) return "Assez Bien"
  return "Insuffisant"
}

// Get status from average
export function getStatusLabel(average: number, isAtRisk: boolean): string {
  if (isAtRisk) return "En danger"
  if (average >= 16) return "Excellence"
  if (average >= 14) return "Tableau d'honneur"
  if (average >= 10) return "Admis"
  return "Ajourné"
}

// Generate printable report HTML
export function generatePrintableReport(
  title: string,
  periodName: string,
  stats: {
    totalStudents: number
    schoolAverage: number
    passRate: number
    excellenceRate: number
  },
  classes: ClassExportData[],
  topStudents: StudentExportData[]
): string {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${periodName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; padding: 20mm; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1E40AF; }
        .header h1 { font-size: 18pt; color: #1E40AF; margin-bottom: 5px; }
        .header h2 { font-size: 14pt; color: #666; margin-bottom: 5px; }
        .header p { font-size: 10pt; color: #999; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
        .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-card .value { font-size: 24pt; font-weight: bold; color: #1E40AF; }
        .stat-card .label { font-size: 9pt; color: #64748b; margin-top: 5px; }
        h3 { font-size: 14pt; color: #1E40AF; margin: 20px 0 10px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
        th, td { padding: 8px 10px; text-align: left; border: 1px solid #e2e8f0; }
        th { background: #1E40AF; color: white; font-weight: 600; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 600; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-purple { background: #ede9fe; color: #5b21b6; }
        .footer { margin-top: 30px; text-align: center; font-size: 9pt; color: #999; padding-top: 15px; border-top: 1px solid #e2e8f0; }
        @media print {
          body { padding: 10mm; }
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <h2>${periodName}</h2>
        <p>Rapport généré le ${date}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">${stats.totalStudents}</div>
          <div class="label">Effectif Total</div>
        </div>
        <div class="stat-card">
          <div class="value">${stats.schoolAverage.toFixed(2)}</div>
          <div class="label">Moyenne Générale</div>
        </div>
        <div class="stat-card">
          <div class="value">${stats.passRate}%</div>
          <div class="label">Taux de Réussite</div>
        </div>
        <div class="stat-card">
          <div class="value">${stats.excellenceRate}%</div>
          <div class="label">Taux d'Excellence</div>
        </div>
      </div>

      <h3>Récapitulatif par Classe</h3>
      <table>
        <thead>
          <tr>
            <th>Classe</th>
            <th>Niveau</th>
            <th class="text-center">Effectif</th>
            <th class="text-center">Moyenne</th>
            <th class="text-center">Réussite</th>
            <th class="text-center">Excellence</th>
            <th>Meilleur Élève</th>
          </tr>
        </thead>
        <tbody>
          ${classes
            .map(
              (c) => `
            <tr>
              <td><strong>${c.name}</strong></td>
              <td>${c.level}</td>
              <td class="text-center">${c.studentCount}</td>
              <td class="text-center"><strong>${c.average.toFixed(2)}</strong></td>
              <td class="text-center">${c.passRate}%</td>
              <td class="text-center">${c.excellenceRate}%</td>
              <td>${c.bestStudentName} (${c.bestStudentAverage.toFixed(2)})</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <h3>Palmarès - Top 10</h3>
      <table>
        <thead>
          <tr>
            <th class="text-center">Rang</th>
            <th>Nom & Prénom</th>
            <th>Classe</th>
            <th class="text-center">Moyenne</th>
            <th class="text-center">Mention</th>
          </tr>
        </thead>
        <tbody>
          ${topStudents
            .slice(0, 10)
            .map(
              (s, i) => `
            <tr>
              <td class="text-center"><strong>${i + 1}</strong></td>
              <td>${s.lastName} ${s.firstName}</td>
              <td>${s.className}</td>
              <td class="text-center"><strong>${s.average.toFixed(2)}</strong></td>
              <td class="text-center">
                <span class="badge ${
                  s.average >= 16
                    ? "badge-purple"
                    : s.average >= 14
                      ? "badge-success"
                      : "badge-warning"
                }">
                  ${s.mention}
                </span>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        <p>HARMONY - Système de Gestion Scolaire</p>
        <p>Document confidentiel - Usage interne uniquement</p>
      </div>
    </body>
    </html>
  `
}

// Open print dialog with generated report
export function printReport(
  title: string,
  periodName: string,
  stats: {
    totalStudents: number
    schoolAverage: number
    passRate: number
    excellenceRate: number
  },
  classes: ClassExportData[],
  topStudents: StudentExportData[]
) {
  const html = generatePrintableReport(title, periodName, stats, classes, topStudents)
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
