/**
 * Helper para verificar estado de suscripción de clínica
 */

import { prisma } from '@/lib/prisma'

export async function checkSubscriptionStatus(clinicId: string): Promise<{
  hasActiveSubscription: boolean
  status: string | null
  requiresPayment: boolean
}> {
  const subscription = await prisma.clinicSubscription.findUnique({
    where: { clinicId },
  })

  if (!subscription) {
    return {
      hasActiveSubscription: false,
      status: null,
      requiresPayment: true,
    }
  }

  const activeStatuses = ['ACTIVE', 'TRIALING']
  const hasActiveSubscription = activeStatuses.includes(subscription.status)

  return {
    hasActiveSubscription,
    status: subscription.status,
    requiresPayment: !hasActiveSubscription,
  }
}

export async function requireActiveSubscription(clinicId: string): Promise<boolean> {
  const { hasActiveSubscription } = await checkSubscriptionStatus(clinicId)
  return hasActiveSubscription
}
