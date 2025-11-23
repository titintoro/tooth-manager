import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Building2, Users as UsersIcon, Bell, CreditCard } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground mt-2">
          Administra la configuración de tu clínica
        </p>
      </div>

      <div className="grid gap-6">
        {/* Información de la clínica */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Información de la clínica</CardTitle>
            </div>
            <CardDescription>
              Datos básicos y configuración general
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="clinic-name" className="block text-sm font-medium mb-2">
                Nombre de la clínica
              </label>
              <Input id="clinic-name" placeholder="Mi Clínica Dental" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Teléfono
                </label>
                <Input id="phone" placeholder="+34 900 000 000" />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input id="email" type="email" placeholder="info@clinica.com" />
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2">
                Dirección
              </label>
              <Input id="address" placeholder="Calle Principal 123" />
            </div>
            
            <Button>Guardar cambios</Button>
          </CardContent>
        </Card>

        {/* Miembros del equipo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              <CardTitle>Miembros del equipo</CardTitle>
            </div>
            <CardDescription>
              Gestiona los usuarios con acceso a la clínica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">demo@toothmanager.com</p>
                  <p className="text-sm text-muted-foreground">Propietario</p>
                </div>
                <Button variant="outline" size="sm">Gestionar</Button>
              </div>
              
              <Separator />
              
              <Button variant="outline" className="w-full">
                Invitar miembro
              </Button>
            </div>
          </CardContent>
        </Card>

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
              
              <Button variant="outline" className="w-full">
                Ver planes y precios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
