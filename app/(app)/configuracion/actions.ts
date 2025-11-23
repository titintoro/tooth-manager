'use server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Actualizar información de la clínica
export async function updateClinicInfo(data: {
  name: string
  address?: string
  email?: string
  phone?: string
}) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  // Validaciones básicas
  if (!data.name || data.name.trim().length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres')
  }

  if (data.email && !data.email.includes('@')) {
    throw new Error('Email inválido')
  }

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      name: data.name.trim(),
      address: data.address?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    },
  })

  revalidatePath('/configuracion')
  return clinic
}

// Obtener información de la clínica
export async function getClinicInfo() {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      address: true,
      email: true,
      phone: true,
      slug: true,
      createdAt: true,
    },
  })

  if (!clinic) {
    throw new Error('Clínica no encontrada')
  }

  return clinic
}
