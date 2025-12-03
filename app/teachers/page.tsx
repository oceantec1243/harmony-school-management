"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Mail, Phone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getInitials, getColorFromString } from "@/lib/calculations"
import { cn } from "@/lib/utils"

type Teacher = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  specialization: string | null
  status: "active" | "inactive"
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: "",
  })

  const supabase = createClient()

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("teachers").select("*").order("last_name")

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error("[v0] Error fetching teachers:", error)
      toast.error("Erreur lors du chargement des enseignants")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const filteredTeachers = teachers.filter(
    (t) =>
      t.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingTeacher) {
        const { error } = await supabase.from("teachers").update(formData).eq("id", editingTeacher.id)

        if (error) throw error
        toast.success("Enseignant modifié avec succès")
      } else {
        const { error } = await supabase.from("teachers").insert(formData)

        if (error) throw error
        toast.success("Enseignant ajouté avec succès")
      }

      setIsDialogOpen(false)
      setEditingTeacher(null)
      setFormData({ first_name: "", last_name: "", email: "", phone: "", specialization: "" })
      fetchTeachers()
    } catch (error) {
      console.error("[v0] Error saving teacher:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      specialization: teacher.specialization || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (teacherId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet enseignant ?")) return

    try {
      const { error } = await supabase.from("teachers").delete().eq("id", teacherId)

      if (error) throw error
      toast.success("Enseignant supprimé")
      fetchTeachers()
    } catch (error) {
      console.error("[v0] Error deleting teacher:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Gestion des Enseignants" description="Chargement..." />
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
      <PageHeader title="Gestion des Enseignants" description={`${teachers.length} enseignants`}>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingTeacher(null)
              setFormData({ first_name: "", last_name: "", email: "", phone: "", specialization: "" })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Enseignant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Modifier l'enseignant" : "Ajouter un enseignant"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Spécialisation</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                  placeholder="Ex: Mathématiques, Français..."
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </DialogClose>
                <Button type="submit">{editingTeacher ? "Modifier" : "Ajouter"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un enseignant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enseignant</TableHead>
                <TableHead>Spécialisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                          getColorFromString(teacher.first_name + teacher.last_name),
                        )}
                      >
                        {getInitials(teacher.first_name, teacher.last_name)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {teacher.first_name} {teacher.last_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {teacher.specialization ? (
                      <Badge variant="outline">{teacher.specialization}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {teacher.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {teacher.email}
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === "active" ? "default" : "secondary"}>
                      {teacher.status === "active" ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(teacher.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTeachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun enseignant trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
