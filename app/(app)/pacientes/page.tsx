import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Search } from 'lucide-react'

export default function PacientesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground mt-2">
            Gestiona tu base de datos de pacientes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de pacientes</CardTitle>
          <CardDescription>
            Busca y gestiona información de tus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filtros</Button>
          </div>

          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No hay pacientes registrados</p>
            <p className="text-sm">Comienza agregando tu primer paciente</p>
            <Button className="mt-4" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Agregar paciente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
