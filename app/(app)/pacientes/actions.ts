'use server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Listar pacientes de la clínica con búsqueda opcional
export async function getPatients(searchQuery?: string) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  const whereClause = searchQuery
    ? {
        clinicId,
        OR: [
          { firstName: { contains: searchQuery, mode: 'insensitive' as const } },
          { lastName: { contains: searchQuery, mode: 'insensitive' as const } },
          { email: { contains: searchQuery, mode: 'insensitive' as const } },
          { phone: { contains: searchQuery, mode: 'insensitive' as const } },
        ],
      }
    : { clinicId }

  const patients = await prisma.patient.findMany({
    where: whereClause,
    include: {
      appointments: {
        orderBy: { start: 'desc' },
        take: 1,
        select: {
          start: true,
        },
      },
      _count: {
        select: {
          appointments: true,
        },
      },
    },
    orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }, { firstName: 'asc' }],
  })

  return patients.map((patient) => ({
    ...patient,
    lastAppointmentDate: patient.appointments[0]?.start || null,
  }))
}

// Obtener un paciente por ID con sus citas
export async function getPatientById(patientId: string) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: {
      appointments: {
        include: {
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
        },
        orderBy: { start: 'desc' },
      },
    },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado')
  }

  return patient
}

// Crear paciente
export async function createPatient(data: {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  city?: string
  notes?: string
}) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
  ])

  if (!data.firstName || data.firstName.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    throw new Error('El apellido debe tener al menos 2 caracteres')
  }

  if (data.email && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Email inválido')
  }

  const patient = await prisma.patient.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      notes: data.notes?.trim() || null,
      clinicId,
      isActive: true,
    },
  })

  revalidatePath('/pacientes')
  return patient
}

// Actualizar paciente
export async function updatePatient(
  id: string,
  data: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    dateOfBirth?: string
    address?: string
    city?: string
    notes?: string
    isActive: boolean
  }
) {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
  ])

  const existing = await prisma.patient.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Paciente no encontrado')
  }

  if (!data.firstName || data.firstName.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    throw new Error('El apellido debe tener al menos 2 caracteres')
  }

  if (data.email && !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Email inválido')
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      notes: data.notes?.trim() || null,
      isActive: data.isActive,
    },
  })

  revalidatePath('/pacientes')
  revalidatePath(`/pacientes/${id}`)
  return patient
}

// Eliminar paciente
export async function deletePatient(id: string) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  const existing = await prisma.patient.findFirst({
    where: { id, clinicId },
    include: {
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  })

  if (!existing) {
    throw new Error('Paciente no encontrado')
  }

  if (existing._count.appointments > 0) {
    throw new Error(
      'No se puede eliminar un paciente con citas registradas. Márcalo como inactivo en su lugar.'
    )
  }

  await prisma.patient.delete({
    where: { id },
  })

  revalidatePath('/pacientes')
}
