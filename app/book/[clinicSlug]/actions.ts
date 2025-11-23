'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addMinutes, startOfDay, endOfDay, parseISO } from 'date-fns'

// Obtener información pública de la clínica por slug
export async function getClinicBySlug(slug: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { 
      slug,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      timezone: true,
      businessHoursStart: true,
      businessHoursEnd: true,
      slotDuration: true,
    }
  })

  if (!clinic) {
    return null
  }

  return clinic
}

// Obtener tipos de tratamiento activos de una clínica
export async function getActiveTreatmentTypes(clinicId: string) {
  const treatments = await prisma.treatmentType.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      defaultDuration: true,
      color: true,
    },
    orderBy: {
      name: 'asc',
    }
  })

  return treatments
}

// Obtener staff members activos que pueden recibir citas
export async function getActiveStaffMembers(clinicId: string) {
  const staff = await prisma.staffMember.findMany({
    where: {
      clinicId,
      isActive: true,
      canBookAppointments: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profession: true,
      color: true,
    },
    orderBy: {
      firstName: 'asc',
    }
  })

  return staff
}

// Calcular slots disponibles para un día específico
export async function getAvailableSlots(
  clinicId: string,
  date: string, // ISO date string
  treatmentDuration: number,
  staffMemberId?: string
) {
  const targetDate = parseISO(date)
  const dayStart = startOfDay(targetDate)
  const dayEnd = endOfDay(targetDate)

  // Obtener configuración de la clínica
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      businessHoursStart: true,
      businessHoursEnd: true,
      slotDuration: true,
    }
  })

  if (!clinic) {
    return []
  }

  const businessStart = clinic.businessHoursStart || '08:00'
  const businessEnd = clinic.businessHoursEnd || '20:00'

  // Obtener citas existentes para ese día
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      start: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
      ...(staffMemberId ? { staffMemberId } : {}),
    },
    select: {
      start: true,
      end: true,
      chairId: true,
      staffMemberId: true,
    }
  })

  // Obtener sillones activos
  const activeChairs = await prisma.chair.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    select: {
      id: true,
    }
  })

  if (activeChairs.length === 0) {
    return []
  }

  // Generar slots posibles en el día
  const [startHour, startMinute] = businessStart.split(':').map(Number)
  const [endHour, endMinute] = businessEnd.split(':').map(Number)

  const slots: Array<{
    start: string
    end: string
    available: boolean
  }> = []

  let currentTime = new Date(targetDate)
  currentTime.setHours(startHour, startMinute, 0, 0)

  const endTime = new Date(targetDate)
  endTime.setHours(endHour, endMinute, 0, 0)

  // Generar slots cada 15 minutos
  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, treatmentDuration)
    
    // Verificar si este slot cabe antes del cierre
    if (slotEnd <= endTime) {
      // Verificar disponibilidad: necesitamos al menos un sillón libre durante todo el slot
      let hasAvailableChair = false

      for (const chair of activeChairs) {
        // Verificar si este sillón está libre durante todo el slot
        const hasConflict = existingAppointments.some((apt: { chairId: string | null; start: Date; end: Date }) => {
          if (apt.chairId !== chair.id) return false
          
          const aptStart = new Date(apt.start)
          const aptEnd = new Date(apt.end)
          
          // Verificar solapamiento
          return (
            (currentTime >= aptStart && currentTime < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (currentTime <= aptStart && slotEnd >= aptEnd)
          )
        })

        // Si buscamos un staff específico, verificar su disponibilidad
        if (staffMemberId) {
          const staffConflict = existingAppointments.some((apt: { staffMemberId: string | null; start: Date; end: Date }) => {
            if (apt.staffMemberId !== staffMemberId) return false
            
            const aptStart = new Date(apt.start)
            const aptEnd = new Date(apt.end)
            
            return (
              (currentTime >= aptStart && currentTime < aptEnd) ||
              (slotEnd > aptStart && slotEnd <= aptEnd) ||
              (currentTime <= aptStart && slotEnd >= aptEnd)
            )
          })

          if (!hasConflict && !staffConflict) {
            hasAvailableChair = true
            break
          }
        } else {
          if (!hasConflict) {
            hasAvailableChair = true
            break
          }
        }
      }

      slots.push({
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        available: hasAvailableChair,
      })
    }

    currentTime = addMinutes(currentTime, 15) // Avanzar 15 minutos
  }

  // Filtrar solo los disponibles
  return slots.filter(slot => slot.available)
}

// Crear o encontrar paciente y crear cita
export async function createPublicAppointment(data: {
  clinicId: string
  treatmentTypeId: string
  staffMemberId?: string
  start: string // ISO datetime
  duration: number
  patientData: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
  notes?: string
}) {
  try {
    // Buscar si el paciente ya existe (por email o teléfono)
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

    // Si no existe, crear el paciente
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

    // Calcular fecha de fin
    const start = new Date(data.start)
    const end = addMinutes(start, data.duration)

    // Encontrar un sillón disponible para esta cita
    const availableChair = await findAvailableChair(
      data.clinicId,
      start,
      end,
      data.staffMemberId
    )

    if (!availableChair) {
      throw new Error('No hay sillones disponibles para este horario')
    }

    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        clinicId: data.clinicId,
        patientId: patient.id,
        treatmentTypeId: data.treatmentTypeId,
        staffMemberId: data.staffMemberId || null,
        chairId: availableChair,
        start,
        end,
        status: 'SCHEDULED',
        notes: data.notes || null,
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        treatmentType: {
          select: {
            name: true,
          }
        },
        staffMember: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    revalidatePath('/agenda')

    return {
      success: true,
      appointment,
    }
  } catch (error) {
    console.error('Error creating public appointment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la cita'
    }
  }
}

// Función auxiliar para encontrar un sillón disponible
async function findAvailableChair(
  clinicId: string,
  start: Date,
  end: Date,
  staffMemberId?: string
): Promise<string | null> {
  const chairs = await prisma.chair.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    orderBy: {
      displayOrder: 'asc',
    }
  })

  for (const chair of chairs) {
    // Verificar si hay conflicto con otras citas en este sillón
    const chairConflict = await prisma.appointment.findFirst({
      where: {
        clinicId,
        chairId: chair.id,
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { start: { lte: start } },
              { end: { gt: start } },
            ],
          },
          {
            AND: [
              { start: { lt: end } },
              { end: { gte: end } },
            ],
          },
          {
            AND: [
              { start: { gte: start } },
              { end: { lte: end } },
            ],
          },
        ],
      }
    })

    if (chairConflict) continue

    // Si hay staff específico, verificar disponibilidad
    if (staffMemberId) {
      const staffConflict = await prisma.appointment.findFirst({
        where: {
          clinicId,
          staffMemberId,
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
          OR: [
            {
              AND: [
                { start: { lte: start } },
                { end: { gt: start } },
              ],
            },
            {
              AND: [
                { start: { lt: end } },
                { end: { gte: end } },
              ],
            },
            {
              AND: [
                { start: { gte: start } },
                { end: { lte: end } },
              ],
            },
          ],
        }
      })

      if (staffConflict) continue
    }

    return chair.id
  }

  return null
}
