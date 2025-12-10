"use client"

import { forwardRef } from "react"

type Subject = {
  id: string
  subject_id: string
  name: string
  code: string
  coefficient: number
  group_name: string
}

type StudentReport = {
  student: {
    id: string
    matricule: string
    first_name: string
    last_name: string
    class_name?: string
  }
  grades: Record<string, number>
  average: number
  rank: number
}

type ReportData = {
  class: {
    name: string
    class_teacher: string | null
    level?: { name: string }
    section?: { name: string }
  }
  period: {
    name: string
    academic_year: string
  }
  subjects: Subject[]
  students: StudentReport[]
  classAverage: number
  subjectAverages: Record<string, number>
}

interface BordereauDocumentProps {
  reportData: ReportData
  schoolSettings: any
  subjectsByGroup: Record<string, Subject[]>
}

const getGradeColor = (grade: number | undefined): string => {
  if (grade === undefined) return "#94a3b8"
  if (grade < 10) return "#dc2626" // red: 0-9
  if (grade < 12) return "#f59e0b" // yellow/orange: 10-11
  if (grade < 15) return "#2563eb" // blue: 12-14
  return "#16a34a" // green: 15-20
}

const getGradeBgColor = (grade: number | undefined): string => {
  if (grade === undefined) return "#f8fafc"
  if (grade < 10) return "#fef2f2"
  if (grade < 12) return "#fffbeb"
  if (grade < 15) return "#eff6ff"
  return "#f0fdf4"
}

const getRankStyle = (rank: number): { bg: string; color: string } => {
  if (rank === 1) return { bg: "#fef3c7", color: "#92400e" }
  if (rank === 2) return { bg: "#e5e7eb", color: "#374151" }
  if (rank === 3) return { bg: "#fed7aa", color: "#9a3412" }
  if (rank <= 5) return { bg: "#dbeafe", color: "#1e40af" }
  return { bg: "#f8fafc", color: "#64748b" }
}

