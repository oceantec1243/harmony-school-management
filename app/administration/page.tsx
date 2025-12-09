"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, MoreHorizontal, Pencil, Trash2, Globe, Layers, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type Section = {
  id: string
  name: string
  description: string | null
}

type Level = {
  id: string
  name: string
  section_id: string
  order: number
  section?: Section
}

type AcademicPeriod = {
  id: string
  academic_year: string
  type: "sequence" | "trimester" | "year"
  name: string
  number: number
  start_date: string
  end_date: string
  parent_id: string | null
}

export default function AdministrationPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("sections")

  // Dialog states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [levelDialogOpen, setLevelDialogOpen] = useState(false)
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)

  // Edit states
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null)

  // Form states
  const [sectionForm, setSectionForm] = useState({ name: "", description: "" })
  const [levelForm, setLevelForm] = useState({ name: "", section_id: "", order: 1 })
  const [periodForm, setPeriodForm] = useState({
    academic_year: "2024-2025",
    type: "sequence" as "sequence" | "trimester" | "year",
    name: "",
    number: 1,
    start_date: "",
    end_date: "",
    parent_id: "",
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sectionsRes, levelsRes, periodsRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("levels").select("*, section:sections(*)").order("order"),
        supabase.from("academic_periods").select("*").order("type").order("number"),
      ])

      setSections(sectionsRes.data || [])
      setLevels(levelsRes.data || [])
      setPeriods(periodsRes.data || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Section CRUD
  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectionForm.name) {
      toast.error("Le nom de la section est requis")
      return
    }

    try {
      if (editingSection) {
        const { error } = await supabase
          .from("sections")
          .update({ name: sectionForm.name, description: sectionForm.description || null })
          .eq("id", editingSection.id)
        if (error) throw error
        toast.success("Section modifiée")
      } else {
        const { error } = await supabase
          .from("sections")
          .insert({ name: sectionForm.name, description: sectionForm.description || null })
        if (error) throw error
        toast.success("Section créée")
      }
      setSectionDialogOpen(false)
      setEditingSection(null)
      setSectionForm({ name: "", description: "" })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Supprimer cette section ? Cela affectera tous les niveaux associés.")) return
    try {
      const { error } = await supabase.from("sections").delete().eq("id", id)
      if (error) throw error
      toast.success("Section supprimée")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  // Level CRUD
  const handleLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!levelForm.name || !levelForm.section_id) {
      toast.error("Tous les champs sont requis")
      return
    }

    try {
      if (editingLevel) {
        const { error } = await supabase
          .from("levels")
          .update({
            name: levelForm.name,
            section_id: levelForm.section_id,
            order: levelForm.order,
          })
          .eq("id", editingLevel.id)
        if (error) throw error
        toast.success("Niveau modifié")
      } else {
        const { error } = await supabase.from("levels").insert({
          name: levelForm.name,
          section_id: levelForm.section_id,
          order: levelForm.order,
        })
        if (error) throw error
        toast.success("Niveau créé")
      }
      setLevelDialogOpen(false)
      setEditingLevel(null)
      setLevelForm({ name: "", section_id: "", order: 1 })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  const handleDeleteLevel = async (id: string) => {
    if (!confirm("Supprimer ce niveau ? Cela affectera toutes les classes associées.")) return
    try {
      const { error } = await supabase.from("levels").delete().eq("id", id)
      if (error) throw error
      toast.success("Niveau supprimé")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  // Period CRUD
  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodForm.name || !periodForm.start_date || !periodForm.end_date) {
      toast.error("Tous les champs sont requis")
      return
    }

    try {
      const data = {
        academic_year: periodForm.academic_year,
        type: periodForm.type,
        name: periodForm.name,
        number: periodForm.number,
        start_date: periodForm.start_date,
        end_date: periodForm.end_date,
        parent_id: periodForm.parent_id || null,
      }

      if (editingPeriod) {
        const { error } = await supabase.from("academic_periods").update(data).eq("id", editingPeriod.id)
        if (error) throw error
        toast.success("Période modifiée")
      } else {
        const { error } = await supabase.from("academic_periods").insert(data)
        if (error) throw error
        toast.success("Période créée")
      }
      setPeriodDialogOpen(false)
      setEditingPeriod(null)
      setPeriodForm({
        academic_year: "2024-2025",
        type: "sequence",
        name: "",
        number: 1,
        start_date: "",
        end_date: "",
        parent_id: "",
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur")
    }
  }

  const handleDeletePeriod = async (id: string) => {
    if (!confirm("Supprimer cette période ?")) return
    try {
      const { error } = await supabase.from("academic_periods").delete().eq("id", id)
      if (error) throw error
      toast.success("Période supprimée")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  // Edit handlers
  const openEditSection = (section: Section) => {
    setEditingSection(section)
    setSectionForm({ name: section.name, description: section.description || "" })
    setSectionDialogOpen(true)
  }

  const openEditLevel = (level: Level) => {
    setEditingLevel(level)
    setLevelForm({ name: level.name, section_id: level.section_id, order: level.order })
    setLevelDialogOpen(true)
  }

  const openEditPeriod = (period: AcademicPeriod) => {
    setEditingPeriod(period)
    setPeriodForm({
      academic_year: period.academic_year,
      type: period.type,
      name: period.name,
      number: period.number,
      start_date: period.start_date,
      end_date: period.end_date,
      parent_id: period.parent_id || "",
    })
    setPeriodDialogOpen(true)
  }

  const trimesters = periods.filter((p) => p.type === "trimester")
  const levelsBySection = sections.map((s) => ({
    ...s,
    levels: levels.filter((l) => l.section_id === s.id),
  }))

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Administration" description="Chargement..." />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Administration" description="Gérer les sections, niveaux et périodes académiques" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Niveaux
          </TabsTrigger>
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Périodes
          </TabsTrigger>
        </TabsList>

        {/* SECTIONS TAB */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sections</CardTitle>
                <CardDescription>Francophone et Anglophone - Les deux systèmes éducatifs</CardDescription>
              </div>
              <Dialog
                open={sectionDialogOpen}
                onOpenChange={(open) => {
                  setSectionDialogOpen(open)
                  if (!open) {
                    setEditingSection(null)
                    setSectionForm({ name: "", description: "" })
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSection ? "Modifier la Section" : "Nouvelle Section"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSectionSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="section-name">Nom *</Label>
                      <Input
                        id="section-name"
                        value={sectionForm.name}
                        onChange={(e) => setSectionForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Francophone"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section-desc">Description</Label>
                      <Textarea
                        id="section-desc"
                        value={sectionForm.description}
                        onChange={(e) => setSectionForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Description de la section"
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Annuler
                        </Button>
                      </DialogClose>
                      <Button type="submit">{editingSection ? "Modifier" : "Créer"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune section créée</p>
                  <p className="text-sm">Créez les sections Francophone et Anglophone pour commencer</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {sections.map((section) => (
                    <Card key={section.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Globe className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{section.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {section.description || "Pas de description"}
                              </p>
                              <Badge variant="secondary" className="mt-2">
                                {levels.filter((l) => l.section_id === section.id).length} niveaux
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditSection(section)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEVELS TAB */}
        <TabsContent value="levels" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Niveaux</CardTitle>
                <CardDescription>Les niveaux d'études par section (6ème, 5ème... / Form 1, Form 2...)</CardDescription>
              </div>
              <Dialog
                open={levelDialogOpen}
                onOpenChange={(open) => {
                  setLevelDialogOpen(open)
                  if (!open) {
                    setEditingLevel(null)
                    setLevelForm({ name: "", section_id: "", order: 1 })
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button disabled={sections.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Niveau
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingLevel ? "Modifier le Niveau" : "Nouveau Niveau"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleLevelSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Section *</Label>
                      <Select
                        value={levelForm.section_id}
                        onValueChange={(v) => setLevelForm((prev) => ({ ...prev, section_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level-name">Nom *</Label>
                      <Input
                        id="level-name"
                        value={levelForm.name}
                        onChange={(e) => setLevelForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: 6ème, Form 1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level-order">Ordre</Label>
                      <Input
                        id="level-order"
                        type="number"
                        min={1}
                        value={levelForm.order}
                        onChange={(e) =>
                          setLevelForm((prev) => ({
                            ...prev,
                            order: Number.parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Annuler
                        </Button>
                      </DialogClose>
                      <Button type="submit">{editingLevel ? "Modifier" : "Créer"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Créez d'abord des sections</p>
                </div>
              ) : levelsBySection.every((s) => s.levels.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun niveau créé</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {levelsBySection.map((section) => (
                    <div key={section.id}>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        {section.name}
                      </h3>
                      {section.levels.length === 0 ? (
                        <p className="text-sm text-muted-foreground ml-7">Aucun niveau dans cette section</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ml-7">
                          {section.levels.map((level) => (
                            <Card key={level.id} className="group">
                              <CardContent className="py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-sm font-bold">
                                    {level.order}
                                  </div>
                                  <span className="font-medium">{level.name}</span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditLevel(level)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDeleteLevel(level.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERIODS TAB */}
        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Périodes Académiques</CardTitle>
                <CardDescription>Séquences, trimestres et années académiques</CardDescription>
              </div>
              <Dialog
                open={periodDialogOpen}
                onOpenChange={(open) => {
                  setPeriodDialogOpen(open)
                  if (!open) {
                    setEditingPeriod(null)
                    setPeriodForm({
                      academic_year: "2024-2025",
                      type: "sequence",
                      name: "",
                      number: 1,
                      start_date: "",
                      end_date: "",
                      parent_id: "",
                    })
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Période
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingPeriod ? "Modifier la Période" : "Nouvelle Période"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePeriodSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Année Académique *</Label>
                        <Input
                          value={periodForm.academic_year}
                          onChange={(e) =>
                            setPeriodForm((prev) => ({
                              ...prev,
                              academic_year: e.target.value,
                            }))
                          }
                          placeholder="2024-2025"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type *</Label>
                        <Select
                          value={periodForm.type}
                          onValueChange={(v: "sequence" | "trimester" | "year") =>
                            setPeriodForm((prev) => ({ ...prev, type: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sequence">Séquence</SelectItem>
                            <SelectItem value="trimester">Trimestre</SelectItem>
                            <SelectItem value="year">Année</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="period-name">Nom *</Label>
                        <Input
                          id="period-name"
                          value={periodForm.name}
                          onChange={(e) => setPeriodForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Séquence 1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="period-number">Numéro</Label>
                        <Input
                          id="period-number"
                          type="number"
                          min={1}
                          value={periodForm.number}
                          onChange={(e) =>
                            setPeriodForm((prev) => ({
                              ...prev,
                              number: Number.parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Date Début *</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={periodForm.start_date}
                          onChange={(e) => setPeriodForm((prev) => ({ ...prev, start_date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Date Fin *</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={periodForm.end_date}
                          onChange={(e) => setPeriodForm((prev) => ({ ...prev, end_date: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    {periodForm.type === "sequence" && (
                      <div className="space-y-2">
                        <Label>Trimestre Parent</Label>
                        <Select
                          value={periodForm.parent_id || "no-parent"}
                          onValueChange={(v) =>
                            setPeriodForm((prev) => ({ ...prev, parent_id: v === "no-parent" ? "" : v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un trimestre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-parent">Aucun</SelectItem>
                            {trimesters.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Annuler
                        </Button>
                      </DialogClose>
                      <Button type="submit">{editingPeriod ? "Modifier" : "Créer"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune période académique</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Année</TableHead>
                      <TableHead>Date Début</TableHead>
                      <TableHead>Date Fin</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell>
                          <Badge
                            variant={
                              period.type === "year" ? "default" : period.type === "trimester" ? "secondary" : "outline"
                            }
                          >
                            {period.type === "sequence"
                              ? "Séquence"
                              : period.type === "trimester"
                                ? "Trimestre"
                                : "Année"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{period.name}</TableCell>
                        <TableCell>{period.academic_year}</TableCell>
                        <TableCell>{new Date(period.start_date).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>{new Date(period.end_date).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditPeriod(period)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePeriod(period.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
