/**
 * Cliente de Stripe para pagos y suscripciones
 * Configurado con keys de entorno
 */

import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no está definida en las variables de entorno')
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  }

  return stripeInstance
}

// Export para compatibilidad
export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const stripeClient = getStripe()
    return stripeClient[prop as keyof Stripe]
  },
})

// ID del precio/plan básico (se configura en Stripe Dashboard)
export const STRIPE_BASIC_PLAN_PRICE_ID = process.env.STRIPE_BASIC_PLAN_PRICE_ID || ''

// URLs de éxito y cancelación
export const getSuccessUrl = (clinicId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/billing?success=true&clinic_id=${clinicId}`
}

export const getCancelUrl = (clinicId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/billing?canceled=true&clinic_id=${clinicId}`
}
