import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'

export default function AgendaPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
          <p className="text-muted-foreground mt-2">
            Gestiona las citas de tu clínica
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva cita
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vista de agenda</CardTitle>
              <CardDescription>
                Selecciona un día para ver las citas programadas
              </CardDescription>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No hay citas programadas</p>
            <p className="text-sm">Comienza agregando tu primera cita</p>
            <Button className="mt-4" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Agregar cita
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
