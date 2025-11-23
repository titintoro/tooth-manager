import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

/**
 * Obtener la sesión del usuario en server components
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Obtener la sesión con verificación de autenticación
 * Redirige a /login si no hay sesión
 */
export async function getRequiredSession() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect('/login')
  }
  
  return session
}

/**
 * Obtener la sesión con verificación de clínica actual
 * Redirige si no hay sesión o no tiene clínica asignada
 */
export async function getClinicSession() {
  const session = await getRequiredSession()
  
  if (!session.user.currentClinicId) {
    // Usuario sin clínicas asignadas - redirigir a onboarding o error
    redirect('/onboarding')
  }
  
  return {
    session,
    userId: session.user.id,
    clinicId: session.user.currentClinicId,
    role: session.user.role!,
    user: session.user,
  }
}

/**
 * Verificar si el usuario tiene un rol específico en su clínica actual
 */
export async function hasRole(requiredRoles: readonly UserRole[] | UserRole[]) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.role) {
    return false
  }
  
  return requiredRoles.includes(session.user.role)
}

/**
 * Obtener la sesión con verificación de roles
 * Redirige a /unauthorized si no tiene el rol requerido
 */
export async function getAuthorizedSession(requiredRoles: readonly UserRole[] | UserRole[]) {
  const clinicSession = await getClinicSession()
  
  if (!requiredRoles.includes(clinicSession.role)) {
    redirect('/unauthorized')
  }
  
  return clinicSession
}

/**
 * Verificar si el usuario es OWNER o ADMIN de la clínica actual
 */
export async function isOwnerOrAdmin() {
  return await hasRole([UserRole.OWNER, UserRole.ADMIN])
}

/**
 * Obtener información completa de la clínica actual del usuario
 */
export async function getCurrentClinic() {
  const { clinicId } = await getClinicSession()
  
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      subscription: true,
    },
  })
  
  if (!clinic) {
    redirect('/onboarding')
  }
  
  return clinic
}

/**
 * Obtener todas las clínicas del usuario con sus roles
 */
export async function getUserClinics() {
  const session = await getRequiredSession()
  
  const memberships = await prisma.userClinicMembership.findMany({
    where: {
      userId: session.user.id,
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
      joinedAt: 'asc',
    },
  })
  
  return memberships
}

/**
 * Cambiar la clínica actual del usuario
 * Esto actualiza el token JWT
 */
export async function switchClinic(clinicId: string) {
  const session = await getRequiredSession()
  
  // Verificar que el usuario tiene acceso a esta clínica
  const membership = await prisma.userClinicMembership.findUnique({
    where: {
      userId_clinicId: {
        userId: session.user.id,
        clinicId,
      },
    },
  })
  
  if (!membership || !membership.isActive) {
    throw new Error('No tienes acceso a esta clínica')
  }
  
  // El cambio se manejará mediante update() en el cliente
  return {
    clinicId,
    role: membership.role,
  }
}

/**
 * Tipos de permisos por rol
 */
export const PERMISSIONS = {
  // Solo OWNER
  MANAGE_BILLING: [UserRole.OWNER],
  DELETE_CLINIC: [UserRole.OWNER],
  MANAGE_MEMBERS: [UserRole.OWNER],
  
  // OWNER y ADMIN
  MANAGE_SETTINGS: [UserRole.OWNER, UserRole.ADMIN],
  MANAGE_STAFF: [UserRole.OWNER, UserRole.ADMIN],
  MANAGE_RESOURCES: [UserRole.OWNER, UserRole.ADMIN],
  VIEW_REPORTS: [UserRole.OWNER, UserRole.ADMIN],
  
  // OWNER, ADMIN y DOCTOR
  MANAGE_APPOINTMENTS: [UserRole.OWNER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST],
  VIEW_PATIENTS: [UserRole.OWNER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST],
  MANAGE_PATIENTS: [UserRole.OWNER, UserRole.ADMIN, UserRole.RECEPTIONIST],
  
  // Todos
  VIEW_OWN_SCHEDULE: [UserRole.OWNER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST],
} as const

/**
 * Verificar si el usuario tiene un permiso específico
 */
export async function hasPermission(permission: keyof typeof PERMISSIONS) {
  const allowedRoles = PERMISSIONS[permission]
  return await hasRole(allowedRoles)
}