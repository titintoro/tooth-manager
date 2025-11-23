'use server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole, AppointmentStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Obtener citas de la clínica en un rango de fechas
export async function getAppointments(startDate: string, endDate: string) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      start: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: {
        not: AppointmentStatus.CANCELLED,
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      treatmentType: {
        select: {
          id: true,
          name: true,
          color: true,
          defaultDuration: true,
        },
      },
      staffMember: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          color: true,
        },
      },
      chair: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      start: 'asc',
    },
  })

  return appointments
}

// Obtener recursos (sillones y profesionales)
export async function getResources() {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  const [chairs, staffMembers] = await Promise.all([
    prisma.chair.findMany({
      where: { clinicId, isActive: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.staffMember.findMany({
      where: { clinicId, isActive: true, canBookAppointments: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
  ])

  return { chairs, staffMembers }
}

// Crear cita con validación de solapamientos
export async function createAppointment(data: {
  patientId: string
  treatmentTypeId?: string
  staffMemberId?: string
  chairId?: string
  start: string
  duration: number
  notes?: string
}) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
  ])

  const start = new Date(data.start)
  const end = new Date(start.getTime() + data.duration * 60000)

  // Validar que el paciente existe y pertenece a la clínica
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado')
  }

  // Validar solapamiento en sillón
  if (data.chairId) {
    const overlappingChairAppointment = await prisma.appointment.findFirst({
      where: {
        clinicId,
        chairId: data.chairId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
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
      },
    })

    if (overlappingChairAppointment) {
      throw new Error('El sillón ya está ocupado en ese horario')
    }
  }

  // Validar solapamiento en profesional
  if (data.staffMemberId) {
    const overlappingStaffAppointment = await prisma.appointment.findFirst({
      where: {
        clinicId,
        staffMemberId: data.staffMemberId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
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
      },
    })

    if (overlappingStaffAppointment) {
      throw new Error('El profesional ya tiene una cita en ese horario')
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      patientId: data.patientId,
      treatmentTypeId: data.treatmentTypeId || null,
      staffMemberId: data.staffMemberId || null,
      chairId: data.chairId || null,
      start,
      end,
      notes: data.notes?.trim() || null,
      status: AppointmentStatus.SCHEDULED,
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      treatmentType: {
        select: {
          name: true,
          color: true,
        },
      },
      staffMember: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      chair: {
        select: {
          name: true,
        },
      },
    },
  })

  revalidatePath('/agenda')
  return appointment
}

// Actualizar cita (reprogramar o cambiar detalles)
export async function updateAppointment(
  id: string,
  data: {
    start?: string
    duration?: number
    patientId?: string
    treatmentTypeId?: string
    staffMemberId?: string
    chairId?: string
    notes?: string
  }
) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
  ])

  const existing = await prisma.appointment.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Cita no encontrada')
  }

  const start = data.start ? new Date(data.start) : existing.start
  const duration = data.duration || Math.round((existing.end.getTime() - existing.start.getTime()) / 60000)
  const end = new Date(start.getTime() + duration * 60000)

  const chairId = data.chairId !== undefined ? data.chairId : existing.chairId
  const staffMemberId = data.staffMemberId !== undefined ? data.staffMemberId : existing.staffMemberId

  // Validar solapamiento en sillón (excluyendo esta misma cita)
  if (chairId) {
    const overlappingChairAppointment = await prisma.appointment.findFirst({
      where: {
        clinicId,
        id: { not: id },
        chairId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
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
      },
    })

    if (overlappingChairAppointment) {
      throw new Error('El sillón ya está ocupado en ese horario')
    }
  }

  // Validar solapamiento en profesional (excluyendo esta misma cita)
  if (staffMemberId) {
    const overlappingStaffAppointment = await prisma.appointment.findFirst({
      where: {
        clinicId,
        id: { not: id },
        staffMemberId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
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
      },
    })

    if (overlappingStaffAppointment) {
      throw new Error('El profesional ya tiene una cita en ese horario')
    }
  }

  const updateData: Record<string, unknown> = {
    start,
    end,
  }

  if (data.patientId !== undefined) updateData.patientId = data.patientId
  if (data.treatmentTypeId !== undefined) updateData.treatmentTypeId = data.treatmentTypeId || null
  if (data.staffMemberId !== undefined) updateData.staffMemberId = data.staffMemberId || null
  if (data.chairId !== undefined) updateData.chairId = data.chairId || null
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null

  const appointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      treatmentType: {
        select: {
          name: true,
          color: true,
        },
      },
      staffMember: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      chair: {
        select: {
          name: true,
        },
      },
    },
  })

  revalidatePath('/agenda')
  return appointment
}

// Cambiar estado de cita
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancelReason?: string
) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  const existing = await prisma.appointment.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Cita no encontrada')
  }

  const updateData: Record<string, unknown> = { status }

  if (status === AppointmentStatus.CANCELLED) {
    updateData.cancelledAt = new Date()
    if (cancelReason) {
      updateData.cancelReason = cancelReason.trim()
    }
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/agenda')
  return appointment
}

// Eliminar cita
export async function deleteAppointment(id: string) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
  ])

  const existing = await prisma.appointment.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Cita no encontrada')
  }

  await prisma.appointment.delete({
    where: { id },
  })

  revalidatePath('/agenda')
}

// Obtener datos para formulario de cita (pacientes y tratamientos)
export async function getAppointmentFormData() {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  const [patients, treatmentTypes] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.treatmentType.findMany({
      where: { clinicId, isActive: true },
      select: {
        id: true,
        name: true,
        defaultDuration: true,
        color: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return { patients, treatmentTypes }
}
