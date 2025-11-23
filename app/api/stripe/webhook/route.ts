/**
 * Webhook de Stripe para manejar eventos de suscripciones
 * POST /api/stripe/webhook
 * 
 * Eventos manejados:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clinicId = session.metadata?.clinicId

  if (!clinicId) {
    console.error('No clinicId in session metadata')
    return
  }

  console.log(`Checkout completed for clinic ${clinicId}`)

  // Obtener la suscripción
  const subscriptionId = session.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await updateClinicSubscription(clinicId, subscription)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const clinicId = subscription.metadata?.clinicId

  if (!clinicId) {
    console.error('No clinicId in subscription metadata')
    return
  }

  console.log(`Subscription updated for clinic ${clinicId}`)
  await updateClinicSubscription(clinicId, subscription)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clinicId = subscription.metadata?.clinicId

  if (!clinicId) {
    console.error('No clinicId in subscription metadata')
    return
  }

  console.log(`Subscription deleted for clinic ${clinicId}`)

  await prisma.clinicSubscription.update({
    where: { clinicId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  })
}

async function updateClinicSubscription(
  clinicId: string,
  subscription: Stripe.Subscription
) {
  const status = mapStripeStatus(subscription.status)
  const priceId = subscription.items.data[0]?.price.id
  
  // Stripe API devuelve campos con snake_case
  interface StripeSubscriptionWithSnakeCase extends Stripe.Subscription {
    current_period_start: number
    current_period_end: number
    cancel_at: number | null
    canceled_at: number | null
  }
  
  const subWithSnakeCase = subscription as unknown as StripeSubscriptionWithSnakeCase

  await prisma.clinicSubscription.upsert({
    where: { clinicId },
    create: {
      clinicId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: 'BASIC',
      status,
      currentPeriodStart: new Date(subWithSnakeCase.current_period_start * 1000),
      currentPeriodEnd: new Date(subWithSnakeCase.current_period_end * 1000),
      cancelAt: subWithSnakeCase.cancel_at ? new Date(subWithSnakeCase.cancel_at * 1000) : null,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status,
      currentPeriodStart: new Date(subWithSnakeCase.current_period_start * 1000),
      currentPeriodEnd: new Date(subWithSnakeCase.current_period_end * 1000),
      cancelAt: subWithSnakeCase.cancel_at ? new Date(subWithSnakeCase.cancel_at * 1000) : null,
      canceledAt: subWithSnakeCase.canceled_at ? new Date(subWithSnakeCase.canceled_at * 1000) : null,
    },
  })
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' {
  const statusMap: Record<Stripe.Subscription.Status, 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED'> = {
    trialing: 'TRIALING',
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    paused: 'CANCELED', // No tenemos estado paused, mapeamos a canceled
  }

  return statusMap[stripeStatus] || 'INCOMPLETE'
}
