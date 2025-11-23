import { getAuthorizedSession } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { BillingCard } from './billing-card'
import { redirect } from 'next/navigation'

interface BillingPageProps {
  searchParams: {
    success?: string
    canceled?: string
  }
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const { clinicId, role } = await getAuthorizedSession([
    UserRole.OWNER,
    UserRole.ADMIN,
  ])

  // Solo OWNER puede gestionar billing
  if (role !== UserRole.OWNER) {
    redirect('/dashboard')
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      subscription: true,
    },
  })

  if (!clinic) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Facturación y Suscripción</h2>
        <p className="text-muted-foreground mt-2">
          Gestiona tu suscripción y métodos de pago
        </p>
      </div>

      {searchParams.success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="font-medium">¡Suscripción activada exitosamente!</p>
          <p className="text-sm mt-1">
            Ya puedes disfrutar de todas las funcionalidades de Tooth Manager.
          </p>
        </div>
      )}

      {searchParams.canceled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Proceso de pago cancelado</p>
          <p className="text-sm mt-1">
            No se realizó ningún cargo. Puedes intentarlo nuevamente cuando quieras.
          </p>
        </div>
      )}

      <BillingCard subscription={clinic.subscription} />
    </div>
  )
}