export const BordereauDocument = forwardRef<HTMLDivElement, BordereauDocumentProps>(
  ({ reportData, schoolSettings, subjectsByGroup }, ref) => {
    const passingStudents = reportData.students.filter((s) => s.average >= 10).length
    const passRate =
      reportData.students.length > 0 ? Math.round((passingStudents / reportData.students.length) * 100) : 0

    const now = new Date()
    const dateTimeStr = `${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR")}`

    const totalSubjects = reportData.subjects.length
    const baseFontSize = totalSubjects > 15 ? 9 : totalSubjects > 10 ? 10 : 11

    return (
      <div
        ref={ref}
        id="bordereau-document"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: "16px 20px",
          position: "relative",
          overflow: "hidden",
          minHeight: "100%",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: `${baseFontSize}px`,
        }}
      >
        {/* Watermark - more visible */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            fontSize: "80px",
            fontWeight: "bold",
            color: "rgba(0, 0, 0, 0.08)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 0,
            letterSpacing: "8px",
          }}
        >
          {schoolSettings?.school_name || "HARMONY"}
        </div>

        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
            borderRadius: "12px",
            padding: "16px 24px",
            marginBottom: "16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo centered */}
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            {schoolSettings?.logo_url && (
              <img
                src={schoolSettings.logo_url || "/placeholder.svg"}
                alt="Logo"
                style={{ height: "50px", margin: "0 auto", display: "block" }}
              />
            )}
          </div>

          <h1
            style={{
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "0 0 4px 0",
              letterSpacing: "1px",
            }}
          >
            {schoolSettings?.school_name || "HARMONY School"}
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "12px",
              fontStyle: "italic",
              textAlign: "center",
              margin: "0 0 4px 0",
            }}
          >
            {schoolSettings?.school_slogan || "L'excellence au service de l'éducation"}
          </p>
          {schoolSettings?.school_address && (
            <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "10px", textAlign: "center", margin: 0 }}>
              {schoolSettings.school_address}
            </p>
          )}

          {/* Academic year badge */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "16px",
              background: "#8b5cf6",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            {reportData.period.academic_year || schoolSettings?.current_academic_year}
          </div>

          {/* Title */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "8px 24px",
              margin: "12px auto 0",
              width: "fit-content",
            }}
          >
            <h2 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "bold", margin: 0, letterSpacing: "2px" }}>
              BORDEREAU DE NOTES
            </h2>
          </div>
        </div>

        {/* Info boxes */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              flex: 1,
              background: "#f8fafc",
              border: "2px solid #2563eb",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#2563eb", fontSize: "10px", fontWeight: "bold", marginBottom: "4px" }}>CLASSE</div>
            <div style={{ color: "#1e293b", fontSize: "14px", fontWeight: "bold" }}>{reportData.class.name}</div>
          </div>
          <div
            style={{
              flex: 1,
              background: "#f8fafc",
              border: "2px solid #8b5cf6",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#8b5cf6", fontSize: "10px", fontWeight: "bold", marginBottom: "4px" }}>NIVEAU</div>
            <div style={{ color: "#1e293b", fontSize: "14px", fontWeight: "bold" }}>
              {reportData.class.level?.name || "-"}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: "#f8fafc",
              border: "2px solid #ec4899",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#ec4899", fontSize: "10px", fontWeight: "bold", marginBottom: "4px" }}>SECTION</div>
            <div style={{ color: "#1e293b", fontSize: "14px", fontWeight: "bold" }}>
              {reportData.class.section?.name || "-"}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: "#6d28d9",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "10px", fontWeight: "bold", marginBottom: "4px" }}>
              PÉRIODE
            </div>
            <div style={{ color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}>{reportData.period.name}</div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            fontSize: "11px",
            color: "#64748b",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span>
            <strong>Effectif:</strong> {reportData.students.length} élèves | <strong>Taux de réussite:</strong>{" "}
            {passRate}%
          </span>
          <span>
            <strong>Prof. Principal:</strong> {reportData.class.class_teacher || "Non assigné"}
          </span>
          <span>
            <strong>Généré le:</strong> {dateTimeStr}
          </span>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${baseFontSize}px`,
            position: "relative",
            zIndex: 1,
          }}
        >
          <thead>
            <tr style={{ background: "#1e40af" }}>
              <th style={{ color: "#fff", padding: "8px 4px", fontWeight: "bold", textAlign: "center", width: "40px" }}>
                Rg
              </th>
              <th style={{ color: "#fff", padding: "8px 4px", fontWeight: "bold", textAlign: "center", width: "30px" }}>
                N°
              </th>
              <th style={{ color: "#fff", padding: "8px 4px", fontWeight: "bold", textAlign: "left" }}>Nom & Prénom</th>
              {reportData.subjects.map((subject) => (
                <th
                  key={subject.subject_id}
                  style={{
                    color: "#fff",
                    padding: "4px 2px",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontSize: "9px",
                    minWidth: "35px",
                  }}
                >
                  <div>{subject.code || subject.name.substring(0, 4)}</div>
                  <div style={{ fontSize: "8px", opacity: 0.8 }}>({subject.coefficient})</div>
                </th>
              ))}
              <th style={{ color: "#fff", padding: "8px 4px", fontWeight: "bold", textAlign: "center", width: "70px" }}>
                Matricule
              </th>
              <th
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  padding: "8px 4px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "50px",
                }}
              >
                Moy
              </th>
              <th
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  padding: "8px 4px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "40px",
                }}
              >
                Rg
              </th>
            </tr>
          </thead>
          <tbody>
            {reportData.students.map((studentReport, index) => {
              const rankStyle = getRankStyle(studentReport.rank)
              return (
                <tr key={studentReport.student.id} style={{ background: index % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                  <td
                    style={{
                      padding: "6px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      background: rankStyle.bg,
                      color: rankStyle.color,
                      borderRadius: "4px",
                    }}
                  >
                    {studentReport.rank <= 3
                      ? `${studentReport.rank}${studentReport.rank === 1 ? "er" : "e"}`
                      : studentReport.rank}
                  </td>
                  <td style={{ padding: "6px 4px", textAlign: "center", color: "#64748b" }}>{index + 1}</td>
                  <td style={{ padding: "6px 4px", fontWeight: "bold", color: "#1e293b" }}>
                    <span style={{ fontWeight: "bold" }}>{studentReport.student.last_name.toUpperCase()}</span>{" "}
                    <span style={{ fontWeight: "normal" }}>{studentReport.student.first_name}</span>
                  </td>
                  {reportData.subjects.map((subject) => {
                    const grade = studentReport.grades[subject.subject_id]
                    return (
                      <td
                        key={subject.subject_id}
                        style={{
                          padding: "4px 2px",
                          textAlign: "center",
                          fontWeight: "bold",
                          background: getGradeBgColor(grade),
                          color: getGradeColor(grade),
                          fontSize: "10px",
                        }}
                      >
                        {grade !== undefined ? grade.toFixed(2) : "-"}
                      </td>
                    )
                  })}
                  <td style={{ padding: "6px 4px", textAlign: "center", fontSize: "9px", color: "#64748b" }}>
                    {studentReport.student.matricule || "-"}
                  </td>
                  <td
                    style={{
                      padding: "6px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      background: getGradeBgColor(studentReport.average),
                      color: getGradeColor(studentReport.average),
                    }}
                  >
                    {studentReport.average.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "6px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      background: rankStyle.bg,
                      color: rankStyle.color,
                    }}
                  >
                    {studentReport.rank <= 3
                      ? `${studentReport.rank}${studentReport.rank === 1 ? "er" : "e"}`
                      : studentReport.rank}
                  </td>
                </tr>
              )
            })}
            {/* Averages row */}
            <tr style={{ background: "#dbeafe" }}>
              <td colSpan={3} style={{ padding: "8px", fontWeight: "bold", color: "#1e40af" }}>
                MOYENNES:
              </td>
              {reportData.subjects.map((subject) => {
                const avg = reportData.subjectAverages[subject.subject_id]
                return (
                  <td
                    key={subject.subject_id}
                    style={{
                      padding: "4px 2px",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: avg !== undefined ? getGradeColor(avg) : "#94a3b8",
                      fontSize: "10px",
                    }}
                  >
                    {avg !== undefined ? avg.toFixed(2) : "-"}
                  </td>
                )
              })}
              <td></td>
              <td
                style={{
                  padding: "8px 4px",
                  textAlign: "center",
                  fontWeight: "bold",
                  color: getGradeColor(reportData.classAverage),
                  fontSize: "13px",
                }}
              >
                {reportData.classAverage.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div
          style={{
            marginTop: "16px",
            paddingTop: "10px",
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
            fontSize: "10px",
            color: "#94a3b8",
            position: "relative",
            zIndex: 1,
          }}
        >
          <p style={{ margin: 0 }}>
            Bordereau généré le {dateTimeStr} par <strong>HARMONY</strong> - Développé par{" "}
            <strong>OceanTechnologie</strong>
          </p>
        </div>
      </div>
    )
  },
)

BordereauDocument.displayName = "BordereauDocument"
