'use server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Listar staff de la clínica
export async function getStaffMembers() {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  const staff = await prisma.staffMember.findMany({
    where: { clinicId },
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

  return staff
}

// Crear staff member
export async function createStaffMember(data: {
  firstName: string
  lastName: string
  profession: string
  email?: string
  phone?: string
}) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  if (!data.firstName || data.firstName.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    throw new Error('El apellido debe tener al menos 2 caracteres')
  }

  const staff = await prisma.staffMember.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      profession: data.profession?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      clinicId,
      isActive: true,
      canBookAppointments: true,
    },
  })

  revalidatePath('/configuracion/staff')
  return staff
}

// Actualizar staff member
export async function updateStaffMember(
  id: string,
  data: {
    firstName: string
    lastName: string
    profession: string
    email?: string
    phone?: string
    isActive: boolean
  }
) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  // Verificar que el staff pertenece a la clínica
  const existing = await prisma.staffMember.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Staff no encontrado')
  }

  if (!data.firstName || data.firstName.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    throw new Error('El apellido debe tener al menos 2 caracteres')
  }

  const staff = await prisma.staffMember.update({
    where: { id },
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      profession: data.profession?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      isActive: data.isActive,
    },
  })

  revalidatePath('/configuracion/staff')
  return staff
}

// Eliminar staff member
export async function deleteStaffMember(id: string) {
  const { clinicId } = await getAuthorizedSession([UserRole.OWNER, UserRole.ADMIN])

  // Verificar que el staff pertenece a la clínica
  const existing = await prisma.staffMember.findFirst({
    where: { id, clinicId },
  })

  if (!existing) {
    throw new Error('Staff no encontrado')
  }

  await prisma.staffMember.delete({
    where: { id },
  })

  revalidatePath('/configuracion/staff')
}
