"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Users, BookOpen, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ClassData = {
  id: string
  name: string
  level_id: string
  section_id: string
  capacity: number
  class_teacher: string | null
  level: { id: string; name: string; order: number } | null
  section: { id: string; name: string } | null
  student_count?: number
  subject_count?: number
}

type Section = { id: string; name: string }

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionFilter, setSectionFilter] = useState<string>("all")

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch sections
      const { data: sectionsData } = await supabase.from("sections").select("*").order("name")

      setSections(sectionsData || [])

      // Fetch classes with level and section
      let query = supabase
        .from("classes")
        .select(`
          *,
          level:levels(id, name, order),
          section:sections(id, name)
        `)
        .order("name")

      if (sectionFilter !== "all") {
        query = query.eq("section_id", sectionFilter)
      }

      const { data: classesData, error } = await query

      if (error) throw error

      // Fetch student counts for each class
      const classesWithCounts = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { count: studentCount } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id)
            .eq("status", "Active")

          const { count: subjectCount } = await supabase
            .from("class_subjects")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id)

          return {
            ...cls,
            student_count: studentCount || 0,
            subject_count: subjectCount || 0,
          }
        }),
      )

      setClasses(classesWithCounts)
    } catch (error) {
      console.error("[v0] Error fetching classes:", error)
      toast.error("Erreur lors du chargement des classes")
    } finally {
      setLoading(false)
    }
  }, [supabase, sectionFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Group classes by level
  const classesByLevel = classes.reduce(
    (acc, cls) => {
      const levelName = cls.level?.name || "Sans niveau"
      const levelOrder = cls.level?.order || 999
      if (!acc[levelName]) {
        acc[levelName] = { classes: [], order: levelOrder }
      }
      acc[levelName].classes.push(cls)
      return acc
    },
    {} as Record<string, { classes: ClassData[]; order: number }>,
  )

  // Sort by level order
  const sortedLevels = Object.entries(classesByLevel).sort(([, a], [, b]) => a.order - b.order)

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Gestion des Classes" description="Chargement..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Gestion des Classes" description={`${classes.length} classes actives`}>
        <Button asChild>
          <Link href="/classes/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Classe
          </Link>
        </Button>
      </PageHeader>

      {/* Section Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={setSectionFilter}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Classes Grid by Level */}
      <div className="space-y-8">
        {sortedLevels.map(([levelName, { classes: levelClasses }]) => (
          <div key={levelName}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="outline" className="text-base px-3 py-1">
                {levelName}
              </Badge>
              <span className="text-muted-foreground text-sm font-normal">({levelClasses.length} classes)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {levelClasses.map((cls, index) => {
                const fillRate = ((cls.student_count || 0) / cls.capacity) * 100

                return (
                  <Link key={cls.id} href={`/classes/${cls.id}`}>
                    <Card
                      className={cn(
                        "hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer",
                        "animate-slide-up",
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <Badge
                            variant="secondary"
                            className={cn(
                              cls.section?.name === "Francophone"
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary/10 text-secondary",
                            )}
                          >
                            {cls.section?.name === "Francophone" ? "FR" : "EN"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {cls.student_count} / {cls.capacity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{cls.subject_count} matières</span>
                          </div>
                        </div>

                        {/* Fill Rate */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Remplissage</span>
                            <span className="font-medium">{Math.round(fillRate)}%</span>
                          </div>
                          <Progress value={fillRate} className="h-2" />
                        </div>

                        {/* Teacher */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="truncate">{cls.class_teacher || "Non assigné"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {sortedLevels.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucune classe trouvée</p>
            <p className="text-sm">Créez votre première classe pour commencer</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
