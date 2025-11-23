'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole, WaitlistStatus, WaitlistUrgency } from '@prisma/client'

// Obtener entradas de lista de espera de la clínica
export async function getWaitlistEntries(filters?: {
  status?: WaitlistStatus
  treatmentTypeId?: string
  urgency?: WaitlistUrgency
}) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  ])

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      clinicId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.treatmentTypeId && { treatmentTypeId: filters.treatmentTypeId }),
      ...(filters?.urgency && { urgency: filters.urgency }),
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        }
      },
      treatmentType: {
        select: {
          id: true,
          name: true,
          color: true,
          defaultDuration: true,
        }
      }
    },
    orderBy: [
      { urgency: 'desc' }, // URGENT first
      { createdAt: 'asc' }, // Oldest first
    ]
  })

  return entries
}

// Crear entrada en lista de espera
export async function createWaitlistEntry(data: {
  patientId: string
  treatmentTypeId?: string
  preferredTimeSlot?: string
  preferredDays?: string[]
  urgency?: WaitlistUrgency
  notes?: string
}) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  ])

  // Verificar que el paciente pertenece a la clínica
  const patient = await prisma.patient.findFirst({
    where: {
      id: data.patientId,
      clinicId,
    }
  })

  if (!patient) {
    throw new Error('Paciente no encontrado')
  }

  // Verificar si ya tiene una entrada activa para el mismo tratamiento
  const existing = await prisma.waitlistEntry.findFirst({
    where: {
      clinicId,
      patientId: data.patientId,
      treatmentTypeId: data.treatmentTypeId || null,
      status: {
        in: [WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED],
      }
    }
  })

  if (existing) {
    throw new Error('El paciente ya está en la lista de espera para este tratamiento')
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      clinicId,
      patientId: data.patientId,
      treatmentTypeId: data.treatmentTypeId || null,
      preferredTimeSlot: data.preferredTimeSlot || null,
      preferredDays: data.preferredDays ? JSON.stringify(data.preferredDays) : null,
      urgency: data.urgency || WaitlistUrgency.NORMAL,
      notes: data.notes || null,
      status: WaitlistStatus.WAITING,
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        }
      },
      treatmentType: {
        select: {
          name: true,
        }
      }
    }
  })

  revalidatePath('/lista-espera')
  revalidatePath('/agenda')

  return entry
}

// Crear entrada desde widget público (sin autenticación)
export async function createPublicWaitlistEntry(data: {
  clinicId: string
  patientData: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
  treatmentTypeId?: string
  preferredTimeSlot?: string
  notes?: string
}) {
  // Buscar o crear paciente
  let patient = null

  if (data.patientData.email) {
    patient = await prisma.patient.findFirst({
      where: {
        clinicId: data.clinicId,
        email: data.patientData.email,
      }
    })
  }

  if (!patient && data.patientData.phone) {
    patient = await prisma.patient.findFirst({
      where: {
        clinicId: data.clinicId,
        phone: data.patientData.phone,
      }
    })
  }

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        clinicId: data.clinicId,
        firstName: data.patientData.firstName,
        lastName: data.patientData.lastName,
        email: data.patientData.email || null,
        phone: data.patientData.phone || null,
      }
    })
  }

  // Verificar si ya tiene una entrada activa
  const existing = await prisma.waitlistEntry.findFirst({
    where: {
      clinicId: data.clinicId,
      patientId: patient.id,
      treatmentTypeId: data.treatmentTypeId || null,
      status: {
        in: [WaitlistStatus.WAITING, WaitlistStatus.NOTIFIED],
      }
    }
  })

  if (existing) {
    return {
      success: false,
      error: 'Ya estás en la lista de espera para este tratamiento'
    }
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      clinicId: data.clinicId,
      patientId: patient.id,
      treatmentTypeId: data.treatmentTypeId || null,
      preferredTimeSlot: data.preferredTimeSlot || null,
      urgency: WaitlistUrgency.NORMAL,
      notes: data.notes || null,
      status: WaitlistStatus.WAITING,
    }
  })

  return {
    success: true,
    entry,
  }
}

