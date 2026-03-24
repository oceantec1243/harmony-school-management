"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, BookOpen, Layers, Globe } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type Section = { id: string; name: string }
type SubjectGroup = {
  id: string
  name: string
  order: number
  section_id: string | null
  section?: Section
}

type Subject = {
  id: string
  name: string
  code: string
  subject_group_id: string
  description: string | null
  subject_group?: SubjectGroup
}

export default function SubjectsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSection, setSelectedSection] = useState<string>("")

  // Subject dialogs
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    subject_group_id: "",
    description: "",
  })

  // Group dialogs
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: "",
    order: 1,
    section_id: "",
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sectionsRes, groupsRes, subjectsRes] = await Promise.all([
        supabase.from("sections").select("*").order("name"),
        supabase.from("subject_groups").select("*, section:sections(*)").order("section_id").order("order"),
        supabase.from("subjects").select(`*, subject_group:subject_groups(*, section:sections(*))`).order("name"),
      ])

      setSections(sectionsRes.data || [])
      setSubjectGroups(groupsRes.data || [])
      setSubjects(subjectsRes.data || [])

      // Set default section if available
      if (sectionsRes.data && sectionsRes.data.length > 0 && !selectedSection) {
        setSelectedSection(sectionsRes.data[0].id)
      }
    } catch (error) {
      console.error("[v0] Error fetching subjects:", error)
      toast.error("Erreur lors du chargement des matières")
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedSection])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter by section and search
  const filteredGroups = subjectGroups.filter((g) => {
    if (selectedSection && g.section_id !== selectedSection) return false
    return true
  })

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())

    const group = subjectGroups.find((g) => g.id === s.subject_group_id)
    const matchesSection = !selectedSection || group?.section_id === selectedSection

    return matchesSearch && matchesSection
  })

  const subjectsByGroup = filteredGroups.map((group) => ({
    ...group,
    subjects: filteredSubjects.filter((s) => s.subject_group_id === group.id),
  }))

  // Subject CRUD
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subjectForm.name || !subjectForm.code || !subjectForm.subject_group_id) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      console.log("[v0] Submitting subject form:", subjectForm)
      
      if (editingSubject) {
        const { error } = await supabase
          .from("subjects")
          .update({
            name: subjectForm.name,
            code: subjectForm.code,
            subject_group_id: subjectForm.subject_group_id,
            description: subjectForm.description || null,
          })
          .eq("id", editingSubject.id)

        if (error) {
          console.error("[v0] Update error:", error)
          throw error
        }
        toast.success("Matière modifiée avec succès")
      } else {
        const { data, error } = await supabase.from("subjects").insert({
          name: subjectForm.name,
          code: subjectForm.code,
          subject_group_id: subjectForm.subject_group_id,
          description: subjectForm.description || null,
        }).select()

        console.log("[v0] Insert result:", { data, error })
        
        if (error) throw error
        toast.success("Matière créée avec succès")
      }

      setIsSubjectDialogOpen(false)
      setEditingSubject(null)
      setSubjectForm({ name: "", code: "", subject_group_id: "", description: "" })
      fetchData()
    } catch (error: any) {
      console.error("[v0] Error saving subject:", error)
      toast.error(error.message || "Erreur lors de l'enregistrement")
    }
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      subject_group_id: subject.subject_group_id,
      description: subject.description || "",
    })
    setIsSubjectDialogOpen(true)
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette matière ?")) return

    try {
      const { error } = await supabase.from("subjects").delete().eq("id", subjectId)
      if (error) throw error
      toast.success("Matière supprimée")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  // Group CRUD
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!groupForm.name || !groupForm.section_id) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from("subject_groups")
          .update({
            name: groupForm.name,
            order: groupForm.order,
            section_id: groupForm.section_id,
          })
          .eq("id", editingGroup.id)

        if (error) throw error
        toast.success("Groupe modifié avec succès")
      } else {
        const { error } = await supabase.from("subject_groups").insert({
          name: groupForm.name,
          order: groupForm.order,
          section_id: groupForm.section_id,
        })

        if (error) throw error
        toast.success("Groupe créé avec succès")
      }

      setIsGroupDialogOpen(false)
      setEditingGroup(null)
      setGroupForm({ name: "", order: 1, section_id: "" })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement")
    }
  }

  const handleEditGroup = (group: SubjectGroup) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      order: group.order,
      section_id: group.section_id || "",
    })
    setIsGroupDialogOpen(true)
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Supprimer ce groupe ? Toutes les matières associées seront affectées.")) return

    try {
      const { error } = await supabase.from("subject_groups").delete().eq("id", groupId)
      if (error) throw error
      toast.success("Groupe supprimé")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Gestion des Matières" description="Chargement..." />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Gestion des Matières"
        description={`${subjects.length} matières réparties en ${subjectGroups.length} groupes`}
      >
        <div className="flex gap-2">
          {/* Group Dialog */}
          <Dialog
            open={isGroupDialogOpen}
            onOpenChange={(open) => {
              setIsGroupDialogOpen(open)
              if (!open) {
                setEditingGroup(null)
                setGroupForm({ name: "", order: 1, section_id: "" })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" disabled={sections.length === 0}>
                <Layers className="h-4 w-4 mr-2" />
                Nouveau Groupe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGroup ? "Modifier le groupe" : "Nouveau groupe de matières"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGroupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Section *</Label>
                  <Select
                    value={groupForm.section_id}
                    onValueChange={(v) => setGroupForm((prev) => ({ ...prev, section_id: v }))}
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
                  <Label htmlFor="group-name">Nom du groupe *</Label>
                  <Input
                    id="group-name"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Groupe I - Lettres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-order">Ordre d'affichage</Label>
                  <Input
                    id="group-order"
                    type="number"
                    min={1}
                    value={groupForm.order}
                    onChange={(e) => setGroupForm((prev) => ({ ...prev, order: Number.parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                  </DialogClose>
                  <Button type="submit">{editingGroup ? "Modifier" : "Créer"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Subject Dialog */}
          <Dialog
            open={isSubjectDialogOpen}
            onOpenChange={(open) => {
              setIsSubjectDialogOpen(open)
              if (!open) {
                setEditingSubject(null)
                setSubjectForm({ name: "", code: "", subject_group_id: "", description: "" })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={subjectGroups.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Matière
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubject ? "Modifier la matière" : "Ajouter une matière"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubjectSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="Ex: MATH, FR"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Groupe de Matières *</Label>
                  <Select
                    value={subjectForm.subject_group_id}
                    onValueChange={(v) => setSubjectForm((prev) => ({ ...prev, subject_group_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} {group.section?.name ? `(${group.section.name})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                  </DialogClose>
                  <Button type="submit">{editingSubject ? "Modifier" : "Ajouter"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Aucune section configurée</h3>
            <p className="text-muted-foreground mb-4">
              Vous devez d'abord créer des sections (Francophone/Anglophone) dans l'Administration
            </p>
            <Button asChild>
              <a href="/administration">Aller à l'Administration</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Section Tabs and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Tabs value={selectedSection} onValueChange={setSelectedSection} className="flex-1">
              <TabsList>
                {sections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {section.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une matière..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Subject Groups Accordion */}
          <Card>
            <CardContent className="pt-6">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucun groupe de matières pour cette section</p>
                  <p className="text-sm mt-2">Créez un groupe de matières pour commencer</p>
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={filteredGroups.map((g) => g.id)} className="space-y-4">
                  {subjectsByGroup.map((group) => (
                    <AccordionItem key={group.id} value={group.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold">{group.name}</h3>
                              <p className="text-sm text-muted-foreground">{group.subjects.length} matières</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier le groupe
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer le groupe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {group.subjects.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-12"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.subjects.map((subject) => (
                                <TableRow key={subject.id}>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono">
                                      {subject.code}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">{subject.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{subject.description || "-"}</TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditSubject(subject)}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Modifier
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => handleDeleteSubject(subject.id)}
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
                        ) : (
                          <p className="text-center py-4 text-muted-foreground">Aucune matière dans ce groupe</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  )
}
