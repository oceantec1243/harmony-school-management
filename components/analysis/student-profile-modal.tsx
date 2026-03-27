"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import {
  User,
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  BookOpen,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: {
    student: {
      id: string
      first_name: string
      last_name: string
      matricule: string
      gender: string
      class?: {
        name: string
        level?: { name: string }
        section?: { name: string }
      }
    }
    average: number
    rank: number
    grades: Record<string, number>
    groupAverages: Record<string, number>
    evolution?: number
    previousAverage?: number
    attendanceHours?: number
    isAtRisk: boolean
    isExcellent: boolean
    weakSubjects: string[]
    strongSubjects: string[]
  } | null
  totalStudents: number
}

const COLORS = {
  excellent: "#8B5CF6",
  good: "#22C55E",
  average: "#EAB308",
  weak: "#F97316",
  danger: "#DC2626",
}

export function StudentProfileModal({
  open,
  onOpenChange,
  student,
  totalStudents,
}: StudentProfileModalProps) {
  if (!student) return null

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return COLORS.excellent
    if (grade >= 14) return COLORS.good
    if (grade >= 10) return COLORS.average
    if (grade >= 8) return COLORS.weak
    return COLORS.danger
  }

  const getMention = (avg: number) => {
    if (avg >= 16) return { label: "Excellent", color: "bg-violet-500" }
    if (avg >= 14) return { label: "Très Bien", color: "bg-blue-500" }
    if (avg >= 12) return { label: "Bien", color: "bg-emerald-500" }
    if (avg >= 10) return { label: "Assez Bien", color: "bg-lime-500" }
    return { label: "Insuffisant", color: "bg-red-500" }
  }

  const mention = getMention(student.average)

  // Prepare data for charts
  const gradesData = Object.entries(student.grades)
    .map(([subject, score]) => ({
      subject: subject.length > 12 ? subject.substring(0, 12) + "..." : subject,
      fullName: subject,
      score,
    }))
    .sort((a, b) => b.score - a.score)

  const groupData = Object.entries(student.groupAverages).map(([group, avg]) => ({
    group,
    average: avg,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {student.student.last_name} {student.student.first_name}
              </h2>
              <p className="text-sm text-muted-foreground font-normal">
                {student.student.matricule} | {student.student.class?.name}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold text-primary">{student.average.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Moyenne Générale</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <GraduationCap className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                    <p className="text-3xl font-bold text-amber-600">
                      {student.rank}<span className="text-lg">/{totalStudents}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Rang</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Badge className={cn("mb-2", mention.color)}>{mention.label}</Badge>
                    <p className="text-2xl font-bold text-emerald-600">
                      {Object.values(student.grades).filter((g) => g >= 10).length}/
                      {Object.values(student.grades).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Matières réussies</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "bg-gradient-to-br",
                  student.evolution && student.evolution > 0
                    ? "from-emerald-500/10 to-emerald-500/5"
                    : student.evolution && student.evolution < 0
                      ? "from-red-500/10 to-red-500/5"
                      : "from-gray-500/10 to-gray-500/5"
                )}
              >
                <CardContent className="pt-4">
                  <div className="text-center">
                    {student.evolution && student.evolution > 0 ? (
                      <TrendingUp className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                    ) : student.evolution && student.evolution < 0 ? (
                      <TrendingDown className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    ) : (
                      <Star className="h-8 w-8 mx-auto text-gray-500 mb-2" />
                    )}
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        student.evolution && student.evolution > 0
                          ? "text-emerald-600"
                          : student.evolution && student.evolution < 0
                            ? "text-red-600"
                            : "text-gray-500"
                      )}
                    >
                      {student.evolution ? `${student.evolution > 0 ? "+" : ""}${student.evolution.toFixed(1)}%` : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Évolution</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {(student.isAtRisk || student.weakSubjects.length > 0) && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-amber-700 text-base">
                    <AlertTriangle className="h-5 w-5" />
                    Points d'attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {student.isAtRisk && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Élève en danger critique (moyenne &lt; 8)</span>
                      </div>
                    )}
                    {student.weakSubjects.length > 0 && (
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 mt-0.5 text-amber-600" />
                        <div>
                          <span className="text-sm text-amber-700">Matières à améliorer: </span>
                          <span className="text-sm font-medium">{student.weakSubjects.join(", ")}</span>
                        </div>
                      </div>
                    )}
                    {student.attendanceHours && student.attendanceHours > 0 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{student.attendanceHours}h d'absences</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strong subjects */}
            {student.strongSubjects.length > 0 && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-emerald-700 text-base">
                    <Star className="h-5 w-5" />
                    Points forts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {student.strongSubjects.map((subject) => (
                      <Badge key={subject} className="bg-emerald-500">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Performance Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes par Matière</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" domain={[0, 20]} className="text-xs" />
                        <YAxis type="category" dataKey="subject" width={100} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string, props: any) => [
                            `${value}/20`,
                            props.payload.fullName,
                          ]}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {gradesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getGradeColor(entry.score)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Group Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profil par Groupe de Matières</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={groupData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="group" className="text-xs" />
                        <PolarRadiusAxis domain={[0, 20]} />
                        <Radar
                          name="Moyenne"
                          dataKey="average"
                          stroke="#1E40AF"
                          fill="#1E40AF"
                          fillOpacity={0.5}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Grades Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Détail des Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(student.grades)
                    .sort(([, a], [, b]) => b - a)
                    .map(([subject, score]) => (
                      <div key={subject} className="flex items-center gap-3">
                        <div className="w-32 text-sm font-medium truncate" title={subject}>
                          {subject}
                        </div>
                        <div className="flex-1">
                          <Progress
                            value={(score / 20) * 100}
                            className={cn(
                              "h-3",
                              score >= 16
                                ? "[&>div]:bg-violet-500"
                                : score >= 14
                                  ? "[&>div]:bg-emerald-500"
                                  : score >= 10
                                    ? "[&>div]:bg-amber-500"
                                    : "[&>div]:bg-red-500"
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            "w-16 text-right font-mono text-sm font-bold",
                            score >= 16
                              ? "text-violet-600"
                              : score >= 14
                                ? "text-emerald-600"
                                : score >= 10
                                  ? "text-amber-600"
                                  : "text-red-600"
                          )}
                        >
                          {score.toFixed(1)}/20
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
