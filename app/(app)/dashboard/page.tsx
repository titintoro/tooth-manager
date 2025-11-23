import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { calculateGeneralStats } from './kpi-helpers'
import { OccupancyChart } from './occupancy-chart'
import { TreatmentRankingChart } from './treatment-ranking-chart'
import { DashboardFilters } from './dashboard-filters'
import { prisma } from '@/lib/prisma'
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns'

interface DashboardPageProps {
  searchParams: {
    period?: string
    staffMemberId?: string
    startDate?: string
    endDate?: string
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  // Determinar rango de fechas basado en el período
  const period = searchParams.period || 'month'
  let startDate: Date
  let endDate: Date

  const now = new Date()

  switch (period) {
    case 'today':
      startDate = startOfDay(now)
      endDate = endOfDay(now)
      break
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 })
      endDate = endOfWeek(now, { weekStartsOn: 1 })
      break
    case 'month':
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
      break
    case 'quarter':
      startDate = startOfQuarter(now)
      endDate = endOfQuarter(now)
      break
    case 'year':
      startDate = startOfYear(now)
      endDate = endOfYear(now)
      break
    case 'custom':
      startDate = searchParams.startDate ? new Date(searchParams.startDate) : startOfMonth(subMonths(now, 1))
      endDate = searchParams.endDate ? new Date(searchParams.endDate) : endOfMonth(now)
      break
    default:
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
  }

  // Obtener staff members para filtros
  const staffMembers = await prisma.staffMember.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
  })

  // Calcular KPIs
  const stats = await calculateGeneralStats({
    clinicId,
    startDate,
    endDate,
    staffMemberId: searchParams.staffMemberId,
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Resumen de rendimiento y KPIs de tu clínica
          </p>
        </div>
      </div>

      {/* Filtros */}
      <DashboardFilters
        staffMembers={staffMembers}
        currentPeriod={period}
        currentStaffMemberId={searchParams.staffMemberId}
        currentStartDate={startDate}
        currentEndDate={endDate}
      />

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Citas Totales
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAppointments} completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ocupación Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOccupancy}%</div>
            <p className="text-xs text-muted-foreground">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de No-Shows
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.noShowStats.rate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.noShowStats.total} pacientes no asistieron
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cancelaciones Tardías
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateCancellationStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lateCancellationStats.rate}% del total canceladas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor por Hora
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.valuePerHour.valuePerHour)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.valuePerHour.totalHours.toFixed(1)}h trabajadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Estimados
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.valuePerHour.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
            <p className="text-xs text-muted-foreground">
              En base de datos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lista de Espera
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitingListCount}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes esperando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <OccupancyChart 
          data={stats.occupancyByChair.map(chair => ({
            chairName: chair.chairName,
            occupancyRate: chair.occupancyRate,
          }))}
        />
        
        <TreatmentRankingChart data={stats.treatmentRanking} />
      </div>
    </div>
  )
}

