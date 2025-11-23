/**
 * Helpers para calcular KPIs del dashboard
 * Todas las funciones son server-side y usan agregaciones optimizadas de Prisma
 */

import { prisma } from '@/lib/prisma'
import { differenceInMinutes } from 'date-fns'

interface DashboardFilters {
  clinicId: string
  startDate: Date
  endDate: Date
  staffMemberId?: string
}

interface OccupancyByChair {
  chairId: string
  chairName: string
  totalMinutes: number
  bookedMinutes: number
  occupancyRate: number
}

interface NoShowStats {
  total: number
  rate: number
}

interface LateCancellationStats {
  total: number
  rate: number
}

interface ValuePerHour {
  totalValue: number
  totalHours: number
  valuePerHour: number
}

interface TreatmentRanking {
  treatmentId: string
  treatmentName: string
  count: number
  totalValue: number
}

/**
 * Calcula el porcentaje de ocupación por sillón
 */
export async function calculateOccupancyByChair(
  filters: DashboardFilters
): Promise<OccupancyByChair[]> {
  const { clinicId, startDate, endDate, staffMemberId } = filters

  // Obtener todos los sillones activos
  const chairs = await prisma.chair.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  })

  // Obtener las citas del periodo
  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      chairId: { not: null },
      start: { gte: startDate },
      end: { lte: endDate },
      status: {
        in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'],
      },
      ...(staffMemberId && { staffMemberId }),
    },
    select: {
      chairId: true,
      start: true,
      end: true,
    },
  })

  // Calcular tiempo disponible (horario laboral)
  // Asumimos 10 horas por día (08:00 - 18:00)
  const daysInPeriod = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const workingMinutesPerDay = 10 * 60 // 10 horas = 600 minutos
  const totalAvailableMinutesPerChair = daysInPeriod * workingMinutesPerDay

  // Calcular ocupación por sillón
  const occupancyByChair = chairs.map((chair) => {
    const chairAppointments = appointments.filter(
      (apt) => apt.chairId === chair.id
    )

    const bookedMinutes = chairAppointments.reduce((sum, apt) => {
      return sum + differenceInMinutes(apt.end, apt.start)
    }, 0)

    const occupancyRate =
      totalAvailableMinutesPerChair > 0
        ? (bookedMinutes / totalAvailableMinutesPerChair) * 100
        : 0

    return {
      chairId: chair.id,
      chairName: chair.name,
      totalMinutes: totalAvailableMinutesPerChair,
      bookedMinutes,
      occupancyRate: Math.round(occupancyRate * 10) / 10, // 1 decimal
    }
  })

  return occupancyByChair
}

/**
 * Calcula estadísticas de no-shows
 */
export async function calculateNoShowStats(
  filters: DashboardFilters
): Promise<NoShowStats> {
  const { clinicId, startDate, endDate, staffMemberId } = filters

  const [noShowCount, totalCount] = await Promise.all([
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate },
        end: { lte: endDate },
        status: 'NO_SHOW',
        ...(staffMemberId && { staffMemberId }),
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate },
        end: { lte: endDate },
        status: {
          in: ['COMPLETED', 'NO_SHOW'],
        },
        ...(staffMemberId && { staffMemberId }),
      },
    }),
  ])

  const rate = totalCount > 0 ? (noShowCount / totalCount) * 100 : 0

  return {
    total: noShowCount,
    rate: Math.round(rate * 10) / 10,
  }
}

/**
 * Calcula cancelaciones tardías (menos de 24h antes)
 */
export async function calculateLateCancellations(
  filters: DashboardFilters
): Promise<LateCancellationStats> {
  const { clinicId, startDate, endDate, staffMemberId } = filters

  // Obtener todas las citas canceladas
  const cancelledAppointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      start: { gte: startDate },
      end: { lte: endDate },
      status: 'CANCELLED',
      cancelledAt: { not: null },
      ...(staffMemberId && { staffMemberId }),
    },
    select: {
      start: true,
      cancelledAt: true,
    },
  })

  // Filtrar las que se cancelaron con menos de 24h de anticipación
  const lateCancellations = cancelledAppointments.filter((apt) => {
    if (!apt.cancelledAt) return false
    const hoursBeforeAppointment =
      (apt.start.getTime() - apt.cancelledAt.getTime()) / (1000 * 60 * 60)
    return hoursBeforeAppointment < 24
  })

  const totalCancelled = cancelledAppointments.length
  const rate =
    totalCancelled > 0 ? (lateCancellations.length / totalCancelled) * 100 : 0

  return {
    total: lateCancellations.length,
    rate: Math.round(rate * 10) / 10,
  }
}

