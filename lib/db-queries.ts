import { prisma } from '@/lib/prisma'
import { UserRole, AppointmentStatus, WaitlistStatus } from '@prisma/client'

/**
 * Helpers y queries de ejemplo para el modelo de datos
 * Ejemplos de uso común con multi-tenancy
 */

// ============================================================================
// USUARIOS Y MEMBRESÍAS
// ============================================================================

/**
 * Obtener clínicas de un usuario con sus roles
 */
export async function getUserClinics(userId: string) {
  return await prisma.userClinicMembership.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      clinic: {
        include: {
          subscription: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  })
}

/**
 * Verificar si un usuario tiene permiso en una clínica
 */
export async function hasClinicAccess(
  userId: string,
  clinicId: string,
  requiredRoles?: UserRole[]
) {
  const membership = await prisma.userClinicMembership.findUnique({
    where: {
      userId_clinicId: {
        userId,
        clinicId,
      },
    },
  })

  if (!membership || !membership.isActive) return false

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    return false
  }

  return true
}

/**
 * Obtener rol del usuario en una clínica
 */
export async function getUserRole(userId: string, clinicId: string) {
  const membership = await prisma.userClinicMembership.findUnique({
    where: {
      userId_clinicId: {
        userId,
        clinicId,
      },
    },
    select: {
      role: true,
      isActive: true,
    },
  })

  return membership?.isActive ? membership.role : null
}

// ============================================================================
// CITAS (APPOINTMENTS)
// ============================================================================

/**
 * Obtener citas de una clínica en un rango de fechas
 */
export async function getAppointmentsByDateRange(
  clinicId: string,
  startDate: Date,
  endDate: Date,
  filters?: {
    staffMemberId?: string
    status?: AppointmentStatus
  }
) {
  return await prisma.appointment.findMany({
    where: {
      clinicId,
      start: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters?.staffMemberId && { staffMemberId: filters.staffMemberId }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      patient: true,
      treatmentType: true,
      staffMember: true,
      chair: true,
    },
    orderBy: {
      start: 'asc',
    },
  })
}

/**
 * Verificar disponibilidad (evitar conflictos)
 */
export async function checkAvailability(
  clinicId: string,
  staffMemberId: string,
  start: Date,
  end: Date,
  excludeAppointmentId?: string
) {
  const conflicts = await prisma.appointment.findMany({
    where: {
      clinicId,
      staffMemberId,
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
      ...(excludeAppointmentId && {
        id: { not: excludeAppointmentId },
      }),
      OR: [
        {
          // Empieza durante otra cita
          start: {
            gte: start,
            lt: end,
          },
        },
        {
          // Termina durante otra cita
          end: {
            gt: start,
            lte: end,
          },
        },
        {
          // Engloba otra cita
          start: {
            lte: start,
          },
          end: {
            gte: end,
          },
        },
      ],
    },
  })

  return conflicts.length === 0
}

/**
 * Crear una cita con validación de disponibilidad
 */
export async function createAppointment(data: {
  clinicId: string
  patientId: string
  treatmentTypeId?: string
  staffMemberId: string
  chairId?: string
  start: Date
  end: Date
  notes?: string
}) {
  // Verificar disponibilidad
  const isAvailable = await checkAvailability(
    data.clinicId,
    data.staffMemberId,
    data.start,
    data.end
  )

  if (!isAvailable) {
    throw new Error('El horario seleccionado no está disponible')
  }

  // Crear la cita
  return await prisma.appointment.create({
    data: {
      ...data,
      status: AppointmentStatus.SCHEDULED,
    },
    include: {
      patient: true,
      treatmentType: true,
      staffMember: true,
      chair: true,
    },
  })
}

/**
 * Obtener próximas citas de un paciente
 */
export async function getPatientUpcomingAppointments(patientId: string) {
  return await prisma.appointment.findMany({
    where: {
      patientId,
      start: {
        gte: new Date(),
      },
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
    },
    include: {
      treatmentType: true,
      staffMember: true,
      chair: true,
    },
    orderBy: {
      start: 'asc',
    },
  })
}

/**
 * Cancelar una cita
 */
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
) {
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  })
}

// ============================================================================
// PACIENTES
// ============================================================================

/**
 * Buscar pacientes por nombre, email o teléfono
 */
export async function searchPatients(clinicId: string, query: string) {
  return await prisma.patient.findMany({
    where: {
      clinicId,
      isActive: true,
      OR: [
        {
          firstName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: query,
          },
        },
      ],
    },
    take: 10,
    orderBy: {
      firstName: 'asc',
    },
  })
}

/**
 * Obtener historial de citas de un paciente
 */
export async function getPatientHistory(patientId: string) {
  return await prisma.appointment.findMany({
    where: {
      patientId,
    },
    include: {
      treatmentType: true,
      staffMember: true,
    },
    orderBy: {
      start: 'desc',
    },
  })
}

// ============================================================================
// LISTA DE ESPERA
// ============================================================================

/**
 * Obtener entradas activas de lista de espera
 */
export async function getActiveWaitlist(clinicId: string) {
  return await prisma.waitlistEntry.findMany({
    where: {
      clinicId,
      status: WaitlistStatus.WAITING,
    },
    include: {
      patient: true,
      treatmentType: true,
    },
    orderBy: [
      { urgency: 'desc' },
      { createdAt: 'asc' },
    ],
  })
}

/**
 * Notificar a pacientes en lista de espera cuando hay disponibilidad
 */
