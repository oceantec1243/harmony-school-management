import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { DistributionChart } from "@/components/dashboard/distribution-chart"
import { TopStudents } from "@/components/dashboard/top-students"
import { getDashboardStats, getSchoolSettings } from "@/lib/services/data-service"

export default async function DashboardPage() {
  let stats = {
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalTeachers: 0,
    passRate: 0,
    schoolAverage: 0,
  }

  let settings = null

  try {
    stats = await getDashboardStats()
    settings = await getSchoolSettings()
  } catch (error) {
    console.log("[v0] Error fetching dashboard data:", error)
  }

  return (
    <AppLayout>
      <PageHeader
        title="Tableau de bord"
        description={settings?.school_slogan || "L'harmonie entre technologie et éducation"}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Total Élèves"
          value={stats.totalStudents}
          change={5.2}
          changeLabel="vs année précédente"
          iconName="Users"
          delay={0}
        />
        <StatCard title="Classes Actives" value={stats.totalClasses} change={2} iconName="GraduationCap" delay={100} />
        <StatCard title="Matières" value={stats.totalSubjects} iconName="BookOpen" delay={200} />
        <StatCard title="Enseignants" value={stats.totalTeachers} change={8} iconName="UserCheck" delay={300} />
        <StatCard
          title="Taux de Réussite"
          value={`${stats.passRate}%`}
          change={3.5}
          iconName="TrendingUp"
          delay={400}
        />
        <StatCard
          title="Moyenne Générale"
          value={stats.schoolAverage.toFixed(2)}
          change={0.8}
          iconName="Award"
          delay={500}
        />
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Accès Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActions />
        </CardContent>
      </Card>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <PerformanceChart />
        <DistributionChart />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopStudents />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Activité Récente</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