/**
 * Calcula el valor por hora estimado
 */
export async function calculateValuePerHour(
  filters: DashboardFilters
): Promise<ValuePerHour> {
  const { clinicId, startDate, endDate, staffMemberId } = filters

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      start: { gte: startDate },
      end: { lte: endDate },
      status: {
        in: ['COMPLETED', 'SCHEDULED', 'CONFIRMED'],
      },
      ...(staffMemberId && { staffMemberId }),
    },
    include: {
      treatmentType: {
        select: {
          estimatedPrice: true,
        },
      },
    },
  })

  let totalValue = 0
  let totalMinutes = 0

  appointments.forEach((apt) => {
    const duration = differenceInMinutes(apt.end, apt.start)
    totalMinutes += duration

    if (apt.treatmentType?.estimatedPrice) {
      totalValue += Number(apt.treatmentType.estimatedPrice)
    }
  })

  const totalHours = totalMinutes / 60
  const valuePerHour = totalHours > 0 ? totalValue / totalHours : 0

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalHours: Math.round(totalHours * 10) / 10,
    valuePerHour: Math.round(valuePerHour * 100) / 100,
  }
}

/**
 * Calcula el ranking de tratamientos por volumen y valor
 */
export async function calculateTreatmentRanking(
  filters: DashboardFilters,
  limit = 5
): Promise<TreatmentRanking[]> {
  const { clinicId, startDate, endDate, staffMemberId } = filters

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      start: { gte: startDate },
      end: { lte: endDate },
      status: {
        in: ['COMPLETED', 'SCHEDULED', 'CONFIRMED'],
      },
      treatmentTypeId: { not: null },
      ...(staffMemberId && { staffMemberId }),
    },
    include: {
      treatmentType: {
        select: {
          id: true,
          name: true,
          estimatedPrice: true,
        },
      },
    },
  })

  // Agrupar por tipo de tratamiento
  const treatmentMap = new Map<string, TreatmentRanking>()

  appointments.forEach((apt) => {
    if (!apt.treatmentType) return

    const existing = treatmentMap.get(apt.treatmentType.id)
    const value = apt.treatmentType.estimatedPrice
      ? Number(apt.treatmentType.estimatedPrice)
      : 0

    if (existing) {
      existing.count += 1
      existing.totalValue += value
    } else {
      treatmentMap.set(apt.treatmentType.id, {
        treatmentId: apt.treatmentType.id,
        treatmentName: apt.treatmentType.name,
        count: 1,
        totalValue: value,
      })
    }
  })

  // Convertir a array y ordenar por volumen (count)
  const ranking = Array.from(treatmentMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      totalValue: Math.round(item.totalValue * 100) / 100,
    }))

  return ranking
}

/**
 * Calcula estadísticas generales para los KPIs principales
 */
export async function calculateGeneralStats(filters: DashboardFilters) {
  const { clinicId, startDate, endDate, staffMemberId } = filters

  const [
    totalAppointments,
    completedAppointments,
    activePatients,
    waitingListCount,
    occupancyData,
    noShowData,
    lateCancellationData,
    valueData,
    treatmentRanking,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate },
        end: { lte: endDate },
        ...(staffMemberId && { staffMemberId }),
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate },
        end: { lte: endDate },
        status: 'COMPLETED',
        ...(staffMemberId && { staffMemberId }),
      },
    }),
    prisma.patient.count({
      where: {
        clinicId,
        isActive: true,
      },
    }),
    prisma.waitlistEntry.count({
      where: {
        clinicId,
        status: 'WAITING',
      },
    }),
    calculateOccupancyByChair(filters),
    calculateNoShowStats(filters),
    calculateLateCancellations(filters),
    calculateValuePerHour(filters),
    calculateTreatmentRanking(filters, 5),
  ])

  // Calcular ocupación promedio
  const avgOccupancy =
    occupancyData.length > 0
      ? occupancyData.reduce((sum, chair) => sum + chair.occupancyRate, 0) /
        occupancyData.length
      : 0

  return {
    totalAppointments,
    completedAppointments,
    activePatients,
    waitingListCount,
    avgOccupancy: Math.round(avgOccupancy * 10) / 10,
    occupancyByChair: occupancyData,
    noShowStats: noShowData,
    lateCancellationStats: lateCancellationData,
    valuePerHour: valueData,
    treatmentRanking,
  }
}
