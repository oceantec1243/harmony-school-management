"use client"

import { getAppreciation, getDistinction } from "@/lib/calculations"

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
    }>
    grades: Record<string, { score: number; coefficient: number }>
    groupAverages: Record<string, number>
    average: number
    rank: number
    classSize: number
    classAverage: number
  }
  schoolSettings: any
}

export function BulletinDocument({ bulletinData, schoolSettings }: BulletinDocumentProps) {
  const { student, period, subjects, grades, groupAverages, average, rank, classSize, classAverage } = bulletinData
  const classData = student.class

  // Group subjects by group name
  const subjectsByGroup: Record<string, typeof subjects> = {}
  subjects.forEach((s) => {
    if (!subjectsByGroup[s.group_name]) subjectsByGroup[s.group_name] = []
    subjectsByGroup[s.group_name].push(s)
  })

  const distinction = getDistinction(average)
  const formatRank = (r: number) => (r === 1 ? "1er" : `${r}ème`)

  // Calculate totals
  const totalCoef = subjects.reduce((sum, s) => sum + s.coefficient, 0)
  const totalPoints = Object.values(grades).reduce((sum, g) => sum + g.score * g.coefficient, 0)

  return (
    <div
      className="bg-white text-black p-8 rounded-lg relative overflow-hidden print:p-4 print:text-xs"
      id="bulletin-document"
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.02]">
        <div className="text-[180px] font-black text-blue-900 rotate-[-35deg] select-none">HARMONY</div>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-blue-800 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-violet-700 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-violet-700 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-blue-800 rounded-br-3xl" />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-start justify-between border-b-4 border-gradient-to-r from-blue-800 to-violet-700 pb-4">
          {/* Left - School Logo/Name */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-violet-700 flex items-center justify-center shadow-xl border-2 border-white">
              <span className="text-white font-black text-3xl">H</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tight">
                {schoolSettings?.school_name || "HARMONY SCHOOL"}
              </h1>
              <p className="text-sm text-slate-600">{schoolSettings?.address || "Excellence en Éducation"}</p>
              <p className="text-sm text-slate-500">
                {schoolSettings?.phone || ""} {schoolSettings?.email ? `• ${schoolSettings.email}` : ""}
              </p>
            </div>
          </div>

          {/* Center - Title */}
          <div className="text-center flex-1 px-4">
            <div className="inline-block px-8 py-2 bg-gradient-to-r from-blue-800 to-violet-700 rounded-xl shadow-lg">
              <h2 className="text-xl font-black text-white tracking-wider">BULLETIN DE NOTES</h2>
            </div>
            <p className="text-lg font-bold text-blue-900 mt-2">{period?.name}</p>
            <p className="text-sm text-slate-600">Année Académique: {period?.academic_year}</p>
          </div>

          {/* Right - Student Photo */}
          <div className="text-right">
            <div className="w-24 h-28 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-lg">
              {student.photo ? (
                <img src={student.photo || "/placeholder.svg"} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl font-bold text-slate-400">
                  {student.first_name[0]}
                  {student.last_name[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Info Bar */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
            <p className="text-xs font-medium text-blue-600 uppercase">Nom complet</p>
            <p className="text-sm font-bold text-blue-900">
              {student.last_name} {student.first_name}
            </p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-3 border border-violet-200">
            <p className="text-xs font-medium text-violet-600 uppercase">Matricule</p>
            <p className="text-sm font-bold text-violet-900">{student.matricule}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-3 border border-cyan-200">
            <p className="text-xs font-medium text-cyan-600 uppercase">Classe</p>
            <p className="text-sm font-bold text-cyan-900">{classData?.name}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-200">
            <p className="text-xs font-medium text-emerald-600 uppercase">Effectif</p>
            <p className="text-sm font-bold text-emerald-900">{classSize} élèves</p>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="relative z-10 mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-800 to-violet-700 text-white">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold rounded-tl-lg">Matière</th>
              <th className="border border-slate-300 px-3 py-2 text-center font-bold w-16">Coef.</th>
              <th className="border border-slate-300 px-3 py-2 text-center font-bold w-20">Note /20</th>
              <th className="border border-slate-300 px-3 py-2 text-center font-bold w-20">Note × Coef</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold rounded-tr-lg">Appréciation</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(subjectsByGroup).map(([groupName, groupSubjects], groupIndex) => (
              <>
                {/* Group Header */}
                <tr key={`group-${groupIndex}`} className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <td colSpan={5} className="border border-slate-300 px-3 py-2 font-bold text-blue-900">
                    {groupName}
                  </td>
                </tr>

                {/* Group Subjects */}
                {groupSubjects.map((subject, idx) => {
                  const grade = grades[subject.id]
                  const score = grade?.score
                  const weightedScore = score !== undefined ? score * subject.coefficient : null
                  const appreciation = score !== undefined ? getAppreciation(score) : "-"

                  const getBgColor = () => {
                    if (score === undefined) return "bg-slate-50"
                    if (score >= 14) return "bg-emerald-50/50"
                    if (score >= 10) return "bg-blue-50/50"
                    return "bg-red-50/50"
                  }

                  const getScoreColor = () => {
                    if (score === undefined) return "text-slate-400"
                    if (score >= 16) return "text-emerald-600 font-bold"
                    if (score >= 14) return "text-emerald-600"
                    if (score >= 10) return "text-blue-600"
                    if (score >= 8) return "text-amber-600"
                    return "text-red-600 font-bold"
                  }

                  return (
                    <tr key={subject.id} className={`${getBgColor()} hover:bg-slate-100/50 transition-colors`}>
                      <td className="border border-slate-300 px-3 py-2 font-medium">{subject.name}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-700">
                        {subject.coefficient}
                      </td>
                      <td className={`border border-slate-300 px-3 py-2 text-center ${getScoreColor()}`}>
                        {score !== undefined ? score.toFixed(2) : "-"}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-medium text-slate-700">
                        {weightedScore !== null ? weightedScore.toFixed(2) : "-"}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-sm italic text-slate-600">
                        {appreciation}
                      </td>
                    </tr>
                  )
                })}

                {/* Group Average */}
                <tr className="bg-gradient-to-r from-blue-100 to-violet-100 font-semibold">
                  <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right text-blue-900">
                    Moyenne {groupName}:
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center text-blue-900 font-bold">
                    {groupAverages[groupName]?.toFixed(2) || "-"}
                  </td>
                  <td colSpan={2} className="border border-slate-300 px-3 py-2"></td>
                </tr>
              </>
            ))}
          </tbody>

          {/* Footer with Totals */}
          <tfoot>
            <tr className="bg-gradient-to-r from-blue-800 to-violet-700 text-white font-bold">
              <td className="border border-slate-300 px-3 py-3 rounded-bl-lg">TOTAUX</td>
              <td className="border border-slate-300 px-3 py-3 text-center">{totalCoef}</td>
              <td className="border border-slate-300 px-3 py-3 text-center">-</td>
              <td className="border border-slate-300 px-3 py-3 text-center">{totalPoints.toFixed(2)}</td>
              <td className="border border-slate-300 px-3 py-3 rounded-br-lg"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Results Summary */}
      <div className="relative z-10 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Average */}
          <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-4 text-white shadow-xl">
            <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Moyenne Générale</p>
            <p className="text-4xl font-black mt-1">{average.toFixed(2)}</p>
            <p className="text-sm text-blue-200 mt-1">/20</p>
          </div>

          {/* Rank */}
          <div className="bg-gradient-to-br from-violet-700 to-violet-800 rounded-2xl p-4 text-white shadow-xl">
            <p className="text-xs font-medium text-violet-200 uppercase tracking-wide">Rang</p>
            <p className="text-4xl font-black mt-1">{formatRank(rank)}</p>
            <p className="text-sm text-violet-200 mt-1">sur {classSize}</p>
          </div>

          {/* Class Average */}
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-4 text-white shadow-xl">
            <p className="text-xs font-medium text-cyan-200 uppercase tracking-wide">Moy. Classe</p>
            <p className="text-4xl font-black mt-1">{classAverage.toFixed(2)}</p>
            <p className="text-sm text-cyan-200 mt-1">/20</p>
          </div>

          {/* Distinction */}
          <div
            className={`rounded-2xl p-4 text-white shadow-xl ${
              average >= 16
                ? "bg-gradient-to-br from-amber-500 to-amber-600"
                : average >= 14
                  ? "bg-gradient-to-br from-emerald-600 to-emerald-700"
                  : average >= 12
                    ? "bg-gradient-to-br from-blue-600 to-blue-700"
                    : average >= 10
                      ? "bg-gradient-to-br from-slate-600 to-slate-700"
                      : "bg-gradient-to-br from-red-600 to-red-700"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">Mention</p>
            <p className="text-lg font-bold mt-1 leading-tight">{distinction}</p>
          </div>
        </div>
      </div>

      {/* Observations & Decision */}
      <div className="relative z-10 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Observation du Conseil de Classe
          </h3>
          <div className="min-h-[60px] text-sm text-slate-600 italic">
            {average >= 16
              ? "Excellent travail. Continuez ainsi !"
              : average >= 14
                ? "Très bon trimestre. Élève sérieux et appliqué."
                : average >= 12
                  ? "Bon travail. Des efforts supplémentaires permettront d'atteindre l'excellence."
                  : average >= 10
                    ? "Résultats acceptables. Plus de rigueur est nécessaire."
                    : "Résultats insuffisants. Un travail plus soutenu est indispensable."}
          </div>
        </div>

        <div className="border-2 border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-600"></span>
            Décision du Conseil
          </h3>
          <div className="min-h-[60px] text-sm text-slate-600 italic">{distinction}</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="relative z-10 grid grid-cols-3 gap-6 pt-4 border-t-2 border-slate-200">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-12">Le Directeur</p>
          <div className="border-t-2 border-slate-300 pt-2">
            <p className="text-sm font-medium text-slate-700">Signature & Cachet</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-12">Le Professeur Principal</p>
          <div className="border-t-2 border-slate-300 pt-2">
            <p className="text-sm font-medium text-slate-700">Signature</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-12">Le Parent / Tuteur</p>
          <div className="border-t-2 border-slate-300 pt-2">
            <p className="text-sm font-medium text-slate-700">Signature</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 pt-4 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400">Document généré par HARMONY - Système de Gestion Scolaire d'Excellence</p>
        <p className="text-xs text-slate-400 mt-1">
          Généré le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  )
}
