"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, School, Calendar, Bell, Palette, FileText, Loader2, Plus, Trash2, GraduationCap } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type SchoolSettings = {
  id?: string
  school_name: string
  school_slogan: string
  school_code: string
  logo_url: string
  watermark_url: string
  address: string
  phone: string
  email: string
  website: string
  current_academic_year: string
  grading_scale: number
  use_weighted_average: boolean
  round_averages: boolean
  handle_ties: boolean
}

type AcademicPeriod = {
  id: string
  name: string
  type: "sequence" | "trimester" | "year"
  number: number
  academic_year: string
  start_date: string | null
  end_date: string | null
  parent_id: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SchoolSettings>({
    school_name: "HARMONY School",
    school_slogan: "L'harmonie entre technologie et éducation",
    school_code: "",
    logo_url: "",
    watermark_url: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    current_academic_year: "2024-2025",
    grading_scale: 20,
    use_weighted_average: true,
    round_averages: true,
    handle_ties: true,
  })
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<string[]>(["2024-2025", "2023-2024"])

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [settingsRes, periodsRes, classesRes] = await Promise.all([
          supabase.from("school_settings").select("*").maybeSingle(),
          supabase.from("academic_periods").select("*").order("academic_year", { ascending: false }).order("number"),
          supabase.from("classes").select("*, section:sections(name), level:levels(name)").order("name"),
        ])

        if (settingsRes.data) {
          setSettings(settingsRes.data)
        } else {
          setSettings({
            school_name: "HARMONY School",
            school_slogan: "L'harmonie entre technologie et éducation",
            current_academic_year: "2024-2025",
            grading_scale: 20,
            address: "",
            phone: "",
            email: "",
            website: "",
            logo_url: "",
            watermark_url: "",
          })
        }
        if (periodsRes.data) {
          setPeriods(periodsRes.data)
          const years = [...new Set(periodsRes.data.map((p) => p.academic_year))]
          if (years.length > 0) setAcademicYears(years)
        }
        if (classesRes.data) {
          setClasses(classesRes.data)
        }
      } catch (error) {
        console.error("[v0] Error fetching settings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  const handleSaveGeneral = async () => {
    setSaving(true)
    try {
      if (settings.id) {
        await supabase.from("school_settings").update(settings).eq("id", settings.id)
      } else {
        const { data } = await supabase.from("school_settings").insert(settings).select().single()
        if (data) setSettings(data)
      }
      toast.success("Paramètres enregistrés avec succès")
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateClassCriteria = async (
    classId: string, 
    minAvg: number, 
    unrankedThreshold: number,
    rattrapageAvg: number,
    honorRollAvg: number,
    repetitionAvg: number,
    nextClassId: string | null
  ) => {
    try {
      const { error } = await supabase
        .from("classes")
        .update({
          min_promotion_average: minAvg,
          unranked_coef_threshold: unrankedThreshold,
          min_rattrapage_average: rattrapageAvg,
          min_honor_roll_average: honorRollAvg,
          min_repetition_average: repetitionAvg,
          next_class_id: nextClassId === "none" ? null : nextClassId
        })
        .eq("id", classId)

      if (error) throw error
      
      setClasses(classes.map(c => 
        c.id === classId 
          ? { 
              ...c, 
              min_promotion_average: minAvg, 
              unranked_coef_threshold: unrankedThreshold,
              min_rattrapage_average: rattrapageAvg,
              min_honor_roll_average: honorRollAvg,
              min_repetition_average: repetitionAvg,
              next_class_id: nextClassId === "none" ? null : nextClassId
            } 
          : c
      ))
      toast.success("Critères mis à jour")
    } catch (error) {
      console.error("[v0] Error updating class criteria:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleCreatePeriod = async (type: "sequence" | "trimester", parentId?: string) => {
    try {
      const existingOfType = periods.filter(
        (p) => p.type === type && p.academic_year === settings.current_academic_year,
      )
      const newNumber = existingOfType.length + 1
      const name = type === "sequence" ? `Séquence ${newNumber}` : `Trimestre ${newNumber}`

      const { data, error } = await supabase
        .from("academic_periods")
        .insert({
          name,
          type,
          number: newNumber,
          academic_year: settings.current_academic_year,
          parent_id: parentId || null,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setPeriods([...periods, data])
        toast.success(`${name} créé avec succès`)
      }
    } catch (error) {
      console.error("[v0] Error creating period:", error)
      toast.error("Erreur lors de la création de la période")
    }
  }

  const handleDeletePeriod = async (periodId: string) => {
    try {
      await supabase.from("academic_periods").delete().eq("id", periodId)
      setPeriods(periods.filter((p) => p.id !== periodId))
      toast.success("Période supprimée")
    } catch (error) {
      console.error("[v0] Error deleting period:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Paramètres" description="Chargement..." />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader title="Paramètres" description="Configurez votre système de gestion scolaire" />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Académique</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Rapports</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="promotion" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Promotion</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'Établissement</CardTitle>
              <CardDescription>Configurez les informations générales de votre école</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url || "/placeholder.svg"}
                      alt="Logo"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold text-3xl">H</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">URL du Logo</Label>
                  <Input
                    id="logo"
                    placeholder="https://example.com/logo.png"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">PNG, JPG ou SVG. Utilisé dans les en-têtes.</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">Nom de l'établissement</Label>
                  <Input
                    id="schoolName"
                    value={settings.school_name}
                    onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolSlogan">Slogan</Label>
                  <Input
                    id="schoolSlogan"
                    value={settings.school_slogan}
                    onChange={(e) => setSettings({ ...settings, school_slogan: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">Code établissement</Label>
                  <Input
                    id="schoolCode"
                    value={settings.school_code}
                    onChange={(e) => setSettings({ ...settings, school_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Année académique en cours</Label>
                  <Select
                    value={settings.current_academic_year}
                    onValueChange={(v) => setSettings({ ...settings, current_academic_year: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Settings */}
        <TabsContent value="academic">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calcul des Moyennes</CardTitle>
                <CardDescription>Configurez les règles de calcul des moyennes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Moyenne pondérée</p>
                    <p className="text-sm text-muted-foreground">
                      Utiliser les coefficients pour le calcul des moyennes
                    </p>
                  </div>
                  <Switch
                    checked={settings.use_weighted_average}
                    onCheckedChange={(checked) => setSettings({ ...settings, use_weighted_average: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Arrondi automatique</p>
                    <p className="text-sm text-muted-foreground">Arrondir les moyennes à 2 décimales</p>
                  </div>
                  <Switch
                    checked={settings.round_averages}
                    onCheckedChange={(checked) => setSettings({ ...settings, round_averages: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Gestion des ex-aequo</p>
                    <p className="text-sm text-muted-foreground">
                      Attribuer le même rang aux élèves avec la même moyenne
                    </p>
                  </div>
                  <Switch
                    checked={settings.handle_ties}
                    onCheckedChange={(checked) => setSettings({ ...settings, handle_ties: checked })}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveGeneral} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Périodes Académiques</CardTitle>
                  <CardDescription>
                    Gérez les séquences et trimestres ({settings.current_academic_year})
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCreatePeriod("sequence")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Séquence
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCreatePeriod("trimester")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Trimestre
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Trimestres with their sequences */}
                  {periods
                    .filter((p) => p.type === "trimester" && p.academic_year === settings.current_academic_year)
                    .sort((a, b) => a.number - b.number)
                    .map((trimester) => {
                      const sequences = periods.filter((p) => p.parent_id === trimester.id)
                      return (
                        <div key={trimester.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-primary">{trimester.name}</h4>
                            <Button size="sm" variant="ghost" onClick={() => handleDeletePeriod(trimester.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="pl-4 space-y-2">
                            {sequences.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Aucune séquence liée</p>
                            ) : (
                              sequences.map((seq) => (
                                <div
                                  key={seq.id}
                                  className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                                >
                                  <span className="text-sm">{seq.name}</span>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeletePeriod(seq.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => handleCreatePeriod("sequence", trimester.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter séquence
                            </Button>
                          </div>
                        </div>
                      )
                    })}

                  {/* Sequences without parent */}
                  {periods.filter(
                    (p) => p.type === "sequence" && !p.parent_id && p.academic_year === settings.current_academic_year,
                  ).length > 0 && (
                    <div className="border rounded-lg p-4 border-dashed">
                      <h4 className="font-medium text-muted-foreground mb-3">Séquences indépendantes</h4>
                      <div className="space-y-2">
                        {periods
                          .filter(
                            (p) =>
                              p.type === "sequence" &&
                              !p.parent_id &&
                              p.academic_year === settings.current_academic_year,
                          )
                          .map((seq) => (
                            <div
                              key={seq.id}
                              className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                            >
                              <span className="text-sm">{seq.name}</span>
                              <Button size="sm" variant="ghost" onClick={() => handleDeletePeriod(seq.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Settings */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des Rapports</CardTitle>
              <CardDescription>Personnalisez l'apparence des bordereaux et bulletins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="watermark">URL du filigrane</Label>
                <Input
                  id="watermark"
                  placeholder="https://example.com/watermark.png"
                  value={settings.watermark_url}
                  onChange={(e) => setSettings({ ...settings, watermark_url: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Image utilisée en filigrane sur les documents (optionnel)
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Afficher le logo</p>
                  <p className="text-sm text-muted-foreground">Afficher le logo de l'école sur les documents</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Afficher le filigrane</p>
                  <p className="text-sm text-muted-foreground">Afficher le filigrane sur les documents</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Signatures automatiques</p>
                  <p className="text-sm text-muted-foreground">Inclure les zones de signature sur les bulletins</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Notifications</CardTitle>
              <CardDescription>Choisissez quand et comment recevoir des notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notes manquantes</p>
                  <p className="text-sm text-muted-foreground">Alerter quand des élèves n'ont pas de notes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nouvelles inscriptions</p>
                  <p className="text-sm text-muted-foreground">Notifier lors de l'inscription d'un nouvel élève</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rapports générés</p>
                  <p className="text-sm text-muted-foreground">Confirmer la génération des bulletins et bordereaux</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotion Settings */}
        <TabsContent value="promotion">
          <Card>
            <CardHeader>
              <CardTitle>Critères de Promotion et Classement</CardTitle>
              <CardDescription>
                Définissez les moyennes de passage et les seuils de non-classement par classe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classe</TableHead>
                    <TableHead className="w-24 text-center">Passage</TableHead>
                    <TableHead className="w-24 text-center">Rattrapage</TableHead>
                    <TableHead className="w-24 text-center">Redoubl.</TableHead>
                    <TableHead className="w-24 text-center">T. Honneur</TableHead>
                    <TableHead className="w-24 text-center">Seuil NC</TableHead>
                    <TableHead className="w-40">Classe Sup.</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">
                        <div>{cls.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          {cls.level?.name} / {cls.section?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={cls.min_promotion_average || 10.0}
                          className="w-16 mx-auto text-center h-8 px-1"
                          id={`min-avg-${cls.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={cls.min_rattrapage_average || 8.0}
                          className="w-16 mx-auto text-center h-8 px-1"
                          id={`rattrapage-avg-${cls.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={cls.min_repetition_average || 7.0}
                          className="w-16 mx-auto text-center h-8 px-1"
                          id={`repetition-avg-${cls.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={cls.min_honor_roll_average || 12.0}
                          className="w-16 mx-auto text-center h-8 px-1"
                          id={`honor-avg-${cls.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={cls.unranked_coef_threshold || 0}
                          className="w-16 mx-auto text-center h-8 px-1"
                          id={`unranked-${cls.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          defaultValue={cls.next_class_id || "none"}
                          onValueChange={(val) => {
                            const input = document.createElement('input');
                            input.type = 'hidden';
                            input.id = `next-class-${cls.id}`;
                            input.value = val;
                            const existing = document.getElementById(`next-class-${cls.id}`);
                            if (existing) existing.remove();
                            document.body.appendChild(input);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Aucune" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            {classes.filter(c => c.id !== cls.id).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            const minAvg = parseFloat((document.getElementById(`min-avg-${cls.id}`) as HTMLInputElement).value)
                            const rattrapageAvg = parseFloat((document.getElementById(`rattrapage-avg-${cls.id}`) as HTMLInputElement).value)
                            const repetitionAvg = parseFloat((document.getElementById(`repetition-avg-${cls.id}`) as HTMLInputElement).value)
                            const honorRollAvg = parseFloat((document.getElementById(`honor-avg-${cls.id}`) as HTMLInputElement).value)
                            const unranked = parseInt((document.getElementById(`unranked-${cls.id}`) as HTMLInputElement).value)
                            const nextClassInput = document.getElementById(`next-class-${cls.id}`) as HTMLInputElement
                            const nextClassId = nextClassInput ? nextClassInput.value : cls.next_class_id
                            
                            handleUpdateClassCriteria(cls.id, minAvg, unranked, rattrapageAvg, honorRollAvg, repetitionAvg, nextClassId)
                          }}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          OK
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Aucune classe trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation de l'Interface</CardTitle>
              <CardDescription>Adaptez l'apparence de HARMONY à vos préférences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Thème</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                    <div className="w-full h-20 bg-white rounded mb-2 border" />
                    <p className="text-sm font-medium text-center">Clair</p>
                  </div>
                  <div className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                    <div className="w-full h-20 bg-slate-900 rounded mb-2" />
                    <p className="text-sm font-medium text-center">Sombre</p>
                  </div>
                  <div className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors border-primary">
                    <div className="w-full h-20 bg-gradient-to-b from-white to-slate-900 rounded mb-2" />
                    <p className="text-sm font-medium text-center">Système</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Animations</p>
                  <p className="text-sm text-muted-foreground">Activer les animations et transitions</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
