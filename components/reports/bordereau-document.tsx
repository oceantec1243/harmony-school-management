"use client"

import { forwardRef } from "react"
import { Badge } from "@/components/ui/badge"
import { formatRank, getAppreciationColor, formatDate } from "@/lib/calculations"
import { cn } from "@/lib/utils"

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

export const BordereauDocument = forwardRef<HTMLDivElement, BordereauDocumentProps>(
  ({ reportData, schoolSettings, subjectsByGroup }, ref) => {
    const passingStudents = reportData.students.filter((s) => s.average >= 10).length
    const passRate = Math.round((passingStudents / reportData.students.length) * 100)

    return (
      <div
        ref={ref}
        className="bg-white text-black p-6 rounded-2xl shadow-2xl relative overflow-hidden print:shadow-none print:rounded-none"
        id="bordereau-document"
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-40 h-40 border-l-[6px] border-t-[6px] border-blue-800 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-40 h-40 border-r-[6px] border-t-[6px] border-violet-700 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 border-l-[6px] border-b-[6px] border-violet-700 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 border-r-[6px] border-b-[6px] border-blue-800 rounded-br-3xl" />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
            <div className="text-[200px] font-black text-blue-900 rotate-[-35deg] select-none">HARMONY</div>
          </div>
        </div>

        {/* Header */}
        <div className="relative z-10 mb-8">
          <div className="flex items-start justify-between pb-6 border-b-4 border-gradient-to-r from-blue-800 to-violet-700">
            {/* Left - Logo & School Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-violet-700 flex items-center justify-center shadow-xl border-2 border-white">
                {schoolSettings?.logo_url ? (
                  <img
                    src={schoolSettings.logo_url || "/placeholder.svg"}
                    alt="Logo"
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <span className="text-white font-black text-3xl">H</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-blue-900 tracking-tight">
                  {schoolSettings?.school_name || "HARMONY SCHOOL"}
                </h1>
                <p className="text-sm text-slate-600 italic">
                  {schoolSettings?.school_slogan || "L'harmonie entre technologie et éducation"}
                </p>
                {schoolSettings?.address && <p className="text-xs text-slate-500 mt-1">{schoolSettings.address}</p>}
              </div>
            </div>

            {/* Right - Academic Year Badge */}
            <div className="text-right">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-800 to-violet-700 rounded-xl shadow-lg">
                <span className="text-white font-bold text-lg">{reportData.period.academic_year}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mt-6 text-center">
            <div className="inline-block px-12 py-4 bg-gradient-to-r from-blue-800 via-blue-700 to-violet-700 rounded-2xl shadow-xl">
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">BORDEREAU DE NOTES</h2>
            </div>
          </div>

          {/* Info Grid */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200 shadow-sm">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Classe</p>
              <p className="text-xl font-bold text-blue-900">{reportData.class.name}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 text-center border border-violet-200 shadow-sm">
              <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">Niveau</p>
              <p className="text-lg font-bold text-violet-900">{reportData.class.level?.name || "-"}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 text-center border border-cyan-200 shadow-sm">
              <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide">Section</p>
              <p className="text-lg font-bold text-cyan-900">{reportData.class.section?.name || "-"}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center border border-emerald-200 shadow-sm">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Période</p>
              <p className="text-lg font-bold text-emerald-900">{reportData.period.name}</p>
            </div>
          </div>

          {/* Sub Info */}
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>
              Effectif: <strong className="text-slate-900">{reportData.students.length} élèves</strong>
            </span>
            <span>
              Prof. Principal:{" "}
              <strong className="text-slate-900">{reportData.class.class_teacher || "Non assigné"}</strong>
            </span>
            <span>
              Généré le: <strong className="text-slate-900">{formatDate(new Date())}</strong>
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="relative z-10 overflow-x-auto mb-6">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-blue-800 to-violet-700 text-white">
                <th className="border border-slate-300 px-2 py-3 text-center font-bold w-12 sticky left-0 bg-blue-800">
                  Rg
                </th>
                <th className="border border-slate-300 px-2 py-3 text-center font-bold w-10">N°</th>
                <th className="border border-slate-300 px-2 py-3 text-left font-bold min-w-[140px]">Nom & Prénom</th>
                <th className="border border-slate-300 px-2 py-3 text-left font-bold w-24">Matricule</th>
                {Object.entries(subjectsByGroup).map(([groupName, groupSubjects]) =>
                  groupSubjects.map((s) => (
                    <th
                      key={s.id}
                      className="border border-slate-300 px-1 py-3 text-center font-bold w-12 print:text-[9px]"
                      title={s.name}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[10px]">{s.code}</span>
                        <span className="text-[8px] opacity-80">({s.coefficient})</span>
                      </div>
                    </th>
                  )),
                )}
                <th className="border border-slate-300 px-2 py-3 text-center font-bold w-14 bg-blue-900">Moy</th>
                <th className="border border-slate-300 px-2 py-3 text-center font-bold w-12 bg-blue-900">Rg</th>
              </tr>
            </thead>
            <tbody>
              {reportData.students.map((row, index) => (
                <tr
                  key={row.student.id}
                  className={cn(
                    "hover:bg-blue-50/50 transition-colors",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50",
                    row.rank <= 3 && "bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent",
                  )}
                >
                  <td className="border border-slate-200 px-2 py-2 text-center font-bold sticky left-0 bg-inherit">
                    {row.rank <= 3 ? (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold",
                          row.rank === 1 && "bg-amber-400 text-amber-900",
                          row.rank === 2 && "bg-slate-300 text-slate-800",
                          row.rank === 3 && "bg-orange-300 text-orange-900",
                        )}
                      >
                        {formatRank(row.rank)}
                      </span>
                    ) : (
                      <span className="text-slate-500">{formatRank(row.rank)}</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-center text-slate-500">{index + 1}</td>
                  <td className="border border-slate-200 px-2 py-2 font-medium">
                    <span className="uppercase">{row.student.last_name}</span>{" "}
                    <span className="text-slate-600">{row.student.first_name}</span>
                  </td>
                  <td className="border border-slate-200 px-2 py-2 font-mono text-slate-500 text-[10px]">
                    {row.student.matricule}
                  </td>
                  {Object.entries(subjectsByGroup).map(([groupName, groupSubjects]) =>
                    groupSubjects.map((s) => (
                      <td key={s.id} className="border border-slate-200 px-1 py-2 text-center">
                        {row.grades[s.subject_id] !== undefined ? (
                          <span className={cn("font-medium", getAppreciationColor(row.grades[s.subject_id]))}>
                            {row.grades[s.subject_id].toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    )),
                  )}
                  <td
                    className={cn(
                      "border border-slate-200 px-2 py-2 text-center font-bold bg-slate-50",
                      getAppreciationColor(row.average),
                    )}
                  >
                    {row.average.toFixed(2)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-center font-bold bg-slate-50">
                    {formatRank(row.rank)}
                  </td>
                </tr>
              ))}

              {/* Averages Row */}
              <tr className="bg-gradient-to-r from-blue-100 to-violet-100 font-bold">
                <td colSpan={4} className="border border-slate-300 px-3 py-3 text-right text-blue-900">
                  MOYENNES:
                </td>
                {Object.entries(subjectsByGroup).map(([groupName, groupSubjects]) =>
                  groupSubjects.map((s) => (
                    <td key={s.id} className="border border-slate-300 px-1 py-3 text-center">
                      {reportData.subjectAverages[s.subject_id] !== undefined ? (
                        <span className={getAppreciationColor(reportData.subjectAverages[s.subject_id])}>
                          {reportData.subjectAverages[s.subject_id].toFixed(2)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  )),
                )}
                <td className="border border-slate-300 px-2 py-3 text-center bg-blue-200">
                  <span className={cn("text-lg", getAppreciationColor(reportData.classAverage))}>
                    {reportData.classAverage.toFixed(2)}
                  </span>
                </td>
                <td className="border border-slate-300 bg-blue-200"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="relative z-10 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 mb-6">
          <h4 className="font-bold text-slate-700 mb-3 text-sm">Légende des coefficients:</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            {Object.entries(subjectsByGroup).map(([groupName, groupSubjects]) => (
              <div key={groupName} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-white">
                  {groupName}
                </Badge>
                <span className="text-slate-600">
                  {groupSubjects.map((s) => `${s.code}(${s.coefficient})`).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics & Footer */}
        <div className="relative z-10 pt-6 border-t-4 border-blue-800">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <p className="font-bold text-blue-900 text-lg">Statistiques</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-slate-600">Moyenne de classe:</p>
                  <p className={cn("text-2xl font-bold", getAppreciationColor(reportData.classAverage))}>
                    {reportData.classAverage.toFixed(2)}/20
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-slate-600">Taux de réussite:</p>
                  <p className="text-2xl font-bold text-emerald-600">{passRate}%</p>
                  <p className="text-xs text-slate-500">
                    ({passingStudents}/{reportData.students.length} élèves)
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-500 mb-12">Le Chef d'Établissement</p>
              <div className="border-t-2 border-slate-300 pt-2 w-48">
                <p className="text-sm font-medium text-slate-700">Signature et Cachet</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-700">{schoolSettings?.school_name || "HARMONY"}</p>
              <p>Système de Gestion Scolaire</p>
              <p>{formatDate(new Date())}</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

BordereauDocument.displayName = "BordereauDocument"
