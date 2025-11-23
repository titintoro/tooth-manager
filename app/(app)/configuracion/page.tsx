import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Building2, Users as UsersIcon, Bell, CreditCard, Armchair, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground mt-2">
          Administra la configuración de tu clínica
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Información de la clínica */}
        <Link href="/configuracion/clinica">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Building2 className="h-8 w-8 text-primary" />
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle>Información de la clínica</CardTitle>
              <CardDescription>
                Datos básicos y configuración general
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Personal */}
        <Link href="/configuracion/staff">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <UsersIcon className="h-8 w-8 text-primary" />
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle>Personal</CardTitle>
              <CardDescription>
                Gestiona los miembros del equipo
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Sillones */}
        <Link href="/configuracion/sillones">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Armchair className="h-8 w-8 text-primary" />
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle>Sillones</CardTitle>
              <CardDescription>
                Gestiona los sillones dentales
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificaciones</CardTitle>
          </div>
          <CardDescription>
            Configura cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Recordatorios de citas</p>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones antes de cada cita
                </p>
              </div>
              <Button variant="outline" size="sm">Configurar</Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Lista de espera</p>
                <p className="text-sm text-muted-foreground">
                  Notificaciones de disponibilidad
                </p>
              </div>
              <Button variant="outline" size="sm">Configurar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suscripción */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Suscripción y facturación</CardTitle>
          </div>
          <CardDescription>
            Gestiona tu plan y método de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Plan Prueba</p>
                <span className="text-sm text-muted-foreground">Gratis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                30 días restantes de prueba gratuita
              </p>
            </div>
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/precios">Ver planes y precios</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
