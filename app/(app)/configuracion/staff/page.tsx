import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getStaffMembers } from './actions'
import { StaffTable } from './staff-table'
import { CreateStaffDialog } from './create-staff-dialog'
import { Users } from 'lucide-react'

export default async function StaffSettingsPage() {
  const staff = await getStaffMembers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Personal de la clínica</h2>
          <p className="text-muted-foreground mt-2">
            Gestiona los miembros del equipo
          </p>
        </div>
        <CreateStaffDialog />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Lista de personal</CardTitle>
          </div>
          <CardDescription>
            {staff.length} {staff.length === 1 ? 'miembro' : 'miembros'} registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length > 0 ? (
            <StaffTable staff={staff} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No hay personal registrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
