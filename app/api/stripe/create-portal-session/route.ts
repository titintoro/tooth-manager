/**
 * API Route para crear sesión del portal de cliente de Stripe
 * POST /api/stripe/create-portal-session
 */

import { NextResponse } from 'next/server'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { clinicId } = await getAuthorizedSession([UserRole.OWNER])

    // Obtener el customer ID de Stripe
    const subscription = await prisma.clinicSubscription.findUnique({
      where: { clinicId },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No hay suscripción activa' },
        { status: 404 }
      )
    }

    // Crear sesión del portal
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creando portal session:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión del portal' },
      { status: 500 }
    )
  }
}
