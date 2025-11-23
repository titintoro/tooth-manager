'use server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Listar sillones de la clínica
export async function getChairs() {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  const chairs = await prisma.chair.findMany({
    where: { clinicId },
    orderBy: {
      name: 'asc',
    },
  })

  return chairs
}

// Crear sillón
export async function createChair(data: {
  name: string
  location?: string
}) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  if (!data.name || data.name.trim().length < 1) {
    throw new Error('El nombre es requerido')
  }

  const chair = await prisma.chair.create({
    data: {
      name: data.name.trim(),
      location: data.location?.trim() || null,
      clinicId,
      isActive: true,
    },
  })

  revalidatePath('/configuracion/sillones')
  return chair
}

// Actualizar sillón
export async function updateChair(
  id: string,
  data: {
    name: string
    location?: string
    isActive: boolean
  }
) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  // Verificar que el sillón pertenece a la clínica
  const existing = await prisma.chair.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Sillón no encontrado')
  }

  if (!data.name || data.name.trim().length < 1) {
    throw new Error('El nombre es requerido')
  }

  const chair = await prisma.chair.update({
    where: { id },
    data: {
      name: data.name.trim(),
      location: data.location?.trim() || null,
      isActive: data.isActive,
    },
  })

  revalidatePath('/configuracion/sillones')
  return chair
}

// Eliminar sillón
export async function deleteChair(id: string) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  // Verificar que el sillón pertenece a la clínica
  const existing = await prisma.chair.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Sillón no encontrado')
  }

  await prisma.chair.delete({
    where: { id },
  })

  revalidatePath('/configuracion/sillones')
}
