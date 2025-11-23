import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getClinicInfo } from '../actions'
import { ClinicForm } from './clinic-form'
import { Building2 } from 'lucide-react'

export default async function ClinicSettingsPage() {
  const clinic = await getClinicInfo()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Información de la clínica</h2>
        <p className="text-muted-foreground mt-2">
          Gestiona los datos básicos de tu clínica
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Datos de la clínica</CardTitle>
          </div>
          <CardDescription>
            Esta información se muestra en reportes y comunicaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicForm clinic={clinic} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información adicional</CardTitle>
          <CardDescription>
            Detalles de tu clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Identificador único (Slug)</dt>
              <dd className="text-sm mt-1">{clinic.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Fecha de creación</dt>
              <dd className="text-sm mt-1">
                {new Date(clinic.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