// Actualizar estado de entrada
export async function updateWaitlistStatus(
  id: string,
  status: WaitlistStatus
) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
  ])

  const entry = await prisma.waitlistEntry.findFirst({
    where: { id, clinicId }
  })

  if (!entry) {
    throw new Error('Entrada no encontrada')
  }

  const updated = await prisma.waitlistEntry.update({
    where: { id },
    data: {
      status,
      ...(status === WaitlistStatus.NOTIFIED && { notifiedAt: new Date() }),
      ...(status === WaitlistStatus.SCHEDULED && { resolvedAt: new Date() }),
      ...(status === WaitlistStatus.CANCELLED && { resolvedAt: new Date() }),
      ...(status === WaitlistStatus.EXPIRED && { resolvedAt: new Date() }),
    }
  })

  revalidatePath('/lista-espera')
  revalidatePath('/agenda')

  return updated
}

// Eliminar entrada de lista de espera
export async function deleteWaitlistEntry(id: string) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
  ])

  const entry = await prisma.waitlistEntry.findFirst({
    where: { id, clinicId }
  })

  if (!entry) {
    throw new Error('Entrada no encontrada')
  }

  await prisma.waitlistEntry.delete({
    where: { id }
  })

  revalidatePath('/lista-espera')
  revalidatePath('/agenda')
}

// Buscar candidatos de lista de espera para un hueco específico
export async function findWaitlistCandidates(data: {
  treatmentTypeId?: string
  date: Date
  duration: number // en minutos
  timeSlot?: 'MORNING' | 'AFTERNOON' | 'EVENING'
}) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  ])

  const candidates = await prisma.waitlistEntry.findMany({
    where: {
      clinicId,
      status: WaitlistStatus.WAITING,
      ...(data.treatmentTypeId && {
        OR: [
          { treatmentTypeId: data.treatmentTypeId },
          { treatmentTypeId: null }, // Acepta cualquier tratamiento
        ]
      }),
      ...(data.timeSlot && {
        OR: [
          { preferredTimeSlot: data.timeSlot },
          { preferredTimeSlot: null }, // Sin preferencia
        ]
      })
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        }
      },
      treatmentType: {
        select: {
          id: true,
          name: true,
          color: true,
          defaultDuration: true,
        }
      }
    },
    orderBy: [
      { urgency: 'desc' },
      { createdAt: 'asc' },
    ],
    take: 10, // Limitar a 10 candidatos
  })

  return candidates
}

// Convertir entrada de lista de espera en cita
export async function convertWaitlistToAppointment(
  waitlistEntryId: string,
  appointmentData: {
    start: string
    duration: number
    chairId?: string
    staffMemberId?: string
    notes?: string
  }
) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
  ])

  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: waitlistEntryId, clinicId },
    include: {
      patient: true,
      treatmentType: true,
    }
  })

  if (!entry) {
    throw new Error('Entrada de lista de espera no encontrada')
  }

  if (entry.status !== WaitlistStatus.WAITING && entry.status !== WaitlistStatus.NOTIFIED) {
    throw new Error('Esta entrada ya no está disponible')
  }

  const start = new Date(appointmentData.start)
  const end = new Date(start.getTime() + appointmentData.duration * 60000)

  // Crear la cita
  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      patientId: entry.patientId,
      treatmentTypeId: entry.treatmentTypeId,
      staffMemberId: appointmentData.staffMemberId || null,
      chairId: appointmentData.chairId || null,
      start,
      end,
      status: 'SCHEDULED',
      notes: appointmentData.notes || entry.notes || null,
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        }
      },
      treatmentType: {
        select: {
          name: true,
        }
      }
    }
  })

  // Actualizar la entrada de lista de espera
  await prisma.waitlistEntry.update({
    where: { id: waitlistEntryId },
    data: {
      status: WaitlistStatus.SCHEDULED,
      resolvedAt: new Date(),
    }
  })

  revalidatePath('/lista-espera')
  revalidatePath('/agenda')

  return appointment
}

// Obtener estadísticas de lista de espera
export async function getWaitlistStats() {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
  ])

  const [waiting, notified, scheduled, total] = await Promise.all([
    prisma.waitlistEntry.count({
      where: { clinicId, status: WaitlistStatus.WAITING }
    }),
    prisma.waitlistEntry.count({
      where: { clinicId, status: WaitlistStatus.NOTIFIED }
    }),
    prisma.waitlistEntry.count({
      where: { clinicId, status: WaitlistStatus.SCHEDULED }
    }),
    prisma.waitlistEntry.count({
      where: { clinicId }
    }),
  ])

  return {
    waiting,
    notified,
    scheduled,
    total,
  }
}