export async function notifyWaitlistForSlot(
  clinicId: string,
  treatmentTypeId: string,
  availableSlot: Date
) {
  // Obtener pacientes en espera para este tratamiento
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      clinicId,
      treatmentTypeId,
      status: WaitlistStatus.WAITING,
    },
    include: {
      patient: true,
    },
    orderBy: [
      { urgency: 'desc' },
      { createdAt: 'asc' },
    ],
    take: 5, // Notificar a los primeros 5
  })

  // Crear notificaciones
  const notifications = entries.map((entry) =>
    prisma.notificationLog.create({
      data: {
        clinicId,
        recipientEmail: entry.patient.email,
        recipientPhone: entry.patient.phone,
        recipientName: `${entry.patient.firstName} ${entry.patient.lastName}`,
        type: 'WAITLIST_NOTIFICATION',
        channel: entry.patient.email ? 'EMAIL' : 'SMS',
        subject: 'Disponibilidad de cita',
        content: `Hola ${entry.patient.firstName}, tenemos disponibilidad para tu tratamiento el ${availableSlot.toLocaleString()}`,
        status: 'PENDING',
      },
    })
  )

  await Promise.all(notifications)

  // Actualizar entradas a NOTIFIED
  await prisma.waitlistEntry.updateMany({
    where: {
      id: {
        in: entries.map((e) => e.id),
      },
    },
    data: {
      status: WaitlistStatus.NOTIFIED,
      notifiedAt: new Date(),
    },
  })

  return entries.length
}

// ============================================================================
// STAFF Y RECURSOS
// ============================================================================

/**
 * Obtener staff activo de una clínica
 */
export async function getActiveStaff(clinicId: string) {
  return await prisma.staffMember.findMany({
    where: {
      clinicId,
      isActive: true,
      canBookAppointments: true,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      firstName: 'asc',
    },
  })
}

/**
 * Obtener tipos de tratamiento activos
 */
export async function getActiveTreatmentTypes(clinicId: string) {
  return await prisma.treatmentType.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}

/**
 * Obtener sillones/boxes activos
 */
export async function getActiveChairs(clinicId: string) {
  return await prisma.chair.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  })
}

// ============================================================================
// ESTADÍSTICAS Y KPIs
// ============================================================================

/**
 * Obtener KPIs del dashboard
 */
export async function getDashboardKPIs(
  clinicId: string,
  startDate: Date,
  endDate: Date
) {
  const [
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    activePatients,
    waitlistCount,
  ] = await Promise.all([
    // Total de citas
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate, lte: endDate },
      },
    }),
    // Citas completadas
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate, lte: endDate },
        status: AppointmentStatus.COMPLETED,
      },
    }),
    // Citas canceladas
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate, lte: endDate },
        status: AppointmentStatus.CANCELLED,
      },
    }),
    // No shows
    prisma.appointment.count({
      where: {
        clinicId,
        start: { gte: startDate, lte: endDate },
        status: AppointmentStatus.NO_SHOW,
      },
    }),
    // Pacientes activos
    prisma.patient.count({
      where: {
        clinicId,
        isActive: true,
      },
    }),
    // Lista de espera
    prisma.waitlistEntry.count({
      where: {
        clinicId,
        status: WaitlistStatus.WAITING,
      },
    }),
  ])

  const completionRate =
    totalAppointments > 0
      ? (completedAppointments / totalAppointments) * 100
      : 0
  const noShowRate =
    totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0

  return {
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    activePatients,
    waitlistCount,
    completionRate: Math.round(completionRate * 100) / 100,
    noShowRate: Math.round(noShowRate * 100) / 100,
  }
}

/**
 * Obtener citas de hoy
 */
export async function getTodayAppointments(clinicId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await prisma.appointment.findMany({
    where: {
      clinicId,
      start: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        notIn: [AppointmentStatus.CANCELLED],
      },
    },
    include: {
      patient: true,
      treatmentType: true,
      staffMember: true,
      chair: true,
    },
    orderBy: {
      start: 'asc',
    },
  })
}

// ============================================================================
// SUSCRIPCIONES
// ============================================================================

/**
 * Verificar si una clínica tiene suscripción activa
 */
export async function hasActiveSubscription(clinicId: string) {
  const subscription = await prisma.clinicSubscription.findUnique({
    where: { clinicId },
  })

  if (!subscription) return false

  return ['TRIALING', 'ACTIVE'].includes(subscription.status)
}

/**
 * Verificar límites de la suscripción
 */
export async function checkSubscriptionLimits(clinicId: string) {
  const subscription = await prisma.clinicSubscription.findUnique({
    where: { clinicId },
  })

  if (!subscription) {
    throw new Error('No hay suscripción configurada')
  }

  const [staffCount, appointmentsThisMonth] = await Promise.all([
    prisma.staffMember.count({
      where: {
        clinicId,
        isActive: true,
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        start: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ])

  return {
    canAddStaff:
      !subscription.maxStaffMembers ||
      staffCount < subscription.maxStaffMembers,
    canAddAppointment:
      !subscription.maxAppointmentsMonth ||
      appointmentsThisMonth < subscription.maxAppointmentsMonth,
    currentStaff: staffCount,
    maxStaff: subscription.maxStaffMembers,
    currentAppointments: appointmentsThisMonth,
    maxAppointments: subscription.maxAppointmentsMonth,
  }
}

export const dbQueries = {
  getUserClinics,
  hasClinicAccess,
  getUserRole,
  getAppointmentsByDateRange,
  checkAvailability,
  createAppointment,
  getPatientUpcomingAppointments,
  cancelAppointment,
  searchPatients,
  getPatientHistory,
  getActiveWaitlist,
  notifyWaitlistForSlot,
  getActiveStaff,
  getActiveTreatmentTypes,
  getActiveChairs,
  getDashboardKPIs,
  getTodayAppointments,
  hasActiveSubscription,
  checkSubscriptionLimits,
}

export default dbQueries
