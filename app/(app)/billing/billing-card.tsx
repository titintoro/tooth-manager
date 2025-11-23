'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'

interface BillingCardProps {
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    cancelAt: Date | null
    trialEndsAt: Date | null
  } | null
}

const STATUS_CONFIG = {
  TRIALING: {
    label: 'Período de prueba',
    color: 'bg-blue-100 text-blue-800',
    icon: AlertTriangle,
  },
  ACTIVE: {
    label: 'Activa',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  PAST_DUE: {
    label: 'Pago atrasado',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertTriangle,
  },
  CANCELED: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
  UNPAID: {
    label: 'Sin pagar',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
  INCOMPLETE: {
    label: 'Incompleta',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertTriangle,
  },
  INCOMPLETE_EXPIRED: {
    label: 'Expirada',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
}

const PLAN_CONFIG = {
  BASIC: {
    name: 'Plan Básico',
    price: '$999 MXN',
    features: [
      'Agenda ilimitada',
      'Gestión de pacientes',
      'Lista de espera inteligente',
      'Recordatorios automáticos',
      'Dashboard con KPIs',
      'Hasta 5 profesionales',
      'Soporte por email',
    ],
  },
  STANDARD: {
    name: 'Plan Estándar',
    price: '$1,999 MXN',
    features: [
      'Todo del Plan Básico',
      'Hasta 10 profesionales',
      'Reportes avanzados',
      'Historial clínico digital',
      'Integración con laboratorios',
      'Soporte prioritario',
      'Capacitación incluida',
    ],
  },
  PREMIUM: {
    name: 'Plan Premium',
    price: '$3,999 MXN',
    features: [
      'Todo del Plan Estándar',
      'Profesionales ilimitados',
      'Múltiples sucursales',
      'API personalizada',
      'Soporte 24/7',
      'Gestor de cuenta dedicado',
      'Personalización avanzada',
    ],
  },
}

export function BillingCard({ subscription }: BillingCardProps) {
  const [loading, setLoading] = useState(false)

  const hasActiveSubscription = subscription && 
    ['ACTIVE', 'TRIALING'].includes(subscription.status)

  // Determinar qué plan mostrar basado en la suscripción actual
  const currentPlan = subscription?.plan || 'BASIC'
  const planConfig = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.BASIC

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No se recibió URL de checkout')
      }
    } catch (error) {
      console.error('Error al crear checkout:', error)
      alert('Error al iniciar el proceso de suscripción')
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No se recibió URL del portal')
      }
    } catch (error) {
      console.error('Error al abrir portal:', error)
      alert('Error al abrir el portal de gestión')
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Estado de la suscripción */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de la Suscripción</CardTitle>
          <CardDescription>
            Información sobre tu plan actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge className={STATUS_CONFIG[subscription.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-800'}>
                  {STATUS_CONFIG[subscription.status as keyof typeof STATUS_CONFIG]?.label || subscription.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plan:</span>
                <span className="text-sm">
                  {PLAN_CONFIG[subscription.plan as keyof typeof PLAN_CONFIG]?.name || subscription.plan}
                </span>
              </div>

              {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Período actual:</span>
                  </div>
                  <div className="text-sm ml-6">
                    {format(subscription.currentPeriodStart, 'PPP', { locale: es })} -{' '}
                    {format(subscription.currentPeriodEnd, 'PPP', { locale: es })}
                  </div>
                </div>
              )}

              {subscription.trialEndsAt && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-md text-sm">
                  <strong>Período de prueba:</strong> Termina el{' '}
                  {format(subscription.trialEndsAt, 'PPP', { locale: es })}
                </div>
              )}

              {subscription.cancelAt && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 rounded-md text-sm">
                  <strong>Renovación cancelada:</strong> El servicio termina el{' '}
                  {format(subscription.cancelAt, 'PPP', { locale: es })}
                </div>
              )}

              <Button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gestionar Suscripción
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No tienes una suscripción activa</p>
                <p className="text-sm mt-1">
                  Activa tu suscripción para acceder a todas las funcionalidades
                </p>
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Activar Suscripción
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles del plan */}
      <Card>
        <CardHeader>
          <CardTitle>{planConfig.name}</CardTitle>
          <CardDescription>
            Todo lo que necesitas para gestionar tu clínica dental
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="text-3xl font-bold">{planConfig.price}</div>
            <div className="text-sm text-muted-foreground">por mes</div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Incluye:</p>
            <ul className="space-y-2">
              {planConfig.features.map((feature, index) => (
                <li key={`${currentPlan}-feature-${index}`} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {!hasActiveSubscription && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Al suscribirte aceptas nuestros términos y condiciones. 
                Puedes cancelar en cualquier momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
