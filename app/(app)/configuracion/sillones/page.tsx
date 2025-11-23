import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getChairs } from './actions'
import { ChairsTable } from './chairs-table'
import { CreateChairDialog } from './create-chair-dialog'
import { Armchair } from 'lucide-react'

export default async function ChairsSettingsPage() {
  const chairs = await getChairs()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sillones</h2>
          <p className="text-muted-foreground mt-2">
            Gestiona los sillones dentales de tu clínica
          </p>
        </div>
        <CreateChairDialog />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Armchair className="h-5 w-5" />
            <CardTitle>Lista de sillones</CardTitle>
          </div>
          <CardDescription>
            {chairs.length} {chairs.length === 1 ? 'sillón' : 'sillones'} {chairs.length === 1 ? 'registrado' : 'registrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chairs.length > 0 ? (
            <ChairsTable chairs={chairs} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Armchair className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No hay sillones registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
