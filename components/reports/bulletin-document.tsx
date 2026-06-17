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
  const { student, period, subjects, grades, groupAverages, average, rank, classSize, classAverage, classMin, classMax, promotion, trimesterSummaries } = bulletinData
  const classData = student.class
  const isEnglish = student.class?.section?.name?.toLowerCase().includes("anglophone") || false
  const isAnnual = period?.type === "year" || period?.name?.toLowerCase().includes("annuelle") || period?.name?.toLowerCase().includes("full year")

  // Group subjects by group name
  const subjectsByGroup: Record<string, typeof subjects> = {}
  subjects.forEach((s) => {
    if (!subjectsByGroup[s.group_name]) subjectsByGroup[s.group_name] = []
    subjectsByGroup[s.group_name].push(s)
  })

  const distinction = getDistinction(average)
  const formatRankValue = (r: number | string) => {
    if (r === "NC" || r === "-") return r
    if (typeof r === 'string' && r.includes('/')) return r
    const num = typeof r === "string" ? parseInt(r) : r
    if (isNaN(num)) return r
    if (isEnglish) {
      const j = num % 10, k = num % 100
      if (j === 1 && k !== 11) return num + "st"
      if (j === 2 && k !== 12) return num + "nd"
      if (j === 3 && k !== 13) return num + "rd"
      return num + "th"
    }
    return num === 1 ? "1er" : `${num}ème`
  }

  const t = {
    rep: isEnglish ? "REPUBLIC OF CAMEROON" : "RÉPUBLIQUE DU CAMEROUN",
    motto: isEnglish ? "Peace - Work - Fatherland" : "Paix - Travail - Patrie",
    min: isEnglish ? "MINISTRY OF SECONDARY EDUCATION" : "MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES",
    title: isAnnual 
      ? (isEnglish ? "ANNUAL REPORT CARD" : "BULLETIN DE NOTES ANNUEL")
      : (isEnglish ? "PROGRESS REPORT" : "BULLETIN DE NOTES SÉQUENTIEL"),
    year: isEnglish ? "Academic Year" : "Année Scolaire",
    name: isEnglish ? "Name" : "Nom",
    mat: isEnglish ? "Matricule" : "Matricule",
    born: isEnglish ? "Born on" : "Né(e) le",
    at: isEnglish ? "at" : "à",
    class: isEnglish ? "Class" : "Classe",
    eff: isEnglish ? "Roll" : "Effectif",
    sec: isEnglish ? "Section" : "Section",
    subj: isEnglish ? "Subject" : "Matière",
    coef: isEnglish ? "Coef" : "Coef",
    trim: isEnglish ? "Term" : "Trimestre",
    ann: isEnglish ? "Annual" : "Annuel",
    rank: isEnglish ? "Rank" : "Rang",
    appr: isEnglish ? "Appreciation" : "Appréciation",
    genAvg: isEnglish ? "General Average" : "Moyenne Générale",
    classAvg: isEnglish ? "Class Average" : "Moyenne Classe",
    dec: isEnglish ? "Council Decision" : "Décision du Conseil",
    parent: isEnglish ? "Parent" : "Le Parent",
    principal: isEnglish ? "Principal" : "Le Principal",
    teacher: isEnglish ? "Class Teacher" : "Le Professeur Principal",
    period: isEnglish ? "PERIOD" : "PÉRIODE",
    avg: isEnglish ? "AVERAGE" : "MOYENNE",
    minAvg: isEnglish ? "Class Min" : "Moy. du dernier",
    maxAvg: isEnglish ? "Class Max" : "Moy. du premier",
    council: isEnglish ? "CLASS COUNCIL SUMMARY" : "RÉCAPITULATIF DU CONSEIL DE CLASSE"
  }

  return (
    <div
      className="bg-white text-black p-6 rounded-lg relative overflow-hidden print:p-2 print:text-[9px]"
      id="bulletin-document"
    >
      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        {schoolSettings?.logo_url && <img src={schoolSettings.logo_url} className="w-[300px] h-[300px] object-contain grayscale" alt="" />}
      </div>

      {/* Header (Bilingual Cameroon Style) */}
      <div className="relative z-10 mb-4 border-b border-slate-900 pb-2">
        <div className="flex justify-between text-[9px] font-bold uppercase mb-2">
          <div className="text-center leading-tight">
            <p>République du Cameroun</p>
            <p>Paix - Travail - Patrie</p>
            <p>**********</p>
            <p>Ministère des Enseignements Secondaires</p>
          </div>
          {schoolSettings?.logo_url && <img src={schoolSettings.logo_url} className="h-14 w-14 object-contain" alt="Logo" />}
          <div className="text-center leading-tight">
            <p>Republic of Cameroon</p>
            <p>Peace - Work - Fatherland</p>
            <p>**********</p>
            <p>Ministry of Secondary Education</p>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-lg font-black text-blue-900 leading-none">
            {schoolSettings?.school_name || "HARMONY SCHOOL"}
          </h1>
          <p className="text-[10px] text-slate-600 italic">{schoolSettings?.school_slogan}</p>
          <div className="inline-block mt-1 px-4 py-0.5 bg-slate-900 text-white rounded font-bold uppercase text-sm">
            {t.title}
          </div>
          <p className="mt-1 font-bold text-xs">{t.year}: {period?.academic_year}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
        <div className="space-y-0.5">
          <p><span className="font-bold">{t.name}:</span> {student.last_name} {student.first_name}</p>
          <p><span className="font-bold">{t.mat}:</span> {student.matricule}</p>
          <p><span className="font-bold">{t.born}:</span> {student.date_of_birth} {t.at} {student.place_of_birth || "---"}</p>
        </div>
        <div className="space-y-0.5 text-right md:text-left">
          <p><span className="font-bold">{t.class}:</span> {classData?.name}</p>
          <p><span className="font-bold">{t.eff}:</span> {classSize}</p>
          <p><span className="font-bold">{t.sec}:</span> {student.class?.section?.name || "---"}</p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-slate-400 text-[10px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 p-1 text-left" rowSpan={isAnnual ? 2 : 1}>{t.subj}</th>
              <th className="border border-slate-400 p-1 text-center" rowSpan={isAnnual ? 2 : 1}>{t.coef}</th>
              {isAnnual ? (
                <>
                  <th className="border border-slate-400 p-0.5 text-center" colSpan={3}>{t.trim}s</th>
                  <th className="border border-slate-400 p-1 text-center" rowSpan={2}>{t.ann}</th>
                </>
              ) : (
                <th className="border border-slate-400 p-1 text-center">{isEnglish ? "Mark" : "Note"} /20</th>
              )}
              <th className="border border-slate-400 p-1 text-center" rowSpan={isAnnual ? 2 : 1}>{t.rank}</th>
              <th className="border border-slate-400 p-1 text-left" rowSpan={isAnnual ? 2 : 1}>{t.appr}</th>
            </tr>
            {isAnnual && (
              <tr className="bg-slate-50 text-[8px]">
                <th className="border border-slate-400 p-0.5">T1</th>
                <th className="border border-slate-400 p-0.5">T2</th>
                <th className="border border-slate-400 p-0.5">T3</th>
              </tr>
            )}
          </thead>
          <tbody>
            {Object.entries(subjectsByGroup).map(([groupName, groupSubjects], gIdx) => (
              <React.Fragment key={gIdx}>
                <tr className="bg-slate-100/50">
                  <td colSpan={isAnnual ? 8 : 5} className="border border-slate-400 p-0.5 font-bold text-[9px] uppercase">
                    {groupName}
                  </td>
                </tr>
                {groupSubjects.map((s, sIdx) => {
                  const grade = grades[s.id]
                  const score = isAnnual ? (s.annual === "NC" ? null : s.annual) : grade?.score
                  return (
                    <tr key={sIdx} className="hover:bg-slate-50">
                      <td className="border border-slate-400 p-1 font-medium">
                        {s.name}
                        {s.teacher_name && <span className="text-[8px] text-slate-500 italic ml-1">({s.teacher_name})</span>}
                      </td>
                      <td className="border border-slate-400 p-1 text-center">{s.coefficient}</td>
                      {isAnnual ? (
                        <>
                          <td className="border border-slate-400 p-1 text-center">{typeof s.trimesters?.[0] === 'number' ? s.trimesters[0].toFixed(2) : s.trimesters?.[0] || "-"}</td>
                          <td className="border border-slate-400 p-1 text-center">{typeof s.trimesters?.[1] === 'number' ? s.trimesters[1].toFixed(2) : s.trimesters?.[1] || "-"}</td>
                          <td className="border border-slate-400 p-1 text-center">{typeof s.trimesters?.[2] === 'number' ? s.trimesters[2].toFixed(2) : s.trimesters?.[2] || "-"}</td>
                          <td className="border border-slate-400 p-1 text-center font-bold">{typeof s.annual === 'number' ? s.annual.toFixed(2) : s.annual || "-"}</td>
                        </>
                      ) : (
                        <td className={cn("border border-slate-400 p-1 text-center font-bold", (score ?? 0) < 10 && "text-red-600")}>
                          {score !== undefined && score !== null ? Number(score).toFixed(2) : "-"}
                        </td>
                      )}
                      <td className="border border-slate-400 p-1 text-center">{s.rank || "-"}</td>
                      <td className="border border-slate-400 p-1 text-[9px]">
                        {score !== null && score !== undefined ? getAppreciation(Number(score), isEnglish) : "-"}
                      </td>
                    </tr>
                  )
                })}
                {groupAverages[groupName] !== undefined && (
                  <tr className="bg-slate-50 font-bold italic">
                    <td colSpan={isAnnual ? 5 : 2} className="border border-slate-400 p-0.5 text-right text-[9px]">{isEnglish ? "Group Avg" : "Moyenne Groupe"}:</td>
                    <td className="border border-slate-400 p-0.5 text-center text-[10px] text-blue-800">{groupAverages[groupName].toFixed(2)}</td>
                    <td colSpan={2} className="border border-slate-400 p-0.5"></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Trim Summary + General Stats */}
        <div className="space-y-4">
          {isAnnual && trimesterSummaries && (
            <div>
              <p className="text-[10px] font-bold mb-1 uppercase text-slate-500">{t.council}</p>
              <table className="w-full text-[9px] border-collapse border border-slate-400">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-400 p-1">{t.period}</th>
                    <th className="border border-slate-400 p-1">{t.avg}</th>
                    <th className="border border-slate-400 p-1">{t.rank}</th>
                  </tr>
                </thead>
                <tbody>
                  {trimesterSummaries.map((ts, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-400 p-1 font-bold">{isEnglish ? "TERM" : "TRIMESTRE"} {idx + 1}</td>
                      <td className="border border-slate-400 p-1 text-center">{typeof ts.average === 'number' ? ts.average.toFixed(2) : ts.average}</td>
                      <td className="border border-slate-400 p-1 text-center">{formatRankValue(ts.rank)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-black">
                    <td className="border border-slate-400 p-1 text-blue-900 uppercase">{t.ann}</td>
                    <td className="border border-slate-400 p-1 text-center text-blue-900 text-sm">{average.toFixed(2)}</td>
                    <td className="border border-slate-400 p-1 text-center text-blue-900 text-sm">{formatRankValue(rank)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="border border-slate-400 p-3 rounded space-y-1.5 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-0.5">
              <span className="font-bold">{t.genAvg}:</span>
              <span className="text-base font-black text-blue-900">{average.toFixed(2)}/20</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-0.5">
              <span className="font-bold">{t.rank}:</span>
              <span>{formatRankValue(rank)} {isEnglish ? "out of" : "sur"} {classSize}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.classAvg}:</span>
                <span className="font-bold">{classAverage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.maxAvg}:</span>
                <span className="font-bold">{classMax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.minAvg}:</span>
                <span className="font-bold">{classMin.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Decision and Signatures */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-3 border-l-4 border-slate-900">
            <p className="font-black uppercase text-[10px] text-slate-500 mb-1">{t.dec}:</p>
            <p className="text-sm font-black text-slate-900 leading-tight">
              {isAnnual && promotion ? promotion.decision.toUpperCase() : distinction.toUpperCase()}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[9px] font-bold text-center pt-2">
            <div className="space-y-10">
              <p>{t.parent}</p>
              <div className="border-t border-dotted border-slate-400 pt-1" />
            </div>
            <div className="space-y-10">
              <p>{t.principal}</p>
              <div className="border-t border-dotted border-slate-400 pt-1" />
            </div>
            <div className="space-y-10">
              <p>{t.teacher}</p>
              <div className="border-t border-dotted border-slate-400 pt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Notice */}
      <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[7px] text-slate-400 uppercase tracking-widest">
        {schoolSettings?.school_name} - HARMONY School Management - © OceanTechnologie 2026
      </div>
    </div>
  )
}
