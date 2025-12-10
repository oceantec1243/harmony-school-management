"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StudentAvatar } from "@/components/students/student-avatar"
import { StatusBadge } from "@/components/students/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Download, MoreHorizontal, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { calculateAge, formatShortDate } from "@/lib/calculations"
import { toast } from "sonner"

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: "M" | "F"
  photo: string | null
  status: "Active" | "Suspended" | "Graduated"
  is_ranked: boolean
  class_id: string
  class: {
    id: string
    name: string
    level: { id: string; name: string } | null
    section: { id: string; name: string } | null
  } | null
}

type Section = { id: string; name: string }
type Level = { id: string; name: string; section_id: string }
type Class = { id: string; name: string; level_id: string; section_id: string }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  const [sectionFilter, setSectionFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [classFilter, setClassFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [rankingFilter, setRankingFilter] = useState<string>("all")

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sectionsRes, levelsRes, classesRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("levels").select("*").order("order"),
        supabase.from("classes").select("*").order("name"),
      ])

      setSections(sectionsRes.data || [])
      setLevels(levelsRes.data || [])
      setClasses(classesRes.data || [])

      let query = supabase
        .from("students")
        .select(`
          *,
          class:classes(
            id,
            name,
            level:levels(id, name),
            section:sections(id, name)
          )
        `)
        .order("last_name")

      if (classFilter !== "all") {
        query = query.eq("class_id", classFilter)
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      let filtered = data || []
      if (sectionFilter !== "all") {
        filtered = filtered.filter((s) => s.class?.section?.id === sectionFilter)
      }
      if (levelFilter !== "all") {
        filtered = filtered.filter((s) => s.class?.level?.id === levelFilter)
      }
      if (rankingFilter === "ranked") {
        filtered = filtered.filter((s) => s.is_ranked !== false)
      } else if (rankingFilter === "unranked") {
        filtered = filtered.filter((s) => s.is_ranked === false)
      }

      setStudents(filtered)
    } catch (error) {
      console.error("[v0] Error fetching students:", error)
      toast.error("Erreur lors du chargement des élèves")
    } finally {
      setLoading(false)
    }
  }, [supabase, sectionFilter, levelFilter, classFilter, statusFilter, rankingFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (studentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) return

    try {
      const { error } = await supabase.from("students").delete().eq("id", studentId)
      if (error) throw error
      toast.success("Élève supprimé avec succès")
      fetchData()
    } catch (error) {
      console.error("[v0] Error deleting student:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const filteredLevels = sectionFilter === "all" ? levels : levels.filter((l) => l.section_id === sectionFilter)

  const filteredClasses = classes.filter((c) => {
    if (sectionFilter !== "all" && c.section_id !== sectionFilter) return false
    if (levelFilter !== "all" && c.level_id !== levelFilter) return false
    return true
  })

  const unrankedCount = students.filter((s) => s.is_ranked === false).length

  const columns: Column<Student>[] = [
    {
      key: "photo",
      header: "",
      className: "w-12",
      cell: (student) => (
        <StudentAvatar
          firstName={student.first_name}
          lastName={student.last_name}
          photo={student.photo || undefined}
          size="sm"
        />
      ),
    },
    {
      key: "matricule",
      header: "Matricule",
      sortable: true,
      cell: (student) => (
        <Link href={`/students/${student.id}`} className="font-mono text-sm text-primary hover:underline">
          {student.matricule}
        </Link>
      ),
    },
    {
      key: "last_name",
      header: "Nom & Prénom",
      sortable: true,
      cell: (student) => (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium">
              {student.last_name} {student.first_name}
            </p>
            <p className="text-sm text-muted-foreground">{student.gender === "M" ? "Masculin" : "Féminin"}</p>
          </div>
          {student.is_ranked === false && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
              NC
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "class",
      header: "Classe",
      cell: (student) => (
        <div>
          <p className="font-medium">{student.class?.name || "-"}</p>
          <p className="text-sm text-muted-foreground">{student.class?.section?.name || "-"}</p>
        </div>
      ),
    },
    {
      key: "date_of_birth",
      header: "Date de Naissance",
      cell: (student) => (
        <div>
          <p>{formatShortDate(student.date_of_birth)}</p>
          <p className="text-sm text-muted-foreground">{calculateAge(student.date_of_birth)} ans</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (student) => <StatusBadge status={student.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(student.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Gestion des Élèves" description="Chargement..." />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Gestion des Élèves"
        description={`${students.length} élèves au total${unrankedCount > 0 ? ` (dont ${unrankedCount} NC)` : ""}`}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
        <Button asChild>
          <Link href="/students/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Élève
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={sectionFilter}
          onValueChange={(v) => {
            setSectionFilter(v)
            setLevelFilter("all")
            setClassFilter("all")
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sections</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={levelFilter}
          onValueChange={(v) => {
            setLevelFilter(v)
            setClassFilter("all")
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {filteredLevels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {filteredClasses.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Active">Actif</SelectItem>
            <SelectItem value="Suspended">Suspendu</SelectItem>
            <SelectItem value="Graduated">Diplômé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={rankingFilter} onValueChange={setRankingFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Classement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="ranked">Classés</SelectItem>
            <SelectItem value="unranked">Non Classés (NC)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {unrankedCount > 0 && rankingFilter !== "ranked" && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {unrankedCount} élève{unrankedCount > 1 ? "s" : ""} marqué{unrankedCount > 1 ? "s" : ""} comme "Non Classé"
            (NC). Ces élèves n'influencent pas les statistiques de la classe.
          </span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={students}
        columns={columns}
        searchPlaceholder="Rechercher par nom ou matricule..."
        searchKey={(student) => `${student.first_name} ${student.last_name} ${student.matricule}`}
        pageSize={15}
        emptyMessage="Aucun élève trouvé"
      />
    </AppLayout>
  )
}
