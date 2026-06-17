"use client"

import React from "react"
import { getAppreciation, getDistinction } from "@/lib/calculations"
import { cn } from "@/lib/utils"

interface BulletinDocumentProps {
  bulletinData: {
    student: any
    class: any
    period: any
    subjects: Array<{
      id: string
      name: string
      code: string
      coefficient: number
      group_name: string
      group_order: number
      teacher_name?: string
      trimesters?: (number | "NC")[]
      annual?: number | "NC"
      rank?: string
    }>
    grades: Record<string, { score: number; coefficient: number }>
    groupAverages: Record<string, number>
    average: number
    rank: number | string
    classSize: number
    classAverage: number
    promotion?: {
      promoted: boolean
      nextClass: string | null
      decision: string
    }
  }
  schoolSettings: any
}

export function BulletinDocument({ bulletinData, schoolSettings }: BulletinDocumentProps) {
  const { student, period, subjects, grades, groupAverages, average, rank, classSize, classAverage, promotion } = bulletinData
  const classData = student.class
  const isAnnual = period?.type === "year" || period?.name?.toLowerCase().includes("annuelle")

  // Group subjects by group name
  const subjectsByGroup: Record<string, typeof subjects> = {}
  subjects.forEach((s) => {
    if (!subjectsByGroup[s.group_name]) subjectsByGroup[s.group_name] = []
    subjectsByGroup[s.group_name].push(s)
  })

  const distinction = getDistinction(average)
  const formatRank = (r: number | string) => {
    if (r === "NC") return "NC"
    const num = typeof r === "string" ? parseInt(r) : r
    if (isNaN(num)) return r
    return num === 1 ? "1er" : `${num}ème`
  }

  return (
    <div
      className="bg-white text-black p-8 rounded-lg relative overflow-hidden print:p-4 print:text-[10px]"
      id="bulletin-document"
    >
      {/* Header (Bilingual Cameroon Style) */}
      <div className="relative z-10 mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between text-[10px] font-bold uppercase mb-4">
          <div className="text-center">
            <p>République du Cameroun</p>
            <p>Paix - Travail - Patrie</p>
            <p>**********</p>
            <p>Ministère des Enseignements Secondaires</p>
          </div>
          <div className="text-center">
            <p>Republic of Cameroon</p>
            <p>Peace - Work - Fatherland</p>
            <p>**********</p>
            <p>Ministry of Secondary Education</p>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-black text-blue-900">
            {schoolSettings?.school_name || "HARMONY SCHOOL"}
          </h1>
          <p className="text-xs text-slate-600">{schoolSettings?.school_slogan}</p>
          <div className="inline-block mt-2 px-6 py-1 bg-slate-900 text-white rounded-md font-bold uppercase tracking-widest">
            {isAnnual ? "BULLETIN DE NOTES ANNUEL" : "BULLETIN DE NOTES SÉQUENTIEL"}
          </div>
          <p className="mt-2 font-bold">Année Scolaire: {period?.academic_year}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
        <div className="space-y-1">
          <p><span className="font-bold uppercase">Nom:</span> {student.last_name} {student.first_name}</p>
          <p><span className="font-bold uppercase">Matricule:</span> {student.matricule}</p>
          <p><span className="font-bold uppercase">Né(e) le:</span> {student.date_of_birth} à {student.place_of_birth || "---"}</p>
        </div>
        <div className="space-y-1">
          <p><span className="font-bold uppercase">Classe:</span> {classData?.name}</p>
          <p><span className="font-bold uppercase">Effectif:</span> {classSize}</p>
          <p><span className="font-bold uppercase">Section:</span> {student.class?.section?.name || "---"}</p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 p-2 text-left" rowSpan={isAnnual ? 2 : 1}>Matière</th>
              <th className="border border-slate-400 p-2 text-center" rowSpan={isAnnual ? 2 : 1}>Coef</th>
              {isAnnual ? (
                <>
                  <th className="border border-slate-400 p-1 text-center" colSpan={3}>Trimestres</th>
                  <th className="border border-slate-400 p-2 text-center" rowSpan={2}>Annuel</th>
                </>
              ) : (
                <th className="border border-slate-400 p-2 text-center">Note /20</th>
              )}
              <th className="border border-slate-400 p-2 text-center" rowSpan={isAnnual ? 2 : 1}>Rang</th>
              <th className="border border-slate-400 p-2 text-left" rowSpan={isAnnual ? 2 : 1}>Appréciation</th>
            </tr>
            {isAnnual && (
              <tr className="bg-slate-50 text-[9px]">
                <th className="border border-slate-400 p-1">T1</th>
                <th className="border border-slate-400 p-1">T2</th>
                <th className="border border-slate-400 p-1">T3</th>
              </tr>
            )}
          </thead>
          <tbody>
            {Object.entries(subjectsByGroup).map(([groupName, groupSubjects], gIdx) => (
              <React.Fragment key={gIdx}>
                <tr className="bg-slate-100/50">
                  <td colSpan={isAnnual ? 8 : 5} className="border border-slate-400 p-1 font-bold text-[10px] uppercase">
                    {groupName}
                  </td>
                </tr>
                {groupSubjects.map((s, sIdx) => {
                  const grade = grades[s.id]
                  const score = isAnnual ? (s.annual === "NC" ? null : s.annual) : grade?.score
                  return (
                    <tr key={sIdx} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-2 font-medium">
                        {s.name}
                        {s.teacher_name && <p className="text-[9px] text-slate-500 italic">({s.teacher_name})</p>}
                      </td>
                      <td className="border border-slate-400 p-2 text-center">{s.coefficient}</td>
                      {isAnnual ? (
                        <>
                          <td className="border border-slate-400 p-2 text-center">{typeof s.trimesters?.[0] === 'number' ? s.trimesters[0].toFixed(2) : s.trimesters?.[0] || "-"}</td>
                          <td className="border border-slate-400 p-2 text-center">{typeof s.trimesters?.[1] === 'number' ? s.trimesters[1].toFixed(2) : s.trimesters?.[1] || "-"}</td>
                          <td className="border border-slate-400 p-2 text-center">{typeof s.trimesters?.[2] === 'number' ? s.trimesters[2].toFixed(2) : s.trimesters?.[2] || "-"}</td>
                          <td className="border border-slate-400 p-2 text-center font-bold">{typeof s.annual === 'number' ? s.annual.toFixed(2) : s.annual || "-"}</td>
                        </>
                      ) : (
                        <td className={cn("border border-slate-400 p-2 text-center font-bold", (score ?? 0) < 10 && "text-red-600")}>
                          {score !== undefined && score !== null ? Number(score).toFixed(2) : "-"}
                        </td>
                      )}
                      <td className="border border-slate-400 p-2 text-center">{s.rank || "-"}</td>
                      <td className="border border-slate-400 p-2 text-[10px]">
                        {score !== null && score !== undefined ? getAppreciation(Number(score), false) : "-"}
                      </td>
                    </tr>
                  )
                })}
                {groupAverages[groupName] !== undefined && (
                  <tr className="bg-slate-50 font-bold italic">
                    <td colSpan={isAnnual ? 5 : 2} className="border border-slate-400 p-1 text-right text-[10px]">Moyenne {groupName}:</td>
                    <td className="border border-slate-400 p-1 text-center text-[11px] text-blue-800">{groupAverages[groupName].toFixed(2)}</td>
                    <td colSpan={2} className="border border-slate-400 p-1"></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-4">
          {isAnnual && bulletinData.trimesterSummaries && (
            <div className="border border-slate-400 rounded-lg overflow-hidden">
              <table className="w-full text-[10px] border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-400 p-1">PÉRIODE</th>
                    <th className="border border-slate-400 p-1">MOYENNE</th>
                    <th className="border border-slate-400 p-1">RANG</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletinData.trimesterSummaries.map((ts, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-400 p-1 font-bold">TRIMESTRE {idx + 1}</td>
                      <td className="border border-slate-400 p-1 text-center">{typeof ts.average === 'number' ? ts.average.toFixed(2) : ts.average}</td>
                      <td className="border border-slate-400 p-1 text-center">{ts.rank}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-black">
                    <td className="border border-slate-400 p-1 text-blue-900 uppercase">ANNUEL</td>
                    <td className="border border-slate-400 p-1 text-center text-blue-900 text-sm">{average.toFixed(2)}</td>
                    <td className="border border-slate-400 p-1 text-center text-blue-900 text-sm">{rank}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="border border-slate-400 p-4 rounded-lg space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="font-bold">Moyenne Générale:</span>
              <span className="text-lg font-black text-blue-900">{average.toFixed(2)}/20</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="font-bold">Rang:</span>
              <span>{formatRank(rank)} sur {classSize}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="font-bold">Moyenne Classe:</span>
              <span>{classAverage.toFixed(2)}/20</span>
            </div>
            <div className="pt-2">
              <p className="font-bold uppercase text-xs text-slate-500">Décision du Conseil:</p>
              <p className="text-sm font-bold text-slate-900">
                {isAnnual && promotion ? promotion.decision : distinction}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-4">
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center">
            <div className="space-y-12">
              <p>Le Parent</p>
              <div className="border-t border-slate-400 pt-1" />
            </div>
            <div className="space-y-12">
              <p>Le Principal</p>
              <div className="border-t border-slate-400 pt-1" />
            </div>
            <div className="space-y-12">
              <p>Le Professeur Principal</p>
              <div className="border-t border-slate-400 pt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Notice */}
      <div className="absolute bottom-2 left-0 w-full text-center text-[8px] text-slate-400">
        Bulletin généré par HARMONY School Management - © OceanTechnologie 2026
      </div>
    </div>
  )
}
