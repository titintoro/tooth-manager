import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, Plus } from 'lucide-react'

export default function TratamientosPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tratamientos</h2>
          <p className="text-muted-foreground mt-2">
            Gestiona los tipos de tratamientos de tu clínica
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo tratamiento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Stethoscope className="h-8 w-8 text-primary" />
              <Badge>Activo</Badge>
            </div>
            <CardTitle className="mt-4">Limpieza Dental</CardTitle>
            <CardDescription>
              Duración: 30 min • €50
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Limpieza profunda y revisión general
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Stethoscope className="h-8 w-8 text-primary" />
              <Badge>Activo</Badge>
            </div>
            <CardTitle className="mt-4">Empaste</CardTitle>
            <CardDescription>
              Duración: 45 min • €80
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Restauración de caries con composite
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center">
              <Button variant="ghost" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Agregar tratamiento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de tratamientos</CardTitle>
          <CardDescription>
            Resumen de tratamientos realizados este mes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Sin datos de tratamientos este mes
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
