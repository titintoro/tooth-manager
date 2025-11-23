/**
 * API Route para crear sesión de checkout de Stripe
 * POST /api/stripe/create-checkout-session
 */

import { NextResponse } from 'next/server'
import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { stripe, STRIPE_BASIC_PLAN_PRICE_ID, getSuccessUrl, getCancelUrl } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { clinicId, userId } = await getAuthorizedSession([UserRole.OWNER])

    // Verificar que el plan price ID esté configurado
    if (!STRIPE_BASIC_PLAN_PRICE_ID) {
      return NextResponse.json(
        { error: 'Plan de suscripción no configurado' },
        { status: 500 }
      )
    }

    // Obtener o crear customer en Stripe
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        subscription: true,
      },
    })

    if (!clinic) {
      return NextResponse.json(
        { error: 'Clínica no encontrada' },
        { status: 404 }
      )
    }

    let customerId = clinic.subscription?.stripeCustomerId

    // Crear customer si no existe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: clinic.email || undefined,
        metadata: {
          clinicId: clinic.id,
          clinicName: clinic.name,
        },
      })
      customerId = customer.id

      // Guardar o actualizar el customer ID
      await prisma.clinicSubscription.upsert({
        where: { clinicId },
        create: {
          clinicId,
          stripeCustomerId: customerId,
          plan: 'BASIC',
          status: 'INCOMPLETE',
        },
        update: {
          stripeCustomerId: customerId,
        },
      })
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_BASIC_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: getSuccessUrl(clinicId),
      cancel_url: getCancelUrl(clinicId),
      metadata: {
        clinicId,
        userId,
      },
      subscription_data: {
        metadata: {
          clinicId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creando checkout session:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
