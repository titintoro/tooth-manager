'use server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Listar tipos de tratamiento de la clínica
export async function getTreatmentTypes() {
  const { clinicId } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
  ])

  const treatments = await prisma.treatmentType.findMany({
    where: { clinicId },
    include: {
      _count: {
        select: {
          appointments: true,
        },
      },
    },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })

  return treatments
}

// Crear tipo de tratamiento
export async function createTreatmentType(data: {
  name: string
  description?: string
  code?: string
  defaultDuration: number
  estimatedPrice?: string
  color?: string
}) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  if (!data.name || data.name.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }

  if (data.defaultDuration <= 0) {
    throw new Error('La duración debe ser mayor a 0 minutos')
  }

  const treatment = await prisma.treatmentType.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      code: data.code?.trim() || null,
      defaultDuration: data.defaultDuration,
      estimatedPrice: data.estimatedPrice ? parseFloat(data.estimatedPrice) : null,
      color: data.color || null,
      clinicId,
      isActive: true,
    },
  })

  revalidatePath('/tratamientos')
  return treatment
}

// Actualizar tipo de tratamiento
export async function updateTreatmentType(
  id: string,
  data: {
    name: string
    description?: string
    code?: string
    defaultDuration: number
    estimatedPrice?: string
    color?: string
    isActive: boolean
  }
) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  const existing = await prisma.treatmentType.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Tratamiento no encontrado')
  }

  if (!data.name || data.name.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }

  if (data.defaultDuration <= 0) {
    throw new Error('La duración debe ser mayor a 0 minutos')
  }

  const treatment = await prisma.treatmentType.update({
    where: { id },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      code: data.code?.trim() || null,
      defaultDuration: data.defaultDuration,
      estimatedPrice: data.estimatedPrice ? parseFloat(data.estimatedPrice) : null,
      color: data.color || null,
      isActive: data.isActive,
    },
  })

  revalidatePath('/tratamientos')
  return treatment
}

// Eliminar tipo de tratamiento
export async function deleteTreatmentType(id: string) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  const existing = await prisma.treatmentType.findFirst({
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
    throw new Error('Tratamiento no encontrado')
  }

  if (existing._count.appointments > 0) {
    throw new Error(
      'No se puede eliminar un tratamiento con citas registradas. Márcalo como inactivo en su lugar.'
    )
  }

  await prisma.treatmentType.delete({
    where: { id },
  })

  revalidatePath('/tratamientos')
}
